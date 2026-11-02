import { composeStories } from '@storybook/react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest';
import { axeDocument } from '../../../test/axe';
import { Segmented } from './Segmented';
import * as stories from './Segmented.stories';

const {
  Default,
  Preselected,
  Small,
  WithIcons,
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

  // Measured on Base UI 1.8.0: `ToggleGroup` offers no way to say which item holds the tab stop,
  // so it is the first enabled one until focus has been moved, whichever option is pressed.
  it('starts its tab stop on the first enabled option, not on the pressed one', async () => {
    render(<Preselected />);
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'Day' })).toHaveFocus();
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
