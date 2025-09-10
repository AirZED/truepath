module truepath::truepath2;

use std::debug;
use std::string;
use sui::address;
use sui::balance;
use sui::clock::{Self as clock, Clock};
use sui::coin::{Self as coin, Coin};
use sui::event;
use sui::object::{Self as obj, UID, ID};
use sui::sui::SUI;
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

// ==========================
// Constants & Error Codes
// ==========================
const ESCROW_EXPIRATION: u64 = 604800000; // 7 days in ms

const E_FORBIDDEN: u64 = 403; // insufficient permissions
const E_NOT_A_USER: u64 = 416; // not registered
const E_VOTER_NOT_APPROVED: u64 = 419; // user not approved
const E_INVALID_STAGE_CONFIG: u64 = 1; // stage names length mismatch
const E_INVALID_ROLE_CONFIG: u64 = 2; // stage roles length mismatch
const E_PRODUCT_COMPLETED: u64 = 10; // no remaining steps
const E_INSUFFICIENT_PAYMENT: u64 = 408; // bid < price
const E_ESCROW_COMPLETED: u64 = 420; // escrow already closed
const E_ESCROW_NOT_EXPIRED: u64 = 421; // not yet expired
const E_INVALID_SENDER: u64 = 422; // invalid sender
const E_INVALID_PRICE: u64 = 412; // price must be > 0
const E_BATCH_MISMATCH: u64 = 423; // batch input length mismatch

// ==========================
// Data Structures
// ==========================
public struct Product has key, store {
    id: UID,
    // Business identifiers
    sku: string::String,
    batch_id: string::String,
    // Pricing & lifecycle
    price: u64, // in MIST
    remaining: u32, // steps left
    stage: u32, // 0-based index
    stage_names: vector<string::String>,
    stage_roles: vector<string::String>,
    current_owner: address,
}

public struct Escrow has key, store {
    id: UID,
    product_id: ID,
    bidder: address,
    seller: address,
    payment: balance::Balance<SUI>,
    expiration: u64,
    completed: bool,
}

// ==========================
// Events
// ==========================
public struct Minted has copy, drop, store {
    product: address,
    sku: string::String,
    batch_id: string::String,
    total_steps: u32,
    price: u64,
    owner: address,
    time: u64,
    qr_code: string::String,
}

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

public struct Rejected has copy, drop, store {
    product: address,
    stage_index: u32,
    actor: address,
    actor_role: string::String,
    reason: string::String, // "COMPLETED" | "ROLE_MISMATCH"
    time: u64,
}

public struct BidCreated has copy, drop, store {
    escrow: address,
    product: address,
    bidder: address,
    seller: address,
    amount: u64,
    time: u64,
}

public struct BidApproved has copy, drop, store {
    escrow: address,
    product: address,
    bidder: address,
    seller: address,
    amount_charged: u64,
    refund: u64,
    time: u64,
}

public struct BidRejected has copy, drop, store {
    escrow: address,
    product: address,
    bidder: address,
    seller: address,
    reason: string::String, // "REJECTED" | "TIMEOUT"
    time: u64,
}

public struct PriceUpdated has copy, drop, store {
    product: address,
    old_price: u64,
    new_price: u64,
    updated_by: address,
    time: u64,
}

// ==========================
// Minting & Admin
// ==========================
public fun mint_product(
    registry: &ParticipantRegistry,
    user: &User,
    sku: string::String,
    batch_id: string::String,
    price: u64,
    total_steps: u32,
    stage_names: vector<string::String>,
    stage_roles: vector<string::String>,
    ctx: &mut TxContext,
): Product {
    let owner = tx::sender(ctx);
    assert!(verify_user(user, owner), E_FORBIDDEN);
    assert!(is_user_in_registry(registry, owner), E_NOT_A_USER);
    assert!(has_role(registry, owner, string::utf8(b"MANUFACTURER"), user, ctx), E_FORBIDDEN);
    assert!(price > 0, E_INVALID_PRICE);

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
        price,
        remaining: total_steps,
        stage: 0,
        stage_names,
        stage_roles,
        current_owner: owner,
    };

    let product_id = obj::uid_to_address(&product.id);
    let qr_code = construct_qr_code(product_id, &product.sku, &product.batch_id);

    debug::print(&product);

    event::emit(Minted {
        product: product_id,
        sku: product.sku,
        batch_id: product.batch_id,
        total_steps,
        price: product.price,
        owner,
        time: tx::epoch_timestamp_ms(ctx),
        qr_code,
    });

    product
}

public fun update_price(
    registry: &ParticipantRegistry,
    user: &User,
    product: &mut Product,
    new_price: u64,
    ctx: &mut TxContext,
) {
    let actor = tx::sender(ctx);
    assert!(verify_user(user, actor), E_FORBIDDEN);
    assert!(is_user_in_registry(registry, actor), E_NOT_A_USER);
    assert!(is_user_approved(user), E_VOTER_NOT_APPROVED);
    assert!(product.current_owner == actor, E_FORBIDDEN);
    assert!(new_price > 0, E_INVALID_PRICE);

    let (_, expected_role) = resolve_stage(product);
    let ok_role = if (string::length(&expected_role) == 0) { true } else {
        has_role(registry, actor, expected_role, user, ctx)
    };
    assert!(ok_role, E_FORBIDDEN);

    let old_price = product.price;
    product.price = new_price;

    event::emit(PriceUpdated {
        product: obj::uid_to_address(&product.id),
        old_price,
        new_price,
        updated_by: actor,
        time: tx::epoch_timestamp_ms(ctx),
    });
}

public fun set_owner(product: &mut Product, new_owner: address, ctx: &mut TxContext) {
    assert!(product.current_owner == tx::sender(ctx), E_FORBIDDEN);
    product.current_owner = new_owner;
}

// ==========================
// Lifecycle Advancement (no hash-chain)
// ==========================
public fun verify_and_advance(
    registry: &ParticipantRegistry,
    user: &User,
    product: &mut Product,
    actor_role: string::String, // for logging only
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

    let (stage_name, expected_role) = resolve_stage(product);

    // Enforce role-based progression
    let ok_role = if (string::length(&expected_role) == 0) { true } else {
        has_role(registry, actor, expected_role, user, ctx)
    };
    if (!ok_role) {
        event::emit(Rejected {
            product: obj::uid_to_address(&product.id),
            stage_index: product.stage,
            actor,
            actor_role,
            reason: string::utf8(b"ROLE_MISMATCH"),
            time: now,
        });
        abort E_FORBIDDEN
    };

    product.remaining = product.remaining - 1;
    let stage_before = product.stage;
    product.stage = product.stage + 1;

    event::emit(Advanced {
        product: obj::uid_to_address(&product.id),
        stage_index: stage_before,
        stage_name,
        expected_role,
        actor,
        actor_role,
        location_tag,
        ok_role: true,
        time: now,
    });
}

// ==========================
// Escrow / Bids
// ==========================
public fun create_bid(
    registry: &ParticipantRegistry,
    user: &User,
    product_id: ID,
    seller: address,
    payment: Coin<SUI>,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    let bidder = tx::sender(ctx);
    assert!(verify_user(user, bidder), E_FORBIDDEN);
    assert!(is_user_in_registry(registry, bidder), E_NOT_A_USER);
    assert!(is_user_approved(user), E_VOTER_NOT_APPROVED);
    assert!(bidder != seller, E_INVALID_SENDER);

    let now = clock::timestamp_ms(clock);
    let expiration = now + ESCROW_EXPIRATION;

    let payment_balance = coin::into_balance(payment);

    let escrow = Escrow {
        id: obj::new(ctx),
        product_id,
        bidder,
        seller,
        payment: payment_balance,
        expiration,
        completed: false,
    };

    event::emit(BidCreated {
        escrow: obj::uid_to_address(&escrow.id),
        product: address::from_bytes(obj::id_to_bytes(&product_id)),
        bidder,
        seller,
        amount: balance::value(&escrow.payment),
        time: now,
    });

    transfer::public_share_object(escrow);
}

public fun batch_create_bid(
    registry: &ParticipantRegistry,
    user: &User,
    product_ids: vector<ID>,
    seller: address,
    mut payments: vector<Coin<SUI>>, // must match product_ids length
    clock: &Clock,
    ctx: &mut TxContext,
) {
    let bidder = tx::sender(ctx);
    assert!(verify_user(user, bidder), E_FORBIDDEN);
    assert!(is_user_in_registry(registry, bidder), E_NOT_A_USER);
    assert!(is_user_approved(user), E_VOTER_NOT_APPROVED);
    assert!(bidder != seller, E_INVALID_SENDER);

    let len = vector::length(&product_ids);
    assert!(len == vector::length(&payments), E_BATCH_MISMATCH);

    let now = clock::timestamp_ms(clock);
    let expiration = now + ESCROW_EXPIRATION;

    // Remove from the back to avoid index shifting
    let mut i = len;
    while (i > 0) {
        i = i - 1;
        let product_id = *vector::borrow(&product_ids, i);
        let payment = vector::remove(&mut payments, i);

        let payment_balance = coin::into_balance(payment);

        let escrow = Escrow {
            id: obj::new(ctx),
            product_id,
            bidder,
            seller,
            payment: payment_balance,
            expiration,
            completed: false,
        };

        event::emit(BidCreated {
            escrow: obj::uid_to_address(&escrow.id),
            product: address::from_bytes(obj::id_to_bytes(&product_id)),
            bidder,
            seller,
            amount: balance::value(&escrow.payment),
            time: now,
        });

        transfer::public_share_object(escrow);
    };
    vector::destroy_empty(payments);
}

#[allow(lint(custom_state_change))]
public fun approve_bid(
    registry: &ParticipantRegistry,
    user: &User,
    mut escrow: Escrow,
    mut product: Product,
    actor_role: string::String, // seller's declared role for logging
    location_tag: option::Option<string::String>,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    let seller = tx::sender(ctx);
    assert!(escrow.completed == false, E_ESCROW_COMPLETED);
    assert!(product.current_owner == seller, E_FORBIDDEN);
    assert!(escrow.product_id == obj::uid_as_inner(&product.id), E_FORBIDDEN);
    assert!(escrow.seller == seller, E_INVALID_SENDER);
    assert!(balance::value(&escrow.payment) >= product.price, E_INSUFFICIENT_PAYMENT);

    // Advance stage (role must match current expected stage role)
    verify_and_advance(registry, user, &mut product, actor_role, location_tag, ctx);

    // Transfer ownership to bidder
    set_owner(&mut product, escrow.bidder, ctx);

    // Pay seller product.price and refund any overpayment to bidder
    let total_locked = balance::value(&escrow.payment);
    let to_seller = coin::take(&mut escrow.payment, product.price, ctx);
    transfer::public_transfer(to_seller, seller);

    let mut refund_amt: u64 = 0;
    if (total_locked > product.price) {
        refund_amt = total_locked - product.price;
        let refund = coin::take(&mut escrow.payment, refund_amt, ctx);
        transfer::public_transfer(refund, escrow.bidder);
    };

    let now = clock::timestamp_ms(clock);
    event::emit(BidApproved {
        escrow: obj::uid_to_address(&escrow.id),
        product: address::from_bytes(obj::id_to_bytes(&escrow.product_id)),
        bidder: escrow.bidder,
        seller,
        amount_charged: product.price,
        refund: refund_amt,
        time: now,
    });

    // Transfer product to bidder
    transfer::transfer(product, escrow.bidder);

    // Delete escrow object
    let Escrow {
        id,
        product_id: _,
        bidder: _,
        seller: _,
        payment,
        expiration: _,
        completed: _,
    } = escrow;
    balance::destroy_zero(payment); // Ensure empty balance is destroyed
    obj::delete(id);
}

public fun reject_bid(mut escrow: Escrow, ctx: &mut TxContext) {
    let seller = tx::sender(ctx);
    assert!(escrow.completed == false, E_ESCROW_COMPLETED);
    assert!(escrow.seller == seller, E_INVALID_SENDER);

    let payment_value = balance::value(&escrow.payment);
    let payment = coin::take(&mut escrow.payment, payment_value, ctx);
    transfer::public_transfer(payment, escrow.bidder);

    let now = tx::epoch_timestamp_ms(ctx);
    event::emit(BidRejected {
        escrow: obj::uid_to_address(&escrow.id),
        product: address::from_bytes(obj::id_to_bytes(&escrow.product_id)),
        bidder: escrow.bidder,
        seller,
        reason: string::utf8(b"REJECTED"),
        time: now,
    });

    // Delete escrow object
    let Escrow {
        id,
        product_id: _,
        bidder: _,
        seller: _,
        payment,
        expiration: _,
        completed: _,
    } = escrow;
    balance::destroy_zero(payment); // Ensure empty balance is destroyed
    obj::delete(id);
}

public fun bidder_refund_bid(mut escrow: Escrow, clock: &Clock, ctx: &mut TxContext) {
    let bidder = tx::sender(ctx);
    assert!(escrow.completed == false, E_ESCROW_COMPLETED);
    assert!(bidder == escrow.bidder, E_INVALID_SENDER);
    assert!(clock::timestamp_ms(clock) >= escrow.expiration, E_ESCROW_NOT_EXPIRED);

    let payment_value = balance::value(&escrow.payment);
    let payment = coin::take(&mut escrow.payment, payment_value, ctx);
    transfer::public_transfer(payment, bidder);

    let now = clock::timestamp_ms(clock);
    event::emit(BidRejected {
        escrow: obj::uid_to_address(&escrow.id),
        product: address::from_bytes(obj::id_to_bytes(&escrow.product_id)),
        bidder,
        seller: escrow.seller,
        reason: string::utf8(b"TIMEOUT"),
        time: now,
    });

    // Delete escrow object
    let Escrow {
        id,
        product_id: _,
        bidder: _,
        seller: _,
        payment,
        expiration: _,
        completed: _,
    } = escrow;
    balance::destroy_zero(payment); // Ensure empty balance is destroyed
    obj::delete(id);
}

// ==========================
// Helpers
// ==========================
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

fun construct_qr_code(
    product_id: address,
    sku: &string::String,
    batch_id: &string::String,
): string::String {
    let mut qr_code = address::to_string(product_id);
    string::append_utf8(&mut qr_code, b"?sku=");
    string::append(&mut qr_code, *sku);
    string::append_utf8(&mut qr_code, b"&batch=");
    string::append(&mut qr_code, *batch_id);
    qr_code
}

// ==========================
// Getters
// ==========================
public fun get_sku(product: &Product): &string::String { &product.sku }

public fun get_batch_id(product: &Product): &string::String { &product.batch_id }

public fun get_price(product: &Product): u64 { product.price }

public fun get_current_stage(product: &Product): u32 { product.stage }

public fun get_remaining_steps(product: &Product): u32 { product.remaining }

public fun get_stage_count(product: &Product): u64 { vector::length(&product.stage_roles) }
