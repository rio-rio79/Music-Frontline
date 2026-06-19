import HamburgerMenu from "./HamburgerMenu";

export default function Header() {
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
    return (
        <header>
            <h1>Music Frontline</h1>
            <HamburgerMenu items={menuItems} />
        </header>
    );
}
