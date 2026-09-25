import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    list: vi.fn(),
    facets: vi.fn(),
    readJsonDataFile: vi.fn(),
    writeJsonDataFile: vi.fn(),
    postgresEnabled: { value: true },
    ensurePostgresSchema: vi.fn(),
}));

vi.mock("@/lib/server/database", () => ({
    createPostgresRepositories: () => ({ prompts: mocks }),
    ensurePostgresSchema: mocks.ensurePostgresSchema,
    isPostgresDatabaseEnabled: () => mocks.postgresEnabled.value,
}));

vi.mock("@/lib/server/data-adapter", () => ({
    readJsonDataFile: mocks.readJsonDataFile,
    writeJsonDataFile: mocks.writeJsonDataFile,
}));

import { countAllLibraryPrompts, createPrompt, listPrompts, readPromptBackup } from "./store";

describe("prompt store pagination", () => {
    beforeEach(() => {
        mocks.list.mockReset().mockResolvedValue({ items: [], total: 40, page: 2, pageSize: 20 });
        mocks.facets.mockReset().mockResolvedValue({ tags: ["海报"], categories: ["设计"], scopeTotal: 0 });
        mocks.readJsonDataFile.mockReset().mockResolvedValue({ version: 1, prompts: [], seedSources: [] });
        mocks.writeJsonDataFile.mockReset();
        mocks.postgresEnabled.value = true;
        mocks.ensurePostgresSchema.mockReset();
    });

    it("runs only the bounded page query when later pages omit facets", async () => {
        await expect(listPrompts({ scope: "library", keyword: "产品", category: "设计", page: 2, pageSize: 20, includeFacets: false })).resolves.toEqual({
            items: [],
            tags: [],
            categories: [],
            total: 40,
        });

        expect(mocks.list).toHaveBeenCalledWith(expect.objectContaining({ scope: "library", keyword: "产品", category: "设计", page: 2, pageSize: 20 }));
        expect(mocks.facets).not.toHaveBeenCalled();
    });

    it("loads facets together with the first page", async () => {
        const result = await listPrompts({ scope: "library", page: 1, pageSize: 20 });

        expect(result).toMatchObject({ tags: ["海报"], categories: ["设计"], scopeTotal: 0 });
        expect(mocks.facets).toHaveBeenCalledTimes(1);
    });

    it("does not initialize managed seeds for an empty PostgreSQL library", async () => {
        await listPrompts({ scope: "library" });
        await expect(countAllLibraryPrompts()).resolves.toBe(0);
        expect(mocks.ensurePostgresSchema).toHaveBeenCalledTimes(2);
        expect(mocks.list).toHaveBeenCalledTimes(1);
        expect(mocks.facets).toHaveBeenCalledTimes(2);
    });

    it("does not initialize or overwrite a file-backed library on reads", async () => {
        mocks.postgresEnabled.value = false;
        await expect(listPrompts({ scope: "library" })).resolves.toMatchObject({ items: [], total: 0 });
        await expect(countAllLibraryPrompts()).resolves.toBe(0);
        await expect(readPromptBackup()).resolves.toMatchObject({ prompts: [], seedSources: [] });
        expect(mocks.writeJsonDataFile).not.toHaveBeenCalled();
    });

    it("preserves user-created prompts without importing managed seeds", async () => {
        mocks.postgresEnabled.value = false;
        await createPrompt("user", { title: "My prompt", prompt: "Draw a tree" }, "user-1");
        expect(mocks.writeJsonDataFile).toHaveBeenCalledWith("prompts.json", expect.objectContaining({
            prompts: [expect.objectContaining({ scope: "user", ownerUserId: "user-1", title: "My prompt" })],
        }));
    });
});
