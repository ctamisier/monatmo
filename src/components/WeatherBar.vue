<script setup lang="ts">
import { onMounted } from 'vue'
import { useWeatherData } from '../composables/useWeatherData'
import IconSun from './icons/IconSun.vue'
import IconDroplet from './icons/IconDroplet.vue'
import IconLocationPin from './icons/IconLocationPin.vue'

const { temperature, humidity, loading, error, fetchWeather } = useWeatherData()

onMounted(() => {
  fetchWeather()
})
</script>

<template>
  <div class="weather-bar">
    <template v-if="loading && temperature === null">
      <div class="weather-bar-skeleton" />
    </template>

    <template v-else-if="temperature !== null">
      <IconLocationPin class="weather-bar-pin" />
      <IconSun class="weather-bar-icon" />
      <span class="weather-bar-temp">{{ temperature.toFixed(1) }}°</span>
      <span
        v-if="humidity && humidity > 0"
        class="weather-bar-humidity"
      >
        <IconDroplet class="weather-bar-drop" />
        {{ humidity }}%
      </span>
    </template>

    <span
      v-else-if="error"
      class="weather-bar-error"
    >--</span>
  </div>
</template>

<style scoped>
.weather-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 14px;
  border-radius: 10px;
  border: 1px solid rgba(123, 94, 167, 0.15);
  font-size: 14px;
  font-weight: 600;
  color: rgba(216, 204, 232, 0.5);
  white-space: nowrap;
  min-width: 0;
  overflow: hidden;
  transition: color 0.25s, border-color 0.25s;
}

.weather-bar:hover {
  color: #d8cce8;
  border-color: rgba(123, 94, 167, 0.35);
}

.weather-bar-pin {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  color: #e05297;
  filter: drop-shadow(0 0 4px rgba(224, 82, 151, 0.4));
}

.weather-bar-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  color: #f4845f;
  filter: drop-shadow(0 0 4px rgba(244, 132, 95, 0.4));
}

.weather-bar-temp {
  font-family: 'Cormorant Garamond', 'Georgia', serif;
  font-size: 18px;
  font-weight: 300;
  color: #e8dff5;
  line-height: 1;
}

.weather-bar-humidity {
  display: flex;
  align-items: center;
  gap: 3px;
  color: rgba(216, 204, 232, 0.4);
  font-size: 13px;
}

.weather-bar-drop {
  width: 13px;
  height: 13px;
  flex-shrink: 0;
}

.weather-bar-error {
  color: rgba(224, 82, 151, 0.6);
}

.weather-bar-skeleton {
  width: 75px;
  height: 18px;
  border-radius: 4px;
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
