import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { fn } from 'storybook/test';
import { Select } from '../Select/Select';
import { FilterBar, type FilterBarFilter } from './FilterBar';

const statuses = [
  { value: 'open', label: 'Open' },
  { value: 'closed', label: 'Closed' },
];

const filters: FilterBarFilter[] = [
  { id: 'status', label: 'Status: Open' },
  { id: 'owner', label: 'Owner: Ana' },
  { id: 'year', label: 'Year: 2026' },
];

const meta = {
  title: 'Data display/FilterBar',
  component: FilterBar,
  args: {
    searchValue: '',
    searchLabel: 'Search projects',
    onSearchChange: fn(),
    onRemoveFilter: fn(),
    onClearAll: fn(),
  },
} satisfies Meta<typeof FilterBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SearchOnly: Story = {};
export const WithFilters: Story = { args: { activeFilters: filters, resultCount: 12 } };
export const OneResult: Story = { args: { resultCount: 1 } };
export const WithControls: Story = {
  args: {
    activeFilters: filters.slice(0, 1),
    resultCount: 3,
    children: <Select label="Status" options={statuses} defaultValue="open" />,
  },
};
export const WithoutSearch: Story = {
  args: {
    searchValue: undefined,
    searchLabel: undefined,
    onSearchChange: undefined,
    activeFilters: filters,
  },
};
/** Long enough to prove that a phone's width wraps them rather than scrolling. */
export const ManyLongFilters: Story = {
  args: {
    resultCount: 1200,
    activeFilters: [
      ...filters,
      { id: 'long', label: 'Department: Research and development, northern region' },
      { id: 'word', label: 'File: an-exceptionally-long-file-name-with-no-spaces-at-all.tar.gz' },
    ],
    children: (
      <>
        <Select label="Status" options={statuses} />
        <Select label="Owner" options={statuses} />
      </>
    ),
  },
};

function WorkingBar() {
  const [search, setSearch] = useState('');
  const [active, setActive] = useState(filters);
  const count = active.length * 4 + (search === '' ? 0 : 1);
  return (
    <FilterBar
      searchValue={search}
      onSearchChange={setSearch}
      searchLabel="Search projects"
      activeFilters={active}
      onRemoveFilter={(id) => setActive(active.filter((filter) => filter.id !== id))}
      onClearAll={() => setActive([])}
      resultCount={count}
    >
      <Select label="Status" options={statuses} />
    </FilterBar>
  );
}
export const Working: Story = { render: () => <WorkingBar /> };

export const Dark: Story = {
  globals: { theme: 'dark' },
  args: { activeFilters: filters, resultCount: 12 },
};
