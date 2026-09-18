import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '../Button/Button';
import { ToastRegion, createToastManager } from './ToastRegion';

// One manager for the stories, created outside React exactly as a host creates its own: it has
// to outlive every render of the component that shows it.
const storyManager = createToastManager();

const meta = {
  title: 'Overlays/ToastRegion',
  component: ToastRegion,
  args: { manager: storyManager },
  parameters: {
    a11y: {
      // Base UI marks the close control `aria-hidden` while the stack is collapsed and
      // unfocused, and it stays focusable — deliberate, and it trips axe's `aria-hidden-focus`
      // in a real browser. Overriding the attribute would take the control out of Base UI's own
      // expanded/collapsed handling, so the rule is excluded here instead and the behaviour is
      // asserted in the unit test.
      options: { rules: { 'aria-hidden-focus': { enabled: false } } },
    },
  },
} satisfies Meta<typeof ToastRegion>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <>
      <Button
        variant="secondary"
        onClick={() =>
          args.manager.add({
            title: 'Remote removed',
            description: 'showcase is no longer in the registry.',
            tone: 'success',
            action: { label: 'Undo', onClick: () => undefined },
          })
        }
      >
        Raise a toast
      </Button>
      <ToastRegion {...args} />
    </>
  ),
};

export const Danger: Story = {
  render: (args) => (
    <>
      <Button
        variant="secondary"
        onClick={() =>
          args.manager.add({
            title: 'The showcase remote failed to load',
            description: 'The manifest returned 404.',
            tone: 'danger',
            priority: 'high',
            timeout: 0,
          })
        }
      >
        Raise a failure
      </Button>
      <ToastRegion {...args} />
    </>
  ),
};
