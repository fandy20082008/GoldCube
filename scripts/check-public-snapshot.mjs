import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const hex = (value, length) =>
  typeof value === "string" && new RegExp(`^[0-9a-f]{${length}}$`).test(value);
const fail = (message) => {
  throw new Error(`公开快照来源阻断：${message}`);
};
const repos = {
  application: "fandy20082008/GoldCube",
  gateway: "fandy20082008/GoldCube-Gateway",
};
const baseline = "04b32d31ca00272e3866c85e9a8329036c63af72";
const licenseBlob = "29ebfa545f5580919a4e884d7014d7a3eb2df762";

// The proof is kept outside the Git tree. Its SHA-256 must be pinned by a
// separately controlled CI variable; a candidate cannot approve its own proof.
export function checkPublicSnapshot({
  cwd,
  component,
  proofBytes,
  trustedSha256,
  expectedCommit,
  expectedRepository,
}) {
  if (!["application", "gateway"].includes(component)) fail("未知仓库角色。");
  if (
    !Buffer.isBuffer(proofBytes) ||
    !hex(trustedSha256, 64) ||
    sha256(proofBytes) !== trustedSha256
  ) fail("缺少受信的仓外证明或原始字节摘要不一致。");
  let proof;
  try {
    proof = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(proofBytes));
  } catch {
    fail("证明不是有效 UTF-8 JSON。");
  }
  const own = proof?.snapshots?.[component];
  const other = proof?.snapshots?.[component === "application" ? "gateway" : "application"];
  if (
    proof.schemaVersion !== 1 ||
    proof.kind !== "public-snapshot" ||
    proof.baseline !== baseline ||
    !proof.review ||
    typeof proof.review.reviewer !== "string" ||
    !proof.review.reviewer.trim() ||
    !Number.isFinite(Date.parse(proof.review.reviewedAt)) ||
    proof.review.decision !== "approved" ||
    !own || !other
  ) fail("证明版本、旧基线、双仓或审核结论不完整。");
  for (const [role, entry] of Object.entries(repos)) {
    const item = proof.snapshots[role];
    if (
      item.repository !== entry ||
      !hex(item.developmentCommit, 40) ||
      !hex(item.developmentTree, 40) ||
      !hex(item.baselineEvidenceSha256, 64) ||
      !hex(item.reviewedScopeSha256, 64) ||
      !hex(item.commit, 40) ||
      !hex(item.rootCommit, 40) ||
      !hex(item.tree, 40) ||
      !hex(item.membersSha256, 64) ||
      !hex(item.archiveSha256, 64) ||
      !hex(item.licenseBlob, 40)
    ) fail(`${role} 来源、范围、归档或制品映射不完整。`);
  }
  if (own.repository !== expectedRepository || !hex(expectedCommit, 40) ||
      own.commit !== expectedCommit) fail("候选仓库或提交与外置证明不一致。");
  const git = (...args) => {
    try {
      return execFileSync("git", ["--no-replace-objects", "-c", "protocol.allow=never", ...args], {
        cwd,
        env: { ...process.env, GIT_NO_LAZY_FETCH: "1", GIT_NO_REPLACE_OBJECTS: "1" },
        maxBuffer: 128 * 1024 * 1024,
        stdio: ["ignore", "pipe", "pipe"],
      });
    } catch {
      fail(`Git ${args[0]} 证据缺失或无法核验。`);
    }
  };
  const text = (...args) => git(...args).toString("utf8").trim();
  if (text("rev-parse", "--is-shallow-repository") !== "false") fail("浅克隆不能验来源。");
  const grafts = resolve(cwd, text("rev-parse", "--git-path", "info/grafts"));
  if (existsSync(grafts) && readFileSync(grafts, "utf8").trim()) fail("存在 grafts。");
  if (text("rev-parse", "HEAD^{commit}") !== own.commit ||
      text("rev-parse", "HEAD^{tree}") !== own.tree) fail("HEAD/tree 已变化。");
  const roots = text("rev-list", "--max-parents=0", "HEAD").split(/\s+/);
  if (roots.length !== 1 || roots[0] !== own.rootCommit ||
      text("rev-list", "--parents", own.rootCommit).split(/\s+/).length !== 1)
    fail("公开历史不是证明中的单一新根。");
  const members = git("ls-tree", "-rz", "HEAD");
  if (sha256(members) !== own.membersSha256) fail("实际文件清单或 mode/blob 已变化。");
  const paths = members.toString("utf8").split("\0").filter(Boolean).map((row) => {
    const match = /^(\d+) (blob) ([0-9a-f]{40})\t(.+)$/.exec(row);
    if (!match || !["100644", "100755"].includes(match[1])) fail("公开树含未经审定的链接或非普通文件。");
    return match[4];
  });
  const required = component === "application"
    ? ["LICENSE", "LEGAL_NOTICE.md", "THIRD_PARTY_LICENSES.md", "README.md", "web/Dockerfile", "docs/Dockerfile"]
    : ["LICENSE", "NOTICE", "THIRD_PARTY_NOTICES", "README.md", "serve.js", "app.js"];
  if (required.some((path) => !paths.includes(path))) fail("必要源码、构建或法律材料缺失。");
  if (text("rev-parse", "HEAD:LICENSE") !== own.licenseBlob ||
      (component === "application" && own.licenseBlob !== licenseBlob))
    fail("许可证字节与证明或旧基线不一致。");
  const archive = git("-c", "core.autocrlf=false", "-c", "core.eol=lf", "archive", "--format=tar", "HEAD");
  if (sha256(archive) !== own.archiveSha256) fail("规范完整源码归档摘要不匹配。");
  return {
    mode: "public-snapshot",
    component,
    repository: own.repository,
    commit: own.commit,
    tree: own.tree,
    proofSha256: trustedSha256,
    peerRepository: other.repository,
    peerCommit: other.commit,
    archiveSha256: own.archiveSha256,
    scope: "本地精确证据绑定；不代替权利/秘密人工审核、实际公开下载或部署批准。",
  };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const component = process.env.GOLDCUBE_SNAPSHOT_COMPONENT;
    const proofBytes = Buffer.from(process.env.GOLDCUBE_SNAPSHOT_PROOF || "", "utf8");
    console.log(JSON.stringify(checkPublicSnapshot({
      cwd: process.cwd(),
      component,
      proofBytes,
      trustedSha256: process.env.GOLDCUBE_SNAPSHOT_PROOF_SHA256,
      expectedCommit: process.env.GITHUB_SHA || process.env.GOLDCUBE_SNAPSHOT_COMMIT,
      expectedRepository: process.env.GITHUB_REPOSITORY || repos[component],
    }), null, 2));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
