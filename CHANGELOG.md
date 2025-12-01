# 更新记录


### [0.0.9](https://github.com/oliver-xie666/simple-music/compare/v0.0.8...v0.0.9) (2025-12-01)

### 0.0.1 (2025-11-28)


### ♻️ 重构

* 优化ui ([9ebfa3b](https://github.com/oliver-xie666/simple-music/commit/9ebfa3bb237878a51ead49203a57c8d97c2e4325))
* 重构api架构；重构store存储；重构工具函数 ([8d9c41d](https://github.com/oliver-xie666/simple-music/commit/8d9c41dfe9475671658a7e41683cbd4b6e783b0a))


### 🐞 修复

* 优化下载的音质列表选择 ([843db11](https://github.com/oliver-xie666/simple-music/commit/843db11ecccd8f44636cdd8f28ef15865519d655))
* 优化切换音质后的播放逻辑 ([853388d](https://github.com/oliver-xie666/simple-music/commit/853388d12b6a1a62ffb9ec8f0945b45b6dc889e0))
* 优化封面模块ui ([0542b4f](https://github.com/oliver-xie666/simple-music/commit/0542b4ff351c236fc6b0855d577163a62e05956a))
* 优化探索雷达的逻辑 ([086c94d](https://github.com/oliver-xie666/simple-music/commit/086c94d9455e582b0f36b079bd927e55b21ec060))
* 优化搜索ui；新增骨架屏 ([44356ac](https://github.com/oliver-xie666/simple-music/commit/44356ac2f92d98a25cf837eb019160ad62809c53))
* 优化搜索结果项ui ([698334e](https://github.com/oliver-xie666/simple-music/commit/698334eaa47615bbf080d522d4806d6627bebefe))
* 优化搜索逻辑 ([20c26e0](https://github.com/oliver-xie666/simple-music/commit/20c26e0a036041dabe622b9340f97c6d6a116686))
* 优化播放区域音质列表的展示与隐藏 ([896eedb](https://github.com/oliver-xie666/simple-music/commit/896eedbe8a5c240809e7e217ee897668a26bc6de))
* 优化播放控制模块的ui和逻辑 ([a63aa39](https://github.com/oliver-xie666/simple-music/commit/a63aa39a802b0eb7519f0d6e85d4cefa1280408c))
* 优化播放进度记录功能；优化播放进度拖拽功能 ([81d1511](https://github.com/oliver-xie666/simple-music/commit/81d15118efd3d4227629b12ae424e2733727335c))
* 优化样式 ([0a7544a](https://github.com/oliver-xie666/simple-music/commit/0a7544adea0525843dd27cac461af346182baf15))
* 优化歌词模块的选中样式 ([e807f18](https://github.com/oliver-xie666/simple-music/commit/e807f18df02010f4d8ca0e98b8e601edc0fa44f9))
* 优化清空播放列表逻辑 ([2d56288](https://github.com/oliver-xie666/simple-music/commit/2d5628800b9987867c1574bb539798d7dab45a2c))
* 修复控制台报错 ([dfcc465](https://github.com/oliver-xie666/simple-music/commit/dfcc4656c58824dfd499e0770293b5907de75b16))


### ✨ 新功能

* 优化播放列表的ui和逻辑 ([610f4e1](https://github.com/oliver-xie666/simple-music/commit/610f4e11bb23af80fc3defe6c0cbd26aeb453217))
* 初始化 Simple Music 项目 ([e39ebbb](https://github.com/oliver-xie666/simple-music/commit/e39ebbba53bd84a4efe5ed4748a762100c9362eb))
* 拆分 web端和electron端，优化两端打包 ([a4be37f](https://github.com/oliver-xie666/simple-music/commit/a4be37faa223c47c3b2f01e4e68425c030a5c5e4))
* 新增web 移动端ui ([76c11a2](https://github.com/oliver-xie666/simple-music/commit/76c11a2554dc7735d1d205ececf971587a698f3f))
* 新增web端部署 ([437b1e8](https://github.com/oliver-xie666/simple-music/commit/437b1e8096aebe7c0419ee2ba8c1d05740fbb812))
* 新增下载功能和下载列表ui ([ef74b9f](https://github.com/oliver-xie666/simple-music/commit/ef74b9f4560d53c9491fa418cf6afbc76687f39b))
* 新增批量下载功能和ui ([de908de](https://github.com/oliver-xie666/simple-music/commit/de908de129463703b34809a992e70874776a72ec))
* 新增搜索结果页的播放逻辑 ([4c71cda](https://github.com/oliver-xie666/simple-music/commit/4c71cdaf4dbb689e4ee2751d279b2b3c0dbf30ce))
* 新增歌词点击跳转播放进度 ([c54d385](https://github.com/oliver-xie666/simple-music/commit/c54d385257d09b7269377dfa6543259845761b58))
* 样式优化更改 ([3a47de6](https://github.com/oliver-xie666/simple-music/commit/3a47de6cef7ca1975548fcdf141d8912dda4c116))

## [0.0.1] - 2025-11-28

### ✨ 新功能
- 新增面向 NAS 的 web 端部署流程，并提供独立 Nginx 静态托管配置。
- 引入 web 端移动版 UI，提升小屏设备的浏览与控制体验。
- 支持下载中心（单曲下载、批量下载、下载列表）及相关 UI。
- 拆分 web 与 Electron 端构建链路，统一优化双端打包效率。
- 歌词模块支持点击定位播放进度，交互更直观。
- 播放列表、播放控制、探索雷达等区域的 UI 与交互全面升级。

### 🐞 修复 / 优化
- 优化播放区域音质列表、音质选择后的播放逻辑以及拖拽进度体验。
- 修复探索雷达、播放进度记录、控制台报错等已知问题。
- 加强搜索模块 UI（包含骨架屏）与播放列表清空逻辑体验。

### ♻️ 重构
- 重构 API 适配层、Pinia store 以及常用工具函数，便于后续扩展与测试。

### 🌐 发布说明
- 通过 `npm run build:electron:release` 可在当前系统上生成对应该平台的 x64 / arm64 安装包。
- GitHub Actions（`.github/workflows/release.yml`）会在推送 `v*` 标签后，为 Windows / macOS / Linux 自动构建多架构安装包并发布 Release。
