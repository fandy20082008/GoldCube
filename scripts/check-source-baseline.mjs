import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Changing these identities requires a dedicated licence/source review.
export const SOURCE_POLICY = Object.freeze({
  baseline: "04b32d31ca00272e3866c85e9a8329036c63af72",
  licenseBlob: "29ebfa545f5580919a4e884d7014d7a3eb2df762",
  restrictedCommit: "1df8a4f1d3eb8d7a91580d512b0e735172f4e321",
});

// The policy argument exists for isolated Git fixtures; the CLI never overrides it.
export function checkSourceBaseline(cwd, policy = SOURCE_POLICY) {
  const git = (args, allowed = [0]) => {
    const result = spawnSync("git", ["--no-replace-objects", ...args], {
      cwd,
      encoding: "utf8",
      env: { ...process.env, GIT_NO_LAZY_FETCH: "1" },
      maxBuffer: 4 * 1024 * 1024,
    });
    if (result.error || !allowed.includes(result.status)) {
      throw new Error(
        `无法验证 Git 证据（${args[0]}）；缺少对象、历史损坏或命令失败，不能视为通过。`,
      );
    }
    return { status: result.status, text: result.stdout.trim() };
  };

  if (git(["rev-parse", "--is-shallow-repository"]).text !== "false") {
    throw new Error("无法验证：浅克隆历史不完整；补齐可核验历史后重新检查。");
  }
  const grafts = git(["rev-parse", "--git-path", "info/grafts"]).text;
  const graftPath = resolve(cwd, grafts);
  if (existsSync(graftPath) && readFileSync(graftPath, "utf8").trim()) {
    throw new Error("无法验证：存在 Git grafts 历史替换；须先核对原始历史。");
  }

  const head = git(["rev-parse", "--verify", "HEAD^{commit}"]).text;
  for (const [label, hash, type] of [
    ["旧基线", policy.baseline, "commit"],
    ["已知受限提交", policy.restrictedCommit, "commit"],
    ["旧许可", policy.licenseBlob, "blob"],
  ]) {
    if (!/^[0-9a-f]{40}$/.test(hash)) {
      throw new Error(`无法验证：${label} 必须固定完整 SHA-1。`);
    }
    const object = git(["cat-file", "-t", hash], [0, 1, 128]);
    if (object.status !== 0 || object.text !== type) {
      throw new Error(
        `无法验证：缺少 ${label} 对象或对象类型错误（${hash}）。`,
      );
    }
  }

  // Traverse all parents, even when merge-base could answer using a short path.
  git(["rev-list", "--count", head, policy.baseline, policy.restrictedCommit]);
  if (
    git(["merge-base", "--is-ancestor", policy.baseline, head], [0, 1])
      .status !== 0
  ) {
    throw new Error("来源门禁失败：固定旧 AGPL 基线不是 HEAD 的祖先。");
  }
  if (
    git(["merge-base", "--is-ancestor", policy.restrictedCommit, head], [0, 1])
      .status === 0
  ) {
    throw new Error(
      "来源门禁失败：已知 BUSL 切换提交已进入 HEAD 历史，须专项来源与授权审核。",
    );
  }
  for (const ref of [policy.baseline, head]) {
    if (
      git(["rev-parse", "--verify", `${ref}:LICENSE`]).text !==
      policy.licenseBlob
    ) {
      throw new Error(
        `来源门禁失败：${ref} 的 LICENSE 与固定旧许可 blob 不一致。`,
      );
    }
  }
  return {
    head,
    ...policy,
    scope:
      "仅验证已提交 HEAD 的 Git 历史与 LICENSE；不证明人工复制、squash、依赖许可或源码交付合规。",
  };
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    console.log(JSON.stringify(checkSourceBaseline(process.cwd()), null, 2));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
