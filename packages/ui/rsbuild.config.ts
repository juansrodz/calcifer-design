import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginTypedCSSModules } from '@rsbuild/plugin-typed-css-modules';

export default defineConfig({
  plugins: [pluginReact(), pluginTypedCSSModules()],
  output: { cssModules: { localIdentName: '[local]-[hash:base64:5]' } },
});
