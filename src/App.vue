<script lang="ts">
const buildDate = '__BUILD_DATE__'
</script>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from './stores/auth.store'
import AuthLanding from './components/AuthLanding.vue'
import HomeCard from './components/HomeCard.vue'
import TemperatureCard from './components/TemperatureCard.vue'
import ShutterCard from './components/ShutterCard.vue'
import LightCard from './components/LightCard.vue'
import LanguageSwitcher from './components/LanguageSwitcher.vue'
import ToastNotification from './components/ToastNotification.vue'
import WeatherBar from './components/WeatherBar.vue'
import IconRefresh from './components/icons/IconRefresh.vue'
import { STATUS_MESSAGE_DURATION } from './constants/chart'

const auth = useAuthStore()
const { t } = useI18n()
const successMessage = ref('')

function refreshPage() {
  document.location.reload()
}

onMounted(async () => {
  const justConnected = await auth.initialize()
  if (justConnected) {
    successMessage.value = t('app.success')
    setTimeout(() => { successMessage.value = '' }, STATUS_MESSAGE_DURATION)
  }
})
</script>

<template>
  <div :class="['min-h-screen mx-auto relative', auth.isAuthenticated ? 'max-w-350 p-5 sm:p-6' : 'p-5 sm:p-6']">
    <div class="stars-small" />
    <div class="stars-medium" />
    <div class="stars-large" />

    <div class="top-bar">
      <WeatherBar v-if="auth.isAuthenticated" />
      <div class="top-bar-actions">
        <LanguageSwitcher
          v-if="auth.isAuthenticated"
          :compact="true"
        />
        <button
          v-if="auth.isAuthenticated"
          class="btn-icon"
          :title="t('app.refresh')"
          @click="refreshPage()"
        >
          <IconRefresh class="btn-icon-svg" />
        </button>
        <button
          v-if="auth.isAuthenticated"
          class="btn-logout"
          @click="auth.logout()"
        >
          {{ t('token.logoutButton') }}
        </button>
      </div>
    </div>

    <div
      v-if="!auth.isInitialized"
      class="auth-loading"
    >
      <span class="loading loading-spinner loading-lg text-[#e05297]" />
    </div>

    <AuthLanding v-else-if="!auth.isAuthenticated" />

    <template v-else>
      <div class="relative z-10 mt-5">
        <HomeCard />
      </div>

      <div class="relative z-10 mt-5">
        <TemperatureCard />
      </div>

      <div class="relative z-10 mt-5">
        <LightCard />
      </div>

      <div class="relative z-10 mt-5">
        <ShutterCard />
      </div>
    </template>

    <div class="build-date">
      build {{ buildDate }}
    </div>
  </div>

  <ToastNotification
    v-if="successMessage"
    :key="successMessage"
    :message="successMessage"
    type="success"
  />
</template>

<style scoped>
.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  position: relative;
  z-index: 20;
  flex-wrap: wrap;
}

.top-bar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.auth-loading {
  position: relative;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 180px);
  min-height: calc(100dvh - 180px);
}

.build-date {
  position: absolute;
  bottom: 8px;
  right: 20px;
  font-size: 12px;
  color: rgba(216, 204, 232, 0.2);
  letter-spacing: 0.04em;
  pointer-events: none;
}

.btn-logout {
  padding: 8px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  background: rgba(224, 82, 151, 0.15);
  border: 1px solid rgba(224, 82, 151, 0.4);
  color: #e0529b;
  cursor: pointer;
  transition: transform 0.3s, background 0.3s;
  white-space: nowrap;
  flex-shrink: 0;
}

.btn-logout:hover {
  background: rgba(224, 82, 151, 0.25);
  transform: scale(1.05);
}

.btn-logout:active {
  transform: scale(0.95);
}

.btn-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: rgba(123, 94, 167, 0.15);
  border: 1px solid rgba(123, 94, 167, 0.4);
  color: rgba(216, 204, 232, 0.7);
  cursor: pointer;
  transition: transform 0.3s, background 0.3s;
  flex-shrink: 0;
}

.btn-icon:hover {
  background: rgba(123, 94, 167, 0.25);
  transform: scale(1.1);
  color: #d8cce8;
}

.btn-icon:active {
  transform: scale(0.95);
}

.btn-icon-svg {
  width: 18px;
  height: 18px;
}
</style>
