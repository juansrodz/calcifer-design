import { composeStories } from '@storybook/react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { axe } from '../../../test/axe';
import { Alert } from './Alert';
import * as stories from './Alert.stories';

const { Info, Success, Warning, Danger, WithTitle, Dismissible, Announced } =
  composeStories(stories);

describe('Alert', () => {
  it.each([
    ['Info', Info],
    ['Success', Success],
    ['Warning', Warning],
    ['Danger', Danger],
    ['WithTitle', WithTitle],
    ['Dismissible', Dismissible],
    ['Announced', Announced],
  ])('%s has no axe violations', async (_name, Story) => {
    const { container } = render(<Story />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('is not a live region by default, so an alert present at first paint cannot announce late', () => {
    render(<Danger />);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.getByTestId('alert')).not.toHaveAttribute('aria-live');
  });

  it('becomes an assertive live region when a danger alert opts in', () => {
    render(<Announced />);
    expect(screen.getByRole('alert')).toHaveTextContent('Saving failed.');
  });

  it('becomes a polite live region when a non-danger alert opts in', () => {
    render(
      <Alert tone="success" announce>
        Saved.
      </Alert>,
    );
    expect(screen.getByRole('status')).toHaveTextContent('Saved.');
  });

  it.each([
    ['info', 'Information'],
    ['success', 'Success'],
    ['warning', 'Warning'],
    ['danger', 'Error'],
  ] as const)('names the %s tone in text, so colour is never the only signal', (tone, word) => {
    render(<Alert tone={tone}>Body copy.</Alert>);
    expect(screen.getByText(word)).toBeInTheDocument();
  });

  it('renders the title as a heading above the body', () => {
    render(<WithTitle />);
    expect(screen.getByRole('heading', { name: 'Remote unavailable' })).toBeInTheDocument();
  });

  it('has no dismiss control unless onDismiss is given', () => {
    render(<Info />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('calls onDismiss from a control named by dismissLabel', async () => {
    const onDismiss = vi.fn();
    render(<Info onDismiss={onDismiss} dismissLabel="Dismiss this notice" />);
    await userEvent.click(screen.getByRole('button', { name: 'Dismiss this notice' }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('names the dismiss control "Dismiss" when no label is given', () => {
    render(<Info onDismiss={() => {}} />);
    expect(screen.getByRole('button', { name: 'Dismiss' })).toBeInTheDocument();
  });

  it('carries the tone as a data attribute', () => {
    render(<Warning />);
    expect(screen.getByTestId('alert')).toHaveAttribute('data-tone', 'warning');
  });
});
