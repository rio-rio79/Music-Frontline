import type { ReactNode } from "react";
import styles from "./PageTabs.module.css";

export type PageTabItem<Key extends string> = {
  key: Key;
  label: ReactNode;
};

type PageTabsProps<Key extends string> = {
  items: readonly PageTabItem<Key>[];
  activeKey: Key;
  ariaLabel: string;
  onChange: (key: Key) => void;
  className?: string;
};

export default function PageTabs<Key extends string>({
  items,
  activeKey,
  ariaLabel,
  onChange,
  className,
}: PageTabsProps<Key>) {
  const rootClassName = className ? `${styles.tabs} ${className}` : styles.tabs;

  return (
    <div className={rootClassName} role="tablist" aria-label={ariaLabel}>
      {items.map((item) => {
        const isActive = activeKey === item.key;

        return (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={`${styles.tab} ${isActive ? styles.tabActive : ""}`}
            onClick={() => onChange(item.key)}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
