import { composeStories } from '@storybook/react';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axeDocument } from '../../../test/axe';
import { Timeline, type TimelineItem, type TimelineProps } from './Timeline';
import * as stories from './Timeline.stories';

const allStories = composeStories(stories);

function renderTimeline(items: TimelineItem[], props: Partial<TimelineProps> = {}) {
  return render(<Timeline items={items} aria-label="History" locale="en-US" {...props} />);
}

function renderStamp(timestamp: string, props: Partial<TimelineProps> = {}) {
  return renderTimeline([{ id: 'one', title: 'Event', timestamp }], props);
}

describe('Timeline', () => {
  it.each(Object.entries(allStories))('%s has no axe violations', async (_name, Story) => {
    render(<Story />);
    expect(await axeDocument()).toHaveNoViolations();
  });

  it('is a named ordered list, in the order given', () => {
    renderTimeline([
      { id: 'late', title: 'Later', timestamp: '2026-03-09' },
      { id: 'early', title: 'Earlier', timestamp: '2026-03-08' },
    ]);
    const list = screen.getByRole('list', { name: 'History' });
    expect(list.tagName).toBe('OL');
    expect(list).toHaveAttribute('role', 'list');
    const rows = within(list).getAllByRole('listitem');
    expect(rows[0]).toHaveTextContent('Later');
    expect(rows[1]).toHaveTextContent('Earlier');
  });

  it('shows a title and a description', () => {
    renderTimeline([{ id: 'one', title: 'Event', description: 'What happened.' }]);
    expect(screen.getByText('Event')).toBeVisible();
    expect(screen.getByText('What happened.')).toBeVisible();
  });

  it('shows a description of 0, as a value and not as nothing', () => {
    const { container } = renderTimeline([{ id: 'one', title: 'Event', description: 0 }]);
    expect(container.querySelector('.description')).toHaveTextContent(/^0$/);
  });

  it.each([undefined, null])('draws no description for %s', (description) => {
    const { container } = renderTimeline([{ id: 'one', title: 'Event', description }]);
    expect(container.querySelector('.description')).toBeNull();
  });

  it.each([false, ''])(
    'draws no empty description for %j, as `condition && text` gives',
    (description) => {
      const { container } = renderTimeline([{ id: 'one', title: 'Event', description }]);
      expect(container.querySelector('.description')).toBeNull();
    },
  );

  it('draws no empty list with no items', () => {
    const { container } = renderTimeline([]);
    expect(container).toBeEmptyDOMElement();
  });

  describe('timestamp', () => {
    it('renders a date in <time>, keeping the source value', () => {
      const { container } = renderStamp('2026-03-08');
      const time = container.querySelector('time');
      expect(time).toHaveAttribute('datetime', '2026-03-08');
      expect(time).toHaveTextContent('Mar 8, 2026');
    });

    it('does not shift a date-only value across time zones', () => {
      // A `new Date('2026-03-08')` is midnight UTC: the seventh, anywhere west of Greenwich.
      const { container } = renderStamp('2026-01-01');
      expect(container.querySelector('time')).toHaveTextContent('Jan 1, 2026');
    });

    it('keeps the source value on a date and time, and shows the time', () => {
      const source = '2026-03-08T09:30:00+01:00';
      const { container } = renderStamp(source);
      const time = container.querySelector('time');
      expect(time).toHaveAttribute('datetime', source);
      expect(time?.textContent).toBe(
        new Intl.DateTimeFormat('en-US', {
          dateStyle: 'medium',
          timeStyle: 'short',
          calendar: 'gregory',
        }).format(new Date(source)),
      );
    });

    it.each(['2026-03-08T09:30', '2026-03-08T09:30:15', '2026-03-08T09:30:15.250Z'])(
      'reads %s as a time',
      (source) => {
        const { container } = renderStamp(source);
        expect(container.querySelector('time')).toHaveAttribute('datetime', source);
        expect(container.querySelector('time')?.textContent).toMatch(/\d{1,2}:\d{2}/);
      },
    );

    describe('with an offset written short', () => {
      it.each([
        ['2026-03-08T09:30:00+05', '2026-03-08T09:30:00+05:00'],
        ['2026-03-08T09:30-08', '2026-03-08T09:30-08:00'],
        ['2026-03-08T09:30:00+0530', '2026-03-08T09:30:00+05:30'],
      ])('reads %s as a time, with the offset in full', (source, written) => {
        const { container } = renderStamp(source);
        const time = container.querySelector('time');
        // HTML has no `+05` of its own, and JavaScript's `Date` is only sure of `+05:00`.
        expect(time).toHaveAttribute('datetime', written);
        expect(time?.textContent).toBe(
          new Intl.DateTimeFormat('en-US', {
            dateStyle: 'medium',
            timeStyle: 'short',
            calendar: 'gregory',
          }).format(new Date(written)),
        );
      });
    });

    describe('with only a year or a month', () => {
      it('renders a year in <time>', () => {
        const { container } = renderStamp('2026');
        const time = container.querySelector('time');
        expect(time).toHaveAttribute('datetime', '2026');
        expect(time).toHaveTextContent(/^2026$/);
      });

      it('renders a year and month in <time>', () => {
        const { container } = renderStamp('2026-03');
        const time = container.querySelector('time');
        expect(time).toHaveAttribute('datetime', '2026-03');
        expect(time).toHaveTextContent(/^Mar 2026$/);
      });

      it('does not shift across time zones, at the very start of a year or month', () => {
        const { container, rerender } = renderStamp('2026-01');
        expect(container.querySelector('time')).toHaveTextContent(/^Jan 2026$/);
        rerender(
          <Timeline
            aria-label="History"
            locale="en-US"
            items={[{ id: 'one', title: 'Event', timestamp: '2026' }]}
          />,
        );
        expect(container.querySelector('time')).toHaveTextContent(/^2026$/);
      });

      it('follows locale, on the Gregorian calendar', () => {
        const { container, rerender } = renderStamp('2026-03', { locale: 'es-ES' });
        expect(container.querySelector('time')).toHaveTextContent(/^mar 2026$/);
        rerender(
          <Timeline
            aria-label="History"
            locale="fa-IR"
            items={[{ id: 'one', title: 'Event', timestamp: '2026' }]}
          />,
        );
        expect(container.querySelector('time')?.textContent).toMatch(/۲۰۲۶/);
      });
    });

    it('follows locale', () => {
      const { container } = renderStamp('2026-03-08', { locale: 'es-ES' });
      expect(container.querySelector('time')).toHaveTextContent('8 mar 2026');
    });

    it('draws the Gregorian calendar whatever the locale prefers, in its digits', () => {
      const { container, rerender } = renderStamp('2026-03-08', { locale: 'fa-IR' });
      expect(container.querySelector('time')?.textContent).toMatch(/۲۰۲۶/);
      rerender(
        <Timeline
          aria-label="History"
          locale="en-US-u-ca-hebrew"
          items={[{ id: 'one', title: 'Event', timestamp: '2026-03-08T09:30:00' }]}
        />,
      );
      expect(container.querySelector('time')?.textContent).toMatch(/2026/);
    });

    it('takes a locale it cannot read as none, rather than throwing', () => {
      const { container } = renderStamp('2026-03-08', { locale: 'en_US' });
      expect(container.querySelector('time')?.textContent).toMatch(/2026/);
    });

    it('draws no time when there is none', () => {
      const { container } = renderTimeline([{ id: 'one', title: 'Event' }]);
      expect(container.querySelector('time')).toBeNull();
    });

    describe('that is not one', () => {
      it.each([
        'last spring',
        'not-a-date',
        '2026-02-30',
        '2026-13-01',
        '2026-02-30T10:00:00Z',
        '2026-03-08T25:00:00Z',
        '2026-03-08T09:30:00+99',
        '2026-13',
        '2026-00',
        '0000',
        '0000-01',
        '202',
        '20260',
        'March 8',
        '12',
      ])('shows %s as written, with no <time> and no "Invalid Date"', (source) => {
        const { container } = renderStamp(source);
        expect(container.querySelector('time')).toBeNull();
        expect(screen.getByText(source)).toBeVisible();
        expect(container).not.toHaveTextContent('Invalid Date');
      });

      it('draws nothing for an empty string', () => {
        const { container } = renderStamp('');
        expect(container.querySelector('time')).toBeNull();
        expect(screen.getByRole('listitem')).toHaveTextContent(/^Event$/);
      });
    });
  });

  describe('tone', () => {
    it.each([
      ['neutral', 'Note'],
      ['accent', 'Highlight'],
      ['success', 'Success'],
      ['danger', 'Problem'],
    ] as const)('states %s in text, and in the row', (tone, words) => {
      renderTimeline([{ id: 'one', title: 'Event', tone }]);
      const row = screen.getByRole('listitem');
      expect(row).toHaveAttribute('data-tone', tone);
      expect(within(row).getByText(words)).toBeVisible();
    });

    it('states nothing when no tone is given', () => {
      renderTimeline([{ id: 'one', title: 'Event' }]);
      const row = screen.getByRole('listitem');
      expect(row).toHaveAttribute('data-tone', 'neutral');
      expect(row).toHaveTextContent(/^Event$/);
    });

    it('takes the words from toneLabels, each on its own', () => {
      renderTimeline(
        [
          { id: 'one', title: 'One', tone: 'danger' },
          { id: 'two', title: 'Two', tone: 'success' },
        ],
        { toneLabels: { danger: 'Problema' } },
      );
      expect(screen.getByText('Problema')).toBeVisible();
      expect(screen.getByText('Success')).toBeVisible();
    });

    it('hides the marker from assistive technology', () => {
      const { container } = renderTimeline([{ id: 'one', title: 'Event', tone: 'danger' }]);
      expect(container.querySelector('[data-marker]')).toHaveAttribute('aria-hidden', 'true');
    });
  });
});
