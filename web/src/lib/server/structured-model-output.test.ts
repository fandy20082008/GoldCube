import { describe, expect, it } from "vitest";

import { extractJsonObjectText, hasIncompleteJsonObject, strictJsonObjectText } from "./structured-model-output";

describe("strictJsonObjectText", () => {
    it("accepts plain or fenced JSON objects", () => {
        expect(strictJsonObjectText('{"ok":true}')).toBe('{"ok":true}');
        expect(strictJsonObjectText('```json\n{"ok":true}\n```')).toBe('{"ok":true}');
    });

    it("rejects prose and JSON arrays", () => {
        expect(strictJsonObjectText('Use this plan: {"ok":true}')).toBe("");
        expect(strictJsonObjectText("[]")).toBe("");
    });

    it("extracts one valid object from provider wrapper prose", () => {
        expect(extractJsonObjectText('结果如下：{"ok":true}\n请审核。')).toBe('{"ok":true}');
        expect(extractJsonObjectText('{"text":"包含 } 字符"}')).toBe('{"text":"包含 } 字符"}');
        expect(extractJsonObjectText("[]")).toBe("");
    });

    it("does not accept malformed strict JSON and repairs a truncated object before domain validation", () => {
        expect(strictJsonObjectText('{"ok":}')).toBe("");
        expect(extractJsonObjectText('{"ok":true')).toBe('{"ok":true}');
    });

    it("repairs the outer root instead of returning its complete nested child", () => {
        const result = JSON.parse(extractJsonObjectText('{"episode":{"outline":"fixture"},"shots":[{"sourceText":"part one"},{"sourceText":"part'));
        expect(result).toMatchObject({ episode: { outline: "fixture" }, shots: [{ sourceText: "part one" }, { sourceText: "part" }] });
        expect(result).not.toHaveProperty("outline");
    });

    it("keeps wrapped nested objects at their intended root", () => {
        expect(JSON.parse(extractJsonObjectText('Result: {"episode":{"outline":"fixture"},"shots":[]} Done.'))).toEqual({ episode: { outline: "fixture" }, shots: [] });
        expect(JSON.parse(extractJsonObjectText('```json\n{"episode":{"outline":"fixture"},"shots":[]}\n```'))).toEqual({ episode: { outline: "fixture" }, shots: [] });
    });

    it("detects an unclosed outer root without confusing braces inside quoted strings", () => {
        expect(hasIncompleteJsonObject('{"episode":{},"shots":[{"text":"half')).toBe(true);
        expect(hasIncompleteJsonObject('{"text":"escaped \\" } and {","shots":[],}')).toBe(false);
        expect(hasIncompleteJsonObject("plain text")).toBe(false);
    });
});
