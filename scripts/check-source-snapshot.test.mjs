import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { checkSourceSnapshot } from './check-source-snapshot.mjs';

const sha = bytes => createHash('sha256').update(bytes).digest('hex');
function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'snapshot-check-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const repository = join(root, 'repo'), stage = join(root, 'stage'), manifest = join(root, 'scope.json');
  mkdirSync(repository); mkdirSync(stage);
  const git = (...args) => execFileSync('git', args, { cwd: repository, encoding: 'utf8' }).trim();
  git('init', '-q'); git('config', 'user.name', 'Fixture'); git('config', 'user.email', 'fixture@example.invalid'); git('config', 'core.autocrlf', 'false');
  for (const [name, text] of [['LICENSE', 'license\n'], ['server.js', 'export const value = 1;\n']]) {
    writeFileSync(join(repository, name), text); writeFileSync(join(stage, name), text);
  }
  git('add', 'LICENSE', 'server.js'); git('commit', '-qm', 'fixture');
  const data = { component: 'application', developmentCommit: git('rev-parse', 'HEAD'), publicSnapshotCommit: null, stageDirectory: stage, publicUploadApproved: false, deploymentReady: false, members: ['LICENSE', 'server.js'].map(path => ({ path, mode: '100644', developmentBlob: git('rev-parse', `HEAD:${path}`), sha256: sha(readFileSync(join(stage, path))), bytes: readFileSync(join(stage, path)).length, staged: true })) };
  const save = () => { writeFileSync(manifest, JSON.stringify(data)); return { repository, manifest, trustedSha256: sha(readFileSync(manifest)) }; };
  return { data, stage, save };
}
test('complete private staging binds development blobs and never approves upload', t => {
  const f = fixture(t), result = checkSourceSnapshot(f.save());
  assert.equal(result.members, 2); assert.equal(result.stageOnly, true); assert.equal(result.publicUploadApproved, false);
});
for (const kind of ['missing-source', 'missing-license', 'tampered', 'extra', 'manifest-hash', 'escape', 'omit-from-manifest', 'exclude-proposal', 'wrong-mode', 'forged-blob', 'rehash-tampered-bytes']) {
  test(`reject ${kind}`, t => {
    const f = fixture(t);
    if (kind === 'missing-source') rmSync(join(f.stage, 'server.js'));
    if (kind === 'missing-license') rmSync(join(f.stage, 'LICENSE'));
    if (kind === 'tampered') writeFileSync(join(f.stage, 'server.js'), 'malicious replacement');
    if (kind === 'extra') writeFileSync(join(f.stage, 'extra.txt'), 'extra');
    if (kind === 'escape') f.data.members[1].path = '../outside';
    if (kind === 'omit-from-manifest') f.data.members.pop();
    if (kind === 'exclude-proposal') f.data.members[1].staged = false;
    if (kind === 'wrong-mode') f.data.members[1].mode = '100755';
    if (kind === 'forged-blob') f.data.members[1].developmentBlob = 'a'.repeat(40);
    if (kind === 'rehash-tampered-bytes') {
      const text = Buffer.from('unapproved code'); writeFileSync(join(f.stage, 'server.js'), text);
      f.data.members[1].sha256 = sha(text); f.data.members[1].bytes = text.length;
    }
    const input = f.save();
    if (kind === 'manifest-hash') input.trustedSha256 = '0'.repeat(64);
    assert.throws(() => checkSourceSnapshot(input));
  });
}
