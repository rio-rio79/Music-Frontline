"use client";

import styles from "./MyComponent.module.css"; // スタイルのインポート

export default function Top() {
    return (
        <section className={styles.container}>
            <h1>
                トップページに差し替えるかも！！
            </h1>
        </section>
    );
}