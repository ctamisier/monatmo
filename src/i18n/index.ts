import { createI18n } from 'vue-i18n'
import fr from '../locales/fr.json'

const i18n = createI18n({
  legacy: false,
  locale: 'fr',
  fallbackLocale: 'fr',
  messages: {
    fr,
  },
})

export { i18n }
export default i18n
