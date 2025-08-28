/// Module: roles
/// Handles role-based access control for supply chain participants with community-driven approvals and reputation weighting.
module truepath::roles;

use std::option;
use std::string::{Self, String};
use std::vector;
use sui::coin::{Self, Coin, TreasuryCap};
use sui::event;
use sui::object::{Self as obj, UID};
use sui::pay;
use sui::sui::SUI;
use sui::table::{Self, Table};
use sui::transfer;
use sui::tx_context::{Self as tx, TxContext};
use std::debug;

// Constants
const MIN_ENDORSEMENT_WEIGHT: u64 = 5; // Minimum total trust score weight for endorsements

public enum RoleType has copy, drop, store {
    Manufacturer,
    Shipper,
    Distributor,
    Retailer,
    Customer,
}

// Role types in the supply chain
public struct Role has copy, drop, store {
    role_type: RoleType, // "MANUFACTURER", "SHIPPER", "DISTRIBUTOR", "RETAILER", "CUSTOMER", "ADMIN"
    name: String, // Human-readable name
    description: String, // Description of the role
    permissions: vector<String>, // List of permissions, e.g., ["CREATE_PRODUCT"]
}

// Capability object that grants role-based permissions
public struct RoleCapability has key, store {
    id: UID,
    role: Role,
    owner: address,
    issued_at: u64,
    expires_at: option::Option<u64>, // None means never expires
    endorsers: vector<address>, // List of endorsers for community approval
}

// Registry of all registered participants (using Table for O(1) lookups by address)
public struct ParticipantRegistry has key {
    id: UID,
    participants: vector<address>, // Still keep for enumeration if needed
    roles: Table<address, vector<RoleCapability>>, // Key: participant address, Value: their roles
    trust_scores: Table<address, u64>, // Key: participant address, Value: trust score (for weighted endorsements)
}

// Events
public struct RoleGranted has copy, drop, store {
    participant: address,
    role_type: RoleType,
    granted_by: address,
    endorsers: vector<address>,
    time: u64,
}

public struct RoleRevoked has copy, drop, store {
    participant: address,
    role_type: String,
    revoked_by: address,
    time: u64,
}

public struct ManufacturerRegistered has copy, drop, store {
    manufacturer: address,
    name: String,
    description: String,
    time: u64,
}

public struct TrustScoreUpdated has copy, drop, store {
    participant: address,
    new_score: u64,
    updated_by: address,
    time: u64,
}

// Helper to convert RoleType to String for events or queries
fun role_type_to_string(role_type: &RoleType): String {
    match (role_type) {
        RoleType::Manufacturer => string::utf8(b"MANUFACTURER"),
        RoleType::Shipper => string::utf8(b"SHIPPER"),
        RoleType::Distributor => string::utf8(b"DISTRIBUTOR"),
        RoleType::Retailer => string::utf8(b"RETAILER"),
        RoleType::Customer => string::utf8(b"CUSTOMER"),
    }
}

// Helper functions to create RoleType instances
public fun manufacturer_role_type(): RoleType {
    RoleType::Manufacturer
}

public fun shipper_role_type(): RoleType {
    RoleType::Shipper
}

public fun distributor_role_type(): RoleType {
    RoleType::Distributor
}

public fun retailer_role_type(): RoleType {
    RoleType::Retailer
}

public fun customer_role_type(): RoleType {
    RoleType::Customer
}

// Initialize the participant registry and bootstrap initial ADMIN for deployer
public fun init_for_test(ctx: &mut TxContext) {
    let deployer = tx::sender(ctx);
    let mut registry = ParticipantRegistry {
        id: obj::new(ctx),
        participants: vector::empty(),
        roles: table::new(ctx),
        trust_scores: table::new(ctx),
    };

    // Bootstrap deployer as initial Manufacturer
    let mfr_role = Role {
        role_type: RoleType::Manufacturer,
        name: string::utf8(b"System Manufacturer"),
        description: string::utf8(b"Initial manufacturer for bootstrapping"),
        permissions: vector[
            string::utf8(b"CREATE_PRODUCT"),
            string::utf8(b"ADVANCE_STAGE"),
            string::utf8(b"VIEW_OWN_PRODUCTS"),
            string::utf8(b"GRANT_DOWNSTREAM_ROLES"),
        ],
    };
    let mfr_cap = RoleCapability {
        id: obj::new(ctx),
        role: mfr_role,
        owner: deployer,
        issued_at: tx::epoch_timestamp_ms(ctx),
        expires_at: option::none(),
        endorsers: vector::singleton(deployer), // Self-endorsed
    };
    add_role_to_participant(&mut registry, deployer, mfr_cap, ctx);
    // Update the trust score to 10 (higher initial score for deployer)
    *table::borrow_mut(&mut registry.trust_scores, deployer) = 10;
    transfer::share_object(registry);
}


// Helper to add role to participant's table entry
fun add_role_to_participant(
    registry: &mut ParticipantRegistry,
    participant: address,
    cap: RoleCapability,
    _ctx: &TxContext,
) {
    if (!table::contains(&registry.roles, participant)) {
        table::add(&mut registry.roles, participant, vector::empty());
        vector::push_back(&mut registry.participants, participant);
        table::add(&mut registry.trust_scores, participant, 1); // Default trust score
    };
    let roles_vec = table::borrow_mut(&mut registry.roles, participant);
    vector::push_back(roles_vec, cap);
}

// Get trust score for a participant
public fun get_trust_score(registry: &ParticipantRegistry, participant: address): u64 {
    if (table::contains(&registry.trust_scores, participant)) {
        *table::borrow(&registry.trust_scores, participant)
    } else {
        0
    }
}

// New constant for registration fee (in MIST, Sui's smallest unit; 1 SUI = 10^9 MIST)
const REGISTRATION_FEE: u64 = 1000000000; // 1 SUI

public fun register_role(
    registry: &mut ParticipantRegistry,
    role_type: RoleType,
    name: String,
    description: String,
    endorsers: vector<address>, // Community endorsers (optional for Manufacturer)
    payment: Coin<SUI>, // Required payment for Manufacturer without endorsements
    ctx: &mut TxContext,
) {
    let participant = tx::sender(ctx);

    // Calculate total endorsement weight (sum of trust scores, excluding self)
    let mut total_weight: u64 = 0;
    let mut i = 0;
    let len = vector::length(&endorsers);
    while (i < len) {
        let endorser = *vector::borrow(&endorsers, i);
        if (endorser != participant) {
            // Prevent self-boosting from external list
            let score = get_trust_score(registry, endorser);
            total_weight = total_weight + score;
        };
        i = i + 1;
    };

    // Conditional requirements based on role
    match (role_type) {
        RoleType::Manufacturer => {
        debug::print(&total_weight);
            // For Manufacturer: If no sufficient endorsements, require payment instead
            if (total_weight < MIN_ENDORSEMENT_WEIGHT) {
                assert!(coin::value(&payment) >= REGISTRATION_FEE, 408); 
                // Convert coin to balance (will be destroyed automatically when it goes out of scope)
                // let payment_balance = coin::into_balance(payment);
                // transfer::public_transfer(payment, participant)
            } else {
                // If endorsed, no fee needed; convert to balance (will be destroyed automatically)
                // let payment_balance = coin::into_balance(payment);
            };

                            transfer::public_transfer(payment, participant)

        },
        _ => {
            assert!(len > 0, 404); // Require endorsers for non-Manufacturer
            assert!(total_weight >= MIN_ENDORSEMENT_WEIGHT, 405); // Insufficient weight

                                        transfer::public_transfer(payment, participant)

        },
    };

    // Define default permissions based on role_type (customize as needed)
    let permissions = match (role_type) {
        RoleType::Manufacturer => vector[
            string::utf8(b"CREATE_PRODUCT"),
            string::utf8(b"ADVANCE_STAGE"),
            string::utf8(b"VIEW_OWN_PRODUCTS"),
            string::utf8(b"GRANT_DOWNSTREAM_ROLES"),
        ],
        RoleType::Shipper => vector[string::utf8(b"ADVANCE_STAGE"), string::utf8(b"VIEW_PRODUCTS")],
        RoleType::Distributor => vector[
            string::utf8(b"ADVANCE_STAGE"),
            string::utf8(b"VIEW_PRODUCTS"),
        ],
        RoleType::Retailer => vector[
            string::utf8(b"ADVANCE_STAGE"),
            string::utf8(b"VIEW_PRODUCTS"),
        ],
        RoleType::Customer => vector[string::utf8(b"VIEW_PRODUCTS")],
    };

    let role = Role {
        role_type,
        name,
        description,
        permissions,
    };

    debug::print(&role);
    let capability = RoleCapability {
        id: obj::new(ctx),
        role,
        owner: participant,
        issued_at: tx::epoch_timestamp_ms(ctx),
        expires_at: option::none(),
        endorsers,
    };
    add_role_to_participant(registry, participant, capability, ctx);

    // Emit event
    event::emit(RoleGranted {
        participant,
        role_type,
        granted_by: participant, // Self-granted, but endorsed if provided
        endorsers,
        time: tx::epoch_timestamp_ms(ctx),
    });

}


/**

// Require a specific role (for enforcement in other modules, aborts if missing)
public fun require_role(
    registry: &ParticipantRegistry,
    participant: address,
    role_type: String,
    ctx: &TxContext,
) {
    assert!(has_role(registry, participant, role_type, ctx), 403);
}

// Get all roles for a participant (filters expired)
public fun get_participant_roles(
    registry: &ParticipantRegistry,
    participant: address,
    ctx: &TxContext,
): vector<String> {
    let mut roles = vector::empty<String>();
    if (!table::contains(&registry.roles, participant)) {
        return roles
    };
    let roles_vec = table::borrow(&registry.roles, participant);
    let mut i = 0;
    let len = vector::length(roles_vec);
    while (i < len) {
        let role_cap = vector::borrow(roles_vec, i);
        let is_valid = if (option::is_some(&role_cap.expires_at)) {
            let expires_at = *option::borrow(&role_cap.expires_at);
            tx::epoch_timestamp_ms(ctx) <= expires_at
        } else {
            true
        };
        if (is_valid) {
            vector::push_back(&mut roles, role_cap.role.role_type);
        };
        i = i + 1;
    };
    roles
}



// Update trust score (decentralized: caller must be ADMIN or an endorser of the target's roles)
public fun update_trust_score(
    registry: &mut ParticipantRegistry,
    participant: address,
    new_score: u64,
    ctx: &mut TxContext,
) {
    let updater = tx::sender(ctx);
    assert!(table::contains(&registry.roles, participant), 404); // Participant must exist

    // Permission check: ADMIN or has endorsed one of the target's roles
    let mut has_permission = has_role(registry, updater, string::utf8(b"ADMIN"), ctx);
    if (!has_permission) {
        let roles_vec = table::borrow(&registry.roles, participant);
        let mut i = 0;
        let len = vector::length(roles_vec);
        while (i < len) {
            let role_cap = vector::borrow(roles_vec, i);
            if (vector::contains(&role_cap.endorsers, &updater)) {
                has_permission = true;
                break
            };
            i = i + 1;
        };
    };
    assert!(has_permission, 403);

    // Update score
    if (!table::contains(&registry.trust_scores, participant)) {
        table::add(&mut registry.trust_scores, participant, new_score);
    } else {
        *table::borrow_mut(&mut registry.trust_scores, participant) = new_score;
    };

    event::emit(TrustScoreUpdated {
        participant,
        new_score,
        updated_by: updater,
        time: tx::epoch_timestamp_ms(ctx),
    });
}

// Grant a role to a participant (decentralized: caller must have relevant permission or be endorser; with weighted endorsements)
public fun grant_role(
    registry: &mut ParticipantRegistry,
    participant: address,
    role_type: String,
    name: String,
    description: String,
    permissions: vector<String>,
    expires_at: option::Option<u64>,
    endorsers: vector<address>, // Must have at least one endorser
    ctx: &mut TxContext,
) {
    let granter = tx::sender(ctx);
    // Decentralized check: Granter must have "GRANT_ANY_ROLE" (ADMIN) or "GRANT_DOWNSTREAM_ROLES" or be in endorsers
    assert!(
        has_role(registry, granter, string::utf8(b"ADMIN"), ctx) ||
        has_role(registry, granter, string::utf8(b"GRANT_DOWNSTREAM_ROLES"), ctx) || // E.g., for manufacturers granting shippers
        vector::contains(&endorsers, &granter),
        403,
    );
    // Require at least one endorser for community support
    assert!(vector::length(&endorsers) > 0, 404); // Error code for missing endorsers

    // Calculate total endorsement weight (sum of trust scores, excluding self if applicable)
    let mut total_weight: u64 = 0;
    let mut i = 0;
    let len = vector::length(&endorsers);
    while (i < len) {
        let endorser = *vector::borrow(&endorsers, i);
        if (endorser != participant) {
            // Prevent self-boosting
            let score = get_trust_score(registry, endorser);
            total_weight = total_weight + score;
        };
        i = i + 1;
    };
    assert!(total_weight >= MIN_ENDORSEMENT_WEIGHT, 405); // Insufficient weight

    let role = Role {
        role_type,
        name,
        description,
        permissions,
    };
    let capability = RoleCapability {
        id: obj::new(ctx),
        role,
        owner: participant,
        issued_at: tx::epoch_timestamp_ms(ctx),
        expires_at,
        endorsers,
    };
    add_role_to_participant(registry, participant, capability, ctx);

    event::emit(RoleGranted {
        participant,
        role_type,
        granted_by: granter,
        endorsers,
        time: tx::epoch_timestamp_ms(ctx),
    });
}

// Revoke a role from a participant (decentralized: caller must be ADMIN, self, or original endorser)
public fun revoke_role(
    registry: &mut ParticipantRegistry,
    participant: address,
    role_type: String,
    ctx: &mut TxContext,
) {
    let revoker = tx::sender(ctx);
    assert!(table::contains(&registry.roles, participant), 404); // No roles

    // Compute admin privilege before mutably borrowing roles to avoid conflicting borrows
    let is_admin = has_role(registry, revoker, string::utf8(b"ADMIN"), ctx);

    let roles_vec = table::borrow_mut(&mut registry.roles, participant);
    let mut i = 0;
    let len = vector::length(roles_vec);
    while (i < len) {
        let role_cap = vector::borrow(roles_vec, i);
        if (role_cap.role.role_type == role_type) {
            // Check permission: ADMIN, self, or was an endorser
            assert!(
                is_admin ||
                revoker == participant ||
                vector::contains(&role_cap.endorsers, &revoker),
                403,
            );
            // Remove and destroy
            let removed_cap: RoleCapability = vector::remove(roles_vec, i);
            let RoleCapability {
                id,
                role: _,
                owner: _,
                issued_at: _,
                expires_at: _,
                endorsers: _,
            } = removed_cap;
            obj::delete(id); // Clean up object

            event::emit(RoleRevoked {
                participant,
                role_type,
                revoked_by: revoker,
                time: tx::epoch_timestamp_ms(ctx),
            });
            return
        };
        i = i + 1;
    };
    // If not found, abort with error
    abort 406 // Role not found
}
// Get all participants
public fun get_all_participants(registry: &ParticipantRegistry): &vector<address> {
    &registry.participants
}
