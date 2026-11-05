import type { Meta, StoryObj } from '@storybook/react';
import type { SortingState } from '@tanstack/react-table';
import { useEffect, useRef, useState } from 'react';
import { Button } from '../Button/Button';
import { createDataGridColumnHelper } from './columns';
import { DataGrid } from './DataGrid';
import {
  createMockInventoryServer,
  inventoryColumns,
  makeFileRows,
  makeInventoryRows,
  type FileRow,
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

export const Basic: Story = {
  parameters: {
    docs: {
      description: {
        story: 'A client-mode grid: click a header to sort, and arrow keys move between cells.',
      },
    },
  },
};

export const Compact: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Compact density packs more rows into the same height and puts a title on cells that may be cut off.',
      },
    },
  },
  args: { heading: 'Compact inventory', density: 'compact' },
};

export const Loading: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'While rows are on their way the grid shows skeleton rows and announces that it is loading.',
      },
    },
  },
  args: { heading: 'Loading inventory', rows: [], loading: true },
};

export const Empty: Story = {
  parameters: {
    docs: { description: { story: 'With no rows the grid says so, and announces it.' } },
  },
  args: { heading: 'Empty inventory', rows: [] },
};

export const WithRefresh: Story = {
  parameters: {
    docs: {
      description: {
        story: 'A toolbar with a refresh button and an app-supplied action beside it.',
      },
    },
  },
  args: {
    heading: 'Inventory with refresh',
    onRefresh: () => undefined,
    actions: <button type="button">Add item</button>,
  },
};

export const HighlightOnClick: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Click a row, or press Enter on it, to highlight it; do it again to clear the highlight.',
      },
    },
  },
  args: { heading: 'Inventory with a highlighted row', highlightOnClick: true },
};

export const Selection: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Checkboxes select rows. Shift and click selects a range, and the header checkbox selects every row.',
      },
    },
  },
  args: {
    heading: 'Inventory with checkbox selection',
    selectionMode: 'multiple',
    defaultSelectedRowIds: ['item-2', 'item-3'],
  },
};

export const SelectionWithLockedRows: Story = {
  parameters: {
    docs: {
      description: {
        story: 'A row the app rules out cannot be selected, and select-all skips it.',
      },
    },
  },
  args: {
    heading: 'Out of stock items cannot be selected',
    selectionMode: 'multiple',
    highlightOnClick: true,
    isRowSelectable: (row) => (row as InventoryRow).status !== 'out',
  },
};

export const RowActions: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'A trailing column of controls for each row, kept in view when the grid scrolls sideways.',
      },
    },
  },
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

export const Expandable: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Rows with a toggle open a detail panel beneath them, here beside selection and row actions.',
      },
    },
  },
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
  parameters: {
    docs: {
      description: {
        story:
          'Five thousand rows in a scrolling body that only renders the rows in view; the header stays put.',
      },
    },
  },
  args: { heading: 'Large inventory', rows: largeRows, maxHeight: '25rem' },
};

export const FillsItsParent: Story = {
  parameters: {
    docs: {
      description: {
        story: 'With fill set the grid takes the height of its parent instead of a maximum height.',
      },
    },
  },
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
  parameters: {
    docs: {
      description: {
        story:
          'Rows come from a mock back end, fifty at a time, as the user scrolls. Sorting asks the server again, and the second page fails once to show the retry.',
      },
    },
  },
  render: () => <ServerModeGrid />,
};

const fileColumnHelper = createDataGridColumnHelper<FileRow>();

const fileColumns = fileColumnHelper.columns([
  fileColumnHelper.accessor('name', { header: 'Name' }),
  fileColumnHelper.accessor('kind', { header: 'Kind' }),
  fileColumnHelper.accessor('size', {
    header: 'Size',
    cell: (context) =>
      context.row.original.kind === 'folder'
        ? '—'
        : `${Math.round(context.getValue() / 1024).toLocaleString('en-US')} KB`,
    textValue: (row) => (row.kind === 'folder' ? '' : String(row.size)),
  }),
  fileColumnHelper.accessor('modified', { header: 'Modified' }),
]);

const fileRows = makeFileRows(40);

/** A file list: double click a row, or use its Open button, to open it. */
function FileListGrid() {
  const [opened, setOpened] = useState<string | undefined>(undefined);
  return (
    <div>
      <DataGrid<FileRow>
        gridId="file-list-story"
        heading="Files"
        rows={fileRows}
        columns={fileColumns}
        getRowId={(row) => row.id}
        maxHeight="25rem"
        highlightOnClick
        onRowDoubleClick={(row) => setOpened(row.name)}
        renderRowActions={(row) => (
          <Button
            size="sm"
            variant="ghost"
            aria-label={`Open ${row.name}`}
            onClick={() => setOpened(row.name)}
          >
            Open
          </Button>
        )}
      />
      <p role="status">{opened === undefined ? 'Nothing opened yet.' : `Opened ${opened}.`}</p>
    </div>
  );
}

export const FileList: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Files and folders: click to highlight a row, double click to open it, or use its Open button.',
      },
    },
  },
  render: () => <FileListGrid />,
};
