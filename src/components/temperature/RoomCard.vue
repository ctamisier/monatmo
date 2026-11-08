<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import IconArrowDown from '../icons/IconArrowDown.vue'
import IconArrowUp from '../icons/IconArrowUp.vue'
import type { TemperatureValve } from '../../types/temperature'

const props = defineProps<{
  name: string
  isThermostat: boolean
  selected: boolean
  measuredTemperature?: number
  setpointTemperature?: number
  valves: readonly TemperatureValve[]
}>()

const emit = defineEmits<{
  toggle: []
  changeTemperature: [delta: number]
}>()

const { t } = useI18n()

const BATTERY_STATES = ['very_low', 'low', 'medium', 'high', 'full'] as const

function formatBattery(level?: number, state?: string): string {
  const stateLabel = state && (BATTERY_STATES as readonly string[]).includes(state)
    ? t(`temperature.batteryStates.${state}`)
    : state || '--'
  if (level == null) return stateLabel
  return stateLabel !== '--' ? `${level}mV (${stateLabel})` : `${level}mV`
}

function onCardClick(): void {
  if (props.isThermostat) emit('toggle')
}
</script>

<template>
  <div
    class="card-custom card-inner"
    :class="selected ? 'border-nebula-pink!' : ''"
    @click="onCardClick"
  >
    <div class="card-body">
      <div class="room-header">
        <h4 class="card-title">
          {{ name }}
        </h4>
        <input
          v-if="isThermostat"
          type="checkbox"
          class="room-checkbox"
          :checked="selected"
          :aria-label="name"
          @click.stop
          @change="emit('toggle')"
        >
      </div>

      <div
        v-if="isThermostat"
        class="flex items-center gap-3 mb-3"
      >
        <button
          type="button"
          class="btn-temp btn-temp--minus"
          :aria-label="`${name} - 0.5°C`"
          @click.stop="emit('changeTemperature', -0.5)"
        >
          <IconArrowDown />
        </button>

        <div class="text-2xl font-mono text-nebula-pink">
          {{ measuredTemperature ?? '--' }}°C
        </div>

        <button
          type="button"
          class="btn-temp btn-temp--plus"
          :aria-label="`${name} + 0.5°C`"
          @click.stop="emit('changeTemperature', 0.5)"
        >
          <IconArrowUp />
        </button>
      </div>

      <div
        v-if="isThermostat"
        class="text-sm opacity-60 space-y-1"
      >
        <div>
          {{ t('temperature.setpoint') }}
          <span class="text-nebula-pink">
            {{ setpointTemperature ?? '--' }}°C
          </span>
        </div>
      </div>

      <div
        v-if="valves.length > 0"
        :class="['mt-3', isThermostat ? 'border-t border-nebula-line pt-3' : '']"
      >
        <div class="text-sm font-bold opacity-80 mb-2">
          {{ t('temperature.valves') }}
        </div>
        <div
          v-for="valve in valves"
          :key="valve.id"
          class="text-sm opacity-70 mb-1"
        >
          <div>{{ valve.name || `VALVE ${valve.id}` }}</div>
          <div>{{ t('temperature.battery') }} {{ formatBattery(valve.batteryLevel, valve.batteryState) }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.room-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.room-checkbox {
  width: 22px;
  height: 22px;
  accent-color: var(--color-nebula-pink);
  cursor: pointer;
  flex-shrink: 0;
}

.btn-temp {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  font-weight: 700;
  color: var(--temp-accent);
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--temp-accent) 12%, transparent),
    color-mix(in srgb, var(--temp-accent) 4%, transparent)
  );
  border: 1px solid color-mix(in srgb, var(--temp-accent) 25%, transparent);
  transition: transform 0.2s;
  cursor: pointer;
}

.btn-temp:hover {
  transform: scale(1.1);
}

.btn-temp:active {
  transform: scale(0.9);
}

.btn-temp:focus-visible {
  outline: 2px solid var(--temp-accent);
  outline-offset: 2px;
}

.btn-temp--minus {
  --temp-accent: var(--color-nebula-coral);
}

.btn-temp--plus {
  --temp-accent: var(--color-nebula-mint);
}

@media (prefers-reduced-motion: reduce) {
  .btn-temp {
    transition: none;
  }

  .btn-temp:hover,
  .btn-temp:active {
    transform: none;
  }
}
</style>
