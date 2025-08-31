/// Module: roles
/// Handles role-based access control for supply chain participants with community-driven approvals and reputation weighting.
module truepath::roles;

use std::debug;
use std::option;
use std::string::{Self, String};
use std::vector;
use sui::coin::{Self, Coin};
use sui::event;
use sui::object::{Self as obj, UID};
use sui::pay;
use sui::sui::SUI;
use sui::table::{Self, Table};
use sui::transfer;
use sui::tx_context::{Self as tx, TxContext};

// Constants
const MIN_VOTE_WEIGHT: u64 = 5; // Minimum total trust score weight for endorsements
const REGISTRATION_FEE: u64 = 1000000000; // 1 SUI in MIST

// Error codes (adding descriptive constants as recommended previously)
const E_FORBIDDEN: u64 = 403; // Operation not allowed (insufficient permissions)
const E_USER_NOT_FOUND: u64 = 404; // Specified user does not exist
const E_ROLE_MISMATCH: u64 = 406; // Role type does not match expected
const E_INSUFFICIENT_PAYMENT: u64 = 408; // Payment amount is too low
const E_INVALID_ROLE_TYPE: u64 = 409; // Invalid or unsupported role type
const E_USER_ALREADY_REGISTERED: u64 = 410; // User already exists for this address
const E_ALREADY_VOTED: u64 = 415; // Voter has already endorsed this user
const E_NOT_A_USER: u64 = 416; // Caller is not a registered user
const E_NO_VOTING_POWER: u64 = 417; // Voter has no trust score/voting weight
// const E_ALREADY_APPROVED: u64 = 418; // User is already approved (uncomment if needed)
const E_VOTER_NOT_APPROVED: u64 = 419; // Voter is not approved to vote

public struct Role has copy, drop, store {
    role_type: String,
    permissions: vector<String>,
    name: String,
}

public struct User has key, store {
    id: UID,
    name: String,
    endorsers: vector<address>,
    owner: address,
    issued_at: u64,
    role: Role,
    trust_score: u64,
    approved: bool,
    total_vote_weight: u64,
}

public struct ParticipantRegistry has key {
    id: UID,
    participants: vector<address>,
    users: Table<address, User>,
}

public struct RoleGranted has copy, drop, store {
    user: address,
    role_type: String,
    granted_by: address,
    endorsers: vector<address>,
    time: u64,
}

public struct RoleRevoked has copy, drop, store {
    user: address,
    role_type: String,
    revoked_by: address,
    time: u64,
}

public struct TrustScoreUpdated has copy, drop, store {
    user: address,
    new_score: u64,
    updated_by: address,
    time: u64,
}

public struct VoteCast has copy, drop, store {
    voter: address,
    target: address,
    weight: u64,
    time: u64,
}

public struct VoteRemoved has copy, drop, store {
    voter: address,
    target: address,
    weight: u64,
    time: u64,
}

public fun init_for_test(ctx: &mut TxContext) {
    let registry = ParticipantRegistry {
        id: obj::new(ctx),
        participants: vector::empty(),
        users: table::new(ctx),
    };

    transfer::share_object(registry);
}

fun init(ctx: &mut TxContext) {
    let registry = ParticipantRegistry {
        id: obj::new(ctx),
        participants: vector::empty(),
        users: table::new(ctx),
    };

    transfer::share_object(registry);
}

fun add_user_to_registry(registry: &mut ParticipantRegistry, user: User) {
    let owner_addr = user.owner;
    table::add(&mut registry.users, owner_addr, user);
    vector::push_back(&mut registry.participants, owner_addr);
}

public fun get_trust_score(registry: &ParticipantRegistry, userAddress: address): u64 {
    if (table::contains(&registry.users, userAddress)) {
        let user = table::borrow(&registry.users, userAddress);
        user.trust_score
    } else {
        0
    }
}

public fun register_manufacturer(
    registry: &mut ParticipantRegistry,
    name: String,
    description: String,
    payment: Coin<SUI>,
    ctx: &mut TxContext,
) {
    let participant = tx::sender(ctx);

    assert!(!table::contains(&registry.users, participant), E_USER_ALREADY_REGISTERED);

    let role_type = string::utf8(b"MANUFACTURER");

    assert!(coin::value(&payment) >= REGISTRATION_FEE, E_INSUFFICIENT_PAYMENT);

    transfer::public_transfer(
        payment,
        @0x52548b2f3560dc3818242a380ca45d92afb667441366bc9252196218dd4cfb85,
    ); // Treasury address

    let permissions = vector[
        string::utf8(b"CREATE_PRODUCT"),
        string::utf8(b"ADVANCE_STAGE"),
        string::utf8(b"VIEW_OWN_PRODUCTS"),
        string::utf8(b"GRANT_DOWNSTREAM_ROLES"),
    ];

    let role = Role {
        role_type,
        name: description,
        permissions,
    };

    let user = User {
        id: obj::new(ctx),
        name,
        endorsers: vector::empty(),
        owner: participant,
        issued_at: tx::epoch_timestamp_ms(ctx),
        role,
        trust_score: 0,
        approved: true,
        total_vote_weight: 0,
    };
    add_user_to_registry(registry, user);

    event::emit(RoleGranted {
        user: participant,
        role_type: role.role_type,
        granted_by: participant,
        endorsers: vector::empty(),
        time: tx::epoch_timestamp_ms(ctx),
    });
}

public fun register_participants(
    registry: &mut ParticipantRegistry,
    role_type: String,
    name: String,
    description: String,
    ctx: &mut TxContext,
) {
    let participant = tx::sender(ctx);

    assert!(!table::contains(&registry.users, participant), E_USER_ALREADY_REGISTERED);

    let permissions = if (role_type == string::utf8(b"SHIPPER")) {
        vector[string::utf8(b"ADVANCE_STAGE"), string::utf8(b"VIEW_PRODUCTS")]
    } else if (role_type == string::utf8(b"DISTRIBUTOR")) {
        vector[string::utf8(b"ADVANCE_STAGE"), string::utf8(b"VIEW_PRODUCTS")]
    } else if (role_type == string::utf8(b"RETAILER")) {
        vector[string::utf8(b"ADVANCE_STAGE"), string::utf8(b"VIEW_PRODUCTS")]
    } else if (role_type == string::utf8(b"CUSTOMER")) {
        vector[string::utf8(b"VIEW_PRODUCTS")]
    } else {
        abort E_INVALID_ROLE_TYPE // Invalid role_type
    };

    let role = Role {
        role_type,
        name: description,
        permissions,
    };

    debug::print(&role.role_type);

    let user = User {
        id: obj::new(ctx),
        name,
        endorsers: vector::empty(),
        owner: participant,
        issued_at: tx::epoch_timestamp_ms(ctx),
        role,
        trust_score: 0,
        approved: false,
        total_vote_weight: 0,
    };
    add_user_to_registry(registry, user);

    event::emit(RoleGranted {
        user: participant,
        role_type: role.role_type,
        granted_by: participant,
        endorsers: vector::empty(),
        time: tx::epoch_timestamp_ms(ctx),
    });
}

public fun vote_for_user(registry: &mut ParticipantRegistry, target: address, ctx: &mut TxContext) {
    let voter = tx::sender(ctx);

    assert!(table::contains(&registry.users, target), E_USER_NOT_FOUND);

    assert!(table::contains(&registry.users, voter), E_NOT_A_USER);
    let voter_user = table::borrow(&registry.users, voter);
    assert!(voter_user.approved, E_VOTER_NOT_APPROVED);

    let voter_weight = voter_user.trust_score;
    assert!(voter_weight > 0, E_NO_VOTING_POWER);

    let old_approved = {
        let user_ref = table::borrow(&registry.users, target);
        user_ref.approved
    };

    let user_mut = table::borrow_mut(&mut registry.users, target);

    assert!(!vector::contains(&user_mut.endorsers, &voter), E_ALREADY_VOTED);

    vector::push_back(&mut user_mut.endorsers, voter);
    user_mut.total_vote_weight = user_mut.total_vote_weight + voter_weight;

    event::emit(VoteCast {
        voter,
        target,
        weight: voter_weight,
        time: tx::epoch_timestamp_ms(ctx),
    });

    if (!old_approved && user_mut.total_vote_weight >= MIN_VOTE_WEIGHT) {
        user_mut.approved = true;
        event::emit(RoleGranted {
            user: user_mut.owner,
            role_type: user_mut.role.role_type,
            granted_by: voter,
            endorsers: user_mut.endorsers,
            time: tx::epoch_timestamp_ms(ctx),
        });
    };
}

public fun unvote_for_user(
    registry: &mut ParticipantRegistry,
    target: address,
    ctx: &mut TxContext,
) {
    let voter = tx::sender(ctx);

    assert!(table::contains(&registry.users, target), E_USER_NOT_FOUND);

    assert!(table::contains(&registry.users, voter), E_NOT_A_USER);
    let voter_user = table::borrow(&registry.users, voter);
    assert!(voter_user.approved, E_VOTER_NOT_APPROVED);

    let voter_weight = voter_user.trust_score;
    assert!(voter_weight > 0, E_NO_VOTING_POWER);

    let old_approved = {
        let user_ref = table::borrow(&registry.users, target);
        user_ref.approved
    };

    let user_mut = table::borrow_mut(&mut registry.users, target);

    let voted = vector::contains(&user_mut.endorsers, &voter);

    if (voted) {
        let mut i = 0;
        let len = vector::length(&user_mut.endorsers);
        while (i < len) {
            if (*vector::borrow(&user_mut.endorsers, i) == voter) {
                vector::remove(&mut user_mut.endorsers, i);
                break
            };
            i = i + 1;
        };

        user_mut.total_vote_weight = user_mut.total_vote_weight - voter_weight;
    } else {
        user_mut.total_vote_weight = user_mut.total_vote_weight -1;
    };
    if (old_approved && user_mut.total_vote_weight < MIN_VOTE_WEIGHT) {
        user_mut.approved = false;
    };
}

public fun has_role(
    registry: &ParticipantRegistry,
    participant: address,
    role_type: String,
    _ctx: &TxContext,
): bool {
    if (!table::contains(&registry.users, participant)) {
        return false
    };
    let user = table::borrow(&registry.users, participant);
    (user.role.role_type == role_type)
}

public fun get_participant_roles(
    registry: &ParticipantRegistry,
    participant: address,
    _ctx: &TxContext,
): vector<String> {
    if (!table::contains(&registry.users, participant)) {
        return vector::empty<String>()
    };
    let user = table::borrow(&registry.users, participant);
    vector::singleton(user.role.role_type)
}

public fun update_trust_score(
    registry: &mut ParticipantRegistry,
    participant: address,
    new_score: u64,
    ctx: &mut TxContext,
) {
    let updater = tx::sender(ctx);
    assert!(table::contains(&registry.users, participant), E_USER_NOT_FOUND);

    let user = table::borrow(&registry.users, participant);
    let has_permission = vector::contains(&user.endorsers, &updater);
    assert!(has_permission, E_FORBIDDEN);

    let user_mut = table::borrow_mut(&mut registry.users, participant);
    user_mut.trust_score = new_score;

    event::emit(TrustScoreUpdated {
        user: participant,
        new_score,
        updated_by: updater,
        time: tx::epoch_timestamp_ms(ctx),
    });
}

public fun revoke_role(
    registry: &mut ParticipantRegistry,
    participant: address,
    role_type: String,
    ctx: &mut TxContext,
) {
    let revoker = tx::sender(ctx);
    assert!(table::contains(&registry.users, participant), E_USER_NOT_FOUND);

    let user = table::borrow_mut(&mut registry.users, participant);
    assert!(user.role.role_type == role_type, E_ROLE_MISMATCH);

    let has_permission = (revoker == participant) || vector::contains(&user.endorsers, &revoker);
    assert!(has_permission, E_FORBIDDEN);

    let removed_user = table::remove(&mut registry.users, participant);

    let User {
        id,
        endorsers: _,
        issued_at: _,
        name: _,
        owner: _,
        role: _,
        trust_score: _,
        approved: _,
        total_vote_weight: _,
    } = removed_user;

    obj::delete(id);

    let mut i = 0;
    let len = vector::length(&registry.participants);
    while (i < len) {
        if (*vector::borrow(&registry.participants, i) == participant) {
            vector::remove(&mut registry.participants, i);
            break
        };
        i = i + 1;
    };

    event::emit(RoleRevoked {
        user: participant,
        role_type,
        revoked_by: revoker,
        time: tx::epoch_timestamp_ms(ctx),
    });
}

public fun get_all_participants(registry: &ParticipantRegistry): &vector<address> {
    &registry.participants
}

public fun get_participant_count(registry: &ParticipantRegistry): u64 {
    vector::length(&registry.participants)
}

public fun get_registry(registry: &ParticipantRegistry): &Table<address, User> {
    &registry.users
}

public fun is_user_approved(user: &User): bool {
    user.approved
}

public fun get_user_role(user: &User): &Role {
    &user.role
}

public fun get_user_endorsers(user: &User): &vector<address> {
    &user.endorsers
}

public fun get_user_trust_score(user: &User): u64 {
    user.trust_score
}

public fun get_user_total_vote_weight(user: &User): u64 {
    user.total_vote_weight
}

public fun is_user_in_registry(registry: &ParticipantRegistry, target: address): bool {
    table::contains(&registry.users, target)
}

public fun get_user_in_registry(registry: &ParticipantRegistry, target: address): &User {
    table::borrow(&registry.users, target)
}

public fun is_user_in_registry_approved(registry: &ParticipantRegistry, target: address): bool {
    let user = table::borrow(&registry.users, target);
    user.approved
}
