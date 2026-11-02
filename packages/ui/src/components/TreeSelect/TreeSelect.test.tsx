import { composeStories } from '@storybook/react';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState, type FormEvent } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { axeDocument } from '../../../test/axe';
import { Form } from '../Form/Form';
import type { TreeItem } from '../Tree/Tree';
import { TreeSelect, type TreeSelectProps } from './TreeSelect';
import * as stories from './TreeSelect.stories';

const allStories = composeStories(stories);

const items: TreeItem[] = [
  {
    id: 'engineering',
    label: 'Engineering',
    children: [
      { id: 'platform', label: 'Platform' },
      {
        id: 'product',
        label: 'Product',
        children: [
          { id: 'web', label: 'Web' },
          { id: 'mobile', label: 'Mobile' },
        ],
      },
    ],
  },
  {
    id: 'operations',
    label: 'Operations',
    children: [{ id: 'legal', label: 'Legal', disabled: true }],
  },
  { id: 'design', label: 'Design' },
];

function renderSelect(props: Partial<TreeSelectProps> = {}) {
  return render(<TreeSelect label="Team" name="team" items={items} {...props} />);
}

function trigger(name: RegExp | string = /^Team/) {
  return screen.getByRole('button', { name });
}

function node(name: string) {
  return screen.getByRole('treeitem', { name });
}

async function openTree(name?: RegExp | string) {
  await userEvent.click(trigger(name));
  return screen.findByRole('tree');
}

function hiddenValue() {
  return document.querySelector<HTMLInputElement>('input[type="hidden"][name="team"]')?.value;
}

/** Base UI hands focus back on a frame. */
async function expectFocusBack(element: HTMLElement) {
  await waitFor(() => expect(element).toHaveFocus());
}

describe('TreeSelect', () => {
  it.each(Object.entries(allStories))('%s has no axe violations', async (_name, Story) => {
    render(<Story />);
    expect(await axeDocument()).toHaveNoViolations();
  });

  it.each(['Default', 'Chosen', 'Dark', 'LongLabels'] as const)(
    '%s has no axe violations while open',
    async (name) => {
      const Story = allStories[name];
      render(<Story />);
      await openTree();
      expect(await axeDocument()).toHaveNoViolations();
    },
  );

  describe('the frame', () => {
    it('is a button named by the label and the choice', () => {
      renderSelect({ defaultValue: 'web' });
      const button = trigger('Team Web');
      expect(button.tagName).toBe('BUTTON');
      expect(button).toHaveAttribute('type', 'button');
      expect(button).toHaveAttribute('aria-expanded', 'false');
      expect(button).toHaveClass('control');
    });

    it('shows the placeholder while nothing is chosen', () => {
      renderSelect({ placeholder: 'Any team' });
      expect(trigger('Team Any team')).toBeVisible();
    });

    it('says required in its name, since a button cannot carry aria-required', () => {
      renderSelect({ required: true });
      expect(trigger('Team required Select…')).not.toHaveAttribute('aria-required');
    });

    it('is described by its description and its error, and marked invalid', () => {
      renderSelect({ description: 'Who owns it.', error: 'Not this one.' });
      expect(trigger()).toHaveAttribute('aria-invalid', 'true');
      expect(trigger()).toHaveAttribute('data-invalid');
      expect(trigger()).toHaveAccessibleDescription('Who owns it. Not this one.');
    });

    it('does not open when disabled, and submits nothing', async () => {
      renderSelect({ disabled: true, defaultValue: 'web' });
      expect(trigger()).toBeDisabled();
      await userEvent.click(trigger());
      expect(screen.queryByRole('tree')).toBeNull();
      expect(document.querySelector<HTMLInputElement>('input[type="hidden"]')).toBeDisabled();
    });

    it('closes if it becomes disabled while open', async () => {
      const { rerender } = renderSelect();
      await openTree();
      rerender(<TreeSelect label="Team" name="team" items={items} disabled />);
      await waitFor(() => expect(screen.queryByRole('tree')).toBeNull());
    });

    it('calls onBlur as focus leaves the trigger', async () => {
      const onBlur = vi.fn();
      renderSelect({ onBlur });
      trigger().focus();
      await userEvent.tab();
      expect(onBlur).toHaveBeenCalled();
    });

    it('submits the id through a hidden input', async () => {
      renderSelect({ defaultValue: 'web' });
      expect(hiddenValue()).toBe('web');
      await openTree();
      await userEvent.click(screen.getByText('Design'));
      await waitFor(() => expect(hiddenValue()).toBe('design'));
    });
  });

  describe('a value no node holds', () => {
    it('reads as nothing chosen, and reports nothing', () => {
      const onValueChange = vi.fn();
      renderSelect({ value: 'ghost', onValueChange });
      expect(trigger('Team Select…')).toBeVisible();
      expect(hiddenValue()).toBe('');
      expect(onValueChange).not.toHaveBeenCalled();
    });

    it('offers nothing to clear', () => {
      renderSelect({ defaultValue: 'ghost', clearable: true });
      expect(screen.queryByRole('button', { name: 'Clear Team' })).toBeNull();
    });

    it('selects nothing in the tree', async () => {
      renderSelect({ value: 'ghost' });
      await openTree();
      expect(screen.queryByRole('treeitem', { selected: true })).toBeNull();
    });

    it('comes right when the items arrive that hold it', () => {
      const { rerender } = render(<TreeSelect label="Team" items={[]} value="design" />);
      expect(trigger('Team Select…')).toBeVisible();
      rerender(<TreeSelect label="Team" items={items} value="design" />);
      expect(trigger('Team Design')).toBeVisible();
    });

    it('is refused by Form when required', async () => {
      const onSubmit = vi.fn();
      render(
        <Form aria-label="Budget" onSubmit={onSubmit}>
          <TreeSelect label="Team" name="team" items={items} required value="ghost" />
          <button type="submit">Save</button>
        </Form>,
      );
      await userEvent.click(screen.getByRole('button', { name: 'Save' }));
      expect(onSubmit).not.toHaveBeenCalled();
      expect(await screen.findByText('Choose an option.')).toBeVisible();
    });
  });

  describe('a value on a disabled node, which is the app’s to set', () => {
    it('shows on the trigger', () => {
      renderSelect({ defaultValue: 'legal' });
      expect(trigger('Team Legal')).toBeVisible();
    });

    it('shows when controlled as well', () => {
      renderSelect({ value: 'legal' });
      expect(trigger('Team Legal')).toBeVisible();
    });

    it('submits through the hidden input', () => {
      renderSelect({ defaultValue: 'legal' });
      expect(hiddenValue()).toBe('legal');
    });

    it('is selected in the tree', async () => {
      renderSelect({ defaultValue: 'legal' });
      await openTree();
      await waitFor(() => expect(node('Legal')).toHaveFocus());
      expect(node('Legal')).toHaveAttribute('aria-selected', 'true');
    });

    it('reaches Form as the value, and Form accepts it', async () => {
      const onSubmit = vi.fn();
      render(
        <Form aria-label="Budget" onSubmit={onSubmit}>
          <TreeSelect label="Team" name="team" items={items} defaultValue="legal" />
          <button type="submit">Save</button>
        </Form>,
      );
      await userEvent.click(screen.getByRole('button', { name: 'Save' }));
      expect(onSubmit).toHaveBeenCalledWith({ team: 'legal' });
    });

    it('satisfies required in Form', async () => {
      const onSubmit = vi.fn();
      render(
        <Form aria-label="Budget" onSubmit={onSubmit}>
          <TreeSelect label="Team" name="team" items={items} required value="legal" />
          <button type="submit">Save</button>
        </Form>,
      );
      await userEvent.click(screen.getByRole('button', { name: 'Save' }));
      expect(onSubmit).toHaveBeenCalledWith({ team: 'legal' });
      expect(screen.queryByText('Choose an option.')).toBeNull();
    });

    it('can be cleared', async () => {
      const onValueChange = vi.fn();
      renderSelect({ defaultValue: 'legal', clearable: true, onValueChange });
      await userEvent.click(screen.getByRole('button', { name: 'Clear Team' }));
      expect(onValueChange).toHaveBeenCalledWith(null);
    });
  });

  describe('opening', () => {
    it('moves focus to the chosen node, opening the branches around it', async () => {
      renderSelect({ defaultValue: 'web' });
      await openTree();
      await waitFor(() => expect(node('Web')).toHaveFocus());
      expect(node('Web')).toHaveAttribute('aria-selected', 'true');
      expect(node('Engineering')).toHaveAttribute('aria-expanded', 'true');
      expect(node('Product')).toHaveAttribute('aria-expanded', 'true');
    });

    it('moves focus to the first enabled node when nothing is chosen', async () => {
      renderSelect();
      await openTree();
      await waitFor(() => expect(node('Engineering')).toHaveFocus());
    });

    it('opens by keyboard', async () => {
      renderSelect();
      trigger().focus();
      await userEvent.keyboard('{Enter}');
      await waitFor(() => expect(node('Engineering')).toHaveFocus());
    });

    describe('by the arrow keys on the trigger, as Select does', () => {
      it.each(['{ArrowDown}', '{ArrowUp}'])(
        '%s lands on the chosen node, with the branches around it open',
        async (key) => {
          renderSelect({ defaultValue: 'web' });
          trigger().focus();
          await userEvent.keyboard(key);
          await waitFor(() => expect(node('Web')).toHaveFocus());
          expect(node('Engineering')).toHaveAttribute('aria-expanded', 'true');
          expect(node('Product')).toHaveAttribute('aria-expanded', 'true');
        },
      );

      it.each(['{ArrowDown}', '{ArrowUp}'])(
        '%s lands on the first enabled node when nothing is chosen',
        async (key) => {
          renderSelect();
          trigger().focus();
          await userEvent.keyboard(key);
          await waitFor(() => expect(node('Engineering')).toHaveFocus());
        },
      );

      it('keeps the page from scrolling', () => {
        renderSelect();
        trigger().focus();
        const event = new KeyboardEvent('keydown', {
          key: 'ArrowDown',
          bubbles: true,
          cancelable: true,
        });
        act(() => {
          trigger().dispatchEvent(event);
        });
        expect(event.defaultPrevented).toBe(true);
      });

      it('leaves other keys to the page, and does not open on them', async () => {
        renderSelect();
        trigger().focus();
        await userEvent.keyboard('{ArrowLeft}{ArrowRight}a');
        expect(screen.queryByRole('tree')).toBeNull();
      });

      it('returns focus to the trigger on Escape', async () => {
        renderSelect({ defaultValue: 'web' });
        trigger().focus();
        await userEvent.keyboard('{ArrowDown}');
        await waitFor(() => expect(node('Web')).toHaveFocus());
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(screen.queryByRole('tree')).toBeNull());
        await expectFocusBack(trigger());
      });

      it('returns focus to the trigger after choosing', async () => {
        renderSelect();
        trigger().focus();
        await userEvent.keyboard('{ArrowDown}');
        await waitFor(() => expect(node('Engineering')).toHaveFocus());
        await userEvent.keyboard('{End}{Enter}');
        await waitFor(() => expect(screen.queryByRole('tree')).toBeNull());
        await expectFocusBack(trigger('Team Design'));
      });
    });

    it('names the tree and the popup after the field', async () => {
      renderSelect();
      const tree = await openTree();
      expect(tree).toHaveAccessibleName('Team');
      expect(screen.getByRole('dialog', { name: 'Team' })).toBeVisible();
    });

    it('keeps the branches open across openings', async () => {
      renderSelect();
      await openTree();
      await waitFor(() => expect(node('Engineering')).toHaveFocus());
      await userEvent.keyboard('{ArrowRight}{Escape}');
      await waitFor(() => expect(screen.queryByRole('tree')).toBeNull());
      await openTree();
      expect(node('Engineering')).toHaveAttribute('aria-expanded', 'true');
    });

    it('keeps the open branches when reopening with a value chosen', async () => {
      renderSelect({ defaultValue: 'web' });
      await openTree();
      await waitFor(() => expect(node('Web')).toHaveFocus());
      await userEvent.keyboard('{End}');
      expect(node('Design')).toHaveFocus();
      await userEvent.keyboard('{ArrowUp}{ArrowRight}{Escape}');
      await waitFor(() => expect(screen.queryByRole('tree')).toBeNull());
      await openTree();
      await waitFor(() => expect(node('Web')).toHaveFocus());
      expect(node('Operations')).toHaveAttribute('aria-expanded', 'true');
      expect(node('Product')).toHaveAttribute('aria-expanded', 'true');
    });
  });

  describe('with no items', () => {
    function renderEmpty(props: Partial<TreeSelectProps> = {}) {
      return render(
        <>
          <TreeSelect label="Team" name="team" items={[]} {...props} />
          <button type="button">After</button>
        </>,
      );
    }

    it('says so in the popup, in place of a tree', async () => {
      renderEmpty();
      await userEvent.click(trigger());
      const dialog = await screen.findByRole('dialog', { name: 'Team' });
      expect(dialog).toHaveTextContent('No options');
      expect(dialog).toHaveAccessibleDescription('No options');
      expect(screen.queryByRole('tree')).toBeNull();
    });

    it('takes the words from labels', async () => {
      renderEmpty({ labels: { empty: 'Sin opciones' } });
      await userEvent.click(trigger());
      expect(await screen.findByText('Sin opciones')).toBeVisible();
    });

    it('has no axe violations while open', async () => {
      renderEmpty();
      await userEvent.click(trigger());
      await screen.findByRole('dialog');
      expect(await axeDocument()).toHaveNoViolations();
    });

    it.each(['{Enter}', '{ArrowDown}'])(
      'puts focus on the popup when opened with %s, and Escape brings it back',
      async (key) => {
        renderEmpty();
        trigger().focus();
        await userEvent.keyboard(key);
        const dialog = await screen.findByRole('dialog');
        await waitFor(() => expect(dialog).toHaveFocus());
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
        await expectFocusBack(trigger());
      },
    );

    it('closes when Tab leaves it', async () => {
      renderEmpty();
      await userEvent.click(trigger());
      await waitFor(() => expect(screen.getByRole('dialog')).toHaveFocus());
      await userEvent.tab();
      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
      expect(screen.getByRole('button', { name: 'After' })).toHaveFocus();
    });

    it('shows the tree when items arrive while it is open, and can be left', async () => {
      const { rerender } = render(<TreeSelect label="Team" items={[]} />);
      await userEvent.click(trigger());
      await waitFor(() => expect(screen.getByRole('dialog')).toHaveFocus());
      rerender(<TreeSelect label="Team" items={items} />);
      expect(screen.getByRole('tree')).toBeVisible();
      expect(screen.queryByText('No options')).toBeNull();
      await userEvent.keyboard('{Escape}');
      await waitFor(() => expect(screen.queryByRole('tree')).toBeNull());
      await expectFocusBack(trigger());
    });

    it('keeps focus in the popup when the items all go while it is open', async () => {
      const { rerender } = render(<TreeSelect label="Team" items={items} />);
      await openTree();
      await waitFor(() => expect(node('Engineering')).toHaveFocus());
      rerender(<TreeSelect label="Team" items={[]} />);
      await waitFor(() => expect(screen.getByRole('dialog')).toHaveFocus());
      await userEvent.keyboard('{Escape}');
      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
      await expectFocusBack(trigger());
    });
  });

  describe('closing', () => {
    it('closes on Escape and returns focus, choosing nothing', async () => {
      const onValueChange = vi.fn();
      renderSelect({ onValueChange });
      await openTree();
      await waitFor(() => expect(node('Engineering')).toHaveFocus());
      await userEvent.keyboard('{Escape}');
      await waitFor(() => expect(screen.queryByRole('tree')).toBeNull());
      await expectFocusBack(trigger());
      expect(onValueChange).not.toHaveBeenCalled();
    });

    it.each(['{Enter}', ' '])('selects with %s, closes and returns focus', async (key) => {
      const onValueChange = vi.fn();
      renderSelect({ onValueChange });
      await openTree();
      await waitFor(() => expect(node('Engineering')).toHaveFocus());
      await userEvent.keyboard('{End}');
      await userEvent.keyboard(key);
      expect(onValueChange).toHaveBeenCalledTimes(1);
      expect(onValueChange).toHaveBeenCalledWith('design');
      await waitFor(() => expect(screen.queryByRole('tree')).toBeNull());
      await expectFocusBack(trigger('Team Design'));
    });

    it('selects by pointer, closes and returns focus', async () => {
      const onValueChange = vi.fn();
      renderSelect({ onValueChange });
      await openTree();
      await userEvent.click(screen.getByText('Design'));
      expect(onValueChange).toHaveBeenCalledWith('design');
      await waitFor(() => expect(screen.queryByRole('tree')).toBeNull());
      await expectFocusBack(trigger('Team Design'));
    });

    it('closes on pressing the node already chosen, reporting nothing', async () => {
      const onValueChange = vi.fn();
      renderSelect({ defaultValue: 'design', onValueChange });
      await openTree();
      await waitFor(() => expect(node('Design')).toHaveFocus());
      await userEvent.keyboard('{Enter}');
      await waitFor(() => expect(screen.queryByRole('tree')).toBeNull());
      await expectFocusBack(trigger());
      expect(onValueChange).not.toHaveBeenCalled();
    });

    it('stays open on a disabled node', async () => {
      const onValueChange = vi.fn();
      renderSelect({ defaultValue: 'legal', onValueChange });
      await openTree();
      await waitFor(() => expect(node('Legal')).toHaveFocus());
      await userEvent.keyboard('{Enter}');
      expect(screen.getByRole('tree')).toBeVisible();
      expect(onValueChange).not.toHaveBeenCalled();
    });

    it('stays open as branches open and close', async () => {
      renderSelect();
      await openTree();
      await waitFor(() => expect(node('Engineering')).toHaveFocus());
      await userEvent.keyboard('{ArrowRight}{ArrowLeft}');
      expect(screen.getByRole('tree')).toBeVisible();
    });

    it('closes when something outside is pressed, leaving focus there', async () => {
      render(
        <>
          <TreeSelect label="Team" items={items} />
          <button type="button">Elsewhere</button>
        </>,
      );
      await openTree();
      await userEvent.click(screen.getByRole('button', { name: 'Elsewhere' }));
      await waitFor(() => expect(screen.queryByRole('tree')).toBeNull());
      expect(screen.getByRole('button', { name: 'Elsewhere' })).toHaveFocus();
    });

    describe('the Tab key, since nothing traps it', () => {
      function renderBetween() {
        render(
          <>
            <button type="button">Before</button>
            <TreeSelect label="Team" items={items} />
            <button type="button">After</button>
          </>,
        );
      }

      async function openOnFirstNode() {
        await openTree();
        await waitFor(() => expect(node('Engineering')).toHaveFocus());
      }

      it('closes and moves on to what follows with Tab', async () => {
        renderBetween();
        await openOnFirstNode();
        await userEvent.tab();
        await waitFor(() => expect(screen.queryByRole('tree')).toBeNull());
        expect(screen.getByRole('button', { name: 'After' })).toHaveFocus();
      });

      it('goes to the trigger with Shift+Tab, and leaves the popup open', async () => {
        renderBetween();
        await openOnFirstNode();
        await userEvent.tab({ shift: true });
        await expectFocusBack(trigger());
        expect(screen.getByRole('tree')).toBeVisible();
      });

      // Where focus goes from there is the browser's to work out, past focus guards jsdom cannot
      // tab through: it lands on what comes before the trigger in real Chromium.
      it('closes with a second Shift+Tab', async () => {
        renderBetween();
        await openOnFirstNode();
        await userEvent.tab({ shift: true });
        await expectFocusBack(trigger());
        await userEvent.tab({ shift: true });
        await waitFor(() => expect(screen.queryByRole('tree')).toBeNull());
        expect(trigger()).not.toHaveFocus();
      });

      it('closes with Escape after Shift+Tab, with focus on the trigger', async () => {
        renderBetween();
        await openOnFirstNode();
        await userEvent.tab({ shift: true });
        await expectFocusBack(trigger());
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(screen.queryByRole('tree')).toBeNull());
        await expectFocusBack(trigger());
      });
    });
  });

  describe('clearable', () => {
    it('is a real button beside the trigger, named after the field', () => {
      renderSelect({ clearable: true, defaultValue: 'web' });
      const clear = screen.getByRole('button', { name: 'Clear Team' });
      expect(trigger().contains(clear)).toBe(false);
      expect(clear.closest('button')).toBe(clear);
    });

    it('takes its name from labels', () => {
      renderSelect({ clearable: true, defaultValue: 'web', labels: { clear: 'Vaciar' } });
      expect(screen.getByRole('button', { name: 'Vaciar' })).toBeVisible();
    });

    it('clears, reports null and puts focus on the trigger', async () => {
      const onValueChange = vi.fn();
      renderSelect({ clearable: true, defaultValue: 'web', onValueChange });
      await userEvent.click(screen.getByRole('button', { name: 'Clear Team' }));
      expect(onValueChange).toHaveBeenCalledWith(null);
      expect(trigger('Team Select…')).toHaveFocus();
      expect(screen.queryByRole('button', { name: 'Clear Team' })).toBeNull();
      expect(hiddenValue()).toBe('');
    });

    it('is absent with nothing chosen, and when disabled', () => {
      const { rerender } = renderSelect({ clearable: true });
      expect(screen.queryByRole('button', { name: 'Clear Team' })).toBeNull();
      rerender(<TreeSelect label="Team" items={items} clearable disabled defaultValue="web" />);
      expect(screen.queryByRole('button', { name: 'Clear Team' })).toBeNull();
    });
  });

  describe('controlled and uncontrolled', () => {
    it('does what the parent says when controlled', async () => {
      const onValueChange = vi.fn();
      const { rerender } = render(
        <TreeSelect label="Team" items={items} value="design" onValueChange={onValueChange} />,
      );
      await openTree();
      await userEvent.click(screen.getByText('Engineering'));
      expect(onValueChange).toHaveBeenCalledWith('engineering');
      expect(trigger('Team Design')).toBeVisible();
      rerender(
        <TreeSelect label="Team" items={items} value="platform" onValueChange={onValueChange} />,
      );
      expect(trigger('Team Platform')).toBeVisible();
      rerender(<TreeSelect label="Team" items={items} value={null} />);
      expect(trigger('Team Select…')).toBeVisible();
    });

    it('holds up with state in a parent', async () => {
      function Parent() {
        const [team, setTeam] = useState<string | null>('design');
        return (
          <TreeSelect label="Team" items={items} value={team} onValueChange={setTeam} clearable />
        );
      }
      render(<Parent />);
      await userEvent.click(screen.getByRole('button', { name: 'Clear Team' }));
      expect(trigger('Team Select…')).toBeVisible();
      await openTree();
      await userEvent.click(screen.getByText('Engineering'));
      await waitFor(() => expect(trigger('Team Engineering')).toBeVisible());
    });

    it('does not lose anything to an inline items prop', async () => {
      const inline = () => structuredClone(items);
      const { rerender } = render(<TreeSelect label="Team" items={inline()} defaultValue="web" />);
      await openTree();
      await waitFor(() => expect(node('Web')).toHaveFocus());
      await userEvent.keyboard('{ArrowDown}');
      expect(node('Mobile')).toHaveFocus();
      rerender(<TreeSelect label="Team" items={inline()} defaultValue="web" />);
      expect(node('Mobile')).toHaveFocus();
      expect(node('Web')).toHaveAttribute('aria-selected', 'true');
      expect(node('Product')).toHaveAttribute('aria-expanded', 'true');
    });
  });

  describe('inside Form', () => {
    function renderForm(
      props: Partial<TreeSelectProps> = {},
      formProps: { errors?: Record<string, string> } = {},
    ) {
      const onSubmit = vi.fn();
      render(
        <Form aria-label="Budget" onSubmit={onSubmit} {...formProps}>
          <TreeSelect label="Team" name="team" items={items} {...props} />
          <button type="submit">Save</button>
        </Form>,
      );
      return onSubmit;
    }
    const save = () => userEvent.click(screen.getByRole('button', { name: 'Save' }));

    it('hands onSubmit a plain id', async () => {
      const onSubmit = renderForm({ defaultValue: 'web' });
      await save();
      expect(onSubmit).toHaveBeenCalledWith({ team: 'web' });
    });

    it('hands onSubmit null with nothing chosen', async () => {
      const onSubmit = renderForm();
      await save();
      expect(onSubmit).toHaveBeenCalledWith({ team: null });
    });

    it('leaves a disabled field out', async () => {
      const onSubmit = renderForm({ disabled: true, defaultValue: 'web' });
      await save();
      expect(onSubmit).toHaveBeenCalledWith({});
    });

    it('refuses a required field left empty, says so and takes focus', async () => {
      const onSubmit = renderForm({ required: true });
      await save();
      expect(onSubmit).not.toHaveBeenCalled();
      expect(await screen.findByText('Choose an option.')).toBeVisible();
      expect(trigger()).toHaveAttribute('aria-invalid', 'true');
      await expectFocusBack(trigger());
    });

    it('takes its required message from labels', async () => {
      renderForm({ required: true, labels: { requiredMessage: 'Elige un equipo.' } });
      await save();
      expect(await screen.findByText('Elige un equipo.')).toBeVisible();
    });

    it('clears the required message once something is chosen, and submits', async () => {
      const onSubmit = renderForm({ required: true });
      await save();
      await screen.findByText('Choose an option.');
      await openTree();
      await userEvent.click(screen.getByText('Design'));
      await waitFor(() => expect(trigger('Team required Design')).toBeVisible());
      await waitFor(() => expect(screen.queryByText('Choose an option.')).toBeNull());
      await save();
      expect(onSubmit).toHaveBeenCalledWith({ team: 'design' });
    });

    it('shows an entry from errors, is focused first and clears when changed', async () => {
      const onSubmit = renderForm({ defaultValue: 'web' }, { errors: { team: 'Taken.' } });
      expect(await screen.findByText('Taken.')).toBeVisible();
      expect(trigger()).toHaveAttribute('aria-invalid', 'true');
      await save();
      expect(onSubmit).not.toHaveBeenCalled();
      await expectFocusBack(trigger());
      await openTree();
      await userEvent.click(screen.getByText('Design'));
      await waitFor(() => expect(screen.queryByText('Taken.')).toBeNull());
    });

    it('lets an explicit error win over an entry from errors', async () => {
      renderForm({ error: 'Explicit.' }, { errors: { team: 'From the form.' } });
      expect(await screen.findByText('Explicit.')).toBeVisible();
      expect(screen.queryByText('From the form.')).toBeNull();
    });
  });

  describe('a native reset', () => {
    async function resetForm(form: HTMLFormElement) {
      await act(async () => {
        form.reset();
        await new Promise((resolve) => {
          setTimeout(resolve);
        });
      });
    }

    function renderPlain(props: Partial<TreeSelectProps> = {}) {
      render(
        <form aria-label="Plan" onSubmit={(event: FormEvent) => event.preventDefault()}>
          <TreeSelect label="Team" name="team" items={items} {...props} />
        </form>,
      );
      return screen.getByRole<HTMLFormElement>('form', { name: 'Plan' });
    }

    it('goes back to the default value, and says so', async () => {
      const onValueChange = vi.fn();
      const form = renderPlain({ defaultValue: 'web', onValueChange });
      await openTree();
      await userEvent.click(screen.getByText('Mobile'));
      expect(onValueChange).toHaveBeenLastCalledWith('mobile');
      await resetForm(form);
      expect(trigger('Team Web')).toBeVisible();
      expect(hiddenValue()).toBe('web');
      expect(onValueChange).toHaveBeenLastCalledWith('web');
    });

    it('goes back to nothing, with no default', async () => {
      const onValueChange = vi.fn();
      const form = renderPlain({ onValueChange });
      await openTree();
      await userEvent.click(screen.getByText('Design'));
      await resetForm(form);
      expect(trigger('Team Select…')).toBeVisible();
      expect(onValueChange).toHaveBeenLastCalledWith(null);
    });

    it('reports nothing when it is already back, or when the default names no node', async () => {
      const onValueChange = vi.fn();
      const form = renderPlain({ defaultValue: 'ghost', onValueChange });
      await resetForm(form);
      expect(onValueChange).not.toHaveBeenCalled();
    });

    it('stays put when controlled, as the parent’s to change', async () => {
      const onValueChange = vi.fn();
      const form = renderPlain({ value: 'design', defaultValue: 'web', onValueChange });
      await resetForm(form);
      expect(trigger('Team Design')).toBeVisible();
      expect(onValueChange).not.toHaveBeenCalled();
    });
  });
});
