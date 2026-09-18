import { composeStories } from '@storybook/react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { axeDocument } from '../../../test/axe';
import { Button } from '../Button/Button';
import { Tooltip } from './Tooltip';
import * as stories from './Tooltip.stories';
import { TOOLTIP_DELAY, TooltipProvider } from './TooltipProvider';

const { Default, Instant, Below, OnIconButton } = composeStories(stories);

describe('Tooltip', () => {
  it.each([
    ['Default', Default],
    ['Instant', Instant],
    ['Below', Below],
  ])('%s has no axe violations', async (_name, Story) => {
    render(<Story />);
    expect(await axeDocument()).toHaveNoViolations();
  });

  it('gives the trigger its accessible name, because Base UI puts the tip in no tree at all', () => {
    render(<Default />);
    expect(screen.getByRole('button', { name: 'Reload the registry' })).toBeInTheDocument();
  });

  it('shows the tip on hover and takes it away again', async () => {
    render(<Instant />);
    const trigger = screen.getByRole('button', { name: 'Reload the registry' });
    expect(screen.queryByText('Reload the registry')).not.toBeInTheDocument();
    await userEvent.hover(trigger);
    expect(await screen.findByText('Reload the registry')).toBeInTheDocument();
    expect(await axeDocument()).toHaveNoViolations();
    await userEvent.unhover(trigger);
    await waitFor(() => expect(screen.queryByText('Reload the registry')).not.toBeInTheDocument());
  });

  it('takes a delay per trigger, with no provider in the tree at all', async () => {
    render(<Tooltip trigger={<Button>{null}</Button>} label="Retry the manifest" delay={0} />);
    await userEvent.hover(screen.getByRole('button', { name: 'Retry the manifest' }));
    expect(await screen.findByText('Retry the manifest')).toBeInTheDocument();
  });

  it('marks the popup so the shared skin can style it', async () => {
    render(<Instant />);
    await userEvent.hover(screen.getByRole('button', { name: 'Reload the registry' }));
    const tip = await screen.findByText('Reload the registry');
    expect(tip).toHaveAttribute('data-popup', 'tooltip');
  });

  it('keeps the accessible name on an IconButton trigger, which sets its own aria-label', async () => {
    render(<OnIconButton />);
    const trigger = screen.getByRole('button', { name: 'Reload the registry' });
    expect(trigger).toBeInTheDocument();
    await userEvent.hover(trigger);
    expect(await screen.findByText('Reload the registry')).toBeInTheDocument();
  });
});

describe('TooltipProvider', () => {
  it('renders no DOM of its own, which is why every remote can mount one', () => {
    const { container } = render(
      <TooltipProvider>
        <span data-testid="child">Only this</span>
      </TooltipProvider>,
    );
    expect(container.innerHTML).toBe('<span data-testid="child">Only this</span>');
  });

  it('exports the delay both sides of the federation seam use, which is Base UI’s own default', () => {
    expect(TOOLTIP_DELAY).toBe(600);
  });
});
