import { defineConfig, presetUno, presetIcons } from 'unocss'

export default defineConfig({
  presets: [
    presetUno(),
    presetIcons({
      extraProperties: {
        'display': 'inline-block',
        'vertical-align': 'middle',
      },
    }),
  ],
  theme: {
    colors: {
      primary: '#1abc9c',
      'primary-dark': '#12836d',
      success: '#2ecc71',
      'success-hover': '#27ae60',
      warning: '#e74c3c',
    },
  },
  rules: [],
  shortcuts: {},
  safelist: [],
})
