#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import process from 'node:process';

const PLATFORM_TARGETS = {
  win32: ['--win', 'nsis', '--x64', '--arm64'],
  darwin: ['--mac', 'dmg', '--x64', '--arm64'],
  linux: ['--linux', 'AppImage', 'deb', '--x64', '--arm64']
};

const userArgs = process.argv.slice(2).filter(Boolean);
const resolvedTargets = userArgs.length > 0 ? userArgs : PLATFORM_TARGETS[process.platform];

if (!resolvedTargets) {
  console.error(`[release] 当前系统 (${process.platform}) 暂不支持打包。可通过参数指定 electron-builder 目标。`);
  process.exit(1);
}

const sharedEnv = { ...process.env, ELECTRON_MODE: 'true' };

const run = (command, args, opts = {}) => {
  console.log(`[release] ${command} ${args.join(' ')}`.trim());
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: opts.env ?? process.env
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
};

run('npx', ['vue-tsc', '--noEmit']);
run('npx', ['vite', 'build'], { env: sharedEnv });
// 添加 --publish never 明确禁用发布，发布由 GitHub Actions 的 publish job 处理
run('npx', ['electron-builder', '--publish', 'never', ...resolvedTargets], { env: sharedEnv });

