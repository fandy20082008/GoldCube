import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { lstatSync, readFileSync, readdirSync, realpathSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const digest = (bytes, algorithm = 'sha256') => createHash(algorithm).update(bytes).digest('hex');
const requireValue = (ok, message) => { if (!ok) throw new Error(message); };
const safePath = p => typeof p === 'string' && p.length && !/[\\:\x00-\x1f]/.test(p) && p.split('/').every(s => s && s !== '.' && s !== '..' && s.toLowerCase() !== '.git' && !/[. ]$/.test(s) && !/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(s));

// Trusted manifest hash must come from the caller's separately reviewed record.
// This checker intentionally supports only unchanged, complete private staging.
export function checkSourceSnapshot({ repository, manifest, trustedSha256 }) {
  requireValue(typeof repository === 'string' && repository.length > 0, 'Explicit development repository required');
  const bytes = readFileSync(manifest);
  requireValue(/^[a-f0-9]{64}$/.test(trustedSha256 || '') && digest(bytes) === trustedSha256, 'Manifest trusted SHA256 mismatch');
  const data = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  requireValue(['application', 'gateway'].includes(data.component) && /^[a-f0-9]{40}$/.test(data.developmentCommit || ''), 'Invalid development identity');
  requireValue(data.publicSnapshotCommit === null && data.publicUploadApproved === false && data.deploymentReady === false, 'Only private stage manifests supported');
  requireValue(typeof data.stageDirectory === 'string' && Array.isArray(data.members), 'Missing stage or members');
  const stage = resolve(data.stageDirectory);
  requireValue(!lstatSync(stage).isSymbolicLink() && realpathSync(stage) === stage, 'Stage must not traverse symlinks');
  const git = (...args) => execFileSync('git', ['--no-replace-objects', '-c', 'protocol.allow=never', ...args], { cwd: repository, env: { ...process.env, GIT_NO_LAZY_FETCH: '1' }, maxBuffer: 32 * 1024 * 1024 });
  const tree = new Map(git('ls-tree', '-rz', data.developmentCommit).toString('utf8').split('\0').filter(Boolean).map(line => {
    const [, mode, type, blob, path] = /^(\d+) (\w+) ([a-f0-9]{40})\t([\s\S]+)$/.exec(line) || [];
    requireValue(path && type === 'blob', 'Unsupported tree member');
    return [path, { mode, blob }];
  }));
  requireValue(data.members.length === tree.size, 'Manifest must cover every development source and legal file; exclusions are unsupported');
  const expected = new Map(), casePaths = new Set();
  for (const member of data.members) {
    requireValue(safePath(member.path) && !expected.has(member.path) && !casePaths.has(member.path.toLowerCase()), 'Unsafe or duplicate member path');
    casePaths.add(member.path.toLowerCase());
    const original = tree.get(member.path);
    requireValue(original && member.mode === original.mode && member.developmentBlob === original.blob, 'Development tree/blob/mode mismatch');
    requireValue(member.staged === true, 'Exclusion requires a separately implemented explicit per-path authorization; proposals do not authorize removal');
    requireValue(['100644', '100755'].includes(member.mode), 'Symlinks and gitlinks are not supported in private staging');
    expected.set(member.path, member);
  }
  const actual = [];
  const walk = (directory, prefix = '') => {
    for (const name of readdirSync(directory)) {
      const relative = prefix + name, path = join(directory, name), stat = lstatSync(path);
      requireValue(safePath(relative) && !stat.isSymbolicLink(), 'Unsafe staged path or symlink');
      if (stat.isDirectory()) {
        requireValue([...expected.keys()].some(p => p.startsWith(relative + '/')), 'Extra staged directory');
        walk(path, relative + '/');
      } else {
        requireValue(stat.isFile(), 'Unsupported staged file type');
        const member = expected.get(relative);
        requireValue(member, 'Extra staged file');
        const content = readFileSync(path);
        requireValue(content.length === member.bytes && digest(content) === member.sha256, 'Staged bytes/hash mismatch');
        const blob = digest(Buffer.concat([Buffer.from(`blob ${content.length}\0`), content]), 'sha1');
        requireValue(blob === member.developmentBlob, 'Staged bytes do not match development blob');
        if (process.platform !== 'win32') requireValue(Boolean(stat.mode & 0o111) === (member.mode === '100755'), 'Staged executable mode mismatch');
        actual.push(relative);
      }
    }
  };
  walk(stage);
  requireValue(actual.length === expected.size, 'Missing staged source or legal file');
  // Force object availability checks without lazy network fetches.
  const entries = [...expected.values()];
  const objectInput = entries.map(m => m.developmentBlob).join('\n') + '\n';
  const checked = execFileSync('git', ['--no-replace-objects', '-c', 'protocol.allow=never', 'cat-file', '--batch-check'], { cwd: repository, input: objectInput, env: { ...process.env, GIT_NO_LAZY_FETCH: '1' }, maxBuffer: 32 * 1024 * 1024 }).toString().trim().split('\n');
  requireValue(checked.length === expected.size && checked.every((line, i) => line === `${entries[i].developmentBlob} blob ${entries[i].bytes}`), 'Missing or mismatched development blob object');
  return { stageOnly: true, publicUploadApproved: false, deploymentReady: false, component: data.component, developmentCommit: data.developmentCommit, manifestSha256: trustedSha256, members: actual.length, modeCheck: process.platform === 'win32' ? 'Git modes bound; Windows cannot attest POSIX executable bits' : 'Git and filesystem modes verified', scope: 'Complete unchanged private staging only; not source-rights, secret clearance, baseline ancestry or public-root approval' };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const { values } = parseArgs({ options: { repository: { type: 'string' }, manifest: { type: 'string' }, 'trusted-sha256': { type: 'string' } } });
    console.log(JSON.stringify(checkSourceSnapshot({ repository: values.repository, manifest: values.manifest, trustedSha256: values['trusted-sha256'] }), null, 2));
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
