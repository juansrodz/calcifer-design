import { defineTheme, themeToCss } from '@calcifer-design/tokens';

/**
 * A neutral theme for the stories and tests that gives the six avatar colours six distinct fill
 * and ink pairs (blue, teal, amber, green, rose, slate). The library's own defaults make all six
 * the same neutral pair, so `colorSeed` only shows under a theme like this one. Every ink on its
 * fill passes `checkThemeContrast`, in both modes, and none is an app's brand. Excluded from the
 * dist (`rslib.config.ts`).
 */
export const avatarColorsTheme = defineTheme({
  className: 'theme-avatar-colors',
  light: {
    color: {
      avatarFill1: '#BFDBFE',
      avatarFill2: '#99F6E4',
      avatarFill3: '#FDE68A',
      avatarFill4: '#BBF7D0',
      avatarFill5: '#FECDD3',
      avatarFill6: '#CBD5E1',
      avatarInk1: '#1E3A8A',
      avatarInk2: '#134E4A',
      avatarInk3: '#78350F',
      avatarInk4: '#14532D',
      avatarInk5: '#881337',
      avatarInk6: '#1E293B',
    },
  },
  dark: {
    color: {
      avatarFill1: '#1E40AF',
      avatarFill2: '#0F766E',
      avatarFill3: '#92400E',
      avatarFill4: '#166534',
      avatarFill5: '#9F1239',
      avatarFill6: '#475569',
      avatarInk1: '#DBEAFE',
      avatarInk2: '#CCFBF1',
      avatarInk3: '#FEF3C7',
      avatarInk4: '#DCFCE7',
      avatarInk5: '#FFE4E6',
      avatarInk6: '#F1F5F9',
    },
  },
});

/** The scoped sheet for `avatarColorsTheme`, injected by the stories through a `<style>`. */
export const avatarColorsThemeCss = themeToCss(avatarColorsTheme);
