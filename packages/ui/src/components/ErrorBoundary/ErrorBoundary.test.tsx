import { composeStories } from '@storybook/react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { axe } from '../../../test/axe';
import { ErrorBoundary } from './ErrorBoundary';
import * as stories from './ErrorBoundary.stories';

const { Caught, Healthy, CustomFallback } = composeStories(stories);

let shouldThrow = true;

// React reports every caught error through console.error. Silencing it here keeps an expected
// error out of the output, so a real one still stands out. `vi.spyOn` is not held in a typed
// variable: its overloads make the annotation fight tsc for no benefit.
beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  shouldThrow = true;
});

afterEach(() => {
  vi.restoreAllMocks();
});

function Flaky() {
  if (shouldThrow) {
    throw new Error('The showcase remote failed to mount.');
  }
  return <p>The showcase remote mounted.</p>;
}

describe('ErrorBoundary', () => {
  it.each([
    ['Caught', Caught],
    ['Healthy', Healthy],
    ['CustomFallback', CustomFallback],
  ])('%s has no axe violations', async (_name, Story) => {
    const { container } = render(<Story />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('renders its children when nothing throws', () => {
    render(<Healthy />);
    expect(screen.getByText('The showcase remote mounted.')).toBeInTheDocument();
  });

  it('shows the default fallback with the error message when a child throws', () => {
    render(<Caught />);
    expect(screen.getByRole('heading', { name: 'Something went wrong' })).toBeInTheDocument();
    expect(screen.getByText('The showcase remote failed to mount.')).toBeInTheDocument();
  });

  it('announces the default fallback, which appears after the page has settled', () => {
    render(<Caught />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('renders a custom fallback instead when one is given', () => {
    render(<CustomFallback />);
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    expect(
      screen.getByText(/Could not show this panel: The showcase remote failed to mount\./),
    ).toBeInTheDocument();
  });

  it('forwards headingLevel to the default fallback', () => {
    render(
      <ErrorBoundary headingLevel={2}>
        <Flaky />
      </ErrorBoundary>,
    );
    expect(
      screen.getByRole('heading', { level: 2, name: 'Something went wrong' }),
    ).toBeInTheDocument();
  });

  it('renders its children again when a custom fallback calls reset', async () => {
    render(
      <ErrorBoundary
        fallback={({ error, reset }) => <button onClick={reset}>{error.message}</button>}
      >
        <Flaky />
      </ErrorBoundary>,
    );
    shouldThrow = false;
    await userEvent.click(
      screen.getByRole('button', { name: 'The showcase remote failed to mount.' }),
    );
    expect(screen.getByText('The showcase remote mounted.')).toBeInTheDocument();
  });

  it('reports the error and its component stack to onError', () => {
    const onError = vi.fn();
    render(
      <ErrorBoundary onError={onError}>
        <Flaky />
      </ErrorBoundary>,
    );
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0]?.[0]).toBeInstanceOf(Error);
    expect(typeof onError.mock.calls[0]?.[1]).toBe('string');
  });

  it('renders its children again when the retry control is pressed', async () => {
    render(
      <ErrorBoundary>
        <Flaky />
      </ErrorBoundary>,
    );
    shouldThrow = false;
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(screen.getByText('The showcase remote mounted.')).toBeInTheDocument();
  });

  it('renders its children again when a reset key changes', () => {
    const { rerender } = render(
      <ErrorBoundary resetKeys={['/projects/showcase']}>
        <Flaky />
      </ErrorBoundary>,
    );
    expect(screen.getByRole('heading', { name: 'Something went wrong' })).toBeInTheDocument();
    shouldThrow = false;
    rerender(
      <ErrorBoundary resetKeys={['/projects/nightward']}>
        <Flaky />
      </ErrorBoundary>,
    );
    expect(screen.getByText('The showcase remote mounted.')).toBeInTheDocument();
  });

  it('stays in the fallback when the reset keys are unchanged', () => {
    const { rerender } = render(
      <ErrorBoundary resetKeys={['/projects/showcase']}>
        <Flaky />
      </ErrorBoundary>,
    );
    shouldThrow = false;
    rerender(
      <ErrorBoundary resetKeys={['/projects/showcase']}>
        <Flaky />
      </ErrorBoundary>,
    );
    expect(screen.getByRole('heading', { name: 'Something went wrong' })).toBeInTheDocument();
  });
});
