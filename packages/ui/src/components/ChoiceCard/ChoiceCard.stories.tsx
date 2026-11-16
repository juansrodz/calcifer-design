import type { Meta, StoryObj } from '@storybook/react';
import type { ReactNode } from 'react';
import { fn } from 'storybook/test';
import { ChoiceCard, type ChoiceCardOption } from './ChoiceCard';

// Four decorative drawings for the cards' icon discs. The component sizes whatever `icon` holds
// through the disc's `> svg` rule, so each is a bare 16 viewBox SVG that takes its colour from the
// disc, as the library's own icons do.
function StoryIcon({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 16 16"
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
  );
}

const globe = (
  <StoryIcon>
    <circle cx="8" cy="8" r="6" />
    <path d="M2 8h12M8 2c2.2 2 2.2 10 0 12M8 2c-2.2 2-2.2 10 0 12" />
  </StoryIcon>
);
const people = (
  <StoryIcon>
    <circle cx="6" cy="5.5" r="2.25" />
    <path d="M2 13c0-2.2 1.8-3.75 4-3.75s4 1.55 4 3.75" />
    <path d="M10.5 3.5a2.25 2.25 0 0 1 0 4.25M12.5 9.5c1 .6 1.5 1.7 1.5 3.5" />
  </StoryIcon>
);
const personPlus = (
  <StoryIcon>
    <circle cx="6.5" cy="5" r="2.5" />
    <path d="M2 13.5c0-2.4 2-4 4.5-4s4.5 1.6 4.5 4M13 5v4M11 7h4" />
  </StoryIcon>
);
const lock = (
  <StoryIcon>
    <rect x="3" y="7" width="10" height="7" rx="1.5" />
    <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" />
  </StoryIcon>
);

const options: readonly ChoiceCardOption[] = [
  { value: 'open', label: 'Open to all', description: 'Anyone can join.', icon: globe },
  {
    value: 'friends',
    label: 'Friends only',
    description: 'Only your friends see it and can join.',
    icon: people,
  },
  {
    value: 'request',
    label: 'By request',
    description: 'You approve each request.',
    icon: personPlus,
  },
  {
    value: 'private',
    label: 'Private',
    description: 'Hidden. Guests need your invite link.',
    icon: lock,
  },
];

const meta = {
  title: 'Forms/ChoiceCard',
  component: ChoiceCard,
  args: { label: 'Who can join', name: 'audience', options, onValueChange: fn() },
  argTypes: { columns: { control: 'radio', options: [1, 2] } },
} satisfies Meta<typeof ChoiceCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Four cards with an icon, a title and a line each, none chosen. */
export const Default: Story = {};

export const Preselected: Story = { args: { defaultValue: 'friends' } };

/** One column, for a narrow container: the cards stack and keep their order. */
export const OneColumn: Story = { args: { columns: 1 } };

export const Required: Story = { args: { required: true } };

export const WithError: Story = {
  args: { required: true, error: 'Choose who can join.' },
};

/** The third card cannot be chosen, and the arrow keys step over it. */
export const DisabledOption: Story = {
  args: {
    defaultValue: 'friends',
    options: options.map((option) =>
      option.value === 'request' ? { ...option, disabled: true } : option,
    ),
  },
};

export const Dark: Story = { args: { defaultValue: 'open' }, globals: { theme: 'dark' } };
