import { composeStories } from '@storybook/react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { axe } from '../../../test/axe';
import { installMatchMedia } from '../../../test/matchMedia';
import { createColumnHelper, DataTable } from './DataTable';
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

interface VersionedRemoteRow {
  name: string;
  version: string;
}

const versionedRemoteColumnHelper = createColumnHelper<VersionedRemoteRow>();
const versionedRemoteColumns = versionedRemoteColumnHelper.columns([
  versionedRemoteColumnHelper.accessor('name', { header: 'Name' }),
  versionedRemoteColumnHelper.accessor('version', { header: 'Version' }),
]);
// Deliberately mixed-case names and multi-digit version segments: a naive raw
// `<`/`>` compare (the unregistered-sortFn fallback) sorts "Banana" before "apple"
// and "0.10.0" before "0.2.0"; the registered alphanumeric/text sortFns must not.
const versionedRemoteRows: VersionedRemoteRow[] = [
  { name: 'cherry', version: '0.9.0' },
  { name: 'apple', version: '0.10.0' },
  { name: 'Banana', version: '0.2.0' },
];

function bodyColumnValues(columnIndex: number): (string | null)[] {
  return screen
    .getAllByRole('row')
    .slice(1)
    .map((row) => within(row).getAllByRole('cell')[columnIndex]?.textContent ?? null);
}

describe('DataTable sortFn registration', () => {
  it('sorts mixed-case names in case-insensitive natural order with no dev warning', async () => {
    installMatchMedia(true);
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    render(
      <DataTable
        caption="Versioned remotes"
        columns={versionedRemoteColumns}
        data={versionedRemoteRows}
        getRowId={(row) => row.name}
      />,
    );

    const nameHeader = screen.getByRole('columnheader', { name: 'Name' });
    await userEvent.click(within(nameHeader).getByRole('button'));
    expect(bodyColumnValues(0)).toEqual(['apple', 'Banana', 'cherry']);

    expect(warnSpy).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('sorts multi-digit version segments in natural order with no dev warning', async () => {
    installMatchMedia(true);
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    render(
      <DataTable
        caption="Versioned remotes"
        columns={versionedRemoteColumns}
        data={versionedRemoteRows}
        getRowId={(row) => row.name}
      />,
    );

    const versionHeader = screen.getByRole('columnheader', { name: 'Version' });
    await userEvent.click(within(versionHeader).getByRole('button'));
    expect(bodyColumnValues(1)).toEqual(['0.2.0', '0.9.0', '0.10.0']);

    expect(warnSpy).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});
