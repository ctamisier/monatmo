import { createI18n } from 'vue-i18n'
import fr from '../locales/fr.json'
import en from '../locales/en.json'
import es from '../locales/es.json'
import de from '../locales/de.json'
import it from '../locales/it.json'
import pt from '../locales/pt.json'
import nl from '../locales/nl.json'
import pl from '../locales/pl.json'
import tr from '../locales/tr.json'
import ja from '../locales/ja.json'
import ko from '../locales/ko.json'
import zh from '../locales/zh.json'
import zhTW from '../locales/zh-TW.json'
import zhHK from '../locales/zh-HK.json'
import ar from '../locales/ar.json'

const STORAGE_KEY = 'monatmo-locale'

const messages = { fr, en, es, de, it, pt, nl, pl, tr, ja, ko, zh, 'zh-TW': zhTW, 'zh-HK': zhHK, ar }

type LocaleKey = keyof typeof messages

const SUPPORTED: LocaleKey[] = ['fr', 'en', 'es', 'de', 'it', 'pt', 'nl', 'pl', 'tr', 'ja', 'ko', 'zh', 'zh-TW', 'zh-HK', 'ar']

function detectLocale(): LocaleKey {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved && SUPPORTED.includes(saved as LocaleKey)) {
    return saved as LocaleKey
  }
  const browserLang = navigator.language.split('-')[0]
  if (SUPPORTED.includes(browserLang as LocaleKey)) {
    return browserLang as LocaleKey
  }
  return 'fr'
}

const i18n = createI18n({
  legacy: false,
  locale: detectLocale(),
  fallbackLocale: 'fr',
  messages,
})

export function setLocale(locale: LocaleKey) {
  i18n.global.locale.value = locale
  localStorage.setItem(STORAGE_KEY, locale)
}

export function getLocale(): LocaleKey {
  return i18n.global.locale.value as LocaleKey
}

export { SUPPORTED }
export { i18n }
export default i18n
