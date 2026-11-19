import type { Meta, StoryObj } from '@storybook/react';
import type { ReactNode } from 'react';
import { expect, fn, within } from 'storybook/test';
import { ToggleChip } from './ToggleChip';
import styles from './ToggleChip.module.css';
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

/** The label's box and the check's, in the named chip, for the stories that check which side. */
function labelAndCheckBoxes(
  canvasElement: HTMLElement,
  chipName: string,
): { label: DOMRect; check: DOMRect } {
  const chipElement = within(canvasElement).getByRole('button', { name: chipName });
  // By the check's own class: a chip's icon is an `svg` too.
  const checkElement = chipElement.querySelector(`.${styles.check ?? 'check'}`);
  const labelNode = Array.from(chipElement.childNodes).find(
    (node) => node.nodeType === Node.TEXT_NODE,
  );
  if (!checkElement || !labelNode) throw new Error('the chip has no check or no label');
  const labelRange = document.createRange();
  labelRange.selectNodeContents(labelNode);
  return { label: labelRange.getBoundingClientRect(), check: checkElement.getBoundingClientRect() };
}

/**
 * `size="sm"`, the WBW mock's chip: the 12 px type, 28 px tall with no icon and 36 px with the
 * 26 px disc, against md's 32 and 42 px in the 14 px type. Both are past the 24 px target.
 */
export const Small: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
      <ToggleChipGroup
        selectionMode="single"
        label="Dish type"
        options={dishOptions}
        defaultValue="main"
        size="sm"
        onValueChange={fn()}
      />
      <ToggleChipGroup
        selectionMode="multiple"
        label="Dietary needs"
        options={dietaryOptions}
        defaultValue={['vegan', 'gluten-free']}
        size="sm"
        onValueChange={fn()}
      />
    </div>
  ),
  // Runs in a browser only (jsdom lays nothing out): the two heights are the mock's.
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('button', { name: 'Side' }).offsetHeight).toBe(36);
    await expect(canvas.getByRole('button', { name: 'Spicy' }).offsetHeight).toBe(28);
  },
};

/**
 * `checkPosition="start"` draws a pressed chip's check before its label, as the WBW mock does
 * (4e, 10g), here on the small chip the mock draws. The default, `end`, draws it after.
 */
export const CheckAtStart: Story = {
  render: () => (
    <ToggleChipGroup
      selectionMode="multiple"
      label="Dietary needs"
      options={dietaryOptions}
      defaultValue={['vegetarian', 'dairy-free']}
      size="sm"
      checkPosition="start"
      onValueChange={fn()}
    />
  ),
  // Runs in a browser only: the check is left of the label.
  play: async ({ canvasElement }) => {
    const { label, check } = labelAndCheckBoxes(canvasElement, 'Vegetarian');
    await expect(check.right).toBeLessThanOrEqual(label.left);
  },
};

/**
 * The start is the reading start, so in a right-to-left page the check is right of the label. The
 * chip's padding and the icon's inset are logical, so nothing else turns round by hand.
 */
export const CheckAtStartRightToLeft: Story = {
  ...CheckAtStart,
  decorators: [
    (Story) => (
      <div dir="rtl">
        <Story />
      </div>
    ),
  ],
  // Runs in a browser only: the check is right of the label.
  play: async ({ canvasElement }) => {
    const { label, check } = labelAndCheckBoxes(canvasElement, 'Vegetarian');
    await expect(check.left).toBeGreaterThanOrEqual(label.right);
  },
};

/**
 * `--toggle-chip-font-size` sets the label's size from a wrapper. Here the outer wrapper stands in
 * for an app whose type scale sets `--text-xs` to 10 px (WBW's), which a `sm` chip reads; the two
 * inner wrappers set the hook instead, to the mock's 12.5 px category chips and 12 px dietary
 * chips. The hook wins over the token, so no global token is re-scoped for the chips' sake.
 */
export const FontSizeViaHook: Story = {
  render: () => (
    <>
      <style>{`.chip-type-category { --toggle-chip-font-size: 0.78125rem; }
.chip-type-dietary { --toggle-chip-font-size: 0.75rem; }
.chip-type-scale { --text-xs: 0.625rem; }`}</style>
      <div className="chip-type-scale" style={{ display: 'grid', gap: 'var(--space-4)' }}>
        <div className="chip-type-category">
          <ToggleChipGroup
            selectionMode="single"
            label="Dish type"
            options={dishOptions}
            defaultValue="main"
            size="sm"
            onValueChange={fn()}
          />
        </div>
        <div className="chip-type-dietary">
          <ToggleChipGroup
            selectionMode="multiple"
            label="Dietary needs"
            options={dietaryOptions}
            defaultValue={['vegan', 'gluten-free']}
            size="sm"
            checkPosition="start"
            onValueChange={fn()}
          />
        </div>
      </div>
    </>
  ),
  // Runs in a browser only (jsdom loads no CSS): each group's chips are the hook's size, not the
  // re-scoped token's 10 px, and the sm heights are the mock's still.
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const side = canvas.getByRole('button', { name: 'Side' });
    const spicy = canvas.getByRole('button', { name: 'Spicy' });
    await expect(getComputedStyle(side).fontSize).toBe('12.5px');
    await expect(getComputedStyle(spicy).fontSize).toBe('12px');
    await expect(side.offsetHeight).toBe(36);
    await expect(spicy.offsetHeight).toBe(28);
  },
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
