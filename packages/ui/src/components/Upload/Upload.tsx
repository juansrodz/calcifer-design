import { Field as BaseField } from '@base-ui/react/field';
import { useLayoutEffect, useRef, useState, type DragEvent, type ReactNode } from 'react';
import { useFormReset } from '../../hooks/useFormReset';
import { CloseIcon } from '../../icons/CloseIcon';
import fieldStyles from '../../styles/field.module.css';
import { Button } from '../Button/Button';
import { FieldMessages, RequiredMark, type FieldFrameProps } from '../Field/Field';
import { useFormValue } from '../Form/FormContext';
import { IconButton } from '../IconButton/IconButton';
import { LiveRegion } from '../LiveRegion/LiveRegion';
import styles from './Upload.module.css';

export type UploadRejectionReason = 'type' | 'size' | 'count' | 'duplicate';

export interface UploadRejection {
  file: File;
  /**
   * `type`: not covered by `accept`. `size`: over `maxSizeBytes`. `count`: a second file when
   * `multiple` is off. `duplicate`: with `multiple`, a file the list already holds. Checked in
   * that order, and a file gets the first reason that applies.
   */
  reason: UploadRejectionReason;
}

export interface UploadLabels {
  /** The words on the button. */
  choose: string;
  /** Beside the button. */
  dropHint: string;
  /** The name of one file's remove button. */
  remove: (fileName: string) => string;
  /** Announced when files join the list. */
  added: (fileNames: string) => string;
  /** Announced when a file leaves the list. */
  removed: (fileName: string) => string;
  /** Shown and announced for a file turned away. */
  rejected: (fileName: string, reason: UploadRejectionReason) => string;
}

const REJECTION_REASONS: Record<UploadRejectionReason, string> = {
  type: 'that type of file is not allowed',
  size: 'it is too large',
  count: 'only one file can be chosen',
  duplicate: 'it is already in the list',
};

const DEFAULT_LABELS: Omit<UploadLabels, 'choose' | 'dropHint'> = {
  remove: (fileName) => `Remove ${fileName}`,
  added: (fileNames) => `Added ${fileNames}.`,
  removed: (fileName) => `Removed ${fileName}.`,
  rejected: (fileName, reason) => `${fileName} was not added: ${REJECTION_REASONS[reason]}.`,
};

export interface UploadProps extends FieldFrameProps {
  /** The visible label, and the file input's accessible name. */
  label: string;
  /** Sits under the drop zone and joins the input's `aria-describedby`. */
  description?: ReactNode;
  /** Controlled. Pair it with `onFilesChange`; use `defaultFiles` for an uncontrolled one. */
  files?: File[];
  /**
   * Uncontrolled: the first list, and the one a native reset of the surrounding form goes back to,
   * with `onFilesChange` told. A controlled `files` stays through a reset, and goes back in the
   * input the browser just emptied.
   */
  defaultFiles?: File[];
  /**
   * The whole new list. With `multiple` a choice adds to the list, and the same file again goes to
   * `onReject` as a `duplicate`. Without it a choice replaces the file there was, and choosing that
   * same file again is no change: this is not called and nothing is announced.
   */
  onFilesChange?: (files: File[]) => void;
  /**
   * The native `accept` syntax: `.pdf`, `image/*`, `application/pdf`. It is checked here as well,
   * for every file, because a browser only filters its picker: a drop would get anything through.
   */
  accept?: string;
  multiple?: boolean;
  /** The largest file allowed. A file of exactly this size is allowed. */
  maxSizeBytes?: number;
  /** The files turned away from one choice or drop, each with its reason. */
  onReject?: (rejections: UploadRejection[]) => void;
  /** Called when focus leaves the file input, for a form library's "touched". */
  onBlur?: () => void;
  /** The words the control says itself, for an app that is not in English. */
  labels?: Partial<UploadLabels>;
}

function acceptsFile(file: File, accept: string | undefined): boolean {
  const tokens = (accept ?? '')
    .split(',')
    .map((token) => token.trim().toLowerCase())
    .filter(Boolean);
  if (tokens.length === 0) {
    return true;
  }
  const fileName = file.name.toLowerCase();
  const fileType = file.type.toLowerCase();
  return tokens.some((token) => {
    if (token.startsWith('.')) {
      return fileName.endsWith(token);
    }
    if (token === '*/*') {
      return true;
    }
    if (token.endsWith('/*')) {
      return fileType.startsWith(token.slice(0, -1));
    }
    return fileType === token;
  });
}

/** Identifies a file as far as a browser allows, which is what makes "the same file" decidable. */
function signatureOf(file: File): string {
  return [file.name, file.size, file.lastModified].join(':');
}

function signaturesOf(files: File[]): string {
  return files.map(signatureOf).join('|');
}

/** The files of `list` with no partner in `other`, where each file partners only one. */
function withoutPartners(list: File[], other: File[]): File[] {
  const unmatched = other.map(signatureOf);
  return list.filter((file) => {
    const partner = unmatched.indexOf(signatureOf(file));
    if (partner === -1) {
      return true;
    }
    unmatched.splice(partner, 1);
    return false;
  });
}

/**
 * Selects files; it does not transfer them. The real file input lies over the whole zone, so the
 * keyboard, a screen reader and a pointer all use it, and what looks like a button is a picture of
 * one. Dropping is an enhancement over that, and goes through the same checks.
 */
export function Upload({
  label,
  name,
  description,
  error,
  required = false,
  disabled = false,
  files,
  defaultFiles,
  onFilesChange,
  accept,
  multiple = false,
  maxSizeBytes,
  onReject,
  onBlur,
  labels,
}: UploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const focusAfterRemoval = useRef<number | null>(null);
  const announcedFiles = useRef<File[]>(files ?? defaultFiles ?? []);
  const turnedAwayThisCommit = useRef('');
  const [heldFiles, setHeldFiles] = useState<File[]>(defaultFiles ?? []);
  const [isDragging, setIsDragging] = useState(false);
  const [rejectionMessages, setRejectionMessages] = useState<string[]>([]);
  const [announcement, setAnnouncement] = useState({ message: '', count: 0 });
  const currentFiles = files ?? heldFiles;
  const words = {
    ...DEFAULT_LABELS,
    choose: multiple ? 'Choose files' : 'Choose a file',
    dropHint: multiple ? 'or drop them here' : 'or drop it here',
    ...labels,
  };

  useFormValue(disabled ? undefined : name, currentFiles);

  const announce = (message: string) =>
    setAnnouncement((previous) => ({ message, count: previous.count + 1 }));

  /** Keeps a native form submit truthful, where the browser can build a `FileList` at all. */
  const showInInput = (list: File[]) => {
    if (inputRef.current === null || typeof DataTransfer === 'undefined') {
      return;
    }
    const transfer = new DataTransfer();
    list.forEach((file) => transfer.items.add(file));
    inputRef.current.files = transfer.files;
  };

  useLayoutEffect(() => {
    showInInput(currentFiles);
    // Only the list decides what the input holds; `showInInput` reads nothing else.
  }, [currentFiles]);

  // No dependency list, because a parent can refuse a removal and leave `currentFiles` as it was.
  useLayoutEffect(() => {
    if (focusAfterRemoval.current === null) {
      return;
    }
    const buttons = listRef.current?.querySelectorAll('button') ?? [];
    const target = buttons[Math.min(focusAfterRemoval.current, buttons.length - 1)];
    (target ?? inputRef.current)?.focus();
    focusAfterRemoval.current = null;
  });

  // What joined or left is read off the list itself, since a parent can refuse a change or make one
  // of its own. A layout effect, so that a file turned away by the same choice is said in the same
  // breath: it was announced at once, and this replaces that text before anything can read it.
  useLayoutEffect(() => {
    const addedNames = withoutPartners(currentFiles, announcedFiles.current)
      .map((file) => file.name)
      .join(', ');
    const changes = [
      addedNames === '' ? null : words.added(addedNames),
      ...withoutPartners(announcedFiles.current, currentFiles).map((file) =>
        words.removed(file.name),
      ),
    ].filter(Boolean);
    announcedFiles.current = currentFiles;
    if (changes.length > 0) {
      announce([...changes, turnedAwayThisCommit.current].filter(Boolean).join(' '));
    }
    turnedAwayThisCommit.current = '';
  });

  const commit = (nextFiles: File[]) => {
    setHeldFiles(nextFiles);
    onFilesChange?.(nextFiles);
  };

  const receive = (incoming: File[]) => {
    if (incoming.length === 0) {
      return;
    }
    const rejections: UploadRejection[] = [];
    const accepted: File[] = [];
    const known = new Set(multiple ? currentFiles.map(signatureOf) : []);
    for (const file of incoming) {
      if (!acceptsFile(file, accept)) {
        rejections.push({ file, reason: 'type' });
      } else if (maxSizeBytes !== undefined && file.size > maxSizeBytes) {
        rejections.push({ file, reason: 'size' });
      } else if (!multiple && accepted.length > 0) {
        rejections.push({ file, reason: 'count' });
      } else if (known.has(signatureOf(file))) {
        rejections.push({ file, reason: 'duplicate' });
      } else {
        known.add(signatureOf(file));
        accepted.push(file);
      }
    }
    const nextFiles = multiple ? [...currentFiles, ...accepted] : accepted;
    if (accepted.length > 0 && signaturesOf(nextFiles) !== signaturesOf(currentFiles)) {
      commit(nextFiles);
    }
    const messages = rejections.map(({ file, reason }) => words.rejected(file.name, reason));
    setRejectionMessages(messages);
    if (rejections.length > 0) {
      onReject?.(rejections);
    }
    if (rejections.length > 0) {
      turnedAwayThisCommit.current = messages.join(' ');
      announce(turnedAwayThisCommit.current);
    }
  };

  useFormReset(inputRef, () => {
    const restored = files ?? defaultFiles ?? [];
    setRejectionMessages([]);
    if (signaturesOf(restored) !== signaturesOf(currentFiles)) {
      commit(restored);
    }
    // Always, because the browser has emptied the input whether or not the list changed.
    showInInput(restored);
  });

  const remove = (index: number) => {
    focusAfterRemoval.current = index;
    setRejectionMessages([]);
    commit(currentFiles.filter((_file, fileIndex) => fileIndex !== index));
  };

  const carriesFiles = (event: DragEvent) =>
    Array.from(event.dataTransfer.types ?? []).includes('Files');

  return (
    <BaseField.Root
      className={fieldStyles.frame}
      name={name}
      disabled={disabled}
      invalid={error !== undefined}
    >
      <BaseField.Label className={fieldStyles.label}>
        {label}
        <RequiredMark when={required} />
      </BaseField.Label>
      {/* Drop handlers on a plain element are the enhancement; the input inside is the control. */}
      <div
        className={styles.zone}
        data-dragging={isDragging ? '' : undefined}
        data-disabled={disabled ? '' : undefined}
        onDragOver={(event) => {
          if (!carriesFiles(event)) {
            return;
          }
          // Prevented even while disabled, or the browser would navigate to the dropped file.
          event.preventDefault();
          event.dataTransfer.dropEffect = disabled ? 'none' : 'copy';
          setIsDragging(!disabled);
        }}
        onDragLeave={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
            setIsDragging(false);
          }
        }}
        onDrop={(event) => {
          if (!carriesFiles(event)) {
            return;
          }
          event.preventDefault();
          setIsDragging(false);
          if (!disabled) {
            receive(Array.from(event.dataTransfer.files));
          }
        }}
      >
        <BaseField.Control
          ref={inputRef}
          className={styles.input}
          // Base UI compares this to clear a `Form` entry; the file input itself cannot hold it.
          value={signaturesOf(currentFiles)}
          onBlur={onBlur}
          // A chosen list satisfies `required` even where `showInInput` cannot fill the input.
          required={required && currentFiles.length === 0}
          onChange={(event) => {
            const picked = Array.from(event.currentTarget.files ?? []);
            // Emptied so that choosing the same file again is a change the browser reports,
            // which matters most for the file just turned away. Then the list goes back in.
            event.currentTarget.value = '';
            showInInput(currentFiles);
            receive(picked);
          }}
          render={(controlProps) => {
            const { value: _signature, ...inputProps } = controlProps as typeof controlProps & {
              value: string;
            };
            // `title` stops the browser's "No file chosen" tooltip contradicting the list below.
            return (
              <input {...inputProps} type="file" accept={accept} multiple={multiple} title="" />
            );
          }}
        />
        <div className={[fieldStyles.control, styles.face].join(' ')} aria-hidden="true">
          <Button variant="secondary" size="sm" tabIndex={-1} disabled={disabled}>
            {words.choose}
          </Button>
          <span className={styles.hint}>{words.dropHint}</span>
        </div>
      </div>
      {currentFiles.length === 0 ? null : (
        // `role="list"` because WebKit drops list semantics under `list-style: none`.
        <ul ref={listRef} className={styles.list} role="list">
          {currentFiles.map((file, index) => (
            <li key={`${signatureOf(file)}-${index}`} className={styles.file}>
              <span className={styles.fileName}>{file.name}</span>
              <IconButton
                size="sm"
                label={words.remove(file.name)}
                disabled={disabled}
                onClick={() => remove(index)}
              >
                <CloseIcon />
              </IconButton>
            </li>
          ))}
        </ul>
      )}
      {rejectionMessages.map((message, index) => (
        <p key={index} className={styles.rejection}>
          {message}
        </p>
      ))}
      <FieldMessages description={description} error={error} />
      {/* A no-break space on every other announcement, because a live region says nothing when
          its text does not change, and the same file can be turned away twice running. */}
      <LiveRegion message={`${announcement.message}${announcement.count % 2 ? ' ' : ''}`} />
    </BaseField.Root>
  );
}
