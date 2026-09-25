import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { isDeepStrictEqual, parseArgs } from "node:util";
import { checkSourceProvenance } from "./check-source-provenance.mjs";

const roles = ["app", "frontend", "worker", "proxy", "docs"];
const applicationRepository = "fandy20082008/GoldCube";
const gatewayRepository = "fandy20082008/GoldCube-Gateway";
const artifactRoles = [...roles, "shell", "assets", "deployment"];
const checks = [
  "provenance",
  "secrets",
  "publicBuild",
  "sourceDownload",
  "sourceCompleteness",
];
const requireValue = (condition, message) => {
  if (!condition) throw new Error(`发布阻断：${message}`);
};
const text = (value) => typeof value === "string" && value.trim().length > 0;
const sha = (value, length) =>
  typeof value === "string" &&
  new RegExp(`^[0-9a-f]{${length}}$`).test(value) &&
  !/^0+$/.test(value);
const repository = (value) =>
  typeof value === "string" && /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(value);
const publicUrl = (value) => {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      Boolean(url.hostname) &&
      !url.username &&
      !url.password &&
      !url.hash
    );
  } catch {
    return false;
  }
};

// Validates evidence bindings, not the truth of a review or live URL availability.
export function checkReleaseRecord(record, context) {
  const phase = context.phase ?? "prebuild";
  requireValue(
    ["prebuild", "deployment"].includes(phase),
    "未知发布验收阶段。",
  );
  requireValue(
    !context.sourceMode ||
      ["private-history", "public-snapshot"].includes(context.sourceMode),
    "未知来源模式。",
  );
  requireValue(
    /^goldcube-v\d+\.\d+\.\d+-custom\.\d+$/.test(context.tag || ""),
    "只接受精确 GoldCube custom 版本标签。",
  );
  requireValue(
    sha(context.commit, 40) && repository(context.repository),
    "需提供完整候选 commit 和自有仓库。",
  );
  requireValue(
    context.repository === applicationRepository,
    "应用仓库必须为 fandy20082008/GoldCube。",
  );
  requireValue(
    ["app", "docs"].includes(context.component),
    "镜像组件必须为 app 或 docs。",
  );
  const owner = context.repository.split("/")[0].toLowerCase();
  requireValue(owner !== "csyqlz", "禁止使用继承的上游发布主体。");
  const validImage = (image) =>
    typeof image === "string" &&
    image.startsWith(`ghcr.io/${owner}/`) &&
    /^ghcr\.io\/[a-z0-9][a-z0-9_.-]*\/[a-z0-9][a-z0-9_.-]*$/.test(image);
  requireValue(
    validImage(context.image),
    "必须配置当前自有仓库 owner 下的 GHCR 镜像目标，不接受空值或上游目标。",
  );
  requireValue(
    record?.schemaVersion === 1,
    "验收记录 schemaVersion 必须为 1。",
  );
  requireValue(
    record.releaseTag === context.tag &&
      record.workflowCommit === context.commit &&
      record.applicationRepository === context.repository,
    "验收记录必须绑定本次 tag、候选 commit 和应用仓库。",
  );
  if (context.sourceMode === "public-snapshot") {
    requireValue(
      sha(context.proofSha256, 64) &&
        record.sourceSnapshot?.proofSha256 === context.proofSha256 &&
        record.sourceSnapshot.applicationCommit === context.commit &&
        sha(record.sourceSnapshot.gatewayCommit, 40) &&
        record.sourceSnapshot.gatewayCommit === record.components?.proxy?.commit,
      "公开快照必须在构建前记录中绑定受信证明及双仓精确提交。",
    );
  }
  requireValue(
    validImage(record.imageTargets?.app) &&
      validImage(record.imageTargets?.docs) &&
      record.imageTargets.app !== record.imageTargets.docs,
    "需分别登记自有 app/docs 镜像目标。",
  );
  requireValue(
    record.imageTargets[context.component] === context.image,
    "镜像目标与验收记录不一致。",
  );
  for (const role of roles) {
    const item = record.components?.[role];
    requireValue(
      item && repository(item.repository) && sha(item.commit, 40),
      `${role} 缺少精确仓库和 commit 映射。`,
    );
    if (role === "proxy") {
      requireValue(
        item.repository === gatewayRepository,
        "proxy 必须映射到 fandy20082008/GoldCube-Gateway。",
      );
      requireValue(
        item.releaseGate?.status === "passed" &&
          item.releaseGate.sourceCommit === item.commit &&
          sha(item.releaseGate.recordSha256, 64) &&
          publicUrl(item.releaseGate.reportUrl),
        "proxy 必须引用绑定其 commit 的本仓发布门禁通过记录及记录 SHA-256。",
      );
    } else {
      requireValue(
        item.repository === context.repository &&
          item.commit === context.commit,
        `${role} 必须绑定本次应用候选 commit。`,
      );
    }
    requireValue(
      publicUrl(item.sourceArchive?.url) && sha(item.sourceArchive?.sha256, 64),
      `${role} 缺少 HTTPS 源码归档 URL 或 SHA-256。`,
    );
    const notices = record.sourceNotices?.[item.repository];
    requireValue(
      notices && ["licenseUrl", "noticesUrl", "buildUrl"].every((key) => {
        if (!publicUrl(notices[key])) return false;
        const url = new URL(notices[key]);
        return url.origin === "https://github.com" && !url.search &&
          url.pathname.startsWith(`/${item.repository}/blob/${item.commit}/`) &&
          url.pathname.split("/").at(-1) !== "";
      }),
      `${role} 缺少绑定完整 commit 的许可、第三方声明或构建说明。`,
    );
    if (role !== "proxy") {
      requireValue(
        item.sourceArchive.url === record.components.app.sourceArchive.url &&
          item.sourceArchive.sha256 ===
            record.components.app.sourceArchive.sha256,
        `${role} 必须引用同一应用完整源码归档。`,
      );
    }
    const review = item.review;
    requireValue(
      text(review?.reviewer) &&
        typeof review.reviewedAt === "string" &&
        /^\d{4}-\d{2}-\d{2}T/.test(review.reviewedAt) &&
        Number.isFinite(Date.parse(review.reviewedAt)),
      `${role} 缺少审核责任人或有效审核时间。`,
    );
    for (const name of checks) {
      requireValue(
        review.checks?.[name]?.status === "passed" &&
          publicUrl(review.checks[name].evidence),
        `${role}.${name} 未通过或无可追溯审核证据。`,
      );
    }
  }
  requireValue(
    record.approval?.decision === "approved" &&
      text(record.approval.reviewer) &&
      publicUrl(record.approval.evidence),
    "缺少本次完整发布的人工批准记录。",
  );
  if (phase === "deployment") {
    checkPrebuildBinding(record, context);
    checkDeploymentArtifacts(record);
  }
  return {
    phase,
    deploymentReady: phase === "deployment",
    commit: context.commit,
    releaseTag: context.tag,
    image: context.image,
    canonicalRecordSha256: createHash("sha256")
      .update(JSON.stringify(record))
      .digest("hex"),
    scope:
      "记录结构与绑定通过；人工证据真实性、源码可下载/可构建性仍由所列审核人负责，非脚本自动认证。",
  };
}

function checkPrebuildBinding(record, context) {
  const bytes = context.prebuildRecordBytes;
  requireValue(
    Buffer.isBuffer(bytes),
    "部署验收必须提供外置构建前原始记录 --prebuild-record。",
  );
  requireValue(
    sha(record.prebuildRecordSha256, 64) &&
      record.prebuildRecordSha256 ===
        createHash("sha256").update(bytes).digest("hex"),
    "构建前原始记录 SHA-256 不匹配。",
  );
  const prebuild = JSON.parse(
    new TextDecoder("utf-8", { fatal: true }).decode(bytes),
  );
  checkReleaseRecord(prebuild, { ...context, phase: "prebuild" });
  const sourceFields = (value) =>
    Object.fromEntries(
      Object.entries(value).filter(
        ([key]) =>
          !["artifacts", "deploymentApproval", "prebuildRecordSha256"].includes(
            key,
          ),
      ),
    );
  requireValue(
    isDeepStrictEqual(sourceFields(record), sourceFields(prebuild)),
    "最终清单与构建前记录不一致；仅允许补充 artifacts、deploymentApproval、prebuildRecordSha256。",
  );
}

// Deployment records extend the same prebuild manifest with measured artifacts.
function checkDeploymentArtifacts(record) {
  requireValue(
    record.artifacts &&
      Object.keys(record.artifacts).length === artifactRoles.length &&
      Object.keys(record.artifacts).every((role) =>
        artifactRoles.includes(role),
      ),
    "部署清单必须完整登记 app/frontend/worker/docs/proxy/shell/assets/deployment 制品。",
  );
  for (const role of artifactRoles) {
    const source =
      record.components[
        ["shell", "assets", "deployment"].includes(role) ? "proxy" : role
      ];
    const artifact = record.artifacts[role];
    requireValue(
      artifact?.repository === source.repository &&
        artifact.sourceCommit === source.commit &&
        artifact.sourceArchiveSha256 === source.sourceArchive.sha256,
      `${role} 制品与对应仓库、commit 或源码归档哈希不一致。`,
    );
    requireValue(
      typeof artifact.digest === "string" &&
        artifact.digest.startsWith("sha256:") &&
        sha(artifact.digest.slice(7), 64) &&
        publicUrl(artifact.verificationEvidence),
      `${role} 缺少实际制品 SHA-256 或可追溯验证证据。`,
    );
    if (["app", "frontend", "worker", "docs"].includes(role)) {
      const image =
        role === "docs" ? record.imageTargets.docs : record.imageTargets.app;
      requireValue(
        artifact.uri === `${image}@${artifact.digest}`,
        `${role} 必须使用目标镜像的不可变 digest 引用。`,
      );
      if (role === "frontend" || role === "worker") {
        requireValue(
          artifact.digest === record.artifacts.app.digest,
          `${role} 必须与 app 使用同一镜像 digest。`,
        );
      }
    } else {
      requireValue(
        publicUrl(artifact.uri),
        `${role} 必须登记可获取的实际交付包 HTTPS 地址。`,
      );
    }
  }
  requireValue(
    record.deploymentApproval?.decision === "approved" &&
      text(record.deploymentApproval.reviewer) &&
      publicUrl(record.deploymentApproval.evidence),
    "补齐实际制品后还须完成部署人工验收。",
  );
}

export function checkReleaseGit(cwd, context) {
  const git = (...args) => {
    const result = spawnSync(
      "git",
      ["--no-replace-objects", "-c", "protocol.allow=never", ...args],
      {
        cwd,
        encoding: "utf8",
        env: { ...process.env, GIT_NO_LAZY_FETCH: "1" },
      },
    );
    requireValue(
      !result.error && result.status === 0,
      `Git ${args[0]} 无法核验，禁止联网补取或跳过。`,
    );
    return result.stdout.trim();
  };
  requireValue(
    git("rev-parse", "HEAD^{commit}") === context.commit,
    "checkout HEAD 与 workflow 候选 commit 不一致。",
  );
  requireValue(
    git("rev-parse", "--verify", `refs/tags/${context.tag}^{commit}`) ===
      context.commit,
    "精确发布标签与 workflow 候选 commit 不一致。",
  );
  requireValue(
    git("status", "--porcelain", "--untracked-files=all") === "",
    "发布工作区必须干净；外置验收文件放在仓库外。",
  );
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    const { values } = parseArgs({
      options: Object.fromEntries(
        [
          "record",
          "tag",
          "commit",
          "repository",
          "image",
          "component",
          "phase",
          "prebuild-record",
        ].map((name) => [name, { type: "string" }]),
      ),
    });
    const inputBytes = values.record
      ? readFileSync(values.record)
      : Buffer.from(process.env.GOLDCUBE_RELEASE_RECORD || "", "utf8");
    const raw = new TextDecoder("utf-8", { fatal: true }).decode(inputBytes);
    requireValue(
      text(raw),
      "必须提供外置 JSON 供源验收记录；不能用 approved 布尔替代。",
    );
    const context = {
      tag: values.tag,
      commit: values.commit,
      repository: values.repository,
      image: values.image,
      component: values.component,
      phase: values.phase,
      prebuildRecordBytes: values["prebuild-record"]
        ? readFileSync(values["prebuild-record"])
        : undefined,
      sourceMode: process.env.GOLDCUBE_SOURCE_MODE || "private-history",
      proofSha256: process.env.GOLDCUBE_SNAPSHOT_PROOF_SHA256,
    };
    const result = checkReleaseRecord(JSON.parse(raw), context);
    checkReleaseGit(process.cwd(), context);
    const provenance = checkSourceProvenance(process.cwd());
    if (context.sourceMode === "public-snapshot") {
      requireValue(
        provenance.commit === context.commit &&
          provenance.peerCommit === JSON.parse(raw).components.proxy.commit,
        "公开来源证明与发布记录双仓身份不一致。",
      );
    }
    console.log(
      JSON.stringify(
        {
          ...result,
          recordSha256: createHash("sha256").update(inputBytes).digest("hex"),
        },
        null,
        2,
      ),
    );
  } catch (error) {
    console.error(
      error instanceof SyntaxError
        ? "发布阻断：验收记录不是有效 JSON。"
        : error.message,
    );
    process.exitCode = 1;
  }
}
