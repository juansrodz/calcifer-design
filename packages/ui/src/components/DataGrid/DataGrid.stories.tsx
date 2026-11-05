import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '../Button/Button';
import { DataGrid } from './DataGrid';
import { inventoryColumns, makeInventoryRows, type InventoryRow } from './fixtures';

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
