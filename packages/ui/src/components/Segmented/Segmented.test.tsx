import { composeStories } from '@storybook/react';
import type { ReactElement } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { fn } from 'storybook/test';
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest';
import { axeDocument } from '../../../test/axe';
import a11yStyles from '../../styles/a11y.module.css';
import { Segmented } from './Segmented';
import * as stories from './Segmented.stories';

const {
  Default,
  Preselected,
  Small,
  WithIcons,
  WithBadges,
  IconOnly,
  Fill,
  PressedShadow,
  DisabledOption,
  LabelledByHeading,
  ManyOptions,
  Controlled,
  Dark,
} = composeStories(stories);

const options = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
];

function pressedLabels() {
  return screen
    .getAllByRole('button')
    .filter((button) => button.getAttribute('aria-pressed') === 'true')
    .map((button) => button.textContent);
}

describe('Segmented', () => {
  it.each([
    ['Default', Default],
    ['Preselected', Preselected],
    ['Small', Small],
    ['WithIcons', WithIcons],
    ['WithBadges', WithBadges],
    ['IconOnly', IconOnly],
    ['Fill', Fill],
    ['PressedShadow', PressedShadow],
    ['DisabledOption', DisabledOption],
    ['LabelledByHeading', LabelledByHeading],
    ['ManyOptions', ManyOptions],
    ['Controlled', Controlled],
    ['Dark', Dark],
  ])('%s has no axe violations', async (_name, Story) => {
    render(<Story />);
    expect(await axeDocument()).toHaveNoViolations();
  });

  it('is a group of pressable buttons, named by aria-label', () => {
    render(<Default />);
    expect(screen.getByRole('group', { name: 'Range' })).toBeInTheDocument();
    expect(screen.getAllByRole('button').map((button) => button.textContent)).toEqual([
      'Day',
      'Week',
      'Month',
    ]);
  });

  it('can be named by aria-labelledby instead', () => {
    render(<LabelledByHeading />);
    expect(screen.getByRole('group', { name: 'Range' })).toBeInTheDocument();
  });

  it('presses the default value', () => {
    render(<Preselected />);
    expect(pressedLabels()).toEqual(['Week']);
  });

  it('presses the first option when given no value, because one is always chosen', () => {
    render(<Default />);
    expect(pressedLabels()).toEqual(['Day']);
  });

  it('skips a disabled option when choosing that first one', () => {
    render(
      <Segmented
        aria-label="Range"
        options={[{ value: 'day', label: 'Day', disabled: true }, ...options.slice(1)]}
      />,
    );
    expect(pressedLabels()).toEqual(['Week']);
  });

  it('moves the choice when another option is pressed, reporting one argument', async () => {
    const onValueChange = vi.fn();
    render(<Segmented aria-label="Range" options={options} onValueChange={onValueChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'Month' }));
    expect(pressedLabels()).toEqual(['Month']);
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange.mock.calls[0]).toEqual(['month']);
  });

  it('never clears: pressing the active option changes nothing and reports nothing', async () => {
    const onValueChange = vi.fn();
    render(
      <Segmented
        aria-label="Range"
        options={options}
        defaultValue="week"
        onValueChange={onValueChange}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Week' }));
    expect(pressedLabels()).toEqual(['Week']);
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('never clears by keyboard either', async () => {
    const onValueChange = vi.fn();
    render(<Segmented aria-label="Range" options={options} onValueChange={onValueChange} />);
    await userEvent.tab();
    await userEvent.keyboard(' ');
    await userEvent.keyboard('{Enter}');
    expect(pressedLabels()).toEqual(['Day']);
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('holds a controlled value until the owner moves it', async () => {
    const onValueChange = vi.fn();
    const { rerender } = render(
      <Segmented aria-label="Range" options={options} value="day" onValueChange={onValueChange} />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Week' }));
    expect(onValueChange).toHaveBeenCalledWith('week');
    expect(pressedLabels()).toEqual(['Day']);
    rerender(
      <Segmented aria-label="Range" options={options} value="week" onValueChange={onValueChange} />,
    );
    expect(pressedLabels()).toEqual(['Week']);
  });

  it('works controlled from a story', async () => {
    render(<Controlled />);
    await userEvent.click(screen.getByRole('button', { name: 'Day' }));
    expect(screen.getByText('Showing: day')).toBeInTheDocument();
  });

  it('is one tab stop whose arrow keys move focus without choosing, and which loops', async () => {
    const onValueChange = vi.fn();
    render(
      <>
        <Segmented aria-label="Range" options={options} onValueChange={onValueChange} />
        <button type="button">After</button>
      </>,
    );
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'Day' })).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('button', { name: 'Week' })).toHaveFocus();
    await userEvent.keyboard('{ArrowLeft}{ArrowLeft}');
    expect(screen.getByRole('button', { name: 'Month' })).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('button', { name: 'Day' })).toHaveFocus();
    await userEvent.keyboard('{End}');
    expect(screen.getByRole('button', { name: 'Month' })).toHaveFocus();
    await userEvent.keyboard('{Home}');
    expect(screen.getByRole('button', { name: 'Day' })).toHaveFocus();
    expect(onValueChange).not.toHaveBeenCalled();
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'After' })).toHaveFocus();
  });

  it('chooses the focused option with space and with enter', async () => {
    const onValueChange = vi.fn();
    render(<Segmented aria-label="Range" options={options} onValueChange={onValueChange} />);
    await userEvent.tab();
    await userEvent.keyboard('{ArrowRight} ');
    expect(pressedLabels()).toEqual(['Week']);
    await userEvent.keyboard('{ArrowRight}{Enter}');
    expect(pressedLabels()).toEqual(['Month']);
    expect(onValueChange.mock.calls).toEqual([['week'], ['month']]);
  });

  describe('its tab stop', () => {
    function renderBetweenButtons(element: ReactElement) {
      return render(
        <>
          <button type="button">Before</button>
          {element}
          <button type="button">After</button>
        </>,
      );
    }

    function option(name: string) {
      return screen.getByRole('button', { name });
    }

    it('lands on the chosen option', async () => {
      render(<Preselected />);
      await userEvent.tab();
      expect(option('Week')).toHaveFocus();
    });

    it('moves on from the chosen option with the arrow keys', async () => {
      render(<Preselected />);
      await userEvent.tab();
      await userEvent.keyboard('{ArrowRight}');
      expect(option('Month')).toHaveFocus();
      await userEvent.keyboard('{ArrowLeft}{ArrowLeft}');
      expect(option('Day')).toHaveFocus();
    });

    it('returns to the chosen option after shift+tab out and tab back', async () => {
      renderBetweenButtons(<Preselected />);
      await userEvent.tab();
      await userEvent.tab();
      expect(option('Week')).toHaveFocus();
      await userEvent.tab({ shift: true });
      expect(option('Before')).toHaveFocus();
      await userEvent.tab();
      expect(option('Week')).toHaveFocus();
    });

    it('returns to the chosen option when focus left from another one', async () => {
      renderBetweenButtons(<Preselected />);
      await userEvent.tab();
      await userEvent.tab();
      await userEvent.keyboard('{ArrowRight}');
      expect(option('Month')).toHaveFocus();
      await userEvent.tab();
      expect(option('After')).toHaveFocus();
      await userEvent.tab({ shift: true });
      expect(option('Week')).toHaveFocus();
    });

    it('is a single stop from a focused option that is not the chosen one', async () => {
      renderBetweenButtons(<Preselected />);
      await userEvent.tab();
      await userEvent.tab();
      await userEvent.keyboard('{ArrowLeft}');
      expect(option('Day')).toHaveFocus();
      // Week sits after Day in the document: a second stop would catch this tab.
      await userEvent.tab();
      expect(option('After')).toHaveFocus();
    });

    it('follows a value changed from outside', async () => {
      const { rerender } = render(
        <>
          <Segmented aria-label="Range" options={options} value="week" />
          <button type="button">After</button>
        </>,
      );
      rerender(
        <>
          <Segmented aria-label="Range" options={options} value="month" />
          <button type="button">After</button>
        </>,
      );
      await userEvent.tab();
      expect(option('Month')).toHaveFocus();
      await userEvent.tab();
      expect(option('After')).toHaveFocus();
    });

    it('follows a value changed from outside while focus is away, after a visit', async () => {
      const tree = (value: string) => (
        <>
          <button type="button">Before</button>
          <Segmented aria-label="Range" options={options} value={value} />
        </>
      );
      const { rerender } = render(tree('week'));
      await userEvent.tab();
      await userEvent.tab();
      expect(option('Week')).toHaveFocus();
      await userEvent.tab({ shift: true });
      rerender(tree('day'));
      await userEvent.tab();
      expect(option('Day')).toHaveFocus();
    });

    it('stays on the option chosen by pressing it', async () => {
      renderBetweenButtons(<Preselected />);
      await userEvent.click(option('Month'));
      await userEvent.click(option('Before'));
      await userEvent.tab();
      expect(option('Month')).toHaveFocus();
    });

    it('falls back to an enabled option when the pressed one is disabled', async () => {
      render(
        <>
          <Segmented
            aria-label="Range"
            defaultValue="week"
            options={[
              { value: 'day', label: 'Day' },
              { value: 'week', label: 'Week', disabled: true },
              { value: 'month', label: 'Month' },
            ]}
          />
          <button type="button">After</button>
        </>,
      );
      await userEvent.tab();
      expect(option('Day')).toHaveFocus();
      await userEvent.tab();
      expect(option('After')).toHaveFocus();
    });

    it('recovers the chosen option when the focused one was removed', async () => {
      const tree = (list: typeof options) => (
        <Segmented aria-label="Range" options={list} defaultValue="week" />
      );
      const { rerender } = render(tree(options));
      await userEvent.tab();
      await userEvent.keyboard('{ArrowRight}');
      expect(option('Month')).toHaveFocus();
      // React fires no blur for an element it removes, so this has to be noticed some other way.
      rerender(tree(options.slice(0, 2)));
      expect(document.body).toHaveFocus();
      await userEvent.tab();
      expect(option('Week')).toHaveFocus();
    });
  });

  it('leaves a disabled option out of the arrow keys and of the pointer', async () => {
    const onValueChange = vi.fn();
    render(
      <Segmented
        aria-label="Range"
        defaultValue="week"
        options={[{ value: 'day', label: 'Day', disabled: true }, ...options.slice(1)]}
        onValueChange={onValueChange}
      />,
    );
    const disabledOption = screen.getByRole('button', { name: 'Day' });
    expect(disabledOption).toBeDisabled();
    await userEvent.click(disabledOption);
    expect(onValueChange).not.toHaveBeenCalled();
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'Week' })).toHaveFocus();
    await userEvent.keyboard('{ArrowLeft}');
    expect(screen.getByRole('button', { name: 'Month' })).toHaveFocus();
  });

  describe('holding exactly one beyond first mount', () => {
    let consoleError: MockInstance<typeof console.error>;

    beforeEach(() => {
      consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleError.mockRestore();
    });

    it('chooses the first option once options arrive, with no Base UI error', () => {
      const onValueChange = vi.fn();
      const { rerender } = render(
        <Segmented aria-label="Range" options={[]} onValueChange={onValueChange} />,
      );
      rerender(<Segmented aria-label="Range" options={options} onValueChange={onValueChange} />);
      expect(pressedLabels()).toEqual(['Day']);
      expect(onValueChange).not.toHaveBeenCalled();
      expect(consoleError).not.toHaveBeenCalled();
    });

    it('honours a default value whose option arrives later', () => {
      const { rerender } = render(
        <Segmented aria-label="Range" options={[]} defaultValue="week" />,
      );
      rerender(<Segmented aria-label="Range" options={options} defaultValue="week" />);
      expect(pressedLabels()).toEqual(['Week']);
      expect(consoleError).not.toHaveBeenCalled();
    });

    it('moves to the first enabled option when the chosen one is removed, reporting nothing', () => {
      const onValueChange = vi.fn();
      const { rerender } = render(
        <Segmented
          aria-label="Range"
          options={options}
          defaultValue="month"
          onValueChange={onValueChange}
        />,
      );
      rerender(
        <Segmented
          aria-label="Range"
          options={[{ value: 'day', label: 'Day', disabled: true }, ...options.slice(1, 2)]}
          defaultValue="month"
          onValueChange={onValueChange}
        />,
      );
      expect(pressedLabels()).toEqual(['Week']);
      expect(onValueChange).not.toHaveBeenCalled();
    });

    it('resolves an unknown default value to the first enabled option', () => {
      const onValueChange = vi.fn();
      render(
        <Segmented
          aria-label="Range"
          options={options}
          defaultValue="decade"
          onValueChange={onValueChange}
        />,
      );
      expect(pressedLabels()).toEqual(['Day']);
      expect(onValueChange).not.toHaveBeenCalled();
    });

    it('resolves an unknown controlled value the same way, reporting nothing', () => {
      const onValueChange = vi.fn();
      render(
        <Segmented
          aria-label="Range"
          options={options}
          value="decade"
          onValueChange={onValueChange}
        />,
      );
      expect(pressedLabels()).toEqual(['Day']);
      expect(onValueChange).not.toHaveBeenCalled();
    });

    it('takes a value that was undefined at first, with no uncontrolled-to-controlled error', () => {
      const { rerender } = render(
        <Segmented aria-label="Range" options={options} value={undefined} />,
      );
      expect(pressedLabels()).toEqual(['Day']);
      rerender(<Segmented aria-label="Range" options={options} value="week" />);
      expect(pressedLabels()).toEqual(['Week']);
      expect(consoleError).not.toHaveBeenCalled();
    });

    it('presses nothing when every option is disabled', () => {
      render(
        <Segmented aria-label="Range" options={[{ value: 'day', label: 'Day', disabled: true }]} />,
      );
      expect(pressedLabels()).toEqual([]);
    });
  });

  describe('an option whose value is the empty string', () => {
    const withAll = [{ value: '', label: 'All' }, ...options];

    it('reports the empty string, not a generated id', async () => {
      const onValueChange = vi.fn();
      render(
        <Segmented
          aria-label="Range"
          options={withAll}
          defaultValue="week"
          onValueChange={onValueChange}
        />,
      );
      await userEvent.click(screen.getByRole('button', { name: 'All' }));
      expect(onValueChange.mock.calls).toEqual([['']]);
      expect(pressedLabels()).toEqual(['All']);
    });

    it('can be the default value and the controlled value', () => {
      const { unmount } = render(
        <Segmented aria-label="Range" options={withAll} defaultValue="" />,
      );
      expect(pressedLabels()).toEqual(['All']);
      unmount();
      render(<Segmented aria-label="Range" options={withAll} value="" />);
      expect(pressedLabels()).toEqual(['All']);
    });

    it('never clears when pressed again', async () => {
      const onValueChange = vi.fn();
      render(
        <Segmented
          aria-label="Range"
          options={withAll}
          defaultValue=""
          onValueChange={onValueChange}
        />,
      );
      await userEvent.click(screen.getByRole('button', { name: 'All' }));
      expect(pressedLabels()).toEqual(['All']);
      expect(onValueChange).not.toHaveBeenCalled();
    });
  });

  describe('a badge', () => {
    it('is part of the accessible name, after the label and a space', () => {
      render(<WithBadges />);
      expect(screen.getByRole('button', { name: 'Going 12' })).toBeInTheDocument();
      const requests = screen.getByRole('button', { name: 'Requests 2' });
      expect(requests.textContent).toBe('Requests 2');
      expect(requests.childNodes).toHaveLength(3);
      expect(requests.childNodes[0]).toHaveTextContent('Requests');
      expect(requests.childNodes[1]?.nodeType).toBe(Node.TEXT_NODE);
      expect(requests.childNodes[1]?.textContent).toBe(' ');
      expect(requests.childNodes[2]).toHaveTextContent('2');
    });

    it('wraps a plain count in the badge span', () => {
      render(<WithBadges />);
      const going = screen.getByRole('button', { name: 'Going 12' });
      expect(going.lastElementChild).toHaveClass('badge');
      expect(going.lastElementChild).toHaveTextContent('12');
    });

    it('leaves an option with no badge as its bare label', () => {
      render(<WithBadges />);
      const declined = screen.getByRole('button', { name: 'Declined' });
      expect(declined.childNodes).toHaveLength(1);
      expect(declined.firstChild?.nodeType).toBe(Node.TEXT_NODE);
    });

    it('renders nothing, not even the space, for an empty badge', () => {
      render(
        <Segmented
          aria-label="Range"
          options={[
            { value: 'day', label: 'Day', badge: '' },
            { value: 'week', label: 'Week', badge: null },
            { value: 'month', label: 'Month', badge: false },
          ]}
        />,
      );
      for (const name of ['Day', 'Week', 'Month']) {
        const button = screen.getByRole('button', { name });
        expect(button.querySelector('.badge')).toBeNull();
        expect(button.textContent).toBe(name);
        expect(button.childNodes).toHaveLength(1);
      }
    });

    it('keeps a zero, which is a count', () => {
      render(<Segmented aria-label="Range" options={[{ value: 'day', label: 'Day', badge: 0 }]} />);
      expect(screen.getByRole('button', { name: 'Day 0' })).toBeInTheDocument();
    });

    it('chooses the option when the badge is pressed', async () => {
      const onValueChange = fn();
      render(<WithBadges onValueChange={onValueChange} />);
      await userEvent.click(screen.getByText('2'));
      expect(onValueChange).toHaveBeenCalledWith('requests');
      expect(screen.getByRole('button', { name: 'Requests 2' })).toHaveAttribute('data-pressed');
    });
  });

  describe('an option with its label hidden', () => {
    it('is named by its label while only the icon shows', () => {
      render(<IconOnly />);
      for (const name of ['Grid view', 'List view']) {
        const button = screen.getByRole('button', { name });
        const label = button.querySelector(`.${a11yStyles.visuallyHidden}`);
        expect(label).toHaveTextContent(name);
        expect(button.querySelector('svg')).toBeInTheDocument();
        expect(button.querySelector('svg')?.parentElement).toHaveAttribute('aria-hidden', 'true');
      }
    });

    it('is chosen by pressing the icon', async () => {
      const onValueChange = fn();
      render(<IconOnly onValueChange={onValueChange} />);
      const listButton = screen.getByRole('button', { name: 'List view' });
      const icon = listButton.querySelector('svg');
      expect(icon).not.toBeNull();
      await userEvent.click(icon as SVGElement);
      expect(onValueChange).toHaveBeenCalledTimes(1);
      expect(onValueChange).toHaveBeenCalledWith('list');
      expect(listButton).toHaveAttribute('data-pressed');
    });

    it('keeps the label first in the name when a badge follows it', () => {
      render(
        <Segmented
          aria-label="View"
          options={[{ value: 'grid', label: 'Grid view', hideLabel: true, badge: 3 }]}
        />,
      );
      expect(screen.getByRole('button', { name: 'Grid view 3' })).toBeInTheDocument();
    });

    it('leaves the label visible when there is no icon to show instead', () => {
      render(
        <Segmented
          aria-label="View"
          options={[{ value: 'grid', label: 'Grid view', hideLabel: true }]}
        />,
      );
      const button = screen.getByRole('button', { name: 'Grid view' });
      expect(button.querySelector(`.${a11yStyles.visuallyHidden}`)).toBeNull();
      expect(button.textContent).toBe('Grid view');
    });

    it('does not hide the label of an option that does not ask', () => {
      render(<WithIcons />);
      const done = screen.getByRole('button', { name: 'Done' });
      expect(done.querySelector(`.${a11yStyles.visuallyHidden}`)).toBeNull();
    });
  });

  describe('fill', () => {
    it('is written on the group root', () => {
      render(<Fill />);
      expect(screen.getByRole('group', { name: 'Range' })).toHaveAttribute('data-fill', '');
    });

    it('is absent from a default group', () => {
      render(<Default />);
      expect(screen.getByRole('group', { name: 'Range' })).not.toHaveAttribute('data-fill');
    });

    it('is absent when fill is false', () => {
      render(<Segmented aria-label="Range" options={options} fill={false} />);
      expect(screen.getByRole('group', { name: 'Range' })).not.toHaveAttribute('data-fill');
    });
  });

  it('has the PressedShadow story set the consumer hook on a wrapper around the group', () => {
    const { container } = render(<PressedShadow />);
    expect(container.querySelector('style')?.textContent).toContain(
      '--segmented-pressed-shadow: var(--shadow-soft)',
    );
    expect(screen.getByRole('button', { name: 'Week' })).toHaveAttribute('data-pressed');
  });

  it('keeps an icon out of the accessible name', () => {
    render(<WithIcons />);
    const button = screen.getByRole('button', { name: 'Done' });
    const icon = button.querySelector('svg');
    expect(icon?.parentElement).toHaveAttribute('aria-hidden', 'true');
  });

  it('marks the chosen and the disabled option for the skin', () => {
    render(<DisabledOption />);
    expect(screen.getByRole('button', { name: 'Week' })).toHaveAttribute('data-pressed');
    expect(screen.getByRole('button', { name: 'Month' })).not.toHaveAttribute('data-pressed');
    expect(screen.getByRole('button', { name: 'Day' })).toHaveAttribute('data-disabled');
  });

  it('tells the skin its size, defaulting to md', () => {
    const { container: defaultContainer } = render(<Default />);
    expect(defaultContainer.firstElementChild).toHaveAttribute('data-size', 'md');
    const { container: smallContainer } = render(<Small />);
    expect(smallContainer.firstElementChild).toHaveAttribute('data-size', 'sm');
  });

  it('rejects a group with no name, at the type level', () => {
    // @ts-expect-error one of `aria-label` and `aria-labelledby` is required
    const unnamed = <Segmented options={options} />;
    // @ts-expect-error and only one of them
    const namedTwice = <Segmented options={options} aria-label="Range" aria-labelledby="heading" />;
    expect([unnamed, namedTwice]).toHaveLength(2);
  });
});
