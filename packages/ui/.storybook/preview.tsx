import type { Preview } from '@storybook/react';
import { useEffect } from 'react';
import '@calcifer-design/tokens/tokens.css';
import '../src/styles/base.css';
import './preview.css';
import { suppressTransitionsForAFrame } from '../src/utils/suppressTransitions';

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
        desktop: {
          name: 'Desktop 1280',
          styles: { width: '1280px', height: '800px' },
          type: 'desktop',
        },
      },
    },
  },
  decorators: [
    (Story, context) => {
      const theme = String(context.globals['theme'] ?? 'light');
      useEffect(() => {
        const root = document.documentElement;
        if (root.dataset['theme'] === theme) {
          return undefined;
        }
        root.dataset['theme'] = theme;
        // The page's root setter, so it lands as a scope's mode change does: no colour fades.
        return suppressTransitionsForAFrame(root);
      }, [theme]);
      return <Story />;
    },
  ],
};

export default preview;
