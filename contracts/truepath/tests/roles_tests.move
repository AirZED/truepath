#[test_only]
module truepath::roles_tests;

use bridge::bridge_env::scenario;
use std::option;
use std::string::utf8;
use std::vector;
use sui::coin::{Self as coin, Coin};
use sui::sui::SUI;
use sui::table;
use sui::test_scenario::{Self as ts, Scenario};
use sui::test_utils;
use sui::tx_context::TxContext;
use truepath::roles::{
    Self,
    ParticipantRegistry,
    Role,
    init_for_test,
    is_user_approved,
    get_user_total_vote_weight,
    get_user_endorsers
};

const USER1_ADDR: address = @0xB;
const USER2_ADDR: address = @0xC;
const ENDORSER1_ADDR: address = @0xD;
const ENDORSER2_ADDR: address = @0xE;

// Error codes for assertions
const EWrongRoleCount: u64 = 0;
const EWrongTrustScore: u64 = 1;
const EHasNoRole: u64 = 2;
const EHasRole: u64 = 3;
const EWrongParticipantCount: u64 = 4;
const EPermissionDenied: u64 = 5;
const EWrongExpiration: u64 = 6;
const EWrongApproved: u64 = 7;
const EWrongVoteWeight: u64 = 8;
const EWrongEndorserCount: u64 = 9;

#[test]
fun test_create_role() {
    let mut scenario = ts::begin(USER1_ADDR);
    let ctx = scenario.ctx();
    roles::init_for_test(ctx);
    ts::next_tx(&mut scenario, USER1_ADDR);
    {
        let mut registry = ts::take_shared<ParticipantRegistry>(&scenario);

        // Create a coin with sufficient value for registration fee (1 SUI = 1,000,000,000 MIST)
        let payment = coin::mint_for_testing(1000000000, ts::ctx(&mut scenario));

        let mut payment_option = option::some(payment);
        test_utils::print(b"Payment coin value: 1000000000 MIST (1 SUI)");

        roles::register_user(
            &mut registry,
            b"MANUFACTURER".to_string(),
            utf8(b"Manufacturer"),
            utf8(b"Initial manufacturer for bootstrapping"),
            &mut payment_option,
            ts::ctx(&mut scenario),
        );

        if (option::is_some(&payment_option)) {
            let leftover = option::extract(&mut payment_option);
            coin::destroy_zero(leftover);
        };
        option::destroy_none(payment_option);
        ts::return_shared(registry);
    };
    ts::next_tx(&mut scenario, USER1_ADDR);
    {
        let registry = ts::take_shared<ParticipantRegistry>(&scenario);

        let users = roles::get_all_participants(&registry);
        assert!(vector::length(users) == 1, EWrongParticipantCount);
        let user1 = vector::borrow(users, 0);
        assert!(*user1 == USER1_ADDR, EWrongParticipantCount);

        let role = roles::has_role(
            &registry,
            USER1_ADDR,
            b"MANUFACTURER".to_string(),
            ts::ctx(&mut scenario),
        );
        assert!(role, EHasNoRole);

        ts::return_shared(registry);
    };
    ts::end(scenario);
}

#[test]
fun test_vote_and_unvote() {
    let mut scenario = ts::begin(USER1_ADDR);
    let ctx = scenario.ctx();
    roles::init_for_test(ctx);

    // Register USER1 as MANUFACTURER
    ts::next_tx(&mut scenario, USER1_ADDR);
    {
        let mut registry = ts::take_shared<ParticipantRegistry>(&scenario);
       
        let payment = coin::mint_for_testing(1000000000, ts::ctx(&mut scenario));
        let mut payment_option = option::some(payment);

        roles::register_user(
            &mut registry,
            b"MANUFACTURER".to_string(),
            utf8(b"Manufacturer"),
            utf8(b"Initial manufacturer for bootstrapping"),
            &mut payment_option,
            ts::ctx(&mut scenario),
        );

        if (option::is_some(&payment_option)) {
            let leftover = option::extract(&mut payment_option);
            coin::destroy_zero(leftover);
        };
        option::destroy_none(payment_option);
        ts::return_shared(registry);
    };

    // // Update USER1 trust score to 10
    // ts::next_tx(&mut scenario, USER1_ADDR);
    // {
    //     let mut registry = ts::take_shared<ParticipantRegistry>(&scenario);
    //     roles::update_trust_score(&mut registry, USER1_ADDR, 10, ts::ctx(&mut scenario));
    //     ts::return_shared(registry);
    // };

    // Register USER2 as SHIPPER with endorser USER1
    ts::next_tx(&mut scenario, USER2_ADDR);
    {
        let mut registry = ts::take_shared<ParticipantRegistry>(&scenario);
      
        let payment = coin::mint_for_testing(0, ts::ctx(&mut scenario));
        let mut payment_option = option::some(payment);

        roles::register_user(
            &mut registry,
            b"SHIPPER".to_string(),
            utf8(b"Shipper"),
            utf8(b"Test shipper"),
            &mut payment_option,
            ts::ctx(&mut scenario),
        );

        if (option::is_some(&payment_option)) {
            let leftover = option::extract(&mut payment_option);
            coin::destroy_zero(leftover);
        };
        option::destroy_none(payment_option);
        ts::return_shared(registry);
    };

    // Register ENDORSER1 as DISTRIBUTOR with endorser USER1
    ts::next_tx(&mut scenario, ENDORSER1_ADDR);
    {
        let mut registry = ts::take_shared<ParticipantRegistry>(&scenario);
      
        let payment = coin::mint_for_testing(0, ts::ctx(&mut scenario));
        let mut payment_option = option::some(payment);

        roles::register_user(
            &mut registry,
            b"DISTRIBUTOR".to_string(),
            utf8(b"Distributor"),
            utf8(b"Test distributor"),
            &mut payment_option,
            ts::ctx(&mut scenario),
        );

        if (option::is_some(&payment_option)) {
            let leftover = option::extract(&mut payment_option);
            coin::destroy_zero(leftover);
        };
        option::destroy_none(payment_option);
        ts::return_shared(registry);
    };

    // Check initial state for USER2
    ts::next_tx(&mut scenario, USER1_ADDR);
    {
        let registry = ts::take_shared<ParticipantRegistry>(&scenario);
        let user = table::borrow(roles::get_registry(&registry), USER2_ADDR);
        assert!(is_user_approved(user), EWrongApproved);
        assert!(get_user_total_vote_weight(user)== 0, EWrongVoteWeight);
        assert!(vector::length(get_user_endorsers(user)) == 0, EWrongEndorserCount);
        let role = roles::has_role(
            &registry,
            USER2_ADDR,
            b"SHIPPER".to_string(),
            ts::ctx(&mut scenario),
        );
        assert!(role, EHasNoRole);
        ts::return_shared(registry);
    };

    // Vote for USER2 from ENDORSER1
    ts::next_tx(&mut scenario, ENDORSER1_ADDR);
    {
        let mut registry = ts::take_shared<ParticipantRegistry>(&scenario);
        roles::vote_for_user(&mut registry, USER2_ADDR, ts::ctx(&mut scenario));
        ts::return_shared(registry);
    };

    // Check state after vote
    ts::next_tx(&mut scenario, USER1_ADDR);
    {
        let registry = ts::take_shared<ParticipantRegistry>(&scenario);
        let user = table::borrow(roles::get_registry(&registry), USER2_ADDR);
        assert!(is_user_approved(user), EWrongApproved);

        assert!(get_user_total_vote_weight(user) == 1, EWrongVoteWeight);
        assert!(vector::length(get_user_endorsers(user)) == 1, EWrongEndorserCount);
        ts::return_shared(registry);
    };

    // Unvote for USER2 from ENDORSER1
    ts::next_tx(&mut scenario, ENDORSER1_ADDR);
    {
        let mut registry = ts::take_shared<ParticipantRegistry>(&scenario);
        roles::unvote_for_user(&mut registry, USER2_ADDR, ts::ctx(&mut scenario));
        ts::return_shared(registry);
    };

    // Check state after unvote
    ts::next_tx(&mut scenario, USER1_ADDR);
    {
        let registry = ts::take_shared<ParticipantRegistry>(&scenario);
        let user = table::borrow(roles::get_registry(&registry), USER2_ADDR);

        assert!(!is_user_approved(user), EWrongApproved);
        assert!(get_user_total_vote_weight(user)== 0, EWrongVoteWeight);
        assert!(vector::length(get_user_endorsers(user)) == 0, EWrongEndorserCount);
        ts::return_shared(registry);
    };

    ts::end(scenario);
}
