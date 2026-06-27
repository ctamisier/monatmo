<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '../stores/auth.store'

const { t } = useI18n()
const auth = useAuthStore()

function logout() {
  auth.logout()
}
</script>

<template>
  <div class="card-custom">
    <div class="card-body">
      <h2 class="card-title">
        {{ t('token.title') }}
      </h2>

      <div class="flex flex-col gap-2 text-sm">
        <p><strong>{{ t('token.accessToken') }}</strong> <span class="font-mono opacity-60">••••••••</span></p>
        <p><strong>{{ t('token.refreshToken') }}</strong> <span class="font-mono opacity-60">••••••••</span></p>
        <p><strong>{{ t('token.expiresIn') }}</strong> {{ auth.token?.expires_in ?? t('common.notAvailable') }} {{ t('token.seconds') }}</p>
        <p><strong>{{ t('token.scopes') }}</strong> {{ auth.token?.scope ?? t('common.notAvailable') }}</p>
      </div>

      <div class="mt-4">
        <button
          class="btn-stop"
          @click="logout"
        >
          {{ t('token.logoutButton') }}
        </button>
      </div>
    </div>
  </div>
</template>
