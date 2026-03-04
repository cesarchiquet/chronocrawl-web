import { describe, expect, it } from "vitest";
import { parseMonitorRunRequestBody } from "../lib/monitorRunRequest";

describe("parseMonitorRunRequestBody", () => {
  it("parses valid continueQueue + severities", () => {
    const parsed = parseMonitorRunRequestBody({
      continueQueue: true,
      severities: ["high", "medium"],
    });

    expect("code" in parsed).toBe(false);
    if ("code" in parsed) return;
    expect(parsed.continueQueue).toBe(true);
    expect(parsed.selectedSeverities).toEqual(["medium", "high"]);
  });

  it("supports minSeverity override", () => {
    const parsed = parseMonitorRunRequestBody({
      minSeverity: "high",
    });

    expect("code" in parsed).toBe(false);
    if ("code" in parsed) return;
    expect(parsed.selectedSeverities).toEqual(["high"]);
  });

  it("defaults to MEDIUM + HIGH", () => {
    const parsed = parseMonitorRunRequestBody({});
    expect("code" in parsed).toBe(false);
    if ("code" in parsed) return;
    expect(parsed.selectedSeverities).toEqual(["medium", "high"]);
  });

  it("returns INVALID_BODY on invalid continueQueue", () => {
    const parsed = parseMonitorRunRequestBody({
      continueQueue: "yes",
    });

    expect("code" in parsed).toBe(true);
    if (!("code" in parsed)) return;
    expect(parsed.code).toBe("INVALID_BODY");
  });
});
