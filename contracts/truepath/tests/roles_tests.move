#[test_only]
module truepath::roles_tests;

use bridge::bridge_env::scenario;
use std::option;
use std::string::utf8;
use std::vector;
use sui::coin::{Self as coin, Coin};
use sui::sui::SUI;
use sui::test_scenario::{Self as ts, Scenario};
use sui::test_utils;
use sui::tx_context::TxContext;
use truepath::roles::{Self, ParticipantRegistry, Role, init_for_test};

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

#[test]
fun test_create_role() {
    let mut scenario = ts::begin(USER1_ADDR);
    let ctx = scenario.ctx();
    roles::init_for_test(ctx);
    ts::next_tx(&mut scenario, USER1_ADDR);
    {
        let mut registry = ts::take_shared<ParticipantRegistry>(&scenario);
        let mut endorsers = vector::empty<address>();
        vector::push_back(&mut endorsers, USER1_ADDR);
        // Create a coin with sufficient value for registration fee (1 SUI = 1,000,000,000 MIST)
        let payment = coin::mint_for_testing(1000000000, ts::ctx(&mut scenario));

        let mut payment_option = option::some(payment);
        test_utils::print(b"Payment coin value: 1000000000 MIST (1 SUI)");

        roles::register_user(
            &mut registry,
            b"MANUFACTURER".to_string(),
            utf8(b"Manufacturer"),
            utf8(b"Initial manufacturer for bootstrapping"),
            endorsers,
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
fun test_vote_or_grant_role() {
    let mut scenario = ts::begin(USER1_ADDR);
    let ctx = scenario.ctx();
    roles::init_for_test(ctx);
    ts::next_tx(&mut scenario, USER1_ADDR);
    {
        let mut registry = ts::take_shared<ParticipantRegistry>(&scenario);
        let mut endorsers = vector::empty<address>();
        vector::push_back(&mut endorsers, USER1_ADDR);
        // Create a coin with sufficient value for registration fee (1 SUI = 1,000,000,000 MIST)
        let payment = coin::mint_for_testing(1000000000, ts::ctx(&mut scenario));
        // let minted_payment = ts::take_from_address<Coin<SUI>>(&scenario, USER1_ADDR);
        // transfer::public_transfer(payment, USER1_ADDR);
        test_utils::print(b"Payment coin value: 1000000000 MIST (1 SUI)");

        roles::register_user(
            &mut registry,
            b"MANUFACTURER".to_string(),
            utf8(b"Manufacturer"),
            utf8(b"Initial manufacturer for bootstrapping"),
            endorsers,
            &mut option::some(payment),
            ts::ctx(&mut scenario),
        );
        ts::return_shared(registry);
    };
    ts::next_tx(&mut scenario, USER1_ADDR);
    {
        let registry = ts::take_shared<ParticipantRegistry>(&scenario);

        let users = roles::get_all_participants(&registry);
        assert!(vector::length(users) == 1, EWrongParticipantCount);
        let user1 = vector::borrow(users, 0);

        ts::return_shared(registry);
    // };
// option::destroy_none(payment_option);
    ts::next_tx(&mut scenario, USER2_ADDR);

    ts::end(scenario);
}
