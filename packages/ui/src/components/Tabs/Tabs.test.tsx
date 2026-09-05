import { composeStories } from '@storybook/react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { axe } from '../../../test/axe';
import * as stories from './Tabs.stories';

const { Default, WithDisabled } = composeStories(stories);

describe('Tabs', () => {
  it.each([['Default', Default], ['WithDisabled', WithDisabled]])('%s has no axe violations', async (_name, Story) => {
    const { container } = render(<Story />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('shows the default panel and switches on click', async () => {
    render(<Default />);
    expect(screen.getByRole('tabpanel')).toHaveTextContent('What this remote is');
    await userEvent.click(screen.getByRole('tab', { name: 'Components' }));
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Gallery');
  });

  it('moves between tabs with arrow keys and activates on Enter', async () => {
    render(<Default />);
    const overview = screen.getByRole('tab', { name: 'Overview' });
    overview.focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Components' })).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Gallery');
  });

  it('calls onValueChange with the new value', async () => {
    const onValueChange = vi.fn();
    render(<Default onValueChange={onValueChange} />);
    await userEvent.click(screen.getByRole('tab', { name: 'Playground' }));
    expect(onValueChange).toHaveBeenCalledWith('playground');
  });

  it('labels the tablist', () => {
    render(<Default />);
    expect(screen.getByRole('tablist')).toHaveAccessibleName('Showcase sections');
  });

  it('makes the active tabpanel a keyboard stop with a visible focus ring', () => {
    render(<Default />);
    expect(screen.getByRole('tabpanel')).toHaveAttribute('tabindex', '0');
  });
});
