import { composeStories } from '@storybook/react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { axeDocument } from '../../../test/axe';
import fieldStyles from '../../styles/field.module.css';
import { Switch } from './Switch';
import * as stories from './Switch.stories';

const { Default, On, Described, Required, Disabled, WithError } = composeStories(stories);

describe('Switch', () => {
  it.each([
    ['Default', Default],
    ['On', On],
    ['Described', Described],
    ['Required', Required],
    ['Disabled', Disabled],
    ['WithError', WithError],
  ])('%s has no axe violations', async (_name, Story) => {
    render(<Story />);
    expect(await axeDocument()).toHaveNoViolations();
  });

  it('is a switch, named by its label', () => {
    render(<Default />);
    const toggle = screen.getByRole('switch', { name: 'Email me when someone joins' });
    expect(toggle).toHaveAttribute('aria-checked', 'false');
  });

  it('toggles with space and with enter', async () => {
    const onCheckedChange = vi.fn();
    render(<Switch label="Notify me" name="notify" onCheckedChange={onCheckedChange} />);
    const toggle = screen.getByRole('switch', { name: 'Notify me' });
    toggle.focus();
    await userEvent.keyboard(' ');
    expect(toggle).toHaveAttribute('aria-checked', 'true');
    await userEvent.keyboard('{Enter}');
    expect(toggle).toHaveAttribute('aria-checked', 'false');
    expect(onCheckedChange).toHaveBeenCalledTimes(2);
    expect(onCheckedChange).toHaveBeenNthCalledWith(1, true);
    expect(onCheckedChange).toHaveBeenNthCalledWith(2, false);
  });

  it('toggles by clicking the label text, because the whole row is the label', async () => {
    render(<Default />);
    await userEvent.click(screen.getByText('Email me when someone joins'));
    expect(screen.getByRole('switch', { name: 'Email me when someone joins' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
  });

  it('is described by its description', () => {
    render(<Described />);
    expect(
      screen.getByRole('switch', { name: 'Email me when someone joins' }),
    ).toHaveAccessibleDescription('One message per event, never a digest.');
  });

  it('shows the error message and describes the switch with it', () => {
    render(<WithError />);
    expect(
      screen.getByRole('switch', { name: 'Email me when someone joins' }),
    ).toHaveAccessibleDescription('Turn this on to continue.');
  });

  it('renders no error node when no error is given', () => {
    render(<Described />);
    expect(screen.queryByText('Turn this on to continue.')).not.toBeInTheDocument();
  });

  it('marks itself required in the accessibility tree and draws the required mark', () => {
    const { container: requiredContainer } = render(<Required />);
    expect(screen.getByRole('switch', { name: 'Email me when someone joins' })).toHaveAttribute(
      'aria-required',
      'true',
    );
    const requiredMark = requiredContainer.querySelector(`.${fieldStyles.required}`);
    expect(requiredMark).toBeInTheDocument();
    expect(requiredMark).toHaveAttribute('aria-hidden', 'true');

    const { container: defaultContainer } = render(<Default />);
    expect(defaultContainer.querySelector(`.${fieldStyles.required}`)).not.toBeInTheDocument();
  });

  it('refuses the pointer when disabled and says so, so the skin can dim it', async () => {
    const onCheckedChange = vi.fn();
    render(<Switch label="Notify me" name="notify" disabled onCheckedChange={onCheckedChange} />);
    const toggle = screen.getByRole('switch', { name: 'Notify me' });
    expect(toggle).toHaveAttribute('aria-disabled', 'true');
    expect(toggle).toHaveAttribute('data-disabled');
    await userEvent.click(toggle);
    expect(onCheckedChange).not.toHaveBeenCalled();
  });
});
