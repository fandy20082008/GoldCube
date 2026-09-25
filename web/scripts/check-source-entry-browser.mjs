import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { mkdtemp, writeFile, rm, readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import path from "node:path";
import { chromium } from "@playwright/test";
import assert from "node:assert/strict";

const directory = await mkdtemp(path.join(tmpdir(), "goldcube-source-entry-"));
const reservation = createServer();
await new Promise((resolve) => reservation.listen(0, "127.0.0.1", resolve));
const port = reservation.address().port;
await new Promise((resolve) => reservation.close(resolve));
const origin = `http://127.0.0.1:${port}`;
const record = JSON.parse(await readFile("../scripts/check-goldcube-release.example.json", "utf8"));
record.workflowCommit = "a".repeat(40);
record.applicationRepository = "fandy20082008/GoldCube";
record.releaseTag = "goldcube-v0.0.7-custom.13";
record.prebuildRecordSha256 = "e".repeat(64);
record.deploymentApproval = { decision: "approved" };
record.imageTargets = { app: "ghcr.io/fandy20082008/app", docs: "ghcr.io/fandy20082008/docs" };
record.sourceNotices = {};
record.artifacts = {};
for (const role of ["app", "frontend", "worker", "docs", "proxy", "shell", "assets", "deployment"]) {
    const gateway = ["proxy", "shell", "assets", "deployment"].includes(role);
    const repository = `fandy20082008/GoldCube${gateway ? "-Gateway" : ""}`;
    const commit = (gateway ? "b" : "a").repeat(40);
    const sha256 = (gateway ? "d" : "c").repeat(64);
    const digest = `sha256:${"f".repeat(64)}`;
    const source = { repository, commit, sourceArchive: { url: `https://github.com/${repository}/archive/${commit}.tar.gz`, sha256 } };
    record.components[gateway ? "proxy" : role] = source;
    record.sourceNotices[repository] = {
        licenseUrl: `https://github.com/${repository}/blob/${commit}/LICENSE`,
        noticesUrl: `https://github.com/${repository}/blob/${commit}/NOTICES.md`,
        buildUrl: `https://github.com/${repository}/blob/${commit}/README.md`,
    };
    record.artifacts[role] = {
        repository,
        sourceCommit: commit,
        sourceArchiveSha256: sha256,
        digest,
        uri: gateway ? `https://github.com/${repository}/releases/download/${record.releaseTag}/gateway.tar.gz` : `${record.imageTargets[role === "docs" ? "docs" : "app"]}@${digest}`,
    };
}
const validBytes = Buffer.from(JSON.stringify(record));
const manifestSha256 = createHash("sha256").update(validBytes).digest("hex");
// Isolated file provider, no production .env loading, no AI calls.
const mode = process.env.GOLDCUBE_SOURCE_BROWSER_DEV === "1" ? ["dev", "--webpack"] : ["start"];
const child = spawn(process.execPath, ["node_modules/next/dist/bin/next", ...mode, "-p", String(port), "-H", "127.0.0.1"], {
    env: {
        ...process.env,
        GOLDCUBE_RUNNING_APP_COMMIT: "a".repeat(40),
        GOLDCUBE_RUNNING_GATEWAY_COMMIT: "b".repeat(40),
        GOLDCUBE_RUNNING_APP_IMAGE_DIGEST: `sha256:${"f".repeat(64)}`,
        GOLDCUBE_RUNNING_GATEWAY_ARTIFACT_DIGEST: `sha256:${"f".repeat(64)}`,
        PORT: String(port),
        VOZEB_PRO_DATABASE_PROVIDER: "file",
        VOZEB_PRO_DATA_DIR: directory,
        NEXT_PUBLIC_SITE_URL: origin,
        VOZEB_PRO_INTERNAL_ORIGIN: origin,
        VOZEB_PRO_WORKER_API_ORIGIN: origin,
        GOLDCUBE_SOURCE_MANIFEST_FILE: path.join(directory, "manifest.json"),
        GOLDCUBE_SOURCE_MANIFEST_SHA256: manifestSha256,
    },
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
});
let browser;
try {
    await new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error("Isolated server did not start")), 60000);
        child.stdout.on("data", (data) => {
            if (data.toString().includes("Ready")) {
                clearTimeout(timer);
                resolve();
            }
        });
        child.once("exit", () => {
            clearTimeout(timer);
            reject(new Error("Isolated server exited"));
        });
    });
    browser = await chromium.launch({ headless: true });
    for (const width of [1440, 390]) {
        await rm(path.join(directory, "manifest.json"), { force: true });
        const page = await browser.newPage({ viewport: { width, height: 900 } });
        await page.goto(`${origin}/open-source`);
        await page.getByRole("heading", { name: "开源许可与源码", exact: true }).waitFor();
        await page.getByRole("status").waitFor();
        assert.equal(await page.getByText("免费下载完整源码").count(), 0);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
        await writeFile(path.join(directory, "manifest.json"), '{"private":"must-not-leak"}');
        await page.reload();
        assert.equal(await page.getByText("must-not-leak").count(), 0);
        await writeFile(path.join(directory, "manifest.json"), validBytes);
        await page.reload();
        assert.equal(await page.getByText("免费下载完整源码").count(), 2);
        assert.equal(await page.getByText("实际制品绑定").count(), 1);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
        await page.close();
    }
    console.log("Source entry anonymous desktop/mobile and invalid runtime manifest: passed");
} finally {
    await browser?.close();
    child.kill();
    await new Promise((resolve) => (child.exitCode !== null ? resolve() : child.once("exit", resolve)));
    await rm(directory, { recursive: true, force: true });
}
