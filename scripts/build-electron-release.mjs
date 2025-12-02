#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import process from 'node:process';
import { mkdirSync, rmSync, readdirSync, statSync, copyFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

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
const releaseDir = join(process.cwd(), 'release');
const artifactsDir = join(releaseDir, 'artifacts');
const platformLabelMap = {
  win32: 'windows',
  darwin: 'macos',
  linux: 'linux'
};
const platformLabel = platformLabelMap[process.platform] || process.platform;

const ARTIFACT_PATTERNS = [
  /\.exe$/i,
  /\.exe\.blockmap$/i,
  /\.dmg$/i,
  /\.dmg\.blockmap$/i,
  /\.appimage$/i,
  /\.deb$/i,
  /\.rpm$/i,
  /\.pacman$/i,
  /\.7z$/i,
  /\.zip$/i,
  /\.tar\.gz$/i,
  /\.yml$/i,
];

const ensureArtifactsDir = () => {
  rmSync(artifactsDir, { recursive: true, force: true });
  mkdirSync(artifactsDir, { recursive: true });
};

const renameWithPlatformIfNeeded = (fileName) => {
  if (/\.ya?ml$/i.test(fileName)) {
    return `${platformLabel}-${fileName}`;
  }
  return fileName;
};

const collectArtifacts = () => {
  if (!existsSync(releaseDir)) {
    console.error(`[release] ❌ release directory does not exist: ${releaseDir}`);
    return;
  }
  
  console.log(`[release] Scanning release directory: ${releaseDir}`);
  const entries = readdirSync(releaseDir);
  console.log(`[release] Found ${entries.length} entries in release directory`);
  
  let collectedCount = 0;
  for (const entry of entries) {
    const fullPath = join(releaseDir, entry);
    const stat = statSync(fullPath);
    if (!stat.isFile()) {
      console.log(`[release] Skipping directory: ${entry}`);
      continue;
    }
    const matched = ARTIFACT_PATTERNS.some((regex) => regex.test(entry));
    if (!matched) {
      console.log(`[release] Skipping non-artifact file: ${entry}`);
      continue;
    }
    const targetName = renameWithPlatformIfNeeded(entry);
    copyFileSync(fullPath, join(artifactsDir, targetName));
    console.log(`[release] ✓ artifact collected -> ${targetName}`);
    collectedCount++;
  }
  
  if (collectedCount === 0) {
    console.error(`[release] ❌ No artifacts collected! Available files:`);
    entries.forEach(entry => {
      const fullPath = join(releaseDir, entry);
      const stat = statSync(fullPath);
      if (stat.isFile()) {
        console.error(`[release]   - ${entry}`);
      }
    });
    process.exit(1);
  }
  
  console.log(`[release] ✓ Total artifacts collected: ${collectedCount}`);
};

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
ensureArtifactsDir();
console.log(`[release] Building with electron-builder: ${resolvedTargets.join(' ')}`);
run('npx', ['electron-builder', '--publish', 'never', ...resolvedTargets], { env: sharedEnv });
console.log(`[release] Build completed, collecting artifacts...`);
collectArtifacts();

