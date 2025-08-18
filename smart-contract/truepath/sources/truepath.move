/// Module: truepath
module truepath::truepath;

use std::option;
use std::string;
use std::u32;
use std::vector;
use sui::object::UID;

public struct Product has key, store {
    id: UID,
    // Business identifiers
    sku: string::String,
    batch_id: string::String,
    // evolving one-time code (hash-chain head)
    head_hash: vector<u8>, //starts at h_0
    remaining: u32, //how many preimages left until completion
    stage: u32, //current stage index (0-based)
    stage_names: vector<string::String>, //["MANUFACTURED","SHIPPED","RECEIVED","RETAIL","SOLD"],
    stage_roles: vector<string::String>, // e.g., ["MFR","3PL","DIST","RETAIL","CUSTOMER"]
    current_owner: address,
}

/// Emitted when a product is minted
public struct Minted has drop, store {
    product: address,
    sku: string::String,
    batch_id: string::String,
    total_steps: u32,
    head_hash: vector<u8>,
    owner: address,
    time: u64,
}

/// Emitted on each successful step advance
public struct Advanced has drop, store {
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

///Emitted if someone submits a wrong/old code (out of sync attempts)
public struct Rejected has drop, store {
    product: address,
    stage_index: u32,
    actor: address,
    actor_role: string::String,
    reason: string::String, //"HASH_MISMATCH" | "COMPLETED"
    time: u64,
}
