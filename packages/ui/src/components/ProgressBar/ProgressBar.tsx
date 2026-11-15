import { Progress as BaseProgress } from '@base-ui/react/progress';
import { useId, type ReactNode } from 'react';
import a11yStyles from '../../styles/a11y.module.css';
import styles from './ProgressBar.module.css';

/** The statuses that carry a spoken word; `active` is the normal case and says nothing. */
type ProgressBarStatusWord = 'finished' | 'error';

/** Every word the bar speaks: the two status words, and the value of a bar with none. */
type ProgressBarWord = ProgressBarStatusWord | 'indeterminate';

const DEFAULT_WORDS: Record<ProgressBarWord, string> = {
  finished: 'Finished',
  error: 'Error',
  indeterminate: 'indeterminate progress',
};

const DEFAULT_MAX = 100;

export interface ProgressBarProps {
  /** The accessible name; visible unless `hideLabel`. */
  label: string;
  /** Keeps the label as the bar's name and takes it off the screen. */
  hideLabel?: boolean;
  /** A line under the track. It is the bar's accessible description. */
  helperText?: ReactNode;
  /**
   * 0 to `max`; anything outside is clamped. `null`, and any value that is not a finite number,
   * is indeterminate: the bar slides and states no value. A `finished` bar ignores it.
   */
  value: number | null;
  /** The value that fills the track. Anything that is not a positive finite number reads as 100. */
  max?: number;
  /**
   * `finished` fills the track and says so, whatever `value` is. `error` keeps the value and draws
   * it in the danger colour. Both are also stated in a visually hidden word, for assistive
   * technology, so pair `error` with `helperText` to give sighted people the reason in words.
   */
  status?: 'active' | 'finished' | 'error';
  size?: 'sm' | 'md';
  /**
   * The visible and the announced value, given the effective value (clamped; `max` for a
   * `finished` bar) and the effective `max`. Defaults to a rounded percentage.
   */
  formatValue?: (value: number, max: number) => string;
  /** Drops the visible value. The announced one stays. */
  hideValue?: boolean;
  /** `selected` fills with the selected colour, the pair an app re-scopes for a chosen thing. */
  tone?: 'accent' | 'selected';
  /**
   * The words the bar speaks, for an app that is not in English: `finished` and `error` follow the
   * label in the bar's name, and `indeterminate` is the announced value of a bar with none (its
   * `aria-valuetext`). Defaults `Finished`, `Error` and `indeterminate progress`; a key left out,
   * or `undefined`, keeps its default.
   */
  statusLabels?: Partial<Record<ProgressBarWord, string>>;
}

function defaultFormatValue(value: number, max: number): string {
  return `${Math.round((100 * value) / max)}%`;
}

/**
 * A labelled linear meter. The bar is a display and nothing here can be focused. The fill and the
 * visible value are for the eye (the value is hidden from assistive technology), and the same
 * number reaches a screen reader as `aria-valuenow` and `aria-valuetext`, so the three always
 * agree: the effective value is computed once, here, and Base UI is handed only that.
 */
export function ProgressBar({
  label,
  hideLabel = false,
  helperText,
  value,
  max = DEFAULT_MAX,
  status = 'active',
  size = 'md',
  formatValue = defaultFormatValue,
  hideValue = false,
  tone = 'accent',
  statusLabels,
}: ProgressBarProps) {
  const helperId = useId();
  const effectiveMax = Number.isFinite(max) && max > 0 ? max : DEFAULT_MAX;
  // `finished` is full whatever it was told: a track, a number and an announcement that disagreed
  // would be worse than ignoring the value. Base UI would write its own inline width on the
  // indicator, so the fill has to be right at its source and no CSS fights it.
  const rawValue = status === 'finished' ? effectiveMax : value;
  const effectiveValue =
    rawValue !== null && Number.isFinite(rawValue)
      ? Math.min(Math.max(rawValue, 0), effectiveMax)
      : null;
  const valueText = effectiveValue === null ? undefined : formatValue(effectiveValue, effectiveMax);
  // Per key, so a caller's `{ error: undefined }` keeps the default word.
  const wordOf = (word: ProgressBarWord) => statusLabels?.[word] ?? DEFAULT_WORDS[word];
  const statusWord = status === 'active' ? undefined : wordOf(status);
  const showValue = valueText !== undefined && !hideValue;
  const hasHelper = helperText !== undefined && helperText !== null && helperText !== false;
  const labelElement = (
    <BaseProgress.Label className={hideLabel ? a11yStyles.visuallyHidden : styles.label}>
      {label}
      {/* The word is part of the bar's name, as `Alert` and `Steps` state a tone: colour is never
          the only signal. The space is real text, since two inline boxes would be read as one
          word. */}
      {statusWord === undefined ? null : (
        <>
          {' '}
          <span className={a11yStyles.visuallyHidden}>{statusWord}</span>
        </>
      )}
    </BaseProgress.Label>
  );
  return (
    <BaseProgress.Root
      className={styles.root}
      data-status={status}
      data-size={size}
      data-tone={tone}
      value={effectiveValue}
      max={effectiveMax}
      // An indeterminate bar has no value to format, so it announces its own word.
      aria-valuetext={valueText ?? wordOf('indeterminate')}
      aria-describedby={hasHelper ? helperId : undefined}
    >
      {/* The row exists only when something in it is drawn. A hidden label is out of flow, so with
          nothing else in the row an empty one would still add the root's `gap` above the track. */}
      {!hideLabel || showValue ? (
        <div className={styles.row}>
          {labelElement}
          {showValue ? (
            <span className={styles.value} aria-hidden="true">
              {valueText}
            </span>
          ) : null}
        </div>
      ) : (
        labelElement
      )}
      <BaseProgress.Track className={styles.track}>
        <BaseProgress.Indicator className={styles.indicator} />
      </BaseProgress.Track>
      {hasHelper ? (
        <div className={styles.helper} id={helperId}>
          {helperText}
        </div>
      ) : null}
    </BaseProgress.Root>
  );
}
