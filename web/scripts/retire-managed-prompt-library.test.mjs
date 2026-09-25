import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { describe, expect, it } from "vitest";

const script = resolve("scripts/retire-managed-prompt-library.mjs");

describe("offline managed prompt retirement", () => {
    it("inventories, backs up, removes only managed library rows, and rolls back", () => {
        const directory = mkdtempSync(join(tmpdir(), "prompt-retirement-"));
        const file = join(directory, "prompts.json");
        const evidence = join(directory, "private-evidence");
        const original = {
            version: 1,
            prompts: [
                { id: "managed", scope: "library", source: "tigerowo/awesome-gpt-image-2-prompts:commit:v3", prompt: "aggregate" },
                { id: "legacy", scope: "library", source: "vozeb-pro/original-author-prompts:old", prompt: "legacy" },
                { id: "custom", scope: "library", prompt: "own" },
                { id: "personal", scope: "user", ownerUserId: "u1", source: "tigerowo/awesome-gpt-image-2-prompts:commit:v3", prompt: "copied" },
            ],
            seedSources: ["tigerowo/awesome-gpt-image-2-prompts:commit:v3", "other"],
        };
        writeFileSync(file, JSON.stringify(original));
        const run = (action) => execFileSync(process.execPath, [script, action, "--provider", "file", "--evidence", evidence, "--file", file], { encoding: "utf8" });

        expect(JSON.parse(run("inventory"))).toMatchObject({ managed: 2, personal: 1, sources: 1 });
        const plan = JSON.parse(readFileSync(join(evidence, "plan.json"), "utf8"));
        expect(plan.identities).toEqual([{ id: "legacy", source: "vozeb-pro/original-author-prompts:old" }, { id: "managed", source: "tigerowo/awesome-gpt-image-2-prompts:commit:v3" }]);
        expect(JSON.parse(run("apply"))).toMatchObject({ removed: 2 });
        expect(JSON.parse(readFileSync(file, "utf8")).prompts.map((prompt) => prompt.id)).toEqual(["custom", "personal"]);
        expect(JSON.parse(run("rollback"))).toMatchObject({ restored: 2 });
        expect(JSON.parse(readFileSync(file, "utf8"))).toEqual(original);
    });
});
