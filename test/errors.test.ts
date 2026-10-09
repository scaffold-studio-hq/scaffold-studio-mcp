import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { withToolError } from "../src/utils/errors.ts";

describe("withToolError", () => {
  it("returns successful result when fn succeeds", async () => {
    const res = await withToolError("Failed", async () => {
      return { success: true, data: "ok" };
    });
    assert.deepEqual(res, { success: true, data: "ok" });
  });

  it("extracts error message from caught Error instance", async () => {
    const res = await withToolError("Failed operation", async () => {
      throw new Error("Custom invariant failure");
    });
    assert.deepEqual(res, { success: false, error: "Custom invariant failure" });
  });

  it("falls back to default message when Error has empty message", async () => {
    const res = await withToolError("Default fallback", async () => {
      throw new Error("");
    });
    assert.deepEqual(res, { success: false, error: "Default fallback" });
  });

  it("handles string throws", async () => {
    const res = await withToolError("Default fallback", async () => {
      throw "Raw string error";
    });
    assert.deepEqual(res, { success: false, error: "Raw string error" });
  });

  it("handles arbitrary unknown throws with fallback", async () => {
    const res = await withToolError("Default fallback", async () => {
      throw { random: 123 };
    });
    assert.deepEqual(res, { success: false, error: "Default fallback" });
  });
});
