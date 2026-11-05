import { composeStories } from '@storybook/react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { axe } from '../../../test/axe';
import { installElementSize } from '../../../test/elementSize';
import * as stories from './DataGrid.stories';

const composedStories = composeStories(stories);
const { FileList } = composedStories;

let restoreElementSize: () => void;

beforeEach(() => {
  restoreElementSize = installElementSize({ viewportHeight: 400, rowHeight: 40 });
});

afterEach(() => {
  restoreElementSize();
});

describe('DataGrid stories', () => {
  it.each(Object.entries(composedStories))('%s has no axe violations', async (_name, Story) => {
    const { container } = render(<Story />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('the file list story opens a file on double click', async () => {
    const user = userEvent.setup();
    render(<FileList />);
    expect(screen.getByText('Nothing opened yet.')).toBeInTheDocument();
    await user.dblClick(screen.getByRole('gridcell', { name: 'Document 2.pdf' }));
    expect(screen.getByText('Opened Document 2.pdf.')).toBeInTheDocument();
  });

  it('the file list story opens a file from its action button', async () => {
    const user = userEvent.setup();
    render(<FileList />);
    await user.click(screen.getByRole('button', { name: 'Open Folder 1' }));
    expect(screen.getByText('Opened Folder 1.')).toBeInTheDocument();
  });
});
