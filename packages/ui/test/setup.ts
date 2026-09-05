import 'vitest-axe/extend-expect';
import '@testing-library/jest-dom/vitest';
import { beforeAll } from 'vitest';
import { setProjectAnnotations } from '@storybook/react';
import * as previewAnnotations from '../.storybook/preview';

const annotations = setProjectAnnotations([previewAnnotations]);
beforeAll(annotations.beforeAll);
