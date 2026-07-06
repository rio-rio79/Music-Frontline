"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import HamburgerMenu from "./HamburgerMenu";
import MiniPlayer from "./MiniPlayer";
import { Heart, CdSvg, PersonSvg } from "./Svgs";
import style from "./Header.module.css";

const ACTIVE_COLOR = "#E8447A";
const INACTIVE_COLOR = "#555555";

export default function Header() {
    const pathname = usePathname();

    const menuItems = [
        { name: "ホーム", href: "/" },
        { name: "楽曲一覧", href: "/music" },
        { name: "ブログ", href: "/blog" },
        { name: "ジュニア一覧", href: "/junior" },
        { name: "ランキング", href: "/ranking" },
        { name: "クラファン", href: "/support/music-unlock" },
        { name: "スパチャ", href: "/support/tip" },
        { name: "お問い合わせ", href: "/contact" },
        { name: "マイページ", href: "/my/profile" },
        { name: "設定", href: "/my/setting" },
        { name: "ログイン", href: "/login" },
    ];

    const quickLinks = [
        { name: "楽曲一覧", href: "/", Icon: CdSvg },
        { name: "いいね一覧", href: "/like", Icon: Heart },
        { name: "マイページ", href: "/my/profile", Icon: PersonSvg },
    ];

    return (
        <header className={style.header}>
            <h1>Music Frontline</h1>

            <MiniPlayer />

            <div className={style.headerRight}>
                {quickLinks.map(({ name, href, Icon }) => {
                    const isActive = pathname === href;
                    const color = isActive ? ACTIVE_COLOR : INACTIVE_COLOR;

                    return (
                        <Link key={href} href={href} className={style.headerLikeLink}>
                            <Icon color={color} />
                            <span style={{ color }}>{name}</span>
                        </Link>
                    );
                })}

                <div className={style.headerMenu}>
                    <HamburgerMenu items={menuItems} />
                </div>
            </div>
        </header>
    );
}