import type { Dialog as BaseDialog } from '@base-ui/react/dialog';
import type { Drawer } from '@base-ui/react/drawer';
import type { ReactNode, Ref } from 'react';
import { CloseIcon } from '../../icons/CloseIcon';
import { IconButton } from '../IconButton/IconButton';
import a11yStyles from '../../styles/a11y.module.css';
import closeCircleStyles from '../../styles/closeCircle.module.css';
import { hasContent } from '../../utils/hasContent';
import styles from './Dialog.module.css';

const headingTags = { 2: 'h2', 3: 'h3', 4: 'h4' } as const;

/** Internal: the popup's handle, header, description, body and footer, shared by both variants. */
interface DialogContentProps {
  /** The parts that name, describe and close the popup, from Base UI's Dialog or its Drawer. */
  parts: {
    Title: typeof BaseDialog.Title | typeof Drawer.Title;
    Description: typeof BaseDialog.Description | typeof Drawer.Description;
    Close: typeof BaseDialog.Close | typeof Drawer.Close;
  };
  showHandle: boolean;
  heading: string;
  headingLevel: 2 | 3 | 4;
  headingHidden: boolean;
  headerStart?: ReactNode;
  headerEnd?: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  closeLabel: string;
  closeVariant: 'ghost' | 'soft';
  closeHidden: boolean;
  closeRef: Ref<HTMLButtonElement>;
  titleId: string;
  bodyRef: (element: HTMLDivElement | null) => void;
  bodyOverflows: boolean;
}

export function DialogContent({
  parts,
  showHandle,
  heading,
  headingLevel,
  headingHidden,
  headerStart,
  headerEnd,
  description,
  children,
  footer,
  closeLabel,
  closeVariant,
  closeHidden,
  closeRef,
  titleId,
  bodyRef,
  bodyOverflows,
}: DialogContentProps) {
  const { Title, Description, Close } = parts;
  // The `?? 'h2'` is for JavaScript callers, who are not held to the `2 | 3 | 4` union: an
  // out-of-range level would otherwise resolve to `undefined` and throw in React as an invalid
  // element type. `@calcifer-design/ui` is consumed from JavaScript apps.
  const Heading = headingTags[headingLevel] ?? 'h2';
  const showEndGroup = hasContent(headerEnd) || !closeHidden;
  return (
    <>
      {showHandle ? <div className={styles.handle} aria-hidden="true" /> : null}
      <div className={styles.header}>
        {headerStart}
        <Title
          id={titleId}
          className={[styles.heading, headingHidden ? a11yStyles.visuallyHidden : undefined]
            .filter(Boolean)
            .join(' ')}
          render={<Heading />}
        >
          {heading}
        </Title>
        {showEndGroup ? (
          <div className={styles.headerEnd}>
            {headerEnd}
            {closeHidden ? null : (
              <Close
                ref={closeRef}
                render={
                  <IconButton
                    label={closeLabel}
                    variant={closeVariant}
                    size="sm"
                    className={[closeCircleStyles.close, styles.closeButton].join(' ')}
                  >
                    <CloseIcon />
                  </IconButton>
                }
              />
            )}
          </div>
        ) : null}
      </div>
      {description === undefined ? null : (
        <Description className={styles.description}>{description}</Description>
      )}
      {children === undefined ? null : (
        <div
          ref={bodyRef}
          className={styles.body}
          {...(bodyOverflows
            ? { tabIndex: 0, role: 'region', 'aria-labelledby': titleId }
            : undefined)}
        >
          {children}
        </div>
      )}
      {footer === undefined ? null : <div className={styles.footer}>{footer}</div>}
    </>
  );
}
