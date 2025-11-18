<template>
  <div 
    class="grid w-full items-center transition-all duration-500 gap-x-5 gap-y-3 grid-cols-1 md:grid-cols-[auto_minmax(0,1fr)_auto_auto]"
    style="grid-area: controls;"
  >
    <!-- 左侧：播放控制 -->
    <div class="flex items-center gap-3 justify-center md:justify-self-start md:justify-start">
      <!-- 播放模式 -->
      <button 
        @click="cyclePlayMode" 
        class="bg-[#1abc9c] text-white border-none rounded-full cursor-pointer w-[44px] h-[44px] sm:w-[50px] sm:h-[50px] flex justify-center items-center transition-all duration-200 hover:bg-[#12836d]"
        :title="playModeTitle"
        style="font-size: 1.2em; box-shadow: 0 4px 10px rgba(0,0,0,0.1);"
      >
        <i :class="playModeIcon"></i>
      </button>

      <!-- 上一曲 -->
      <button 
        @click="playPrevious" 
        class="bg-[#1abc9c] text-white border-none rounded-full cursor-pointer w-[44px] h-[44px] sm:w-[50px] sm:h-[50px] flex justify-center items-center transition-all duration-200 hover:bg-[#12836d]"
        style="font-size: 1.2em; box-shadow: 0 4px 10px rgba(0,0,0,0.1);"
        :disabled="playlistStore.songs.length === 0"
      >
        <i class="fas fa-backward-step"></i>
      </button>

      <!-- 播放/暂停 -->
      <button 
        @click="togglePlay" 
        class="bg-[#1abc9c] text-white border-none rounded-full cursor-pointer w-[52px] h-[52px] sm:w-[60px] sm:h-[60px] flex justify-center items-center transition-all duration-200 hover:bg-[#12836d]"
        style="font-size: 1.4em; box-shadow: 0 4px 10px rgba(0,0,0,0.1);"
        :disabled="!playerStore.currentSong && playlistStore.songs.length === 0"
      >
        <i v-if="playerStore.isLoading" class="fas fa-spinner fa-spin" style="margin: 0;"></i>
        <i v-else :class="playerStore.isPlaying ? 'fas fa-pause' : 'fas fa-play'" :style="{ marginLeft: playerStore.isPlaying ? '0' : '2px' }"></i>
      </button>

      <!-- 下一曲 -->
      <button 
        @click="playNext" 
        class="bg-[#1abc9c] text-white border-none rounded-full cursor-pointer w-[44px] h-[44px] sm:w-[50px] sm:h-[50px] flex justify-center items-center transition-all duration-200 hover:bg-[#12836d]"
        style="font-size: 1.2em; box-shadow: 0 4px 10px rgba(0,0,0,0.1);"
        :disabled="playlistStore.songs.length === 0"
      >
        <i class="fas fa-forward-step"></i>
      </button>
    </div>

    <!-- 中间：进度条 -->
    <div class="flex items-center gap-3 min-w-0 w-full md:justify-self-stretch">
      <span 
        class="text-0.85em" 
        :class="themeStore.isDark ? 'text-[#95a5a6]' : 'text-[#7f8c8d]'"
        style="font-variant-numeric: tabular-nums;"
      >
        {{ playerStore.formattedCurrentTime }}
      </span>
      <input 
        type="range" 
        :value="playerStore.currentTime" 
        @input="seekAudio"
        :max="playerStore.duration || 0"
        step="0.1"
        class="flex-1 h-2 rounded-full cursor-pointer transition-all duration-200"
        :style="{
          background: `linear-gradient(to right, #1abc9c 0%, #1abc9c ${playerStore.progress}%, rgba(255, 255, 255, 1) ${playerStore.progress}%, rgba(255, 255, 255, 1) 100%)`
        }"
      />
      <span 
        class="text-0.85em" 
        :class="themeStore.isDark ? 'text-[#95a5a6]' : 'text-[#7f8c8d]'"
        style="font-variant-numeric: tabular-nums;"
      >
        {{ playerStore.formattedDuration }}
      </span>
    </div>

    <!-- 右侧：音质、音量、探索雷达 -->
    <div class="flex items-center justify-between gap-5 w-full flex-wrap md:flex-nowrap">
      <div class="flex items-center gap-4 justify-start flex-1 min-w-0 flex-wrap md:flex-nowrap">
        <!-- 音质选择 -->
        <div class="relative flex-shrink-0">
          <button 
            @click="showQualityMenu = !showQualityMenu"
            class="flex items-center justify-center gap-0 px-4 py-2.5 rounded-2 border font-medium cursor-pointer transition-all duration-200"
            :title="'音质: ' + qualityText"
            :class="[
              showQualityMenu ? 'border-[#1abc9c] text-[#1abc9c]' : themeStore.isDark ? 'text-[#ecf0f1] border-white/15 hover:border-[#1abc9c] hover:text-[#1abc9c]' : 'text-[#2c3e50] border-black/10 hover:border-[#1abc9c] hover:text-[#1abc9c]',
              themeStore.isDark ? 'bg-[#2c2c2c]/50' : 'bg-white/50',
              isSwitchingQuality ? 'cursor-not-allowed opacity-70' : ''
            ]"
            :disabled="isSwitchingQuality"
            style="font-size: 0.9em; box-shadow: none;"
          >
            <i 
              v-if="isSwitchingQuality" 
              class="fas fa-spinner fa-spin text-sm mr-2"
            ></i>
            <span>{{ isSwitchingQuality ? '音质切换中...' : qualityText }}</span>
          </button>
          
          <div 
            v-show="showQualityMenu"
            class="absolute bottom-[calc(100%+10px)] right-0 rounded-3 border min-w-[180px] overflow-hidden z-[100000] transition-all duration-200 shadow-[0_12px_30px_rgba(0,0,0,0.2)]"
            :class="themeStore.isDark ? 'bg-[#1c1c1c] border-white/15' : 'bg-white border-black/10'"
            :style="{ pointerEvents: isSwitchingQuality ? 'none' : 'auto', opacity: isSwitchingQuality ? 0.6 : 1 }"
          >
            <div 
              v-for="q in qualities"
              :key="q.value"
              @click="selectQuality(q.value)"
              class="flex justify-between items-center gap-2 px-3.5 py-2.5 text-0.9em cursor-pointer transition-all duration-200"
              :class="[
                playerStore.quality === q.value 
                  ? 'bg-[#1abc9c] text-white' 
                  : themeStore.isDark 
                    ? 'text-[#ecf0f1] hover:bg-[#1abc9c] hover:text-white' 
                    : 'text-[#2c3e50] hover:bg-[#1abc9c] hover:text-white'
              ]"
            >
              <span>{{ q.label }} <span class="opacity-70">({{ q.description }})</span></span>
            </div>
          </div>
        </div>

        <!-- 音量控制 -->
        <div class="flex items-center gap-2 min-w-0">
          <i 
            :class="volumeIcon" 
            :style="{ color: themeStore.isDark ? '#ecf0f1' : '#2c3e50' }"
            @click="toggleMute"
            class="cursor-pointer text-lg"
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
        class="bg-[#1abc9c] text-white border-none rounded-full cursor-pointer flex justify-center items-center transition-all duration-200 px-3 sm:px-4 md:px-6.25 gap-2.5 h-9 sm:h-10 md:h-12.5 hover:bg-[#12836d] shrink-0 text-sm md:text-base"
        :disabled="isExploring"
        :class="isExploring ? 'bg-[#7f8c8d] cursor-not-allowed' : ''"
        style="width: auto; font-size: 1.2em; box-shadow: 0 4px 10px rgba(0,0,0,0.1);"
      >
        <i :class="isExploring ? 'fas fa-spinner fa-spin' : 'fas fa-satellite-dish'"></i>
        <span class="hidden sm:inline md:text-base">探索雷达</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { usePlayerStore } from '../stores/player'
import { usePlaylistStore } from '../stores/playlist'
import { useThemeStore } from '../stores/theme'
import { usePlayer } from '../composables/usePlayer'
import { useNotification } from '../composables/useNotification'
import { useStorage } from '../composables/useStorage'
import { searchMusic } from '../api'
import { normalizeArtistField } from '../utils/song-utils'
import type { QualityType, PlayMode } from '../types'

const playerStore = usePlayerStore()
const playlistStore = usePlaylistStore()
const themeStore = useThemeStore()
const { playAtIndex, playNext, playPrevious, reloadCurrentSongWithNewQuality } = usePlayer()
const { show: showNotification } = useNotification()
const { saveToStorage } = useStorage()

const showQualityMenu = ref(false)
const isSwitchingQuality = ref(false)
const isExploring = ref(false)
const lastVolume = ref(0.8)

const qualities = [
  { value: '128' as QualityType, label: '标准音质', description: '128kbps' },
  { value: '192' as QualityType, label: '较高音质', description: '192kbps' },
  { value: '320' as QualityType, label: '极高音质', description: '320kbps' },
  { value: 'flac' as QualityType, label: '无损音质', description: 'FLAC' }
]

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

function seekAudio(e: Event) {
  const value = parseFloat((e.target as HTMLInputElement).value)
  window.dispatchEvent(new CustomEvent('seek-audio', { detail: value / (playerStore.duration || 1) }))
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
    const existingCount = playlistStore.songs.length
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

    const shouldAutoplay = existingCount === 0 && playlistStore.songs.length > 0
    if (shouldAutoplay) {
      await playAtIndex(0)
    }
  } catch (error) {
    console.error('探索雷达错误:', error)
    showNotification('探索雷达获取失败，请稍后重试', 'error')
  } finally {
    isExploring.value = false
  }
}
</script>
