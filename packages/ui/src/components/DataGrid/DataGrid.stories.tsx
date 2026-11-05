import type { Meta, StoryObj } from '@storybook/react';
import type { SortingState } from '@tanstack/react-table';
import { useEffect, useRef, useState } from 'react';
import { Button } from '../Button/Button';
import { DataGrid } from './DataGrid';
import {
  createMockInventoryServer,
  inventoryColumns,
  makeInventoryRows,
  type InventoryRow,
} from './fixtures';
import type { DataGridQuery } from './types';

const meta = {
  title: 'Data/DataGrid',
  component: DataGrid,
  args: {
    gridId: 'inventory-story',
    heading: 'Inventory',
    rows: makeInventoryRows(10),
    columns: inventoryColumns,
    getRowId: (row: InventoryRow) => row.id,
  },
} satisfies Meta<typeof DataGrid<InventoryRow>>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {};

export const Compact: Story = {
  args: { heading: 'Compact inventory', density: 'compact' },
};

export const Loading: Story = {
  args: { heading: 'Loading inventory', rows: [], loading: true },
};

export const Empty: Story = {
  args: { heading: 'Empty inventory', rows: [] },
};

export const WithRefresh: Story = {
  args: {
    heading: 'Inventory with refresh',
    onRefresh: () => undefined,
    actions: <button type="button">Add item</button>,
  },
};

export const HighlightOnClick: Story = {
  args: { heading: 'Inventory with a highlighted row', highlightOnClick: true },
};

export const CheckboxSelection: Story = {
  args: {
    heading: 'Inventory with checkbox selection',
    selectionMode: 'multiple',
    defaultSelectedRowIds: ['item-2', 'item-3'],
  },
};

export const SelectionWithLockedRows: Story = {
  args: {
    heading: 'Out of stock items cannot be selected',
    selectionMode: 'multiple',
    highlightOnClick: true,
    isRowSelectable: (row) => (row as InventoryRow).status !== 'out',
  },
};

export const RowActions: Story = {
  args: {
    heading: 'Inventory with row actions',
    renderRowActions: (row) => (
      <Button size="sm" variant="ghost" aria-label={`Edit ${(row as InventoryRow).name}`}>
        Edit
      </Button>
    ),
  },
};

function InventoryDetails({ row }: { row: InventoryRow }) {
  return (
    <dl style={{ display: 'flex', gap: 'var(--space-6)', margin: 0 }}>
      <div>
        <dt>Location</dt>
        <dd style={{ margin: 0 }}>{row.location}</dd>
      </div>
      <div>
        <dt>Last updated</dt>
        <dd style={{ margin: 0 }}>{row.updated}</dd>
      </div>
    </dl>
  );
}

export const ExpandableRows: Story = {
  args: {
    heading: 'Inventory with details',
    selectionMode: 'multiple',
    defaultExpandedRowIds: ['item-2'],
    isRowExpandable: (row) => (row as InventoryRow).status !== 'out',
    renderExpandedRow: (row) => <InventoryDetails row={row as InventoryRow} />,
    renderRowActions: (row) => (
      <Button size="sm" variant="ghost" aria-label={`Edit ${(row as InventoryRow).name}`}>
        Edit
      </Button>
    ),
  },
};

const largeRows = makeInventoryRows(5000);

export const Large: Story = {
  args: { heading: 'Large inventory', rows: largeRows, maxHeight: '25rem' },
};

export const FillsItsParent: Story = {
  args: { heading: 'Fills its parent', rows: largeRows, fill: true },
  decorators: [
    (StoryComponent) => (
      <div style={{ height: '30rem' }}>
        <StoryComponent />
      </div>
    ),
  ],
};

const serverPageSize = 50;

/** An app's side of server mode: it holds the loaded rows and answers the grid's two callbacks. */
function ServerModeGrid() {
  const [server] = useState(() =>
    createMockInventoryServer({
      total: 240,
      pageSize: serverPageSize,
      delayMs: 150,
      failOnPage: 2,
    }),
  );
  const [rows, setRows] = useState<InventoryRow[]>([]);
  const [total, setTotal] = useState<number | undefined>(undefined);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<string | undefined>(undefined);
  const sortingRef = useRef<SortingState>([]);
  // Pages the app has loaded for the current query, and which query that is: a response to an
  // earlier query is dropped.
  const nextPageRef = useRef(0);
  const queryNumberRef = useRef(0);

  const loadPage = async (page: number) => {
    const queryNumber = queryNumberRef.current;
    setLoadError(undefined);
    setLoadingMore(true);
    try {
      const result = await server.fetchPage({ page, sorting: sortingRef.current });
      if (queryNumber !== queryNumberRef.current) return;
      setRows((loaded) => (page === 0 ? result.rows : [...loaded, ...result.rows]));
      setTotal(result.total);
      nextPageRef.current = page + 1;
    } catch {
      if (queryNumber !== queryNumberRef.current) return;
      setLoadError('Could not load rows');
    } finally {
      if (queryNumber === queryNumberRef.current) setLoadingMore(false);
    }
  };

  useEffect(() => {
    // The first page, once the story is on screen.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadPage(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleQueryChange = (query: DataGridQuery) => {
    sortingRef.current = query.sorting;
    queryNumberRef.current += 1;
    void loadPage(0);
  };

  return (
    <DataGrid<InventoryRow>
      gridId="inventory-server-story"
      heading="Server inventory"
      rows={rows}
      columns={inventoryColumns}
      getRowId={(row) => row.id}
      mode="server"
      maxHeight="25rem"
      loading={total === undefined && loadError === undefined}
      totalRowCount={total}
      hasMore={total === undefined || rows.length < total}
      loadingMore={loadingMore}
      loadError={loadError}
      onLoadMore={() => void loadPage(nextPageRef.current)}
      onQueryChange={handleQueryChange}
    />
  );
}

export const ServerMode: Story = {
  render: () => <ServerModeGrid />,
};
