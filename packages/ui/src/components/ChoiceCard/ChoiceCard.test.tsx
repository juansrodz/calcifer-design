import { composeStories } from '@storybook/react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { axeDocument } from '../../../test/axe';
import fieldStyles from '../../styles/field.module.css';
import { ChoiceCard } from './ChoiceCard';
import * as stories from './ChoiceCard.stories';

const { Default, Preselected, OneColumn, Required, WithError, DisabledOption, Dark } =
  composeStories(stories);

const options = [
  { value: 'open', label: 'Open to all', description: 'Anyone can join.' },
  { value: 'friends', label: 'Friends only', description: 'Only your friends can join.' },
  { value: 'private', label: 'Private' },
];

// The stories' four cards, for the tests that need a plain `vi.fn()` handler: a composed story
// types its handler with Storybook's own spy, which a `vi.fn()` does not satisfy.
const fourOptions = [
  { value: 'open', label: 'Open to all', description: 'Anyone can join.' },
  {
    value: 'friends',
    label: 'Friends only',
    description: 'Only your friends see it and can join.',
  },
  { value: 'request', label: 'By request', description: 'You approve each request.' },
  { value: 'private', label: 'Private', description: 'Hidden. Guests need your invite link.' },
];

/** The card a radio sits in: the `<label>` that wraps it. */
function cardOf(radio: HTMLElement): HTMLElement {
  const card = radio.closest('label');
  if (!card) {
    throw new Error('the radio is not inside a label');
  }
  return card;
}

describe('ChoiceCard', () => {
  it.each([
    ['Default', Default],
    ['Preselected', Preselected],
    ['OneColumn', OneColumn],
    ['Required', Required],
    ['WithError', WithError],
    ['DisabledOption', DisabledOption],
    ['Dark', Dark],
  ])('%s has no axe violations', async (_name, Story) => {
    render(<Story />);
    expect(await axeDocument()).toHaveNoViolations();
  });

  it('names the group, and names each radio after its title alone', () => {
    render(<Default />);
    expect(screen.getByRole('radiogroup', { name: 'Who can join' })).toBeInTheDocument();
    expect(screen.getAllByRole('radio')).toHaveLength(4);
    // `exact` is the default for a string name, so a name that swallowed the description
    // ("Open to all Anyone can join.") would match nothing here. One each: a card's label wraps
    // the whole card, and a radio left to name itself from it would carry the description too.
    for (const title of ['Open to all', 'Friends only', 'By request', 'Private']) {
      expect(screen.getAllByRole('radio', { name: title })).toHaveLength(1);
    }
  });

  it('describes each radio with its own line, and leaves a card without one undescribed', () => {
    render(
      <ChoiceCard label="Who can join" name="audience" options={options} onValueChange={vi.fn()} />,
    );
    expect(screen.getByRole('radio', { name: 'Open to all' })).toHaveAccessibleDescription(
      'Anyone can join.',
    );
    expect(screen.getByRole('radio', { name: 'Friends only' })).toHaveAccessibleDescription(
      'Only your friends can join.',
    );
    expect(screen.getByRole('radio', { name: 'Private' })).not.toHaveAccessibleDescription();
  });

  it('chooses a card by a press on its description text, and reports the value once', async () => {
    const onValueChange = vi.fn();
    render(<ChoiceCard label="Who can join" options={fourOptions} onValueChange={onValueChange} />);
    await userEvent.click(screen.getByText('Only your friends see it and can join.'));
    expect(screen.getByRole('radio', { name: 'Friends only' })).toBeChecked();
    expect(onValueChange).toHaveBeenCalledTimes(1);
    // One argument, whatever Base UI passes: its second, the event details, is dropped.
    expect(onValueChange.mock.calls[0]).toEqual(['friends']);
  });

  it('moves the choice with the arrow keys, and reports each step', async () => {
    const onValueChange = vi.fn();
    render(
      <ChoiceCard
        label="Who can join"
        options={fourOptions}
        defaultValue="friends"
        onValueChange={onValueChange}
      />,
    );
    screen.getByRole('radio', { name: 'Friends only' }).focus();
    await userEvent.keyboard('{ArrowDown}');
    await waitFor(() => expect(screen.getByRole('radio', { name: 'By request' })).toBeChecked());
    expect(onValueChange).toHaveBeenLastCalledWith('request');
  });

  it('puts one tab stop on the group, not one per card', async () => {
    render(<Preselected />);
    await userEvent.tab();
    expect(screen.getByRole('radio', { name: 'Friends only' })).toHaveFocus();
    await userEvent.tab();
    expect(document.body).toHaveFocus();
  });

  it('marks the chosen card checked and no other, and moves the mark with the choice', async () => {
    render(<Preselected />);
    const titles = ['Open to all', 'Friends only', 'By request', 'Private'];
    const checkedTitles = () =>
      titles.filter((title) =>
        cardOf(screen.getByRole('radio', { name: title })).hasAttribute('data-checked'),
      );
    expect(checkedTitles()).toEqual(['Friends only']);
    await userEvent.click(screen.getByText('Private'));
    expect(checkedTitles()).toEqual(['Private']);
  });

  it('marks no card checked while nothing is chosen', () => {
    render(<Default />);
    for (const radio of screen.getAllByRole('radio')) {
      expect(radio).not.toBeChecked();
      expect(cardOf(radio)).not.toHaveAttribute('data-checked');
    }
  });

  it('follows a controlled value, and a null one chooses nothing', async () => {
    const onValueChange = vi.fn();
    const { rerender } = render(
      <ChoiceCard
        label="Who can join"
        options={options}
        value="open"
        onValueChange={onValueChange}
      />,
    );
    expect(screen.getByRole('radio', { name: 'Open to all' })).toBeChecked();
    expect(cardOf(screen.getByRole('radio', { name: 'Open to all' }))).toHaveAttribute(
      'data-checked',
    );
    // The consumer did not take the change, so the group keeps what it was given.
    await userEvent.click(screen.getByText('Friends only'));
    expect(onValueChange).toHaveBeenCalledWith('friends');
    expect(screen.getByRole('radio', { name: 'Open to all' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Friends only' })).not.toBeChecked();

    rerender(
      <ChoiceCard label="Who can join" options={options} value="friends" onValueChange={vi.fn()} />,
    );
    expect(screen.getByRole('radio', { name: 'Friends only' })).toBeChecked();
    expect(cardOf(screen.getByRole('radio', { name: 'Open to all' }))).not.toHaveAttribute(
      'data-checked',
    );

    rerender(
      <ChoiceCard label="Who can join" options={options} value={null} onValueChange={vi.fn()} />,
    );
    for (const radio of screen.getAllByRole('radio')) {
      expect(radio).not.toBeChecked();
      expect(cardOf(radio)).not.toHaveAttribute('data-checked');
    }
  });

  it('submits the chosen value under its name', async () => {
    const { container } = render(
      <form>
        <ChoiceCard label="Who can join" name="audience" options={options} />
      </form>,
    );
    const form = container.querySelector('form');
    await userEvent.click(screen.getByText('Friends only'));
    expect(new FormData(form ?? undefined).get('audience')).toBe('friends');
  });

  it('lays out two columns by default, and one on request', () => {
    const { unmount } = render(<Default />);
    expect(screen.getByRole('radiogroup')).toHaveAttribute('data-columns', '2');
    unmount();
    render(<OneColumn />);
    expect(screen.getByRole('radiogroup')).toHaveAttribute('data-columns', '1');
  });

  it('draws the icon in an aria-hidden disc, and no disc for a card without one', () => {
    const { unmount } = render(<Default />);
    const iconCard = cardOf(screen.getByRole('radio', { name: 'Open to all' }));
    expect(iconCard.querySelector('svg')?.closest('[aria-hidden="true"]')).not.toBeNull();
    unmount();

    render(<ChoiceCard label="Who can join" options={options.slice(2)} onValueChange={vi.fn()} />);
    expect(cardOf(screen.getByRole('radio', { name: 'Private' })).querySelector('svg')).toBeNull();
  });

  it('shows the error text, and marks the group invalid', () => {
    render(<WithError />);
    expect(screen.getByText('Choose who can join.')).toBeInTheDocument();
    expect(screen.getByRole('radiogroup')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('radiogroup')).toHaveAccessibleDescription('Choose who can join.');
  });

  it('marks every ring invalid under an error, so the skin draws them in the danger colour', () => {
    const { unmount } = render(<WithError />);
    for (const radio of screen.getAllByRole('radio')) {
      expect(radio).toHaveAttribute('data-invalid');
    }
    unmount();

    render(<Default />);
    for (const radio of screen.getAllByRole('radio')) {
      expect(radio).not.toHaveAttribute('data-invalid');
    }
  });

  it('describes the group with its own description beside the option lines', () => {
    render(
      <ChoiceCard
        label="Who can join"
        options={options}
        description="You can change this later."
      />,
    );
    expect(screen.getByRole('radiogroup')).toHaveAccessibleDescription(
      'You can change this later.',
    );
    expect(screen.getByRole('radio', { name: 'Open to all' })).toHaveAccessibleDescription(
      expect.stringContaining('Anyone can join.'),
    );
  });

  it('renders no error node when no error is given', () => {
    render(<Default />);
    expect(screen.queryByText('Choose who can join.')).not.toBeInTheDocument();
  });

  it('marks itself required in the accessibility tree and draws the required mark', () => {
    const { container: requiredContainer } = render(<Required />);
    expect(screen.getByRole('radiogroup')).toHaveAttribute('aria-required', 'true');
    const requiredMark = requiredContainer.querySelector(`.${fieldStyles.required}`);
    expect(requiredMark).toBeInTheDocument();
    expect(requiredMark).toHaveAttribute('aria-hidden', 'true');

    const { container: defaultContainer } = render(<Default />);
    expect(defaultContainer.querySelector(`.${fieldStyles.required}`)).not.toBeInTheDocument();
  });

  it('marks the group name disabled, so the skin dims it with every other label', () => {
    const { container } = render(<ChoiceCard label="Who can join" options={options} disabled />);
    expect(container.querySelector(`.${fieldStyles.legend}`)).toHaveAttribute('data-disabled');
    for (const radio of screen.getAllByRole('radio')) {
      expect(radio).toHaveAttribute('aria-disabled', 'true');
    }
  });

  it('draws the story’s third card disabled, and the others not', () => {
    render(<DisabledOption />);
    const disabledRadio = screen.getByRole('radio', { name: 'By request' });
    // Base UI renders `<span role="radio">`, which jest-dom's `toBeDisabled` does not recognise;
    // `RadioGroup.test.tsx` asserts the same two attributes.
    expect(disabledRadio).toHaveAttribute('aria-disabled', 'true');
    expect(disabledRadio).toHaveAttribute('data-disabled');
    expect(cardOf(disabledRadio)).toHaveAttribute('data-disabled');
    for (const title of ['Open to all', 'Friends only', 'Private']) {
      const radio = screen.getByRole('radio', { name: title });
      expect(radio).not.toHaveAttribute('aria-disabled');
      expect(cardOf(radio)).not.toHaveAttribute('data-disabled');
    }
  });

  it('does not choose a disabled card, and steps the arrow keys over it', async () => {
    const onValueChange = vi.fn();
    render(
      <ChoiceCard
        label="Who can join"
        options={fourOptions.map((option) =>
          option.value === 'request' ? { ...option, disabled: true } : option,
        )}
        defaultValue="friends"
        onValueChange={onValueChange}
      />,
    );
    const disabledRadio = screen.getByRole('radio', { name: 'By request' });

    await userEvent.click(screen.getByText('You approve each request.'));
    expect(onValueChange).not.toHaveBeenCalled();
    expect(disabledRadio).not.toBeChecked();

    // From the chosen second card the next enabled one is the fourth.
    screen.getByRole('radio', { name: 'Friends only' }).focus();
    await userEvent.keyboard('{ArrowDown}');
    await waitFor(() => expect(screen.getByRole('radio', { name: 'Private' })).toBeChecked());
    expect(disabledRadio).not.toBeChecked();
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenLastCalledWith('private');
  });

  it('reports the focus leaving the group, so a form library can mark the field touched', async () => {
    const onBlur = vi.fn();
    render(<Preselected onBlur={onBlur} />);
    screen.getByRole('radio', { name: 'Friends only' }).focus();
    await userEvent.tab();
    expect(onBlur).toHaveBeenCalledTimes(1);
  });
});
