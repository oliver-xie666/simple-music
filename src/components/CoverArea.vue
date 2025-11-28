<template>
  <div 
    class="rounded-4 p-5 border flex flex-col items-center justify-center gap-4 text-center h-full overflow-hidden transition-all duration-500 [grid-area:cover] bg-[rgba(255,255,255,0.5)] backdrop-blur-[10px]"
    :class="[
      themeStore.isDark ? 'bg-[#2c2c2c]/50 border-white/15' : 'bg-white/50 border-black/10',
      mobile.isMobileView.value ? 'bg-transparent border-none p-0 items-center gap-[clamp(16px,4vw,24px)]' : ''
    ]"
  >
    <!-- 移动端转盘 -->
    <div 
      v-if="mobile.isMobileView.value && !mobile.isInlineLyricsOpen.value"
      class="mobile-turntable flex justify-center mb-0 relative cursor-pointer"
      @click="mobile.toggleInlineLyrics()"
    >
      <div 
        class="mobile-turntable__platter rounded-full relative flex items-center justify-center overflow-hidden w-[min(70vw,280px)] aspect-square bg-[radial-gradient(circle_at_48%_50%,#1a1d25_0%,#05070c_65%,#000_100%)] shadow-[0_32px_70px_rgba(0,0,0,0.55)]"
        :class="playerStore.isPlaying ? 'turntable-spin' : ''"
      >
        <!-- 转盘纹理 -->
        <div 
          class="absolute inset-[6%] rounded-full pointer-events-none opacity-35 turntable-texture"
        ></div>
        
        <!-- 封面图片 -->
        <div 
          class="album-cover absolute top-1/2 left-1/2 rounded-full overflow-hidden z-[2] w-[58%] aspect-square -translate-x-1/2 -translate-y-1/2 bg-[rgba(0,0,0,0.35)] [box-shadow:inset_0_0_0_3px_rgba(0,0,0,0.55),_0_18px_38px_rgba(0,0,0,0.45)]"
        >
          <img 
            v-if="playerStore.currentSong?.cover" 
            :src="playerStore.currentSong.cover" 
            alt="封面"
            class="w-full h-full object-cover rounded-full"
            @error="handleImageError"
          />
          <div 
            v-else 
            class="w-full h-full flex items-center justify-center text-white/90 text-[clamp(36px,12vw,48px)]"
          >
            <i class="fas fa-music"></i>
          </div>
        </div>
      </div>
    </div>

    <!-- 移动端内联歌词 -->
    <div 
      v-if="mobile.isMobileView.value && mobile.isInlineLyricsOpen.value"
      @click="mobile.toggleInlineLyrics()"
      class="mobile-inline-lyrics flex flex-col items-center justify-start w-[min(70vw,280px)] h-[min(70vw,280px)] rounded-[26px] p-[18px_clamp(14px,4vw,20px)] gap-3 overflow-hidden cursor-pointer bg-white/5 backdrop-blur-[18px] shadow-[0_24px_60px_rgba(0,0,0,0.45)]"
    >
      <div class="text-[0.78rem] text-white/65 tracking-wider uppercase flex items-center gap-2">
        <i class="fas fa-arrow-left text-[0.7rem]"></i>
        轻触返回封面
      </div>
      <div 
        class="flex-1 w-full overflow-y-auto pr-1.5 -mr-1.5 flex flex-col gap-1.5"
        style="-webkit-overflow-scrolling: touch;"
      >
        <div class="flex flex-col gap-1 w-full">
          <div 
            v-for="(line, index) in lyricsStore.lyrics" 
            :key="index"
            class="text-center transition-all duration-250 rounded-[14px] px-2.5 break-words"
            :class="[
              index === lyricsStore.currentLine 
                ? 'text-[#f3a25b] bg-[rgba(243,162,91,0.18)] shadow-[0_12px_32px_rgba(243,162,91,0.32)] text-white/75 text-[clamp(0.82rem,3.8vw,0.98rem)] py-1' 
                : 'text-white/60 text-[clamp(0.8rem,3.5vw,0.95rem)] py-1.5 leading-relaxed'
            ]"
          >
            {{ line.text }}
          </div>
        </div>
      </div>
    </div>

    <!-- 桌面端封面 -->
    <div 
      v-if="!mobile.isMobileView.value"
      class="w-full max-w-[260px] aspect-square flex-shrink-0 rounded-3 flex items-center justify-center mb-5 overflow-hidden relative bg-[linear-gradient(45deg,#1abc9c,#2ecc71)] shadow-[0_8px_20px_rgba(0,0,0,0.15)]"
      :class="!playerStore.currentSong ? 'animate-pulse' : ''"
    >
      <img 
        v-if="playerStore.currentSong?.cover" 
        :src="playerStore.currentSong.cover" 
        alt="封面"
        class="w-full h-full object-cover rounded-3"
        @error="handleImageError"
      />
      <div 
        v-else 
        class="text-[48px] text-white opacity-80 flex items-center justify-center w-full h-full"
      >
        <i class="fas fa-music"></i>
      </div>
    </div>

    <!-- 歌曲信息 -->
    <div 
      class="w-full mt-2 flex flex-col items-center gap-1.5"
      :class="mobile.isMobileView.value ? 'mt-0' : ''"
    >
      <div 
        class="font-semibold whitespace-nowrap overflow-hidden text-ellipsis transition-colors duration-300 text-center"
        :class="[
          mobile.isMobileView.value 
            ? 'text-[clamp(1.05rem,5vw,1.32rem)] text-white font-semibold tracking-wide' 
            : 'text-base mb-1.25',
          !mobile.isMobileView.value && (themeStore.isDark ? 'text-[#ecf0f1]' : 'text-[#2c3e50]')
        ]"
      >
        {{ playerStore.currentSong?.name || '选择一首歌曲开始播放' }}
      </div>
      <div 
        class="whitespace-nowrap overflow-hidden text-ellipsis transition-colors duration-300 text-center"
        :class="[
          mobile.isMobileView.value 
            ? 'text-[0.95rem] text-white/70' 
            : 'text-[14px]',
          !mobile.isMobileView.value && (themeStore.isDark ? 'text-[#95a5a6]' : 'text-[#7f8c8d]')
        ]"
      >
        {{ artistText }}
      </div>
      
      <!-- 移动端音质选择 -->
      <div class="relative mt-2">
        <button
          v-if="mobile.isMobileView.value"
          ref="qualityButtonRef"
          data-quality-button
          @click.stop="showQualityMenu = !showQualityMenu"
          class="inline-flex items-center justify-center gap-2 px-[18px] py-2 rounded-full border transition-all duration-250 cursor-pointer"
          :class="[
            showQualityMenu 
              ? 'bg-gradient-to-br from-[rgba(243,109,109,0.95)] to-[rgba(243,162,91,0.95)] border-transparent text-[#1b1d24] shadow-[0_14px_32px_rgba(243,109,109,0.35)] -translate-y-[1px]' 
              : 'bg-white/10 border-white/18 text-white/92 hover:bg-white/20 hover:border-white/32',
            'text-[0.85rem] font-medium tracking-wide'
          ]"
        >
          <span>{{ qualityText }}</span>
          <i class="fas fa-chevron-down text-[0.75rem] opacity-85"></i>
        </button>
        
        <!-- 音质菜单 -->
        <Teleport to="body">
          <div
            v-if="showQualityMenu && mobile.isMobileView.value"
            data-quality-menu
            ref="qualityMenuRef"
            class="fixed rounded-3 border min-w-[180px] overflow-hidden z-[100000] transition-all duration-200 shadow-[0_12px_30px_rgba(0,0,0,0.2)] p-2"
            :class="themeStore.isDark ? 'bg-[#1c1c1c] border-white/15' : 'bg-white border-black/10'"
            :style="qualityMenuStyle"
            @click.stop
          >
            <div
              v-for="option in QUALITY_OPTIONS"
              :key="option.value"
              @click="handleQualitySelect(option.value)"
            class="flex items-center justify-between gap-3 px-4 py-2.5 text-0.95em cursor-pointer transition-all duration-200"
            :class="[
              playerStore.quality === option.value
                ? (themeStore.isDark ? 'bg-[#1abc9c]/20 text-[#1abc9c]' : 'bg-[#1abc9c]/20 text-[#1abc9c]')
                : themeStore.isDark ? 'text-white hover:bg-white/10' : 'text-[#2c3e50] hover:bg-[#1abc9c]/10'
            ]"
            >
              <span>{{ option.label }}</span>
              <i v-if="playerStore.quality === option.value" class="fas fa-check text-0.85em"></i>
            </div>
          </div>
        </Teleport>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, ref, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { usePlayerStore } from '../stores/player'
import { useThemeStore } from '../stores/theme'
import { useLyricsStore } from '../stores/lyrics'
import { normalizeArtistField } from '../utils/song-utils'
import { QUALITY_OPTIONS } from '../utils/quality-options'
import { usePlayer } from '../composables/usePlayer'

const playerStore = usePlayerStore()
const themeStore = useThemeStore()
const lyricsStore = useLyricsStore()
const mobile = inject<any>('mobile', null)
const { reloadCurrentSongWithNewQuality } = usePlayer()

const showQualityMenu = ref(false)
const qualityButtonRef = ref<HTMLElement | null>(null)
const qualityMenuRef = ref<HTMLElement | null>(null)
const qualityMenuStyle = ref<Record<string, string>>({})

const qualityText = computed(() => 
  QUALITY_OPTIONS.find(q => q.value === playerStore.quality)?.label || '极高音质'
)

function updateQualityMenuPosition() {
  if (!showQualityMenu.value || !qualityButtonRef.value || !qualityMenuRef.value || !mobile?.isMobileView.value) {
    return
  }
  
  nextTick(() => {
    // 确保获取的是按钮元素，而不是外层div
    const button = qualityButtonRef.value as HTMLElement
    if (!button || !button.getBoundingClientRect) {
      return
    }
    
    const buttonRect = button.getBoundingClientRect()
    const menuHeight = qualityMenuRef.value!.offsetHeight || 200
    const viewportHeight = window.innerHeight
    const viewportWidth = window.innerWidth
    const spacing = 10
    
    // 优先显示在按钮上方
    let top = buttonRect.top - spacing - menuHeight
    
    if (top < spacing) {
      // 如果上方空间不足，显示在下方
      top = buttonRect.bottom + spacing
      if (top + menuHeight > viewportHeight - spacing) {
        top = Math.max(spacing, viewportHeight - spacing - menuHeight)
      }
    }
    
    // 移动端竖屏模式：菜单与按钮居中对齐
    const menuWidth = qualityMenuRef.value!.offsetWidth || 180
    const isPortraitOrientation = viewportHeight >= viewportWidth
    
    let left: number
    if (isPortraitOrientation) {
      // 竖屏：菜单中心与按钮中心对齐
      left = buttonRect.left + (buttonRect.width / 2) - (menuWidth / 2)
    } else {
      // 横屏：菜单右边缘与按钮右边缘对齐
      left = buttonRect.right - menuWidth
    }
    
    // 确保菜单不超出视口
    const minLeft = spacing
    const maxLeft = Math.max(minLeft, viewportWidth - spacing - menuWidth)
    const adjustedLeft = Math.min(Math.max(left, minLeft), maxLeft)
    
    qualityMenuStyle.value = {
      top: `${Math.round(top)}px`,
      left: `${Math.round(adjustedLeft)}px`,
      transform: 'none',
    }
  })
}

function handleQualitySelect(quality: string) {
  if (playerStore.quality === quality) {
    showQualityMenu.value = false
    return
  }
  playerStore.setQuality(quality as any)
  showQualityMenu.value = false
  if (playerStore.currentSong) {
    reloadCurrentSongWithNewQuality()
  }
}

function handleClickOutside(event: MouseEvent) {
  const target = event.target as HTMLElement
  const qualityMenu = document.querySelector('[data-quality-menu]')
  const qualityButton = document.querySelector('[data-quality-button]')
  if (qualityMenu && !qualityMenu.contains(target) && qualityButton && !qualityButton.contains(target)) {
    showQualityMenu.value = false
  }
}

watch(showQualityMenu, (isOpen) => {
  if (isOpen) {
    // 使用双重 nextTick 确保 DOM 完全渲染后再计算位置
    nextTick(() => {
      nextTick(() => {
        updateQualityMenuPosition()
      })
    })
    window.addEventListener('resize', updateQualityMenuPosition)
    window.addEventListener('scroll', updateQualityMenuPosition, true)
    // 添加一个延迟更新，确保菜单已经渲染完成
    setTimeout(() => {
      updateQualityMenuPosition()
    }, 50)
  } else {
    window.removeEventListener('resize', updateQualityMenuPosition)
    window.removeEventListener('scroll', updateQualityMenuPosition, true)
  }
})

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
  window.removeEventListener('resize', updateQualityMenuPosition)
  window.removeEventListener('scroll', updateQualityMenuPosition, true)
})

function handleImageError() {
  // 如果封面加载失败，清空 cover，触发占位图显示，避免反复报错
  if (playerStore.currentSong && typeof playerStore.currentSong === 'object') {
    ;(playerStore.currentSong as any).cover = ''
  }
}

const artistText = computed(() => normalizeArtistField(playerStore.currentSong?.artist))
</script>

<style>
@keyframes mobile-turntable-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.turntable-spin {
  animation: mobile-turntable-spin 18s linear infinite;
}

.turntable-texture {
  background:
    radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.05) 10%, transparent 45%),
    conic-gradient(from 90deg, rgba(255, 255, 255, 0.12) 0deg, transparent 45deg, transparent 180deg, rgba(255, 255, 255, 0.08) 225deg, transparent 360deg),
    radial-gradient(circle at 48% 45%, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.02) 35%, transparent 60%);
}
</style>
