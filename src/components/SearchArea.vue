<template>
  <div 
    ref="searchAreaRef"
    id="searchArea"
    data-area="search"
    class="relative z-20 overflow-visible flex flex-col transition-all duration-500 isolate"
    :class="[
      !mobile.isMobileView.value ? 'rounded-4 p-5 border [grid-area:search] w-full' : '',
      !mobile.isMobileView.value ? (themeStore.isDark ? 'bg-[#1e1e1e]/60 border-white/15' : 'bg-white/50 border-black/10') : '',
      searchStore.results.length > 0 && !mobile.isMobileView.value ? 'border-[#1abc9c] shadow-[0_15px_45px_rgba(26,188,156,0.2)]' : '',
      mobile.isMobileView.value 
        ? [
            'fixed inset-0 w-full h-full bg-[rgba(6,9,14,0.95)] backdrop-blur-[26px] border-none rounded-none box-border px-[clamp(18px,6vw,28px)] pt-[calc(env(safe-area-inset-top,0px)+28px)] pb-[calc(env(safe-area-inset-bottom,0px)+clamp(24px,8vw,36px))] gap-4 items-stretch justify-start z-[160] transition-[transform,opacity] duration-[450ms]',
            mobile.isSearchOpen.value ? 'translate-y-0 opacity-100 pointer-events-auto' : '-translate-y-full opacity-0 pointer-events-none'
          ]
        : ''
    ]"
  >
    <!-- 移动端关闭按钮 -->
    <button
      v-if="mobile.isMobileView.value"
      @click="mobile.closeSearch()"
      class="mobile-close-btn self-end w-[38px] h-[38px] rounded-full border flex items-center justify-center cursor-pointer transition-all duration-250"
      :class="themeStore.isDark ? 'bg-white/8 border-white/18 text-white hover:bg-white/14' : 'bg-white/8 border-white/18 text-white hover:bg-white/14'"
    >
      <i class="fas fa-times text-sm"></i>
    </button>

    <!-- 搜索容器 -->
    <div 
      class="flex gap-2.5 items-center mb-3.75 flex-shrink-0"
      :class="mobile.isMobileView.value ? 'flex-col gap-3 w-full max-w-[340px] mx-auto' : ''"
    >
      <input 
        type="text" 
        v-model="searchQuery" 
        @keyup.enter="handleSearch"
        ref="searchInputRef"
        class="flex-1 px-4 py-3 border-2 rounded-3 text-base outline-none transition-all duration-300 hover:border-primary focus:border-primary focus:shadow-[0_0_0_3px_rgba(26,188,156,0.25)] bg-white/50 text-[#2c3e50] border-black/10"
        :class="[
          themeStore.isDark ? 'bg-[#2a2a2a]/80 text-white border-white/20' : '',
          mobile.isMobileView.value ? 'w-full bg-white/8 border-white/18 text-white placeholder:text-white/50 rounded-[14px]' : ''
        ]"
        placeholder="搜索歌曲、歌手或专辑..."
      >
      
      <!-- 音乐源选择 -->
      <div 
        class="relative flex-shrink-0" 
        data-source-selector
        :class="mobile.isMobileView.value ? 'w-full' : ''"
      >
        <button 
          @click="showMenu = !showMenu"
          class="flex items-center justify-between gap-2 px-4.5 py-3 border rounded-3 font-medium cursor-pointer transition-all duration-250 min-w-[150px] bg-white/50 text-[#2c3e50] border-black/10 hover:border-[#1abc9c] hover:text-[#1abc9c]"
          :class="[
            themeStore.isDark ? 'bg-[#2a2a2a]/80 text-white border-white/20 hover:border-[#1abc9c]' : '',
            mobile.isMobileView.value ? 'w-full rounded-[14px] bg-white/12 border-none text-white' : ''
          ]"
        >
          <span>{{ sourceName }}</span>
          <i 
            class="fas fa-chevron-down text-0.8em transition-transform duration-250"
            :class="showMenu ? '-rotate-180' : 'rotate-0'"
          ></i>
        </button>
        
        <!-- 下拉菜单 -->
        <div 
          v-show="showMenu"
          class="absolute top-[calc(100%+8px)] left-0 right-0 rounded-3 border min-w-full h-34 overflow-y-auto z-[100000] transition-all duration-180 shadow-[0_12px_30px_rgba(0,0,0,0.18)] bg-white border-black/10"
          :class="themeStore.isDark ? 'bg-[#2a2a2a] border-white/20' : ''"
        >
          <div 
            v-for="source in sources" 
            :key="source.value"
            @click="selectSource(source.value)"
            class="flex items-center justify-between gap-3 px-4 py-2.5 text-0.95em cursor-pointer transition-all duration-200 text-[#2c3e50] hover:bg-[#1abc9c] hover:text-white"
            :class="themeStore.isDark ? 'text-white' : ''"
          >
            <span>{{ source.label }}</span>
            <i v-if="searchStore.currentSource === source.value" class="fas fa-check text-0.85em"></i>
          </div>
        </div>
      </div>
      
      <button 
        @click="handleSearch" 
        class="text-white border-none rounded-3 px-5 py-3 cursor-pointer text-base transition-all duration-200 flex items-center gap-2"
        :disabled="searchStore.isLoading || !searchQuery.trim()"
        :class="[
          searchStore.isLoading ? 'bg-[#7f8c8d] cursor-not-allowed' : 'bg-[#1abc9c] hover:bg-[#12836d]',
          mobile.isMobileView.value ? 'w-full rounded-[14px] bg-white/12 border-none justify-center' : ''
        ]"
      >
        <i :class="searchStore.isLoading ? 'fas fa-spinner fa-spin' : 'fas fa-search'"></i>
        <span>搜索</span>
      </button>
    </div>

    <!-- 搜索结果 -->
    <div 
      v-if="showResultsDropdown" 
      class="absolute left-0 right-0 top-[calc(100%+12px)] z-[80]"
      :class="mobile.isMobileView.value ? 'relative top-0 left-0 right-0 flex-1 min-h-0 overflow-y-auto w-full max-w-[340px] mx-auto pr-[6px] mr-[-6px] overscroll-contain touch-pan-y' : ''"
    >
      <div 
        class="px-5 pt-4 pb-5 rounded-4 border flex flex-col gap-4 transition-all duration-300 shadow-[0_20px_45px_rgba(0,0,0,0.25)] backdrop-blur-[18px]"
        :class="themeStore.isDark ? 'bg-[#1e1e1e]/85 border-white/15' : 'bg-white/80 border-black/10'"
      >
        <div class="flex flex-col gap-4">
      <!-- 工具栏：播放全部、全选/全不选、下载已选、导入已选 -->
      <div 
        class="flex flex-wrap gap-3 justify-between items-center pb-3 border-b"
        :class="themeStore.isDark ? 'border-white/10' : 'border-black/10'"
      >
        <!-- 左侧：播放全部 -->
        <button
          @click="handlePlayAll"
          :disabled="playAllLoading"
          class="flex items-center rounded-full border-none transition-all duration-200 text-white bg-[#1abc9c] shadow-[0_6px_16px_rgba(26,188,156,0.3)]"
          :class="[
            playAllLoading ? 'opacity-60 cursor-wait' : 'cursor-pointer hover:bg-[#12836d]',
            mobile.isMobileView.value ? 'w-9 h-9 p-0 justify-center' : 'gap-2 px-4 py-2'
          ]"
          :title="mobile.isMobileView.value ? (playAllLoading ? '正在播放...' : '播放全部') : ''"
        >
          <i 
            v-if="playAllLoading" 
            :class="mobile.isMobileView.value ? 'fas fa-spinner fa-spin' : 'fas fa-spinner fa-spin text-0.9em'"
          ></i>
          <i 
            v-else 
            :class="mobile.isMobileView.value ? 'fas fa-play' : 'fas fa-play text-0.9em'"
          ></i>
          <span v-if="!mobile.isMobileView.value" class="text-0.9em font-semibold">
            {{ playAllLoading ? '正在播放...' : '播放全部' }}
          </span>
        </button>

        <!-- 右侧：全选/全不选、下载已选、导入已选 -->
        <div class="flex items-center gap-2 ml-auto">
          <!-- 全选/全不选 -->
          <button
            @click="handleToggleSelectAll"
            class="flex items-center rounded-full border-none cursor-pointer transition-all duration-200 text-white shadow-[0_6px_16px_rgba(46,204,113,0.3)] bg-[#2ecc71] hover:bg-[#27ae60]"
            :class="mobile.isMobileView.value ? 'w-9 h-9 p-0 justify-center' : 'gap-2 px-4 py-2'"
            :title="mobile.isMobileView.value ? (isAllSelected ? '全不选' : '全选') : '全选/全不选'"
          >
            <i 
              :class="[
                isAllSelected ? 'fas fa-check-square' : 'fas fa-square',
                mobile.isMobileView.value ? '' : 'text-0.9em'
              ]"
            ></i>
            <span v-if="!mobile.isMobileView.value" class="text-0.9em font-semibold">
              {{ isAllSelected ? '全不选' : '全选' }}
            </span>
          </button>

          <!-- 下载已选 -->
          <button
            ref="downloadSelectedButtonRef"
            @click="handleDownloadSelected"
            :disabled="searchStore.selectedIndices.size === 0 || isDownloadingSelected"
            class="flex items-center rounded-full border-none cursor-pointer transition-all duration-200 text-white shadow-[0_6px_16px_rgba(46,204,113,0.3)]"
            :class="[
              searchStore.selectedIndices.size === 0 || isDownloadingSelected ? 'bg-[#7f8c8d]/50 cursor-not-allowed' : 'bg-[#2ecc71] hover:bg-[#27ae60]',
              mobile.isMobileView.value ? 'w-9 h-9 p-0 justify-center' : 'gap-2 px-4 py-2'
            ]"
            :title="mobile.isMobileView.value ? '下载已选歌曲' : ''"
          >
            <i 
              v-if="isDownloadingSelected"
              :class="mobile.isMobileView.value ? 'fas fa-spinner fa-spin' : 'fas fa-spinner fa-spin text-0.9em'"
            ></i>
            <i 
              v-else
              :class="mobile.isMobileView.value ? 'fas fa-download' : 'fas fa-download text-0.9em'"
            ></i>
            <template v-if="!mobile.isMobileView.value">
              <span class="text-0.9em font-semibold">下载已选</span>
              <span v-if="searchStore.selectedIndices.size > 0" class="text-0.85em font-medium ml-1">
                ({{ searchStore.selectedIndices.size }})
              </span>
            </template>
          </button>

          <!-- 导入已选 -->
          <button
            @click="handleImportToPlaylist"
            :disabled="searchStore.selectedIndices.size === 0"
            class="flex items-center rounded-full border-none cursor-pointer transition-all duration-200 text-white shadow-[0_6px_16px_rgba(26,188,156,0.3)]"
            :class="[
              searchStore.selectedIndices.size === 0 ? 'bg-[#7f8c8d]/50 cursor-not-allowed' : 'bg-[#1abc9c] hover:bg-[#12836d]',
              mobile.isMobileView.value ? 'w-9 h-9 p-0 justify-center' : 'gap-2 px-4 py-2'
            ]"
            :title="mobile.isMobileView.value ? '导入已选' : ''"
          >
            <i :class="mobile.isMobileView.value ? 'fas fa-file-import' : 'fas fa-file-import text-0.9em'"></i>
            <template v-if="!mobile.isMobileView.value">
              <span class="text-0.9em font-semibold">导入已选</span>
              <span v-if="searchStore.selectedIndices.size > 0" class="text-0.85em font-medium ml-1">
                ({{ searchStore.selectedIndices.size }})
              </span>
            </template>
          </button>
        </div>

        <!-- 导入下拉菜单 - 已注释 -->
        <!-- <div class="relative">
          <button
            @click="showImportMenu = !showImportMenu"
            :disabled="searchStore.selectedIndices.size === 0"
            class="flex items-center gap-2 px-4 py-2 rounded-full border-none cursor-pointer transition-all duration-200 text-white shadow-[0_6px_16px_rgba(26,188,156,0.3)]"
            :class="searchStore.selectedIndices.size === 0 ? 'bg-[#7f8c8d]/50 cursor-not-allowed' : 'bg-[#1abc9c] hover:bg-[#12836d]'"
          >
            <i class="fas fa-file-import text-0.9em"></i>
            <span class="text-0.9em font-semibold">导入已选</span>
            <span v-if="searchStore.selectedIndices.size > 0" class="text-0.85em font-medium ml-1">
              ({{ searchStore.selectedIndices.size }})
            </span>
            <i class="fas fa-caret-down text-0.75em ml-1"></i>
          </button>

          <div
            v-show="showImportMenu && searchStore.selectedIndices.size > 0"
            class="absolute top-[calc(100%+8px)] right-0 rounded-2 border min-w-[160px] z-[20000] shadow-[0_8px_24px_rgba(0,0,0,0.18)]"
            :class="themeStore.isDark ? 'bg-[#2a2a2a] border-white/20' : 'bg-white border-black/10'"
          >
            <button
              @click="handleImportToPlaylist"
              class="w-full px-4 py-2 text-left text-0.9em cursor-pointer transition-all duration-200 border-none bg-transparent"
              :class="themeStore.isDark ? 'text-white hover:bg-white/10' : 'text-[#2c3e50] hover:bg-[#1abc9c]/10'"
            >
              导入到播放列表
            </button>
            <button
              @click="handleImportToFavorites"
              class="w-full px-4 py-2 text-left text-0.9em cursor-pointer transition-all duration-200 border-none bg-transparent"
              :class="themeStore.isDark ? 'text-white hover:bg-white/10' : 'text-[#2c3e50] hover:bg-[#1abc9c]/10'"
            >
              导入到收藏列表
            </button>
          </div>
        </div> -->
      </div>

      <!-- 搜索结果列表 / 骨架屏 -->
      <div>
        <div 
          v-if="searchStore.isLoading && searchStore.results.length === 0"
          class="flex flex-col gap-2 py-3 pr-2 -mr-2 flex-1 min-h-0 max-h-[35vh] overflow-hidden overscroll-contain"
        >
          <div
            v-for="i in skeletonItemCount"
            :key="`skeleton-${i}`"
            class="flex items-center gap-3 px-4 py-3 rounded-3 border"
            :class="themeStore.isDark ? 'border-white/10 bg-white/5' : 'border-black/5 bg-white/60'"
          >
            <div class="w-5 h-5 rounded-full" :class="skeletonBaseClass"></div>
            <div class="flex-1 flex flex-col gap-2">
              <div class="h-3.5 rounded" :class="skeletonBaseClass"></div>
              <div class="h-3 rounded w-2/3" :class="skeletonBaseClass"></div>
            </div>
            <div class="flex gap-2">
              <div class="w-16 h-8 rounded" :class="skeletonBaseClass"></div>
              <div class="w-8 h-8 rounded" :class="skeletonBaseClass"></div>
            </div>
          </div>
        </div>

        <div 
          v-else
          class="flex flex-col gap-2 py-3 pr-2 -mr-2 flex-1 min-h-0 overflow-y-auto max-h-[35vh] overscroll-contain" 
          @scroll.passive="handleResultsScroll"
        >
            <div 
              v-for="(song, index) in searchStore.results" 
              :key="index"
              :ref="el => { if (el) songRefs[index] = el as HTMLElement }"
              @click="toggleSelection(index, $event)"
              class="flex items-center gap-3 px-4 py-3 rounded-3 cursor-pointer transition-all duration-300 border relative backdrop-blur-[12px] shadow-[0_6px_18px_rgba(0,0,0,0.12)]"
              :class="[
                themeStore.isDark 
                  ? 'bg-white/10 border-white/20 hover:bg-white/15' 
                  : 'bg-white/70 border-white/60 hover:bg-[#1abc9c]/10',
                searchStore.selectedIndices.has(index) 
                  ? themeStore.isDark
                    ? 'border-2 border-[#34d1b6] bg-[#1abc9c]/15 shadow-[0_12px_32px_rgba(26,188,156,0.35)]'
                    : 'border-2 border-[#1abc9c] bg-[#1abc9c]/12 shadow-[0_12px_30px_rgba(26,188,156,0.25)]'
                  : ''
              ]"
            >
              <!-- 左侧：圆形复选框 -->
              <button
                @click.stop="toggleSelection(index, $event)"
                class="w-5 h-5 flex-shrink-0 rounded-full border flex items-center justify-center transition-all duration-200"
                :class="[
                  searchStore.selectedIndices.has(index)
                    ? 'bg-[#1abc9c] border-[#1abc9c] text-white'
                    : themeStore.isDark
                      ? 'border-white/30 bg-transparent'
                      : 'border-black/20 bg-transparent'
                ]"
                title="选择"
              >
                <i v-if="searchStore.selectedIndices.has(index)" class="fas fa-check text-0.7em"></i>
              </button>

              <!-- 中间：歌曲信息 -->
              <div class="flex-1 min-w-0">
                <div 
                  class="font-semibold text-[15px] mb-1 whitespace-nowrap overflow-hidden text-ellipsis transition-colors duration-200"
                  :class="searchStore.selectedIndices.has(index)
                    ? (themeStore.isDark ? 'text-[#34d1b6]' : 'text-[#12836d]')
                    : (themeStore.isDark ? 'text-white' : 'text-[#2c3e50]')"
                >
                  {{ song.name }}
                </div>
                <div 
                  class="text-[13px] whitespace-nowrap overflow-hidden text-ellipsis flex items-center gap-2 transition-colors duration-200"
                  :class="searchStore.selectedIndices.has(index)
                    ? (themeStore.isDark ? 'text-[#9ff3e2]' : 'text-[#1abc9c]')
                    : (themeStore.isDark ? 'text-white/70' : 'text-[#7f8c8d]')"
                >
                  <span class="truncate">{{ normalizeArtistField(song.artist) }}</span>
                  <span 
                    class="flex-shrink-0"
                    :class="themeStore.isDark ? 'text-white/30' : 'text-[#c0c8cc]'"
                  >
                    -
                  </span>
                  <span class="truncate">{{ normalizeAlbumField(song.album) }}</span>
                </div>
              </div>

              <!-- 右侧：操作按钮 -->
              <div class="flex gap-2 ml-3.75 flex-shrink-0 items-center">
                <!-- 播放按钮 -->
                <button 
                  @click.stop="playSong(song)"
                  :disabled="isSongPlaying(song)"
                  class="rounded-full border flex justify-center items-center transition-all duration-200 text-white bg-[#1abc9c] border-[#1abc9c]/45 shadow-[0_6px_16px_rgba(26,188,156,0.3)]"
                  :class="[
                    isSongPlaying(song) ? 'opacity-60 cursor-wait' : 'hover:bg-[#12836d]',
                    mobile.isMobileView.value ? 'w-8 h-8 p-0' : 'px-3 py-1.5 rounded-2 gap-1.5 text-[13px]'
                  ]"
                  title="播放"
                >
                  <i 
                    v-if="isSongPlaying(song)" 
                    :class="mobile.isMobileView.value ? 'fas fa-spinner fa-spin' : 'fas fa-spinner fa-spin text-0.85em'"
                  ></i>
                  <i 
                    v-else 
                    :class="mobile.isMobileView.value ? 'fas fa-play' : 'fas fa-play text-0.85em'"
                  ></i>
                  <span v-if="!mobile.isMobileView.value">{{ isSongPlaying(song) ? '播放中...' : '播放' }}</span>
                </button>

                <!-- 下载按钮 -->
                <div>
                  <button 
                    data-download-trigger
                    @click.stop="toggleDownloadMenu(index, $event)"
                    class="w-8 h-8 p-0 rounded-full border flex justify-center items-center text-[14px] transition-all duration-200 text-white bg-[#2ecc71] border-[#2ecc71]/55 hover:bg-[#27ae60] shadow-[0_6px_16px_rgba(46,204,113,0.28)]"
                    title="下载"
                  >
                    <i class="fas fa-download"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
      </div>
      </div>

      <Teleport to="body">
        <div
          v-if="showDownloadMenu !== null && activeDownloadSong"
          data-download-menu
          class="fixed rounded-3 border min-w-[190px] max-w-[75vw] z-[200000] shadow-[0_12px_30px_rgba(0,0,0,0.2)] p-2"
          :class="themeStore.isDark ? 'bg-[#1c1c1c] border-white/15' : 'bg-white border-black/10'"
          :style="{
            top: `${downloadMenuPosition.y}px`,
            left: `${downloadMenuPosition.x}px`
          }"
        >
          <QualityMenuList
            :options="qualityOptions"
            @select="value => handleDownload(activeDownloadSong, value)"
          />
        </div>
      </Teleport>

      <!-- 分页 -->
        <div class="flex flex-col gap-3 pt-4 border-t"
          :class="themeStore.isDark ? 'border-white/15' : 'border-black/10'"
        >
          <!-- 分页控制行 -->
          <div class="flex justify-end items-center gap-2">
            <button
              @click="handlePreviousPage"
              :disabled="searchStore.currentPage <= 1 || searchStore.isLoading"
              class="w-8 h-8 rounded-2 border cursor-pointer transition-all duration-200 flex items-center justify-center"
              :class="[
                searchStore.currentPage <= 1 || searchStore.isLoading
                  ? 'bg-[#7f8c8d]/30 cursor-not-allowed text-[#7f8c8d] border-[#7f8c8d]/30'
                  : themeStore.isDark
                    ? 'bg-white/10 text-white border-white/20 hover:bg-white/15'
                    : 'bg-white/50 text-[#2c3e50] border-black/10 hover:bg-[#1abc9c]/10 hover:border-[#1abc9c]'
              ]"
              title="上一页"
            >
              <i class="fas fa-chevron-left text-0.85em"></i>
            </button>

            <div class="flex items-center gap-2">
              <span class="text-0.9em px-2"
                :class="themeStore.isDark ? 'text-white/80' : 'text-[#7f8c8d]'"
              >
                第
              </span>
              <input
                v-model.number="jumpPage"
                @keyup.enter="handleJumpToPage"
                type="number"
                min="1"
                class="w-16 px-2 py-1 text-center text-0.9em rounded-2 border outline-none transition-all duration-200"
                :class="[
                  themeStore.isDark
                    ? 'bg-white/10 text-white border-white/20 focus:border-[#1abc9c]'
                    : 'bg-white/50 text-[#2c3e50] border-black/10 focus:border-[#1abc9c]'
                ]"
                placeholder="页码"
              />
              <span class="text-0.9em px-2"
                :class="themeStore.isDark ? 'text-white/80' : 'text-[#7f8c8d]'"
              >
                页
              </span>
            </div>

            <button
              @click="handleNextPage"
              :disabled="searchStore.isLoading || (searchStore.results.length < searchStore.limit && searchStore.currentPage >= totalPages)"
              class="w-8 h-8 rounded-2 border cursor-pointer transition-all duration-200 flex items-center justify-center"
              :class="[
                searchStore.isLoading || (searchStore.results.length < searchStore.limit && searchStore.currentPage >= totalPages)
                  ? 'bg-[#7f8c8d]/30 cursor-not-allowed text-[#7f8c8d] border-[#7f8c8d]/30'
                  : themeStore.isDark
                    ? 'bg-white/10 text-white border-white/20 hover:bg-white/15'
                    : 'bg-white/50 text-[#2c3e50] border-black/10 hover:bg-[#1abc9c]/10 hover:border-[#1abc9c]'
              ]"
              title="下一页"
            >
              <i class="fas fa-chevron-right text-0.85em"></i>
            </button>

            <select
              :value="searchStore.limit"
              @change="handleLimitChange"
              class="px-3 py-1.5 rounded-2 border text-0.9em outline-none transition-all duration-200 cursor-pointer"
              :class="[
                themeStore.isDark
                  ? 'bg-white/10 text-white border-white/20 hover:border-[#1abc9c]'
                  : 'bg-white/50 text-[#2c3e50] border-black/10 hover:border-[#1abc9c]'
              ]"
            >
              <option :value="20">20</option>
              <option :value="30">30</option>
              <option :value="50">50</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, inject } from 'vue'
import { useSearchStore } from '../stores/search'
import { useThemeStore } from '../stores/theme'
import { usePlayerStore } from '../stores/player'
import { useSearch } from '../composables/useSearch'
import { usePlayer } from '../composables/usePlayer'
import { useNotification } from '../composables/useNotification'
import { useDownload } from '../composables/useDownload'
import type { MusicSource } from '../types'
import { QUALITY_OPTIONS } from '../utils/quality-options'
import { normalizeAlbumField, normalizeArtistField } from '../utils/song-utils'
import QualityMenuList from './QualityMenuList.vue'

const searchStore = useSearchStore()
const themeStore = useThemeStore()
const searchComposable = useSearch()
const { search: performSearch, playAllSearchResults: playAll, importSelectedSearchResults, toggleSearchResultSelection, goToPage, setSearchLimit } = searchComposable
const { playAtIndex } = usePlayer()
const { show: showNotification } = useNotification()
const { downloadSong, downloadSongs } = useDownload()
const mobile = inject<any>('mobile', null)
const searchQuery = ref('')
const showMenu = ref(false)
// const showImportMenu = ref(false)
const showDownloadMenu = ref<number | null>(null)
const downloadMenuPosition = ref({ x: 0, y: 0 })
const qualityOptions = QUALITY_OPTIONS
const jumpPage = ref(1)
const searchAreaRef = ref<HTMLElement | null>(null)
const songRefs = ref<Record<number, HTMLElement>>({})
const downloadSelectedButtonRef = ref<HTMLElement | null>(null)
const searchInputRef = ref<HTMLInputElement | null>(null)
const skeletonItemCount = 6

// 移动端搜索打开时自动聚焦输入框
watch(() => mobile?.isSearchOpen.value, (isOpen) => {
  if (isOpen && searchInputRef.value) {
    setTimeout(() => {
      try {
        searchInputRef.value?.focus({ preventScroll: true })
      } catch (error) {
        searchInputRef.value?.focus()
      }
    }, 100)
  }
})
const playAllLoading = ref(false)
const playingSongKey = ref<string | null>(null)
const isDownloadingSelected = ref(false)
const showResultsDropdown = computed(() => searchStore.isDropdownVisible && (searchStore.isLoading || searchStore.results.length > 0))
const skeletonBaseClass = computed(() => themeStore.isDark ? 'skeleton-block skeleton-dark' : 'skeleton-block skeleton-light')

// 全选状态
const isAllSelected = computed(() => {
  return searchStore.results.length > 0 && 
         searchStore.selectedIndices.size === searchStore.results.length
})

const activeDownloadSong = computed(() => {
  if (showDownloadMenu.value === null) return null
  return searchStore.results[showDownloadMenu.value] || null
})

const totalPages = computed(() => {
  // 如果当前页有数据且数量等于每页限制，说明可能还有更多页
  // 否则就是最后一页
  if (searchStore.results.length === searchStore.limit) {
    // 假设还有更多页，至少是当前页+1
    return Math.max(searchStore.currentPage + 1, searchStore.currentPage)
  }
  // 如果当前页数据少于每页限制，说明这是最后一页
  return searchStore.currentPage
})

const sources = [
  { value: 'netease' as MusicSource, label: '网易云音乐' },
  { value: 'kuwo' as MusicSource, label: '酷我音乐' },
  { value: 'joox' as MusicSource, label: 'JOOX音乐' }
]

const sourceName = computed(() => sources.find(s => s.value === searchStore.currentSource)?.label || '网易云音乐')

function selectSource(source: MusicSource) {
  searchStore.setSource(source)
  showMenu.value = false
}

async function handleSearch() {
  if (searchStore.isLoading) return
  if (!searchQuery.value.trim()) {
    showNotification('请输入搜索关键字', 'error')
    return
  }

  await performSearch(searchQuery.value, 1, false)
}

function hideResultsDropdown() {
  if (typeof (searchStore as any).setDropdownVisible === 'function') {
    searchStore.setDropdownVisible(false)
  } else {
    searchStore.isDropdownVisible = false
  }
}

function getSongKey(song: any) {
  return `${song.id ?? ''}-${song.source ?? ''}`
}

function isSongPlaying(song: any) {
  return playingSongKey.value === getSongKey(song)
}

async function playSong(song: any) {
  if (isSongPlaying(song)) return
  playingSongKey.value = getSongKey(song)
  // 播放时不隐藏下拉框

  const { usePlaylistStore } = await import('../stores/playlist')
  const playlistStore = usePlaylistStore()
  playlistStore.addSong(song)
  const idx = playlistStore.songs.findIndex(s => s.id === song.id && s.source === song.source)
  try {
    if (idx !== -1) await playAtIndex(idx)
    // 移动端操作后关闭搜索区域
    if (mobile?.isMobileView.value) {
      mobile.closeSearch()
    }
  } finally {
    playingSongKey.value = null
  }
}

async function handlePlayAll() {
  if (playAllLoading.value) return
  playAllLoading.value = true
  hideResultsDropdown()
  try {
    await playAll(playAtIndex)
    // 移动端操作后关闭搜索区域
    if (mobile?.isMobileView.value) {
      mobile.closeSearch()
    }
  } finally {
    playAllLoading.value = false
  }
}

function toggleSelection(index: number, e: MouseEvent) {
  const target = e.target as HTMLElement
  if (target.closest('button')) {
    return
  }
  toggleSearchResultSelection(index)
}

function handleImportToPlaylist() {
  importSelectedSearchResults('playlist')
  // showImportMenu.value = false
  hideResultsDropdown()
  // 移动端操作后关闭搜索区域
  if (mobile?.isMobileView.value) {
    mobile.closeSearch()
  }
}

// 全选/全不选
function handleToggleSelectAll() {
  if (isAllSelected.value) {
    // 全不选
    searchStore.selectedIndices.clear()
  } else {
    // 全选
    searchStore.results.forEach((_, index) => {
      searchStore.selectedIndices.add(index)
    })
  }
}

// 下载已选
async function handleDownloadSelected() {
  if (searchStore.selectedIndices.size === 0) {
    showNotification('请先选择要下载的歌曲', 'warning')
    return
  }

  if (isDownloadingSelected.value) {
    return
  }

  isDownloadingSelected.value = true
  try {
    // 获取选中的歌曲
    const indices = Array.from(searchStore.selectedIndices).filter(
      idx => idx >= 0 && idx < searchStore.results.length
    )
    const selectedSongs = indices.map(idx => searchStore.results[idx]).filter(Boolean)

    // 批量下载（使用当前选择的音质）
    // 传递批量下载按钮元素，只触发一个动画
    await downloadSongs(selectedSongs, usePlayerStore().quality, undefined, downloadSelectedButtonRef.value || undefined)
    // 移动端操作后关闭搜索区域
    if (mobile?.isMobileView.value) {
      mobile.closeSearch()
    }
  } catch (error: any) {
    console.error('批量下载失败:', error)
    showNotification(error?.message || '批量下载失败', 'error')
  } finally {
    isDownloadingSelected.value = false
    // 下载完成后隐藏下拉框
    hideResultsDropdown()
  }
}

// function handleImportToFavorites() {
//   store.importSelectedSearchResults('favorites')
//   showImportMenu.value = false
// }

async function handleDownload(song: any, quality: string) {
  closeDownloadMenu()
  // 下载时不隐藏下拉框
  
  // 获取源元素用于动画
  const songIndex = searchStore.results.findIndex(s => s.id === song.id && s.source === song.source)
  const sourceElement = songIndex >= 0 && songRefs.value[songIndex] 
    ? songRefs.value[songIndex] 
    : undefined

  // 使用新的下载系统
  await downloadSong(song, quality as any, sourceElement || undefined)
  // 移动端操作后关闭搜索区域
  if (mobile?.isMobileView.value) {
    mobile.closeSearch()
  }
}

function handlePreviousPage() {
  if (searchStore.currentPage <= 1 || searchStore.isLoading) return
  performSearch(searchQuery.value, searchStore.currentPage - 1, false)
}

function handleNextPage() {
  if (searchStore.isLoading) return
  if (searchStore.currentPage >= totalPages.value) return
  goToPage(searchStore.currentPage + 1)
}

function handleJumpToPage() {
  const page = Number(jumpPage.value)
  if (page >= 1 && page <= totalPages.value) {
    goToPage(page)
    jumpPage.value = page
  } else {
    jumpPage.value = searchStore.currentPage
    showNotification('页码超出范围', 'warning')
  }
}

function handleLimitChange(e: Event) {
  const limit = Number((e.target as HTMLSelectElement).value)
  setSearchLimit(limit)
}

function toggleDownloadMenu(index: number, event: MouseEvent) {
  if (showDownloadMenu.value === index) {
    closeDownloadMenu()
    return
  }

  const button = event.currentTarget as HTMLElement | null
  if (button) {
    const rect = button.getBoundingClientRect()
    const menuWidth = 180
    const padding = 12
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : menuWidth + padding * 2
    const maxLeft = Math.max(padding, viewportWidth - menuWidth - padding)
    const clampedLeft = Math.min(Math.max(rect.left, padding), maxLeft)

    downloadMenuPosition.value = {
      x: clampedLeft,
      y: rect.bottom + 6
    }
  }

  showDownloadMenu.value = index
}

function closeDownloadMenu() {
  if (showDownloadMenu.value !== null) {
    showDownloadMenu.value = null
  }
}

function handleResultsScroll() {
  closeDownloadMenu()
}

function handleClickOutside(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (showMenu.value && !target.closest('[data-source-selector]')) {
    showMenu.value = false
  }
  // if (showImportMenu.value && !target.closest('.relative')) {
  //   showImportMenu.value = false
  // }
  if (
    showDownloadMenu.value !== null &&
    !target.closest('[data-download-menu]') &&
    !target.closest('[data-download-trigger]')
  ) {
    closeDownloadMenu()
  }
  // 点击搜索区域外部时，清空搜索结果（关闭下拉框）
  if (searchAreaRef.value && !searchAreaRef.value.contains(target) && searchStore.results.length > 0) {
    searchStore.clearResults()
  }
}

// 同步jumpPage到当前页
watch(() => searchStore.currentPage, (newPage) => {
  jumpPage.value = newPage
}, { immediate: true })

watch(() => searchStore.results.length, () => {
  closeDownloadMenu()
})

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  jumpPage.value = searchStore.currentPage
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', closeDownloadMenu)
  }
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', closeDownloadMenu)
  }
})
</script>

<style scoped>
.skeleton-block {
  position: relative;
  overflow: hidden;
}

.skeleton-block::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.35), transparent);
  animation: skeleton-loading 1.5s ease-in-out infinite;
}

.skeleton-light {
  background-color: rgba(0, 0, 0, 0.05);
}

.skeleton-dark {
  background-color: rgba(255, 255, 255, 0.15);
}

@keyframes skeleton-loading {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}
</style>
