import DefaultTheme from 'vitepress/theme'
import HomeLayout from './HomeLayout.vue'
import HomeLayoutEn from './HomeLayoutEn.vue'
import './custom.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('HomeLayout', HomeLayout)
    app.component('HomeLayoutEn', HomeLayoutEn)
  },
}
