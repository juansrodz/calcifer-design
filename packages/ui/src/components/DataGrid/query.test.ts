import { useTable } from '@tanstack/react-table';
import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { createDataGridColumnHelper, dataGridFeatures, type DataGridColumnDef } from './columns';
import { filterableInventoryColumns, makeInventoryRows, inventoryColumns } from './fixtures';
import {
  columnIdOf,
  columnNameOf,
  countActiveCriteria,
  createQueryMatcher,
  dataGridSearchPattern,
  emptyDataGridQuery,
  isSameQuery,
  normaliseQuery,
} from './query';
import type { DataGridQuery } from './types';

function queryWith(overrides: Partial<DataGridQuery>): DataGridQuery {
  return { ...emptyDataGridQuery, ...overrides };
}

describe('columnIdOf', () => {
  interface OwnedRow {
    label: string;
    owner: { name: string };
  }
  const columnHelper = createDataGridColumnHelper<OwnedRow>();

  it('agrees with TanStack', () => {
    const columns = columnHelper.columns([
      columnHelper.accessor('label', { header: 'Label' }),
      columnHelper.accessor('label', { id: 'shout', header: 'Shout' }),
      columnHelper.accessor('owner.name', { header: 'Owner' }),
      columnHelper.accessor((row) => row.owner.name.length, {
        id: 'ownerNameLength',
        header: 'Owner name length',
      }),
      columnHelper.display({ header: 'Actions' }),
    ]);
    const { result } = renderHook(() =>
      useTable({ features: dataGridFeatures, data: [], columns }),
    );
    expect(columns.map(columnIdOf)).toEqual(
      result.current.getAllLeafColumns().map((column) => column.id),
    );
    // Guards against both sides agreeing on nothing.
    expect(columns.map(columnIdOf)).toEqual([
      'label',
      'shout',
      'owner_name',
      'ownerNameLength',
      'Actions',
    ]);
  });

  // TanStack's types ask for an id here; the cast stands for a definition written without one.
  const anonymousColumn = { header: () => 'Actions' } as unknown as DataGridColumnDef<OwnedRow>;

  it('is undefined for a column with no id, key or string header', () => {
    expect(columnIdOf(anonymousColumn)).toBeUndefined();
  });

  it('names a column by its string header, else by its id', () => {
    expect(columnNameOf(columnHelper.accessor('label', { header: 'The label' }))).toBe('The label');
    expect(columnNameOf(columnHelper.accessor('owner.name', { header: () => 'Owner' }))).toBe(
      'owner_name',
    );
    expect(columnNameOf(columnHelper.display({ id: 'actions', header: () => 'Actions' }))).toBe(
      'actions',
    );
    expect(columnNameOf(anonymousColumn)).toBe('');
  });
});

describe('dataGridSearchPattern', () => {
  it('reads ? as one character and * as any run, in any case', () => {
    expect(dataGridSearchPattern('ab?d')?.test('xabcdx')).toBe(true);
    expect(dataGridSearchPattern('ab?d')?.test('xabd')).toBe(false);
    expect(dataGridSearchPattern('AB*D')?.test('ab---d')).toBe(true);
    expect(dataGridSearchPattern('AB*D')?.test('abd')).toBe(true);
  });

  it('reads every other character literally', () => {
    const pattern = dataGridSearchPattern('a.b');
    expect(pattern?.test('axb')).toBe(false);
    expect(pattern?.test('a.b')).toBe(true);
  });

  it.each(['(x', '[abc', ')', '[1]', 'c:\\temp', 'abc\\', '50%+', 'a|b', '^$', '{2}'])(
    'matches %s as its own text without throwing',
    (term) => {
      expect(dataGridSearchPattern(term)?.test(`before ${term} after`)).toBe(true);
    },
  );

  it('keeps * a wildcard after a literal backslash', () => {
    expect(dataGridSearchPattern('x\\*')?.test('x\\anything')).toBe(true);
    expect(dataGridSearchPattern('x\\*')?.test('xanything')).toBe(false);
  });

  it('keeps the segments in order and reads each one the same wherever it falls', () => {
    expect(dataGridSearchPattern('a*b')?.test('xaQQbx')).toBe(true);
    expect(dataGridSearchPattern('a*b')?.test('a\nb')).toBe(true);
    expect(dataGridSearchPattern('a*b*c')?.test('abc')).toBe(true);
    expect(dataGridSearchPattern('a*b*c')?.test('a-b-c')).toBe(true);
    expect(dataGridSearchPattern('a*b*c')?.test('acb')).toBe(false);
    // The earliest place for a segment must not hide a later one that would also fit.
    expect(dataGridSearchPattern('a*ab')?.test('aab')).toBe(true);
    expect(dataGridSearchPattern('a*b*b')?.test('abb')).toBe(true);
    expect(dataGridSearchPattern('a*b*b')?.test('ab')).toBe(false);
  });

  it('reads ? as one character, even a new line or a code point of two units', () => {
    expect(dataGridSearchPattern('a?b')?.test('a😀b')).toBe(true);
    expect(dataGridSearchPattern('a?b')?.test('a\nb')).toBe(true);
    expect(dataGridSearchPattern('a?b')?.test('a😀😀b')).toBe(false);
    expect(dataGridSearchPattern('a?b')?.test('ab')).toBe(false);
  });

  it('matches every text, the empty one too, when the term is only stars', () => {
    for (const term of ['*', '**', '***', ' * ']) {
      const pattern = dataGridSearchPattern(term);
      expect(pattern).not.toBeNull();
      expect(pattern?.test('')).toBe(true);
      expect(pattern?.test('anything at all')).toBe(true);
    }
  });

  it('ignores stars at either end of the term, which is unanchored anyway', () => {
    expect(dataGridSearchPattern('*ab*')?.test('xxabxx')).toBe(true);
    expect(dataGridSearchPattern('*ab*')?.test('ba')).toBe(false);
    expect(dataGridSearchPattern('**a**b**')?.test('a-b')).toBe(true);
  });

  it('reads escapes and stars together', () => {
    const pattern = dataGridSearchPattern('(x*[1]');
    expect(pattern?.test('(x and [1]')).toBe(true);
    expect(pattern?.test('(x and 1')).toBe(false);
    expect(pattern?.test('[1] then (x')).toBe(false);
  });

  // Each of these once took between half a second and a minute, and a search runs on every
  // keystroke. The text is chosen so that the term cannot match, the slowest case.
  it.each([
    { term: `${'*'.repeat(10)}x`, text: 'Cable tie 200 mm (3)' },
    { term: `a${'*'.repeat(12)}b`, text: 'a'.repeat(40) },
    { term: `${'a*'.repeat(10)}b`, text: 'a'.repeat(40) },
  ])('answers quickly for $term against $text', ({ term, text }) => {
    const started = performance.now();
    const matched = dataGridSearchPattern(term)?.test(text);
    expect(performance.now() - started).toBeLessThan(50);
    expect(matched).toBe(false);
  });

  it('does not match other text when the term holds RegExp syntax', () => {
    expect(dataGridSearchPattern('a|b')?.test('a')).toBe(false);
    expect(dataGridSearchPattern('[1]')?.test('1')).toBe(false);
  });

  it('trims the term and gives null for an empty one', () => {
    expect(dataGridSearchPattern('   ')).toBeNull();
    expect(dataGridSearchPattern('')).toBeNull();
    expect(dataGridSearchPattern(' ab ')?.test('xab')).toBe(true);
  });
});

describe('normaliseQuery', () => {
  const columns = filterableInventoryColumns;

  it('gives the empty query for no query', () => {
    expect(normaliseQuery(undefined, columns)).toEqual(emptyDataGridQuery);
    expect(normaliseQuery({}, columns)).toEqual(emptyDataGridQuery);
  });

  it('does not hand out the shared empty query to be changed', () => {
    const first = normaliseQuery(undefined, columns);
    first.sorting.push({ id: 'name', desc: false });
    first.filters.name = 'bolt';
    expect(emptyDataGridQuery).toEqual({ sorting: [], filters: {}, matchMode: 'all', search: '' });
    expect(normaliseQuery(undefined, columns)).toEqual(emptyDataGridQuery);
  });

  it('trims the search', () => {
    expect(normaliseQuery({ search: '  bolt ' }, columns).search).toBe('bolt');
    expect(normaliseQuery({ search: '   ' }, columns).search).toBe('');
  });

  it('keeps filters that can apply, trimming their text', () => {
    expect(
      normaliseQuery(
        {
          filters: {
            name: ' bolt ',
            status: ' low ',
            category: ['Tools', 'Safety'],
          },
        },
        columns,
      ).filters,
    ).toEqual({ name: 'bolt', status: 'low', category: ['Tools', 'Safety'] });
  });

  it('keeps a select value even when it is not one of the options', () => {
    expect(normaliseQuery({ filters: { status: 'gone' } }, columns).filters).toEqual({
      status: 'gone',
    });
  });

  it('drops filters for an unknown column or a column without a filter', () => {
    expect(
      normaliseQuery({ filters: { nothing: 'x', sku: 'SKU-1000', quantity: ['1'] } }, columns)
        .filters,
    ).toEqual({});
  });

  it('drops filters whose value has the wrong shape or is empty', () => {
    expect(
      normaliseQuery(
        {
          filters: {
            name: ['a'],
            location: '  ',
            category: 'Tools',
            status: ['low'],
          },
        },
        columns,
      ).filters,
    ).toEqual({});
    expect(normaliseQuery({ filters: { category: [] } }, columns).filters).toEqual({});
    expect(
      normaliseQuery({ filters: { category: ['Tools', 3] as unknown as string[] } }, columns)
        .filters,
    ).toEqual({});
  });

  it('copies a multi-select array rather than sharing it', () => {
    const categories = ['Tools'];
    const { filters } = normaliseQuery({ filters: { category: categories } }, columns);
    expect(filters.category).toEqual(['Tools']);
    expect(filters.category).not.toBe(categories);
  });

  it('passes the sorting and the match mode through', () => {
    const sorting = [{ id: 'name', desc: true }];
    const normalised = normaliseQuery({ sorting, matchMode: 'any' }, columns);
    expect(normalised.sorting).toEqual(sorting);
    expect(normalised.matchMode).toBe('any');
  });

  it('finds a column by the id TanStack gives it', () => {
    const columnHelper = createDataGridColumnHelper<{ owner: { name: string } }>();
    const ownerColumns = columnHelper.columns([
      columnHelper.accessor('owner.name', { header: 'Owner', filter: { type: 'text' } }),
    ]);
    expect(normaliseQuery({ filters: { owner_name: 'ada' } }, ownerColumns).filters).toEqual({
      owner_name: 'ada',
    });
    expect(normaliseQuery({ filters: { 'owner.name': 'ada' } }, ownerColumns).filters).toEqual({});
  });
});

describe('countActiveCriteria', () => {
  it('counts each filter and a search', () => {
    expect(
      countActiveCriteria(
        queryWith({ filters: { name: 'bolt', category: ['Tools'] }, search: 'x' }),
      ),
    ).toBe(3);
  });

  it('counts a filter without a search, and a search without filters', () => {
    expect(countActiveCriteria(queryWith({ filters: { name: 'bolt' } }))).toBe(1);
    expect(countActiveCriteria(queryWith({ search: 'x' }))).toBe(1);
  });

  it('counts nothing for the empty query', () => {
    expect(countActiveCriteria(emptyDataGridQuery)).toBe(0);
  });
});

describe('isSameQuery', () => {
  function build(): DataGridQuery {
    return {
      sorting: [{ id: 'name', desc: false }],
      filters: { name: 'bolt', category: ['Tools', 'Safety'] },
      matchMode: 'all',
      search: 'sku',
    };
  }

  it('is true for queries built separately with equal contents', () => {
    expect(isSameQuery(build(), build())).toBe(true);
    expect(isSameQuery(emptyDataGridQuery, queryWith({}))).toBe(true);
  });

  it('ignores the order of the filters, and of the values of a multi-select', () => {
    const reordered: DataGridQuery = {
      ...build(),
      filters: { category: ['Tools', 'Safety'], name: 'bolt' },
    };
    expect(isSameQuery(build(), reordered)).toBe(true);
    // A multi-select's values combine with OR, so their order means nothing.
    const reversed: DataGridQuery = {
      ...build(),
      filters: { name: 'bolt', category: ['Safety', 'Tools'] },
    };
    expect(isSameQuery(build(), reversed)).toBe(true);
    expect(
      isSameQuery(
        { ...build(), filters: { category: ['a', 'b'] } },
        { ...build(), filters: { category: ['b', 'a'] } },
      ),
    ).toBe(true);
    expect(
      isSameQuery(
        { ...build(), filters: { category: ['a', 'b'] } },
        { ...build(), filters: { category: ['a', 'c'] } },
      ),
    ).toBe(false);
  });

  it('leaves the arrays it compares in their own order', () => {
    const first: DataGridQuery = { ...build(), filters: { category: ['Tools', 'Safety'] } };
    const second: DataGridQuery = { ...build(), filters: { category: ['Safety', 'Tools'] } };
    isSameQuery(first, second);
    expect(first.filters.category).toEqual(['Tools', 'Safety']);
    expect(second.filters.category).toEqual(['Safety', 'Tools']);
  });

  it('is false when one filter array differs in one item or in length', () => {
    expect(
      isSameQuery(build(), { ...build(), filters: { name: 'bolt', category: ['Tools', 'Tools'] } }),
    ).toBe(false);
    expect(
      isSameQuery(build(), { ...build(), filters: { name: 'bolt', category: ['Tools'] } }),
    ).toBe(false);
  });

  it('is false when a filter differs in text, in kind or in column', () => {
    expect(
      isSameQuery(build(), { ...build(), filters: { name: 'nut', category: ['Tools', 'Safety'] } }),
    ).toBe(false);
    expect(
      isSameQuery(
        { ...build(), filters: { name: 'bolt' } },
        { ...build(), filters: { name: ['bolt'] } },
      ),
    ).toBe(false);
    expect(
      isSameQuery(
        { ...build(), filters: { name: 'bolt' } },
        { ...build(), filters: { location: 'bolt' } },
      ),
    ).toBe(false);
  });

  it('is false when the sort direction, the sort column, the mode or the search differs', () => {
    expect(isSameQuery(build(), { ...build(), sorting: [{ id: 'name', desc: true }] })).toBe(false);
    expect(isSameQuery(build(), { ...build(), sorting: [{ id: 'sku', desc: false }] })).toBe(false);
    expect(isSameQuery(build(), { ...build(), sorting: [] })).toBe(false);
    expect(isSameQuery(build(), { ...build(), matchMode: 'any' })).toBe(false);
    expect(isSameQuery(build(), { ...build(), search: 'name' })).toBe(false);
  });
});

describe('createQueryMatcher', () => {
  const rows = makeInventoryRows(40);
  const columns = filterableInventoryColumns;
  // The rows "sku-100?" finds: SKU-1000 to SKU-1009.
  const skuRows = rows.filter((row) => /^SKU-100\d$/.test(row.sku));

  function matching(query: DataGridQuery) {
    const matcher = createQueryMatcher(columns, query);
    if (!matcher) throw new Error('Expected a matcher');
    return rows.filter(matcher);
  }

  it('gives null for the empty query', () => {
    expect(createQueryMatcher(columns, emptyDataGridQuery)).toBeNull();
    // Sorting alone is not matching.
    expect(
      createQueryMatcher(columns, queryWith({ sorting: [{ id: 'name', desc: true }] })),
    ).toBeNull();
  });

  it('matches a text filter by containing it, in any case', () => {
    const expected = rows.filter((row) => row.name.toLowerCase().includes('bolt'));
    expect(expected.length).toBeGreaterThan(0);
    expect(matching(queryWith({ filters: { name: 'BOLT' } }))).toEqual(expected);
  });

  it('does not read a text filter as a pattern', () => {
    expect(matching(queryWith({ filters: { name: 'hex*' } }))).toEqual([]);
  });

  it('matches a select filter by equality', () => {
    const expected = rows.filter((row) => row.status === 'low');
    expect(expected.length).toBeGreaterThan(0);
    expect(matching(queryWith({ filters: { status: 'low' } }))).toEqual(expected);
    // "out" is not "low" and a part of a value is not the value.
    expect(matching(queryWith({ filters: { status: 'in' } }))).toEqual([]);
  });

  it('matches a multi-select filter by any of its values', () => {
    const expected = rows.filter((row) => ['Tools', 'Safety'].includes(row.category));
    expect(expected.length).toBeGreaterThan(0);
    expect(expected.length).toBeLessThan(rows.length);
    expect(matching(queryWith({ filters: { category: ['Tools', 'Safety'] } }))).toEqual(expected);
  });

  it('combines filters with "all" or "any"', () => {
    const filters = { name: 'bolt', status: 'low' };
    const hasBolt = (name: string) => name.toLowerCase().includes('bolt');
    const both = rows.filter((row) => hasBolt(row.name) && row.status === 'low');
    const either = rows.filter((row) => hasBolt(row.name) || row.status === 'low');
    expect(both.length).toBeGreaterThan(0);
    expect(either.length).toBeGreaterThan(both.length);
    expect(matching(queryWith({ filters, matchMode: 'all' }))).toEqual(both);
    expect(matching(queryWith({ filters, matchMode: 'any' }))).toEqual(either);
  });

  it('searches only the searchable columns', () => {
    // Only the Updated column holds a date, and it opts out of search.
    expect(matching(queryWith({ search: '2026-10' }))).toEqual([]);
    const searchEverything = createQueryMatcher(inventoryColumns, queryWith({ search: '2026-10' }));
    expect(rows.filter((row) => searchEverything?.(row))).toEqual(rows);
  });

  it('searches with wildcards, unanchored and in any case', () => {
    expect(skuRows.length).toBeGreaterThan(0);
    expect(skuRows.length).toBeLessThan(rows.length);
    expect(matching(queryWith({ search: 'sku-100?' }))).toEqual(skuRows);
    const hexRows = rows.filter((row) => row.name.startsWith('Hex bolt M6'));
    expect(hexRows.length).toBeGreaterThan(0);
    expect(matching(queryWith({ search: ' HEX*M6 ' }))).toEqual(hexRows);
  });

  it('combines the search and the filters with AND, whatever the match mode', () => {
    const hasBolt = (name: string) => name.toLowerCase().includes('bolt');
    const skuRowIds = new Set(skuRows.map((row) => row.id));
    const expected = rows.filter(
      (row) => (hasBolt(row.name) || row.status === 'out') && skuRowIds.has(row.id),
    );
    expect(expected.length).toBeGreaterThan(0);
    expect(
      matching(
        queryWith({
          filters: { name: 'bolt', status: 'out' },
          matchMode: 'any',
          search: 'sku-100?',
        }),
      ),
    ).toEqual(expected);
  });

  it('searches alone in either match mode', () => {
    expect(matching(queryWith({ search: 'sku-100?', matchMode: 'any' }))).toEqual(skuRows);
    expect(matching(queryWith({ search: 'sku-100?', matchMode: 'all' }))).toEqual(skuRows);
  });

  it('ignores a filter on a column that is not there or has no filter', () => {
    expect(
      createQueryMatcher(columns, queryWith({ filters: { nothing: 'x', sku: 'x' } })),
    ).toBeNull();
  });

  describe('for a column with no text', () => {
    interface TaggedRow {
      id: string;
      tags: string[];
      title: string;
    }
    const columnHelper = createDataGridColumnHelper<TaggedRow>();
    const taggedColumns = columnHelper.columns([
      columnHelper.accessor((row) => row.tags, {
        id: 'tags',
        header: 'Tags',
        filter: { type: 'text' },
      }),
      columnHelper.accessor('title', { header: 'Title', searchable: false }),
    ]);
    const taggedRows: TaggedRow[] = [{ id: 'one', tags: ['a'], title: 'a' }];

    it('never matches that column’s filter', () => {
      const matcher = createQueryMatcher(taggedColumns, queryWith({ filters: { tags: 'a' } }));
      expect(taggedRows.filter((row) => matcher?.(row))).toEqual([]);
    });

    it('is never matched by a search', () => {
      const matcher = createQueryMatcher(taggedColumns, queryWith({ search: '*' }));
      expect(taggedRows.filter((row) => matcher?.(row))).toEqual([]);
    });
  });
});

describe('emptyDataGridQuery', () => {
  // Shared by every grid that starts empty, so nothing may change it in place.
  it('is frozen, its sorting and filters too', () => {
    expect(Object.isFrozen(emptyDataGridQuery)).toBe(true);
    expect(Object.isFrozen(emptyDataGridQuery.sorting)).toBe(true);
    expect(Object.isFrozen(emptyDataGridQuery.filters)).toBe(true);
  });
});
