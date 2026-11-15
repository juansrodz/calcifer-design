import { composeStories } from '@storybook/react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axeDocument } from '../../../test/axe';
import { ProgressBar } from './ProgressBar';
import * as stories from './ProgressBar.stories';

const { Default, Indeterminate, Finished, Error, Small, HiddenLabel, Selected, Dark } =
  composeStories(stories);

// Base UI writes the fill's width inline on the indicator, in per cent of `max`.
function fillWidth(bar: HTMLElement): string | undefined {
  return bar.querySelector<HTMLElement>('.indicator')?.style.width;
}

describe('ProgressBar', () => {
  it.each([
    ['Default', Default],
    ['Indeterminate', Indeterminate],
    ['Finished', Finished],
    ['Error', Error],
    ['Small', Small],
    ['HiddenLabel', HiddenLabel],
    ['Selected', Selected],
    ['Dark', Dark],
  ])('%s has no axe violations', async (_name, Story) => {
    render(<Story />);
    expect(await axeDocument()).toHaveNoViolations();
  });

  it('is a progressbar named by its label, with the value in the formatter’s words', () => {
    render(<Default />);
    const bar = screen.getByRole('progressbar', { name: 'Items packed' });
    expect(bar).toHaveAttribute('aria-valuenow', '5');
    expect(bar).toHaveAttribute('aria-valuemin', '0');
    expect(bar).toHaveAttribute('aria-valuemax', '8');
    expect(bar).toHaveAttribute('aria-valuetext', '5/8');
    // The visible value is the same text, hidden from assistive technology: `aria-valuetext`
    // already says it, so a second reading would be noise.
    const visible = screen.getByText('5/8');
    expect(visible).toHaveAttribute('aria-hidden', 'true');
    expect(bar).toHaveAttribute('data-status', 'active');
    expect(bar).toHaveAttribute('data-size', 'md');
    expect(bar).toHaveAttribute('data-tone', 'accent');
  });

  it('formats a fraction of a hundred as a rounded percentage by default', () => {
    render(<ProgressBar label="Upload" value={62.5} />);
    const bar = screen.getByRole('progressbar', { name: 'Upload' });
    expect(bar).toHaveAttribute('aria-valuetext', '63%');
    expect(screen.getByText('63%')).toBeInTheDocument();
  });

  it('sets the fill to the share of the track the value covers', () => {
    render(<ProgressBar label="Upload" value={5} max={8} />);
    expect(fillWidth(screen.getByRole('progressbar'))).toBe('62.5%');
  });

  it('is indeterminate with a null value: no number, no visible value', () => {
    const { container } = render(<Indeterminate />);
    const bar = screen.getByRole('progressbar', { name: 'Loading events' });
    expect(bar).not.toHaveAttribute('aria-valuenow');
    expect(bar).toHaveAttribute('data-indeterminate');
    expect(container.querySelector('[aria-hidden="true"]')).toBeNull();
    expect(screen.queryByText(/%/)).toBeNull();
  });

  describe('the effective value (L2-7)', () => {
    it('clamps a value above `max` to `max`', () => {
      render(<ProgressBar label="Over" value={9} max={8} />);
      const bar = screen.getByRole('progressbar', { name: 'Over' });
      expect(bar).toHaveAttribute('aria-valuenow', '8');
      expect(bar).toHaveAttribute('aria-valuetext', '100%');
      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('clamps a negative value to zero', () => {
      render(<ProgressBar label="Under" value={-3} />);
      const bar = screen.getByRole('progressbar', { name: 'Under' });
      expect(bar).toHaveAttribute('aria-valuenow', '0');
      expect(bar).toHaveAttribute('aria-valuetext', '0%');
      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('hands the formatter the clamped value and the effective `max`', () => {
      render(
        <ProgressBar
          label="Packed"
          value={9}
          max={8}
          formatValue={(value, max) => `${value} of ${max}`}
        />,
      );
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuetext', '8 of 8');
    });

    it.each([
      ['NaN', Number.NaN],
      ['Infinity', Number.POSITIVE_INFINITY],
      ['-Infinity', Number.NEGATIVE_INFINITY],
    ])('reads a %s value as indeterminate', (_name, value) => {
      render(<ProgressBar label="Odd" value={value} />);
      const bar = screen.getByRole('progressbar', { name: 'Odd' });
      expect(bar).not.toHaveAttribute('aria-valuenow');
      expect(screen.queryByText(/%/)).toBeNull();
    });

    it('reads a missing value, which a JavaScript caller can leave out, as indeterminate', () => {
      // @ts-expect-error `value` is required in the type; a JavaScript caller can still omit it.
      render(<ProgressBar label="Odd" />);
      const bar = screen.getByRole('progressbar', { name: 'Odd' });
      expect(bar).not.toHaveAttribute('aria-valuenow');
      expect(bar).toHaveAttribute('aria-valuetext', 'indeterminate progress');
      expect(screen.queryByText(/%/)).toBeNull();
    });

    it.each([
      ['0', 0],
      ['a negative number', -5],
      ['NaN', Number.NaN],
      ['Infinity', Number.POSITIVE_INFINITY],
    ])('reads a `max` of %s as 100', (_name, max) => {
      render(<ProgressBar label="Odd" value={50} max={max} />);
      const bar = screen.getByRole('progressbar', { name: 'Odd' });
      expect(bar).toHaveAttribute('aria-valuemax', '100');
      expect(bar).toHaveAttribute('aria-valuenow', '50');
      expect(bar).toHaveAttribute('aria-valuetext', '50%');
    });
  });

  describe('status', () => {
    it('finished fills the track whatever the value is, and the three readings agree', () => {
      render(<Finished />);
      const bar = screen.getByRole('progressbar', { name: /Finished/ });
      expect(bar).toHaveAttribute('data-status', 'finished');
      expect(bar).toHaveAttribute('aria-valuenow', '100');
      expect(bar).toHaveAttribute('aria-valuetext', '100%');
      expect(screen.getByText('100%')).toBeInTheDocument();
      expect(fillWidth(bar)).toBe('100%');
    });

    it('finished is full even with an indeterminate value', () => {
      render(<ProgressBar label="Sync" value={null} status="finished" />);
      const bar = screen.getByRole('progressbar', { name: /Finished/ });
      expect(bar).toHaveAttribute('aria-valuenow', '100');
      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('finished passes `max` through the formatter', () => {
      render(
        <ProgressBar
          label="Packed"
          value={2}
          max={8}
          status="finished"
          formatValue={(value, max) => `${value}/${max}`}
        />,
      );
      const bar = screen.getByRole('progressbar');
      expect(bar).toHaveAttribute('aria-valuenow', '8');
      expect(bar).toHaveAttribute('aria-valuetext', '8/8');
    });

    it('states the status in the name, not only in colour', () => {
      render(<Finished />);
      expect(screen.getByRole('progressbar')).toHaveAccessibleName('Uploading photos Finished');
    });

    it('error names itself and is described by the helper text', () => {
      render(<Error />);
      const bar = screen.getByRole('progressbar', { name: /Error/ });
      expect(bar).toHaveAttribute('data-status', 'error');
      expect(bar).toHaveAccessibleDescription('Upload failed. Check your connection and retry.');
      // An error keeps its own value: it is not full.
      expect(bar).toHaveAttribute('aria-valuenow', '30');
    });

    it('active adds nothing to the name', () => {
      render(<Default />);
      expect(screen.getByRole('progressbar')).toHaveAccessibleName('Items packed');
    });

    it('takes its status words from the caller', () => {
      render(
        <ProgressBar label="Upload" value={30} status="error" statusLabels={{ error: 'Failed' }} />,
      );
      expect(screen.getByRole('progressbar')).toHaveAccessibleName('Upload Failed');
      render(
        <ProgressBar
          label="Envoi"
          value={30}
          status="finished"
          statusLabels={{ finished: 'Terminé' }}
        />,
      );
      expect(screen.getByRole('progressbar', { name: 'Envoi Terminé' })).toBeInTheDocument();
    });

    it('draws the status word visually hidden, for assistive technology only', () => {
      render(<Error />);
      const word = screen.getByText('Error');
      expect(word.className).toContain('visuallyHidden');
      expect(word.closest('[role="progressbar"]')).not.toBeNull();
    });

    it('keeps the default word for a key the caller left undefined', () => {
      render(
        <ProgressBar
          label="Upload"
          value={30}
          status="error"
          statusLabels={{ error: undefined }}
        />,
      );
      expect(screen.getByRole('progressbar')).toHaveAccessibleName('Upload Error');
    });

    it('keeps the default word for a status the caller did not translate', () => {
      render(
        <ProgressBar
          label="Upload"
          value={30}
          status="finished"
          statusLabels={{ error: 'Failed' }}
        />,
      );
      expect(screen.getByRole('progressbar')).toHaveAccessibleName('Upload Finished');
    });
  });

  describe('an indeterminate bar’s announcement', () => {
    it('is Base UI’s wording by default, unchanged', () => {
      render(<Indeterminate />);
      expect(screen.getByRole('progressbar')).toHaveAttribute(
        'aria-valuetext',
        'indeterminate progress',
      );
    });

    it('takes its words from the caller', () => {
      render(
        <ProgressBar
          label="Événements"
          value={null}
          statusLabels={{ indeterminate: 'Chargement' }}
        />,
      );
      expect(screen.getByRole('progressbar', { name: 'Événements' })).toHaveAttribute(
        'aria-valuetext',
        'Chargement',
      );
    });

    it('is not used by a bar that has a value', () => {
      render(
        <ProgressBar label="Upload" value={40} statusLabels={{ indeterminate: 'Chargement' }} />,
      );
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuetext', '40%');
    });
  });

  describe('the row', () => {
    // The label's parent is the row when there is one and the bar itself when there is not, which
    // is the structure itself and needs no class name.
    function rowOf(label: string): HTMLElement | null {
      const parent = screen.getByText(label).parentElement;
      return parent === screen.getByRole('progressbar') ? null : parent;
    }

    it('holds the label and the value', () => {
      render(<Default />);
      const row = rowOf('Items packed');
      expect(row).not.toBeNull();
      expect(row).toContainElement(screen.getByText('5/8'));
    });

    it('holds a visible label alone when there is no value to show', () => {
      render(<Indeterminate />);
      expect(rowOf('Loading events')).not.toBeNull();
    });

    it('holds a hidden label with the value that is drawn beside it', () => {
      render(<HiddenLabel />);
      expect(rowOf('Upload progress')).toContainElement(screen.getByText('45%'));
    });

    it.each([
      ['`hideValue`', { value: 40, hideValue: true }],
      ['an indeterminate value', { value: null }],
    ])(
      'is not rendered for a hidden label and %s, so the label sits in the bar',
      (_name, props) => {
        render(<ProgressBar label="Upload" hideLabel {...props} />);
        // Nothing drawn is left in it, and an empty row would still add the bar's gap above the track.
        expect(rowOf('Upload')).toBeNull();
        expect(screen.getByRole('progressbar', { name: 'Upload' })).toBeInTheDocument();
      },
    );
  });

  it('keeps the name when the label is hidden, and shows the value', () => {
    render(<HiddenLabel />);
    const bar = screen.getByRole('progressbar', { name: 'Upload progress' });
    expect(bar).toHaveAttribute('aria-valuenow', '45');
    expect(screen.getByText('45%')).toBeVisible();
    const label = screen.getByText('Upload progress');
    expect(label.className).toContain('visuallyHidden');
  });

  it('draws a visible label by default', () => {
    render(<Default />);
    expect(screen.getByText('Items packed').className).not.toContain('visuallyHidden');
  });

  it('drops the visible value under `hideValue` and keeps the announced one', () => {
    render(<ProgressBar label="Upload" value={40} hideValue />);
    expect(screen.queryByText('40%')).toBeNull();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuetext', '40%');
  });

  it('carries the size and the tone as data attributes', () => {
    const { unmount } = render(<Small />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('data-size', 'sm');
    unmount();
    render(<Selected />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('data-tone', 'selected');
  });

  it('describes the bar by the helper text only when there is one', () => {
    const { unmount } = render(<Default />);
    expect(screen.getByRole('progressbar')).not.toHaveAttribute('aria-describedby');
    unmount();
    render(<ProgressBar label="Upload" value={30} helperText="Two files left." />);
    expect(screen.getByRole('progressbar')).toHaveAccessibleDescription('Two files left.');
  });

  it('has nothing to focus: it is a display, not a control', () => {
    const { container } = render(<Default />);
    expect(container.querySelector('a, button, input, [tabindex]')).toBeNull();
  });
});
