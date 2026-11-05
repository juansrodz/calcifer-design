import { createDataGridColumnHelper } from './columns';

export type InventoryStatus = 'in stock' | 'low' | 'out';

export interface InventoryRow {
  id: string;
  sku: string;
  name: string;
  category: string;
  location: string;
  quantity: number;
  status: InventoryStatus;
  updated: string;
}

const itemNames: [string, ...string[]] = [
  'Hex bolt M6',
  'Washer 8 mm',
  'Cable tie 200 mm',
  'Pallet wrap',
  'Safety gloves',
  'Box cutter',
  'Label roll',
  'Torque wrench',
  'Cardboard box S',
  'Hand truck',
];
const categories: [string, ...string[]] = ['Fasteners', 'Packaging', 'Safety', 'Tools'];
const locations: [string, ...string[]] = ['A-01', 'A-02', 'B-04', 'B-07', 'C-12', 'D-03'];
const statuses: [InventoryStatus, ...InventoryStatus[]] = ['in stock', 'in stock', 'low', 'out'];

function cycleThrough<Item>(items: readonly [Item, ...Item[]], index: number): Item {
  return items[index % items.length] ?? items[0];
}

// Deterministic: every field derives from the index, so a story and its test agree.
export function makeInventoryRows(count: number): InventoryRow[] {
  return Array.from({ length: count }, (_unused, index) => {
    const cycle = Math.floor(index / itemNames.length);
    const baseName = cycleThrough(itemNames, index);
    const status = cycleThrough(statuses, index);
    const day = (index % 28) + 1;
    return {
      id: `item-${index + 1}`,
      sku: `SKU-${String(1000 + index)}`,
      name: cycle === 0 ? baseName : `${baseName} (${cycle + 1})`,
      category: cycleThrough(categories, index),
      location: cycleThrough(locations, index * 3),
      quantity: status === 'out' ? 0 : ((index * 37) % 240) + 5,
      status,
      updated: `2026-10-${String(day).padStart(2, '0')}`,
    };
  });
}

export interface FileRow {
  id: string;
  name: string;
  kind: 'folder' | 'file';
  size: number;
  modified: string;
}

export function makeFileRows(count: number): FileRow[] {
  return Array.from({ length: count }, (_unused, index) => {
    const kind = index % 4 === 0 ? 'folder' : 'file';
    return {
      id: `entry-${index + 1}`,
      name: kind === 'folder' ? `Folder ${index + 1}` : `Document ${index + 1}.pdf`,
      kind,
      size: kind === 'folder' ? 0 : ((index * 53) % 900) * 1024 + 2048,
      modified: `2026-09-${String((index % 28) + 1).padStart(2, '0')}`,
    };
  });
}

const columnHelper = createDataGridColumnHelper<InventoryRow>();

export const inventoryColumns = columnHelper.columns([
  columnHelper.accessor('sku', { header: 'SKU' }),
  columnHelper.accessor('name', { header: 'Name' }),
  columnHelper.accessor('category', { header: 'Category' }),
  columnHelper.accessor('location', { header: 'Location' }),
  columnHelper.accessor('quantity', { header: 'Quantity' }),
  columnHelper.accessor('status', { header: 'Status' }),
  columnHelper.accessor('updated', { header: 'Updated' }),
]);
