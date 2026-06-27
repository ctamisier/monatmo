<script setup lang="ts">
import { ref } from 'vue'
import { setLocale, getLocale, SUPPORTED } from '../i18n'
import IconGlobe from './icons/IconGlobe.vue'

defineProps<{ compact?: boolean; dropup?: boolean }>()

const LANGUAGES: Record<string, string> = {
  fr: 'Français',
  en: 'English',
  es: 'Español',
  de: 'Deutsch',
  it: 'Italiano',
  pt: 'Português',
  nl: 'Nederlands',
  pl: 'Polski',
  tr: 'Türkçe',
  ja: '日本語',
  ko: '한국어',
  zh: '中文',
  'zh-TW': '繁體中文（台灣）',
  'zh-HK': '繁體中文（香港）',
  ar: 'العربية',
}

const dialogRef = ref<HTMLDialogElement | null>(null)

function open() {
  dialogRef.value?.showModal()
}

function select(locale: string) {
  setLocale(locale as Parameters<typeof setLocale>[0])
  dialogRef.value?.close()
}

function currentLabel(): string {
  return LANGUAGES[getLocale()] ?? LANGUAGES.fr
}
</script>

<template>
  <button
    class="lang-trigger"
    :class="compact ? 'lang-trigger--sm' : 'lang-trigger--lg'"
    @click="open"
  >
    <IconGlobe class="lang-icon" />
    <span class="lang-trigger-label">{{ currentLabel() }}</span>
  </button>

  <dialog
    ref="dialogRef"
    class="modal"
  >
    <div class="modal-box max-w-28rem">
      <div class="grid grid-cols-2 gap-1">
        <button
          v-for="code in SUPPORTED"
          :key="code"
          class="btn btn-ghost btn-block justify-start text-base"
          :class="{ 'text-primary font-bold': code === getLocale() }"
          @click="select(code)"
        >
          {{ LANGUAGES[code] }}
        </button>
      </div>
    </div>
    <form
      method="dialog"
      class="modal-backdrop"
    >
      <button>close</button>
    </form>
  </dialog>
</template>

<style scoped>
.lang-trigger {
  display: flex;
  align-items: center;
  gap: 6px;
  border-radius: 8px;
  font-weight: 600;
  letter-spacing: 0.04em;
  background: transparent;
  border: 1px solid rgba(123, 94, 167, 0.15);
  cursor: pointer;
  transition: color 0.25s, border-color 0.25s, background 0.25s;
}

.lang-trigger--sm {
  padding: 7px 10px;
  color: rgba(216, 204, 232, 0.5);
  max-width: 140px;
  overflow: hidden;
}

.lang-trigger--sm:hover {
  color: #d8cce8;
  border-color: rgba(123, 94, 167, 0.35);
  background: rgba(123, 94, 167, 0.06);
}

.lang-trigger--lg {
  padding: 12px 20px;
  font-size: 15px;
  color: rgba(216, 204, 232, 0.6);
  border-color: rgba(123, 94, 167, 0.25);
  background: rgba(123, 94, 167, 0.06);
  border-radius: 12px;
  animation: landing-fadein 1.2s cubic-bezier(0.16, 1, 0.3, 1) 0.65s both;
}

.lang-trigger--lg:hover {
  color: #e8dff5;
  border-color: rgba(201, 123, 219, 0.45);
  background: rgba(123, 94, 167, 0.12);
}

.lang-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  opacity: 0.5;
  transition: opacity 0.25s;
}

.lang-trigger--lg:hover .lang-icon {
  opacity: 0.75;
}

.lang-trigger-label {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
