import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { DEFAULT_SITE_SETTINGS } from "@/lib/auth/store";

describe("default GoldCube brand assets", () => {
    it("uses the built-in GoldCube logo for every default brand entry", () => {
        expect(DEFAULT_SITE_SETTINGS.logoUrl).toBe("/logo.svg");
        expect(DEFAULT_SITE_SETTINGS.iconUrl).toBe("/icon.svg");
    });

    it("keeps the web logo and docs logo identical, with the same icon artwork", async () => {
        const [logo, icon, docsLogo] = await Promise.all([readFile(resolve(process.cwd(), "public/logo.svg"), "utf8"), readFile(resolve(process.cwd(), "public/icon.svg"), "utf8"), readFile(resolve(process.cwd(), "../docs/public/logo.svg"), "utf8")]);

        expect(docsLogo).toBe(logo);
        expect(markupShape(icon)).toEqual(markupShape(logo));
        expect(markupShape(logo)).toHaveLength(4);
        expect(logo).toContain("GoldCube logo");
        expect(icon).toContain("GoldCube");
        expect(logo).not.toMatch(/<(?:image|use|foreignObject)\b|(?:href|url)\s*=\s*["']https?:/i);
    });
});

function markupShape(svg: string) {
    return [...svg.matchAll(/<path\b[^>]*\bd="([^"]+)"/g)].map((match) => match[1]);
}
