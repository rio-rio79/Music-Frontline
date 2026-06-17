import HamburgerMenu from "./HamburgerMenu";

export default function Header() {
  const menuItems = [
    { name: "ホーム", href: "/" },
    { name: "音楽", href: "/music" },
    { name: "ブログ", href: "/blog" },
    { name: "お問い合わせ", href: "/contact" },
  ];
  return (
    <header>
      <h1>Music Frontline</h1>
      <HamburgerMenu items={menuItems} />
    </header>
  );
}