<template>
  <div 
    ref="lyricsContainer"
    class="rounded-4 p-5 border flex flex-col h-full overflow-hidden transition-all duration-500"
    style="grid-area: lyrics; background: rgba(255, 255, 255, 0.5); backdrop-filter: blur(10px);"
    :class="[
      store.isDark ? 'bg-[#2c2c2c]/50 border-white/15' : 'bg-white/50 border-black/10'
    ]"
  >
    <div 
      class="flex-1 overflow-y-auto overflow-x-hidden pr-2 -mr-2"
      :class="store.lyrics.length === 0 ? 'flex items-center justify-center' : ''"
    >
      <!-- 空状态 -->
      <div 
        v-if="store.lyrics.length === 0"
        class="text-0.9em italic opacity-70"
        :class="store.isDark ? 'text-[#95a5a6]' : 'text-[#7f8c8d]'"
      >
        歌词将在此处同步显示
      </div>

      <!-- 歌词内容 -->
      <div v-else class="w-full text-center py-4">
        <div 
          v-for="(line, index) in store.lyrics" 
          :key="index"
          :ref="el => { if (index === store.currentLyricLine) currentLyricRef = el }"
          class="px-1.25 py-2 mb-1.25 transition-all duration-300 rounded-2"
          :class="[
            index === store.currentLyricLine 
              ? store.isDark 
                ? 'text-[#34d1b6] font-bold bg-[#1abc9c]/12 scale-105' 
                : 'text-[#1e9f78] font-bold bg-[#2ecc71]/12 scale-105'
              : store.isDark ? 'text-[#ecf0f1]' : 'text-[#2c3e50]'
          ]"
          :style="index === store.currentLyricLine ? 'box-shadow: 0 4px 15px rgba(46, 204, 113, 0.18); line-height: 2.2;' : 'line-height: 2;'"
        >
          {{ line.text }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { useAppStore } from '../store'

const store = useAppStore()
const lyricsContainer = ref<HTMLElement | null>(null)
const currentLyricRef = ref<any>(null)

// 监听当前歌词行变化，自动滚动
watch(() => store.currentLyricLine, () => {
  nextTick(() => {
    if (currentLyricRef.value && lyricsContainer.value) {
      const container = lyricsContainer.value.querySelector('.overflow-y-auto')
      if (container) {
        const lyricEl = currentLyricRef.value as HTMLElement
        const containerRect = container.getBoundingClientRect()
        const lyricRect = lyricEl.getBoundingClientRect()
        
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

