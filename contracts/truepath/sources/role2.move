// /// Module: roles
// /// Handles role-based access control for supply chain participants with community-driven approvals and reputation weighting.
// module truepath::roles;

// use std::option;
// use std::string::{Self, String};
// use std::vector;
// use sui::coin::{Self, Coin};
// use sui::event;
// use sui::object::{Self as obj, UID};
// use sui::pay;
// use sui::sui::SUI;
// use sui::table::{Self, Table};
// use sui::transfer;
// use sui::tx_context::{Self as tx, TxContext};
// use std::debug;

// // Constants
// const MIN_ENDORSEMENT_WEIGHT: u64 = 5; // Minimum total trust score weight for endorsements
// const REGISTRATION_FEE: u64 = 1000000000; // 1 SUI in MIST

// public struct Role has copy, drop, store {
//     role_type: String,
//     permissions: vector<String>,
//     name: String,
// }

// public struct User has key, store {
//     id: UID,
//     name: String,
//     endorsers: vector<address>,
//     owner: address,
//     issued_at: u64,
//     role: Role,
//     trust_score: u64,
// }

// public struct ParticipantRegistry has key {
//     id: UID,
//     participants: vector<address>,
//     users: Table<address, User>,
// }

// public struct RoleGranted has copy, drop, store {
//     participant: address,
//     role_type: String,
//     granted_by: address,
//     endorsers: vector<address>,
//     time: u64,
// }

// public struct RoleRevoked has copy, drop, store {
//     participant: address,
//     role_type: String,
//     revoked_by: address,
//     time: u64,
// }

// public struct TrustScoreUpdated has copy, drop, store {
//     participant: address,
//     new_score: u64,
//     updated_by: address,
//     time: u64,
// }

// fun init(ctx: &mut TxContext) {
//     let deployer = tx::sender(ctx);
//     let registry = ParticipantRegistry {
//         id: obj::new(ctx),
//         participants: vector::empty(),
//         users: table::new(ctx),
//     };

//     // Bootstrap deployer as initial User with Manufacturer role
//     let mfr_role = Role {
//         role_type: string::utf8(b"MANUFACTURER"),
//         name: string::utf8(b"System Manufacturer Role"),
//         permissions: vector[
//             string::utf8(b"CREATE_PRODUCT"),
//             string::utf8(b"ADVANCE_STAGE"),
//             string::utf8(b"VIEW_OWN_PRODUCTS"),
//             string::utf8(b"GRANT_DOWNSTREAM_ROLES"),
//         ],
//     };
//     let deployer_user = User {
//         id: obj::new(ctx),
//         name: string::utf8(b"System Manufacturer"),
//         endorsers: vector::singleton(deployer),
//         owner: deployer,
//         issued_at: tx::epoch_timestamp_ms(ctx),
//         role: mfr_role,
//         trust_score: 10, // Higher initial score for deployer
//     };
//     add_user_to_registry(&mut registry, deployer, deployer_user);
//     transfer::share_object(registry);
// }

// fun add_user_to_registry(
//     registry: &mut ParticipantRegistry,
//     participant: address,
//     user: User,
// ) {
//     table::add(&mut registry.users, participant, user);
//     vector::push_back(&mut registry.participants, participant);
// }

// public fun get_trust_score(registry: &ParticipantRegistry, participant: address): u64 {
//     if (table::contains(&registry.users, participant)) {
//         let user = table::borrow(&registry.users, participant);
//         user.trust_score
//     } else {
//         0
//     }
// }

// public fun register_role(
//     registry: &mut ParticipantRegistry,
//     role_type: String,
//     name: String,
//     description: String, // Note: Description not in Role, but passed; perhaps ignore or add to User/Role if needed
//     endorsers: vector<address>,
//     payment: Coin<SUI>,
//     ctx: &mut TxContext,
// ) {
//     let participant = tx::sender(ctx);

//     let mut total_weight: u64 = 0;
//     let mut i = 0;
//     let len = vector::length(&endorsers);
//     while (i < len) {
//         let endorser = *vector::borrow(&endorsers, i);
//         if (endorser != participant) {
//             let score = get_trust_score(registry, endorser);
//             total_weight = total_weight + score;
//         };
//         i = i + 1;
//     };

//     let is_manufacturer = (role_type == string::utf8(b"MANUFACTURER"));
//     if (is_manufacturer) {
//         if (total_weight < MIN_ENDORSEMENT_WEIGHT) {
//             assert!(coin::value(&payment) >= REGISTRATION_FEE, 408);
//             coin::destroy_zero(payment);
//         } else {
//             coin::destroy_zero(payment);
//         }
//     } else {
//         assert!(len > 0, 404);
//         assert!(total_weight >= MIN_ENDORSEMENT_WEIGHT, 405);
//         coin::destroy_zero(payment);
//     };

//     let permissions = if (is_manufacturer) {
//         vector[
//             string::utf8(b"CREATE_PRODUCT"),
//             string::utf8(b"ADVANCE_STAGE"),
//             string::utf8(b"VIEW_OWN_PRODUCTS"),
//             string::utf8(b"GRANT_DOWNSTREAM_ROLES"),
//         ]
//     } else if (role_type == string::utf8(b"SHIPPER")) {
//         vector[
//             string::utf8(b"ADVANCE_STAGE"),
//             string::utf8(b"VIEW_PRODUCTS"),
//         ]
//     } else if (role_type == string::utf8(b"DISTRIBUTOR")) {
//         vector[
//             string::utf8(b"ADVANCE_STAGE"),
//             string::utf8(b"VIEW_PRODUCTS"),
//         ]
//     } else if (role_type == string::utf8(b"RETAILER")) {
//         vector[
//             string::utf8(b"ADVANCE_STAGE"),
//             string::utf8(b"VIEW_PRODUCTS"),
//         ]
//     } else if (role_type == string::utf8(b"CUSTOMER")) {
//         vector[
//             string::utf8(b"VIEW_PRODUCTS"),
//         ]
//     } else {
//         abort 409 // Invalid role_type
//     };

//     let role = Role {
//         role_type,
//         name: description, // Using description as role.name since Role has name, but param is description; adjust as needed
//         permissions,
//     };

//     let user = User {
//         id: obj::new(ctx),
//         name,
//         endorsers,
//         owner: participant,
//         issued_at: tx::epoch_timestamp_ms(ctx),
//         role,
//         trust_score: 1,
//     };
//     add_user_to_registry(registry, participant, user);

//     event::emit(RoleGranted {
//         participant,
//         role_type: role.role_type,
//         granted_by: participant,
//         endorsers,
//         time: tx::epoch_timestamp_ms(ctx),
//     });
// }

// public fun has_role(
//     registry: &ParticipantRegistry,
//     participant: address,
//     role_type: String,
//     _ctx: &TxContext,
// ): bool {
//     if (!table::contains(&registry.users, participant)) {
//         return false
//     };
//     let user = table::borrow(&registry.users, participant);
//     (user.role.role_type == role_type)
// }

// public fun require_role(
//     registry: &ParticipantRegistry,
//     participant: address,
//     role_type: String,
//     ctx: &TxContext,
// ) {
//     assert!(has_role(registry, participant, role_type, ctx), 403);
// }

// public fun get_participant_roles(
//     registry: &ParticipantRegistry,
//     participant: address,
//     _ctx: &TxContext,
// ): vector<String> {
//     if (!table::contains(&registry.users, participant)) {
//         return vector::empty<String>()
//     };
//     let user = table::borrow(&registry.users, participant);
//     vector::singleton(user.role.role_type)
// }

// public fun update_trust_score(
//     registry: &mut ParticipantRegistry,
//     participant: address,
//     new_score: u64,
//     ctx: &mut TxContext,
// ) {
//     let updater = tx::sender(ctx);
//     assert!(table::contains(&registry.users, participant), 404);

//     let user = table::borrow(&registry.users, participant);
//     let has_permission = vector::contains(&user.endorsers, &updater);
//     assert!(has_permission, 403);

//     let user_mut = table::borrow_mut(&mut registry.users, participant);
//     user_mut.trust_score = new_score;

//     event::emit(TrustScoreUpdated {
//         participant,
//         new_score,
//         updated_by: updater,
//         time: tx::epoch_timestamp_ms(ctx),
//     });
// }

// public fun grant_role(
//     registry: &mut ParticipantRegistry,
//     participant: address,
//     role_type: String,
//     name: String,
//     description: String,
//     permissions: vector<String>,
//     endorsers: vector<address>,
//     ctx: &mut TxContext,
// ) {
//     let granter = tx::sender(ctx);
//     assert!(
//         has_specific_permission(registry, granter, string::utf8(b"GRANT_DOWNSTREAM_ROLES"), ctx) ||
//         vector::contains(&endorsers, &granter),
//         403,
//     );
//     assert!(vector::length(&endorsers) > 0, 404);

//     let mut total_weight: u64 = 0;
//     let mut i = 0;
//     let len = vector::length(&endorsers);
//     while (i < len) {
//         let endorser = *vector::borrow(&endorsers, i);
//         if (endorser != participant) {
//             let score = get_trust_score(registry, endorser);
//             total_weight = total_weight + score;
//         };
//         i = i + 1;
//     };
//     assert!(total_weight >= MIN_ENDORSEMENT_WEIGHT, 405);

//     let role = Role {
//         role_type,
//         name: description,
//         permissions,
//     };
//     let user = User {
//         id: obj::new(ctx),
//         name,
//         endorsers,
//         owner: participant,
//         issued_at: tx::epoch_timestamp_ms(ctx),
//         role,
//         trust_score: 1,
//     };
//     add_user_to_registry(registry, participant, user);

//     event::emit(RoleGranted {
//         participant,
//         role_type,
//         granted_by: granter,
//         endorsers,
//         time: tx::epoch_timestamp_ms(ctx),
//     });
// }

// fun has_specific_permission(
//     registry: &ParticipantRegistry,
//     participant: address,
//     target_perm: String,
//     _ctx: &TxContext,
// ): bool {
//     if (!table::contains(&registry.users, participant)) {
//         return false
//     };
//     let user = table::borrow(&registry.users, participant);
//     let perms = &user.role.permissions;
//     let mut j = 0;
//     let perm_len = vector::length(perms);
//     while (j < perm_len) {
//         if (*vector::borrow(perms, j) == target_perm) {
//             return true
//         };
//         j = j + 1;
//     };
//     false
// }

// public fun revoke_role(
//     registry: &mut ParticipantRegistry,
//     participant: address,
//     role_type: String,
//     ctx: &mut TxContext,
// ) {
//     let revoker = tx::sender(ctx);
//     assert!(table::contains(&registry.users, participant), 404);

//     let user = table::borrow_mut(&mut registry.users, participant);
//     assert!(user.role.role_type == role_type, 406); // Role mismatch

//     let has_permission = (revoker == participant) || vector::contains(&user.endorsers, &revoker);
//     assert!(has_permission, 403);

//     // Since single role, remove the entire user (or reset role if multi-role needed)
//     let removed_user = table::remove(&mut registry.users, participant);
//     obj::delete(removed_user.id);

//     // Remove from participants vector
//     let mut i = 0;
//     let len = vector::length(&registry.participants);
//     while (i < len) {
//         if (*vector::borrow(&registry.participants, i) == participant) {
//             vector::remove(&mut registry.participants, i);
//             break
//         };
//         i = i + 1;
//     };

//     event::emit(RoleRevoked {
//         participant,
//         role_type,
//         revoked_by: revoker,
//         time: tx::epoch_timestamp_ms(ctx),
//     });
// }

// public fun get_all_participants(registry: &ParticipantRegistry): &vector<address> {
//     &registry.participants
// }

// public fun get_participant_count(registry: &ParticipantRegistry): u64 {
//     vector::length(&registry.participants)
// }