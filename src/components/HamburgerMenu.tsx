"use client";

import { useEffect,useState } from "react";
import Link from "next/link";

type MenuItem = {
  name: string;
  href: string;
};

type HamburgerMenuProps = {
  items: MenuItem[];
};

export default function HamburgerMenu({
  items,
}: HamburgerMenuProps) {
  const [open, setOpen] = useState(false);
 const [selectedColor, setSelectedColor] =
  useState("#F8BBD0");

const [favoriteColor, setFavoriteColor] =
  useState("#F8BBD0");
const colors = [
  "#FF9AA2", // パステルレッド
  "#F8BBD0", // パステルピンク
  "#F5CBA7", // パステルオレンジ
  "#FFF4A3", // パステルイエロー
  "#C8E6C9", // パステルグリーン
  "#B3E5FC", // パステルスカイ
  "#A7C7E7", // パステルブルー
  "#D1C4E9", // パステルパープル
  "#F5F5F5", // ホワイト
  "#ffd700", // ゴールド
  "#000000", // ブラック
];

useEffect(() => {
  const savedColor =
    localStorage.getItem("favoriteColor");

  if (savedColor) {
    setFavoriteColor(savedColor);
    setSelectedColor(savedColor);
  }
}, []);

 useEffect(() => {
  document.documentElement.style.setProperty(
    "--favorite-color",
    favoriteColor
  );
}, [favoriteColor]);

  return (
    <>
      <button
        className="hamburger"
        onClick={() => setOpen(!open)}
        aria-label="メニュー"
      >
        ☰
      </button>

      <nav
        className={`sidebar ${open ? "open" : ""}`}
      >
        <ul>
          {items.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={() => setOpen(false)}
              >
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
<div className="favorite-color-setting">
  <h3>推しカラー設定</h3>

  <div className="favorite-color-grid">
    {colors.map((color) => (
      <button
        key={color}
        className={`color-option ${
          selectedColor === color
            ? "selected"
            : ""
        }`}
        style={{
          backgroundColor: color,
        }}
        onClick={() =>
          setSelectedColor(color)
        }
      />
    ))}
  </div>

  <button
    className="favorite-color-save"
    onClick={() => {
      setFavoriteColor(selectedColor);

      localStorage.setItem(
        "favoriteColor",
        selectedColor
      );
    }}
  >
    保存
  </button>
</div>
        
      </nav>

      {open && (
        <div
          className="overlay"
          onClick={() => setOpen(false)}
        />
      )}
    
    
 </>
  );
}