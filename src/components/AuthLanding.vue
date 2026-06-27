<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '../stores/auth.store'
import LanguageSwitcher from './LanguageSwitcher.vue'

const { t } = useI18n()
const auth = useAuthStore()
</script>

<template>
  <div class="auth-landing">
    <div class="nebula-orb nebula-orb--purple" />
    <div class="nebula-orb nebula-orb--pink" />
    <div class="nebula-orb nebula-orb--coral" />
    <div class="nebula-orb nebula-orb--glow" />

    <div class="auth-content">
      <div class="auth-brand">
        <div class="auth-halo" />
        <h1 class="auth-logo">
          MONATMO
        </h1>
      </div>

      <div class="auth-divider" />

      <p class="auth-tagline">
        {{ t('auth.tagline') }}
      </p>

      <p class="auth-description">
        {{ t('auth.description') }}
      </p>

      <button
        class="btn-auth"
        :disabled="!auth.canConnect"
        @click="auth.connect()"
      >
        <span class="btn-auth-shimmer" />
        <span class="btn-auth-label">{{ t('auth.loginButton') }}</span>
      </button>

      <p class="auth-hint">
        {{ t('auth.hint') }}
      </p>

      <div class="auth-lang">
        <LanguageSwitcher :dropup="true" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-landing {
  position: relative;
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.auth-content {
  position: relative;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 2rem;
  max-width: 30rem;
  animation: landing-fadein 1.2s cubic-bezier(0.16, 1, 0.3, 1) both;
}

@keyframes landing-fadein {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.auth-brand {
  position: relative;
  margin-bottom: 0.5rem;
}

.auth-halo {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 280px;
  height: 280px;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(123, 94, 167, 0.12) 0%,
    rgba(224, 82, 151, 0.05) 40%,
    transparent 70%
  );
  filter: blur(30px);
  animation: halo-pulse 6s ease-in-out infinite;
  pointer-events: none;
}

@keyframes halo-pulse {
  0%, 100% {
    opacity: 0.5;
    transform: translate(-50%, -50%) scale(1);
  }
  50% {
    opacity: 0.8;
    transform: translate(-50%, -50%) scale(1.08);
  }
}

.auth-logo {
  position: relative;
  font-size: clamp(2.2rem, 8vw, 3.2rem);
  font-weight: 100;
  letter-spacing: 0.5em;
  margin: 0;
  text-indent: 0.5em;
  background: linear-gradient(
    135deg,
    #f4845f 0%,
    #e05297 30%,
    #c97bdb 60%,
    #7b5ea7 100%
  );
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  filter: drop-shadow(0 0 24px rgba(201, 123, 219, 0.35))
    drop-shadow(0 0 48px rgba(224, 82, 151, 0.15));
}

.auth-divider {
  width: 48px;
  height: 1px;
  margin: 1.5rem auto 2rem;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(244, 132, 95, 0.5) 20%,
    rgba(224, 82, 151, 0.6) 50%,
    rgba(123, 94, 167, 0.5) 80%,
    transparent
  );
  animation: divider-in 1.8s cubic-bezier(0.16, 1, 0.3, 1) 0.3s both;
}

@keyframes divider-in {
  from {
    opacity: 0;
    width: 0;
  }
  to {
    opacity: 1;
    width: 48px;
  }
}

.auth-tagline {
  font-size: clamp(1rem, 3.5vw, 1.3rem);
  font-weight: 300;
  letter-spacing: 0.14em;
  color: #e8dff5;
  margin: 0 0 1rem;
  line-height: 1.7;
  animation: landing-fadein 1.2s cubic-bezier(0.16, 1, 0.3, 1) 0.15s both;
}

.auth-description {
  font-size: clamp(0.78rem, 2.5vw, 0.9rem);
  color: rgba(216, 204, 232, 0.5);
  margin: 0 0 2.5rem;
  line-height: 1.7;
  letter-spacing: 0.04em;
  max-width: 24rem;
  animation: landing-fadein 1.2s cubic-bezier(0.16, 1, 0.3, 1) 0.3s both;
}

.btn-auth {
  position: relative;
  overflow: hidden;
  padding: 16px 48px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  background: linear-gradient(
    135deg,
    rgba(123, 94, 167, 0.2),
    rgba(224, 82, 151, 0.15),
    rgba(244, 132, 95, 0.1)
  );
  border: 1px solid rgba(201, 123, 219, 0.3);
  color: #e8dff5;
  cursor: pointer;
  transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1),
    background 0.4s cubic-bezier(0.16, 1, 0.3, 1),
    border-color 0.4s cubic-bezier(0.16, 1, 0.3, 1),
    box-shadow 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow:
    0 0 30px rgba(123, 94, 167, 0.08),
    0 0 60px rgba(224, 82, 151, 0.04),
    inset 0 1px 0 rgba(255, 255, 255, 0.04);
  animation: landing-fadein 1.2s cubic-bezier(0.16, 1, 0.3, 1) 0.45s both;
}

.btn-auth:hover:not(:disabled) {
  transform: translateY(-2px) scale(1.03);
  border-color: rgba(201, 123, 219, 0.55);
  box-shadow:
    0 0 40px rgba(123, 94, 167, 0.18),
    0 0 80px rgba(224, 82, 151, 0.1),
    0 12px 40px rgba(0, 0, 0, 0.35),
    inset 0 1px 0 rgba(255, 255, 255, 0.06);
  background: linear-gradient(
    135deg,
    rgba(123, 94, 167, 0.3),
    rgba(224, 82, 151, 0.22),
    rgba(244, 132, 95, 0.16)
  );
}

.btn-auth:active:not(:disabled) {
  transform: translateY(0) scale(0.98);
}

.btn-auth:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.btn-auth-shimmer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.05),
    transparent
  );
  transform: translateX(-100%);
  transition: none;
  pointer-events: none;
}

.btn-auth:hover:not(:disabled) .btn-auth-shimmer {
  animation: btn-shimmer 1.5s ease-in-out;
}

.btn-auth-label {
  position: relative;
  z-index: 1;
}

.auth-hint {
  margin-top: 2.5rem;
  font-size: 0.68rem;
  color: rgba(216, 204, 232, 0.22);
  letter-spacing: 0.08em;
  animation: landing-fadein 1.2s cubic-bezier(0.16, 1, 0.3, 1) 0.6s both;
}

.auth-lang {
  margin-top: 1rem;
  animation: landing-fadein 1.2s cubic-bezier(0.16, 1, 0.3, 1) 0.65s both;
}

@keyframes btn-shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}
</style>
