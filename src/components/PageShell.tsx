import type { ReactNode } from "react";
import styles from "./PageShell.module.css";

type PageShellProps = {
  children: ReactNode;
  className?: string;
};

export default function PageShell({ children, className }: PageShellProps) {
  return (
    <section className={[styles.pageShell, className].filter(Boolean).join(" ")}>
      {children}
    </section>
  );
}
