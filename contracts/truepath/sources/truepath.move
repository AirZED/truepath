/// Module: truepath
/// Manages supply chain product lifecycle with hash-chain verification and role-based access control.
module truepath::truepath;

use std::debug;
use std::hash;
use std::option;
use std::string;
use std::vector;
use sui::event;
use sui::object::{Self as obj, UID};
use sui::transfer;
use sui::tx_context::{Self as tx, TxContext};
use truepath::roles::{
    ParticipantRegistry,
    User,
    has_role,
    is_user_in_registry,
    is_user_approved,
    verify_user
};

// Error codes
const E_FORBIDDEN: u64 = 403; // Operation not allowed (insufficient permissions)
const E_NOT_A_USER: u64 = 416; // Caller is not a registered user
const E_VOTER_NOT_APPROVED: u64 = 419; // User is not approved
const E_INVALID_STAGE_CONFIG: u64 = 1; // Stage names length mismatch
const E_INVALID_ROLE_CONFIG: u64 = 2; // Stage roles length mismatch
const E_PRODUCT_COMPLETED: u64 = 10; // Product has no remaining steps
const E_HASH_MISMATCH: u64 = 11; // Preimage does not match head_hash

public struct Product has key, store {
    id: UID,
    // Business identifiers
    sku: string::String,
    batch_id: string::String,
    // Evolving one-time code (hash-chain head)
    head_hash: vector<u8>, // Starts at h_0
    remaining: u32, // How many preimages left until completion
    stage: u32, // Current stage index (0-based)
    stage_names: vector<string::String>, // e.g., ["MANUFACTURED","SHIPPED","RECEIVED","RETAIL","SOLD"]
    stage_roles: vector<string::String>, // e.g., ["MANUFACTURER","SHIPPER","DISTRIBUTOR","RETAILER","CUSTOMER"]
    current_owner: address,
}

/// Emitted when a product is minted
public struct Minted has copy, drop, store {
    product: address,
    sku: string::String,
    batch_id: string::String,
    total_steps: u32,
    head_hash: vector<u8>,
    owner: address,
    time: u64,
}

/// Emitted on each successful stage advance
public struct Advanced has copy, drop, store {
    product: address,
    stage_index: u32,
    stage_name: string::String,
    expected_role: string::String,
    actor: address,
    actor_role: string::String,
    location_tag: option::Option<string::String>,
    ok_role: bool,
    time: u64,
}

/// Emitted if someone submits a wrong/old code (out of sync attempts)
public struct Rejected has copy, drop, store {
    product: address,
    stage_index: u32,
    actor: address,
    actor_role: string::String,
    reason: string::String, // "HASH_MISMATCH" | "COMPLETED"
    time: u64,
}

/// Mint a new product with an already-computed h_0 and a total remaining count.
/// Security note: DO NOT store the seed on-chain
public fun mint_product(
    registry: &ParticipantRegistry,
    user: &User,
    sku: string::String,
    batch_id: string::String,
    head_hash: vector<u8>,
    total_steps: u32,
    stage_names: vector<string::String>,
    stage_roles: vector<string::String>,
    ctx: &mut TxContext,
): Product {
    let owner = tx::sender(ctx);
    assert!(user.owner == owner, E_FORBIDDEN);
    assert!(is_user_in_registry(registry, owner), E_NOT_A_USER);
    assert!(has_role(registry, owner, string::utf8(b"MANUFACTURER"), user, ctx), E_FORBIDDEN);

    if (vector::length(&stage_names) != 0 && vector::length(&stage_names) != (total_steps as u64)) {
        abort E_INVALID_STAGE_CONFIG
    };

    if (vector::length(&stage_roles) != 0 && vector::length(&stage_roles) != (total_steps as u64)) {
        abort E_INVALID_ROLE_CONFIG
    };

    let product = Product {
        id: obj::new(ctx),
        sku,
        batch_id,
        head_hash,
        remaining: total_steps,
        stage: 0,
        stage_names,
        stage_roles,
        current_owner: owner,
    };

    // Debug print to verify product creation
    debug::print(&product);

    event::emit(Minted {
        product: obj::uid_to_address(&product.id),
        sku: product.sku,
        batch_id: product.batch_id,
        total_steps,
        head_hash: product.head_hash,
        owner,
        time: tx::epoch_timestamp_ms(ctx),
    });

    product
}

public fun set_owner(product: &mut Product, new_owner: address, ctx: &mut TxContext) {
    assert!(product.current_owner == tx::sender(ctx), E_FORBIDDEN);
    product.current_owner = new_owner;
}

/// Verify the *next* preimage and advance exactly one stage
/// - 'preimage' must satisfy sha3_256(preimage) == current head_hash
/// - On success: head_hash := preimage, remaining--, stage++.
/// - Attach context: actor_role and location tag for auditing
public fun verify_and_advance(
    registry: &ParticipantRegistry,
    user: &User,
    product: &mut Product,
    preimage: vector<u8>,
    actor_role: string::String,
    location_tag: option::Option<string::String>,
    ctx: &mut TxContext,
) {
    let actor = tx::sender(ctx);
    assert!(verify_user(user, actor), E_FORBIDDEN);
    assert!(is_user_in_registry(registry, actor), E_NOT_A_USER);
    assert!(is_user_approved(user), E_VOTER_NOT_APPROVED);

    let now = tx::epoch_timestamp_ms(ctx);

    if (product.remaining == 0) {
        event::emit(Rejected {
            product: obj::uid_to_address(&product.id),
            stage_index: product.stage,
            actor,
            actor_role,
            reason: string::utf8(b"COMPLETED"),
            time: now,
        });
        abort E_PRODUCT_COMPLETED
    };

    let computed = hash::sha3_256(preimage);

    debug::print(&computed);
    debug::print(&product.head_hash);
    if (!vector_eq(&computed, &product.head_hash)) {
        event::emit(Rejected {
            product: obj::uid_to_address(&product.id),
            stage_index: product.stage,
            actor,
            actor_role,
            reason: string::utf8(b"HASH_MISMATCH"),
            time: now,
        });
        abort E_HASH_MISMATCH
    };

    // Resolve expected role/name for this stage (if configured)
    let (stage_name, expected_role) = resolve_stage(product);

    debug::print(&string::utf8(b"Stage and Role:"));
    debug::print(&stage_name);
    debug::print(&expected_role);

    product.head_hash = preimage;
    product.remaining = product.remaining - 1;

    let stage_before = product.stage;
    product.stage = product.stage + 1;

    // Role check: soft validation (we don't abort, we just flag in the event)
    let ok_role = if (string::length(&expected_role) == 0) {
        true
    } else {
        &actor_role == &expected_role
    };

    event::emit(Advanced {
        product: obj::uid_to_address(&product.id),
        stage_index: stage_before,
        stage_name,
        expected_role,
        actor,
        actor_role,
        location_tag,
        ok_role,
        time: now,
    });
}

/// Variant of verify_and_advance that also transfers the Product object to a new owner after successful advancement.
/// This integrates full object ownership transfer (using transfer::transfer) with stage progression, common in supply chain scenarios where possession changes hands.
/// The logical current_owner field is also updated to match the new owner.
#[allow(lint(custom_state_change))]
public fun verify_and_advance_and_transfer(
    registry: &ParticipantRegistry,
    user: &User,
    mut product: Product,
    preimage: vector<u8>,
    actor_role: string::String,
    location_tag: option::Option<string::String>,
    new_owner: address,
    ctx: &mut TxContext,
) {
    verify_and_advance(registry, user, &mut product, preimage, actor_role, location_tag, ctx);
    set_owner(&mut product, new_owner, ctx);
    transfer::transfer(product, new_owner);
}

/// Helper: compare vectors byte by byte
fun vector_eq(a: &vector<u8>, b: &vector<u8>): bool {
    if (vector::length(a) != vector::length(b)) return false;
    let mut i = 0;
    let n = vector::length(a);
    while (i < n) {
        if (*vector::borrow(a, i) != *vector::borrow(b, i)) return false;
        i = i + 1
    };
    true
}

/// Pull expected stage name/role if configured; else return empty strings
fun resolve_stage(product: &Product): (string::String, string::String) {
    let mut name = string::utf8(b"");
    let mut role = string::utf8(b"");
    let n_names = vector::length(&product.stage_names);
    let n_roles = vector::length(&product.stage_roles);

    if (n_names != 0 && (product.stage as u64) < n_names) {
        name = *vector::borrow(&product.stage_names, product.stage as u64);
    };

    if (n_roles != 0 && (product.stage as u64) < n_roles) {
        role = *vector::borrow(&product.stage_roles, product.stage as u64);
    };

    (name, role)
}

// Getter functions for reading product data
public fun get_sku(product: &Product): &string::String {
    &product.sku
}

public fun get_batch_id(product: &Product): &string::String {
    &product.batch_id
}

public fun get_current_stage(product: &Product): u32 {
    product.stage
}

public fun get_remaining_steps(product: &Product): u32 {
    product.remaining
}

public fun get_head_hash(product: &Product): &vector<u8> {
    &product.head_hash
}
