#[test_only]
module truepath::truepath_tests;

use std::hash::sha3_256;
use sui::test_scenario;
use sui::test_utils;
use truepath::truepath::{Self, Product};

#[test]
fun test_create_product() {
    test_utils::print(b"=== Starting Product Creation Test ===");

  
    let user = @0xCa;
    let mut scenario = test_scenario::begin(user);
    let sku = b"LAPTOP-DELL-001".to_string();
    let batch_id = b"BATCH-2024-01".to_string();
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

        test_scenario::return_to_address(user, product);
    };
    scenario.end();
}
