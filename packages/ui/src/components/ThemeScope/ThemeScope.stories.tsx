import type { Meta, StoryObj } from '@storybook/react';
import { useEffect } from 'react';
import { Button } from '../Button/Button';
import { Card } from '../Card/Card';
import { Dialog } from '../Dialog/Dialog';
import { Menu } from '../Menu/Menu';
import { Tag } from '../Tag/Tag';
import { ToastRegion, createToastManager } from '../ToastRegion/ToastRegion';
import { demoTheme, demoThemeCss } from './fixtures';
import { ThemeScope } from './ThemeScope';

// Created outside React, as a host creates its own: it outlives every render of the story.
const storyToastManager = createToastManager();

const meta = {
  title: 'Layout/ThemeScope',
  component: ThemeScope,
  // The stories close over `demoTheme` (an arg copy would drop its brand), so controls are inert.
  parameters: { controls: { disable: true } },
  // The generated sheet on the page, as a consumer's build puts it there: proves `defineTheme` and
  // `themeToCss` end to end. The theme itself is closed over by each story rather than passed as
  // an arg, so Storybook's arg mapping never copies it and drops the brand.
  decorators: [
    (Story) => (
      <>
        <style>{demoThemeCss}</style>
        <Story />
      </>
    ),
  ],
} satisfies Meta<typeof ThemeScope>;

export default meta;
type Story = StoryObj;

function DemoCard() {
  return (
    <Card
      heading="Potluck on Saturday"
      headingAside={<Tag tone="accent">Open</Tag>}
      footer={<Button size="sm">Bring something</Button>}
    >
      <p style={{ background: 'var(--demo-halo)' }}>
        The halo behind this line is the theme’s own custom colour, <code>--demo-halo</code>.
      </p>
    </Card>
  );
}

export const Default: Story = {
  render: () => (
    <ThemeScope theme={demoTheme}>
      <DemoCard />
    </ThemeScope>
  ),
};

/** Dark whatever the page's mode: `data-theme` on the wrapper beats `<html>`'s. */
export const PinnedDark: Story = {
  render: () => (
    <ThemeScope theme={demoTheme} mode="dark">
      <DemoCard />
    </ThemeScope>
  ),
};

/** An inner scope pinned light inside an unpinned one; its dialog portals to the inner host. */
export const Nested: Story = {
  render: () => (
    <ThemeScope theme={demoTheme}>
      <DemoCard />
      <ThemeScope theme={demoTheme} mode="light">
        <Dialog heading="Inner dialog" defaultOpen>
          <p>Rendered in the inner scope’s portal host.</p>
        </Dialog>
      </ThemeScope>
    </ThemeScope>
  ),
};

function RaiseToastOnMount() {
  useEffect(() => {
    // A fixed id updates the same toast on a remount instead of stacking another.
    storyToastManager.add({
      id: 'portals-stay-inside',
      title: 'Remote removed',
      timeout: 0,
    });
  }, []);
  return null;
}

/** A dialog, a menu and a toast, all open inside the scope and all portalled to its host. */
export const PortalsStayInside: Story = {
  render: () => (
    <ThemeScope theme={demoTheme}>
      <Menu
        trigger={<Button variant="secondary">Remote actions</Button>}
        items={[
          { id: 'reload', label: 'Reload manifest', onSelect: () => undefined },
          { id: 'open', label: 'Open standalone', onSelect: () => undefined },
        ]}
        defaultOpen
      />
      <Dialog heading="Remove the remote?" defaultOpen>
        <p>It disappears from the registry; the deployment itself is untouched.</p>
      </Dialog>
      <ToastRegion manager={storyToastManager} />
      <RaiseToastOnMount />
    </ThemeScope>
  ),
};

/**
 * A scope inside a box that is a containing block for fixed descendants (`transform`), the way a
 * remote sits in a host app's frame: a drawer docked to the end edge and a bottom sheet behind a
 * trigger. Both overlays are fixed-position, so each is meant to follow the box rather than the
 * window; judge that in a real browser. The open drawer is modal, so close it before using "Open the
 * sheet". The box is a story-only wrapper, so its inline style sits outside the library's token
 * rules.
 */
export const EmbeddedInABox: Story = {
  render: () => (
    <div
      style={{
        position: 'relative',
        height: '80dvh',
        minHeight: 560,
        overflow: 'hidden',
        transform: 'translateZ(0)',
      }}
    >
      <ThemeScope theme={demoTheme}>
        <Dialog variant="sheet" side="end" defaultOpen heading="Drawer">
          <p>A full-height panel, as tall as the box rather than the window.</p>
        </Dialog>
        <Dialog
          variant="sheet"
          side="bottom"
          heading="Sheet"
          trigger={<Button>Open the sheet</Button>}
        >
          <p>A bottom sheet, docked to the box’s lower edge.</p>
        </Dialog>
      </ThemeScope>
    </div>
  ),
};
