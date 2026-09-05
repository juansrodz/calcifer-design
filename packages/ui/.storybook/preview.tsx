import type { Preview } from '@storybook/react';
import { useEffect } from 'react';
import '@portfolio/tokens/tokens.css';
import '../src/styles/base.css';

const preview: Preview = {
  globalTypes: {
    theme: {
      description: 'Colour theme',
      toolbar: { title: 'Theme', icon: 'mirror', items: ['light', 'dark'], dynamicTitle: true },
    },
  },
  initialGlobals: { theme: 'light' },
  parameters: {
    a11y: { test: 'error' },
    viewport: {
      options: {
        mobile: { name: 'Mobile 390', styles: { width: '390px', height: '844px' }, type: 'mobile' },
        desktop: { name: 'Desktop 1280', styles: { width: '1280px', height: '800px' }, type: 'desktop' },
      },
    },
  },
  decorators: [
    (Story, context) => {
      const theme = String(context.globals['theme'] ?? 'light');
      useEffect(() => {
        document.documentElement.dataset['theme'] = theme;
      }, [theme]);
      return <Story />;
    },
  ],
};

export default preview;
