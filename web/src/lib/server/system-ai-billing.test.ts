import { describe, expect, it } from "vitest";

import {
    hasSystemAiCharge,
    readSystemAiBilling,
    readSystemAiModelHeader,
    readVerifiedSystemAiBusinessRequestId,
    SYSTEM_AI_LOGICAL_MODEL_HEADER,
    SYSTEM_AI_UPSTREAM_MODEL_HEADER,
    systemAiBillingHeaders,
    systemAiIdempotencyKey,
    systemAiPointsIdempotencyKey,
    systemAiRequestFingerprint,
} from "./system-ai-billing";

describe("system AI billing helpers", () => {
    it("rejects malformed encoded values without decoding unmarked legacy percent literals", () => {
        const headers = new Headers({ [SYSTEM_AI_UPSTREAM_MODEL_HEADER]: "%ZZ", [`${SYSTEM_AI_UPSTREAM_MODEL_HEADER}-encoding`]: "uri-utf8" });
        expect(readSystemAiModelHeader(headers, SYSTEM_AI_UPSTREAM_MODEL_HEADER)).toBe("");
        headers.delete(`${SYSTEM_AI_UPSTREAM_MODEL_HEADER}-encoding`);
        expect(readSystemAiModelHeader(headers, SYSTEM_AI_UPSTREAM_MODEL_HEADER)).toBe("%ZZ");
    });

    it("reproduces the raw Chinese model ByteString failure and round-trips encoded model identities", () => {
        const upstream = "wan3-1080特价";
        const logical = "视频模型";
        expect(() => new Headers({ [SYSTEM_AI_UPSTREAM_MODEL_HEADER]: upstream })).toThrow(TypeError);
        const headers = new Headers(systemAiBillingHeaders(logical, "fixture-request", upstream));
        expect(readSystemAiModelHeader(headers, SYSTEM_AI_UPSTREAM_MODEL_HEADER)).toBe(upstream);
        expect(readSystemAiModelHeader(headers, SYSTEM_AI_LOGICAL_MODEL_HEADER)).toBe(logical);
        expect(readVerifiedSystemAiBusinessRequestId(headers, logical, upstream)).toBe("fixture-request");
        expect(readVerifiedSystemAiBusinessRequestId(headers, logical, encodeURIComponent(upstream))).toBeUndefined();
    });

    it.each(["ascii-model", "model%20literal", "model%ZZ", "uri-utf8:%E7%89%B9", "特价%20literal"])("preserves literal model identity %s", (model) => {
        const headers = new Headers(systemAiBillingHeaders(model, "fixture-request", model));
        expect(readSystemAiModelHeader(headers, SYSTEM_AI_UPSTREAM_MODEL_HEADER)).toBe(model);
        expect(readSystemAiModelHeader(headers, SYSTEM_AI_LOGICAL_MODEL_HEADER)).toBe(model);
        expect(readVerifiedSystemAiBusinessRequestId(headers, model, model)).toBe("fixture-request");
        if (/^[\x20-\x7e]+$/.test(model)) {
            expect(headers.get(SYSTEM_AI_UPSTREAM_MODEL_HEADER)).toBe(model);
            expect(headers.has(`${SYSTEM_AI_UPSTREAM_MODEL_HEADER}-encoding`)).toBe(false);
        }
    });

    it("preserves a zero-cost consumption record so its quota can be refunded", () => {
        const billing = readSystemAiBilling(new Headers({ "x-vozeb-pro-points-cost": "0", "x-vozeb-pro-points-record-id": "points-free-text" }));

        expect(billing).toEqual({ pointsCost: 0, pointsRecordId: "points-free-text" });
        expect(hasSystemAiCharge(billing)).toBe(true);
    });

    it("creates stable scoped idempotency headers without exposing source identifiers", () => {
        const first = systemAiIdempotencyKey("workbench-plan", "user-one", "request-one", "image", "channel-one");
        const second = systemAiIdempotencyKey("workbench-plan", "user-one", "request-one", "image", "channel-one");
        const headers = new Headers(systemAiBillingHeaders("planner", first, "vendor-text"));

        expect(first).toBe(second);
        expect(first).toMatch(/^workbench-plan:[a-f0-9]{32}$/);
        expect(headers.get("x-vozeb-pro-logical-model")).toBe("planner");
        expect(headers.get("x-vozeb-pro-points-idempotency-key")).toBe(first);
        expect(headers.get("x-vozeb-pro-points-signature")).toMatch(/^[A-Za-z0-9_-]+$/);
        expect(readVerifiedSystemAiBusinessRequestId(headers, "planner", "vendor-text")).toBe(first);

        headers.set("x-vozeb-pro-points-idempotency-key", `${first}:forged`);
        expect(readVerifiedSystemAiBusinessRequestId(headers, "planner", "vendor-text")).toBeUndefined();
    });

    it("binds the local billing key and request fingerprint to separate identities", () => {
        const identity = { userId: "user-one", businessRequestId: "task-one", logicalModel: "writer", channelId: "channel-one", upstreamModel: "vendor-text", callType: "text:create:/chat/completions" };
        const firstKey = systemAiPointsIdempotencyKey(identity);
        const secondKey = systemAiPointsIdempotencyKey(identity);
        const firstFingerprint = systemAiRequestFingerprint({
            method: "POST",
            callType: identity.callType,
            logicalModel: identity.logicalModel,
            channelId: identity.channelId,
            upstreamModel: identity.upstreamModel,
            usageKind: "text",
            amount: 1,
            bodyDigest: "a".repeat(64),
        });
        const secondFingerprint = systemAiRequestFingerprint({
            method: "POST",
            callType: identity.callType,
            logicalModel: identity.logicalModel,
            channelId: identity.channelId,
            upstreamModel: identity.upstreamModel,
            usageKind: "text",
            amount: 1,
            bodyDigest: "b".repeat(64),
        });

        expect(firstKey).toBe(secondKey);
        expect(firstKey).toMatch(/^system-ai:[a-f0-9]{64}$/);
        expect(firstFingerprint).not.toBe(secondFingerprint);
    });
});
