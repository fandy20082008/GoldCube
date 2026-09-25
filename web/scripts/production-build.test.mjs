import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ spawnSync: vi.fn(), writeFileSync: vi.fn() }));
vi.mock("node:child_process", () => ({ spawnSync: mocks.spawnSync }));
vi.mock("node:fs", () => ({ existsSync: () => true, readFileSync: () => Buffer.from("tracked-file-before-build"), writeFileSync: mocks.writeFileSync }));
const originalExitCode = process.exitCode;
const originalSkip = process.env.NEXT_SKIP_BUILD_TYPECHECK;

afterEach(() => {
    process.exitCode = originalExitCode;
    if (originalSkip === undefined) delete process.env.NEXT_SKIP_BUILD_TYPECHECK;
    else process.env.NEXT_SKIP_BUILD_TYPECHECK = originalSkip;
    vi.restoreAllMocks();
    vi.clearAllMocks();
    vi.resetModules();
});

describe("production build exit propagation", () => {
    it.each([
        { status: null, signal: "SIGKILL" },
        { status: null, signal: null },
        { status: 0, signal: "SIGTERM" },
        { status: null, error: new Error("spawn unavailable") },
        { status: 7, signal: null },
    ])("fails closed for abnormal compiler result %o and skips later build/check", async (result) => {
        delete process.env.NEXT_SKIP_BUILD_TYPECHECK;
        mocks.spawnSync.mockReturnValue(result);
        vi.spyOn(console, "log").mockImplementation(() => {});
        vi.spyOn(console, "error").mockImplementation(() => {});
        await import("./production-build.mjs");
        expect(process.exitCode).toBe(result.status === 7 ? 7 : 1);
        expect(mocks.spawnSync).toHaveBeenCalledTimes(1);
        expect(mocks.writeFileSync).toHaveBeenCalledTimes(2);
    });
    it("only normal zero exits permit all three build steps", async () => {
        delete process.env.NEXT_SKIP_BUILD_TYPECHECK;
        mocks.spawnSync.mockReturnValue({ status: 0, signal: null });
        vi.spyOn(console, "log").mockImplementation(() => {});
        await import("./production-build.mjs");
        expect(process.exitCode).toBe(0);
        expect(mocks.spawnSync).toHaveBeenCalledTimes(3);
        expect(mocks.writeFileSync).toHaveBeenCalledTimes(2);
    });
    it("does not run the artifact checker after Next build is killed", async () => {
        delete process.env.NEXT_SKIP_BUILD_TYPECHECK;
        mocks.spawnSync.mockReturnValueOnce({ status: 0, signal: null }).mockReturnValueOnce({ status: null, signal: "SIGKILL" });
        vi.spyOn(console, "log").mockImplementation(() => {});
        vi.spyOn(console, "error").mockImplementation(() => {});
        await import("./production-build.mjs");
        expect(process.exitCode).toBe(1);
        expect(mocks.spawnSync).toHaveBeenCalledTimes(2);
        expect(mocks.writeFileSync).toHaveBeenCalledTimes(2);
    });
});
