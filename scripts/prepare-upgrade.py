#!/usr/bin/env python3
"""Inspect a local tag; integrate only a precisely reviewed scope.

Default mode is read-only and never fetches. This engineering gate cannot verify
the reviewer's identity or replace a substantive licence/source review.
"""
from __future__ import annotations

import argparse
from datetime import date
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import sys

OLD_BASELINE = "04b32d31ca00272e3866c85e9a8329036c63af72"
RIGHTS = (
    "commercial_operation", "modification", "source_publication",
    "redistribution", "project_license_compatible",
)


def git(repo: Path, *args: str) -> str:
    result = subprocess.run(
        ["git", "--no-replace-objects", *args], cwd=repo,
        env={**os.environ, "GIT_NO_LAZY_FETCH": "1", "GIT_OPTIONAL_LOCKS": "0"},
        check=True, encoding="utf-8", capture_output=True,
    )
    return result.stdout.rstrip("\n")


def fingerprint(scope: dict) -> str:
    return hashlib.sha256(json.dumps(
        scope, sort_keys=True, separators=(",", ":"), ensure_ascii=True,
    ).encode("utf-8")).hexdigest()


def inspect_scope(repo: Path, tag: str, custom_branch: str, baseline: str) -> dict:
    if git(repo, "rev-parse", "--is-shallow-repository") != "false":
        raise ValueError("无法验证浅克隆历史；先在受控证据流程补齐历史。")
    grafts = Path(git(repo, "rev-parse", "--git-path", "info/grafts"))
    grafts = grafts if grafts.is_absolute() else repo / grafts
    if grafts.exists() and grafts.read_bytes().strip():
        raise ValueError("存在 grafts，无法验证原始历史。")
    git(repo, "check-ref-format", f"refs/tags/{tag}")
    git(repo, "check-ref-format", f"refs/heads/{custom_branch}")
    target = git(repo, "rev-parse", "--verify", f"refs/tags/{tag}^{{commit}}")
    custom = git(repo, "rev-parse", "--verify", f"refs/heads/{custom_branch}^{{commit}}")
    git(repo, "cat-file", "-e", f"{baseline}^{{commit}}")
    git(repo, "rev-list", "--count", target, custom, baseline)
    git(repo, "merge-base", "--is-ancestor", baseline, custom)
    bases = git(repo, "merge-base", "--all", custom, target).splitlines()
    if len(bases) != 1:
        raise ValueError("仅支持一个可核验 merge-base；复杂历史须单独评审。")
    # No rename detection: every removed/added path is explicit in the scope.
    raw = git(repo, "diff", "--no-ext-diff", "--raw", "--no-abbrev", "--no-renames", "-z", bases[0], target)
    parts = raw.split("\0")
    changes = []
    for i in range(0, len(parts) - 1, 2):
        old_mode, new_mode, old_blob, new_blob, status = parts[i].lstrip(":").split()
        changes.append({
            "path": parts[i + 1], "status": status,
            "old_mode": old_mode, "new_mode": new_mode,
            "old_blob": old_blob, "new_blob": new_blob,
        })
    return {
        "baseline_commit": baseline, "custom_commit": custom,
        "target_commit": target,
        "target_tree": git(repo, "rev-parse", f"{target}^{{tree}}"),
        "merge_base": bases[0],
        "introduced_commits": sorted(git(repo, "rev-list", target, "--not", custom).splitlines()),
        "changes": changes,
    }


def validate_review(path: Path, scope: dict) -> None:
    record = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(record, dict):
        raise ValueError("审核记录必须是 JSON 对象。")
    if record.get("schema_version") != 1 or record.get("scope") != scope:
        raise ValueError("审核记录未绑定当前完整引入范围（目标/业务提交、历史或文件范围不符）。")
    if record.get("scope_sha256") != fingerprint(scope):
        raise ValueError("审核范围哈希不一致。")
    if record.get("decision") != "approved":
        raise ValueError("审核结论不是 approved；未知或待审不可引入。")
    for key in ("reviewer", "license_basis", "rights_holder", "review_notes"):
        value = record.get(key)
        if not isinstance(value, str) or not value.strip() or value.strip().lower() in {
            "unknown", "pending", "todo", "待填写", "待确认", "未知",
        }:
            raise ValueError(f"缺少有效审核记录字段：{key}。")
    date.fromisoformat(record["reviewed_on"])
    if not isinstance(record.get("rights"), dict) or any(record["rights"].get(right) is not True for right in RIGHTS):
        raise ValueError("必须确认整个范围的商业运行、修改、源码公开、再分发与项目许可兼容权利。")
    evidence = record.get("evidence")
    if not isinstance(evidence, list) or not evidence:
        raise ValueError("缺少许可/来源审核证据。")
    for item in evidence:
        if not isinstance(item, dict):
            raise ValueError("审核证据必须包含 path 和 sha256。")
        evidence_path = Path(item["path"])
        if not evidence_path.is_absolute():
            evidence_path = path.parent / evidence_path
        if hashlib.sha256(evidence_path.read_bytes()).hexdigest() != item["sha256"]:
            raise ValueError("审核证据文件的 SHA-256 不一致。")


def parser() -> argparse.ArgumentParser:
    result = argparse.ArgumentParser(description=__doc__)
    result.add_argument("version", help="already available local tag; no network fetch")
    result.add_argument("--custom-branch", default="goldcube-custom")
    result.add_argument("--target-commit", help="full reviewed target commit; required for --apply")
    result.add_argument("--review", type=Path, help="completed scope-bound JSON review record")
    result.add_argument("--apply", action="store_true", help="create isolated review branch only after all checks")
    return result


def prepare(args: argparse.Namespace, repo: Path, baseline: str = OLD_BASELINE) -> int:
    # Baseline injection is for isolated unit fixtures only; the CLI fixes OLD_BASELINE.
    scope = inspect_scope(repo, args.version, args.custom_branch, baseline)
    if args.target_commit and args.target_commit != scope["target_commit"]:
        raise ValueError("目标完整 commit 与本地 tag 不一致，未作任何集成改动。")
    if not args.apply:
        print(json.dumps({
            "schema_version": 1, "scope": scope, "scope_sha256": fingerprint(scope),
            "decision": "pending", "reviewer": "", "reviewed_on": "",
            "license_basis": "", "rights_holder": "", "review_notes": "",
            "rights": {right: False for right in RIGHTS}, "evidence": [],
        }, ensure_ascii=False, indent=2))
        return 0
    if not args.target_commit or not re.fullmatch(r"[0-9a-f]{40}", args.target_commit):
        raise ValueError("--apply 必须显式提供 --target-commit 完整 SHA-1。")
    if not args.review:
        raise ValueError("--apply 必须提供 --review 精确范围审核记录。")
    review = args.review.resolve()
    validate_review(review, scope)
    if not scope["introduced_commits"]:
        raise ValueError("没有需要引入的提交。")
    if git(repo, "status", "--porcelain=v1", "-z", "--untracked-files=all"):
        raise ValueError("工作树或暂存区存在修改/未跟踪文件，拒绝创建集成分支。")
    for state in ("MERGE_HEAD", "CHERRY_PICK_HEAD", "REVERT_HEAD", "rebase-merge", "rebase-apply"):
        state_path = Path(git(repo, "rev-parse", "--git-path", state))
        if (state_path if state_path.is_absolute() else repo / state_path).exists():
            raise ValueError("仓库有未完成的 Git 操作，拒绝集成。")
    branch = f"upgrade/{args.version}-custom"
    git(repo, "check-ref-format", "--branch", branch)
    if git(repo, "for-each-ref", "--format=%(refname)", f"refs/heads/{branch}"):
        raise ValueError("集成分支已存在，拒绝覆盖。")
    # Re-read refs and evidence immediately before the first intentional mutation.
    if inspect_scope(repo, args.version, args.custom_branch, baseline) != scope:
        raise ValueError("预检后范围已变化，重新审核。")
    validate_review(review, scope)
    git(repo, "switch", "-c", branch, scope["custom_commit"])
    try:
        git(repo, "merge", "--no-ff", "--no-commit", scope["target_commit"])
    except subprocess.CalledProcessError:
        print(f"UPGRADE_BLOCKED merge failed; inspect {branch}; git merge --abort if needed", file=sys.stderr)
        return 1
    print(f"review_branch={branch}\nUPGRADE_READY reviewed scope staged; inspect resolutions and run quality checks before commit")
    return 0


def main() -> int:
    try:
        return prepare(parser().parse_args(), Path.cwd())
    except (ValueError, KeyError, TypeError, OSError, subprocess.CalledProcessError) as error:
        # Git diagnostics can contain private remote URLs; do not print stderr.
        message = "Git evidence unavailable or command failed" if isinstance(error, subprocess.CalledProcessError) else str(error)
        print(f"UPGRADE_BLOCKED {message}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
