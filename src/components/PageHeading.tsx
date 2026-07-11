import styles from "./PageHeading.module.css";

type PageHeadingProps = {
  title: string;
};

export default function PageHeading({ title }: PageHeadingProps) {
  return (
    <div className={styles.pageHeading}>
      <span className={styles.bar} aria-hidden="true" />
      <h1 className={styles.title}>{title}</h1>
    </div>
  );
}
