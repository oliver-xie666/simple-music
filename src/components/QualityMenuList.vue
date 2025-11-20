<template>
  <div class="flex flex-col min-w-[180px]" role="menu">
    <div
      v-for="q in normalizedOptions"
      :key="q.value"
      @click="handleSelect(q.value)"
      class="flex justify-between items-center gap-2 px-3.5 py-2.5 text-sm cursor-pointer transition-all duration-200 rounded-[6px]"
      :class="getItemClass(q.value)"
      role="menuitem"
      tabindex="0"
      @keydown.enter.prevent="handleSelect(q.value)"
      @keydown.space.prevent="handleSelect(q.value)"
    >
      <span class="font-medium truncate">
        {{ q.label }}
        <span class="opacity-70 text-xs font-normal whitespace-nowrap">({{ q.description }})</span>
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { QUALITY_OPTIONS } from '../utils/quality-options'
import { useThemeStore } from '../stores/theme'
import type { QualityType } from '../types'

interface Props {
  options?: typeof QUALITY_OPTIONS
  selected?: QualityType | null
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  options: () => QUALITY_OPTIONS,
  selected: null,
  disabled: false
})

const emit = defineEmits<{
  (e: 'select', value: QualityType): void
}>()

const themeStore = useThemeStore()

const normalizedOptions = computed(() => props.options ?? QUALITY_OPTIONS)

const getItemClass = (value: QualityType) => {
  if (props.disabled) {
    return themeStore.isDark
      ? 'text-white/40 cursor-not-allowed'
      : 'text-[#2c3e50]/40 cursor-not-allowed'
  }

  if (props.selected === value) {
    return 'bg-[#1abc9c] text-white shadow-[0_6px_16px_rgba(26,188,156,0.25)]'
  }

  return themeStore.isDark
    ? 'text-[#ecf0f1] hover:bg-[#1abc9c] hover:text-white'
    : 'text-[#2c3e50] hover:bg-[#1abc9c]/12 hover:text-[#1abc9c]'
}

const handleSelect = (value: QualityType) => {
  if (props.disabled) return
  emit('select', value)
}
</script>

