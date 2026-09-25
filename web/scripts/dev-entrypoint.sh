#!/bin/sh
# dev-entrypoint.sh: 在生产镜像里跑 next dev + generation worker
# - 下载 pnpm tarball 解压到 node_modules/pnpm/
# - 创建 pnpm wrapper 脚本 (避免 sh 模板转义陷阱)
# - pnpm install --prod=false 补 dev deps
# - 启动 run-app.mjs dev (next dev + generation worker)
set -e

PNPM_VERSION=11.9.0

cd /app/web

# 0. 修复权限 - bind mount 后目录可能是 root 拥有, 但容器跑的是 node user
# 只改 next dev 写入的目录 (.next-dev) 和 data 目录, 不递归 pnpm-store (太慢)
echo "[dev-entrypoint] 修复 bind mount 权限..."
chown node:node /app/web/.next-dev 2>/dev/null || mkdir -p /app/web/.next-dev && chown node:node /app/web/.next-dev
chown node:node /app/web/.data 2>/dev/null || true
# pnpm-store 已有文件不需要 chown, 但创建新文件时需要 - 改父目录权限
chown node:node /app/web/.pnpm-store 2>/dev/null || true
mkdir -p /app/web/node_modules
chown node:node /app/web/node_modules 2>/dev/null || true
mkdir -p /app/web/node_modules/.bin
chown node:node /app/web/node_modules/.bin 2>/dev/null || true

# 1. 安装 pnpm (从 npm registry 下载 tarball, 解压到 node_modules/pnpm/)
if [ ! -d node_modules/pnpm ]; then
    echo "[dev-entrypoint] 下载 pnpm@${PNPM_VERSION} tarball..."
    mkdir -p node_modules
    node <<'NODE_EOF'
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
(async () => {
    const url = 'https://registry.npmjs.org/pnpm/-/pnpm-11.9.0.tgz';
    const tmp = '/tmp/pnpm.tgz';
    // 3 次重试, 容器网络偶发抖动
    let lastErr;
    for (let i = 0; i < 3; i++) {
        try {
            console.log(`fetching (attempt ${i+1})`, url);
            const res = await fetch(url, {
                signal: AbortSignal.timeout(60000),
                keepalive: false,
            });
            if (!res.ok) throw new Error('HTTP ' + res.status);
            const buf = Buffer.from(await res.arrayBuffer());
            if (buf.length < 100000) throw new Error('response too small: ' + buf.length);
            fs.writeFileSync(tmp, buf);
            console.log('downloaded', buf.length, 'bytes');
            lastErr = null;
            break;
        } catch(e) {
            lastErr = e;
            console.log(`retry after err:`, e.message);
            await new Promise(r => setTimeout(r, 3000));
        }
    }
    if (lastErr) throw lastErr;
    execSync('tar -xzf ' + tmp + ' -C /tmp', { stdio: 'inherit' });
    const dst = 'node_modules/pnpm';
    fs.mkdirSync(dst, { recursive: true });
    execSync('cp -r /tmp/package/. ' + dst, { stdio: 'inherit' });
    console.log('extracted to', dst);
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
NODE_EOF
    # 创建 wrapper 脚本 - 单独写文件避免引号转义问题
    mkdir -p node_modules/.bin
    cat > node_modules/.bin/pnpm <<'WRAPPER_EOF'
#!/bin/sh
cd /app/web/node_modules/pnpm/bin
exec node ./pnpm.cjs "$@"
WRAPPER_EOF
    chmod +x node_modules/.bin/pnpm
    ./node_modules/.bin/pnpm --version
fi

# 2. 检查 dev deps
# 改进: 不用 --prod=false (会尝试下载完整 dev 链, 慢且易超时)
# 改为按需软链接具体 dev 工具: next, typescript, vitest, eslint
if [ ! -x node_modules/.bin/next ] || [ ! -d node_modules/typescript ]; then
    echo "[dev-entrypoint] 安装依赖 (production + dev tools 都需要)..."
    ./node_modules/.bin/pnpm install 2>&1 | tail -10
    # pnpm install 可能清掉 .bin/pnpm wrapper, 重建
    if [ ! -x node_modules/.bin/pnpm ]; then
        mkdir -p node_modules/.bin
        cat > node_modules/.bin/pnpm <<'WRAPPER_EOF'
#!/bin/sh
cd /app/web/node_modules/pnpm/bin
exec node ./pnpm.cjs "$@"
WRAPPER_EOF
        chmod +x node_modules/.bin/pnpm
    fi
fi

# 3. 校验 native deps
if ! node -e "require('sharp')" 2>/dev/null; then
    echo "[dev-entrypoint] ⚠️ sharp 不可用"
fi

# 4. 启动 dev mode
echo "[dev-entrypoint] 启动 next dev + generation worker on :3000..."
exec node scripts/run-app.mjs dev