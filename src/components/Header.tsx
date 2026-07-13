"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import FavoriteColorInitializer from "./FavoriteColorInitializer";
import MiniPlayer from "./MiniPlayer";
import styles from "./Header.module.css";

type HeaderProps = {
    initialFavoriteColor?: string | null;
};

type NavItem = {
    name: string;
    href: string;
    key: "home" | "junior" | "music" | "blog" | "ranking" | "mylist" | "fanletter" | "mypage";
};

const navItems: NavItem[] = [
    { name: "HOME", href: "/", key: "home" },
    { name: "Junior", href: "/junior", key: "junior" },
    { name: "Music", href: "/music", key: "music" },
    { name: "Blog", href: "/blog", key: "blog" },
    { name: "Ranking", href: "/ranking", key: "ranking" },
    { name: "FanLetter", href: "/support/tip", key: "fanletter" },
    { name: "MyPage", href: "/my/profile", key: "mypage" },
    { name: "MyList", href: "/my/list", key: "mylist" },
];

export default function Header({
    initialFavoriteColor = null,
}: HeaderProps) {
    const pathname = usePathname();

    return (
        <>
            <FavoriteColorInitializer initialColor={initialFavoriteColor} />

            <nav className={styles.sideNav} aria-label="メインナビゲーション">
                <Link href="/" className={styles.logo} aria-label="Music Frontline ホーム">
                    <span className={styles.logoMark} aria-hidden="true" />
                    <span className={styles.brandText}>
                        <span className={styles.brandWord}>Music</span>
                        <span className={`${styles.brandWord} ${styles.brandWordStrong}`}>Frontline</span>
                    </span>
                </Link>

                <ul className={styles.navList}>
                    {navItems.map((item) => {
                        const active = isActivePath(pathname, item.href);

                        return (
                            <li key={item.href}>
                                <Link
                                    href={item.href}
                                    className={`${styles.navLink} ${active ? styles.navLinkActive : ""}`}
                                    aria-current={active ? "page" : undefined}
                                    title={item.name}
                                >
                                    <NavIcon type={item.key} />
                                    <span className={styles.navLabel}>{item.name}</span>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            <header className={styles.playerHeader}>
                <MiniPlayer />
            </header>
        </>
    );
}

function isActivePath(pathname: string, href: string) {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
}

function NavIcon({ type }: { type: NavItem["key"] }) {
    if (type === "home") {
        return (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M4 11.5 12 4l8 7.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M6 10v9h12v-9" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
            </svg>
        );
    }

    if (type === "junior") {
        return (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="9" cy="9" r="3.2" stroke="currentColor" strokeWidth="1.6" />
                <circle cx="16" cy="10" r="2.6" stroke="currentColor" strokeWidth="1.6" />
                <path d="M3.5 19c0-3 2.5-5.4 5.5-5.4s5.5 2.4 5.5 5.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                <path d="M15 14.2c2.5 0 4.5 2 4.5 4.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
        );
    }

    if (type === "music") {
        return (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M9 18V5l11-2v13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="6" cy="18" r="2.4" stroke="currentColor" strokeWidth="1.6" />
                <circle cx="17" cy="16" r="2.4" stroke="currentColor" strokeWidth="1.6" />
            </svg>
        );
    }

    if (type === "blog") {
        return (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect x="5" y="3.5" width="14" height="17" rx="1.6" stroke="currentColor" strokeWidth="1.6" />
                <path d="M8.5 8.5h7M8.5 12h7M8.5 15.5h4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
        );
    }

    if (type === "ranking") {
        return (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M7 4h10v5a5 5 0 0 1-10 0V4z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
                <path d="M7 5.5H4.5a2 2 0 0 0 2 3.5M17 5.5h2.5a2 2 0 0 1-2 3.5" stroke="currentColor" strokeWidth="1.5" />
                <path d="M12 14v3.5M9 20.5h6M9.5 20.5c0-1.8.7-3 2.5-3s2.5 1.2 2.5 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        );
    }

    if (type === "fanletter") {
        return (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect x="3.5" y="5.5" width="17" height="13" rx="1.8" stroke="currentColor" strokeWidth="1.6" />
                <path d="M4 6.5 12 13l8-6.5" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
            </svg>
        );
    }

    if (type === "mylist") {
        return (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M6 5.5h12M6 11.5h12M6 17.5h8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                <path d="M18 16.2c1.1-1.2 3.1-.4 3.1 1.3 0 2.1-3.1 3.8-3.1 3.8s-3.1-1.7-3.1-3.8c0-1.7 2-2.5 3.1-1.3z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
            </svg>
        );
    }

    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="8.2" r="3.7" stroke="currentColor" strokeWidth="1.6" />
            <path d="M4.5 20c0-4.1 3.4-7.4 7.5-7.4s7.5 3.3 7.5 7.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
    );
}
