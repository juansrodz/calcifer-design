import { composeStories } from '@storybook/react';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState, type FormEvent } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { axeDocument } from '../../../test/axe';
import { Form } from '../Form/Form';
import { DatePicker, type DatePickerProps } from './DatePicker';
import * as stories from './DatePicker.stories';

const allStories = composeStories(stories);

/** Pinned so "today" is known. Only `Date` is faked: user-event and Base UI need real timers. */
const NOW = new Date(2026, 2, 18, 12);

function renderPicker(props: Partial<DatePickerProps> = {}) {
  return render(<DatePicker label="Event date" name="eventDate" {...props} />);
}

function trigger(name: RegExp | string = /Event date/) {
  return screen.getByRole('button', { name });
}

async function openCalendar(name?: RegExp | string) {
  await userEvent.click(trigger(name));
  return screen.findByRole('dialog');
}

/** The cell for a date, found by its accessible name. */
function cell(name: string) {
  return screen.getByRole('gridcell', { name });
}

function focusedDate() {
  return document.activeElement?.getAttribute('data-date');
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'], now: NOW });
});

afterEach(() => {
  vi.useRealTimers();
});

describe('DatePicker', () => {
  it.each(Object.entries(allStories))('%s has no axe violations', async (_name, Story) => {
    render(<Story />);
    expect(await axeDocument()).toHaveNoViolations();
  });

  it.each(['Chosen', 'RightToLeft', 'Dark', 'Bounded'] as const)(
    '%s has no axe violations while open',
    async (name) => {
      const Story = allStories[name];
      render(<Story />);
      await openCalendar();
      expect(await axeDocument()).toHaveNoViolations();
    },
  );

  describe('the trigger', () => {
    it('is a button named by the label and the date, and it announces a dialog', () => {
      renderPicker({ defaultValue: '2026-03-08', locale: 'en-US' });
      const button = trigger('Event date Mar 8, 2026');
      expect(button.tagName).toBe('BUTTON');
      expect(button).toHaveAttribute('type', 'button');
      expect(button).toHaveAttribute('aria-haspopup', 'dialog');
      expect(button).toHaveAttribute('aria-expanded', 'false');
    });

    it('shows the placeholder while nothing is chosen', () => {
      renderPicker({ placeholder: 'Pick a day' });
      expect(trigger('Event date Pick a day')).toBeVisible();
    });

    it('says required in its name, since a button cannot carry aria-required', () => {
      renderPicker({ required: true });
      expect(trigger('Event date required Choose a date')).not.toHaveAttribute('aria-required');
    });

    it('is described by its description and its error, and marked invalid', () => {
      renderPicker({ description: 'Doors at six.', error: 'Nobody is free.' });
      expect(trigger()).toHaveAttribute('aria-invalid', 'true');
      expect(trigger()).toHaveAccessibleDescription('Doors at six. Nobody is free.');
    });

    it('wears the field skin, and takes the invalid state with it', () => {
      renderPicker({ error: 'No.' });
      expect(trigger()).toHaveClass('control');
      expect(trigger()).toHaveAttribute('data-invalid');
    });

    it('calls onBlur as focus leaves it', async () => {
      const onBlur = vi.fn();
      renderPicker({ onBlur });
      trigger().focus();
      await userEvent.tab();
      expect(onBlur).toHaveBeenCalled();
    });

    it('does not open when disabled', async () => {
      renderPicker({ disabled: true });
      expect(trigger()).toBeDisabled();
      await userEvent.click(trigger());
      expect(screen.queryByRole('dialog')).toBeNull();
    });

    it('opens from the keyboard', async () => {
      renderPicker({ defaultValue: '2026-03-08' });
      trigger().focus();
      await userEvent.keyboard('{Enter}');
      await screen.findByRole('dialog');
      await waitFor(() => expect(focusedDate()).toBe('2026-03-08'));
    });
  });

  describe('the dialog and its grid', () => {
    it('says it is modal, since focus cannot leave it', async () => {
      renderPicker();
      expect(await openCalendar()).toHaveAttribute('aria-modal', 'true');
    });

    it('closes with a library Button, and it joins the focus cycle', async () => {
      renderPicker({ defaultValue: '2026-03-08' });
      await openCalendar();
      await waitFor(() => expect(focusedDate()).toBe('2026-03-08'));
      const close = screen.getByRole('button', { name: 'Close' });
      expect(close).toHaveAttribute('data-variant', 'ghost');
      expect(close).toHaveAttribute('data-size', 'sm');
      expect(close).toHaveAttribute('type', 'button');
      await userEvent.tab();
      expect(close).toHaveFocus();
      await userEvent.click(close);
      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
      expect(trigger()).toHaveFocus();
    });

    it('is a dialog named by the field, holding a grid named by the month', async () => {
      renderPicker({ defaultValue: '2026-03-08', locale: 'en-US' });
      const dialog = await openCalendar();
      expect(dialog).toHaveAccessibleName('Event date');
      expect(within(dialog).getByRole('grid', { name: 'March 2026' })).toBeVisible();
    });

    it('announces a month change through a polite live region', async () => {
      renderPicker({ defaultValue: '2026-03-08', locale: 'en-US' });
      await openCalendar();
      const month = screen.getByText('March 2026');
      expect(month).toHaveAttribute('aria-live', 'polite');
      await userEvent.click(screen.getByRole('button', { name: 'Next month' }));
      expect(month).toHaveTextContent('April 2026');
      expect(screen.getByRole('grid', { name: 'April 2026' })).toBeVisible();
    });

    it('names each date in full, and marks today and the selection', async () => {
      renderPicker({ defaultValue: '2026-03-08', locale: 'en-US' });
      await openCalendar();
      const chosen = cell('Sunday, March 8, 2026');
      expect(chosen).toHaveTextContent('8');
      expect(chosen).toHaveAttribute('aria-selected', 'true');
      expect(cell('Wednesday, March 18, 2026')).toHaveAttribute('aria-current', 'date');
      expect(cell('Wednesday, March 18, 2026')).toHaveAttribute('aria-selected', 'false');
      expect(cell('Sunday, March 8, 2026')).not.toHaveAttribute('aria-current');
    });

    it('names the weekdays in full over their short labels', async () => {
      renderPicker({ locale: 'en-US' });
      await openCalendar();
      const headers = screen.getAllByRole('columnheader');
      expect(headers.map((header) => header.textContent)).toEqual([
        'Sun',
        'Mon',
        'Tue',
        'Wed',
        'Thu',
        'Fri',
        'Sat',
      ]);
      expect(headers[0]).toHaveAccessibleName('Sunday');
    });

    it('holds exactly the days of the month', async () => {
      renderPicker({ defaultValue: '2024-02-10', locale: 'en-US' });
      await openCalendar();
      const dates = screen
        .getAllByRole('gridcell')
        .filter((gridCell) => gridCell.hasAttribute('data-date'));
      expect(dates).toHaveLength(29);
      expect(dates.at(-1)).toHaveAttribute('data-date', '2024-02-29');
    });
  });

  describe('the tab stop', () => {
    function tabStops() {
      return screen
        .getAllByRole('gridcell')
        .filter((gridCell) => gridCell.getAttribute('tabindex') === '0')
        .map((gridCell) => gridCell.getAttribute('data-date'));
    }

    it('lands on the chosen date', async () => {
      renderPicker({ defaultValue: '2026-05-20' });
      await openCalendar();
      await waitFor(() => expect(focusedDate()).toBe('2026-05-20'));
      expect(tabStops()).toEqual(['2026-05-20']);
    });

    it('lands on today when nothing is chosen', async () => {
      renderPicker();
      await openCalendar();
      await waitFor(() => expect(focusedDate()).toBe('2026-03-18'));
    });

    it('lands on the first available date when today is before min', async () => {
      renderPicker({ min: '2026-06-10', max: '2026-08-01' });
      await openCalendar();
      await waitFor(() => expect(focusedDate()).toBe('2026-06-10'));
    });

    it('lands on the first available date of the last month when today is after max', async () => {
      renderPicker({ max: '2026-01-20' });
      await openCalendar();
      await waitFor(() => expect(focusedDate()).toBe('2026-01-01'));
    });

    it('stays within min when min and max share a month, past today', async () => {
      renderPicker({ min: '2026-01-10', max: '2026-01-20' });
      await openCalendar();
      await waitFor(() => expect(focusedDate()).toBe('2026-01-10'));
    });

    it('skips a today that isDateDisabled refuses', async () => {
      renderPicker({ isDateDisabled: (date) => date <= '2026-03-20' });
      await openCalendar();
      await waitFor(() => expect(focusedDate()).toBe('2026-03-21'));
    });

    it('falls back to a focusable date when nothing at all can be chosen', async () => {
      renderPicker({ isDateDisabled: () => true });
      await openCalendar();
      await waitFor(() => expect(focusedDate()).toBe('2026-03-01'));
    });

    it('Tab from the month buttons lands on the selection, today, or the first available', async () => {
      renderPicker({ defaultValue: '2026-03-08', isDateDisabled: (date) => date === '2026-05-01' });
      await openCalendar();
      await userEvent.click(screen.getByRole('button', { name: 'Next month' }));
      expect(tabStops()).toEqual(['2026-04-01']);
      await userEvent.click(screen.getByRole('button', { name: 'Next month' }));
      expect(tabStops()).toEqual(['2026-05-02']);
      await userEvent.click(screen.getByRole('button', { name: 'Previous month' }));
      await userEvent.click(screen.getByRole('button', { name: 'Previous month' }));
      expect(tabStops()).toEqual(['2026-03-08']);
      await userEvent.click(screen.getByRole('button', { name: 'Next month' }));
      await userEvent.tab();
      expect(focusedDate()).toBe('2026-04-01');
    });

    it('keeps the focus trapped in the dialog', async () => {
      renderPicker({ defaultValue: '2026-03-08' });
      const dialog = await openCalendar();
      await waitFor(() => expect(focusedDate()).toBe('2026-03-08'));
      for (let press = 0; press < 6; press += 1) {
        await userEvent.tab();
        // Base UI's focus guard, which sits just outside the popup, hands focus back on a frame.
        await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true));
      }
    });
  });

  describe('the keys', () => {
    async function openAt(date: string, props: Partial<DatePickerProps> = {}) {
      renderPicker({ defaultValue: date, ...props });
      await openCalendar();
      await waitFor(() => expect(focusedDate()).toBe(date));
    }

    it.each([
      ['{ArrowRight}', '2026-03-12'],
      ['{ArrowLeft}', '2026-03-10'],
      ['{ArrowDown}', '2026-03-18'],
      ['{ArrowUp}', '2026-03-04'],
      ['{Home}', '2026-03-08'],
      ['{End}', '2026-03-14'],
      ['{PageDown}', '2026-04-11'],
      ['{PageUp}', '2026-02-11'],
      ['{Shift>}{PageDown}{/Shift}', '2027-03-11'],
      ['{Shift>}{PageUp}{/Shift}', '2025-03-11'],
    ])('%s from 2026-03-11 goes to %s', async (keys, expected) => {
      await openAt('2026-03-11');
      await userEvent.keyboard(keys);
      expect(focusedDate()).toBe(expected);
    });

    it('takes Home and End from weekStartsOn', async () => {
      await openAt('2026-03-11', { weekStartsOn: 1 });
      await userEvent.keyboard('{Home}');
      expect(focusedDate()).toBe('2026-03-09');
      await userEvent.keyboard('{End}');
      expect(focusedDate()).toBe('2026-03-15');
    });

    it('crosses the month with an arrow key, and the grid follows', async () => {
      await openAt('2026-03-01', { locale: 'en-US' });
      await userEvent.keyboard('{ArrowLeft}');
      expect(focusedDate()).toBe('2026-02-28');
      expect(screen.getByRole('grid', { name: 'February 2026' })).toBeVisible();
      await userEvent.keyboard('{ArrowRight}');
      expect(focusedDate()).toBe('2026-03-01');
    });

    it('clamps Jan 31 and PageDown to the end of February, and does not drift', async () => {
      await openAt('2026-01-31');
      await userEvent.keyboard('{PageDown}');
      expect(focusedDate()).toBe('2026-02-28');
      await userEvent.keyboard('{PageDown}');
      expect(focusedDate()).toBe('2026-03-28');
    });

    it('lands on Feb 29 in a leap year', async () => {
      await openAt('2024-01-31');
      await userEvent.keyboard('{PageDown}');
      expect(focusedDate()).toBe('2024-02-29');
      await userEvent.keyboard('{Shift>}{PageDown}{/Shift}');
      expect(focusedDate()).toBe('2025-02-28');
    });

    it('swaps left and right in a right-to-left locale, and nothing else', async () => {
      await openAt('2026-03-11', { locale: 'ar-EG' });
      expect(screen.getByRole('dialog')).toHaveAttribute('dir', 'rtl');
      await userEvent.keyboard('{ArrowLeft}');
      expect(focusedDate()).toBe('2026-03-12');
      await userEvent.keyboard('{ArrowRight}');
      expect(focusedDate()).toBe('2026-03-11');
      await userEvent.keyboard('{ArrowDown}');
      expect(focusedDate()).toBe('2026-03-18');
    });

    it('selects with Enter and with Space, closes, and returns focus', async () => {
      const onValueChange = vi.fn();
      await openAt('2026-03-11', { onValueChange });
      await userEvent.keyboard('{ArrowRight}{Enter}');
      expect(onValueChange).toHaveBeenCalledTimes(1);
      expect(onValueChange).toHaveBeenCalledWith('2026-03-12');
      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
      expect(trigger()).toHaveFocus();

      await userEvent.keyboard('{Enter}');
      await screen.findByRole('dialog');
      await waitFor(() => expect(focusedDate()).toBe('2026-03-12'));
      await userEvent.keyboard('{ArrowRight} ');
      expect(onValueChange).toHaveBeenLastCalledWith('2026-03-13');
    });

    it('closes on Escape, returns focus to the trigger, and changes nothing', async () => {
      const onValueChange = vi.fn();
      await openAt('2026-03-11', { onValueChange });
      await userEvent.keyboard('{ArrowRight}{ArrowRight}{Escape}');
      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
      expect(trigger()).toHaveFocus();
      expect(onValueChange).not.toHaveBeenCalled();
    });

    it('reports nothing when the chosen date is chosen again, and still closes', async () => {
      const onValueChange = vi.fn();
      await openAt('2026-03-11', { onValueChange });
      await userEvent.keyboard('{Enter}');
      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
      expect(onValueChange).not.toHaveBeenCalled();
    });
  });

  describe('choosing with the pointer', () => {
    it('selects, closes, reports one string, and returns focus', async () => {
      const onValueChange = vi.fn();
      renderPicker({ defaultValue: '2026-03-08', onValueChange, locale: 'en-US' });
      await openCalendar();
      await userEvent.click(cell('Monday, March 16, 2026'));
      expect(onValueChange.mock.calls).toEqual([['2026-03-16']]);
      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
      expect(trigger('Event date Mar 16, 2026')).toHaveFocus();
    });

    it('closes when something outside is pressed', async () => {
      render(
        <>
          <DatePicker label="Event date" />
          <button type="button">Elsewhere</button>
        </>,
      );
      await openCalendar();
      await userEvent.click(screen.getByText('Elsewhere'));
      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    });

    it('closes from its close button', async () => {
      renderPicker({ labels: { close: 'Done' } });
      await openCalendar();
      await userEvent.click(screen.getByRole('button', { name: 'Done' }));
      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
      expect(trigger()).toHaveFocus();
    });
  });

  describe('min, max and isDateDisabled', () => {
    const bounds = { min: '2026-03-10', max: '2026-04-20', locale: 'en-US' };

    it('marks the dates outside as unavailable, with the boundaries themselves available', async () => {
      renderPicker({ ...bounds, defaultValue: '2026-03-15' });
      await openCalendar();
      expect(cell('Monday, March 9, 2026')).toHaveAttribute('aria-disabled', 'true');
      expect(cell('Tuesday, March 10, 2026')).not.toHaveAttribute('aria-disabled');
      await userEvent.click(screen.getByRole('button', { name: 'Next month' }));
      expect(cell('Monday, April 20, 2026')).not.toHaveAttribute('aria-disabled');
      expect(cell('Tuesday, April 21, 2026')).toHaveAttribute('aria-disabled', 'true');
    });

    it('lets the boundaries be chosen', async () => {
      const onValueChange = vi.fn();
      renderPicker({ ...bounds, defaultValue: '2026-03-15', onValueChange });
      await openCalendar();
      await userEvent.click(cell('Tuesday, March 10, 2026'));
      expect(onValueChange).toHaveBeenCalledWith('2026-03-10');
    });

    it('reaches an unavailable date by arrow key, and will not choose it', async () => {
      const onValueChange = vi.fn();
      renderPicker({ ...bounds, defaultValue: '2026-03-10', onValueChange });
      await openCalendar();
      await waitFor(() => expect(focusedDate()).toBe('2026-03-10'));
      await userEvent.keyboard('{ArrowLeft}');
      expect(focusedDate()).toBe('2026-03-09');
      await userEvent.keyboard('{Enter}');
      await userEvent.keyboard(' ');
      expect(onValueChange).not.toHaveBeenCalled();
      expect(screen.getByRole('dialog')).toBeVisible();
    });

    it('will not choose an unavailable date under the pointer, and focuses it instead', async () => {
      const onValueChange = vi.fn();
      renderPicker({ ...bounds, defaultValue: '2026-03-15', onValueChange });
      await openCalendar();
      await userEvent.click(cell('Monday, March 9, 2026'));
      expect(onValueChange).not.toHaveBeenCalled();
      expect(focusedDate()).toBe('2026-03-09');
    });

    it('applies isDateDisabled the same way, and hands it YYYY-MM-DD', async () => {
      const onValueChange = vi.fn();
      const isDateDisabled = vi.fn((date: string) => date === '2026-03-12');
      renderPicker({ defaultValue: '2026-03-11', isDateDisabled, onValueChange });
      await openCalendar();
      await waitFor(() => expect(focusedDate()).toBe('2026-03-11'));
      await userEvent.keyboard('{ArrowRight}{Enter}');
      expect(focusedDate()).toBe('2026-03-12');
      expect(onValueChange).not.toHaveBeenCalled();
      await userEvent.keyboard('{ArrowRight}{Enter}');
      expect(onValueChange).toHaveBeenCalledWith('2026-03-13');
    });

    it('stays put at a month it cannot leave', async () => {
      renderPicker({ ...bounds, defaultValue: '2026-03-15' });
      await openCalendar();
      await waitFor(() => expect(focusedDate()).toBe('2026-03-15'));
      await userEvent.keyboard('{PageUp}');
      expect(focusedDate()).toBe('2026-03-15');
      await userEvent.keyboard('{Shift>}{PageDown}{/Shift}');
      expect(focusedDate()).toBe('2026-03-15');
      await userEvent.keyboard('{Home}{ArrowLeft}{ArrowLeft}{ArrowLeft}');
      await userEvent.keyboard('{ArrowUp}{ArrowUp}{ArrowUp}{ArrowUp}{ArrowUp}{ArrowUp}');
      expect(focusedDate()?.slice(0, 7)).toBe('2026-03');
    });

    it('marks a month button it cannot use, keeps it focused, and ignores it', async () => {
      renderPicker({ ...bounds, defaultValue: '2026-03-15' });
      await openCalendar();
      const previous = screen.getByRole('button', { name: 'Previous month' });
      expect(previous).toHaveAttribute('aria-disabled', 'true');
      expect(previous).toBeEnabled();
      await userEvent.click(previous);
      expect(previous).toHaveFocus();
      expect(screen.getByRole('grid', { name: 'March 2026' })).toBeVisible();
    });

    it('still shows a chosen value outside the bounds, and opens where it can', async () => {
      const onValueChange = vi.fn();
      renderPicker({ ...bounds, value: '2020-01-01', onValueChange });
      expect(trigger('Event date Jan 1, 2020')).toBeVisible();
      await openCalendar();
      expect(screen.getByRole('grid', { name: 'March 2026' })).toBeVisible();
      expect(onValueChange).not.toHaveBeenCalled();
    });

    it('moves off a date that min or max changing has put out of reach, while open', async () => {
      function Moving() {
        const [max, setMax] = useState('2026-12-31');
        return (
          <>
            <DatePicker label="Event date" defaultValue="2026-06-15" max={max} locale="en-US" />
            <button type="button" onClick={() => setMax('2026-04-10')}>
              Narrow
            </button>
          </>
        );
      }
      render(<Moving />);
      await openCalendar();
      expect(screen.getByRole('grid', { name: 'June 2026' })).toBeVisible();
      fireEvent.click(screen.getByText('Narrow'));
      expect(screen.getByRole('grid', { name: 'March 2026' })).toBeVisible();
    });

    it('takes an unreadable min or max as no bound', async () => {
      renderPicker({ min: 'soon', max: '', defaultValue: '2026-03-08', locale: 'en-US' });
      await openCalendar();
      expect(cell('Sunday, March 1, 2026')).not.toHaveAttribute('aria-disabled');
    });
  });

  describe('locale and weekStartsOn', () => {
    describe('the direction the chevrons follow', () => {
      afterEach(() => {
        document.documentElement.removeAttribute('dir');
      });

      /** The month heading's parent, which carries what the stylesheet turns the chevrons by. */
      const header = () =>
        screen.getByRole('button', { name: 'Previous month' }).parentElement as HTMLElement;

      it('is left to right for locale="en" on a right-to-left page', async () => {
        document.documentElement.dir = 'rtl';
        renderPicker({ locale: 'en' });
        await openCalendar();
        expect(header()).toHaveAttribute('data-direction', 'ltr');
      });

      it('is right to left for locale="ar" on a left-to-right page', async () => {
        renderPicker({ locale: 'ar' });
        await openCalendar();
        expect(header()).toHaveAttribute('data-direction', 'rtl');
      });

      it("is the page's own with no locale", async () => {
        document.documentElement.dir = 'rtl';
        renderPicker();
        await openCalendar();
        expect(header()).toHaveAttribute('data-direction', 'rtl');
      });
    });

    it('draws a Gregorian month in a locale whose default calendar is another', async () => {
      renderPicker({ defaultValue: '2026-03-08', locale: 'fa-IR' });
      expect(trigger(/۸ مارس ۲۰۲۶/)).toBeVisible();
      await openCalendar();
      expect(screen.getByRole('grid', { name: 'مارس ۲۰۲۶' })).toBeVisible();
      // In the Persian calendar the eighth of March is the seventeenth of Esfand.
      const chosen = screen.getByRole('gridcell', { selected: true });
      expect(chosen).toHaveTextContent(/^۸$/);
      expect(chosen).toHaveAttribute('data-date', '2026-03-08');
      expect(document.querySelector('[data-date="2026-03-31"]')).toHaveTextContent(/^۳۱$/);
      expect(document.querySelector('[data-date="2026-03-01"]')).toHaveTextContent(/^۱$/);
    });

    it('draws a Gregorian month when the tag itself asks for another calendar', async () => {
      renderPicker({ defaultValue: '2026-03-08', locale: 'en-US-u-ca-hebrew' });
      expect(trigger('Event date Mar 8, 2026')).toBeVisible();
      await openCalendar();
      expect(screen.getByRole('grid', { name: 'March 2026' })).toBeVisible();
      expect(screen.getByRole('gridcell', { selected: true })).toHaveTextContent(/^8$/);
    });

    it('starts the week where it is told, whatever the locale says', async () => {
      renderPicker({ locale: 'en-US', weekStartsOn: 3 });
      await openCalendar();
      expect(screen.getAllByRole('columnheader')[0]).toHaveTextContent('Wed');
      const firstRow = screen.getAllByRole('row')[1];
      // 2026-03-18 is a Wednesday, so March 1, a Sunday, is the fifth column.
      const cells = within(firstRow as HTMLElement).getAllByRole('gridcell');
      expect(cells[4]).toHaveAttribute('data-date', '2026-03-01');
    });

    it('starts the week where the locale says when not told', async () => {
      renderPicker({ locale: 'en-GB' });
      await openCalendar();
      expect(screen.getAllByRole('columnheader')[0]).toHaveTextContent('Mon');
    });

    it('formats in the locale, and is right-to-left only where the locale is', async () => {
      renderPicker({ locale: 'es-ES', defaultValue: '2026-03-08' });
      const dialog = await openCalendar();
      expect(screen.getByRole('grid', { name: 'marzo de 2026' })).toBeVisible();
      expect(dialog).toHaveAttribute('dir', 'ltr');
    });

    it('uses the locale digits, while the value stays ISO', async () => {
      renderPicker({ locale: 'ar-EG', defaultValue: '2026-03-08' });
      await openCalendar();
      const chosen = screen
        .getAllByRole('gridcell')
        .find((gridCell) => gridCell.getAttribute('aria-selected') === 'true');
      expect(chosen).toHaveTextContent('٨');
      expect(chosen).toHaveAttribute('data-date', '2026-03-08');
    });

    it('survives a locale the platform refuses', () => {
      renderPicker({ locale: 'en_US', defaultValue: '2026-03-08' });
      expect(trigger()).toBeVisible();
    });
  });

  describe('the value', () => {
    it.each(['', 'soon', '2026-02-30', '2026-13-01', '03/08/2026'])(
      'reads %j as nothing chosen: no crash, no shift, nothing reported',
      async (garbage) => {
        const onValueChange = vi.fn();
        const { container } = renderPicker({ value: garbage, onValueChange });
        expect(trigger('Event date Choose a date')).toBeVisible();
        expect(container.querySelector('input[type="hidden"]')).toHaveValue('');
        await openCalendar();
        await waitFor(() => expect(focusedDate()).toBe('2026-03-18'));
        expect(onValueChange).not.toHaveBeenCalled();
      },
    );

    it('treats a garbage defaultValue the same way', () => {
      renderPicker({ defaultValue: 'soon' });
      expect(trigger('Event date Choose a date')).toBeVisible();
    });

    it('follows a controlled value, from a date to another and to null, with no warning', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      function Controlled() {
        const [date, setDate] = useState<string | null>('2026-03-08');
        return (
          <>
            <DatePicker label="Event date" value={date} onValueChange={setDate} locale="en-US" />
            <button type="button" onClick={() => setDate('2026-07-04')}>
              July
            </button>
            <button type="button" onClick={() => setDate(null)}>
              None
            </button>
          </>
        );
      }
      render(<Controlled />);
      expect(trigger('Event date Mar 8, 2026')).toBeVisible();
      await userEvent.click(screen.getByRole('button', { name: 'July' }));
      expect(trigger('Event date Jul 4, 2026')).toBeVisible();
      await userEvent.click(screen.getByRole('button', { name: 'None' }));
      expect(trigger('Event date Choose a date')).toBeVisible();
      await userEvent.click(screen.getByRole('button', { name: 'July' }));
      expect(trigger('Event date Jul 4, 2026')).toBeVisible();
      expect(consoleError).not.toHaveBeenCalled();
      consoleError.mockRestore();
    });

    it('shows no warning going from uncontrolled to controlled, and takes the new value', () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      const { rerender } = render(<DatePicker label="Event date" locale="en-US" />);
      rerender(<DatePicker label="Event date" locale="en-US" value="2026-03-08" />);
      expect(trigger('Event date Mar 8, 2026')).toBeVisible();
      expect(consoleError).not.toHaveBeenCalled();
      consoleError.mockRestore();
    });

    it('does not move a controlled value the parent refuses', async () => {
      renderPicker({ value: '2026-03-08', locale: 'en-US', onValueChange: () => undefined });
      await openCalendar();
      await userEvent.click(cell('Monday, March 16, 2026'));
      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
      expect(trigger('Event date Mar 8, 2026')).toBeVisible();
    });

    it('follows a value that changes while open: the selection and the month', async () => {
      function Moving() {
        const [date, setDate] = useState<string | null>('2026-03-08');
        return (
          <>
            <DatePicker label="Event date" value={date} locale="en-US" />
            <button type="button" onClick={() => setDate('2026-07-04')}>
              July
            </button>
          </>
        );
      }
      render(<Moving />);
      await openCalendar();
      await waitFor(() => expect(focusedDate()).toBe('2026-03-08'));
      act(() => {
        fireEvent.click(screen.getByText('July'));
      });
      expect(screen.getByRole('grid', { name: 'July 2026' })).toBeVisible();
      expect(cell('Saturday, July 4, 2026')).toHaveAttribute('aria-selected', 'true');
      // The focused cell was March's and is gone. Focus goes with the grid rather than being lost.
      expect(focusedDate()).toBe('2026-07-04');
    });

    it('opens on the current value after the value changed while closed', async () => {
      const { rerender } = render(<DatePicker label="Event date" value="2026-03-08" />);
      rerender(<DatePicker label="Event date" value="2026-09-09" />);
      await openCalendar();
      await waitFor(() => expect(focusedDate()).toBe('2026-09-09'));
    });

    it('reopens on the chosen date, not where the arrow keys were left', async () => {
      renderPicker({ defaultValue: '2026-03-08' });
      await openCalendar();
      await waitFor(() => expect(focusedDate()).toBe('2026-03-08'));
      await userEvent.keyboard('{PageDown}{Escape}');
      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
      await openCalendar();
      await waitFor(() => expect(focusedDate()).toBe('2026-03-08'));
    });
  });

  describe('clearable', () => {
    it('clears, reports null once, and puts focus on the trigger', async () => {
      const onValueChange = vi.fn();
      renderPicker({ defaultValue: '2026-03-08', clearable: true, onValueChange });
      await userEvent.click(screen.getByRole('button', { name: 'Clear Event date' }));
      expect(onValueChange.mock.calls).toEqual([[null]]);
      expect(trigger('Event date Choose a date')).toHaveFocus();
      expect(screen.queryByRole('button', { name: 'Clear Event date' })).toBeNull();
    });

    it('has no button until there is something to clear, or when disabled or not asked', () => {
      const { rerender } = render(<DatePicker label="Event date" clearable />);
      expect(screen.queryByRole('button', { name: /Clear/ })).toBeNull();
      rerender(<DatePicker label="Event date" clearable disabled value="2026-03-08" />);
      expect(screen.queryByRole('button', { name: /Clear/ })).toBeNull();
      rerender(<DatePicker label="Event date" value="2026-03-08" />);
      expect(screen.queryByRole('button', { name: /Clear/ })).toBeNull();
    });
  });

  describe('submitting', () => {
    function hiddenValue(container: HTMLElement) {
      const form = container.querySelector('form') as HTMLFormElement;
      return new FormData(form).get('eventDate');
    }

    it('submits YYYY-MM-DD through a hidden input in a plain form', async () => {
      const { container } = render(
        <form>
          <DatePicker label="Event date" name="eventDate" defaultValue="2026-03-08" clearable />
        </form>,
      );
      expect(hiddenValue(container)).toBe('2026-03-08');
      await userEvent.click(screen.getByRole('button', { name: 'Clear Event date' }));
      expect(hiddenValue(container)).toBe('');
    });

    it('submits nothing when disabled', () => {
      const { container } = render(
        <form>
          <DatePicker label="Event date" name="eventDate" defaultValue="2026-03-08" disabled />
        </form>,
      );
      expect(hiddenValue(container)).toBeNull();
    });

    it('does not submit the form it sits in from opening, moving or choosing', async () => {
      const onSubmit = vi.fn((event: FormEvent) => event.preventDefault());
      render(
        <form onSubmit={onSubmit}>
          <DatePicker label="Event date" name="eventDate" defaultValue="2026-03-08" />
        </form>,
      );
      await openCalendar();
      await waitFor(() => expect(focusedDate()).toBe('2026-03-08'));
      await userEvent.keyboard('{ArrowRight}{Enter}');
      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
      expect(onSubmit).not.toHaveBeenCalled();
    });
  });

  describe('inside Form', () => {
    const save = <button type="submit">Save</button>;

    it('hands onSubmit the date, or null', async () => {
      const onSubmit = vi.fn();
      render(
        <Form onSubmit={onSubmit}>
          <DatePicker label="Event date" name="eventDate" defaultValue="2026-03-08" />
          <DatePicker label="Other date" name="otherDate" />
          {save}
        </Form>,
      );
      await userEvent.click(screen.getByRole('button', { name: 'Save' }));
      expect(onSubmit).toHaveBeenCalledWith({ eventDate: '2026-03-08', otherDate: null });
    });

    it('hands onSubmit the current date after a change, and nothing when disabled', async () => {
      const onSubmit = vi.fn();
      render(
        <Form onSubmit={onSubmit}>
          <DatePicker
            label="Event date"
            name="eventDate"
            defaultValue="2026-03-08"
            locale="en-US"
          />
          <DatePicker label="Locked" name="locked" defaultValue="2026-03-08" disabled />
          {save}
        </Form>,
      );
      await openCalendar(/Event date/);
      await userEvent.click(cell('Monday, March 16, 2026'));
      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
      await userEvent.click(screen.getByRole('button', { name: 'Save' }));
      expect(onSubmit).toHaveBeenCalledWith({ eventDate: '2026-03-16' });
    });

    it('shows an entry in errors, marks it invalid, and takes focus on submit', async () => {
      const onSubmit = vi.fn();
      render(
        <Form onSubmit={onSubmit} errors={{ eventDate: 'Nobody is free.' }}>
          <DatePicker label="Event date" name="eventDate" defaultValue="2026-03-08" />
          {save}
        </Form>,
      );
      expect(screen.getByText('Nobody is free.')).toBeVisible();
      expect(trigger()).toHaveAttribute('aria-invalid', 'true');
      expect(trigger()).toHaveAccessibleDescription('Nobody is free.');
      await userEvent.click(screen.getByRole('button', { name: 'Save' }));
      expect(trigger()).toHaveFocus();
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('lets an explicit error win', () => {
      render(
        <Form onSubmit={() => undefined} errors={{ eventDate: 'From the server.' }}>
          <DatePicker label="Event date" name="eventDate" error="Explicit." />
        </Form>,
      );
      expect(screen.getByText('Explicit.')).toBeVisible();
      expect(screen.queryByText('From the server.')).toBeNull();
    });

    it('clears the entry when the date changes, and when it is cleared', async () => {
      render(
        <Form onSubmit={() => undefined} errors={{ eventDate: 'Nobody is free.' }}>
          <DatePicker label="Event date" name="eventDate" defaultValue="2026-03-08" clearable />
        </Form>,
      );
      await userEvent.click(screen.getByRole('button', { name: 'Clear Event date' }));
      expect(screen.queryByText('Nobody is free.')).toBeNull();
      expect(trigger()).not.toHaveAttribute('aria-invalid');
    });

    it('blocks when required and empty, says why, and clears once a date is chosen', async () => {
      const onSubmit = vi.fn();
      render(
        <Form onSubmit={onSubmit}>
          <DatePicker label="Event date" name="eventDate" required locale="en-US" />
          {save}
        </Form>,
      );
      await userEvent.click(screen.getByRole('button', { name: 'Save' }));
      expect(onSubmit).not.toHaveBeenCalled();
      expect(screen.getByText('Choose a date.')).toBeVisible();
      expect(trigger()).toHaveFocus();
      expect(trigger()).toHaveAttribute('aria-invalid', 'true');

      await openCalendar();
      await userEvent.click(cell('Monday, March 16, 2026'));
      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
      await waitFor(() => expect(screen.queryByText('Choose a date.')).toBeNull());
      await userEvent.click(screen.getByRole('button', { name: 'Save' }));
      expect(onSubmit).toHaveBeenCalledWith({ eventDate: '2026-03-16' });
    });

    /** An end date whose `min` is a start date someone can move past it. */
    function StartAndEnd({ onSubmit }: { onSubmit: (values: object) => void }) {
      const [start, setStart] = useState('2026-03-01');
      return (
        <Form onSubmit={onSubmit}>
          <button type="button" onClick={() => setStart('2026-03-20')}>
            Move the start late
          </button>
          <button type="button" onClick={() => setStart('2026-03-01')}>
            Move the start back
          </button>
          <DatePicker
            label="End date"
            name="endDate"
            defaultValue="2026-03-10"
            min={start}
            locale="en-US"
          />
          {save}
        </Form>
      );
    }

    it('blocks a chosen date that min has moved past, shows it still, and says why', async () => {
      const onSubmit = vi.fn();
      render(<StartAndEnd onSubmit={onSubmit} />);
      await userEvent.click(screen.getByRole('button', { name: 'Move the start late' }));
      await userEvent.click(screen.getByRole('button', { name: 'Save' }));
      expect(onSubmit).not.toHaveBeenCalled();
      expect(screen.getByText('Choose an available date.')).toBeVisible();
      const button = screen.getByRole('button', { name: 'End date Mar 10, 2026' });
      expect(button).toHaveFocus();
      expect(button).toHaveAttribute('aria-invalid', 'true');
    });

    it('submits again once min moves back behind the date', async () => {
      const onSubmit = vi.fn();
      render(<StartAndEnd onSubmit={onSubmit} />);
      await userEvent.click(screen.getByRole('button', { name: 'Move the start late' }));
      await userEvent.click(screen.getByRole('button', { name: 'Save' }));
      await userEvent.click(screen.getByRole('button', { name: 'Move the start back' }));
      await userEvent.click(screen.getByRole('button', { name: 'Save' }));
      expect(onSubmit).toHaveBeenCalledWith({ endDate: '2026-03-10' });
      expect(screen.queryByText('Choose an available date.')).toBeNull();
    });

    it.each([
      ['max', { max: '2026-03-07' }],
      ['isDateDisabled', { isDateDisabled: (date: string) => date === '2026-03-08' }],
    ])('blocks a chosen date refused by %s, in the words of labels', async (_label, bounds) => {
      const onSubmit = vi.fn();
      render(
        <Form onSubmit={onSubmit}>
          <DatePicker
            label="Event date"
            name="eventDate"
            defaultValue="2026-03-08"
            labels={{ unavailableMessage: 'Elige otra fecha.' }}
            {...bounds}
          />
          {save}
        </Form>,
      );
      await userEvent.click(screen.getByRole('button', { name: 'Save' }));
      expect(onSubmit).not.toHaveBeenCalled();
      expect(screen.getByText('Elige otra fecha.')).toBeVisible();
    });

    it('lets an available date and an empty optional picker through', async () => {
      const onSubmit = vi.fn();
      render(
        <Form onSubmit={onSubmit}>
          <DatePicker
            label="Event date"
            name="eventDate"
            defaultValue="2026-03-08"
            min="2026-03-08"
          />
          <DatePicker label="Other date" name="otherDate" min="2026-03-08" />
          {save}
        </Form>,
      );
      await userEvent.click(screen.getByRole('button', { name: 'Save' }));
      expect(onSubmit).toHaveBeenCalledWith({ eventDate: '2026-03-08', otherDate: null });
    });

    it('does not block a plain form, which has no Base UI validation to run', async () => {
      const onSubmit = vi.fn((event: FormEvent) => event.preventDefault());
      render(
        <form onSubmit={onSubmit}>
          <DatePicker
            label="Event date"
            name="eventDate"
            defaultValue="2026-03-08"
            min="2026-04-01"
          />
          {save}
        </form>,
      );
      await userEvent.click(screen.getByRole('button', { name: 'Save' }));
      expect(onSubmit).toHaveBeenCalled();
    });
  });

  describe('a native reset', () => {
    /** Past the event, and past the timer on which the picker follows the browser's own reset. */
    async function resetForm(form: HTMLFormElement) {
      await act(async () => {
        form.reset();
        await new Promise((resolve) => setTimeout(resolve));
      });
    }

    function hiddenValue() {
      return document.querySelector<HTMLInputElement>('input[name="eventDate"]')?.value;
    }

    function renderInForm(props: Partial<DatePickerProps> = {}) {
      const view = render(
        <form aria-label="Plan">
          <DatePicker label="Event date" name="eventDate" locale="en-US" {...props} />
          <button type="reset">Start over</button>
        </form>,
      );
      return { ...view, form: screen.getByRole<HTMLFormElement>('form', { name: 'Plan' }) };
    }

    async function chooseMarch16() {
      await openCalendar();
      await userEvent.click(cell('Monday, March 16, 2026'));
      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    }

    it('goes back to the default value from a reset button, and says so', async () => {
      const onValueChange = vi.fn();
      renderInForm({ defaultValue: '2026-03-08', onValueChange });
      await chooseMarch16();
      expect(hiddenValue()).toBe('2026-03-16');
      onValueChange.mockClear();
      await userEvent.click(screen.getByRole('button', { name: 'Start over' }));
      await waitFor(() => expect(trigger('Event date Mar 8, 2026')).toBeVisible());
      expect(hiddenValue()).toBe('2026-03-08');
      expect(onValueChange.mock.calls).toEqual([['2026-03-08']]);
    });

    it('goes back to nothing chosen when there was no default', async () => {
      const { form } = renderInForm();
      await chooseMarch16();
      await resetForm(form);
      expect(trigger('Event date Choose a date')).toBeVisible();
      expect(hiddenValue()).toBe('');
    });

    it('reports nothing when the value was the default already', async () => {
      const onValueChange = vi.fn();
      const { form } = renderInForm({ defaultValue: '2026-03-08', onValueChange });
      await resetForm(form);
      expect(onValueChange).not.toHaveBeenCalled();
    });

    it("keeps a controlled value, which is the parent's to change", async () => {
      const onValueChange = vi.fn();
      const { form } = renderInForm({ value: '2026-03-08', onValueChange });
      await resetForm(form);
      expect(trigger('Event date Mar 8, 2026')).toBeVisible();
      expect(hiddenValue()).toBe('2026-03-08');
      expect(onValueChange).not.toHaveBeenCalled();
    });

    it('stays put when the reset is cancelled', async () => {
      const { form } = renderInForm({ defaultValue: '2026-03-08' });
      await chooseMarch16();
      form.addEventListener('reset', (event) => event.preventDefault());
      await resetForm(form);
      expect(trigger('Event date Mar 16, 2026')).toBeVisible();
    });

    it('works inside Form as well', async () => {
      render(
        <Form onSubmit={() => undefined} aria-label="Plan">
          <DatePicker
            label="Event date"
            name="eventDate"
            locale="en-US"
            defaultValue="2026-03-08"
          />
        </Form>,
      );
      await chooseMarch16();
      await resetForm(screen.getByRole<HTMLFormElement>('form', { name: 'Plan' }));
      expect(trigger('Event date Mar 8, 2026')).toBeVisible();
    });

    describe('once unmounted', () => {
      const onValueChange = vi.fn();

      function Plan({ showPicker }: { showPicker: boolean }) {
        return (
          <form aria-label="Plan">
            {showPicker ? (
              <DatePicker
                label="Event date"
                name="eventDate"
                locale="en-US"
                onValueChange={onValueChange}
              />
            ) : null}
          </form>
        );
      }

      it('stops listening', () => {
        const { rerender } = render(<Plan showPicker />);
        const form = screen.getByRole<HTMLFormElement>('form', { name: 'Plan' });
        const stopListening = vi.spyOn(form, 'removeEventListener');
        rerender(<Plan showPicker={false} />);
        expect(stopListening).toHaveBeenCalledWith('reset', expect.any(Function));
      });

      it('drops a reset that was still on its way', async () => {
        const { rerender } = render(<Plan showPicker />);
        await chooseMarch16();
        onValueChange.mockClear();
        screen.getByRole<HTMLFormElement>('form', { name: 'Plan' }).reset();
        rerender(<Plan showPicker={false} />);
        await new Promise((resolve) => setTimeout(resolve));
        expect(onValueChange).not.toHaveBeenCalled();
      });
    });

    it('finds a form it only comes to be inside after mounting', async () => {
      const onValueChange = vi.fn();
      const host = document.createElement('div');
      document.body.append(host);
      const picker = () => (
        <DatePicker
          label="Event date"
          name="eventDate"
          locale="en-US"
          defaultValue="2026-03-08"
          onValueChange={onValueChange}
        />
      );
      const { rerender, unmount } = render(picker(), { container: host });
      await chooseMarch16();
      onValueChange.mockClear();
      const form = document.createElement('form');
      document.body.append(form);
      form.append(host);
      rerender(picker());
      await resetForm(form);
      expect(onValueChange.mock.calls).toEqual([['2026-03-08']]);
      unmount();
      form.remove();
    });
  });

  describe('the time zone', () => {
    const originalZone = process.env.TZ;

    afterEach(() => {
      process.env.TZ = originalZone;
    });

    it.each([
      ['Pacific/Kiritimati'],
      ['Pacific/Pago_Pago'],
      ['America/New_York'],
      ['America/Havana'],
    ])('in %s, a DST day and a month end stay the date they were', async (zone) => {
      process.env.TZ = zone;
      const onValueChange = vi.fn();
      renderPicker({ defaultValue: '2026-03-08', onValueChange, locale: 'en-US' });
      expect(trigger('Event date Mar 8, 2026')).toBeVisible();
      await openCalendar();
      expect(cell('Sunday, March 8, 2026')).toHaveAttribute('aria-selected', 'true');
      await userEvent.click(cell('Tuesday, March 31, 2026'));
      expect(onValueChange).toHaveBeenCalledWith('2026-03-31');
      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
      expect(trigger('Event date Mar 31, 2026')).toBeVisible();
    });
  });
});
