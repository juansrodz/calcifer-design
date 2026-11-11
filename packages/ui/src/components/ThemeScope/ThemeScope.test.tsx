import { checkThemeContrast, themeBrand, type Theme } from '@calcifer-design/tokens';
import { composeStories } from '@storybook/react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { axeDocument } from '../../../test/axe';
import { DatePicker } from '../DatePicker/DatePicker';
import { Dialog } from '../Dialog/Dialog';
import { Select } from '../Select/Select';
import { ToastRegion, createToastManager } from '../ToastRegion/ToastRegion';
import { demoTheme } from './fixtures';
import { usePortalContainer } from './PortalContainerContext';
import { ThemeScope } from './ThemeScope';
import * as stories from './ThemeScope.stories';

const { Default, PinnedDark, Nested, PortalsStayInside } = composeStories(stories);

const brandMessage = 'ThemeScope: theme must come from defineTheme';

/** The one portal host on the page; the tests that call it mount a single scope. */
function portalHost(): HTMLElement {
  const host = document.querySelector<HTMLElement>('[data-portal-host]');
  if (host === null) throw new Error('no [data-portal-host] in the document');
  return host;
}

/** The host's direct child that holds `element`: the Base UI portal node it was rendered into. */
function portalNodeOf(host: Element, element: Element): Element | null {
  let current: Element | null = element;
  while (current !== null && current.parentElement !== host) {
    current = current.parentElement;
  }
  return current;
}

/** A scope wrapper's own host: its last child, never a nested scope's. */
function ownHost(wrapper: Element): Element | null {
  return wrapper.querySelector(':scope > [data-portal-host]');
}

describe('ThemeScope', () => {
  it.each([
    ['Default', Default],
    ['PinnedDark', PinnedDark],
    ['Nested', Nested],
    ['PortalsStayInside', PortalsStayInside],
  ])('%s has no axe violations', async (name, Story) => {
    render(<Story />);
    if (name === 'PortalsStayInside') {
      // So axe covers the toast surface, which the story raises in an effect after mount.
      await screen.findByText('Remote removed');
    }
    expect(await axeDocument()).toHaveNoViolations();
  });

  it('wears the theme class and leaves the mode to the page when none is pinned', () => {
    render(<Default />);
    const wrapper = portalHost().parentElement;
    expect(wrapper).toHaveClass('theme-demo');
    expect(wrapper).not.toHaveAttribute('data-theme');
    expect(wrapper?.lastElementChild).toBe(portalHost());
  });

  it('pins the mode by writing data-theme on the wrapper', () => {
    render(<PinnedDark />);
    const wrapper = portalHost().parentElement;
    expect(wrapper).toHaveClass('theme-demo');
    expect(wrapper).toHaveAttribute('data-theme', 'dark');
  });

  it('joins a caller class after the theme class', () => {
    render(
      <ThemeScope theme={demoTheme} className="app-layout">
        <p>Inside</p>
      </ThemeScope>,
    );
    expect(portalHost().parentElement?.className).toMatch(/ theme-demo app-layout$/);
  });

  it('renders the dialog, the menu and the toast region inside the portal host', async () => {
    render(<PortalsStayInside />);
    const host = portalHost();
    await waitFor(() =>
      expect(host).toContainElement(screen.getByRole('dialog', { name: 'Remove the remote?' })),
    );
    // The open modal Dialog marks its sibling portal nodes `aria-hidden`: correct modal semantics.
    expect(host).toContainElement(screen.getByRole('menu', { hidden: true }));
    expect(host).toContainElement(screen.getByRole('region', { name: 'Notifications' }));
    expect(await screen.findByText('Remote removed')).toBeInTheDocument();
  });

  it('gives a nested scope its own host, and the nearest scope wins', async () => {
    render(<Nested />);
    const dialog = await screen.findByRole('dialog', { name: 'Inner dialog' });
    const inner = document.querySelector('.theme-demo[data-theme="light"]');
    const outer = inner?.parentElement?.closest('.theme-demo');
    expect(inner).not.toBeNull();
    expect(outer).not.toBeNull();
    expect(outer).not.toHaveAttribute('data-theme');
    const innerHost = ownHost(inner as Element);
    const outerHost = ownHost(outer as Element);
    expect(innerHost).not.toBeNull();
    expect(outerHost).not.toBeNull();
    expect(innerHost).not.toBe(outerHost);
    expect(innerHost).toContainElement(dialog);
    expect(outerHost).not.toContainElement(dialog);
  });

  describe('R19: a portal mounted in the scope’s first commit lands in the host', () => {
    it('(a) the toast region, with a toast raised in the same tick', async () => {
      const manager = createToastManager();
      render(
        <ThemeScope theme={demoTheme}>
          <ToastRegion manager={manager} />
        </ThemeScope>,
      );
      manager.add({ title: 'Saved' });
      await screen.findByText('Saved');
      expect(portalHost()).toContainElement(screen.getByRole('region', { name: 'Notifications' }));
    });

    it('(b) a dialog open by default', async () => {
      render(
        <ThemeScope theme={demoTheme}>
          <Dialog heading="Hi" defaultOpen />
        </ThemeScope>,
      );
      const dialog = await screen.findByRole('dialog', { name: 'Hi' });
      expect(portalHost()).toContainElement(dialog);
    });
  });

  describe('(c) a portal opened inside a dialog', () => {
    it('a select picks an option without closing the dialog or dropping focus', async () => {
      const onValueChange = vi.fn();
      render(
        <ThemeScope theme={demoTheme}>
          <Dialog heading="Edit item" defaultOpen>
            <Select
              label="Category"
              options={[
                { value: 'mains', label: 'Mains' },
                { value: 'sides', label: 'Sides' },
                { value: 'desserts', label: 'Desserts' },
              ]}
              onValueChange={onValueChange}
            />
          </Dialog>
        </ThemeScope>,
      );
      const host = portalHost();
      const dialog = await screen.findByRole('dialog', { name: 'Edit item' });
      const trigger = screen.getByRole('combobox', { name: 'Category' });
      trigger.focus();
      await userEvent.keyboard('{Enter}');
      const mains = await screen.findByRole('option', { name: 'Mains' });
      await waitFor(() => expect(mains).toHaveFocus());

      const listboxNode = portalNodeOf(host, screen.getByRole('listbox'));
      const dialogNode = portalNodeOf(host, dialog);
      expect(listboxNode).not.toBeNull();
      expect(dialogNode).not.toBeNull();
      expect(listboxNode).not.toBe(dialogNode);

      await userEvent.keyboard('{ArrowDown}{Enter}');
      await waitFor(() => expect(onValueChange).toHaveBeenCalledWith('sides'));
      await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument());
      expect(screen.getByRole('dialog', { name: 'Edit item' })).toBeInTheDocument();
      expect(document.activeElement).not.toBe(document.body);
      expect(document.activeElement).toBe(trigger);
    });

    describe('a date picker', () => {
      beforeEach(() => {
        vi.useFakeTimers({ toFake: ['Date'], now: new Date(2026, 2, 18, 12) });
      });

      afterEach(() => {
        vi.useRealTimers();
      });

      it('chooses a date and closes on Escape without closing the dialog or dropping focus', async () => {
        render(
          <ThemeScope theme={demoTheme}>
            <Dialog heading="New event" defaultOpen>
              <DatePicker label="Event date" defaultValue="2026-03-08" locale="en-US" />
            </Dialog>
          </ThemeScope>,
        );
        const host = portalHost();
        const dialog = await screen.findByRole('dialog', { name: 'New event' });

        await userEvent.click(screen.getByRole('button', { name: /Event date/ }));
        const calendar = await screen.findByRole('dialog', { name: 'Event date' });
        const calendarNode = portalNodeOf(host, calendar);
        const dialogNode = portalNodeOf(host, dialog);
        expect(calendarNode).not.toBeNull();
        expect(dialogNode).not.toBeNull();
        expect(calendarNode).not.toBe(dialogNode);

        await userEvent.click(screen.getByRole('gridcell', { name: 'Monday, March 16, 2026' }));
        await waitFor(() =>
          expect(screen.queryByRole('dialog', { name: 'Event date' })).not.toBeInTheDocument(),
        );
        expect(screen.getByRole('dialog', { name: 'New event' })).toBeInTheDocument();
        const chosenTrigger = screen.getByRole('button', { name: 'Event date Mar 16, 2026' });
        expect(document.activeElement).not.toBe(document.body);
        expect(chosenTrigger).toHaveFocus();

        await userEvent.click(chosenTrigger);
        await screen.findByRole('dialog', { name: 'Event date' });
        await userEvent.keyboard('{Escape}');
        await waitFor(() =>
          expect(screen.queryByRole('dialog', { name: 'Event date' })).not.toBeInTheDocument(),
        );
        expect(screen.getByRole('dialog', { name: 'New event' })).toBeInTheDocument();
        expect(document.activeElement).not.toBe(document.body);
        expect(chosenTrigger).toHaveFocus();
      });
    });
  });

  it('ships a demo theme that passes the library contrast check', () => {
    expect(checkThemeContrast(demoTheme)).toEqual([]);
  });

  it('reports no portal container outside any scope', () => {
    const observe = vi.fn();
    function Probe() {
      observe(usePortalContainer());
      return null;
    }
    render(<Probe />);
    expect(observe).toHaveBeenCalled();
    expect(observe).toHaveBeenLastCalledWith(undefined);
  });

  describe('refuses a theme defineTheme did not make', () => {
    let consoleError: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    });

    afterEach(() => {
      consoleError.mockRestore();
    });

    it('a plain object', () => {
      const plain = { ...demoTheme } as Record<PropertyKey, unknown>;
      delete plain[themeBrand];
      expect(() =>
        render(
          <ThemeScope theme={plain as unknown as Theme}>
            <p>Inside</p>
          </ThemeScope>,
        ),
      ).toThrow(brandMessage);
    });

    it('a theme from a second copy of the tokens package', () => {
      const foreign = {
        ...demoTheme,
        [themeBrand]: undefined,
        [Symbol('calcifer-design-theme')]: true,
      } as unknown as Theme;
      expect(() =>
        render(
          <ThemeScope theme={foreign}>
            <p>Inside</p>
          </ThemeScope>,
        ),
      ).toThrow(brandMessage);
    });
  });
});
