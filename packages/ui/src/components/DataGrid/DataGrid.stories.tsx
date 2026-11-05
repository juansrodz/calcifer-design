import type { Meta, StoryObj } from '@storybook/react';
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
