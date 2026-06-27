<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useShutterStore } from '../stores/shutter.store'
import { DEFAULT_SHUTTER_POSITION, DEFAULT_SHUTTER_STEP, SHUTTER_POSITION_TOLERANCE } from '../constants/chart'

const { t } = useI18n()

const props = defineProps<{
  moduleId: string
  name?: string
  roomName: string
  type: string
  currentPosition: number | string
  targetPosition: number | string
  targetPositionStep?: number | string
}>()

const shutter = useShutterStore()
const positionInput = ref(DEFAULT_SHUTTER_POSITION)
const pendingTarget = ref<number | null>(null)

const currentPos = computed(() => {
  const v = Number(props.currentPosition)
  return isNaN(v) || v < 0 ? positionInput.value : v
})

const targetPos = computed(() => {
  const v = Number(props.targetPosition)
  return isNaN(v) || v < 0 ? null : v
})

const step = computed(() => {
  const v = Number(props.targetPositionStep)
  return isNaN(v) || v <= 0 ? DEFAULT_SHUTTER_STEP : v
})

const displayTarget = computed(() => {
  if (pendingTarget.value !== null) return pendingTarget.value
  if (targetPos.value !== null && targetPos.value !== currentPos.value) return targetPos.value
  return null
})

const showTarget = computed(() => displayTarget.value !== null && displayTarget.value !== currentPos.value)

watch(() => props.currentPosition, (pos) => {
  if (typeof pos === 'number' && pos >= 0) {
    positionInput.value = pos
  }
}, { immediate: true })

watch(() => props.targetPosition, (val) => {
  const v = Number(val)
  if (!isNaN(v) && v >= 0) {
    pendingTarget.value = v
  }
}, { immediate: true })

watch(currentPos, (cur) => {
  if (pendingTarget.value !== null && Math.abs(cur - pendingTarget.value) < SHUTTER_POSITION_TOLERANCE) {
    pendingTarget.value = null
  }
})

function onSliderInput() {
  pendingTarget.value = Math.round(positionInput.value)
}

function sendPosition() {
  const intValue = Math.round(positionInput.value)
  pendingTarget.value = intValue
  shutter.controlShutter('position', intValue, props.moduleId)
}

function onOpen() {
  pendingTarget.value = 100
  shutter.controlShutter('open', undefined, props.moduleId)
}

function onClose() {
  pendingTarget.value = 0
  shutter.controlShutter('close', undefined, props.moduleId)
}

function onStop() {
  pendingTarget.value = null
  shutter.controlShutter('stop', undefined, props.moduleId)
}
</script>

<template>
  <div class="card-custom card-inner cursor-default! hover:border-[rgba(123,94,167,0.15)]! hover:shadow-none!">
    <div class="card-body text-center">
      <h4 class="card-title">
        {{ name || t('shutter.fallbackName', { id: moduleId.substring(0, 8) }) }}
      </h4>

      <div class="flex justify-between items-center w-full mb-4 mt-1">
        <div class="text-base font-medium opacity-75">
          {{ roomName || t('shutter.unknownRoom') }}
        </div>
        <div class="text-sm font-semibold text-[#e05297]">
          {{ currentPos }}%
          <span
            v-if="showTarget"
            class="text-[#6edc9f] ml-2"
          >→ {{ displayTarget }}%</span>
        </div>
      </div>

      <div class="flex items-start justify-between w-full gap-4">
        <div class="flex flex-col items-center flex-1">
          <button
            class="shutter-btn btn-open shutter-btn-top"
            @click="onOpen"
          >
            ▲ {{ t('shutter.open') }}
          </button>

          <div class="relative w-full h-40 rounded-md overflow-hidden">
            <div class="absolute inset-0 shutter-lamelles" />
            <div
              class="absolute bottom-0 left-0 right-0 bg-white"
              :style="{ height: `${positionInput}%` }"
            />
            <input
              v-model.number="positionInput"
              type="range"
              min="0"
              max="100"
              :step="step"
              class="range range-vertical w-full h-full relative z-10 [--range-fill:0]"
              @input="onSliderInput"
              @change="sendPosition"
            >
          </div>

          <button
            class="shutter-btn btn-close shutter-btn-bottom"
            @click="onClose"
          >
            ▼ {{ t('shutter.close') }}
          </button>
        </div>

        <button
          class="btn-stop self-center"
          @click="onStop"
        >
          ■ {{ t('shutter.stop') }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.shutter-btn {
  position: relative;
  overflow: hidden;
  padding: 8px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  transition: transform 0.3s, background 0.3s, border-color 0.3s;
  cursor: pointer;
}

.shutter-btn:hover {
  transform: scale(1.05);
}

.shutter-btn:active {
  transform: scale(0.95);
}

.shutter-btn::after {
  content: "";
  position: absolute;
  inset: 0;
  opacity: 0;
  transition: opacity 0.3s;
  pointer-events: none;
}

.shutter-btn:hover::after {
  opacity: 1;
}

.btn-open {
  background: linear-gradient(135deg, rgba(110, 220, 159, 0.15), rgba(110, 220, 159, 0.05));
  border: 1px solid rgba(110, 220, 159, 0.3);
  color: #6edc9f;
}

.btn-open::after {
  background: radial-gradient(circle at center, rgba(110, 220, 159, 0.12), transparent 70%);
}

.btn-close {
  background: linear-gradient(135deg, rgba(244, 132, 95, 0.15), rgba(244, 132, 95, 0.05));
  border: 1px solid rgba(244, 132, 95, 0.3);
  color: #f4845f;
}

.btn-close::after {
  background: radial-gradient(circle at center, rgba(244, 132, 95, 0.12), transparent 70%);
}

.shutter-btn-top {
  position: relative;
  z-index: 2;
  width: 100%;
  margin-bottom: -1px;
  border-radius: 8px 8px 0 0;
}

.shutter-btn-bottom {
  position: relative;
  z-index: 2;
  width: 100%;
  margin-top: -1px;
  border-radius: 0 0 8px 8px;
}

.shutter-lamelles {
  background: repeating-linear-gradient(
      to bottom,
      #4a4a5a 0px,
      #4a4a5a 8px,
      #3a3a48 8px,
      #3a3a48 14px
  );
}
</style>