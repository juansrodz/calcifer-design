import type { Meta, StoryObj } from '@storybook/react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '../Button/Button';
import { createDataGridColumnHelper, type DataGridColumnDef } from './columns';
import { DataGrid } from './DataGrid';
import {
  createMockInventoryServer,
  filterableInventoryColumns,
  inventoryColumns,
  makeFileRows,
  makeInventoryRows,
  type FileRow,
  type InventoryRow,
} from './fixtures';
import { emptyDataGridQuery } from './query';
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

const filteringRows = makeInventoryRows(240);

export const Filtering: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'The filters button opens a filter under each filterable column. The footer counts the rows that match, and select-all selects only them.',
      },
    },
  },
  render: () => (
    <DataGrid<InventoryRow>
      gridId="inventory-filtering-story"
      heading="Inventory with filters"
      rows={filteringRows}
      columns={filterableInventoryColumns}
      getRowId={(row) => row.id}
      selectionMode="multiple"
      maxHeight="25rem"
    />
  ),
};

export const Search: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'The search button opens a search field; rows narrow 400ms after typing stops, or at once on Enter. `*` stands for any run of characters and `?` for one, so "hex*(2?)" finds the hex bolts of the twentieth to the twenty-fourth batch. Escape clears the field, and closes it once it is empty.',
      },
    },
  },
  render: () => (
    <DataGrid<InventoryRow>
      gridId="inventory-search-story"
      heading="Inventory with search"
      rows={filteringRows}
      columns={filterableInventoryColumns}
      getRowId={(row) => row.id}
      selectionMode="multiple"
      enableSearch
      maxHeight="25rem"
    />
  ),
};

export const ViewAllLink: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Shows how a "view all" link opens a filtered grid: the link sets the initial query, here items named "box" in two categories, sorted by quantity.',
      },
    },
  },
  render: () => (
    <DataGrid<InventoryRow>
      gridId="inventory-view-all-story"
      heading="Box items"
      rows={filteringRows}
      columns={filterableInventoryColumns}
      getRowId={(row) => row.id}
      maxHeight="25rem"
      initialQuery={{
        filters: { name: 'box', category: ['Packaging', 'Fasteners'] },
        sorting: [{ id: 'quantity', desc: false }],
      }}
    />
  ),
};

export const FilteredEmpty: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'When the filters match no row the grid says so, and its Clear filters button brings the rows back.',
      },
    },
  },
  render: () => (
    <DataGrid<InventoryRow>
      gridId="inventory-filtered-empty-story"
      heading="Inventory filtered to nothing"
      rows={filteringRows}
      columns={filterableInventoryColumns}
      getRowId={(row) => row.id}
      maxHeight="25rem"
      initialQuery={{ filters: { name: 'Anvil' } }}
    />
  ),
};

const serverPageSize = 50;

interface ServerModeGridProps {
  gridId: string;
  heading: string;
  columns?: DataGridColumnDef<InventoryRow, unknown>[];
  enableSearch?: boolean;
}

/** An app's side of server mode: it holds the loaded rows and answers the grid's two callbacks. */
function ServerModeGrid({
  gridId,
  heading,
  columns = inventoryColumns,
  enableSearch,
}: ServerModeGridProps) {
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
  const queryRef = useRef<DataGridQuery>(emptyDataGridQuery);
  // Pages the app has loaded for the current query, and which query that is: a response to an
  // earlier query is dropped.
  const nextPageRef = useRef(0);
  const queryNumberRef = useRef(0);

  const loadPage = async (page: number) => {
    const queryNumber = queryNumberRef.current;
    setLoadError(undefined);
    setLoadingMore(true);
    try {
      const result = await server.fetchPage({ page, query: queryRef.current });
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
    queryRef.current = query;
    queryNumberRef.current += 1;
    void loadPage(0);
  };

  return (
    <DataGrid<InventoryRow>
      gridId={gridId}
      heading={heading}
      rows={rows}
      columns={columns}
      getRowId={(row) => row.id}
      mode="server"
      enableSearch={enableSearch}
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
          'Rows come from a mock back end, fifty at a time, as the user scrolls. Sorting asks the server again, and the third page fails once to show the retry.',
      },
    },
  },
  render: () => <ServerModeGrid gridId="inventory-server-story" heading="Server inventory" />,
};

export const ServerFindingRows: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Server mode with filters: each change asks the mock back end for the first page of matching rows, and the footer counts every match.',
      },
    },
  },
  render: () => (
    <ServerModeGrid
      gridId="inventory-server-filters-story"
      heading="Server inventory with filters"
      columns={filterableInventoryColumns}
      enableSearch
    />
  ),
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
