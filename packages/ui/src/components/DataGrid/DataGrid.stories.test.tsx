import { composeStories } from '@storybook/react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { axe } from '../../../test/axe';
import { installElementSize } from '../../../test/elementSize';
import * as stories from './DataGrid.stories';
import { makeInventoryRows } from './fixtures';

const composedStories = composeStories(stories);
const { FileList, ViewAllLink, FilteredEmpty, Search } = composedStories;

/** The text of one column's cell in each rendered body row, top to bottom. */
function textOfEachRow(columnName: string): string[] {
  const columnIndex = screen
    .getAllByRole('columnheader')
    .findIndex((header) => header.textContent === columnName);
  return screen
    .getAllByRole('row')
    .filter((row) => row.closest('tbody') !== null)
    .map((row) => within(row).queryAllByRole('gridcell')[columnIndex]?.textContent ?? '');
}

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
    const cell = screen.getByRole('gridcell', { name: 'Document 2.pdf' });
    await user.dblClick(cell);
    expect(screen.getByText('Opened Document 2.pdf.')).toBeInTheDocument();
    // The two clicks of a double click do not highlight the row and then clear it again.
    expect(cell.closest('tr')).toHaveAttribute('data-highlighted');

    // A slow second click, on its own, still clears it.
    await user.click(cell);
    expect(cell.closest('tr')).not.toHaveAttribute('data-highlighted');
  });

  it('the file list story opens a file from its action button', async () => {
    const user = userEvent.setup();
    render(<FileList />);
    await user.click(screen.getByRole('button', { name: 'Open Folder 1' }));
    expect(screen.getByText('Opened Folder 1.')).toBeInTheDocument();
  });

  it('the view all link story opens filtered and sorted', () => {
    render(<ViewAllLink />);
    const rows = makeInventoryRows(240);
    const presetCategories = ['Packaging', 'Fasteners'];
    const isBox = (name: string) => name.toLowerCase().includes('box');
    const boxRows = rows.filter((row) => isBox(row.name));
    const shownRows = boxRows.filter((row) => presetCategories.includes(row.category));
    // Both filters narrow the rows: the categories leave out some of the boxes, and the name some
    // of the rows in those categories. Each category the link names has rows among them.
    expect(shownRows.length).toBeLessThan(boxRows.length);
    expect(shownRows.length).toBeLessThan(
      rows.filter((row) => presetCategories.includes(row.category)).length,
    );
    expect(new Set(shownRows.map((row) => row.category))).toEqual(new Set(presetCategories));
    expect(screen.getByText(`${shownRows.length} of 240 rows`)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Filters, 2 active' })).toBeInTheDocument();
    expect(textOfEachRow('Name').every(isBox)).toBe(true);
    expect(new Set(textOfEachRow('Category'))).toEqual(new Set(presetCategories));
    expect(screen.getByRole('columnheader', { name: 'Quantity' })).toHaveAttribute(
      'aria-sort',
      'ascending',
    );
    const quantities = textOfEachRow('Quantity').map(Number);
    expect(quantities).toEqual([...quantities].sort((first, second) => first - second));
  });

  it('the search story finds rows with a wildcard', async () => {
    const user = userEvent.setup();
    const { container } = render(<Search />);
    await user.click(screen.getByRole('button', { name: 'Search' }));
    await user.keyboard('hex*(2?){Enter}');

    // `*` spans "bolt M6 " and `?` the batch's second digit; the brackets match themselves.
    expect(textOfEachRow('Name')).toEqual(
      ['20', '21', '22', '23', '24'].map((batch) => `Hex bolt M6 (${batch})`),
    );
    expect(screen.getByRole('button', { name: 'Filters, 1 active' })).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('the filtered-empty story clears its filters', async () => {
    const user = userEvent.setup();
    render(<FilteredEmpty />);
    expect(screen.getByRole('status')).toHaveTextContent('No rows match the search or filters.');

    await user.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
    expect(screen.getByRole('button', { name: 'Filters' })).toBeInTheDocument();
    expect(textOfEachRow('Name').length).toBeGreaterThan(0);
  });
});
