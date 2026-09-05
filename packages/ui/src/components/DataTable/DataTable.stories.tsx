import type { Meta, StoryObj } from '@storybook/react';
import { StatusDot, type RemoteStatus } from '../StatusDot/StatusDot';
import { DataTable, createColumnHelper } from './DataTable';

interface RemoteRow {
  name: string;
  routeBase: string;
  status: RemoteStatus;
  version: string;
}

const rows: RemoteRow[] = [
  { name: 'showcase', routeBase: '/projects/showcase', status: 'loaded', version: '0.1.0' },
  { name: 'meowmax', routeBase: '/projects/meowmax', status: 'registered', version: '1.4.2' },
  { name: 'whosbringingwhat', routeBase: '/projects/whosbringingwhat', status: 'failed', version: '2.0.0' },
];

const columnHelper = createColumnHelper<RemoteRow>();
// `columnHelper.columns([...])` (rather than a plain array literal) preserves each
// column's individual TValue type under TanStack Table v9's feature-based typing;
// see packages/ui/src/components/DataTable/DataTable.tsx for the v9 migration notes.
const columns = columnHelper.columns([
  columnHelper.accessor('name', { header: 'Name' }),
  columnHelper.accessor('routeBase', { header: 'Route', enableSorting: false }),
  columnHelper.accessor('status', {
    header: 'Status',
    cell: (context) => <StatusDot status={context.getValue()} label={context.row.original.name} />,
  }),
  columnHelper.accessor('version', { header: 'Version' }),
]);

const meta = {
  title: 'Data/DataTable',
  component: DataTable,
  args: { caption: 'Registered remotes', columns, data: rows, getRowId: (row: RemoteRow) => row.name },
} satisfies Meta<typeof DataTable<RemoteRow>>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Remotes: Story = {};
export const Stacked: Story = { args: { stackBelow: 'md' }, globals: { viewport: { value: 'mobile' } } };
