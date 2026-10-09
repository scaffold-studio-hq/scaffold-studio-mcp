/**
 * Tests for the registry service utilities (issue #66).
 *
 * Run with: node --test test/registry.test.ts
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { extractContractId } from "../dist/plugins/registry/registry.service.js";

describe("extractContractId", () => {
  const validId1 = "CBCOGWBDGBFWR5LQFKRQUPFIG6OLOON35PBKUPB6C542DFZI3OMBOGHX";
  const validId2 = "CC3SILHAJ5O75KMSJ5J6I5HV753OTPWEVMZUYHS4QEM2ZTISQRAOMMF4";

  it("extracts a valid contract ID from realistic CLI output", () => {
    const cliOutput = `
      Initializing contract deployment...
      Contract successfully deployed!
      Contract ID: ${validId1}
      Gas used: 124500
    `;
    assert.equal(extractContractId(cliOutput), validId1);
  });

  it("extracts the first valid contract ID if multiple are present in standalone form", () => {
    const cliOutput = `
      First contract: ${validId2}
      Second contract: ${validId1}
    `;
    assert.equal(extractContractId(cliOutput), validId2);
  });

  it("rejects invalid alphabet characters", () => {
    const lowercaseId = validId1.toLowerCase();
    assert.equal(extractContractId(lowercaseId), null);

    const invalidCharId = validId1.slice(0, 10) + "I" + validId1.slice(11);
    assert.equal(extractContractId(invalidCharId), null);
  });

  it("rejects 56-character substrings embedded inside a longer token", () => {
    assert.equal(extractContractId(`xyz${validId1}`), null);
    assert.equal(extractContractId(`${validId1}abc`), null);
    assert.equal(extractContractId(`xyz${validId1}abc`), null);
  });

  it("rejects malformed candidates", () => {
    const tooShort = validId1.slice(0, 55);
    const tooLong = validId1 + "A";
    assert.equal(extractContractId(tooShort), null);
    assert.equal(extractContractId(tooLong), null);

    const wrongPrefix = "G" + validId1.slice(1);
    assert.equal(extractContractId(wrongPrefix), null);
  });

  it("returns null when no candidate is found", () => {
    assert.equal(extractContractId("Some random logs without any contract IDs."), null);
  });
});
