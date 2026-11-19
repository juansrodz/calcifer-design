import type { Meta, StoryObj } from '@storybook/react';
import { useState, type ReactNode } from 'react';
import { expect, screen, userEvent, waitFor, within } from 'storybook/test';
import type { PaintCheck } from '../../../.storybook/paint-checks';
import { PortalContainerContext } from '../ThemeScope/PortalContainerContext';
import { NavMenu, defaultRenderLink } from './NavMenu';

const items = [
  { href: '/', label: 'Home' },
  { href: '/projects', label: 'Projects' },
  { href: '/about', label: 'About' },
  { href: '/under-the-hood', label: 'Under the hood' },
];

const meta = {
  title: 'Navigation/NavMenu',
  component: NavMenu,
  args: { items, currentPath: '/projects' },
} satisfies Meta<typeof NavMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Desktop: Story = { globals: { viewport: { value: 'desktop' } } };
export const Mobile: Story = { globals: { viewport: { value: 'mobile' } } };

/**
 * The sidebar form (`orientation="vertical"`): the links stack and each one spans the width of the
 * box the nav sits in, here a 15rem column. Desktop only; at mobile width the menu ignores it.
 */
export const Vertical: Story = {
  args: { orientation: 'vertical' },
  globals: { viewport: { value: 'desktop' } },
  decorators: [
    (Story) => (
      <div style={{ inlineSize: '15rem' }}>
        <Story />
      </div>
    ),
  ],
};

/** Tabs to the nav at desktop width and checks the first link lands there. */
export const FocusVisible: Story = {
  globals: { viewport: { value: 'desktop' } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.tab();
    await expect(canvas.getByRole('link', { name: 'Home' })).toHaveFocus();
  },
};

/**
 * Holds the menu's portal inside the story root, where the test runner's paint checks look; Base
 * UI would otherwise portal the popup to `<body>`. (`Menu.stories.tsx` has the same wrapper.)
 */
function PortalInStoryRoot({ children }: { children: ReactNode }) {
  const [host, setHost] = useState<HTMLDivElement | null>(null);
  return (
    <PortalContainerContext.Provider value={host}>
      {children}
      <div ref={setHost} />
    </PortalContainerContext.Provider>
  );
}

/** The badge `renderLink` puts in the highlighted item, which carries a shadow and an outline. */
const highlightedBadge = '[role="menuitem"][data-highlighted] [data-badge]';

/**
 * The menu at phone width with "About" highlighted and not focused, as a pointer leaves it. The
 * shell's `renderLink` adds a "New" badge drawn with a ring (a box shadow in the accent) and a
 * transparent outline, as a consumer's content might. Under forced colours the hovered item's fill
 * opts out of the browser's colours, which would bring the ring back in its theme colour and leave
 * the outline transparent; the item's content guard drops the shadow and draws the outline in the
 * item's `HighlightText`, as the browser does everywhere else. The paint checks pin both.
 */
export const MobileHighlightedWithBadge: Story = {
  globals: { viewport: { value: 'mobile' } },
  args: {
    renderLink: (item, props) =>
      item.href === '/about'
        ? defaultRenderLink(item, {
            ...props,
            children: (
              <>
                {props.children}{' '}
                <span
                  data-badge=""
                  style={{
                    boxShadow: '0 0 0 2px var(--color-accent)',
                    outline: '1px solid transparent',
                    borderRadius: 'var(--radius-full)',
                    paddingInline: 'var(--space-1)',
                  }}
                >
                  New
                </span>
              </>
            ),
          })
        : defaultRenderLink(item, props),
  },
  decorators: [
    (Story) => (
      <PortalInStoryRoot>
        <Story />
      </PortalInStoryRoot>
    ),
  ],
  parameters: {
    // Base UI's focus guards beside the open menu are `aria-hidden` and focusable, which axe
    // flags; nothing in this library renders them, so the rule is off while the menu is open, as
    // in `Menu.stories.tsx`'s open stories.
    a11y: { options: { rules: { 'aria-hidden-focus': { enabled: false } } } },
    paintChecks: [
      {
        target: highlightedBadge,
        interaction: 'press',
        forcedColors: true,
        expected: { outlineColor: 'HighlightText', boxShadow: 'none' },
      },
    ] satisfies readonly PaintCheck[],
  },
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Open menu' }));
    const about = await screen.findByRole('menuitem', { name: 'About New' });
    about.focus();
    await waitFor(() => expect(about).toHaveAttribute('data-highlighted'));
    about.blur();
    await waitFor(() => expect(about).not.toHaveFocus());
    await expect(about).toHaveAttribute('data-highlighted');
    await expect(document.querySelectorAll(highlightedBadge)).toHaveLength(1);
  },
};
