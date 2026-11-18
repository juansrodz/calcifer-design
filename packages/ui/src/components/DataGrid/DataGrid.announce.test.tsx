import { act, fireEvent, render, screen } from '@testing-library/react';
import { useEffect, useRef, useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { installElementSize } from '../../../test/elementSize';
import { emulateScrollTo, scrollGridTo } from '../../../test/gridScroll';
import { DataGrid } from './DataGrid';
import {
  createMockInventoryServer,
  filterableInventoryColumns,
  makeInventoryRows,
  type InventoryPage,
  type InventoryRow,
} from './fixtures';
import { defaultDataGridLabels } from './labels';
import { createQueryMatcher, emptyDataGridQuery } from './query';
import type { DataGridQuery } from './types';

// The grid announces how many rows a changed search or filter finds, once the change has settled:
// this long after the last change, and in server mode after the new query's rows have arrived.
const announceDelay = 500;
const searchDelay = 400;
const textFilterDelay = 300;
const rowTotal = 40;
const serverTotal = 240;
const serverPageSize = 50;
// How long the mock server takes to answer a query, unless a test says otherwise.
const answerDelay = 100;

type GridProps = React.ComponentProps<typeof DataGrid<InventoryRow>>;

function gridElement(overrides: Partial<GridProps> = {}) {
  return (
    <DataGrid<InventoryRow>
      gridId="announcing-grid"
      heading="Inventory"
      rows={makeInventoryRows(rowTotal)}
      columns={filterableInventoryColumns}
      getRowId={(row) => row.id}
      enableSearch
      {...overrides}
    />
  );
}

/** How many of `total` fixture rows the query matches. */
function countMatching(query: Partial<DataGridQuery>, total = rowTotal): number {
  const matcher = createQueryMatcher(filterableInventoryColumns, {
    ...emptyDataGridQuery,
    ...query,
  });
  const rows = makeInventoryRows(total);
  return matcher ? rows.filter(matcher).length : rows.length;
}

/**
 * What the grid's live region says over a test, in order: each text it changes to, the empty ones
 * left out. A text heard twice in a row was cleared in between, so it was announced twice. The
 * clock moves in small steps, and the region is read after each, so no announcement slips by.
 */
function listenToRegion() {
  const heard: string[] = [];
  let lastText = '';
  const listen = () => {
    const text = screen.getByRole('status').textContent ?? '';
    if (text !== lastText && text !== '') heard.push(text);
    lastText = text;
  };
  const advance = async (durationMs: number) => {
    const stepMs = 10;
    for (let elapsedMs = 0; elapsedMs < durationMs; elapsedMs += stepMs) {
      await act(() => vi.advanceTimersByTimeAsync(Math.min(stepMs, durationMs - elapsedMs)));
      listen();
    }
  };
  listen();
  return { heard, listen, advance };
}

/** A click on a button, with focus moved to it first as a pointer's press moves it. */
function clickButton(button: HTMLElement) {
  act(() => button.focus());
  fireEvent.click(button);
}

function openSearch() {
  clickButton(screen.getByRole('button', { name: 'Search' }));
}

function openFilters() {
  clickButton(screen.getByRole('button', { name: 'Filters' }));
}

function searchField(): HTMLElement {
  return screen.getByRole('searchbox', { name: 'Search rows' });
}

/** Commits a search at once, with Enter. */
function commitSearch(value: string) {
  fireEvent.change(searchField(), { target: { value } });
  fireEvent.keyDown(searchField(), { key: 'Enter' });
}

/** Commits a text filter in the strip at once, with Enter. */
function commitTextFilter(columnName: string, value: string) {
  const field = screen.getByRole('searchbox', { name: `Filter by ${columnName}` });
  act(() => field.focus());
  fireEvent.change(field, { target: { value } });
  fireEvent.keyDown(field, { key: 'Enter' });
}

let restoreElementSize: () => void;

beforeEach(() => {
  vi.useFakeTimers();
  restoreElementSize = installElementSize({ viewportHeight: 400, rowHeight: 40 });
});

afterEach(() => {
  restoreElementSize();
  vi.useRealTimers();
});

describe('the result count label', () => {
  it('counts rows found, and says when more are still to load', () => {
    expect(defaultDataGridLabels.resultCount(1, false)).toBe('1 row found');
    expect(defaultDataGridLabels.resultCount(1200, false)).toBe('1,200 rows found');
    expect(defaultDataGridLabels.resultCount(50, true)).toBe('More than 50 rows found');
  });
});

describe('announcing results in client mode', () => {
  it('says nothing on the first render', async () => {
    render(gridElement({ initialQuery: { search: 'washer' } }));
    const region = listenToRegion();

    await region.advance(announceDelay * 4);

    expect(region.heard).toEqual([]);
  });

  it('announces the count once the search has settled', async () => {
    render(gridElement());
    const region = listenToRegion();
    openSearch();

    fireEvent.change(searchField(), { target: { value: 'washer' } });
    await region.advance(searchDelay + announceDelay - 10);
    expect(region.heard).toEqual([]);

    await region.advance(10);
    expect(region.heard).toEqual([`${countMatching({ search: 'washer' })} rows found`]);
  });

  it('announces once after a burst of typing', async () => {
    render(gridElement());
    const region = listenToRegion();
    openSearch();

    // Each pause is long enough for the search to commit, and too short for an announcement.
    for (const term of ['h', 'he', 'hex', 'hex b']) {
      fireEvent.change(searchField(), { target: { value: term } });
      await region.advance(searchDelay + 50);
    }
    expect(region.heard).toEqual([]);
    await region.advance(announceDelay * 4);

    expect(region.heard).toEqual([`${countMatching({ search: 'hex b' })} rows found`]);
  });

  it('announces a search committed with Enter', async () => {
    render(gridElement());
    const region = listenToRegion();
    openSearch();

    commitSearch('bolt');
    region.listen();
    await region.advance(announceDelay);

    expect(region.heard).toEqual([`${countMatching({ search: 'bolt' })} rows found`]);
  });

  it('announces a column filter from the strip', async () => {
    render(gridElement());
    const region = listenToRegion();
    openFilters();
    const locationFilter = screen.getByRole('searchbox', { name: 'Filter by Location' });
    act(() => locationFilter.focus());

    fireEvent.change(locationFilter, { target: { value: 'B-07' } });
    await region.advance(textFilterDelay + announceDelay);

    const locationCount = countMatching({ filters: { location: 'B-07' } });
    expect(locationCount).toBeLessThan(rowTotal);
    expect(region.heard).toEqual([`${locationCount} rows found`]);
  });

  it('announces a change of match mode', async () => {
    const filters = { status: 'in stock', location: 'A-01' };
    render(gridElement({ initialQuery: { filters } }));
    const region = listenToRegion();

    clickButton(screen.getByRole('button', { name: 'Any' }));
    await region.advance(announceDelay);

    const anyCount = countMatching({ filters, matchMode: 'any' });
    const allCount = countMatching({ filters });
    expect(allCount).toBeGreaterThan(0);
    expect(anyCount).not.toBe(allCount);
    expect(region.heard).toEqual([`${anyCount} rows found`]);
  });

  it('says nothing for a sort, before or after an announcement', async () => {
    render(gridElement());
    const region = listenToRegion();

    clickButton(screen.getByRole('columnheader', { name: 'Name' }));
    await region.advance(announceDelay * 2);
    expect(region.heard).toEqual([]);

    openSearch();
    commitSearch('bolt');
    await region.advance(announceDelay);
    const boltAnnouncement = `${countMatching({ search: 'bolt' })} rows found`;
    expect(region.heard).toEqual([boltAnnouncement]);

    clickButton(screen.getByRole('columnheader', { name: 'Quantity' }));
    await region.advance(announceDelay * 2);
    // The region keeps its text, so nothing is spoken again.
    expect(region.heard).toEqual([boltAnnouncement]);
    expect(screen.getByRole('status')).toHaveTextContent(boltAnnouncement);
  });

  it('announces the same count again for a new search', async () => {
    render(gridElement());
    const region = listenToRegion();
    openSearch();
    const washerCount = countMatching({ search: 'washer' });
    expect(countMatching({ search: 'wash' })).toBe(washerCount);

    for (const term of ['washer', 'wash']) {
      commitSearch(term);
      await region.advance(announceDelay);
    }

    expect(region.heard).toEqual([`${washerCount} rows found`, `${washerCount} rows found`]);
  });

  it('leaves a search that finds nothing to the filtered-empty message', async () => {
    render(gridElement());
    const region = listenToRegion();
    openSearch();

    commitSearch('Anvil');
    region.listen();
    await region.advance(announceDelay * 2);
    expect(region.heard).toEqual(['No rows match the search or filters.']);

    clickButton(screen.getByRole('button', { name: 'Clear filters' }));
    region.listen();
    await region.advance(announceDelay);

    expect(region.heard).toEqual(['No rows match the search or filters.', '40 rows found']);
  });

  it('takes its words from labels', async () => {
    render(
      gridElement({
        labels: {
          resultCount: (count, moreToLoad) => `${count} filas${moreToLoad ? ' o más' : ''}`,
        },
      }),
    );
    const region = listenToRegion();
    openSearch();

    commitSearch('bolt');
    await region.advance(announceDelay);

    expect(region.heard).toEqual([`${countMatching({ search: 'bolt' })} filas`]);
  });

  it("announces a controlled query's change from the app's own controls", async () => {
    function TabsOverGrid() {
      const [query, setQuery] = useState<DataGridQuery>(emptyDataGridQuery);
      return (
        <>
          <button type="button" onClick={() => setQuery({ ...query, filters: { status: 'low' } })}>
            Low stock
          </button>
          {gridElement({ enableFilters: false, query, onQueryChange: setQuery })}
        </>
      );
    }
    render(<TabsOverGrid />);
    const region = listenToRegion();

    clickButton(screen.getByRole('button', { name: 'Low stock' }));
    await region.advance(announceDelay);

    expect(region.heard).toEqual([`${countMatching({ filters: { status: 'low' } })} rows found`]);
  });

  it('clears a count already announced when a state appears, so it is not spoken again', async () => {
    const { rerender } = render(gridElement());
    const region = listenToRegion();
    openSearch();
    commitSearch('bolt');
    await region.advance(announceDelay);
    const boltAnnouncement = `${countMatching({ search: 'bolt' })} rows found`;
    expect(region.heard).toEqual([boltAnnouncement]);

    // A refresh: the app shows the loading state, then the rows again under the same query.
    rerender(gridElement({ loading: true }));
    region.listen();
    rerender(gridElement());
    region.listen();
    await region.advance(announceDelay * 2);

    expect(region.heard).toEqual([boltAnnouncement, 'Loading rows…']);
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });

  it('says nothing when the app replaces the rows under the same query', async () => {
    const { rerender } = render(gridElement({ initialQuery: { search: 'bolt' } }));
    const region = listenToRegion();

    rerender(gridElement({ initialQuery: { search: 'bolt' }, rows: makeInventoryRows(30) }));
    await region.advance(announceDelay * 2);

    expect(region.heard).toEqual([]);
  });
});

interface ServerAppProps {
  /** How long the server takes to answer a query. */
  delayFor?: (query: DataGridQuery) => number;
  /** Whether the app passes the server's total on to the grid. */
  reportsTotal?: boolean;
  /** Whether the app sets `loading` while each new query's first page is on its way. */
  loadingWhileFetching?: boolean;
}

/**
 * An app's side of server mode. It sets whatever page the server sends last, for whichever query:
 * an app that does not drop late answers, so a test can see what the grid makes of a stale one.
 */
function ServerApp({
  delayFor = () => answerDelay,
  reportsTotal = true,
  loadingWhileFetching = false,
}: ServerAppProps) {
  const [page, setPage] = useState<InventoryPage | null>(null);
  const [fetching, setFetching] = useState(true);
  const queryRef = useRef(emptyDataGridQuery);
  const loadedPagesRef = useRef(0);

  const fetchPage = (pageIndex: number, query: DataGridQuery) =>
    createMockInventoryServer({
      total: serverTotal,
      pageSize: serverPageSize,
      delayMs: delayFor(query),
    }).fetchPage({ page: pageIndex, query });

  const fetchFirstPage = (query: DataGridQuery) =>
    fetchPage(0, query).then((result) => {
      loadedPagesRef.current = 1;
      setPage(result);
      setFetching(false);
    });

  useEffect(() => {
    void fetchFirstPage(emptyDataGridQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleQueryChange = (query: DataGridQuery) => {
    queryRef.current = query;
    setFetching(true);
    void fetchFirstPage(query);
  };

  const loadMore = () => {
    void fetchPage(loadedPagesRef.current, queryRef.current).then((result) => {
      loadedPagesRef.current += 1;
      setPage((current) => ({
        rows: [...(current?.rows ?? []), ...result.rows],
        total: result.total,
      }));
    });
  };

  return (
    <DataGrid<InventoryRow>
      gridId="announcing-server-grid"
      heading="Inventory"
      rows={page?.rows ?? []}
      columns={filterableInventoryColumns}
      getRowId={(row) => row.id}
      mode="server"
      loading={page === null || (loadingWhileFetching && fetching)}
      totalRowCount={reportsTotal ? page?.total : undefined}
      hasMore={page === null || page.rows.length < page.total}
      onLoadMore={loadMore}
      onQueryChange={handleQueryChange}
    />
  );
}

describe('announcing results in server mode', () => {
  it('says nothing as the first page loads', async () => {
    render(<ServerApp />);
    const region = listenToRegion();

    await region.advance(announceDelay * 4);

    expect(region.heard).toEqual(['Loading rows…']);
  });

  it("announces the total once the new query's rows arrive, not while it waits", async () => {
    const serverDelay = announceDelay * 2;
    render(<ServerApp delayFor={() => serverDelay} />);
    const region = listenToRegion();
    await region.advance(serverDelay);
    openFilters();

    commitTextFilter('Location', 'B-07');
    // The old rows stay on screen meanwhile, and they are not the answer.
    await region.advance(serverDelay - 10);
    expect(region.heard).toEqual(['Loading rows…']);

    await region.advance(10 + announceDelay);
    const locationCount = countMatching({ filters: { location: 'B-07' } }, serverTotal);
    expect(region.heard).toEqual(['Loading rows…', `${locationCount} rows found`]);
  });

  it('announces after the loading state the app shows for the new query', async () => {
    render(<ServerApp loadingWhileFetching />);
    const region = listenToRegion();
    await region.advance(answerDelay);
    openFilters();

    commitTextFilter('Location', 'B-07');
    region.listen();
    await region.advance(answerDelay + announceDelay);

    const locationCount = countMatching({ filters: { location: 'B-07' } }, serverTotal);
    expect(region.heard).toEqual(['Loading rows…', 'Loading rows…', `${locationCount} rows found`]);
  });

  it('says when more rows are still to load and the total is not known', async () => {
    render(<ServerApp reportsTotal={false} />);
    const region = listenToRegion();
    await region.advance(answerDelay);
    openFilters();

    commitTextFilter('Location', 'B-07');
    await region.advance(answerDelay + announceDelay);

    expect(countMatching({ filters: { location: 'B-07' } }, serverTotal)).toBeGreaterThan(
      serverPageSize,
    );
    expect(region.heard).toEqual(['Loading rows…', `More than ${serverPageSize} rows found`]);
  });

  it('says nothing for the pages that infinite scroll loads', async () => {
    render(<ServerApp />);
    const region = listenToRegion();
    await region.advance(answerDelay);
    emulateScrollTo();
    openFilters();
    commitTextFilter('Location', 'B-07');
    await region.advance(answerDelay + announceDelay);
    const locationAnnouncement = `${countMatching({ filters: { location: 'B-07' } }, serverTotal)} rows found`;
    expect(region.heard).toEqual(['Loading rows…', locationAnnouncement]);

    scrollGridTo(40 * serverPageSize);
    await region.advance(answerDelay + announceDelay * 2);

    expect(screen.getByText(/^Showing 100 of/)).toBeInTheDocument();
    expect(region.heard).toEqual(['Loading rows…', locationAnnouncement]);
  });

  it('says nothing for a sort, when the sorted rows arrive', async () => {
    render(<ServerApp />);
    const region = listenToRegion();
    await region.advance(answerDelay);

    clickButton(screen.getByRole('columnheader', { name: 'Name' }));
    await region.advance(answerDelay + announceDelay * 2);

    expect(region.heard).toEqual(['Loading rows…']);
  });

  it('announces the latest query once, and not the late answer to an earlier one', async () => {
    // B's answer is slow and C's fast, so B's lands after C's has been announced.
    const slowDelay = announceDelay * 4;
    const fastDelay = answerDelay;
    render(
      <ServerApp delayFor={(query) => (query.filters.name === 'bolt' ? slowDelay : fastDelay)} />,
    );
    const region = listenToRegion();
    await region.advance(fastDelay);
    openFilters();

    commitTextFilter('Name', 'bolt');
    await region.advance(50);
    commitTextFilter('Name', 'box');
    await region.advance(fastDelay + announceDelay);
    const latestAnnouncement = `${countMatching({ filters: { name: 'box' } }, serverTotal)} rows found`;
    expect(region.heard).toEqual(['Loading rows…', latestAnnouncement]);

    // B's stale page replaces the rows, but no query changed, so nothing is said of it.
    await region.advance(slowDelay);
    expect(screen.getByText(/^Showing \d+ of/)).toHaveTextContent(
      `of ${countMatching({ filters: { name: 'bolt' } }, serverTotal)} rows`,
    );
    expect(region.heard).toEqual(['Loading rows…', latestAnnouncement]);
  });

  it('announces the latest count when an earlier answer lands just before it', async () => {
    // B's answer lands first and C's within the announcement delay after it.
    const earlierDelay = answerDelay;
    const latestDelay = earlierDelay + announceDelay / 2;
    render(
      <ServerApp
        delayFor={(query) => (query.filters.name === 'box' ? latestDelay : earlierDelay)}
      />,
    );
    const region = listenToRegion();
    await region.advance(earlierDelay);
    openFilters();

    commitTextFilter('Name', 'bolt');
    commitTextFilter('Name', 'box');
    await region.advance(latestDelay + announceDelay * 2);

    const latestCount = countMatching({ filters: { name: 'box' } }, serverTotal);
    expect(latestCount).not.toBe(countMatching({ filters: { name: 'bolt' } }, serverTotal));
    expect(region.heard).toEqual(['Loading rows…', `${latestCount} rows found`]);
  });
});
