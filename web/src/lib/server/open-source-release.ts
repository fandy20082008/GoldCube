import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

const appRepository = "fandy20082008/GoldCube";
const gatewayRepository = "fandy20082008/GoldCube-Gateway";
const roles = ["app", "frontend", "worker", "docs", "proxy", "shell", "assets", "deployment"] as const;
const localRoles = ["app", "frontend", "worker", "proxy", "shell", "assets", "deployment"] as const;
type Source = { repository: string; commit: string; sourceArchive: { url: string; sha256: string } };
type Artifact = { repository: string; sourceCommit: string; sourceArchiveSha256: string; digest: string; uri: string; kind?: string; archiveSha256?: string; imageConfigId?: string };
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
    deploymentScope?: { docs: string };
    deliveryStatus?: { libvips: string };
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

export type RunningSourceBinding = { appCommit?: string; gatewayCommit?: string; appImageDigest?: string; gatewayArtifactDigest?: string; appImageConfigId?: string; appImageArchiveSha256?: string };

export function projectPublicRelease(bytes: Buffer, expectedSha256: string, running: RunningSourceBinding) {
    if (!hash(expectedSha256) || createHash("sha256").update(bytes).digest("hex") !== expectedSha256) throw new Error("Manifest integrity mismatch");
    const record = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)) as Manifest;
    if (
        ![1, 2].includes(record.schemaVersion) ||
        record.applicationRepository !== appRepository ||
        !/^goldcube-v\d+\.\d+\.\d+-custom\.\d+$/.test(record.releaseTag) ||
        !hash(record.workflowCommit, 40) ||
        !hash(record.prebuildRecordSha256) ||
        record.deploymentApproval?.decision !== "approved"
    )
        throw new Error("Incomplete deployment manifest");
    const localDeployment = record.schemaVersion === 2;
    if (localDeployment && (record.deploymentScope?.docs !== "not-deployed" || !["deferred", "complete"].includes(record.deliveryStatus?.libvips || ""))) throw new Error("Incomplete local deployment scope");
    const sources = [record.components.app, record.components.proxy];
    for (const [index, source] of sources.entries()) {
        if (!source || source.repository !== (index === 0 ? appRepository : gatewayRepository) || !hash(source.commit, 40) || !hash(source.sourceArchive?.sha256) || !archiveUrl(source.sourceArchive.url, source, record.releaseTag))
            throw new Error("Invalid source binding");
        const notices = record.sourceNotices?.[source.repository];
        if (!notices || ![notices.licenseUrl, notices.noticesUrl, notices.buildUrl].every((url) => typeof url === "string" && pinnedDocument(url, source))) throw new Error("Missing pinned license, notices or build instructions");
    }
    // Docs remain part of the complete source even when no Docs service is deployed.
    if (localDeployment) {
        const docs = record.components.docs;
        if (!docs || docs.sourceArchive?.url !== sources[0].sourceArchive.url || docs.sourceArchive?.sha256 !== sources[0].sourceArchive.sha256 || docs.repository !== sources[0].repository || docs.commit !== sources[0].commit)
            throw new Error("Missing complete Docs source");
    }
    const deployedRoles = localDeployment ? localRoles : roles;
    if (Object.keys(record.artifacts).length !== deployedRoles.length) throw new Error("Invalid artifact roles");
    const artifacts = deployedRoles.map((role) => {
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
            if (localDeployment) {
                if (
                    artifact.kind !== "local-oci-archive" ||
                    !hash(artifact.archiveSha256) ||
                    !/^sha256:[0-9a-f]{64}$/.test(artifact.imageConfigId || "") ||
                    !hash(artifact.imageConfigId?.slice(7)) ||
                    artifact.imageConfigId === artifact.digest ||
                    artifact.digest !== record.artifacts.app.digest ||
                    artifact.archiveSha256 !== record.artifacts.app.archiveSha256 ||
                    artifact.imageConfigId !== record.artifacts.app.imageConfigId
                )
                    throw new Error("Local OCI image mismatch");
            } else {
                const image = role === "docs" ? record.imageTargets.docs : record.imageTargets.app;
                if (!/^ghcr\.io\/fandy20082008\/[a-z0-9][a-z0-9_.-]*$/.test(image) || artifact.uri !== `${image}@${artifact.digest}` || (["frontend", "worker"].includes(role) && artifact.digest !== record.artifacts.app.digest))
                    throw new Error("Image mismatch");
            }
        } else {
            if (!archiveUrl(artifact.uri, source, record.releaseTag)) throw new Error("Invalid gateway artifact");
            if (
                localDeployment &&
                (artifact.kind !== "file-archive" ||
                    !hash(artifact.archiveSha256) ||
                    artifact.digest !== `sha256:${artifact.archiveSha256}` ||
                    artifact.digest !== record.artifacts.proxy.digest ||
                    artifact.archiveSha256 !== record.artifacts.proxy.archiveSha256 ||
                    artifact.uri !== record.artifacts.proxy.uri)
            )
                throw new Error("Gateway archive mismatch");
        }
        return localDeployment ? { role, digest: artifact.digest, archiveSha256: artifact.archiveSha256, ...(source === sources[0] ? { imageConfigId: artifact.imageConfigId } : {}) } : { role, digest: artifact.digest };
    });
    if (sources[0].commit !== record.workflowCommit || (!localDeployment && record.imageTargets.app === record.imageTargets.docs)) throw new Error("Candidate mismatch");
    if (running.appCommit !== sources[0].commit || running.gatewayCommit !== sources[1].commit || running.appImageDigest !== record.artifacts.app.digest || running.gatewayArtifactDigest !== record.artifacts.proxy.digest)
        throw new Error("Running deployment mismatch");
    if (localDeployment && (running.appImageConfigId !== record.artifacts.app.imageConfigId || running.appImageArchiveSha256 !== record.artifacts.app.archiveSha256)) throw new Error("Running OCI archive mismatch");
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
        ...(localDeployment ? { docsDeployment: "not-deployed", deliveryStatus: { libvips: record.deliveryStatus!.libvips } } : {}),
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
            appImageConfigId: process.env.GOLDCUBE_RUNNING_APP_IMAGE_CONFIG_ID,
            appImageArchiveSha256: process.env.GOLDCUBE_RUNNING_APP_IMAGE_ARCHIVE_SHA256,
        });
    } catch {
        // Do not expose file paths, contents or audit data on invalid configuration.
        return null;
    }
}
