import { composeStories } from '@storybook/react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { axeDocument } from '../../../test/axe';
import { Field } from '../Field/Field';
import { TextArea } from './TextArea';
import * as stories from './TextArea.stories';

const { Default, Described, Prefilled, AutoResize, Required, Disabled, WithError, Dark } =
  composeStories(stories);

describe('TextArea', () => {
  it.each([
    ['Default', Default],
    ['Described', Described],
    ['Prefilled', Prefilled],
    ['AutoResize', AutoResize],
    ['Required', Required],
    ['Disabled', Disabled],
    ['WithError', WithError],
    ['Dark', Dark],
  ])('%s has no axe violations', async (_name, Story) => {
    render(<Story />);
    expect(await axeDocument()).toHaveNoViolations();
  });

  it('is a real textarea, named by the Field around it, four rows tall by default', () => {
    render(<Default />);
    const textArea = screen.getByRole('textbox', { name: 'Notes' });
    expect(textArea.tagName).toBe('TEXTAREA');
    expect(textArea).toHaveAttribute('rows', '4');
    expect(textArea).toHaveAttribute('name', 'notes');
  });

  it('takes rows, and the other textarea attributes a caller is allowed', () => {
    render(
      <Field label="Notes">
        <TextArea rows={8} placeholder="Anything else?" maxLength={200} aria-describedby="hint" />
      </Field>,
    );
    const textArea = screen.getByRole('textbox', { name: 'Notes' });
    expect(textArea).toHaveAttribute('rows', '8');
    expect(textArea).toHaveAttribute('placeholder', 'Anything else?');
    expect(textArea).toHaveAttribute('maxlength', '200');
  });

  it('reports each change as one string argument', async () => {
    const onValueChange = vi.fn();
    render(
      <Field label="Notes">
        <TextArea onValueChange={onValueChange} />
      </Field>,
    );
    await userEvent.type(screen.getByRole('textbox', { name: 'Notes' }), 'hi');
    expect(onValueChange).toHaveBeenCalledTimes(2);
    expect(onValueChange).toHaveBeenLastCalledWith('hi');
  });

  it('takes Enter as a newline, and does not submit the form around it', async () => {
    const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault());
    render(
      <form onSubmit={onSubmit}>
        <Field label="Notes">
          <TextArea />
        </Field>
      </form>,
    );
    const textArea = screen.getByRole('textbox', { name: 'Notes' });
    await userEvent.type(textArea, 'one{Enter}two');
    expect(textArea).toHaveValue('one\ntwo');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('follows a controlled value past first mount, and warns about nothing', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    function Controlled() {
      const [notes, setNotes] = useState('first');
      return (
        <>
          <Field label="Notes">
            <TextArea value={notes} onValueChange={setNotes} />
          </Field>
          <button type="button" onClick={() => setNotes('')}>
            Empty
          </button>
        </>
      );
    }
    render(<Controlled />);
    const textArea = screen.getByRole('textbox', { name: 'Notes' });
    expect(textArea).toHaveValue('first');
    await userEvent.type(textArea, '!');
    expect(textArea).toHaveValue('first!');
    await userEvent.click(screen.getByRole('button', { name: 'Empty' }));
    expect(textArea).toHaveValue('');
    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it('reads required from the Field and disabled through it', () => {
    render(<Required />);
    expect(screen.getByRole('textbox', { name: 'Notes' })).toBeRequired();
    render(<Disabled />);
    expect(screen.getAllByRole('textbox', { name: 'Notes' })[1]).toBeDisabled();
  });

  it('is described by the error and marked invalid', () => {
    render(<WithError />);
    const textArea = screen.getByRole('textbox', { name: 'Notes' });
    expect(textArea).toHaveAttribute('aria-invalid', 'true');
    expect(textArea).toHaveAccessibleDescription('Say a little more.');
  });

  /**
   * jsdom has no layout and does not implement `field-sizing`, so these only prove the wiring and
   * the stylesheet's text. That a real browser grows the box is checked in Chromium by hand; the
   * report for this change says what was measured.
   */
  describe('autoResize', () => {
    const stylesheet = readFileSync(
      path.join(import.meta.dirname, 'TextArea.module.css'),
      'utf8',
    ).replace(/\/\*[\s\S]*?\*\//g, '');

    it('is off unless asked for', () => {
      render(<Default />);
      expect(screen.getByRole('textbox', { name: 'Notes' })).not.toHaveAttribute(
        'data-auto-resize',
      );
    });

    it('marks the element and hands the row count to the stylesheet', () => {
      render(
        <Field label="Notes">
          <TextArea autoResize rows={6} />
        </Field>,
      );
      const textArea = screen.getByRole('textbox', { name: 'Notes' });
      expect(textArea).toHaveAttribute('data-auto-resize');
      expect(textArea).toHaveAttribute('rows', '6');
      expect(textArea.style.getPropertyValue('--text-area-rows')).toBe('6');
    });

    it('only asks for field-sizing behind @supports, so other browsers stay resizable', () => {
      const [outside = '', inside = ''] = stylesheet.split('@supports (field-sizing: content)');
      expect(inside).toContain('field-sizing: content');
      expect(outside).toContain('resize: vertical');
      expect(outside).not.toContain('field-sizing');
    });
  });
});
