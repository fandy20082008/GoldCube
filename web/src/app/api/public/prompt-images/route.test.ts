import { describe, expect, it } from "vitest";

import { GET } from "./route";

describe("retired aggregate prompt cover endpoint", () => {
    it("never fetches upstream images, including former valid paths", async () => {
        const response = await GET();
        expect(response.status).toBe(410);
        expect(response.headers.get("cache-control")).toBe("no-store");
    });
});
