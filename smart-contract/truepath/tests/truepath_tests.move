#[test_only]
module truepath::truepath_tests;

use std::hash::sha3_256;
use std::option;
use std::string;
use std::vector;
use sui::test_scenario;
use sui::test_utils;
use truepath::truepath::{Self, Product};

#[test]
fun test_create_product() {
    test_utils::print(b"=== Starting Product Creation Test ===");

    let seed = b"manufacturer_secret_123";
    let h1 = sha3_256(seed); // Manufacturer's code
    let h2 = sha3_256(h1); // Shipper's code
    let h3 = sha3_256(h2); // Distributor's code
    let h4 = sha3_256(h3); // Retailer's code
    let h5 = sha3_256(h4); // Customer's code

    let user = @0xCa;
    let mut scenario = test_scenario::begin(user);
    let sku = b"LAPTOP-DELL-001".to_string();
    let batch_id = b"BATCH-2024-01".to_string();
    let head_hash = h5;
    let total_steps = 5;
    let stage_names = vector[
        b"MANUFACTURED".to_string(),
        b"SHIPPED".to_string(),
        b"RECEIVED".to_string(),
        b"RETAIL".to_string(),
        b"SOLD".to_string(),
    ];
    let stage_roles = vector[
        b"MFR".to_string(),
        b"3PL".to_string(),
        b"DIST".to_string(),
        b"RETAIL".to_string(),
        b"CUSTOMER".to_string(),
    ];

    {
        let ctx = scenario.ctx();
        truepath::mint_product(
            sku,
            batch_id,
            head_hash,
            total_steps,
            stage_names,
            stage_roles,
            user,
            ctx,
        );
    };

    scenario.next_tx(user);
    {
        let product = test_scenario::take_from_address<Product>(&scenario, user);

        assert!(product.get_sku()==b"LAPTOP-DELL-001".to_string(), 1);
        assert!(product.get_head_hash() == sha3_256(h4), 2);

        test_scenario::return_to_address(user, product);
    };
    scenario.end();
}

#[test]
fun test_verify_and_advance() {
    test_utils::print(b"=== Testing Hash Chain Advancement ===");

    let seed = b"manufacturer_secret_123";
    let h1 = sha3_256(seed); // Manufacturer's code
    let h2 = sha3_256(h1); // Distributor's code
    let h3 = sha3_256(h2); // Customer's code

    let user = @0xCa;
    let mut scenario = test_scenario::begin(user);
    let sku = b"LAPTOP-DELL-001".to_string();
    let batch_id = b"BATCH-2024-01".to_string();
    let head_hash = h3;
    let total_steps = 3;
    let stage_names = vector[
        b"MANUFACTURED".to_string(),
        b"DISTRIBUTOR".to_string(),
        b"SOLD".to_string(),
    ];
    let stage_roles = vector[b"MFR".to_string(), b"DIST".to_string(), b"CUSTOMER".to_string()];

    {
        let ctx = scenario.ctx();
        truepath::mint_product(
            sku,
            batch_id,
            head_hash,
            total_steps,
            stage_names,
            stage_roles,
            user,
            ctx,
        );
    };

    scenario.next_tx(user);
    {
        let mut product = test_scenario::take_from_address<Product>(&scenario, user);

        let ctx = scenario.ctx();
        truepath::verify_and_advance(
            &mut product,
            h2,
            b"MFR".to_string(),
            option::some(b"Abuja Port".to_string()),
            ctx,
        );

        assert!(truepath::get_current_stage(&product)==1, 3);
        assert!(truepath::get_remaining_steps(&product)==2, 4);

        test_scenario::return_to_address(user, product);
    };

    scenario.next_tx(user);
    {
        let mut product = test_scenario::take_from_address<Product>(&scenario, user);

        let ctx = scenario.ctx();
        truepath::verify_and_advance(
            &mut product,
            h1,
            b"DIST".to_string(),
            option::some(b"Lagos Port".to_string()),
            ctx,
        );

        assert!(truepath::get_current_stage(&product)==2, 5);
        assert!(truepath::get_remaining_steps(&product)==1, 6);

        test_scenario::return_to_address(user, product);
    };
    scenario.end();
}
