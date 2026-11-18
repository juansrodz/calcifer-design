import type { RowData } from '@tanstack/react-table';
import { useLayoutEffect, useRef, type ElementType, type ReactNode } from 'react';
import { FilterIcon } from '../../icons/FilterIcon';
import { RefreshIcon } from '../../icons/RefreshIcon';
import { SearchIcon } from '../../icons/SearchIcon';
import { IconButton } from '../IconButton/IconButton';
import { Segmented } from '../Segmented/Segmented';
import { Toolbar, ToolbarButton } from '../Toolbar/Toolbar';
import styles from './DataGrid.module.css';
import { GridSearch } from './GridSearch';
import type { DataGridProps, DataGridQuery } from './types';

export interface GridCardHeaderSearch {
  /** Whether the field shows: the button is pressed while it does. */
  open: boolean;
  /** The search in the query. */
  value: string;
  buttonLabel: string;
  fieldLabel: string;
  clearLabel: string;
  /** The search button: opens the field, or clears the search and closes it. */
  onToggle: () => void;
  /** Escape in the empty field. */
  onClose: () => void;
  onSearchChange: (term: string) => void;
  /** Focus moved into the field. */
  onFieldFocus: () => void;
}

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
  /** Gives the toolbar its search button, and the field before the toolbar. Left out, neither. */
  search?: GridCardHeaderSearch;
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
 * The card's heading, with the search field while it shows, the toolbar (search, match mode, the
 * filters button, refresh) and the consumer's actions beside it. Opening the search moves focus into
 * its field; Escape there, once it is empty, closes it and returns focus to the search button.
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
  search,
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
  const hasToolbar =
    search !== undefined || onToggleFilters !== undefined || onRefresh !== undefined;
  const clusterRef = useRef<HTMLDivElement>(null);
  // Where focus goes once the search field has opened or closed: the field or the search button
  // exists only after the render the press asked for.
  const pendingFocusRef = useRef<'field' | 'button' | null>(null);
  useLayoutEffect(() => {
    const target = pendingFocusRef.current;
    if (target === null) return;
    pendingFocusRef.current = null;
    const selector = target === 'field' ? '[data-grid-search-field]' : '[data-grid-search-button]';
    clusterRef.current?.querySelector<HTMLElement>(selector)?.focus();
  });
  return (
    <header className={styles.header}>
      <HeadingTag id={headingId} className={styles.heading}>
        {heading}
      </HeadingTag>
      {hasToolbar || actions ? (
        <div ref={clusterRef} className={styles.cluster}>
          {search?.open ? (
            <GridSearch
              label={search.fieldLabel}
              clearLabel={search.clearLabel}
              value={search.value}
              onSearchChange={search.onSearchChange}
              onClose={() => {
                pendingFocusRef.current = 'button';
                search.onClose();
              }}
              onFocus={search.onFieldFocus}
            />
          ) : null}
          {hasToolbar ? (
            <Toolbar aria-label={toolbarLabel}>
              {search ? (
                <ToolbarButton
                  data-grid-search-button=""
                  onClick={() => {
                    if (!search.open) pendingFocusRef.current = 'field';
                    search.onToggle();
                  }}
                  render={
                    <IconButton label={search.buttonLabel} size="sm" pressed={search.open}>
                      <SearchIcon />
                    </IconButton>
                  }
                />
              ) : null}
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
