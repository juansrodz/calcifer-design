import type { Meta, StoryObj } from '@storybook/react';
import type { ReactNode } from 'react';
import { fn } from 'storybook/test';
import { ToggleChip } from './ToggleChip';
import { ToggleChipGroup, type ToggleChipOption } from './ToggleChipGroup';

// Five decorative drawings for the single group's icon discs. The component rounds and sizes
// whatever `icon` holds (its `> *` rule), so each is a disc of its own that carries a bare 16
// viewBox SVG, taking its colour from the chip as the library's own icons do.
function StoryIcon({ children }: { children: ReactNode }) {
  return (
    <span
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--color-surface-raised)',
        color: 'var(--color-text)',
      }}
    >
      <svg
        viewBox="0 0 16 16"
        width="14"
        height="14"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        focusable="false"
      >
        {children}
      </svg>
    </span>
  );
}

const dishOptions: readonly ToggleChipOption[] = [
  {
    value: 'main',
    label: 'Main dish',
    icon: (
      <StoryIcon>
        <circle cx="8" cy="8" r="5.5" />
        <circle cx="8" cy="8" r="2.5" />
      </StoryIcon>
    ),
  },
  {
    value: 'side',
    label: 'Side',
    icon: (
      <StoryIcon>
        <path d="M2 7h12a6 6 0 0 1-12 0z" />
      </StoryIcon>
    ),
  },
  {
    value: 'dessert',
    label: 'Dessert',
    icon: (
      <StoryIcon>
        <path d="M4.5 8a3.5 3.5 0 1 1 7 0z" />
        <path d="m5 8.5 3 5.5 3-5.5" />
      </StoryIcon>
    ),
  },
  {
    value: 'drink',
    label: 'Drink',
    icon: (
      <StoryIcon>
        <path d="M4 3h8l-1 10H5z" />
      </StoryIcon>
    ),
  },
  {
    value: 'other',
    label: 'Other',
    icon: (
      <StoryIcon>
        <path d="M3 8h.01M8 8h.01M13 8h.01" />
      </StoryIcon>
    ),
  },
];

// Eleven chips: more than a phone's row holds, so the row wraps.
const dietaryOptions: readonly ToggleChipOption[] = [
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'vegan', label: 'Vegan' },
  { value: 'gluten-free', label: 'Gluten-free' },
  { value: 'dairy-free', label: 'Dairy-free' },
  { value: 'nut-free', label: 'Nut-free' },
  { value: 'egg-free', label: 'Egg-free' },
  { value: 'shellfish-free', label: 'Shellfish-free' },
  { value: 'halal', label: 'Halal' },
  { value: 'kosher', label: 'Kosher' },
  { value: 'low-carb', label: 'Low-carb' },
  { value: 'spicy', label: 'Spicy' },
];

const meta = {
  title: 'Forms/ToggleChip',
  component: ToggleChip,
  args: { children: 'Vegetarian', onPressedChange: fn() },
} satisfies Meta<typeof ToggleChip>;

export default meta;
type Story = StoryObj<typeof meta>;

/** One chip on its own: a toggle button, `aria-pressed` false until it is pressed. */
export const Chip: Story = {};

export const ChipPressed: Story = { args: { defaultPressed: true } };

/** Choose one of five. An icon sits in a round disc at the chip's start. */
export const SingleGroup: Story = {
  render: () => (
    <ToggleChipGroup
      selectionMode="single"
      label="Dish type"
      options={dishOptions}
      defaultValue="main"
      onValueChange={fn()}
    />
  ),
};

/** Choose any of eleven. A pressed chip draws a check, and the row wraps on a phone. */
export const MultipleGroup: Story = {
  render: () => (
    <ToggleChipGroup
      selectionMode="multiple"
      label="Dietary needs"
      description="Tell the host what you cannot eat."
      options={dietaryOptions}
      defaultValue={['vegan', 'gluten-free']}
      onValueChange={fn()}
    />
  ),
};

/**
 * The hook an app sets to say more than a fill does: here a 2 px ring in the text colour round
 * every pressed chip. The wrapper's class stands in for the app's picker wrapper.
 */
export const PressedRing: Story = {
  render: () => (
    <>
      <style>{`.toggle-chip-ring-hook { --toggle-chip-pressed-ring: inset 0 0 0 var(--border-width-emphasis) var(--color-text); }`}</style>
      <div className="toggle-chip-ring-hook">
        <ToggleChipGroup
          selectionMode="single"
          label="Dish type"
          options={dishOptions}
          defaultValue="main"
          onValueChange={fn()}
        />
      </div>
    </>
  ),
};

export const Required: Story = {
  render: () => (
    <ToggleChipGroup
      selectionMode="single"
      label="Dish type"
      options={dishOptions}
      required
      onValueChange={fn()}
    />
  ),
};

export const WithError: Story = {
  render: () => (
    <ToggleChipGroup
      selectionMode="single"
      label="Dish type"
      options={dishOptions}
      required
      error="Choose a dish type."
      onValueChange={fn()}
    />
  ),
};

/** The fourth chip cannot be pressed, and the arrow keys step over it. */
export const DisabledOption: Story = {
  render: () => (
    <ToggleChipGroup
      selectionMode="single"
      label="Dish type"
      options={dishOptions.map((option) =>
        option.value === 'drink' ? { ...option, disabled: true } : option,
      )}
      defaultValue="main"
      onValueChange={fn()}
    />
  ),
};

export const Dark: Story = {
  render: () => (
    <ToggleChipGroup
      selectionMode="multiple"
      label="Dietary needs"
      options={dietaryOptions}
      defaultValue={['vegan', 'gluten-free']}
      onValueChange={fn()}
    />
  ),
  globals: { theme: 'dark' },
};
