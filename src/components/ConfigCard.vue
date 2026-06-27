<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '../stores/auth.store'
import { DEFAULT_SCOPE } from '../services/auth.service'
import ConfirmDialog from './ConfirmDialog.vue'
import ToastNotification from './ToastNotification.vue'

const { t } = useI18n()
const auth = useAuthStore()

const showConfirm = ref(false)
const toast = ref({ message: '', type: 'success' as 'success' | 'error' | 'info' })
const toastKey = ref(0)

function notify(msg: string, type: 'success' | 'error' | 'info') {
  toast.value = { message: msg, type }
  toastKey.value++
}

function submit() {
  auth.updateConfig(auth.config)
  notify(t('config.saved'), 'success')
}

function requestClear() {
  showConfirm.value = true
}

function confirmClear() {
  showConfirm.value = false
  auth.clearConfig()
  notify(t('config.cleared'), 'info')
}

function cancelClear() {
  showConfirm.value = false
}
</script>

<template>
  <div class="card-custom">
    <div class="card-body">
      <h2 class="card-title">
        {{ t('config.title') }}
      </h2>
      <p class="text-sm mb-4 opacity-60">
        {{ t('config.description') }}
        <a
          href="https://dev.netatmo.com/apps/"
          target="_blank"
        >dev.netatmo.com/apps/</a>
        :
      </p>

      <div class="flex gap-4 flex-wrap mb-4">
        <div class="flex flex-col gap-1 flex-1 min-w-50">
          <label class="text-xs uppercase opacity-60">{{ t('config.clientId') }}</label>
          <input
            v-model="auth.config.clientId"
            type="text"
            :placeholder="t('config.clientIdPlaceholder')"
            class="input input-bordered w-full"
          >
        </div>
        <div class="flex flex-col gap-1 flex-1 min-w-50">
          <label class="text-xs uppercase opacity-60">{{ t('config.clientSecret') }}</label>
          <input
            v-model="auth.config.clientSecret"
            type="password"
            :placeholder="t('config.clientSecretPlaceholder')"
            class="input input-bordered w-full"
          >
        </div>
      </div>

      <div class="flex gap-4 flex-wrap mb-4">
        <div class="flex flex-col gap-1 flex-1 min-w-50">
          <label class="text-xs uppercase opacity-60">{{ t('config.redirectUri') }}</label>
          <input
            v-model="auth.config.redirectUri"
            type="text"
            :placeholder="t('config.redirectUriPlaceholder')"
            class="input input-bordered w-full"
          >
        </div>
        <div class="flex flex-col gap-1 flex-1 min-w-50">
          <label class="text-xs uppercase opacity-60">{{ t('config.scopesLabel') }}</label>
          <input
            v-model="auth.config.scope"
            type="text"
            :placeholder="DEFAULT_SCOPE"
            class="input input-bordered w-full"
          >
        </div>
      </div>

      <div class="card-actions justify-end">
        <button
          class="btn-nebula"
          @click="submit"
        >
          {{ t('config.saveButton') }}
        </button>
        <button
          class="btn-nebula-ghost"
          @click="requestClear"
        >
          {{ t('config.clearButton') }}
        </button>
      </div>
    </div>
  </div>

  <ConfirmDialog
    :open="showConfirm"
    :title="t('config.confirmTitle')"
    :message="t('config.confirmMessage')"
    @confirm="confirmClear"
    @cancel="cancelClear"
  />

  <ToastNotification
    :key="toastKey"
    :message="toast.message"
    :type="toast.type"
  />
</template>
