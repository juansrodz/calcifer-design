import type { RowData } from '@tanstack/react-table';
import type { ElementType, ReactNode } from 'react';
import { FilterIcon } from '../../icons/FilterIcon';
import { RefreshIcon } from '../../icons/RefreshIcon';
import { IconButton } from '../IconButton/IconButton';
import { Segmented } from '../Segmented/Segmented';
import { Toolbar, ToolbarButton } from '../Toolbar/Toolbar';
import styles from './DataGrid.module.css';
import type { DataGridProps, DataGridQuery } from './types';

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
  /** Gives the toolbar its filters button, which calls this. Left out, the button is not drawn. */
  onToggleFilters?: () => void;
  /** Whether the filters are showing: the button is pressed while they are. */
  filtersOpen: boolean;
  filtersLabel: string;
  /** Active filters plus a search: the button's badge. */
  filterCount: number;
  /** Whether the All / Any switch shows, before the filters button. */
  showMatchMode: boolean;
  matchMode: DataGridQuery['matchMode'];
  onMatchModeChange: (matchMode: DataGridQuery['matchMode']) => void;
  matchModeLabel: string;
  matchAllLabel: string;
  matchAnyLabel: string;
}

/**
 * The card's heading, with its toolbar (match mode, the filters button, refresh) and the
 * consumer's actions beside it.
 */
export function GridCardHeader({
  heading,
  headingLevel,
  headingId,
  actions,
  onRefresh,
  refreshing,
  toolbarLabel,
  refreshLabel,
  onToggleFilters,
  filtersOpen,
  filtersLabel,
  filterCount,
  showMatchMode,
  matchMode,
  onMatchModeChange,
  matchModeLabel,
  matchAllLabel,
  matchAnyLabel,
}: GridCardHeaderProps) {
  const HeadingTag: ElementType = `h${headingLevel}`;
  const hasToolbar = onToggleFilters !== undefined || onRefresh !== undefined;
  return (
    <header className={styles.header}>
      <HeadingTag id={headingId} className={styles.heading}>
        {heading}
      </HeadingTag>
      {hasToolbar || actions ? (
        <div className={styles.cluster}>
          {hasToolbar ? (
            <Toolbar aria-label={toolbarLabel}>
              {showMatchMode ? (
                <Segmented
                  aria-label={matchModeLabel}
                  size="sm"
                  options={[
                    { value: 'all', label: matchAllLabel },
                    { value: 'any', label: matchAnyLabel },
                  ]}
                  value={matchMode}
                  onValueChange={(value) => onMatchModeChange(value === 'any' ? 'any' : 'all')}
                />
              ) : null}
              {onToggleFilters ? (
                <ToolbarButton
                  onClick={() => onToggleFilters()}
                  render={
                    <IconButton
                      label={filtersLabel}
                      size="sm"
                      pressed={filtersOpen}
                      badge={filterCount}
                    >
                      <FilterIcon />
                    </IconButton>
                  }
                />
              ) : null}
              {onRefresh ? (
                <ToolbarButton
                  loading={refreshing}
                  onClick={() => onRefresh()}
                  render={
                    <IconButton label={refreshLabel} size="sm">
                      <RefreshIcon />
                    </IconButton>
                  }
                />
              ) : null}
            </Toolbar>
          ) : null}
          {actions ? <div className={styles.actions}>{actions}</div> : null}
        </div>
      ) : null}
    </header>
  );
}
