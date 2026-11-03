import { composeStories } from '@storybook/react';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axeDocument } from '../../../test/axe';
import a11yStyles from '../../styles/a11y.module.css';
import * as stories from './Steps.stories';

const { Default, Vertical, WithError, NotStarted, AllComplete, TranslatedStatuses, Dark } =
  composeStories(stories);

/** Each list item's status, read from its visually hidden text, in order. */
function readStatuses(): string[] {
  return screen.getAllByRole('listitem').map((listItem) => {
    const status = listItem.querySelector(`.${a11yStyles.visuallyHidden}`);
    return status?.textContent ?? '';
  });
}

describe('Steps', () => {
  it.each([
    ['Default', Default],
    ['Vertical', Vertical],
    ['WithError', WithError],
    ['NotStarted', NotStarted],
    ['AllComplete', AllComplete],
    ['TranslatedStatuses', TranslatedStatuses],
    ['Dark', Dark],
  ])('%s has no axe violations', async (_name, Story) => {
    render(<Story />);
    expect(await axeDocument()).toHaveNoViolations();
  });

  it('renders a named ol with one item per step', () => {
    render(<Default />);
    const list = screen.getByRole('list', { name: 'Sign-up progress' });
    expect(list.tagName).toBe('OL');
    expect(within(list).getAllByRole('listitem')).toHaveLength(4);
  });

  // WebKit drops list semantics for `list-style: none` outside a `nav`; only the role restores them.
  it('states its list role outright', () => {
    render(<Default />);
    expect(screen.getByRole('list', { name: 'Sign-up progress' })).toHaveAttribute('role', 'list');
  });

  it('marks only the current item with aria-current="step"', () => {
    const { container } = render(<Default />);
    const marked = container.querySelectorAll('[aria-current]');
    expect(marked).toHaveLength(1);
    expect(marked[0]).toHaveAttribute('aria-current', 'step');
    expect(marked[0]).toHaveTextContent('Workspace');
  });

  it('states each status in text, not by colour alone', () => {
    render(<Default />);
    expect(readStatuses()).toEqual(['Completed', 'Current', 'Not started', 'Not started']);
  });

  it('states an error on the current step, in text and for the skin', () => {
    render(<WithError />);
    expect(readStatuses()).toEqual(['Completed', 'Error', 'Not started', 'Not started']);
    const current = screen
      .getAllByRole('listitem')
      .find((listItem) => listItem.hasAttribute('aria-current'));
    expect(current).toHaveAttribute('aria-current', 'step');
    expect(current).toHaveAttribute('data-status', 'error');
  });

  it('keeps the status text where a screen reader finds it', () => {
    const { container } = render(<Default />);
    const statuses = container.querySelectorAll(`.${a11yStyles.visuallyHidden}`);
    expect(statuses).toHaveLength(4);
    for (const status of statuses) {
      expect(status.closest('[aria-hidden="true"]')).toBeNull();
    }
  });

  it('hides the drawn marker, which only repeats the status', () => {
    render(<Default />);
    for (const listItem of screen.getAllByRole('listitem')) {
      expect(listItem.firstElementChild).toHaveAttribute('aria-hidden', 'true');
    }
  });

  it('marks nothing current before the first step', () => {
    const { container } = render(<NotStarted />);
    expect(container.querySelector('[aria-current]')).toBeNull();
    expect(readStatuses()).toEqual(['Not started', 'Not started', 'Not started', 'Not started']);
  });

  it('marks everything complete past the last step', () => {
    const { container } = render(<AllComplete />);
    expect(container.querySelector('[aria-current]')).toBeNull();
    expect(readStatuses()).toEqual(['Completed', 'Completed', 'Completed', 'Completed']);
  });

  it('takes its status words from the caller', () => {
    render(<TranslatedStatuses />);
    expect(readStatuses()).toEqual(['Terminado', 'En curso', 'Pendiente', 'Pendiente']);
  });

  it('shows titles and descriptions', () => {
    render(<Default />);
    expect(screen.getByText('Workspace')).toBeInTheDocument();
    expect(screen.getByText('Where the work lives.')).toBeInTheDocument();
  });

  it('is horizontal unless asked otherwise, and tells the skin', () => {
    const { unmount } = render(<Default />);
    expect(screen.getByRole('list')).toHaveAttribute('data-orientation', 'horizontal');
    unmount();
    render(<Vertical />);
    expect(screen.getByRole('list')).toHaveAttribute('data-orientation', 'vertical');
  });

  it('has nothing to focus: it is a display, not a control', () => {
    const { container } = render(<Default />);
    expect(container.querySelector('a, button, [tabindex]')).toBeNull();
  });
});
