import MusicList from "../components/MusicList/MusicList";
import songs from "../data/songs";
import styles from "./MyComponent.module.css"; // スタイルのインポート

export default function Top() {
    return (
        <section className={styles.container}>
            
            {/* 検索ボックスとドロップダウンのラッパー */}

            <div className={styles.searchContainer}>

                {/* 右上のドロップダウンリスト */}
                <select className={styles.dropdown}>
                    <option value="group">グループ順</option>
                    <option value="fifty">50音順</option>
                    <option value="new">新着順</option>
                    <option value="popular">人気順</option>
                </select>
                
                {/* 検索ボックス */}
                <div className={styles.searchBox}>
                    <svg width="16" height="16" viewBox="0 0 22 22" fill="none" stroke="#bbb" strokeWidth="2">
                        <circle cx="9" cy="9" r="7"/>
                        <path d="M14.5 14.5 L20 20" strokeLinecap="round"/>
                    </svg>
                    <input type="text" placeholder="検索ボックス" />
                </div>


                
            </div>

            {/* MUSIC LIST */}
            <MusicList songs={songs} />
        </section>
    );
}