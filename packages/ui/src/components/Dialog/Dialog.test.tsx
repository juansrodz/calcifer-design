import { composeStories } from '@storybook/react';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRef, useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { axeDocument } from '../../../test/axe';
import a11yStyles from '../../styles/a11y.module.css';
import closeCircleStyles from '../../styles/closeCircle.module.css';
import { Field } from '../Field/Field';
import { TextInput } from '../TextInput/TextInput';
import { ThemeScope } from '../ThemeScope/ThemeScope';
import { demoTheme } from '../ThemeScope/fixtures';
import { Dialog, type DialogVariant, type SheetSide } from './Dialog';
import * as stories from './Dialog.stories';

const {
  Default,
  OpenOnLoad,
  Sheet,
  SideSheet,
  Persistent,
  HeaderSlots,
  HiddenHeading,
  SheetWithFooter,
  SideSheetWithFooter,
  HiddenClose,
  HeadingHooks,
  LongBody,
} = composeStories(stories);

describe('Dialog', () => {
  it.each([
    ['Default', Default],
    ['OpenOnLoad', OpenOnLoad],
    ['Sheet', Sheet],
    ['SideSheet', SideSheet],
    ['Persistent', Persistent],
    ['HeaderSlots', HeaderSlots],
    ['HiddenHeading', HiddenHeading],
    ['SheetWithFooter', SheetWithFooter],
    ['SideSheetWithFooter', SideSheetWithFooter],
    ['HeadingHooks', HeadingHooks],
    ['LongBody', LongBody],
  ])('%s has no axe violations', async (_name, Story) => {
    render(<Story />);
    expect(await axeDocument()).toHaveNoViolations();
  });

  it('stays closed until the trigger is pressed, then names and describes itself', async () => {
    render(<Default />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Remove remote' }));
    const popup = await screen.findByRole('dialog', { name: 'Remove the showcase remote?' });
    expect(popup).toHaveAccessibleDescription(
      'It disappears from the registry; the deployment itself is untouched.',
    );
  });

  it('moves focus to the close control, so the first Tab lands inside the dialog', async () => {
    render(<Default />);
    await userEvent.click(screen.getByRole('button', { name: 'Remove remote' }));
    const popup = await screen.findByRole('dialog');
    // Base UI focuses a frame after the popup mounts; `findByRole` returns before that.
    await waitFor(() => expect(within(popup).getByRole('button', { name: 'Close' })).toHaveFocus());
  });

  it('closes on Escape and returns focus to the trigger', async () => {
    render(<Default />);
    const trigger = screen.getByRole('button', { name: 'Remove remote' });
    await userEvent.click(trigger);
    await screen.findByRole('dialog');
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
  });

  it('closes from the header control', async () => {
    render(<OpenOnLoad />);
    const popup = await screen.findByRole('dialog');
    await userEvent.click(within(popup).getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('closes on a press outside it', async () => {
    render(<OpenOnLoad />);
    await screen.findByRole('dialog');
    await userEvent.click(document.body);
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('keeps a persistent dialog open on a press outside it', async () => {
    render(<Persistent />);
    await screen.findByRole('dialog');
    await userEvent.click(document.body);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('renders the heading as an h2 by default, and at the level asked for', async () => {
    const { unmount } = render(<OpenOnLoad />);
    expect(
      await screen.findByRole('heading', { level: 2, name: 'Remove the showcase remote?' }),
    ).toBeInTheDocument();
    unmount();
    render(<OpenOnLoad headingLevel={3} />);
    expect(
      await screen.findByRole('heading', { level: 3, name: 'Remove the showcase remote?' }),
    ).toBeInTheDocument();
  });

  it('renders the footer inside the dialog', async () => {
    render(<OpenOnLoad />);
    const popup = await screen.findByRole('dialog');
    expect(within(popup).getByRole('button', { name: 'Remove' })).toBeInTheDocument();
  });

  it('marks the sheet variant on both the popup and the viewport that docks it', async () => {
    render(<Sheet />);
    const popup = await screen.findByRole('dialog');
    expect(popup).toHaveAttribute('data-popup', 'sheet');
    expect(popup).toHaveAttribute('data-side', 'bottom');
    expect(popup.parentElement).toHaveAttribute('data-variant', 'sheet');
    expect(popup.parentElement).toHaveAttribute('data-side', 'bottom');
  });

  it('docks a side sheet to the end edge, on both the popup and the viewport', async () => {
    render(<SideSheet />);
    const popup = await screen.findByRole('dialog');
    expect(popup).toHaveAttribute('data-popup', 'sheet');
    expect(popup).toHaveAttribute('data-side', 'end');
    expect(popup.parentElement).toHaveAttribute('data-side', 'end');
  });

  it('marks the centred variant too, so the two never share a rule by accident', async () => {
    render(<OpenOnLoad />);
    const popup = await screen.findByRole('dialog');
    expect(popup).toHaveAttribute('data-popup', 'dialog');
    expect(popup).not.toHaveAttribute('data-side');
    expect(popup.parentElement).not.toHaveAttribute('data-side');
  });

  // The scrim carries the same two attributes as the viewport so `popup.module.css` can give the
  // bottom sheet's backdrop its own colour. The backdrop is found by its class: the viewport also
  // carries `data-variant` and `data-side`, so an attribute query would match both. The tests'
  // `classNameStrategy: 'non-scoped'` keeps `popupStyles.scrim` as `scrim`.
  it('marks the bottom sheet’s scrim with the variant and the side', async () => {
    render(<Sheet />);
    await screen.findByRole('dialog');
    const scrim = document.querySelector('.scrim');
    expect(scrim).not.toBeNull();
    expect(scrim).toHaveAttribute('data-variant', 'sheet');
    expect(scrim).toHaveAttribute('data-side', 'bottom');
  });

  it('marks the end drawer’s scrim with the end side', async () => {
    render(<SideSheet />);
    await screen.findByRole('dialog');
    const scrim = document.querySelector('.scrim');
    expect(scrim).toHaveAttribute('data-variant', 'sheet');
    expect(scrim).toHaveAttribute('data-side', 'end');
  });

  it('marks the centred dialog’s scrim with the variant and no side', async () => {
    render(<OpenOnLoad />);
    await screen.findByRole('dialog');
    const scrim = document.querySelector('.scrim');
    expect(scrim).not.toBeNull();
    expect(scrim).toHaveAttribute('data-variant', 'center');
    expect(scrim).not.toHaveAttribute('data-side');
  });

  it('has no axe violations when the hidden-close sheet is open', async () => {
    render(<HiddenClose />);
    await userEvent.click(screen.getByRole('button', { name: 'Remove remote' }));
    await screen.findByRole('dialog');
    expect(await axeDocument()).toHaveNoViolations();
  });

  describe('the close control', () => {
    // L2-21 / O-33: the close is drawn at the `--size-close` circle through the shared close-circle
    // class (`styles/closeCircle.module.css`), so it is `sm` in both variants, never `md`, and its
    // 44 px hit area is that stylesheet's.
    it('is a ghost control carrying the close class by default', async () => {
      render(<OpenOnLoad />);
      const close = within(await screen.findByRole('dialog')).getByRole('button', {
        name: 'Close',
      });
      expect(close).toHaveAttribute('data-variant', 'ghost');
      expect(close).toHaveAttribute('data-size', 'sm');
      expect(close).toHaveClass(closeCircleStyles.close);
    });

    it('is soft and still the close circle with closeVariant="soft"', async () => {
      render(<HeaderSlots />);
      const close = within(await screen.findByRole('dialog')).getByRole('button', {
        name: 'Close',
      });
      expect(close).toHaveAttribute('data-variant', 'soft');
      expect(close).toHaveAttribute('data-size', 'sm');
      expect(close).toHaveClass(closeCircleStyles.close);
    });
  });

  describe('the header slots', () => {
    it('lays out the start slot, the heading, then the end group holding the controls and the close', async () => {
      render(<HeaderSlots />);
      const popup = await screen.findByRole('dialog');
      const heading = within(popup).getByRole('heading', { name: 'Pasta night' });
      const header = heading.parentElement as HTMLElement;
      const [start, title, end] = Array.from(header.children);
      expect(start).toHaveTextContent('Draft');
      expect(title).toBe(heading);
      expect(end).toHaveClass('headerEnd');
      expect(header.children).toHaveLength(3);
      const [more, close] = Array.from((end as HTMLElement).children);
      expect(more).toBe(within(popup).getByRole('button', { name: 'More' }));
      expect(close).toBe(within(popup).getByRole('button', { name: 'Close' }));
    });

    // Review Focus 5: a slot button must never take the opening focus.
    it('opens with focus on Close, not on the end slot’s button, and Escape returns it to the trigger', async () => {
      render(<HeaderSlots defaultOpen={false} />);
      const trigger = screen.getByRole('button', { name: 'Remove remote' });
      await userEvent.click(trigger);
      const popup = await screen.findByRole('dialog');
      await waitFor(() =>
        expect(within(popup).getByRole('button', { name: 'Close' })).toHaveFocus(),
      );
      expect(within(popup).getByRole('button', { name: 'More' })).not.toHaveFocus();
      await userEvent.keyboard('{Escape}');
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
      expect(trigger).toHaveFocus();
    });

    it('keeps the end slot and draws no close with closeHidden', async () => {
      render(<HeaderSlots closeHidden />);
      const popup = await screen.findByRole('dialog');
      expect(within(popup).getByRole('button', { name: 'More' })).toBeInTheDocument();
      expect(within(popup).queryByRole('button', { name: 'Close' })).not.toBeInTheDocument();
    });

    it('gives a plain dialog a header of the heading and an end group holding only the close', async () => {
      render(<OpenOnLoad />);
      const popup = await screen.findByRole('dialog');
      const heading = within(popup).getByRole('heading');
      const header = heading.parentElement as HTMLElement;
      const [first, end] = Array.from(header.children);
      expect(header.children).toHaveLength(2);
      expect(first).toBe(heading);
      expect(Array.from((end as HTMLElement).children)).toEqual([
        within(popup).getByRole('button', { name: 'Close' }),
      ]);
    });

    it('draws no end group at all with closeHidden and no end slot', async () => {
      render(<OpenOnLoad closeHidden />);
      const heading = await screen.findByRole('heading');
      expect(heading.parentElement?.children).toHaveLength(1);
    });
  });

  describe('the hidden heading', () => {
    it('stays the dialog’s name while carrying the visually-hidden class', async () => {
      render(<HiddenHeading />);
      const popup = await screen.findByRole('dialog', { name: 'Remove the showcase remote?' });
      const heading = within(popup).getByRole('heading', { name: 'Remove the showcase remote?' });
      expect(heading).toHaveClass(a11yStyles.visuallyHidden);
    });

    it('does not hide the heading unless asked', async () => {
      render(<OpenOnLoad />);
      const heading = await screen.findByRole('heading', { name: 'Remove the showcase remote?' });
      expect(heading).not.toHaveClass(a11yStyles.visuallyHidden);
    });
  });

  describe('the touch rule for the opening focus', () => {
    it('focuses the popup itself, not Close, when a sheet is opened by touch', async () => {
      render(<Sheet defaultOpen={false} />);
      const trigger = screen.getByRole('button', { name: 'Remove remote' });
      await userEvent.pointer({ keys: '[TouchA]', target: trigger });
      const popup = await screen.findByRole('dialog');
      await waitFor(() => expect(popup).toHaveFocus());
      expect(within(popup).getByRole('button', { name: 'Close' })).not.toHaveFocus();
    });
  });

  // Base UI returns focus to the control that held it when the dialog opened, and to the trigger
  // when there is one. A dialog opened from a URL, or whose opener unmounts while it is open,
  // leaves it nowhere to go, so the page says where with `finalFocus`.
  describe('the focus returned on close', () => {
    type ReturnMode =
      'none' | 'ref' | 'function' | 'recording' | 'null' | 'nothing' | 'true' | 'off';
    /** What the return ref points at: Base UI focuses it only if it can take focus. */
    type Target = 'button' | 'heading' | 'plainHeading' | 'headingWithLink';

    function ItemPage({
      returnMode,
      target = 'button',
      keepOpener = true,
      startOpen = false,
      movesFocusOnClose = false,
      closeTypes,
      variant,
      side,
    }: {
      returnMode: ReturnMode;
      target?: Target;
      keepOpener?: boolean;
      startOpen?: boolean;
      /** The page's own close handler focuses "Somewhere else" as the dialog closes. */
      movesFocusOnClose?: boolean;
      closeTypes?: string[];
      variant?: DialogVariant;
      side?: SheetSide;
    }) {
      const [open, setOpen] = useState(startOpen);
      const returnRef = useRef<HTMLElement | null>(null);
      const elsewhereRef = useRef<HTMLButtonElement>(null);
      const finalFocus = {
        none: undefined,
        ref: returnRef,
        function: () => returnRef.current,
        recording: (closeType: string) => {
          closeTypes?.push(closeType);
          return returnRef.current;
        },
        null: () => null,
        nothing: () => undefined,
        true: true,
        off: false,
      }[returnMode];
      const attachReturnRef = (element: HTMLElement | null) => {
        returnRef.current = element;
      };
      const targets = {
        button: (
          <button ref={attachReturnRef} data-testid="return-target" type="button">
            Back to the list
          </button>
        ),
        heading: (
          <h3 ref={attachReturnRef} data-testid="return-target" tabIndex={-1}>
            Back to the list
          </h3>
        ),
        plainHeading: (
          <h3 ref={attachReturnRef} data-testid="return-target">
            Back to the list
          </h3>
        ),
        headingWithLink: (
          <h3 ref={attachReturnRef} data-testid="return-target" tabIndex={-1}>
            <a href="#list">Back to the list</a>
          </h3>
        ),
      };
      return (
        <>
          {open && !keepOpener ? null : (
            <button type="button" onClick={() => setOpen(true)}>
              Open item
            </button>
          )}
          {targets[target]}
          <button ref={elsewhereRef} type="button">
            Somewhere else
          </button>
          <Dialog
            heading="The item"
            variant={variant}
            side={side}
            open={open}
            onOpenChange={(nextOpen) => {
              setOpen(nextOpen);
              if (movesFocusOnClose && !nextOpen) elsewhereRef.current?.focus();
            }}
            finalFocus={finalFocus}
          >
            <p>Body.</p>
          </Dialog>
        </>
      );
    }

    const getTarget = () => screen.getByTestId('return-target');
    const getOpener = () => screen.getByRole('button', { name: 'Open item' });

    async function closeWithEscape() {
      const popup = await screen.findByRole('dialog');
      // Base UI moves focus in a frame after the popup mounts; closing before that would leave
      // focus where it began, which tells the tests nothing about where it returns to.
      await waitFor(() => expect(popup.contains(document.activeElement)).toBe(true));
      await userEvent.keyboard('{Escape}');
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    }

    async function openFromOpenerAndClose() {
      await userEvent.click(getOpener());
      await closeWithEscape();
    }

    it.each([
      ['a ref', 'ref'],
      ['a function', 'function'],
    ] as const)(
      'sends focus to the element %s names when a dialog opened with no trigger is closed',
      async (_form, returnMode) => {
        render(<ItemPage returnMode={returnMode} startOpen />);
        await closeWithEscape();
        expect(getTarget()).toHaveFocus();
      },
    );

    it.each([
      ['a centred dialog', 'center', undefined],
      ['a bottom sheet', 'sheet', 'bottom'],
      ['an end sheet', 'sheet', 'end'],
    ] as const)('does so for %s', async (_name, variant, side) => {
      render(<ItemPage returnMode="ref" variant={variant} side={side} startOpen />);
      await closeWithEscape();
      expect(getTarget()).toHaveFocus();
    });

    it('sends focus there when the control that opened the dialog has unmounted', async () => {
      render(<ItemPage returnMode="ref" keepOpener={false} />);
      await openFromOpenerAndClose();
      expect(getTarget()).toHaveFocus();
    });

    it('prefers the named element to the control that opened the dialog', async () => {
      render(<ItemPage returnMode="ref" />);
      await openFromOpenerAndClose();
      expect(getTarget()).toHaveFocus();
      expect(getOpener()).not.toHaveFocus();
    });

    it('hands a function how the dialog was closed', async () => {
      const closeTypes: string[] = [];
      render(<ItemPage returnMode="recording" closeTypes={closeTypes} startOpen />);
      await closeWithEscape();
      expect(closeTypes).toEqual(['keyboard']);
      expect(getTarget()).toHaveFocus();
    });

    it('moves focus nowhere with false, not even back to the opener', async () => {
      render(<ItemPage returnMode="off" />);
      await openFromOpenerAndClose();
      expect(getOpener()).not.toHaveFocus();
      expect(getTarget()).not.toHaveFocus();
    });

    it('moves focus nowhere from a function that returns nothing', async () => {
      render(<ItemPage returnMode="nothing" />);
      await openFromOpenerAndClose();
      expect(getOpener()).not.toHaveFocus();
      expect(getTarget()).not.toHaveFocus();
    });

    it.each([
      ['true', 'true'],
      ['a function that returns null', 'null'],
    ] as const)(
      'keeps the default with %s: focus goes back to the opener',
      async (_form, returnMode) => {
        render(<ItemPage returnMode={returnMode} />);
        await openFromOpenerAndClose();
        expect(getOpener()).toHaveFocus();
        expect(getTarget()).not.toHaveFocus();
      },
    );

    describe('the element named has to be able to take focus', () => {
      it('takes focus when it is a heading with tabIndex -1', async () => {
        render(<ItemPage returnMode="ref" target="heading" startOpen />);
        await closeWithEscape();
        expect(getTarget()).toHaveFocus();
      });

      it('does not take focus when it is a plain heading, and the opener does not take over', async () => {
        render(<ItemPage returnMode="ref" target="plainHeading" />);
        await openFromOpenerAndClose();
        expect(getTarget()).not.toHaveFocus();
        expect(getOpener()).not.toHaveFocus();
        expect(document.body).toHaveFocus();
      });

      it('hands focus to its first tabbable descendant when it is not tabbable itself', async () => {
        render(<ItemPage returnMode="ref" target="headingWithLink" startOpen />);
        await closeWithEscape();
        expect(screen.getByRole('link', { name: 'Back to the list' })).toHaveFocus();
        expect(getTarget()).not.toHaveFocus();
      });
    });

    describe('against focus the page moves itself as the dialog closes', () => {
      it('is unchanged without the prop: focus stays where the page put it', async () => {
        render(<ItemPage returnMode="none" movesFocusOnClose />);
        await openFromOpenerAndClose();
        expect(screen.getByRole('button', { name: 'Somewhere else' })).toHaveFocus();
      });

      it('lets the named element win over it', async () => {
        render(<ItemPage returnMode="ref" movesFocusOnClose />);
        const focusedElsewhere = vi.fn();
        screen
          .getByRole('button', { name: 'Somewhere else' })
          .addEventListener('focusin', focusedElsewhere);
        await openFromOpenerAndClose();
        // The page did move focus, so the named element beat a real move.
        expect(focusedElsewhere).toHaveBeenCalledOnce();
        expect(getTarget()).toHaveFocus();
      });
    });

    describe('on a dialog nested in another', () => {
      function NestedPage() {
        const [open, setOpen] = useState(true);
        const returnRef = useRef<HTMLButtonElement>(null);
        return (
          <>
            <button ref={returnRef} type="button">
              Back to the list
            </button>
            <Dialog heading="The item" open={open} onOpenChange={setOpen} finalFocus={returnRef}>
              <Dialog heading="Remove the item?" trigger={<button type="button">Remove</button>}>
                <p>This cannot be undone.</p>
              </Dialog>
            </Dialog>
          </>
        );
      }

      it('keeps the outer dialog’s target for the outer dialog, not its confirm', async () => {
        render(<NestedPage />);
        const outer = await screen.findByRole('dialog', { name: 'The item' });
        await waitFor(() => expect(outer.contains(document.activeElement)).toBe(true));
        await userEvent.click(within(outer).getByRole('button', { name: 'Remove' }));
        const confirm = await screen.findByRole('dialog', { name: 'Remove the item?' });
        await waitFor(() => expect(confirm.contains(document.activeElement)).toBe(true));
        await userEvent.keyboard('{Escape}');
        await waitFor(() =>
          expect(
            screen.queryByRole('dialog', { name: 'Remove the item?' }),
          ).not.toBeInTheDocument(),
        );
        // The confirm closed alone: the outer is open and focus is back on the confirm's trigger.
        expect(screen.getByRole('dialog', { name: 'The item' })).toBeInTheDocument();
        await waitFor(() => expect(screen.getByRole('button', { name: 'Remove' })).toHaveFocus());
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
        expect(screen.getByRole('button', { name: 'Back to the list' })).toHaveFocus();
      });
    });

    describe('without the prop', () => {
      it('is unchanged: focus goes back to the opener, not to a bystander', async () => {
        render(<ItemPage returnMode="none" />);
        await openFromOpenerAndClose();
        expect(getOpener()).toHaveFocus();
        expect(getTarget()).not.toHaveFocus();
      });

      it('is unchanged: an opener that has gone is not replaced by a bystander', async () => {
        render(<ItemPage returnMode="none" keepOpener={false} />);
        await openFromOpenerAndClose();
        expect(getTarget()).not.toHaveFocus();
      });
    });
  });

  describe('the grab handle', () => {
    it.each([
      ['Sheet', Sheet],
      ['SheetWithFooter', SheetWithFooter],
    ])('is the first child of the bottom sheet in %s', async (_name, Story) => {
      render(<Story />);
      const popup = await screen.findByRole('dialog');
      const handle = popup.firstElementChild;
      expect(handle).toHaveAttribute('aria-hidden', 'true');
      expect(handle).toHaveClass('handle');
    });

    it.each([
      ['SideSheet', SideSheet],
      ['SideSheetWithFooter', SideSheetWithFooter],
      ['OpenOnLoad', OpenOnLoad],
    ])('is absent from %s', async (_name, Story) => {
      render(<Story />);
      const popup = await screen.findByRole('dialog');
      expect(popup.querySelector('.handle')).toBeNull();
      expect(popup.firstElementChild).not.toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('the sheet footer', () => {
    it.each([
      ['SheetWithFooter', SheetWithFooter],
      ['SideSheetWithFooter', SideSheetWithFooter],
    ])('keeps the footer after the scrolling body in %s', async (_name, Story) => {
      render(<Story />);
      const popup = await screen.findByRole('dialog');
      const footer = within(popup).getByRole('button', { name: 'Register the remote' })
        .parentElement as HTMLElement;
      expect(footer).toHaveClass('footer');
      expect(footer.previousElementSibling).toHaveClass('body');
      expect(footer.nextElementSibling).toBeNull();
    });
  });

  // jsdom does no layout and has no ResizeObserver. These stub both: every `.body` is 200px tall
  // and 300px wide, its content `contentHeight` by `contentWidth`, and each observer runs when
  // `reportResize` says the browser would have (its first report, then any later resize). Each
  // stub instance records what it observes, lets go of and whether it was disconnected.
  describe('the scrolling body', () => {
    const bodyHeight = 200;
    const bodyWidth = 300;
    let contentHeight = 0;
    let contentWidth = bodyWidth;
    interface ObserverRecord {
      callback: () => void;
      observed: Element[];
      unobserved: Element[];
      /** What the instance watches now: observed and not since let go of. */
      watching: Set<Element>;
      disconnects: number;
    }
    let observerRecords: ObserverRecord[] = [];
    // jsdom's MutationObserver is real; this subclass also counts the disconnects of each one that
    // watches a `.body`.
    let bodyMutationRecords: Array<{ disconnects: number }> = [];
    const RealMutationObserver = globalThis.MutationObserver;
    class RecordingMutationObserver extends RealMutationObserver {
      private readonly record = { disconnects: 0 };
      override observe(target: Node, options?: MutationObserverInit) {
        if (target instanceof Element && target.classList.contains('body')) {
          bodyMutationRecords.push(this.record);
        }
        super.observe(target, options);
      }
      override disconnect() {
        this.record.disconnects += 1;
        super.disconnect();
      }
    }
    const elementPrototype = HTMLElement.prototype;
    const measuredProperties = [
      'scrollHeight',
      'clientHeight',
      'scrollWidth',
      'clientWidth',
    ] as const;
    const originalDescriptors = measuredProperties.map(
      (property) =>
        [property, Object.getOwnPropertyDescriptor(elementPrototype, property)] as const,
    );

    function stubBodySize(property: (typeof measuredProperties)[number], read: () => number) {
      Object.defineProperty(elementPrototype, property, {
        configurable: true,
        get(this: HTMLElement) {
          return this.classList.contains('body') ? read() : 0;
        },
      });
    }

    beforeEach(() => {
      contentHeight = 0;
      contentWidth = bodyWidth;
      observerRecords = [];
      bodyMutationRecords = [];
      globalThis.MutationObserver = RecordingMutationObserver;
      class ResizeObserverStub {
        private readonly record: ObserverRecord;
        constructor(callback: () => void) {
          this.record = {
            callback,
            observed: [],
            unobserved: [],
            watching: new Set(),
            disconnects: 0,
          };
          observerRecords.push(this.record);
        }
        // A real ResizeObserver throws on anything but an element (a text node, say).
        observe(target: Element) {
          if (!(target instanceof Element)) {
            throw new TypeError('ResizeObserver.observe: the target is not an Element.');
          }
          this.record.observed.push(target);
          this.record.watching.add(target);
        }
        unobserve(target: Element) {
          if (!(target instanceof Element)) {
            throw new TypeError('ResizeObserver.unobserve: the target is not an Element.');
          }
          this.record.unobserved.push(target);
          this.record.watching.delete(target);
        }
        disconnect() {
          this.record.disconnects += 1;
          this.record.watching.clear();
        }
      }
      globalThis.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver;
      stubBodySize('scrollHeight', () => contentHeight);
      stubBodySize('clientHeight', () => bodyHeight);
      stubBodySize('scrollWidth', () => contentWidth);
      stubBodySize('clientWidth', () => bodyWidth);
    });

    afterEach(() => {
      delete (globalThis as { ResizeObserver?: unknown }).ResizeObserver;
      globalThis.MutationObserver = RealMutationObserver;
      for (const [property, original] of originalDescriptors) {
        if (original) Object.defineProperty(elementPrototype, property, original);
        else delete (elementPrototype as unknown as Record<string, unknown>)[property];
      }
    });

    function reportResize(nextContentHeight: number, nextContentWidth = bodyWidth) {
      contentHeight = nextContentHeight;
      contentWidth = nextContentWidth;
      act(() => {
        for (const observerRecord of observerRecords) observerRecord.callback();
      });
    }

    /** The observers watching a `.body`: the hook's, not any Base UI keeps for itself. */
    function bodyObservers() {
      return observerRecords.filter((observerRecord) =>
        observerRecord.observed.some((target) => target.classList.contains('body')),
      );
    }

    async function openSheet() {
      render(<SheetWithFooter />);
      const popup = await screen.findByRole('dialog');
      return { popup, body: popup.querySelector('.body') as HTMLElement };
    }

    /** A dialog the test opens and closes by its own toggle, so the popup unmounts in between. */
    function ToggledDialog({ closeHidden = false }: { closeHidden?: boolean }) {
      const [open, setOpen] = useState(true);
      return (
        <>
          <button type="button" onClick={() => setOpen((wasOpen) => !wasOpen)}>
            Toggle
          </button>
          <Dialog heading="Notes" open={open} onOpenChange={setOpen} closeHidden={closeHidden}>
            <p>First paragraph.</p>
            <Field label="Title">
              <TextInput />
            </Field>
          </Dialog>
        </>
      );
    }

    // While the dialog is open the page behind it is inert, so the toggle is pressed directly.
    function pressToggle() {
      act(() => screen.getByRole('button', { name: 'Toggle', hidden: true }).click());
    }

    async function closeAndReopen() {
      pressToggle();
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
      pressToggle();
      return screen.findByRole('dialog');
    }

    it('is a Tab stop and a region named by the heading while its content overflows', async () => {
      const { popup, body } = await openSheet();
      reportResize(600);
      expect(body).toHaveAttribute('tabindex', '0');
      expect(body).toHaveAttribute('role', 'region');
      const heading = within(popup).getByRole('heading', { name: 'Remove the showcase remote?' });
      expect(body).toHaveAttribute('aria-labelledby', heading.id);
      expect(within(popup).getByRole('region', { name: 'Remove the showcase remote?' })).toBe(body);
      expect(await axeDocument()).toHaveNoViolations();
    });

    it('adds no Tab stop, role or name while its content fits', async () => {
      const { body } = await openSheet();
      reportResize(bodyHeight);
      expect(body).not.toHaveAttribute('tabindex');
      expect(body).not.toHaveAttribute('role');
      expect(body).not.toHaveAttribute('aria-labelledby');
    });

    it('counts content wider than the body as overflow too', async () => {
      const { body } = await openSheet();
      reportResize(bodyHeight, 600);
      expect(body).toHaveAttribute('tabindex', '0');
      expect(body).toHaveAttribute('role', 'region');
    });

    it('follows a change between fitting and overflowing, both ways', async () => {
      const { body } = await openSheet();
      reportResize(100);
      expect(body).not.toHaveAttribute('tabindex');
      reportResize(600);
      expect(body).toHaveAttribute('tabindex', '0');
      expect(body).toHaveAttribute('role', 'region');
      reportResize(150);
      expect(body).not.toHaveAttribute('tabindex');
      expect(body).not.toHaveAttribute('role');
      expect(body).not.toHaveAttribute('aria-labelledby');
    });

    it('is reached by Tab from Close while it overflows', async () => {
      const { popup, body } = await openSheet();
      reportResize(600);
      await waitFor(() =>
        expect(within(popup).getByRole('button', { name: 'Close' })).toHaveFocus(),
      );
      await userEvent.tab();
      expect(body).toHaveFocus();
    });

    it('observes the body and each of its children, and disconnects when the dialog closes', async () => {
      render(<ToggledDialog />);
      const popup = await screen.findByRole('dialog');
      const body = popup.querySelector('.body') as HTMLElement;
      const [observer, ...others] = bodyObservers();
      expect(others).toHaveLength(0);
      expect(observer?.observed).toEqual([body, ...Array.from(body.children)]);
      expect(observer?.disconnects).toBe(0);
      expect(bodyMutationRecords).toEqual([{ disconnects: 0 }]);
      pressToggle();
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
      expect(observer?.disconnects).toBe(1);
      expect(bodyMutationRecords).toEqual([{ disconnects: 1 }]);
    });

    it('observes a child added after it opened, and measures again', async () => {
      const { body } = await openSheet();
      reportResize(100);
      const [observer] = bodyObservers();
      contentHeight = 600;
      const lateParagraph = document.createElement('p');
      lateParagraph.textContent = 'A late paragraph.';
      await act(async () => {
        body.appendChild(lateParagraph);
        await Promise.resolve();
      });
      expect(observer?.observed).toContain(lateParagraph);
      expect(body).toHaveAttribute('tabindex', '0');
      expect(body).toHaveAttribute('role', 'region');
    });

    it('measures again when a text node is added straight to the body, and when it leaves', async () => {
      const { body } = await openSheet();
      reportResize(100);
      contentHeight = 600;
      const looseText = document.createTextNode('A line of loose text.');
      await act(async () => {
        body.appendChild(looseText);
        await Promise.resolve();
      });
      expect(body).toHaveAttribute('tabindex', '0');
      expect(body).toHaveAttribute('role', 'region');
      contentHeight = 100;
      await act(async () => {
        looseText.remove();
        await Promise.resolve();
      });
      expect(body).not.toHaveAttribute('tabindex');
      expect(body).not.toHaveAttribute('role');
    });

    it('watches only the body’s own children, so nothing nested outlives its removed ancestor', async () => {
      const { body } = await openSheet();
      reportResize(100);
      const [observer] = bodyObservers();
      const paragraph = body.firstElementChild as Element;
      const nested = document.createElement('span');
      await act(async () => {
        paragraph.appendChild(nested);
        await Promise.resolve();
      });
      await act(async () => {
        paragraph.remove();
        await Promise.resolve();
      });
      expect(observer?.observed).not.toContain(nested);
      expect(observer?.watching.has(paragraph)).toBe(false);
      expect(observer?.watching.has(nested)).toBe(false);
    });

    it('lets go of a child that leaves, and measures again', async () => {
      const { body } = await openSheet();
      reportResize(600);
      const [observer] = bodyObservers();
      const firstChild = body.firstElementChild as Element;
      contentHeight = 100;
      await act(async () => {
        firstChild.remove();
        await Promise.resolve();
      });
      expect(observer?.unobserved).toEqual([firstChild]);
      expect(body).not.toHaveAttribute('tabindex');
    });

    it('measures again when text set straight in the body changes', async () => {
      render(
        <Dialog heading="Notes" defaultOpen>
          {'A short note.'}
        </Dialog>,
      );
      const popup = await screen.findByRole('dialog');
      const body = popup.querySelector('.body') as HTMLElement;
      reportResize(100);
      contentHeight = 600;
      await act(async () => {
        (body.firstChild as Text).data = 'A note that has grown far longer than the body.';
        await Promise.resolve();
      });
      expect(body).toHaveAttribute('tabindex', '0');
    });

    it('reopens with no Tab stop on a body that fits, before any measure', async () => {
      render(<ToggledDialog />);
      await screen.findByRole('dialog');
      reportResize(600);
      contentHeight = 100;
      const popup = await closeAndReopen();
      expect(popup.querySelector('.body')).not.toHaveAttribute('tabindex');
      expect(popup.querySelector('.body')).not.toHaveAttribute('role');
    });

    it('reopens a dialog without a header close with focus on its field, not the body', async () => {
      render(<ToggledDialog closeHidden />);
      await screen.findByRole('dialog');
      reportResize(600);
      contentHeight = 100;
      const popup = await closeAndReopen();
      await waitFor(() => expect(within(popup).getByLabelText('Title')).toHaveFocus());
    });
  });

  describe('without a header close', () => {
    async function openByKeyboard() {
      render(<HiddenClose />);
      const trigger = screen.getByRole('button', { name: 'Remove remote' });
      trigger.focus();
      await userEvent.keyboard('{Enter}');
      const popup = await screen.findByRole('dialog', { name: 'Rename the remote' });
      return { trigger, popup };
    }

    it('draws no Close and opens with focus on the text field', async () => {
      const { popup } = await openByKeyboard();
      expect(within(popup).queryByRole('button', { name: 'Close' })).not.toBeInTheDocument();
      await waitFor(() =>
        expect(within(popup).getByRole('textbox', { name: 'Name' })).toHaveFocus(),
      );
    });

    it('closes on Escape and returns focus to the trigger', async () => {
      const { trigger } = await openByKeyboard();
      await userEvent.keyboard('{Escape}');
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
      expect(trigger).toHaveFocus();
    });

    it('closes from the footer’s Cancel', async () => {
      const { popup } = await openByKeyboard();
      await userEvent.click(within(popup).getByRole('button', { name: 'Cancel' }));
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    });
  });

  describe('the heading hooks', () => {
    it('are set by the story stylesheet on the sheet popup', async () => {
      render(<HeadingHooks />);
      await screen.findByRole('dialog');
      const css = Array.from(document.querySelectorAll('style'))
        .map((sheet) => sheet.textContent)
        .join('\n');
      for (const hook of [
        '--dialog-heading-size',
        '--dialog-heading-tracking',
        '--dialog-heading-leading',
        '--sheet-handle-width',
        '--sheet-handle-height',
      ]) {
        expect(css).toContain(hook);
      }
    });
  });

  // A focus trap keeps the keyboard in; a screen reader's virtual cursor walks the DOM, not the tab
  // order, so the page behind has to be hidden from it as well, and the popup has to say it is modal.
  describe('the page behind a modal dialog', () => {
    function PageWithDialog({ scoped = false }: { scoped?: boolean }) {
      const [open, setOpen] = useState(false);
      const page = (
        <>
          <main data-testid="page">
            <button type="button" onClick={() => setOpen(true)}>
              Edit
            </button>
          </main>
          <Dialog heading="Edit the potluck" open={open} onOpenChange={setOpen}>
            <p>Body.</p>
          </Dialog>
        </>
      );
      return scoped ? <ThemeScope theme={demoTheme}>{page}</ThemeScope> : page;
    }

    it('marks the popup aria-modal', async () => {
      render(<OpenOnLoad />);
      expect(await screen.findByRole('dialog')).toHaveAttribute('aria-modal', 'true');
    });

    it.each([
      ['portalled to the body', false],
      ['portalled into a ThemeScope', true],
    ])(
      'hides the page from assistive tech while open and gives it back after, %s',
      async (_where, scoped) => {
        render(<PageWithDialog scoped={scoped} />);
        const page = screen.getByTestId('page');
        expect(page.closest('[aria-hidden="true"], [inert]')).toBeNull();
        await userEvent.click(screen.getByRole('button', { name: 'Edit' }));
        const popup = await screen.findByRole('dialog');
        expect(page.closest('[aria-hidden="true"], [inert]')).not.toBeNull();
        expect(popup.closest('[aria-hidden="true"], [inert]')).toBeNull();
        // Only the dialog is left in the accessibility tree.
        expect(screen.queryByRole('button', { name: 'Edit' })).toBeNull();
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
        expect(page.closest('[aria-hidden="true"], [inert]')).toBeNull();
        expect(screen.getByRole('button', { name: 'Edit' })).toHaveFocus();
      },
    );
  });
});
