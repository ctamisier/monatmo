<script setup lang="ts">
import { onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useWeatherData } from '../composables/useWeatherData'
import { useHomeStore } from '../stores/home.store'
import IconSun from './icons/IconSun.vue'
import IconDroplet from './icons/IconDroplet.vue'
import type { NetatmoHome } from '../types/netatmo'

const props = defineProps<{ home: NetatmoHome }>()

const { t } = useI18n()
const homeStore = useHomeStore()
const { temperature, humidity, stationName, loading, error, fetchFromCoords } = useWeatherData()

function isSelected() {
  return props.home.id === homeStore.selectedHomeId
}

onMounted(() => {
  if (props.home.coordinates) {
    fetchFromCoords(props.home.coordinates[1], props.home.coordinates[0])
  }
})
</script>

<template>
  <div
    class="card-custom card-inner"
    :class="isSelected() ? 'border-[#e05297]!' : ''"
    @click="homeStore.selectHome(home.id)"
  >
    <div class="card-body">
      <h4 class="card-title">
        {{ home.name || t('home.fallbackName') }}
      </h4>

      <div
        v-if="loading && temperature === null"
        class="mt-1"
      >
        <div class="weather-temp-skeleton" />
      </div>

      <div
        v-else-if="temperature !== null"
        class="weather-home-content"
      >
        <div class="weather-home-temp-wrap">
          <IconSun class="weather-home-icon" />
          <span class="weather-home-temp">{{ temperature.toFixed(1) }}°</span>
          <span
            v-if="humidity && humidity > 0"
            class="weather-home-humidity"
          >
            <IconDroplet class="weather-home-humidity-icon" />
            {{ humidity }}%
          </span>
        </div>
        <div class="weather-home-label">
          {{ t('home.outdoorTemp') }}
        </div>
        <div class="weather-home-station">
          {{ stationName }}
        </div>
      </div>

      <div
        v-else-if="error"
        class="weather-home-error"
      >
        {{ error }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.weather-home-content {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  margin-top: 0.25rem;
}

.weather-home-temp-wrap {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.weather-home-icon {
  width: 28px;
  height: 28px;
  color: #f4845f;
  filter: drop-shadow(0 0 6px rgba(244, 132, 95, 0.4));
  flex-shrink: 0;
}

.weather-home-temp {
  font-family: 'Cormorant Garamond', 'Georgia', serif;
  font-size: 2rem;
  font-weight: 300;
  color: #e8dff5;
  line-height: 1;
  letter-spacing: -0.02em;
}

.weather-home-humidity {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 1rem;
  color: rgba(216, 204, 232, 0.5);
  font-weight: 500;
}

.weather-home-humidity-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  color: rgba(216, 204, 232, 0.4);
}

.weather-home-station {
  font-size: 0.85rem;
  color: rgba(216, 204, 232, 0.3);
  letter-spacing: 0.04em;
}

.weather-home-label {
  font-size: 0.75rem;
  color: rgba(216, 204, 232, 0.45);
  letter-spacing: 0.03em;
  text-transform: uppercase;
  margin-top: 0.125rem;
}

.weather-home-error {
  font-size: 0.95rem;
  color: rgba(224, 82, 151, 0.7);
  margin-top: 0.25rem;
}

.weather-temp-skeleton {
  width: 110px;
  height: 40px;
  border-radius: 8px;
  background: linear-gradient(
    90deg,
    rgba(123, 94, 167, 0.06) 25%,
    rgba(123, 94, 167, 0.12) 50%,
    rgba(123, 94, 167, 0.06) 75%
  );
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s ease-in-out infinite;
}

@keyframes skeleton-shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>
