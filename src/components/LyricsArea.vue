<template>
  <div 
    ref="lyricsContainer"
    class="rounded-4 p-5 border flex flex-col h-full min-h-[220px] overflow-hidden transition-all duration-500"
    style="grid-area: lyrics; background: rgba(255, 255, 255, 0.5); backdrop-filter: blur(10px);"
    :class="[
      themeStore.isDark ? 'bg-[#2c2c2c]/50 border-white/15' : 'bg-white/50 border-black/10'
    ]"
  >
    <div 
      class="flex-1 overflow-y-auto overflow-x-hidden pr-2 -mr-2"
      :class="lyricsStore.lyrics.length === 0 ? 'flex items-center justify-center' : ''"
    >
      <!-- 空状态 -->
      <div 
        v-if="lyricsStore.lyrics.length === 0"
        class="text-0.9em italic opacity-70"
        :class="themeStore.isDark ? 'text-[#95a5a6]' : 'text-[#7f8c8d]'"
      >
        歌词将在此处同步显示
      </div>

      <!-- 歌词内容 -->
      <div v-else class="w-full text-center py-4">
        <div 
          v-for="(line, index) in lyricsStore.lyrics" 
          :key="index"
          :ref="el => { if (index === lyricsStore.currentLine) currentLyricRef = el }"
          class="px-1.25 py-2 mb-1.25 transition-all duration-300 rounded-2"
          :class="[
            index === lyricsStore.currentLine 
              ? 'text-[#1abc9c] font-medium bg-[#1abc9c]/20'
              : themeStore.isDark 
                ? 'text-[#ecf0f1] hover:bg-[#1abc9c]/10 hover:text-[#1abc9c]' 
                : 'text-[#2c3e50] hover:bg-[#1abc9c]/10 hover:text-[#1abc9c]'
          ]"
          :style="index === lyricsStore.currentLine ? 'line-height: 2.2;' : 'line-height: 2;'"
        >
          {{ line.text }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { useLyricsStore } from '../stores/lyrics'
import { useThemeStore } from '../stores/theme'

const lyricsStore = useLyricsStore()
const themeStore = useThemeStore()
const lyricsContainer = ref<HTMLElement | null>(null)
const currentLyricRef = ref<any>(null)

// 监听当前歌词行变化，自动滚动
watch(() => lyricsStore.currentLine, () => {
  nextTick(() => {
    if (currentLyricRef.value && lyricsContainer.value) {
      const container = lyricsContainer.value.querySelector('.overflow-y-auto')
      if (container) {
        const lyricEl = currentLyricRef.value as HTMLElement
        // 计算滚动位置，让当前歌词显示在中间
        const scrollTop = lyricEl.offsetTop - container.clientHeight / 2 + lyricEl.clientHeight / 2
        container.scrollTo({
          top: scrollTop,
          behavior: 'smooth'
        })
      }
    }
  })
})
</script>

