import { defineTheme, themeToCss } from '@calcifer-design/tokens';

/**
 * A neutral theme for the stories and tests (L1-3): a green accent, a serif display face and one
 * custom family under `demo`. Every value passes `checkThemeContrast`, and none is an app's brand.
 * Excluded from the dist (`rslib.config.ts`).
 */
export const demoTheme = defineTheme({
  className: 'theme-demo',
  shared: {
    font: { display: 'Georgia, "Times New Roman", serif' },
    fontWeight: { display: '700' },
    radius: { control: '999px' },
  },
  light: {
    color: {
      surface1: '#F3F7F2',
      accent: '#1F7A3E',
      accentHover: '#165C2E',
      focus: '#1F7A3E',
      selected: '#1F7A3E',
      link: '#176536',
    },
  },
  dark: {
    color: {
      surface1: '#0C1410',
      accent: '#6FCF8E',
      accentHover: '#8ADBA5',
      focus: '#6FCF8E',
      selected: '#6FCF8E',
      link: '#8ADBA5',
    },
  },
  custom: { prefix: 'demo', light: { halo: '#FDE68A' }, dark: { halo: '#4A3A00' } },
});

/** The scoped sheet for `demoTheme`, injected by the stories through a `<style>`. */
export const demoThemeCss = themeToCss(demoTheme);
