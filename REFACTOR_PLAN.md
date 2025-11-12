# 重构计划 - 完全按照 Solara

## ❌ 当前问题

1. **布局方式错误** - 我用的是 Flex，Solara 用的是 CSS Grid
2. **组件拆分不当** - 拆分成了 5 个组件，应该更集中
3. **UI 不一致** - 没有完全复刻 Solara 的视觉效果

## ✅ Solara 的真实结构

### HTML 结构
```
container (Grid 布局)
├── header
├── search-area
└── main-content (Grid: cover | playlist/lyrics | controls)
    ├── cover-area (左侧)
    │   ├── album-cover (唱片)
    │   └── current-song-info (歌曲信息)
    ├── playlist + favorites + lyrics (右侧，Tab切换)
    │   ├── playlist (播放列表)
    │   ├── favorites (收藏列表)
    │   └── lyrics (歌词面板)
    └── controls (底部)
        ├── transport-controls (播放按钮)
        ├── progress-container (进度条)
        └── control-trailing (音量+探索雷达)
```

### CSS Grid 布局
```css
.container {
    display: grid;
    grid-template-areas:
        "header header"
        "search search"
        "cover playlist"
        "controls controls";
    grid-template-columns: 1fr 1fr;
    grid-template-rows: auto auto 1fr auto;
}
```

## 🎯 正确的重构方案

### 组件结构（3个组件即可）
```
App.vue (主容器 + Grid布局 + 音频控制)
├── Header.vue (标题 + 主题切换)
├── SearchArea.vue (搜索框 + 结果)
└── MainContent.vue (核心区域，包含所有逻辑)
    ├── CoverArea (封面 + 歌曲信息)
    ├── PlaylistTabs (播放列表 + 收藏 + 歌词切换)
    └── PlayerControls (播放控制 + 进度条 + 音量)
```

### 关键要点
1. ✅ 使用 CSS Grid 布局
2. ✅ 3个主面板可切换：播放列表 / 收藏列表 / 歌词
3. ✅ 底部控制条固定
4. ✅ 响应式设计（桌面版）

## 📝 实施步骤

1. 简化组件结构 - 3个核心组件
2. 使用 Grid 布局替代 Flex
3. 完全复刻 Solara 的 CSS 样式
4. 确保所有交互逻辑一致

