import { composeStories } from '@storybook/react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { axeDocument } from '../../../test/axe';
import buttonStyles from '../Button/Button.module.css';
import iconButtonStyles from '../IconButton/IconButton.module.css';
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
  it('keeps a disabled button focusable, dimmed and inert', async () => {
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

  it('rejects a toolbar with no name, at the type level', () => {
    // @ts-expect-error `aria-label` is required
    const unnamed = <Toolbar>nothing</Toolbar>;
    expect(unnamed).toBeDefined();
  });
});
