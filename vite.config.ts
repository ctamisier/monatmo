import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

import { cloudflare } from "@cloudflare/vite-plugin";

const now = new Date()
const BUILD_DATE = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    {
      name: 'replace-build-date',
      transform(code, id) {
        if (!id.includes('App.vue')) return
        return code.replace(/'__BUILD_DATE__'/g, JSON.stringify(BUILD_DATE))
      },
    },
    vue(),
    cloudflare(),
  ],
  base: '/',
})