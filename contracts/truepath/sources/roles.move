/// Module: roles
/// Handles role-based access control for supply chain participants with community-driven approvals and reputation weighting.
module truepath::roles;

use std::debug;
use std::string::{Self, String};
use sui::coin::{Self, Coin};
use sui::event;
use sui::object::{Self as obj};
use sui::sui::SUI;
use sui::table::{Self, Table};
use sui::tx_context::{Self as tx};

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
    users: Table<address, address>,
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

fun add_user_to_registry(registry: &mut ParticipantRegistry, user: &User) {
    let owner_addr = user.owner;
    let user_id = obj::uid_to_address(&user.id);
    table::add(&mut registry.users, owner_addr, user_id);
    vector::push_back(&mut registry.participants, owner_addr);
}

#[allow(lint(self_transfer))]
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
    add_user_to_registry(registry, &user);

    transfer::transfer(user, participant);

    event::emit(RoleGranted {
        user: participant,
        role_type: role.role_type,
        granted_by: participant,
        endorsers: vector::empty(),
        time: tx::epoch_timestamp_ms(ctx),
    });
}

#[allow(lint(self_transfer))]
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

    add_user_to_registry(registry, &user);

    transfer::transfer(user, participant);

    event::emit(RoleGranted {
        user: participant,
        role_type: role.role_type,
        granted_by: participant,
        endorsers: vector::empty(),
        time: tx::epoch_timestamp_ms(ctx),
    });
}

public fun vote_for_user(
    registry: &mut ParticipantRegistry,
    user_obj: &mut User,
    voter_user: &User,
    ctx: &mut TxContext,
) {
    let voter = tx::sender(ctx);
    assert!(table::contains(&registry.users, voter), E_NOT_A_USER);
    assert!(table::contains(&registry.users, user_obj.owner), E_USER_NOT_FOUND);

    // Fetch voter's User object
    let voter_user_id = *table::borrow(&registry.users, voter);
    assert!(voter_user.approved, E_VOTER_NOT_APPROVED);
    assert!(voter_user.trust_score > 0, E_NO_VOTING_POWER);

    assert!(!vector::contains(&user_obj.endorsers, &voter), E_ALREADY_VOTED);

    let voter_weight = voter_user.trust_score;
    let old_approved = user_obj.approved;

    vector::push_back(&mut user_obj.endorsers, voter);
    user_obj.total_vote_weight = user_obj.total_vote_weight + voter_weight;

    event::emit(VoteCast {
        voter,
        target: user_obj.owner,
        weight: voter_weight,
        time: tx::epoch_timestamp_ms(ctx),
    });

    if (!old_approved && user_obj.total_vote_weight >= MIN_VOTE_WEIGHT) {
        user_obj.approved = true;
        event::emit(RoleGranted {
            user: user_obj.owner,
            role_type: user_obj.role.role_type,
            granted_by: voter,
            endorsers: user_obj.endorsers,
            time: tx::epoch_timestamp_ms(ctx),
        });
    };
}

public fun unvote_for_user(
    registry: &mut ParticipantRegistry,
    user_obj: &mut User,
    voter_user: &User,
    ctx: &mut TxContext,
) {
    let voter = tx::sender(ctx);
    assert!(table::contains(&registry.users, voter), E_NOT_A_USER);
    assert!(table::contains(&registry.users, user_obj.owner), E_USER_NOT_FOUND);

    // Fetch voter's User object
    let voter_user_id = *table::borrow(&registry.users, voter);
    assert!(voter_user.approved, E_VOTER_NOT_APPROVED);
    assert!(voter_user.trust_score > 0, E_NO_VOTING_POWER);

    let voter_weight = voter_user.trust_score;
    let old_approved = user_obj.approved;

    let voted = vector::contains(&user_obj.endorsers, &voter);

    if (voted) {
        let mut i = 0;
        let len = vector::length(&user_obj.endorsers);
        while (i < len) {
            if (*vector::borrow(&user_obj.endorsers, i) == voter) {
                vector::remove(&mut user_obj.endorsers, i);
                break
            };
            i = i + 1;
        };
        user_obj.total_vote_weight = user_obj.total_vote_weight - voter_weight;
    } else {
        user_obj.total_vote_weight = user_obj.total_vote_weight - 1;
    };

    if (old_approved && user_obj.total_vote_weight < MIN_VOTE_WEIGHT) {
        user_obj.approved = false;
    };

    event::emit(VoteRemoved {
        voter,
        target: user_obj.owner,
        weight: voter_weight,
        time: tx::epoch_timestamp_ms(ctx),
    });
}

public fun has_role(
    registry: &ParticipantRegistry,
    participant: address,
    role_type: String,
    user: &User,
    ctx: &TxContext,
): bool {
    if (!table::contains(&registry.users, participant)) {
        return false
    };
    let user_id = *table::borrow(&registry.users, participant);
    user.role.role_type == role_type
}



public fun update_trust_score(
    registry: &mut ParticipantRegistry,
    user_obj: &mut User,
    new_score: u64,
    ctx: &mut TxContext,
) {
    let updater = tx::sender(ctx);
    assert!(table::contains(&registry.users, user_obj.owner), E_USER_NOT_FOUND);
    assert!(vector::contains(&user_obj.endorsers, &updater), E_FORBIDDEN);

    user_obj.trust_score = new_score;

    event::emit(TrustScoreUpdated {
        user: user_obj.owner,
        new_score,
        updated_by: updater,
        time: tx::epoch_timestamp_ms(ctx),
    });
}

public fun get_all_participants(registry: &ParticipantRegistry): &vector<address> {
    &registry.participants
}

public fun get_participant_count(registry: &ParticipantRegistry): u64 {
    vector::length(&registry.participants)
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

public fun get_user_id_in_registry(registry: &ParticipantRegistry, target: address): address {
    *table::borrow(&registry.users, target)
}

public fun verify_user(user: &User, userAddress: address): bool { user.owner == userAddress }
