module.exports = {
  header: '# 更新记录\n\n',
  types: [
    { type: 'feat', section: '✨ 新功能' },
    { type: 'fix', section: '🐞 修复' },
    { type: 'refactor', section: '♻️ 重构' },
    { type: 'perf', section: '⚡ 性能优化' },
    { type: 'chore', section: '🔧 维护', hidden: true },
    { type: 'docs', section: '📝 文档', hidden: true },
    { type: 'style', section: '🎨 样式', hidden: true },
    { type: 'test', section: '✅ 测试', hidden: true }
  ],
  commitUrlFormat: 'https://github.com/oliver-xie666/simple-music/commit/{{hash}}',
  compareUrlFormat: 'https://github.com/oliver-xie666/simple-music/compare/{{previousTag}}...{{currentTag}}',
  releaseCommitMessageFormat: 'chore(release): 发布 {{currentTag}}',
  skip: {
    tag: false,
    commit: false
  }
};

