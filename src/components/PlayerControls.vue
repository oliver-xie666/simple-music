<template>
  <div 
    data-area="controls"
    :class="[
      'player-controls',
      isMobileActive 
        ? 'player-controls--mobile flex flex-col gap-[clamp(16px,5vw,24px)] items-stretch mt-auto bg-transparent border-none shadow-none'
        : 'grid w-full items-center transition-all duration-500 gap-x-5 gap-y-3 grid-cols-1 md:grid-cols-[auto_minmax(0,1fr)_auto_auto] [grid-area:controls]',
      isMobileActive && playerStore.isPlaying ? 'is-playing' : ''
    ]"
  >
    <template v-if="isMobileActive">
      <div 
        class="progress-container w-full grid order-1 [grid-template-columns:auto_1fr_auto] gap-y-2 gap-x-2.5 items-center"
      >
        <input 
          type="range" 
          :value="playerStore.currentTime" 
          :max="playerStore.duration || 0"
          step="0.1"
          @mousedown="handleSeekStart"
          @touchstart.passive="handleSeekStart"
          @input="handleSeekInput"
          @change="handleSeekChange"
          @mouseup="handleSeekRelease"
          @touchend="handleSeekRelease"
          @touchcancel="handleSeekRelease"
          class="w-full rounded-full col-span-3 row-start-1 h-[4px]"
          :style="{
            background: `linear-gradient(to right, rgba(243, 162, 91, 0.95) 0%, rgba(243, 162, 91, 0.95) ${playerStore.progress}%, rgba(255, 255, 255, 0.15) ${playerStore.progress}%, rgba(255, 255, 255, 0.15) 100%)`
          }"
        />
        <span 
          class="text-[0.8rem] text-white/60 col-start-1 row-start-2 justify-self-start [font-variant-numeric:tabular-nums]"
        >
          {{ playerStore.formattedCurrentTime }}
        </span>
        <span 
          class="text-[0.8rem] text-white/60 col-start-3 row-start-2 justify-self-end [font-variant-numeric:tabular-nums]"
        >
          {{ playerStore.formattedDuration }}
        </span>
      </div>
            <div 
              class="transport-controls w-full flex justify-between items-center order-2 gap-[clamp(8px,3vw,12px)] flex-nowrap"
            >
        <button
          v-if="mobile"
          class="transport-button transport-button--queue rounded-full border-none bg-white/8 text-white transition-all duration-250 active:scale-95 flex items-center justify-center flex-shrink-0 w-[clamp(42px,10vw,48px)] h-[clamp(42px,10vw,48px)] min-w-[clamp(42px,10vw,48px)] min-h-[clamp(42px,10vw,48px)] shadow-[0_12px_28px_rgba(0,0,0,0.35)] text-[0.95rem]"
          @click="mobile.openPanel('playlist')"
        >
          <i class="fas fa-bars"></i>
        </button>
        <button
          class="play-mode-btn transport-button rounded-full border-none bg-white/8 text-white transition-all duration-250 active:scale-95 flex items-center justify-center flex-shrink-0 w-[clamp(42px,10vw,48px)] h-[clamp(42px,10vw,48px)] min-w-[clamp(42px,10vw,48px)] min-h-[clamp(42px,10vw,48px)] shadow-[0_12px_28px_rgba(0,0,0,0.35)] text-[0.95rem]"
          :title="playModeTitle"
          @click="cyclePlayMode"
        >
          <i :class="playModeIcon"></i>
        </button>
        <button
          class="transport-button transport-button--prev rounded-full border-none bg-white/8 text-white transition-all duration-250 active:scale-95 flex items-center justify-center flex-shrink-0 w-[clamp(42px,10vw,48px)] h-[clamp(42px,10vw,48px)] min-w-[clamp(42px,10vw,48px)] min-h-[clamp(42px,10vw,48px)] shadow-[0_12px_28px_rgba(0,0,0,0.35)] text-[0.95rem]"
          :disabled="playlistStore.songs.length === 0"
          @click="playPrevious"
        >
          <i class="fas fa-backward-step"></i>
        </button>
        <button
          class="transport-button transport-button--play rounded-full border-none text-[#1f1b1d] transition-all duration-250 active:scale-95 flex items-center justify-center flex-shrink-0 w-[clamp(56px,14vw,64px)] h-[clamp(56px,14vw,64px)] min-w-[clamp(56px,14vw,64px)] min-h-[clamp(56px,14vw,64px)] bg-[linear-gradient(135deg,#f36d6d_0%,#f3a25b_100%)] shadow-[0_18px_36px_rgba(243,117,109,0.45)] text-[1rem]"
          :disabled="!playerStore.currentSong && playlistStore.songs.length === 0"
          @click="togglePlay"
        >
          <i v-if="playerStore.isLoading" class="fas fa-spinner fa-spin"></i>
          <i v-else :class="playerStore.isPlaying ? 'fas fa-pause' : 'fas fa-play'"></i>
        </button>
        <button
          class="transport-button transport-button--next rounded-full border-none bg-white/8 text-white transition-all duration-250 active:scale-95 flex items-center justify-center flex-shrink-0 w-[clamp(42px,10vw,48px)] h-[clamp(42px,10vw,48px)] min-w-[clamp(42px,10vw,48px)] min-h-[clamp(42px,10vw,48px)] shadow-[0_12px_28px_rgba(0,0,0,0.35)] text-[0.95rem]"
          :disabled="playlistStore.songs.length === 0"
          @click="playNext"
        >
          <i class="fas fa-forward-step"></i>
        </button>
        <button
          v-if="mobile"
          class="transport-button transport-button--download rounded-full border-none bg-white/8 text-white transition-all duration-250 active:scale-95 flex items-center justify-center flex-shrink-0 w-[clamp(42px,10vw,48px)] h-[clamp(42px,10vw,48px)] min-w-[clamp(42px,10vw,48px)] min-h-[clamp(42px,10vw,48px)] shadow-[0_12px_28px_rgba(0,0,0,0.35)] text-[0.95rem]"
          @click.stop="downloadStore.toggleDownloadList()"
        >
          <i class="fas fa-download"></i>
        </button>
      </div>
      
      <!-- 移动端下载列表 -->
      <Teleport to="body">
        <div
          v-if="mobile && mobile.isMobileView.value && downloadStore.showDownloadList"
          class="fixed inset-0 z-[500] flex items-end justify-center"
          @click.self="downloadStore.setShowDownloadList(false)"
        >
          <div
            class="w-full max-w-[420px] rounded-t-[28px] flex flex-col gap-4 max-h-[80vh] overflow-hidden transition-all duration-450 pb-[calc(env(safe-area-inset-bottom,0px)+20px)] backdrop-blur-[28px] shadow-[0_-28px_60px_rgba(0,0,0,0.6)]"
            :class="themeStore.isDark ? 'bg-[rgba(13,16,24,0.96)]' : 'bg-white/96'"
            @click.stop
          >
            <div class="flex flex-col gap-2">
              <!-- 拖拽手柄 -->
              <div 
                class="w-14 h-1 rounded-full mx-auto mb-2"
                :class="themeStore.isDark ? 'bg-white/28' : 'bg-black/28'"
              ></div>
              
              <div class="flex items-center justify-between px-5"
                :class="themeStore.isDark ? 'text-white' : 'text-[#2c3e50]'"
              >
                <h3 class="text-lg font-semibold">下载列表</h3>
                <button
                  @click="downloadStore.setShowDownloadList(false)"
                  class="w-9 h-9 rounded-full border flex items-center justify-center transition-all duration-200"
                  :class="themeStore.isDark 
                    ? 'border-white/18 bg-white/8 text-white hover:bg-white/14' 
                    : 'border-black/18 bg-black/8 text-[#2c3e50] hover:bg-black/14'"
                >
                  <i class="fas fa-times text-sm"></i>
                </button>
              </div>
            </div>
            <div class="flex-1 overflow-y-auto px-5 pb-5 min-h-0">
              <DownloadList />
            </div>
          </div>
        </div>
      </Teleport>
    </template>

    <template v-else>
    <!-- 左侧：播放控制 -->
    <div class="flex items-center gap-3 justify-center md:justify-self-start md:justify-start">
      <!-- 播放模式 -->
        <button 
        @click="cyclePlayMode" 
        class="bg-[#1abc9c] text-white border-none rounded-full cursor-pointer w-[44px] h-[44px] sm:w-[50px] sm:h-[50px] flex justify-center items-center transition-all duration-200 hover:bg-[#12836d] text-[1.2em] shadow-[0_4px_10px_rgba(0,0,0,0.1)]"
        :title="playModeTitle"
      >
        <i :class="playModeIcon"></i>
      </button>

      <!-- 上一曲 -->
      <button 
        @click="playPrevious" 
        class="bg-[#1abc9c] text-white border-none rounded-full cursor-pointer w-[44px] h-[44px] sm:w-[50px] sm:h-[50px] flex justify-center items-center transition-all duration-200 hover:bg-[#12836d] text-[1.2em] shadow-[0_4px_10px_rgba(0,0,0,0.1)]"
        :disabled="playlistStore.songs.length === 0"
      >
        <i class="fas fa-backward-step"></i>
      </button>

      <!-- 播放/暂停 -->
      <button 
        @click="togglePlay" 
        class="bg-[#1abc9c] text-white border-none rounded-full cursor-pointer w-[52px] h-[52px] sm:w-[60px] sm:h-[60px] flex justify-center items-center transition-all duration-200 hover:bg-[#12836d] text-[1.4em] shadow-[0_4px_10px_rgba(0,0,0,0.1)]"
        :disabled="!playerStore.currentSong && playlistStore.songs.length === 0"
      >
        <i v-if="playerStore.isLoading" class="fas fa-spinner fa-spin m-0"></i>
        <i 
          v-else 
          :class="[
            playerStore.isPlaying ? 'fas fa-pause' : 'fas fa-play',
            playerStore.isPlaying ? 'ml-0' : 'ml-[2px]'
          ]"
        ></i>
      </button>

      <!-- 下一曲 -->
      <button 
        @click="playNext" 
        class="bg-[#1abc9c] text-white border-none rounded-full cursor-pointer w-[44px] h-[44px] sm:w-[50px] sm:h-[50px] flex justify-center items-center transition-all duration-200 hover:bg-[#12836d] text-[1.2em] shadow-[0_4px_10px_rgba(0,0,0,0.1)]"
        :disabled="playlistStore.songs.length === 0"
      >
        <i class="fas fa-forward-step"></i>
      </button>
    </div>

    <!-- 中间：进度条 -->
    <div class="flex items-center gap-3 min-w-0 w-full md:justify-self-stretch">
      <span 
        class="text-0.85em [font-variant-numeric:tabular-nums]" 
        :class="themeStore.isDark ? 'text-[#95a5a6]' : 'text-[#7f8c8d]'"
      >
        {{ playerStore.formattedCurrentTime }}
      </span>
      <input 
        type="range" 
        :value="playerStore.currentTime" 
        :max="playerStore.duration || 0"
        step="0.1"
        class="flex-1 h-2 rounded-full cursor-pointer transition-all duration-200"
        @mousedown="handleSeekStart"
        @touchstart.passive="handleSeekStart"
        @input="handleSeekInput"
        @change="handleSeekChange"
        @mouseup="handleSeekRelease"
        @touchend="handleSeekRelease"
        @touchcancel="handleSeekRelease"
        :style="{
          background: `linear-gradient(to right, #1abc9c 0%, #1abc9c ${playerStore.progress}%, rgba(255, 255, 255, 1) ${playerStore.progress}%, rgba(255, 255, 255, 1) 100%)`
        }"
      />
      <span 
        class="text-0.85em [font-variant-numeric:tabular-nums]" 
        :class="themeStore.isDark ? 'text-[#95a5a6]' : 'text-[#7f8c8d]'"
      >
        {{ playerStore.formattedDuration }}
      </span>
    </div>

    <!-- 右侧：音质、音量、下载列表、探索雷达 -->
    <div class="flex items-center justify-between gap-5 w-full flex-wrap md:flex-nowrap">
      <div class="flex items-center gap-4 justify-start flex-1 min-w-0 flex-wrap md:flex-nowrap">
        <!-- 下载列表 -->
        <div class="relative flex-shrink-0" ref="downloadListContainerRef">
          <button 
            @click.stop="downloadStore.toggleDownloadList()"
            data-download-list-button
            class="relative flex items-center justify-center gap-0 px-4 py-2.5 rounded-2 border font-medium cursor-pointer transition-all duration-200 text-[0.9em] shadow-none"
            :title="downloadStore.hasActiveDownloads ? `下载中 (${downloadStore.totalProgress}%)` : '下载列表'"
            :class="[
              downloadStore.showDownloadList ? 'border-[#1abc9c] text-[#1abc9c]' : themeStore.isDark ? 'text-[#ecf0f1] border-white/15 hover:border-[#1abc9c] hover:text-[#1abc9c]' : 'text-[#2c3e50] border-black/10 hover:border-[#1abc9c] hover:text-[#1abc9c]',
              themeStore.isDark ? 'bg-[#2c2c2c]/50' : 'bg-white/50'
            ]"
          >
            <i class="fas fa-download text-sm mr-2"></i>
            <span>下载</span>
            <span 
              v-if="downloadStore.hasActiveDownloads" 
              class="ml-2 text-xs"
            >
              {{ downloadStore.totalProgress }}%
            </span>
            <span 
              v-if="downloadStore.activeTasks.length > 0"
              class="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#1abc9c] text-white text-[10px] flex items-center justify-center"
            >
              {{ downloadStore.activeTasks.length }}
            </span>
          </button>
          
          <!-- 下载列表下拉菜单 -->
          <div 
            v-show="downloadStore.showDownloadList"
            ref="downloadListRef"
            class="absolute bottom-[calc(100%+10px)] right-0 rounded-3 border min-w-[400px] max-w-[90vw] max-h-[500px] overflow-hidden z-[100000] transition-all duration-200 shadow-[0_12px_30px_rgba(0,0,0,0.2)]"
            :class="themeStore.isDark ? 'bg-[#1c1c1c] border-white/15' : 'bg-white border-black/10'"
            @click.stop
          >
            <DownloadList />
          </div>
        </div>

        <!-- 音质选择 -->
        <div class="relative flex-shrink-0" ref="qualityMenuContainerRef">
          <button 
            @click.stop="showQualityMenu = !showQualityMenu"
            class="flex items-center justify-center gap-0 px-4 py-2.5 rounded-2 border font-medium cursor-pointer transition-all duration-200 text-[0.9em] shadow-none"
            :title="'音质: ' + qualityText"
            :class="[
              showQualityMenu ? 'border-[#1abc9c] text-[#1abc9c]' : themeStore.isDark ? 'text-[#ecf0f1] border-white/15 hover:border-[#1abc9c] hover:text-[#1abc9c]' : 'text-[#2c3e50] border-black/10 hover:border-[#1abc9c] hover:text-[#1abc9c]',
              themeStore.isDark ? 'bg-[#2c2c2c]/50' : 'bg-white/50',
              isSwitchingQuality ? 'cursor-not-allowed opacity-70' : ''
            ]"
            :disabled="isSwitchingQuality"
          >
            <i 
              v-if="isSwitchingQuality" 
              class="fas fa-spinner fa-spin text-sm mr-2"
            ></i>
            <span>{{ isSwitchingQuality ? '音质切换中...' : qualityText }}</span>
          </button>
          
          <div 
            v-show="showQualityMenu"
            ref="qualityMenuRef"
            class="absolute bottom-[calc(100%+10px)] right-0 rounded-3 border min-w-[190px] overflow-hidden z-[100000] transition-all duration-200 shadow-[0_12px_30px_rgba(0,0,0,0.2)] p-2"
            :class="[
              themeStore.isDark ? 'bg-[#1c1c1c] border-white/15' : 'bg-white border-black/10',
              isSwitchingQuality ? 'pointer-events-none opacity-60' : 'opacity-100'
            ]"
            @click.stop
          >
            <QualityMenuList
              :options="qualities"
              :selected="playerStore.quality"
              :disabled="isSwitchingQuality"
              @select="selectQuality"
            />
          </div>
        </div>

        <!-- 音量控制 -->
        <div class="flex items-center gap-2 min-w-0">
          <i 
            @click="toggleMute"
            :class="[
              volumeIcon,
              'cursor-pointer text-lg',
              themeStore.isDark ? 'text-[#ecf0f1]' : 'text-[#2c3e50]'
            ]"
          ></i>
          <input 
            type="range" 
            :value="playerStore.volume * 100" 
            @input="updateVolume"
            min="0" 
            max="100" 
            step="1"
            class="w-[90px] sm:w-[110px] h-1.5 rounded-full cursor-pointer"
            :style="{
              background: `linear-gradient(to right, #1abc9c 0%, #1abc9c ${playerStore.volume * 100}%, rgba(255, 255, 255, 1) ${playerStore.volume * 100}%, rgba(255, 255, 255, 1) 100%)`
            }"
          />
        </div>
      </div>

    </div>

    <!-- 独立：探索雷达 -->
    <div class="flex items-center w-full md:w-auto">
      <button 
        @click="handleExploreRadar" 
        class="bg-[#1abc9c] text-white border-none rounded-full cursor-pointer flex justify-center items-center transition-all duration-200 px-3 sm:px-4 md:px-6.25 gap-2.5 h-9 sm:h-10 md:h-12.5 hover:bg-[#12836d] shrink-0 text-sm md:text-base w-auto text-[1.2em] shadow-[0_4px_10px_rgba(0,0,0,0.1)]"
        :disabled="isExploring"
        :class="isExploring ? 'bg-[#7f8c8d] cursor-not-allowed' : ''"
      >
        <i :class="isExploring ? 'fas fa-spinner fa-spin' : 'fas fa-satellite-dish'"></i>
        <span class="hidden sm:inline md:text-base">探索雷达</span>
      </button>
    </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onBeforeUnmount, watch, inject, type Ref } from 'vue'
import { usePlayerStore } from '../stores/player'
import { usePlaylistStore } from '../stores/playlist'
import { useThemeStore } from '../stores/theme'
import { useDownloadStore } from '../stores/download'
import { usePlayer } from '../composables/usePlayer'
import { useNotification } from '../composables/useNotification'
import { useStorage } from '../composables/useStorage'
import { searchMusic } from '../api'
import { normalizeArtistField } from '../utils/song-utils'
import type { QualityType, PlayMode } from '../types'

import { QUALITY_OPTIONS } from '../utils/quality-options'
import QualityMenuList from './QualityMenuList.vue'
import DownloadList from './DownloadList.vue'

const playerStore = usePlayerStore()
const playlistStore = usePlaylistStore()
const themeStore = useThemeStore()
const downloadStore = useDownloadStore()
const { playAtIndex, playNext, playPrevious, reloadCurrentSongWithNewQuality } = usePlayer()
const { show: showNotification } = useNotification()
const { saveToStorage } = useStorage()

const showQualityMenu = ref(false)
const isSwitchingQuality = ref(false)
const isExploring = ref(false)
const lastVolume = ref(0.8)
const qualityMenuContainerRef = ref<HTMLElement | null>(null)
const qualityMenuRef = ref<HTMLElement | null>(null)
const downloadListContainerRef = ref<HTMLElement | null>(null)
const downloadListRef = ref<HTMLElement | null>(null)

const qualities = QUALITY_OPTIONS

const isSeeking = ref(false)
const seekPreviewValue = ref<number | null>(null)
const wasPlayingBeforeSeek = ref(false)

const isMobileLayout = inject<Ref<boolean> | null>('isMobileLayout', null)
const mobile = inject<any>('mobile', null)
const isMobileActive = computed(() => Boolean(isMobileLayout?.value))

const qualityText = computed(() => 
  qualities.find(q => q.value === playerStore.quality)?.label || '极高音质'
)

const playModeIcon = computed(() => {
  if (playerStore.playMode === 'single-loop') return 'fas fa-redo'
  if (playerStore.playMode === 'shuffle') return 'fas fa-shuffle'
  return 'fas fa-repeat'
})

const playModeTitle = computed(() => {
  if (playerStore.playMode === 'single-loop') return '单曲循环'
  if (playerStore.playMode === 'shuffle') return '随机播放'
  return '列表循环'
})

const volumeIcon = computed(() => {
  if (playerStore.volume === 0) return 'fas fa-volume-mute'
  if (playerStore.volume < 0.5) return 'fas fa-volume-down'
  return 'fas fa-volume-up'
})

function togglePlay() {
  if (!playerStore.currentSong && playlistStore.songs.length > 0) {
    playAtIndex(0)
    return
  }
  playerStore.togglePlay()
}

function cyclePlayMode() {
  const modes: PlayMode[] = ['list-loop', 'single-loop', 'shuffle']
  const idx = modes.indexOf(playerStore.playMode)
  playerStore.setPlayMode(modes[(idx + 1) % modes.length])
  saveToStorage()
}

function emitSeekEvent(value: number) {
  const duration = playerStore.duration || 0
  const normalizedTime = duration > 0
    ? Math.min(Math.max(value, 0), duration)
    : Math.max(value, 0)
  const ratio = duration > 0 ? normalizedTime / duration : undefined
  window.dispatchEvent(new CustomEvent('seek-audio', { detail: { time: normalizedTime, ratio } }))
}

function attachSeekListeners() {
  if (typeof window === 'undefined') return
  window.addEventListener('mouseup', handleSeekRelease)
  window.addEventListener('touchend', handleSeekRelease)
  window.addEventListener('touchcancel', handleSeekRelease)
}

function detachSeekListeners() {
  if (typeof window === 'undefined') return
  window.removeEventListener('mouseup', handleSeekRelease)
  window.removeEventListener('touchend', handleSeekRelease)
  window.removeEventListener('touchcancel', handleSeekRelease)
}

function handleSeekStart() {
  if (isSeeking.value) return
  isSeeking.value = true
  seekPreviewValue.value = playerStore.currentTime
  wasPlayingBeforeSeek.value = playerStore.isPlaying
  if (playerStore.isPlaying) {
    playerStore.pause()
  }
  attachSeekListeners()
}

function handleSeekInput(e: Event) {
  const value = parseFloat((e.target as HTMLInputElement).value)
  if (Number.isNaN(value)) return
  seekPreviewValue.value = value
  playerStore.setCurrentTime(value)
  if (!isSeeking.value) {
    emitSeekEvent(value)
  }
}

function finishSeek(finalValue?: number) {
  const value = typeof finalValue === 'number' && !Number.isNaN(finalValue)
    ? finalValue
    : seekPreviewValue.value ?? 0

  playerStore.setCurrentTime(value)
  emitSeekEvent(value)

  if (wasPlayingBeforeSeek.value) {
    playerStore.play()
  }

  wasPlayingBeforeSeek.value = false
  seekPreviewValue.value = null
  isSeeking.value = false
  detachSeekListeners()
}

function handleSeekRelease(e?: Event) {
  if (!isSeeking.value) return
  const target = e?.target as HTMLInputElement | undefined
  const value = target ? parseFloat(target.value) : seekPreviewValue.value ?? undefined
  finishSeek(value)
}

function handleSeekChange(e: Event) {
  const value = parseFloat((e.target as HTMLInputElement).value)
  if (Number.isNaN(value)) return

  playerStore.setCurrentTime(value)

  if (isSeeking.value) {
    finishSeek(value)
  } else {
    emitSeekEvent(value)
  }
}

function updateVolume(e: Event) {
  const value = parseInt((e.target as HTMLInputElement).value) / 100
  playerStore.setVolume(value)
  saveToStorage()
}

function toggleMute() {
  if (playerStore.volume > 0) {
    lastVolume.value = playerStore.volume
    playerStore.setVolume(0)
  } else {
    playerStore.setVolume(lastVolume.value)
  }
}

async function selectQuality(q: QualityType) {
  if (isSwitchingQuality.value) return
  if (q === playerStore.quality) {
    showQualityMenu.value = false
    return
  }

  const picked = qualities.find(x => x.value === q)

  if (!playerStore.currentSong) {
    playerStore.setQuality(q)
    saveToStorage()
    showQualityMenu.value = false
    if (picked) {
      showNotification(`音质已切换为 ${picked.label} (${picked.description})`, 'success')
    }
    return
  }

  const previousQuality = playerStore.quality

  try {
    isSwitchingQuality.value = true
    showQualityMenu.value = false

    playerStore.setQuality(q)
    saveToStorage()

    const reloaded = await reloadCurrentSongWithNewQuality()

    if (!reloaded) {
      throw new Error('reload failed')
    }

    if (picked) {
      showNotification(`音质切换成功：${picked.label} (${picked.description})`, 'success')
    }
  } catch (error) {
    playerStore.setQuality(previousQuality)
    saveToStorage()
    showNotification('切换音质失败，请稍后重试', 'error')
  } finally {
    isSwitchingQuality.value = false
  }
}

const EXPLORE_RADAR_GENRES = [
  '流行',
  '摇滚',
  '古典音乐',
  '民谣',
  '电子',
  '爵士',
  '说唱',
  '乡村',
  '蓝调',
  'R&B',
  '金属',
  '嘻哈',
  '轻音乐'
]

const EXPLORE_RADAR_SOURCES = ['netease', 'kuwo']

function pickRandomExploreGenre() {
  if (!EXPLORE_RADAR_GENRES.length) return '流行'
  const index = Math.floor(Math.random() * EXPLORE_RADAR_GENRES.length)
  return EXPLORE_RADAR_GENRES[index]
}

function pickRandomExploreSource() {
  if (!EXPLORE_RADAR_SOURCES.length) return 'netease'
  const index = Math.floor(Math.random() * EXPLORE_RADAR_SOURCES.length)
  return EXPLORE_RADAR_SOURCES[index]
}

async function handleExploreRadar() {
  if (isExploring.value) return
  isExploring.value = true

  try {
    const randomGenre = pickRandomExploreGenre()
    const source = pickRandomExploreSource()

    const response = await searchMusic(randomGenre, source, 1, 30)
    
    const data = response?.data

    if (!Array.isArray(data) || data.length === 0) {
      console.warn('[探索雷达] 未找到歌曲')
      showNotification('探索雷达：未找到歌曲', 'error')
      return
    }

    const existingKeys = new Set(
      (playlistStore.songs || []).map((song: any) => `${song.source || 'netease'}:${song.id}`)
    )

    const candidates = data.map((item: any) => {
      const id = String(item.id ?? item.url_id ?? Math.random())
      const key = `${item.source || source}:${id}`
      return {
        key,
        song: {
          id,
          name: item.name ?? item.title ?? '未知歌曲',
          artist: normalizeArtistField(item.artist),
          album: item.album ?? '未知专辑',
          cover: typeof item.pic === 'string' ? item.pic : '',
          picId: item.pic_id || item.picId || item.pic_str || undefined,
          url: typeof item.url === 'string' ? item.url : '',
          urlId: item.url_id || item.urlId || undefined,
          lrc: typeof item.lrc === 'string' ? item.lrc : '',
          lyricId: item.lyric_id || item.lyricId || item.id || undefined,
          duration: Number(item.time ?? item.duration ?? 0) || 0,
          source: item.source || source
        }
      }
    })

    let appended = 0
    for (const { key, song } of candidates) {
      if (existingKeys.has(key)) continue
      existingKeys.add(key)
      playlistStore.addSong(song as any)
      appended++
    }

    if (appended === 0) {
      showNotification('探索雷达：本次未找到新的歌曲，当前列表已包含这些曲目', 'info')
    } else {
      showNotification(`探索雷达：新增${appended}首 ${randomGenre} 歌曲`, 'success')
    }

    const firstCandidate = candidates[0]
    if (firstCandidate) {
      const targetIndex = (playlistStore.songs || []).findIndex(
        (s: any) => s.id === firstCandidate.song.id && (s.source || 'netease') === (firstCandidate.song.source || 'netease')
      )

      if (targetIndex >= 0) {
        await playAtIndex(targetIndex)
      }
    }
  } catch (error) {
    console.error('探索雷达错误:', error)
    showNotification('探索雷达获取失败，请稍后重试', 'error')
  } finally {
    isExploring.value = false
  }
}

// 点击外部区域关闭音质菜单和下载列表
function handleClickOutside(event: MouseEvent) {
  const target = event.target as Node
  
  // 关闭音质菜单
  if (showQualityMenu.value && qualityMenuContainerRef.value) {
    if (!qualityMenuContainerRef.value.contains(target)) {
      showQualityMenu.value = false
    }
  }
  
  // 关闭下载列表
  if (downloadStore.showDownloadList && downloadListContainerRef.value) {
    if (!downloadListContainerRef.value.contains(target)) {
      downloadStore.setShowDownloadList(false)
    }
  }
}

// 监听菜单显示状态，添加/移除全局点击监听器
watch(showQualityMenu, (isOpen) => {
  if (isOpen) {
    // 使用 setTimeout 确保在下一个事件循环中添加监听器，避免立即触发
    setTimeout(() => {
      document.addEventListener('click', handleClickOutside)
    }, 0)
  } else {
    // 只有在两个菜单都关闭时才移除监听器
    if (!downloadStore.showDownloadList) {
      document.removeEventListener('click', handleClickOutside)
    }
  }
})

watch(() => downloadStore.showDownloadList, (isOpen) => {
  if (isOpen) {
    setTimeout(() => {
      document.addEventListener('click', handleClickOutside)
    }, 0)
  } else {
    if (!showQualityMenu.value) {
      document.removeEventListener('click', handleClickOutside)
    }
  }
})

onBeforeUnmount(() => {
  detachSeekListeners()
  document.removeEventListener('click', handleClickOutside)
})
</script>
