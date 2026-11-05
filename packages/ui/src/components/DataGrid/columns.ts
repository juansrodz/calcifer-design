import {
  createColumnHelper as createTanStackColumnHelper,
  createSortedRowModel,
  rowExpandingFeature,
  rowSelectionFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_datetime,
  sortFn_text,
  tableFeatures,
  type AccessorFn,
  type AccessorFnColumnDef,
  type AccessorKeyColumnDef,
  type ColumnDef as TanStackColumnDef,
  type DeepKeys,
  type DeepValue,
  type DisplayColumnDef,
  type IdentifiedColumnDef,
  type RowData,
} from '@tanstack/react-table';

// The grid's TanStack v9 feature set. The three sortFns are the ones `DataTable` registers:
// the default `sortFn: 'auto'` resolves to one of them by inspecting the column's values, and
// without them it falls back to a raw `<`/`>` compare that sorts "Item 10" before "Item 2".
// Selection and expansion are registered now so their props can be filled in without
// changing the column types consumers have already built.
export const dataGridFeatures = tableFeatures({
  rowSortingFeature,
  rowSelectionFeature,
  rowExpandingFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns: { alphanumeric: sortFn_alphanumeric, text: sortFn_text, datetime: sortFn_datetime },
});

export interface TextValueOption<Row extends RowData> {
  /** Plain text for a cell: the row label, compact-density titles, and later search and export. */
  textValue?: (row: Row) => string;
}

export type DataGridColumnDef<Row extends RowData, Value = unknown> = TanStackColumnDef<
  typeof dataGridFeatures,
  Row,
  Value
> &
  TextValueOption<Row>;

type Features = typeof dataGridFeatures;

export interface DataGridColumnHelper<Row extends RowData> {
  accessor: <
    Accessor extends AccessorFn<Row> | DeepKeys<Row>,
    Value extends (Accessor extends AccessorFn<Row, infer Returned>
      ? Returned
      : Accessor extends DeepKeys<Row>
        ? DeepValue<Row, Accessor>
        : never),
  >(
    accessor: Accessor,
    column: (Accessor extends AccessorFn<Row>
      ? DisplayColumnDef<Features, Row, Value>
      : IdentifiedColumnDef<Features, Row, Value>) &
      TextValueOption<Row>,
  ) => (Accessor extends AccessorFn<Row>
    ? AccessorFnColumnDef<Features, Row, Value>
    : AccessorKeyColumnDef<Features, Row, Value>) &
    TextValueOption<Row>;
  /**
   * Wrap the array in this, not a plain literal: it keeps each column's own value type. The
   * `any` is TanStack's own signature for the same helper.
   */
  /* eslint-disable @typescript-eslint/no-explicit-any */
  columns: <Columns extends ReadonlyArray<DataGridColumnDef<Row, any>>>(
    columns: [...Columns],
  ) => Array<DataGridColumnDef<Row, any>> & [...Columns];
  /* eslint-enable @typescript-eslint/no-explicit-any */
  display: (
    column: DisplayColumnDef<Features, Row> & TextValueOption<Row>,
  ) => DisplayColumnDef<Features, Row, unknown> & TextValueOption<Row>;
}

/**
 * The TanStack v9 column helper, typed to the grid's feature set, with one extra column option:
 * `textValue`. At runtime TanStack's helper only returns the definition objects it is given, so
 * the extra option passes straight through.
 */
export function createDataGridColumnHelper<Row extends RowData>(): DataGridColumnHelper<Row> {
  return createTanStackColumnHelper<Features, Row>() as unknown as DataGridColumnHelper<Row>;
}

function isText(value: unknown): value is string | number | boolean {
  return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean';
}

function valueAtPath(source: unknown, path: string): unknown {
  let current = source;
  for (const segment of path.split('.')) {
    if (current === null || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[segment];
  }
  return current;
}

/**
 * The plain text a column gives for a row: its `textValue` when it has one, else the accessor
 * value when that is a string, number or boolean. Anything else has no text.
 */
export function textValueOf<Row extends RowData, Value = unknown>(
  column: DataGridColumnDef<Row, Value>,
  row: Row,
): string | undefined {
  if (column.textValue) return column.textValue(row);
  let value: unknown;
  if ('accessorFn' in column && typeof column.accessorFn === 'function') {
    value = column.accessorFn(row, 0);
  } else if ('accessorKey' in column && typeof column.accessorKey === 'string') {
    // A plain key is read as-is first, as TanStack does, so keys that contain a dot still work.
    value =
      (row as Record<string, unknown>)[column.accessorKey] ?? valueAtPath(row, column.accessorKey);
  } else {
    return undefined;
  }
  return isText(value) ? String(value) : undefined;
}
