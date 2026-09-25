import { describe, expect, it, vi } from "vitest";

const sharpMock = vi.hoisted(() => vi.fn());
vi.mock("sharp", () => ({ default: sharpMock }));

import { normalizeGeneratedImageBytes } from "./generated-image-normalizer";

describe("generated image stack-overflow fallback", () => {
    it("keeps provider image bytes when sharp overflows its call stack", async () => {
        const bytes = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M/wHwAF/gL+4q2JAAAAAElFTkSuQmCC", "base64");
        sharpMock.mockImplementation(() => {
            throw new RangeError("Maximum call stack size exceeded");
        });

        await expect(normalizeGeneratedImageBytes(bytes, "image/png", "1024x1024")).resolves.toEqual({
            bytes,
            mimeType: "image/png",
        });
    });

    it("does not hide a stack overflow for bytes that are not an image", async () => {
        const bytes = Buffer.from("not-an-image");
        sharpMock.mockImplementation(() => {
            throw new RangeError("Maximum call stack size exceeded");
        });

        await expect(normalizeGeneratedImageBytes(bytes, "image/png", "1024x1024")).rejects.toThrow("Maximum call stack size exceeded");
    });
});
