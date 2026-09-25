import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

const appRepository = "fandy20082008/GoldCube";
const gatewayRepository = "fandy20082008/GoldCube-Gateway";
const roles = ["app", "frontend", "worker", "docs", "proxy", "shell", "assets", "deployment"] as const;
type Source = { repository: string; commit: string; sourceArchive: { url: string; sha256: string } };
type Artifact = { repository: string; sourceCommit: string; sourceArchiveSha256: string; digest: string; uri: string };
type Manifest = {
    schemaVersion: number;
    releaseTag: string;
    workflowCommit: string;
    applicationRepository: string;
    prebuildRecordSha256: string;
    deploymentApproval: { decision: string };
    components: Record<string, Source>;
    artifacts: Record<string, Artifact>;
    imageTargets: { app: string; docs: string };
    sourceNotices: Record<string, { licenseUrl: string; noticesUrl: string; buildUrl: string }>;
};
const hash = (value: unknown, length = 64) => typeof value === "string" && new RegExp(`^[0-9a-f]{${length}}$`).test(value) && !/^0+$/.test(value);

// Only public repository-owned, immutable locations are exposed. Never fetch manifest URLs.
function archiveUrl(value: string, source: Source, releaseTag: string) {
    const url = new URL(value);
    return (
        url.origin === "https://github.com" &&
        !url.username &&
        !url.password &&
        !url.search &&
        !url.hash &&
        (url.pathname === `/${source.repository}/archive/${source.commit}.tar.gz` ||
            url.pathname === `/${source.repository}/archive/${source.commit}.zip` ||
            (url.pathname.startsWith(`/${source.repository}/releases/download/${releaseTag}/`) && /^[A-Za-z0-9_.-]+$/.test(url.pathname.split("/").at(-1) || "")))
    );
}

function pinnedDocument(value: string, source: Source) {
    const url = new URL(value);
    return url.origin === "https://github.com" && !url.username && !url.password && !url.search && !url.hash && url.pathname.startsWith(`/${source.repository}/blob/${source.commit}/`) && url.pathname.split("/").at(-1) !== "";
}

export type RunningSourceBinding = { appCommit?: string; gatewayCommit?: string; appImageDigest?: string; gatewayArtifactDigest?: string };

export function projectPublicRelease(bytes: Buffer, expectedSha256: string, running: RunningSourceBinding) {
    if (!hash(expectedSha256) || createHash("sha256").update(bytes).digest("hex") !== expectedSha256) throw new Error("Manifest integrity mismatch");
    const record = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)) as Manifest;
    if (
        record.schemaVersion !== 1 ||
        record.applicationRepository !== appRepository ||
        !/^goldcube-v\d+\.\d+\.\d+-custom\.\d+$/.test(record.releaseTag) ||
        !hash(record.workflowCommit, 40) ||
        !hash(record.prebuildRecordSha256) ||
        record.deploymentApproval?.decision !== "approved"
    )
        throw new Error("Incomplete deployment manifest");
    const sources = [record.components.app, record.components.proxy];
    for (const [index, source] of sources.entries()) {
        if (!source || source.repository !== (index === 0 ? appRepository : gatewayRepository) || !hash(source.commit, 40) || !hash(source.sourceArchive?.sha256) || !archiveUrl(source.sourceArchive.url, source, record.releaseTag))
            throw new Error("Invalid source binding");
        const notices = record.sourceNotices?.[source.repository];
        if (!notices || ![notices.licenseUrl, notices.noticesUrl, notices.buildUrl].every((url) => typeof url === "string" && pinnedDocument(url, source))) throw new Error("Missing pinned license, notices or build instructions");
    }
    if (Object.keys(record.artifacts).length !== roles.length) throw new Error("Invalid artifact roles");
    const artifacts = roles.map((role) => {
        const source = ["proxy", "shell", "assets", "deployment"].includes(role) ? sources[1] : sources[0];
        const component = record.components[["shell", "assets", "deployment"].includes(role) ? "proxy" : role];
        const artifact = record.artifacts[role];
        if (
            !component ||
            component.repository !== source.repository ||
            component.commit !== source.commit ||
            component.sourceArchive.sha256 !== source.sourceArchive.sha256 ||
            component.sourceArchive.url !== source.sourceArchive.url ||
            !artifact ||
            artifact.repository !== source.repository ||
            artifact.sourceCommit !== source.commit ||
            artifact.sourceArchiveSha256 !== source.sourceArchive.sha256 ||
            !/^sha256:[0-9a-f]{64}$/.test(artifact.digest) ||
            !hash(artifact.digest.slice(7))
        )
            throw new Error("Artifact/source mismatch");
        if (source === sources[0]) {
            const image = role === "docs" ? record.imageTargets.docs : record.imageTargets.app;
            if (!/^ghcr\.io\/fandy20082008\/[a-z0-9][a-z0-9_.-]*$/.test(image) || artifact.uri !== `${image}@${artifact.digest}` || (["frontend", "worker"].includes(role) && artifact.digest !== record.artifacts.app.digest))
                throw new Error("Image mismatch");
        } else if (!archiveUrl(artifact.uri, source, record.releaseTag)) throw new Error("Invalid gateway artifact");
        return { role, digest: artifact.digest };
    });
    if (sources[0].commit !== record.workflowCommit || record.imageTargets.app === record.imageTargets.docs) throw new Error("Candidate mismatch");
    if (running.appCommit !== sources[0].commit || running.gatewayCommit !== sources[1].commit || running.appImageDigest !== record.artifacts.app.digest || running.gatewayArtifactDigest !== record.artifacts.proxy.digest)
        throw new Error("Running deployment mismatch");
    // Explicit allowlist: private evidence and arbitrary extra fields never reach the browser.
    return {
        releaseTag: record.releaseTag,
        manifestSha256: expectedSha256,
        sources: sources.map((source) => ({
            repository: source.repository,
            commit: source.commit,
            archiveUrl: source.sourceArchive.url,
            archiveSha256: source.sourceArchive.sha256,
            licenseUrl: record.sourceNotices[source.repository].licenseUrl,
            noticesUrl: record.sourceNotices[source.repository].noticesUrl,
            buildUrl: record.sourceNotices[source.repository].buildUrl,
        })),
        artifacts,
    };
}

export async function readPublicRelease() {
    try {
        const file = process.env.GOLDCUBE_SOURCE_MANIFEST_FILE;
        const sha256 = process.env.GOLDCUBE_SOURCE_MANIFEST_SHA256;
        if (!file || !sha256) return null;
        return projectPublicRelease(await readFile(file), sha256, {
            appCommit: process.env.GOLDCUBE_RUNNING_APP_COMMIT,
            gatewayCommit: process.env.GOLDCUBE_RUNNING_GATEWAY_COMMIT,
            appImageDigest: process.env.GOLDCUBE_RUNNING_APP_IMAGE_DIGEST,
            gatewayArtifactDigest: process.env.GOLDCUBE_RUNNING_GATEWAY_ARTIFACT_DIGEST,
        });
    } catch {
        // Do not expose file paths, contents or audit data on invalid configuration.
        return null;
    }
}
