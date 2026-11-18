import { composeStories } from '@storybook/react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { describe, expect, it, vi } from 'vitest';
import fieldStyles from '../../styles/field.module.css';
import { Form } from '../Form/Form';
import * as stories from './ToggleChip.stories';
import styles from './ToggleChip.module.css';
import { ToggleChipGroup, type ToggleChipOption } from './ToggleChipGroup';

const { SingleGroup, MultipleGroup, Required, WithError, DisabledOption, Small, CheckAtStart } =
  composeStories(stories);

// The stories' fixtures, for the tests that need a plain `vi.fn()` handler: a composed story types
// its handler with Storybook's own spy, which a `vi.fn()` does not satisfy.
const dishOptions: ToggleChipOption[] = [
  { value: 'main', label: 'Main dish' },
  { value: 'side', label: 'Side' },
  { value: 'dessert', label: 'Dessert' },
  { value: 'drink', label: 'Drink' },
  { value: 'other', label: 'Other' },
];

const dietaryOptions: ToggleChipOption[] = [
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'vegan', label: 'Vegan' },
  { value: 'gluten-free', label: 'Gluten-free' },
  { value: 'spicy', label: 'Spicy' },
];

function chip(name: string): HTMLElement {
  return screen.getByRole('button', { name });
}

function pressedLabels(): (string | null)[] {
  return screen
    .getAllByRole('button')
    .filter((button) => button.getAttribute('aria-pressed') === 'true')
    .map((button) => button.textContent);
}

function hiddenInputs(container: HTMLElement): HTMLInputElement[] {
  return Array.from(container.querySelectorAll<HTMLInputElement>('input[type="hidden"]'));
}

describe('ToggleChipGroup, single', () => {
  it('is a group named by its label, of toggle buttons', () => {
    render(<SingleGroup />);
    const group = screen.getByRole('group', { name: 'Dish type' });
    expect(group).toBeInTheDocument();
    expect(screen.getAllByRole('button').map((button) => button.textContent)).toEqual([
      'Main dish',
      'Side',
      'Dessert',
      'Drink',
      'Other',
    ]);
  });

  it('presses one chip at a time and reports the value once, with one argument', async () => {
    const onValueChange = vi.fn();
    render(
      <ToggleChipGroup
        selectionMode="single"
        label="Dish type"
        options={dishOptions}
        defaultValue="main"
        onValueChange={onValueChange}
      />,
    );
    expect(pressedLabels()).toEqual(['Main dish']);
    await userEvent.click(chip('Side'));
    expect(pressedLabels()).toEqual(['Side']);
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange.mock.calls[0]).toEqual(['side']);
  });

  it('keeps the chip pressed, and reports nothing, when it is pressed again', async () => {
    const onValueChange = vi.fn();
    render(
      <ToggleChipGroup
        selectionMode="single"
        label="Dish type"
        options={dishOptions}
        onValueChange={onValueChange}
      />,
    );
    await userEvent.click(chip('Side'));
    expect(onValueChange).toHaveBeenCalledTimes(1);
    await userEvent.click(chip('Side'));
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(pressedLabels()).toEqual(['Side']);
  });

  it('presses none for a null value, and Tab lands on the first enabled chip', async () => {
    render(
      <ToggleChipGroup
        selectionMode="single"
        label="Dish type"
        options={[{ value: 'main', label: 'Main dish', disabled: true }, ...dishOptions.slice(1)]}
        value={null}
      />,
    );
    expect(pressedLabels()).toEqual([]);
    await userEvent.tab();
    expect(chip('Side')).toHaveFocus();
  });

  it('moves focus between the chips with the arrow keys, without pressing any', async () => {
    const onValueChange = vi.fn();
    render(
      <ToggleChipGroup
        selectionMode="single"
        label="Dish type"
        options={dishOptions}
        onValueChange={onValueChange}
      />,
    );
    await userEvent.tab();
    expect(chip('Main dish')).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');
    expect(chip('Side')).toHaveFocus();
    await userEvent.keyboard('{ArrowLeft}');
    expect(chip('Main dish')).toHaveFocus();
    expect(onValueChange).not.toHaveBeenCalled();
    expect(pressedLabels()).toEqual([]);
  });

  it('presses the focused chip from the keyboard', async () => {
    render(<ToggleChipGroup selectionMode="single" label="Dish type" options={dishOptions} />);
    await userEvent.tab();
    await userEvent.keyboard('{ArrowRight}');
    await userEvent.keyboard(' ');
    expect(pressedLabels()).toEqual(['Side']);
  });

  it('draws no check on a pressed chip', () => {
    // The fixture has no icons, so any drawing inside a chip would be a check.
    render(
      <ToggleChipGroup
        selectionMode="single"
        label="Dish type"
        options={dishOptions}
        defaultValue="main"
      />,
    );
    expect(pressedLabels()).toEqual(['Main dish']);
    expect(screen.getByRole('group', { name: 'Dish type' }).querySelector('svg')).toBeNull();
  });

  it('draws only the icon on each chip of the story, the pressed one included', () => {
    render(<SingleGroup />);
    expect(pressedLabels()).toEqual(['Main dish']);
    for (const button of screen.getAllByRole('button')) {
      expect(button.querySelectorAll('svg')).toHaveLength(1);
    }
  });

  it('follows a controlled value, and keeps it when the consumer ignores the change', async () => {
    const onValueChange = vi.fn();
    const { rerender } = render(
      <ToggleChipGroup
        selectionMode="single"
        label="Dish type"
        options={dishOptions}
        value="main"
        onValueChange={onValueChange}
      />,
    );
    await userEvent.click(chip('Side'));
    expect(onValueChange).toHaveBeenCalledWith('side');
    expect(pressedLabels()).toEqual(['Main dish']);
    rerender(
      <ToggleChipGroup
        selectionMode="single"
        label="Dish type"
        options={dishOptions}
        value="drink"
        onValueChange={onValueChange}
      />,
    );
    expect(pressedLabels()).toEqual(['Drink']);
  });

  it('presses and reports an option whose value is the empty string', async () => {
    const onValueChange = vi.fn();
    render(
      <ToggleChipGroup
        selectionMode="single"
        label="Dish type"
        options={[{ value: '', label: 'Any' }, ...dishOptions]}
        onValueChange={onValueChange}
      />,
    );
    await userEvent.click(chip('Any'));
    expect(onValueChange.mock.calls[0]).toEqual(['']);
    expect(pressedLabels()).toEqual(['Any']);
  });

  it('presses the chip an uncontrolled defaultValue names', () => {
    render(
      <ToggleChipGroup
        selectionMode="single"
        label="Dish type"
        options={dishOptions}
        defaultValue="dessert"
      />,
    );
    expect(pressedLabels()).toEqual(['Dessert']);
  });

  it('presses nothing for a value no option holds, and reports nothing', () => {
    const onValueChange = vi.fn();
    render(
      <ToggleChipGroup
        selectionMode="single"
        label="Dish type"
        options={dishOptions}
        value="soup"
        onValueChange={onValueChange}
      />,
    );
    expect(pressedLabels()).toEqual([]);
    expect(onValueChange).not.toHaveBeenCalled();
  });
});

describe('ToggleChipGroup, its tab stop', () => {
  function betweenButtons(group: ReactElement) {
    return (
      <>
        <button type="button">Before</button>
        {group}
        <button type="button">After</button>
      </>
    );
  }

  function singleGroup(props: { defaultValue?: string; value?: string | null }) {
    return (
      <ToggleChipGroup selectionMode="single" label="Dish type" options={dishOptions} {...props} />
    );
  }

  it('lands on the chip a single group’s defaultValue presses', async () => {
    render(betweenButtons(singleGroup({ defaultValue: 'dessert' })));
    await userEvent.tab();
    await userEvent.tab();
    expect(chip('Dessert')).toHaveFocus();
    // One stop: the next tab leaves the group.
    await userEvent.tab();
    expect(chip('After')).toHaveFocus();
  });

  it('returns to the pressed chip when focus left from another one', async () => {
    render(betweenButtons(singleGroup({ defaultValue: 'dessert' })));
    await userEvent.tab();
    await userEvent.tab();
    await userEvent.keyboard('{ArrowLeft}');
    expect(chip('Side')).toHaveFocus();
    await userEvent.tab({ shift: true });
    expect(chip('Before')).toHaveFocus();
    await userEvent.tab();
    expect(chip('Dessert')).toHaveFocus();
  });

  it('moves with a controlled value', async () => {
    const { rerender } = render(betweenButtons(singleGroup({ value: 'side' })));
    rerender(betweenButtons(singleGroup({ value: 'drink' })));
    await userEvent.tab();
    await userEvent.tab();
    expect(chip('Drink')).toHaveFocus();
    rerender(betweenButtons(singleGroup({ value: null })));
    await userEvent.tab({ shift: true });
    await userEvent.tab();
    expect(chip('Main dish')).toHaveFocus();
  });

  it('follows the chip pressed by a click', async () => {
    render(betweenButtons(singleGroup({})));
    await userEvent.click(chip('Other'));
    await userEvent.click(chip('Before'));
    await userEvent.tab();
    expect(chip('Other')).toHaveFocus();
  });

  it('stays on the first chip of a multiple group, whatever is pressed', async () => {
    render(
      betweenButtons(
        <ToggleChipGroup
          selectionMode="multiple"
          label="Dietary needs"
          options={dietaryOptions}
          defaultValue={['spicy', 'vegan']}
        />,
      ),
    );
    await userEvent.tab();
    await userEvent.tab();
    expect(chip('Vegetarian')).toHaveFocus();
  });
});

describe('ToggleChipGroup, multiple', () => {
  it('reports the values in the options order, not the order they were pressed', async () => {
    const onValueChange = vi.fn();
    render(
      <ToggleChipGroup
        selectionMode="multiple"
        label="Dietary needs"
        options={dietaryOptions}
        onValueChange={onValueChange}
      />,
    );
    await userEvent.click(chip('Spicy'));
    expect(onValueChange.mock.calls[0]).toEqual([['spicy']]);
    await userEvent.click(chip('Vegan'));
    expect(onValueChange.mock.calls[1]).toEqual([['vegan', 'spicy']]);
    await userEvent.click(chip('Vegan'));
    expect(onValueChange.mock.calls[2]).toEqual([['spicy']]);
    expect(onValueChange).toHaveBeenCalledTimes(3);
    expect(pressedLabels()).toEqual(['Spicy']);
  });

  it('allows releasing the last pressed chip, which reports an empty list', async () => {
    const onValueChange = vi.fn();
    render(
      <ToggleChipGroup
        selectionMode="multiple"
        label="Dietary needs"
        options={dietaryOptions}
        defaultValue={['vegan']}
        onValueChange={onValueChange}
      />,
    );
    await userEvent.click(chip('Vegan'));
    expect(onValueChange.mock.calls[0]).toEqual([[]]);
    expect(pressedLabels()).toEqual([]);
  });

  it('draws the check on pressed chips and on no other', async () => {
    render(<MultipleGroup />);
    expect(pressedLabels()).toEqual(['Vegan', 'Gluten-free']);
    expect(chip('Vegan').querySelector('svg')).not.toBeNull();
    expect(chip('Gluten-free').querySelector('svg')).not.toBeNull();
    expect(chip('Spicy').querySelector('svg')).toBeNull();
    await userEvent.click(chip('Spicy'));
    expect(chip('Spicy').querySelector('svg')).not.toBeNull();
    await userEvent.click(chip('Vegan'));
    expect(chip('Vegan').querySelector('svg')).toBeNull();
  });

  it('keeps the check out of the accessible name', () => {
    render(<MultipleGroup />);
    expect(chip('Vegan')).toHaveAccessibleName('Vegan');
    const check = chip('Vegan').querySelector('svg');
    expect(check).not.toBeNull();
    // Both the span that holds the check and the drawing itself are `aria-hidden`.
    expect(check?.parentElement).toHaveAttribute('aria-hidden', 'true');
    expect(check).toHaveAttribute('aria-hidden', 'true');
  });

  it('follows a controlled list, and keeps it when the consumer ignores the change', async () => {
    const onValueChange = vi.fn();
    const { rerender } = render(
      <ToggleChipGroup
        selectionMode="multiple"
        label="Dietary needs"
        options={dietaryOptions}
        value={['vegan']}
        onValueChange={onValueChange}
      />,
    );
    await userEvent.click(chip('Spicy'));
    expect(onValueChange).toHaveBeenCalledWith(['vegan', 'spicy']);
    expect(pressedLabels()).toEqual(['Vegan']);
    rerender(
      <ToggleChipGroup
        selectionMode="multiple"
        label="Dietary needs"
        options={dietaryOptions}
        value={['spicy', 'vegetarian']}
        onValueChange={onValueChange}
      />,
    );
    expect(pressedLabels()).toEqual(['Vegetarian', 'Spicy']);
  });

  it('presses and reports an option whose value is the empty string', async () => {
    const onValueChange = vi.fn();
    render(
      <ToggleChipGroup
        selectionMode="multiple"
        label="Dietary needs"
        options={[{ value: '', label: 'No restrictions' }, ...dietaryOptions]}
        onValueChange={onValueChange}
      />,
    );
    await userEvent.click(chip('No restrictions'));
    expect(onValueChange.mock.calls[0]).toEqual([['']]);
    expect(pressedLabels()).toEqual(['No restrictions']);
  });
});

describe('ToggleChipGroup, size', () => {
  it('draws every chip at md unless the group asks for sm', () => {
    const { rerender } = render(
      <ToggleChipGroup selectionMode="multiple" label="Dietary needs" options={dietaryOptions} />,
    );
    for (const button of screen.getAllByRole('button')) {
      expect(button).toHaveAttribute('data-size', 'md');
    }
    rerender(
      <ToggleChipGroup
        selectionMode="multiple"
        label="Dietary needs"
        options={dietaryOptions}
        size="sm"
      />,
    );
    for (const button of screen.getAllByRole('button')) {
      expect(button).toHaveAttribute('data-size', 'sm');
    }
  });

  it('draws the Small story’s chips at sm, in both groups', () => {
    render(<Small />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
    for (const button of buttons) {
      expect(button).toHaveAttribute('data-size', 'sm');
    }
  });
});

describe('ToggleChipGroup, the check position', () => {
  // A chip's children in order, by what each is: the check's span, the icon's span or the label.
  function chipParts(name: string): string[] {
    return Array.from(chip(name).childNodes).map((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        return `label:${node.textContent ?? ''}`;
      }
      const element = node as HTMLElement;
      if (element.classList.contains(styles.check ?? '')) return 'check';
      if (element.classList.contains(styles.icon ?? '')) return 'icon';
      return element.tagName;
    });
  }

  it('draws the check after the label by default', () => {
    render(<MultipleGroup />);
    expect(chipParts('Vegan')).toEqual(['label:Vegan', 'check']);
  });

  it('draws it before the label for checkPosition="start", and keeps it out of the name', () => {
    render(
      <ToggleChipGroup
        selectionMode="multiple"
        label="Dietary needs"
        options={dietaryOptions}
        defaultValue={['vegan']}
        checkPosition="start"
      />,
    );
    expect(chipParts('Vegan')).toEqual(['check', 'label:Vegan']);
    expect(chipParts('Spicy')).toEqual(['label:Spicy']);
    expect(chip('Vegan')).toHaveAccessibleName('Vegan');
  });

  it('keeps an icon at the very start, before a start check', () => {
    render(
      <ToggleChipGroup
        selectionMode="multiple"
        label="Dietary needs"
        options={[{ value: 'vegan', label: 'Vegan', icon: <span /> }]}
        defaultValue={['vegan']}
        checkPosition="start"
      />,
    );
    expect(chipParts('Vegan')).toEqual(['icon', 'check', 'label:Vegan']);
  });

  it('draws the CheckAtStart story’s checks before their labels', () => {
    render(<CheckAtStart />);
    expect(chipParts('Vegetarian')).toEqual(['check', 'label:Vegetarian']);
  });
});

describe('ToggleChipGroup, submitting', () => {
  it('renders one hidden input per pressed value under the name, in the options order', async () => {
    const { container } = render(
      <ToggleChipGroup
        selectionMode="multiple"
        label="Dietary needs"
        name="dietary"
        options={dietaryOptions}
        defaultValue={['spicy', 'vegan']}
      />,
    );
    expect(hiddenInputs(container).map((input) => [input.name, input.value])).toEqual([
      ['dietary', 'vegan'],
      ['dietary', 'spicy'],
    ]);
    await userEvent.click(chip('Vegetarian'));
    expect(hiddenInputs(container).map((input) => input.value)).toEqual([
      'vegetarian',
      'vegan',
      'spicy',
    ]);
  });

  it('renders none without a name', () => {
    const { container } = render(
      <ToggleChipGroup
        selectionMode="multiple"
        label="Dietary needs"
        options={dietaryOptions}
        defaultValue={['spicy', 'vegan']}
      />,
    );
    expect(hiddenInputs(container)).toHaveLength(0);
  });

  it('renders one for a single group, and none while nothing is pressed', async () => {
    const { container } = render(
      <ToggleChipGroup
        selectionMode="single"
        label="Dish type"
        name="dish"
        options={dishOptions}
      />,
    );
    expect(hiddenInputs(container)).toHaveLength(0);
    await userEvent.click(chip('Side'));
    expect(hiddenInputs(container).map((input) => [input.name, input.value])).toEqual([
      ['dish', 'side'],
    ]);
  });

  it('submits an option whose value is the empty string', () => {
    const { container } = render(
      <ToggleChipGroup
        selectionMode="single"
        label="Dish type"
        name="dish"
        options={[{ value: '', label: 'Any' }]}
        defaultValue=""
      />,
    );
    expect(hiddenInputs(container).map((input) => [input.name, input.value])).toEqual([
      ['dish', ''],
    ]);
  });

  it('puts the pressed values in a native form’s data', () => {
    render(
      <form aria-label="Sign up">
        <ToggleChipGroup
          selectionMode="multiple"
          label="Dietary needs"
          name="dietary"
          options={dietaryOptions}
          defaultValue={['spicy', 'vegan']}
        />
      </form>,
    );
    const form = screen.getByRole('form', { name: 'Sign up' }) as HTMLFormElement;
    expect(new FormData(form).getAll('dietary')).toEqual(['vegan', 'spicy']);
  });

  it('names only the hidden inputs in form.elements, never the group', () => {
    render(
      <form aria-label="Sign up">
        <ToggleChipGroup
          selectionMode="single"
          label="Dish type"
          name="dish"
          options={dishOptions}
          defaultValue="side"
        />
        <ToggleChipGroup
          selectionMode="multiple"
          label="Dietary needs"
          name="dietary"
          options={dietaryOptions}
          defaultValue={['spicy', 'vegan']}
        />
      </form>,
    );
    const form = screen.getByRole('form', { name: 'Sign up' }) as HTMLFormElement;
    const dish = form.elements.namedItem('dish');
    expect(dish).toBeInstanceOf(HTMLInputElement);
    expect((dish as HTMLInputElement).value).toBe('side');
    const dietary = form.elements.namedItem('dietary') as RadioNodeList;
    expect(Array.from(dietary).map((element) => (element as HTMLInputElement).type)).toEqual([
      'hidden',
      'hidden',
    ]);
    expect(form.querySelector('fieldset[name]')).toBeNull();
  });

  it('submits nothing while the group is disabled', () => {
    const { container } = render(
      <form aria-label="Sign up">
        <ToggleChipGroup
          selectionMode="multiple"
          label="Dietary needs"
          name="dietary"
          options={dietaryOptions}
          defaultValue={['vegan']}
          disabled
        />
      </form>,
    );
    const form = screen.getByRole('form', { name: 'Sign up' }) as HTMLFormElement;
    expect(hiddenInputs(container)).toHaveLength(1);
    expect(new FormData(form).getAll('dietary')).toEqual([]);
  });
});

describe('ToggleChipGroup, inside Form', () => {
  const save = <button type="submit">Save</button>;

  it('hands onSubmit the pressed value, the list, and null for a single group with none', async () => {
    const onSubmit = vi.fn();
    render(
      <Form onSubmit={onSubmit}>
        <ToggleChipGroup
          selectionMode="single"
          label="Dish type"
          name="dish"
          options={dishOptions}
          defaultValue="side"
        />
        <ToggleChipGroup
          selectionMode="single"
          label="Other dish type"
          name="otherDish"
          options={dishOptions}
        />
        <ToggleChipGroup
          selectionMode="multiple"
          label="Dietary needs"
          name="dietary"
          options={dietaryOptions}
          defaultValue={['spicy', 'vegan']}
        />
        {save}
      </Form>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(onSubmit).toHaveBeenCalledWith({
      dish: 'side',
      otherDish: null,
      dietary: ['vegan', 'spicy'],
    });
  });

  it('hands onSubmit the current values after a press, and nothing for a disabled group', async () => {
    const onSubmit = vi.fn();
    render(
      <Form onSubmit={onSubmit}>
        <ToggleChipGroup
          selectionMode="multiple"
          label="Dietary needs"
          name="dietary"
          options={dietaryOptions}
          defaultValue={['vegan']}
        />
        <ToggleChipGroup
          selectionMode="single"
          label="Dish type"
          name="dish"
          options={dishOptions}
          defaultValue="side"
          disabled
        />
        {save}
      </Form>,
    );
    await userEvent.click(chip('Spicy'));
    await userEvent.click(chip('Vegan'));
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(onSubmit).toHaveBeenCalledWith({ dietary: ['spicy'] });
  });
});

describe('ToggleChipGroup, a Form error', () => {
  const save = <button type="submit">Save</button>;

  function dishGroup() {
    return (
      <ToggleChipGroup selectionMode="single" label="Dish type" name="dish" options={dishOptions} />
    );
  }

  it('shows an entry in errors, marks the group invalid and describes it by the message', () => {
    render(
      <Form onSubmit={vi.fn()} errors={{ dish: 'Not offered here.' }}>
        {dishGroup()}
      </Form>,
    );
    const group = screen.getByRole('group', { name: 'Dish type' });
    expect(screen.getByText('Not offered here.')).toBeVisible();
    expect(group).toHaveAttribute('aria-invalid', 'true');
    expect(group).toHaveAccessibleDescription('Not offered here.');
  });

  it('clears the entry, and the invalid mark, when a chip of a single group is pressed', async () => {
    render(
      <Form onSubmit={vi.fn()} errors={{ dish: 'Not offered here.' }}>
        {dishGroup()}
      </Form>,
    );
    await userEvent.click(chip('Side'));
    expect(screen.queryByText('Not offered here.')).toBeNull();
    const group = screen.getByRole('group', { name: 'Dish type' });
    expect(group).not.toHaveAttribute('aria-invalid');
    expect(group).not.toHaveAccessibleDescription();
  });

  it('clears the entry when the pressed list of a multiple group changes', async () => {
    render(
      <Form onSubmit={vi.fn()} errors={{ dietary: 'Too many allergies listed.' }}>
        <ToggleChipGroup
          selectionMode="multiple"
          label="Dietary needs"
          name="dietary"
          options={dietaryOptions}
          defaultValue={['vegan']}
        />
      </Form>,
    );
    expect(screen.getByText('Too many allergies listed.')).toBeVisible();
    await userEvent.click(chip('Spicy'));
    expect(screen.queryByText('Too many allergies listed.')).toBeNull();
  });

  it('stops the submit while the entry stands, and moves focus to the group', async () => {
    const onSubmit = vi.fn();
    render(
      <Form onSubmit={onSubmit} errors={{ dish: 'Not offered here.' }}>
        {dishGroup()}
        {save}
      </Form>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByRole('group', { name: 'Dish type' })).toHaveFocus();
  });

  it('lets Tab go on from the focused group to its first chip', async () => {
    render(
      <Form onSubmit={vi.fn()} errors={{ dish: 'Not offered here.' }}>
        {dishGroup()}
        {save}
      </Form>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    await userEvent.tab();
    expect(chip('Main dish')).toHaveFocus();
  });

  it('submits once a press has cleared the entry', async () => {
    const onSubmit = vi.fn();
    render(
      <Form onSubmit={onSubmit} errors={{ dish: 'Not offered here.' }}>
        {dishGroup()}
        {save}
      </Form>,
    );
    await userEvent.click(chip('Side'));
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(onSubmit).toHaveBeenCalledWith({ dish: 'side' });
  });

  it('lets an explicit error win over an entry', () => {
    render(
      <Form onSubmit={vi.fn()} errors={{ dish: 'From the server.' }}>
        <ToggleChipGroup
          selectionMode="single"
          label="Dish type"
          name="dish"
          options={dishOptions}
          error="Explicit."
        />
      </Form>,
    );
    expect(screen.getByText('Explicit.')).toBeVisible();
    expect(screen.queryByText('From the server.')).toBeNull();
  });

  it('shows no error for a group the entries do not name', () => {
    render(
      <Form onSubmit={vi.fn()} errors={{ other: 'Not this one.' }}>
        {dishGroup()}
      </Form>,
    );
    expect(screen.queryByText('Not this one.')).toBeNull();
    expect(screen.getByRole('group', { name: 'Dish type' })).not.toHaveAttribute('aria-invalid');
  });
});

describe('ToggleChipGroup, the frame', () => {
  it('describes the group by the error, and marks it invalid', () => {
    render(<WithError />);
    const group = screen.getByRole('group', { name: /Dish type/ });
    expect(group).toHaveAttribute('aria-invalid', 'true');
    expect(group).toHaveAccessibleDescription('Choose a dish type.');
    expect(screen.getByText('Choose a dish type.')).toBeVisible();
  });

  it('marks the group data-invalid, which the chips’ danger ring reads, only while invalid', () => {
    const { unmount } = render(<WithError />);
    const group = screen.getByRole('group', { name: /Dish type/ });
    expect(group).toHaveClass(styles.group);
    expect(group).toHaveAttribute('data-invalid');
    expect(chip('Side').closest(`.${styles.group}`)).toBe(group);
    unmount();
    render(<SingleGroup />);
    expect(screen.getByRole('group', { name: 'Dish type' })).not.toHaveAttribute('data-invalid');
  });

  it('describes the group by its description', () => {
    render(<MultipleGroup />);
    const group = screen.getByRole('group', { name: 'Dietary needs' });
    expect(group).toHaveAccessibleDescription('Tell the host what you cannot eat.');
    expect(group).not.toHaveAttribute('aria-invalid');
  });

  it('describes the group by both, the description first', () => {
    render(
      <ToggleChipGroup
        selectionMode="single"
        label="Dish type"
        options={dishOptions}
        description="Pick the nearest."
        error="Choose a dish type."
      />,
    );
    expect(screen.getByRole('group', { name: 'Dish type' })).toHaveAccessibleDescription(
      'Pick the nearest. Choose a dish type.',
    );
  });

  it('carries no description attribute and no invalid mark when neither is given', () => {
    render(<SingleGroup />);
    const group = screen.getByRole('group', { name: 'Dish type' });
    expect(group).not.toHaveAttribute('aria-describedby');
    expect(group).not.toHaveAttribute('aria-invalid');
  });

  it('renders no description node for a description that is false or null', () => {
    const { rerender } = render(
      <ToggleChipGroup
        selectionMode="single"
        label="Dish type"
        options={dishOptions}
        description={false}
      />,
    );
    expect(screen.getByRole('group', { name: 'Dish type' })).not.toHaveAttribute(
      'aria-describedby',
    );
    rerender(
      <ToggleChipGroup
        selectionMode="single"
        label="Dish type"
        options={dishOptions}
        description={null}
      />,
    );
    expect(screen.getByRole('group', { name: 'Dish type' })).not.toHaveAttribute(
      'aria-describedby',
    );
  });

  it('draws the required mark after the label, hidden from assistive technology', () => {
    const { container } = render(<Required />);
    const mark = container.querySelector(`.${fieldStyles.required}`);
    expect(mark).not.toBeNull();
    expect(mark).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByRole('group', { name: 'Dish type' })).toBeInTheDocument();
  });

  it('draws no required mark unless it is required', () => {
    const { container } = render(<SingleGroup />);
    expect(container.querySelector(`.${fieldStyles.required}`)).toBeNull();
  });

  it('calls onBlur when focus leaves the group', async () => {
    const onBlur = vi.fn();
    render(
      <>
        <ToggleChipGroup
          selectionMode="single"
          label="Dish type"
          options={dishOptions}
          onBlur={onBlur}
        />
        <button type="button">After</button>
      </>,
    );
    await userEvent.tab();
    expect(onBlur).not.toHaveBeenCalled();
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'After' })).toHaveFocus();
    expect(onBlur).toHaveBeenCalled();
  });
});

describe('ToggleChipGroup, disabled', () => {
  it('cannot press the disabled option, and the arrow keys step over it', async () => {
    const onValueChange = vi.fn();
    render(
      <ToggleChipGroup
        selectionMode="single"
        label="Dish type"
        options={dishOptions.map((option) =>
          option.value === 'side' ? { ...option, disabled: true } : option,
        )}
        onValueChange={onValueChange}
      />,
    );
    expect(chip('Side')).toBeDisabled();
    expect(chip('Dessert')).not.toBeDisabled();
    await userEvent.click(chip('Side'));
    expect(onValueChange).not.toHaveBeenCalled();
    expect(chip('Side')).toHaveAttribute('aria-pressed', 'false');
    await userEvent.tab();
    expect(chip('Main dish')).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');
    expect(chip('Dessert')).toHaveFocus();
  });

  it('disables the fourth chip in DisabledOption', () => {
    render(<DisabledOption />);
    expect(chip('Drink')).toBeDisabled();
    expect(chip('Main dish')).not.toBeDisabled();
  });

  it('disables every chip when the group is disabled, and reports nothing', async () => {
    const onValueChange = vi.fn();
    render(
      <ToggleChipGroup
        selectionMode="multiple"
        label="Dietary needs"
        options={dietaryOptions}
        disabled
        onValueChange={onValueChange}
      />,
    );
    for (const button of screen.getAllByRole('button')) {
      expect(button).toBeDisabled();
    }
    await userEvent.click(chip('Vegan'));
    expect(onValueChange).not.toHaveBeenCalled();
    expect(pressedLabels()).toEqual([]);
  });

  it('dims the group’s label when the group is disabled', () => {
    const { container } = render(
      <ToggleChipGroup selectionMode="single" label="Dish type" options={dishOptions} disabled />,
    );
    expect(container.querySelector(`.${fieldStyles.legend}`)).toHaveAttribute('data-disabled');
  });

  it('leaves the label undimmed otherwise', () => {
    const { container } = render(<SingleGroup />);
    expect(container.querySelector(`.${fieldStyles.legend}`)).not.toHaveAttribute('data-disabled');
  });
});
