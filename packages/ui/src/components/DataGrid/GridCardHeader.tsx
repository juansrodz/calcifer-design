import type { RowData } from '@tanstack/react-table';
import type { ElementType, ReactNode } from 'react';
import { RefreshIcon } from '../../icons/RefreshIcon';
import { IconButton } from '../IconButton/IconButton';
import { Toolbar, ToolbarButton } from '../Toolbar/Toolbar';
import styles from './DataGrid.module.css';
import type { DataGridProps } from './types';

export interface GridCardHeaderProps {
  heading: string;
  headingLevel: NonNullable<DataGridProps<RowData>['headingLevel']>;
  /** Names the card and the grid inside it. */
  headingId: string;
  actions?: ReactNode;
  onRefresh?: () => void;
  refreshing: boolean;
  toolbarLabel: string;
  refreshLabel: string;
}

/** The card's heading, with the refresh button and the consumer's actions beside it. */
export function GridCardHeader({
  heading,
  headingLevel,
  headingId,
  actions,
  onRefresh,
  refreshing,
  toolbarLabel,
  refreshLabel,
}: GridCardHeaderProps) {
  const HeadingTag: ElementType = `h${headingLevel}`;
  return (
    <header className={styles.header}>
      <HeadingTag id={headingId} className={styles.heading}>
        {heading}
      </HeadingTag>
      {onRefresh || actions ? (
        <div className={styles.cluster}>
          {onRefresh ? (
            <Toolbar aria-label={toolbarLabel}>
              <ToolbarButton
                loading={refreshing}
                onClick={() => onRefresh()}
                render={
                  <IconButton label={refreshLabel} size="sm">
                    <RefreshIcon />
                  </IconButton>
                }
              />
            </Toolbar>
          ) : null}
          {actions ? <div className={styles.actions}>{actions}</div> : null}
        </div>
      ) : null}
    </header>
  );
}
