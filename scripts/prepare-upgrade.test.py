"""Local Git-only fixtures; never fetch or use production repositories."""
import contextlib
import hashlib
import importlib.util
import io
import json
import os
from pathlib import Path
import subprocess
import tempfile
import unittest
from unittest.mock import patch

SPEC = importlib.util.spec_from_file_location("prepare_upgrade", Path(__file__).with_name("prepare-upgrade.py"))
UPGRADE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(UPGRADE)


class UpgradeTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="goldcube-upgrade-")
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.repo = self.root / "repo"
        self.repo.mkdir()
        self.env = patch.dict(os.environ, {
            "GIT_CONFIG_NOSYSTEM": "1", "GIT_CONFIG_GLOBAL": os.devnull,
            "GIT_OPTIONAL_LOCKS": "0",
        })
        self.env.start()
        self.addCleanup(self.env.stop)
        self.git("init", "-b", "goldcube-custom")
        self.git("config", "user.name", "Local Fixture")
        self.git("config", "user.email", "fixture@example.invalid")
        self.git("config", "commit.gpgsign", "false")
        self.git("config", "core.autocrlf", "false")
        self.write("base.txt", "fixture base\n")
        self.git("add", ".")
        self.git("commit", "-m", "fixture base")
        self.base = self.git("rev-parse", "HEAD")
        self.git("checkout", "-b", "target-fixture")
        self.write("temporary.txt", "transient change still needs history review\n")
        self.git("add", ".")
        self.git("commit", "-m", "fixture target first commit")
        self.git("rm", "temporary.txt")
        self.write("target.txt", "fixture target\n")
        self.git("add", ".")
        self.git("commit", "-m", "fixture target final commit")
        self.target = self.git("rev-parse", "HEAD")
        self.git("tag", "v-fixture")
        self.git("checkout", "goldcube-custom")
        self.write("custom.txt", "fixture independent customization\n")
        self.git("add", ".")
        self.git("commit", "-m", "fixture custom")
        self.custom = self.git("rev-parse", "HEAD")
        self.review_path = self.root / "review.json"
        evidence = self.root / "evidence.txt"
        evidence.write_text("Fixture evidence, not actual legal permission.\n", encoding="utf-8")
        scope = UPGRADE.inspect_scope(self.repo, "v-fixture", "goldcube-custom", self.base)
        self.review = {
            "schema_version": 1, "scope": scope,
            "scope_sha256": UPGRADE.fingerprint(scope), "decision": "approved",
            "reviewer": "Fixture reviewer", "reviewed_on": "2026-09-22",
            "license_basis": "Fixture only", "rights_holder": "Fixture author",
            "review_notes": "Reviewed all fixture history, including transient content",
            "rights": {right: True for right in UPGRADE.RIGHTS},
            "evidence": [{"path": "evidence.txt", "sha256": hashlib.sha256(evidence.read_bytes()).hexdigest()}],
        }
        self.save_review()

    def git(self, *args):
        return subprocess.check_output(
            ["git", *args], cwd=self.repo, encoding="utf-8", stderr=subprocess.PIPE,
        ).strip()

    def write(self, name, content):
        (self.repo / name).write_text(content, encoding="utf-8")

    def save_review(self):
        self.review_path.write_text(json.dumps(self.review), encoding="utf-8")

    def snapshot(self):
        return {
            "refs": self.git("show-ref"), "head": (self.repo / ".git/HEAD").read_bytes(),
            "index": (self.repo / ".git/index").read_bytes(),
            "files": {str(p.relative_to(self.repo)): p.read_bytes()
                      for p in self.repo.rglob("*") if p.is_file() and ".git" not in p.relative_to(self.repo).parts},
        }

    def run_prepare(self, *options):
        args = UPGRADE.parser().parse_args(["v-fixture", *options])
        output = io.StringIO()
        with contextlib.redirect_stdout(output):
            result = UPGRADE.prepare(args, self.repo, self.base)
        return result, output.getvalue()

    def apply_options(self):
        return ("--apply", "--target-commit", self.target, "--review", str(self.review_path))

    def assert_blocked_unchanged(self, options=None, expected="审核记录未绑定"):
        self.write("untracked-preserve.txt", "preserve on failed review\n")
        before = self.snapshot()
        with self.assertRaisesRegex(ValueError, expected):
            self.run_prepare(*(options if options is not None else self.apply_options()))
        self.assertEqual(before, self.snapshot())
        self.assertFalse((self.repo / ".git/MERGE_HEAD").exists())

    def test_default_is_read_only_with_dirty_and_untracked_files(self):
        self.write("base.txt", "local changes\n")
        self.write("untracked.txt", "do not touch\n")
        before = self.snapshot()
        code, output = self.run_prepare()
        self.assertEqual(code, 0)
        template = json.loads(output)
        self.assertEqual(template["decision"], "pending")
        self.assertEqual(len(template["scope"]["introduced_commits"]), 2)
        self.assertEqual(template["scope"]["changes"][0]["path"], "target.txt")
        self.assertEqual(before, self.snapshot())

    def test_missing_record_blocks_without_mutation(self):
        self.assert_blocked_unchanged(("--apply", "--target-commit", self.target), "--review")

    def test_missing_target_blocks_without_mutation(self):
        self.assert_blocked_unchanged(("--apply", "--review", str(self.review_path)), "--target-commit")

    def test_wrong_target_blocks_without_mutation(self):
        self.assert_blocked_unchanged(("--apply", "--target-commit", self.base, "--review", str(self.review_path)), "目标完整 commit")

    def test_record_for_another_commit_blocks_without_mutation(self):
        self.review["scope"]["target_commit"] = self.base
        self.save_review()
        self.assert_blocked_unchanged()

    def test_incomplete_scope_blocks_even_with_recomputed_hash(self):
        self.review["scope"]["introduced_commits"] = [self.target]
        self.review["scope_sha256"] = UPGRADE.fingerprint(self.review["scope"])
        self.save_review()
        self.assert_blocked_unchanged()

    def test_unknown_license_and_incompatible_rights_block(self):
        for field, value, expected in (("license_basis", "unknown", "字段：license_basis"), ("rights", {}, "必须确认整个范围"), ("decision", "pending", "审核结论"), ("reviewer", "", "字段：reviewer")):
            with self.subTest(field=field):
                original = self.review[field]
                self.review[field] = value
                self.save_review()
                self.assert_blocked_unchanged(expected=expected)
                self.review[field] = original

    def test_missing_or_altered_evidence_blocks(self):
        self.review["evidence"] = []
        self.save_review()
        self.assert_blocked_unchanged(expected="缺少许可/来源审核证据")
        self.review["evidence"] = [{"path": "evidence.txt", "sha256": "0" * 64}]
        self.save_review()
        self.assert_blocked_unchanged(expected="证据文件的 SHA-256")

    def test_shallow_history_blocks(self):
        (self.repo / ".git/shallow").write_text(self.base + "\n", encoding="utf-8")
        self.assert_blocked_unchanged(expected="浅克隆")

    def test_dirty_worktree_blocks_valid_review(self):
        self.write("base.txt", "local changes\n")
        self.assert_blocked_unchanged(expected="工作树或暂存区")

    def test_untracked_worktree_blocks_valid_review(self):
        self.assert_blocked_unchanged(expected="工作树或暂存区")

    def test_changed_custom_head_invalidates_review(self):
        self.git("commit", "--allow-empty", "-m", "custom changed after review")
        self.assert_blocked_unchanged()

    def test_approved_fixture_only_enters_isolated_uncommitted_merge(self):
        code, output = self.run_prepare(*self.apply_options())
        self.assertEqual(code, 0)
        self.assertIn("UPGRADE_READY", output)
        self.assertEqual(self.git("branch", "--show-current"), "upgrade/v-fixture-custom")
        self.assertEqual(self.git("rev-parse", "HEAD"), self.custom)
        self.assertEqual(self.git("rev-parse", "goldcube-custom"), self.custom)
        self.assertEqual((self.repo / ".git/MERGE_HEAD").read_text().strip(), self.target)
        self.assertEqual(self.git("diff", "--cached", "--name-only"), "target.txt")
        self.assertEqual(self.git("for-each-ref", "--format=%(refname)", "refs/heads/upstream"), "")


if __name__ == "__main__":
    unittest.main()
