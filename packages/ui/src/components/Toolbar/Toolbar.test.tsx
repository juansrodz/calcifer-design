import { composeStories } from '@storybook/react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { axeDocument } from '../../../test/axe';
import { CheckIcon } from '../../icons/CheckIcon';
import buttonStyles from '../Button/Button.module.css';
import { IconButton } from '../IconButton/IconButton';
import iconButtonStyles from '../IconButton/IconButton.module.css';
import { Segmented } from '../Segmented/Segmented';
import { Toolbar, ToolbarButton, ToolbarSeparator } from './Toolbar';
import * as stories from './Toolbar.stories';

const { Default, Vertical, DisabledButton, DisabledGroup, WithSegmented, ManyControls, Dark } =
  composeStories(stories);

describe('Toolbar', () => {
  it.each([
    ['Default', Default],
    ['Vertical', Vertical],
    ['DisabledButton', DisabledButton],
    ['DisabledGroup', DisabledGroup],
    ['WithSegmented', WithSegmented],
    ['ManyControls', ManyControls],
    ['Dark', Dark],
  ])('%s has no axe violations', async (_name, Story) => {
    render(<Story />);
    expect(await axeDocument()).toHaveNoViolations();
  });

  it('is a named toolbar, horizontal unless asked otherwise', () => {
    const { unmount } = render(<Default />);
    expect(screen.getByRole('toolbar', { name: 'Document actions' })).toHaveAttribute(
      'aria-orientation',
      'horizontal',
    );
    unmount();
    render(<Vertical />);
    expect(screen.getByRole('toolbar', { name: 'Document actions' })).toHaveAttribute(
      'aria-orientation',
      'vertical',
    );
  });

  it('is one tab stop', async () => {
    render(
      <>
        <Default />
        <button type="button">After</button>
      </>,
    );
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'Save' })).toHaveFocus();
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'After' })).toHaveFocus();
  });

  it('moves focus with the arrow keys along a horizontal toolbar, and loops', async () => {
    render(<Default />);
    await userEvent.tab();
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('button', { name: 'Preview' })).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('button', { name: 'Approve' })).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('button', { name: 'Reject' })).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('button', { name: 'Save' })).toHaveFocus();
    await userEvent.keyboard('{ArrowLeft}');
    expect(screen.getByRole('button', { name: 'Reject' })).toHaveFocus();
  });

  it('moves focus with up and down along a vertical toolbar, and ignores the other axis', async () => {
    render(<Vertical />);
    await userEvent.tab();
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('button', { name: 'Save' })).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}');
    expect(screen.getByRole('button', { name: 'Preview' })).toHaveFocus();
    await userEvent.keyboard('{ArrowUp}');
    expect(screen.getByRole('button', { name: 'Save' })).toHaveFocus();
  });

  // Measured on Base UI 1.8.0: `Toolbar.Root` does not turn on Home and End, unlike `ToggleGroup`,
  // and has no public prop to. The WAI-ARIA toolbar pattern lists them as optional.
  it('leaves Home and End alone', async () => {
    render(<Default />);
    await userEvent.tab();
    await userEvent.keyboard('{ArrowRight}{End}');
    expect(screen.getByRole('button', { name: 'Preview' })).toHaveFocus();
    await userEvent.keyboard('{Home}');
    expect(screen.getByRole('button', { name: 'Preview' })).toHaveFocus();
  });

  it('activates the focused button with enter and with space', async () => {
    const onClick = vi.fn();
    render(
      <Toolbar aria-label="Actions">
        <ToolbarButton onClick={onClick}>Save</ToolbarButton>
      </Toolbar>,
    );
    await userEvent.tab();
    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard(' ');
    expect(onClick).toHaveBeenCalledTimes(2);
  });

  it('wears Button by default', () => {
    render(<Default />);
    const save = screen.getByRole('button', { name: 'Save' });
    expect(save).toHaveClass(buttonStyles.root);
    expect(save).toHaveAttribute('data-variant', 'secondary');
    expect(save).toHaveAttribute('data-size', 'sm');
  });

  it('keeps the look of the Button or IconButton it is given through render', () => {
    render(<Default />);
    const preview = screen.getByRole('button', { name: 'Preview' });
    expect(preview).toHaveClass(buttonStyles.root);
    expect(preview).toHaveAttribute('data-variant', 'ghost');
    const approve = screen.getByRole('button', { name: 'Approve' });
    expect(approve).toHaveClass(iconButtonStyles.root);
    expect(approve).toHaveAttribute('data-variant', 'secondary');
    expect(approve.querySelector('svg')).toBeInTheDocument();
  });

  it('keeps the roving tab stop on a button worn through render', () => {
    render(<Default />);
    expect(screen.getByRole('button', { name: 'Save' })).toHaveAttribute('tabindex', '0');
    expect(screen.getByRole('button', { name: 'Approve' })).toHaveAttribute('tabindex', '-1');
  });

  // Base UI's default, kept on purpose: a disabled toolbar button stays reachable so its name can
  // be read, and it says so with `aria-disabled` rather than the attribute that removes focus.
  it('keeps a disabled button focusable and inert, and marks it for the skin to dim', async () => {
    const onClick = vi.fn();
    render(
      <Toolbar aria-label="Actions">
        <ToolbarButton>Save</ToolbarButton>
        <ToolbarButton disabled onClick={onClick}>
          Publish
        </ToolbarButton>
      </Toolbar>,
    );
    const publish = screen.getByRole('button', { name: 'Publish' });
    expect(publish).toHaveAttribute('aria-disabled', 'true');
    expect(publish).toHaveAttribute('data-disabled');
    expect(publish).not.toHaveAttribute('disabled');
    await userEvent.click(publish);
    expect(onClick).not.toHaveBeenCalled();
    await userEvent.tab();
    await userEvent.keyboard('{ArrowRight}');
    expect(publish).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard(' ');
    expect(onClick).not.toHaveBeenCalled();
  });

  describe('a loading button', () => {
    async function expectFocusableBusyAndInert(name: string, onClick: () => void) {
      const button = screen.getByRole('button', { name });
      expect(button).toHaveAttribute('aria-disabled', 'true');
      expect(button).toHaveAttribute('aria-busy', 'true');
      expect(button).toHaveAttribute('data-loading');
      expect(button).toHaveAttribute('data-disabled');
      expect(button).not.toHaveAttribute('disabled');
      await userEvent.click(button);
      await userEvent.tab();
      await userEvent.keyboard('{ArrowRight}');
      expect(button).toHaveFocus();
      await userEvent.keyboard('{Enter}');
      await userEvent.keyboard(' ');
      expect(onClick).not.toHaveBeenCalled();
    }

    it('in the default look says what it is, stays focusable and does nothing', async () => {
      const onClick = vi.fn();
      render(
        <Toolbar aria-label="Actions">
          <ToolbarButton>Save</ToolbarButton>
          <ToolbarButton loading onClick={onClick}>
            Publish
          </ToolbarButton>
        </Toolbar>,
      );
      await expectFocusableBusyAndInert('Publish', onClick);
      expect(screen.getByRole('button', { name: 'Publish' })).toHaveClass(buttonStyles.root);
    });

    it('passes loading on to the IconButton in render, which draws its spinner', async () => {
      const onClick = vi.fn();
      render(
        <Toolbar aria-label="Actions">
          <ToolbarButton>Save</ToolbarButton>
          <ToolbarButton
            loading
            onClick={onClick}
            render={
              <IconButton label="Approve" size="sm">
                <CheckIcon />
              </IconButton>
            }
          />
        </Toolbar>,
      );
      await expectFocusableBusyAndInert('Approve', onClick);
      expect(screen.getByTestId('spinner')).toBeInTheDocument();
    });

    it('leaves nothing behind once it stops loading', () => {
      render(
        <Toolbar aria-label="Actions">
          <ToolbarButton loading={false}>Publish</ToolbarButton>
        </Toolbar>,
      );
      const button = screen.getByRole('button', { name: 'Publish' });
      expect(button).toHaveAttribute('aria-disabled', 'false');
      expect(button).not.toHaveAttribute('aria-busy');
      expect(button).not.toHaveAttribute('data-loading');
    });
  });

  it('disables every button in a disabled group', () => {
    render(<DisabledGroup />);
    const group = screen.getByRole('group', { name: 'Publishing' });
    for (const button of within(group).getAllByRole('button')) {
      expect(button).toHaveAttribute('aria-disabled', 'true');
    }
    expect(screen.getByRole('button', { name: 'Save' })).toHaveAttribute('aria-disabled', 'false');
  });

  it('names a group', () => {
    render(<Default />);
    const group = screen.getByRole('group', { name: 'Review' });
    expect(within(group).getAllByRole('button')).toHaveLength(2);
  });

  it('draws a separator across the toolbar, stepped over by the arrow keys', async () => {
    const { unmount } = render(<Default />);
    expect(screen.getByRole('separator')).toHaveAttribute('aria-orientation', 'vertical');
    unmount();
    render(
      <Toolbar aria-label="Actions" orientation="vertical">
        <ToolbarButton>One</ToolbarButton>
        <ToolbarSeparator />
        <ToolbarButton>Two</ToolbarButton>
      </Toolbar>,
    );
    expect(screen.getByRole('separator')).toHaveAttribute('aria-orientation', 'horizontal');
    await userEvent.tab();
    await userEvent.keyboard('{ArrowDown}');
    expect(screen.getByRole('button', { name: 'Two' })).toHaveFocus();
  });

  it('takes a Segmented into its one tab stop, whose arrow keys walk through the options', async () => {
    render(<WithSegmented />);
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'Refresh' })).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('button', { name: 'Day' })).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('button', { name: 'Week' })).toHaveFocus();
    await userEvent.keyboard(' ');
    expect(screen.getByRole('button', { name: 'Week' })).toHaveAttribute('aria-pressed', 'true');
  });

  describe('holding a Segmented whose chosen option is not its first', () => {
    const toolbar = (
      <>
        <Toolbar aria-label="Actions">
          <ToolbarButton>Refresh</ToolbarButton>
          <Segmented
            aria-label="Range"
            defaultValue="week"
            options={[
              { value: 'day', label: 'Day' },
              { value: 'week', label: 'Week' },
            ]}
          />
        </Toolbar>
        <button type="button">After</button>
      </>
    );

    it("still has one tab stop, the toolbar's", async () => {
      const { container } = render(toolbar);
      const stops = container.querySelectorAll('[role="toolbar"] [tabindex="0"]');
      expect(stops).toHaveLength(1);
      expect(stops[0]).toHaveTextContent('Refresh');
      await userEvent.tab();
      expect(screen.getByRole('button', { name: 'Refresh' })).toHaveFocus();
      await userEvent.tab();
      expect(screen.getByRole('button', { name: 'After' })).toHaveFocus();
    });

    it('leaves the stop where the toolbar put it, not on the chosen option', async () => {
      render(toolbar);
      await userEvent.tab();
      await userEvent.keyboard('{ArrowRight}');
      expect(screen.getByRole('button', { name: 'Day' })).toHaveFocus();
      await userEvent.tab();
      expect(screen.getByRole('button', { name: 'After' })).toHaveFocus();
      await userEvent.tab({ shift: true });
      expect(screen.getByRole('button', { name: 'Day' })).toHaveFocus();
    });
  });

  it("keeps Base UI's own options out of ToolbarButton, at the type level", () => {
    const narrowed = [
      // @ts-expect-error decided here: a disabled toolbar button always stays focusable
      <ToolbarButton key="focusable" focusableWhenDisabled={false} />,
      // @ts-expect-error a toolbar button is a native button
      <ToolbarButton key="native" nativeButton={false} />,
      // @ts-expect-error a class name, not a function of Base UI's state
      <ToolbarButton key="class" className={() => 'custom'} />,
      // @ts-expect-error a style object, not a function of Base UI's state
      <ToolbarButton key="style" style={() => ({})} />,
      // @ts-expect-error an element, not a function of Base UI's state
      <ToolbarButton key="render" render={() => <button type="button" />} />,
    ];
    expect(narrowed).toHaveLength(5);
  });

  it('still takes a class name and a style', () => {
    render(
      <Toolbar aria-label="Actions">
        <ToolbarButton className="custom" style={{ width: '160px' }}>
          Save
        </ToolbarButton>
      </Toolbar>,
    );
    const save = screen.getByRole('button', { name: 'Save' });
    expect(save).toHaveClass('custom', buttonStyles.root);
    expect(save).toHaveStyle({ width: '160px' });
  });

  it('rejects a toolbar with no name, at the type level', () => {
    // @ts-expect-error `aria-label` is required
    const unnamed = <Toolbar>nothing</Toolbar>;
    expect(unnamed).toBeDefined();
  });
});
