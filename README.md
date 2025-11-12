# Simple Music

一个基于 Electron + Vue3 + TypeScript + UnoCSS 的桌面音乐播放器

## ✨ 特性

- 🎵 **多平台音乐搜索** - 支持网易云音乐、QQ音乐、酷狗音乐、酷我音乐
- 🎧 **在线播放** - 流畅的音乐播放体验
- 📝 **歌词显示** - 实时滚动显示歌词
- ⭐ **收藏功能** - 收藏喜欢的音乐
- 🎨 **动态主题** - 根据封面自动提取主色调
- 🌓 **深色模式** - 支持浅色/深色模式切换
- 🎛️ **播放模式** - 列表循环、单曲循环、随机播放
- 💾 **本地持久化** - 自动保存播放列表和收藏

## 🚀 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

### 构建应用

```bash
npm run build
```

## 📦 技术栈

- **Electron** - 跨平台桌面应用框架
- **Vue 3** - 渐进式 JavaScript 框架
- **TypeScript** - JavaScript 的超集
- **Vite** - 下一代前端构建工具
- **UnoCSS** - 即时按需原子化 CSS 引擎
- **Pinia** - Vue 的状态管理库

## 📁 项目结构

```
simple-music/
├── electron/           # Electron 主进程
│   ├── main.ts        # 应用主入口
│   ├── preload.ts     # 预加载脚本
│   └── services/      # 后端服务（API、存储、取色）
├── src/
│   ├── App.vue        # 主应用组件
│   ├── main.ts        # Vue 入口
│   ├── store.ts       # 状态管理
│   ├── types.ts       # 类型定义
│   └── components/    # Vue 组件
│       ├── SearchArea.vue
│       ├── CoverArea.vue
│       ├── PlaylistArea.vue
│       └── PlayerControls.vue
└── 配置文件
```

## ⚙️ 功能说明

### 音乐搜索
- 支持多个音乐平台的搜索
- 搜索结果支持添加到播放列表或收藏

### 播放控制
- 支持播放/暂停、上一曲/下一曲
- 可调节音量
- 支持进度条拖拽
- 多种播放模式切换

### 歌词显示
- 实时同步显示歌词
- 自动高亮当前歌词

### 数据持久化
- 自动保存播放列表
- 自动保存收藏列表
- 记忆音量、播放模式等设置

## 🎨 界面特点

- **玻璃拟态设计** - 现代化的毛玻璃效果
- **动态渐变背景** - 根据当前播放歌曲封面自动提取颜色
- **流畅动画** - 精心设计的过渡动画
- **响应式布局** - 适配不同屏幕尺寸

## ⚠️ 免责声明

本项目仅供学习交流使用，音乐版权归各大音乐平台所有，请支持正版音乐！

API 由 [GD音乐台](https://music.gdstudio.xyz) 提供。

## 📄 开源协议

本项目采用 CC BY-NC-SA 4.0 协议开源。

## 🙏 致谢

本项目UI设计和部分逻辑参考了 [Solara](https://github.com/yourusername/Solara) 项目，特此感谢！

---

Made with ❤️ by oliver-xie666
