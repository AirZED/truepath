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
use truepath::roles::{Self, ParticipantRegistry, RoleCapability, Role, RoleType, init_for_test};

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
        // let minted_payment = ts::take_from_address<Coin<SUI>>(&scenario, USER1_ADDR);
        // transfer::public_transfer(payment, USER1_ADDR);
        test_utils::print(b"Payment coin value: 1000000000 MIST (1 SUI)");

        roles::register_role(
            &mut registry,
            roles::manufacturer_role_type(),
            utf8(b"Manufacturer"),
            utf8(b"Initial manufacturer for bootstrapping"),
            endorsers,
            payment,
            ts::ctx(&mut scenario),
        );
        ts::return_shared(registry);
    };
    // ts::next_tx(&mut scenario, USER1_ADDR);
    {
        // let registry = ts::take_shared<ParticipantRegistry>(&scenario);
        // assert!(
        //     has_role(&registry, USER1_ADDR, utf8(b"MANUFACTURER"), ts::ctx(&mut scenario)),
        //     EHasNoRole,
        // );
        //  assert!(roles::get_trust_score(&registry, USER1_ADDR) == 1, EWrongTrustScore);
        //  assert!(roles::get_participant_count(&registry) == 2, EWrongParticipantCount);
        //  ts::return_shared(registry);
    };
    ts::end(scenario);
}
