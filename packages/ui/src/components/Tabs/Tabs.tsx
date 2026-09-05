import { Tabs as BaseTabs } from '@base-ui/react/tabs';
import type { ReactNode } from 'react';
import styles from './Tabs.module.css';

export interface TabItem {
  value: string;
  label: string;
  content: ReactNode;
  disabled?: boolean;
}

export interface TabsProps {
  items: TabItem[];
  /** Accessible name for the tab list. */
  label: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
}

export function Tabs({ items, label, value, defaultValue, onValueChange }: TabsProps) {
  const initial = defaultValue ?? items[0]?.value;
  return (
    <BaseTabs.Root
      className={styles.root}
      value={value}
      defaultValue={initial}
      onValueChange={(next) => onValueChange?.(String(next))}
    >
      <BaseTabs.List className={styles.list} aria-label={label}>
        {items.map((item) => (
          <BaseTabs.Tab
            key={item.value}
            className={styles.tab}
            value={item.value}
            disabled={item.disabled}
          >
            {item.label}
          </BaseTabs.Tab>
        ))}
        <BaseTabs.Indicator className={styles.indicator} />
      </BaseTabs.List>
      {items.map((item) => (
        <BaseTabs.Panel key={item.value} value={item.value}>
          {item.content}
        </BaseTabs.Panel>
      ))}
    </BaseTabs.Root>
  );
}
