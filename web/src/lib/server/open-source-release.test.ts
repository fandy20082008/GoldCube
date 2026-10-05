import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { projectPublicRelease, type RunningSourceBinding } from "./open-source-release";

function fixture() {
    const app = { repository: "fandy20082008/GoldCube", commit: "a".repeat(40), sourceArchive: { url: `https://github.com/fandy20082008/GoldCube/archive/${"a".repeat(40)}.tar.gz`, sha256: "b".repeat(64) } };
    const proxy = { repository: "fandy20082008/GoldCube-Gateway", commit: "c".repeat(40), sourceArchive: { url: `https://github.com/fandy20082008/GoldCube-Gateway/archive/${"c".repeat(40)}.tar.gz`, sha256: "d".repeat(64) } };
    const imageTargets = { app: "ghcr.io/fandy20082008/app", docs: "ghcr.io/fandy20082008/docs" };
    return {
        schemaVersion: 1,
        releaseTag: "goldcube-v0.0.7-custom.13",
        workflowCommit: app.commit,
        applicationRepository: app.repository,
        prebuildRecordSha256: "e".repeat(64),
        deploymentApproval: { decision: "approved" },
        components: { app, frontend: app, worker: app, docs: app, proxy },
        imageTargets,
        sourceNotices: Object.fromEntries(
            [app, proxy].map((source) => [
                source.repository,
                {
                    licenseUrl: `https://github.com/${source.repository}/blob/${source.commit}/LICENSE`,
                    noticesUrl: `https://github.com/${source.repository}/blob/${source.commit}/THIRD_PARTY_LICENSES.md`,
                    buildUrl: `https://github.com/${source.repository}/blob/${source.commit}/README.md`,
                },
            ]),
        ),
        artifacts: Object.fromEntries(
            ["app", "frontend", "worker", "docs", "proxy", "shell", "assets", "deployment"].map((role) => {
                const source = ["proxy", "shell", "assets", "deployment"].includes(role) ? proxy : app;
                const digest = `sha256:${"f".repeat(64)}`;
                return [
                    role,
                    {
                        repository: source.repository,
                        sourceCommit: source.commit,
                        sourceArchiveSha256: source.sourceArchive.sha256,
                        digest,
                        uri: source === proxy ? `https://github.com/${proxy.repository}/releases/download/goldcube-v0.0.7-custom.13/gateway.tar.gz` : `${role === "docs" ? imageTargets.docs : imageTargets.app}@${digest}`,
                    },
                ];
            }),
        ),
        secret: "private-audit-path-never-render",
    };
}
const running = { appCommit: "a".repeat(40), gatewayCommit: "c".repeat(40), appImageDigest: `sha256:${"f".repeat(64)}`, gatewayArtifactDigest: `sha256:${"f".repeat(64)}` };
function run(value: unknown, binding: RunningSourceBinding = running) {
    const bytes = Buffer.from(JSON.stringify(value));
    return projectPublicRelease(bytes, createHash("sha256").update(bytes).digest("hex"), binding);
}
describe("public source projection", () => {
    it("exposes only pinned public source and artifact data", () => {
        const value = run(fixture());
        expect(value.sources).toHaveLength(2);
        expect(value.artifacts).toHaveLength(8);
        expect(JSON.stringify(value)).not.toContain("private-audit");
        expect(JSON.stringify(value)).not.toContain("deploymentApproval");
    });
    it("rejects hash mismatch", () => expect(() => projectPublicRelease(Buffer.from("{}"), "a".repeat(64), running)).toThrow());
    it("rejects an old manifest on a new running deployment", () => expect(() => run(fixture(), { ...running, appCommit: "1".repeat(40) })).toThrow("Running deployment mismatch"));
    it("requires running image and gateway digest declarations", () => {
        expect(() => run(fixture(), { ...running, appImageDigest: "" })).toThrow();
        expect(() => run(fixture(), { ...running, gatewayArtifactDigest: `sha256:${"1".repeat(64)}` })).toThrow();
    });
    it("rejects absent or unpinned license records", () => {
        const value = fixture();
        value.sourceNotices["fandy20082008/GoldCube-Gateway"].licenseUrl = "https://github.com/fandy20082008/GoldCube-Gateway/blob/main/LICENSE";
        expect(() => run(value)).toThrow();
    });
    it("rejects incomplete/prebuild manifests", () => {
        const value = fixture();
        value.deploymentApproval.decision = "pending";
        expect(() => run(value)).toThrow();
    });
    it("rejects swapped repositories", () => {
        const value = fixture();
        value.components.proxy.repository = value.components.app.repository;
        expect(() => run(value)).toThrow();
    });
    it("rejects mismatched artifact commit", () => {
        const value = fixture();
        value.artifacts.worker.sourceCommit = "1".repeat(40);
        expect(() => run(value)).toThrow();
    });
    it("rejects missing actual artifact", () => {
        const value = fixture();
        delete value.artifacts.assets;
        expect(() => run(value)).toThrow();
    });
    it.each(["http://127.0.0.1/secret", "https://example.com/secret?token=secret", "https://github.com/fandy20082008/GoldCube/archive/main.zip"])("rejects unsafe or floating source URL %s", (url) => {
        const value = fixture();
        value.components.app.sourceArchive.url = url;
        expect(() => run(value)).toThrow();
    });
    it("rejects mixed archive hashes", () => {
        const value = fixture();
        value.artifacts.shell.sourceArchiveSha256 = "1".repeat(64);
        expect(() => run(value)).toThrow();
    });
});

function localFixture() {
    const record = fixture();
    record.schemaVersion = 2;
    delete record.artifacts.docs;
    for (const [role, artifact] of Object.entries(record.artifacts)) {
        Object.assign(
            artifact,
            ["app", "frontend", "worker"].includes(role)
                ? { kind: "local-oci-archive", uri: "/private/images/custom13.oci.tar", archiveSha256: "1".repeat(64), imageConfigId: `sha256:${"2".repeat(64)}` }
                : { kind: "file-archive", archiveSha256: "f".repeat(64) },
        );
    }
    return { ...record, deploymentScope: { docs: "not-deployed" }, deliveryStatus: { libvips: "deferred" } };
}
const localRunning = { ...running, appImageConfigId: `sha256:${"2".repeat(64)}`, appImageArchiveSha256: "1".repeat(64) };
describe("local OCI source projection", () => {
    it("binds seven deployed roles and complete Docs source without inventing a Docs image", () => {
        const result = run(localFixture(), localRunning);
        expect(result.artifacts.map((artifact) => artifact.role)).toEqual(["app", "frontend", "worker", "proxy", "shell", "assets", "deployment"]);
        expect(result.docsDeployment).toBe("not-deployed");
        expect(result.deliveryStatus).toEqual({ libvips: "deferred" });
        expect(result.artifacts[0]).toMatchObject({ digest: running.appImageDigest, archiveSha256: localRunning.appImageArchiveSha256, imageConfigId: localRunning.appImageConfigId });
        expect(JSON.stringify(result)).not.toContain("/private");
        expect(JSON.stringify(result)).not.toContain("deploymentApproval");
        expect(JSON.stringify(result)).not.toContain("ghcr.io");
    });
    it("does not require registry target declarations for a local OCI archive", () => {
        const value = localFixture();
        expect(run({ ...value, imageTargets: undefined }, localRunning).artifacts).toHaveLength(7);
    });
    it("requires explicit undeployed Docs scope while retaining complete Docs source", () => {
        const value = localFixture();
        value.deploymentScope.docs = "deployed";
        expect(() => run(value, localRunning)).toThrow("scope");
        value.deploymentScope.docs = "not-deployed";
        expect(() => run({ ...value, components: { ...value.components, docs: undefined } }, localRunning)).toThrow("Docs source");
    });
    it("rejects substituting an image config ID for the OCI manifest digest", () => {
        const value = localFixture();
        Object.assign(value.artifacts.app, { imageConfigId: value.artifacts.app.digest });
        expect(() => run(value, localRunning)).toThrow("Local OCI");
    });
    it.each(["archiveSha256", "imageConfigId", "digest"])("requires the same app/frontend/worker %s", (field) => {
        const value = localFixture();
        Object.assign(value.artifacts.worker, { [field]: field === "archiveSha256" ? "3".repeat(64) : `sha256:${"3".repeat(64)}` });
        expect(() => run(value, localRunning)).toThrow();
    });
    it("rejects local OCI archive bindings that do not match the running declaration", () => {
        expect(() => run(localFixture(), { ...localRunning, appImageConfigId: undefined })).toThrow("Running OCI");
        expect(() => run(localFixture(), { ...localRunning, appImageArchiveSha256: "4".repeat(64) })).toThrow("Running OCI");
    });
    it("checks the Gateway runtime archive hash separately from the source archive", () => {
        const value = localFixture();
        Object.assign(value.artifacts.proxy, { archiveSha256: value.components.proxy.sourceArchive.sha256 });
        expect(() => run(value, localRunning)).toThrow("Gateway archive");
    });
    it("rejects a different otherwise valid Gateway archive in any runtime role", () => {
        for (const role of ["shell", "assets", "deployment"]) {
            const value = localFixture();
            Object.assign(value.artifacts[role], {
                archiveSha256: "3".repeat(64),
                digest: `sha256:${"3".repeat(64)}`,
                uri: "https://github.com/fandy20082008/GoldCube-Gateway/releases/download/goldcube-v0.0.7-custom.13/other-runtime.tar.gz",
            });
            expect(() => run(value, localRunning)).toThrow("Gateway archive");
        }
        const value = localFixture();
        value.artifacts.shell.uri = "https://github.com/fandy20082008/GoldCube-Gateway/releases/download/goldcube-v0.0.7-custom.13/other-runtime.tar.gz";
        expect(() => run(value, localRunning)).toThrow("Gateway archive");
    });
    it("rejects a fabricated Docs artifact in the no-Docs deployment", () => {
        const value = localFixture();
        value.artifacts.docs = value.artifacts.app;
        expect(() => run(value, localRunning)).toThrow("artifact roles");
    });
    it("requires an explicit material delivery status and never relabels deferred as complete", () => {
        const value = localFixture();
        value.deliveryStatus.libvips = "approved";
        expect(() => run(value, localRunning)).toThrow("scope");
        value.deliveryStatus.libvips = "complete";
        expect(run(value, localRunning).deliveryStatus?.libvips).toBe("complete");
    });
});
