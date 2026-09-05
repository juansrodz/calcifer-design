import { composeStories } from '@storybook/react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { axe } from '../../../test/axe';
import { installMatchMedia } from '../../../test/matchMedia';
import * as stories from './DataTable.stories';

const { Remotes, Stacked } = composeStories(stories);

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('DataTable', () => {
  it('renders a captioned table with column headers', async () => {
    installMatchMedia(true);
    const { container } = render(<Remotes />);
    const table = screen.getByRole('table', { name: 'Registered remotes' });
    expect(within(table).getAllByRole('columnheader')).toHaveLength(4);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('sorts by a column when its header button is pressed and announces aria-sort', async () => {
    installMatchMedia(true);
    render(<Remotes />);
    const nameHeader = screen.getByRole('columnheader', { name: /Name/ });
    await userEvent.click(within(nameHeader).getByRole('button'));
    expect(nameHeader).toHaveAttribute('aria-sort', 'ascending');
    const firstCell = screen.getAllByRole('row')[1];
    expect(firstCell).toHaveTextContent('meowmax');
    await userEvent.click(within(nameHeader).getByRole('button'));
    expect(nameHeader).toHaveAttribute('aria-sort', 'descending');
    expect(screen.getAllByRole('row')[1]).toHaveTextContent('whosbringingwhat');
  });

  it('wraps the table in a focusable, labelled scroll region', () => {
    installMatchMedia(true);
    render(<Remotes />);
    const region = screen.getByRole('region', { name: 'Registered remotes' });
    expect(region).toHaveAttribute('tabindex', '0');
  });

  it('stacks rows below the breakpoint and labels each cell', async () => {
    installMatchMedia(false);
    const { container } = render(<Stacked />);
    const table = screen.getByRole('table');
    expect(table).toHaveAttribute('data-stacked', '');
    const cells = within(table).getAllByRole('cell');
    expect(cells[0]).toHaveAttribute('data-label', 'Name');
    expect(await axe(container)).toHaveNoViolations();
  });
});
