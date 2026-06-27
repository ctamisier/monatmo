<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '../stores/auth.store'

const { t } = useI18n()
const auth = useAuthStore()
</script>

<template>
  <div class="card-custom">
    <div class="card-body">
      <h2 class="card-title">
        {{ t('auth.title') }}
      </h2>
      <p class="text-sm mb-4 opacity-60">
        {{ t('auth.description') }}
      </p>
      <button
        class="btn-login"
        :disabled="!auth.canConnect"
        @click="auth.connect()"
      >
        {{ t('auth.loginButton') }}
      </button>
      <p
        v-if="!auth.canConnect"
        class="text-xs opacity-50 mt-1"
      >
        {{ t('auth.hint') }}
      </p>
    </div>
  </div>
</template>

<style scoped>
.btn-login {
  position: relative;
  overflow: hidden;
  padding: 10px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  background: linear-gradient(135deg, rgba(123, 94, 167, 0.25), rgba(224, 82, 151, 0.15));
  border: 1px solid rgba(123, 94, 167, 0.4);
  color: #c97bdb;
  transition: all 0.3s;
  cursor: pointer;
}

.btn-login:hover {
  transform: scale(1.05);
}

.btn-login:active {
  transform: scale(0.95);
}

.btn-login:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  transform: none;
}

.btn-login::after {
  content: "";
  position: absolute;
  inset: 0;
  opacity: 0;
  background: radial-gradient(circle at center, rgba(123, 94, 167, 0.15), transparent 70%);
  transition: opacity 0.3s;
  pointer-events: none;
}

.btn-login:hover::after {
  opacity: 1;
}
</style>
