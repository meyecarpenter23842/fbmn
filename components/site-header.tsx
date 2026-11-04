"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Container, Icon } from "./ui";
import { AppDownloadMenuButton } from "./app-download";

const desktopNavigation = [
  { label: "Trang chủ", href: "/#home" },
  { label: "Giới thiệu", href: "/gioi-thieu" },
  { label: "Sản phẩm", href: "/san-pham" },
  { label: "Khuyến mãi", href: "/khuyen-mai" },
  { label: "Dành cho đại lý", href: "/dai-ly" },
  { label: "Tin tức", href: "/tin-tuc" },
  { label: "Liên hệ", href: "/lien-he" },
] as const;

function Brand() {
  return (
    <Link className="ref-brand" href="/#home" aria-label="Futurebook Miền Nam — Trang chủ">
      <Image src="/brand/fbmn-official-logo.webp" alt="Logo chính thức Futurebook Miền Nam" width={300} height={84} priority className="ref-brand__official-image" />
    </Link>
  );
}

export function SiteHeader() {
  const pathname = usePathname();

  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  // A pending nav indicator is tied to the actual pathname change, never a timer.
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const navigating = pendingPath !== null && pendingPath !== pathname;
  const beginNavigation = (href: string) => {
    setMenuOpen(false);
    const target = href.split("?")[0];
    setPendingPath(target.startsWith("/#") || target === pathname ? null : target);
  };
  const menuButton = useRef<HTMLButtonElement>(null);
  const menuPanel = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!menuOpen && !searchOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        setSearchOpen(false);
        menuButton.current?.focus();
      }
    };
    const onPointerDown = (event: PointerEvent) => {
      if (menuOpen && event.target instanceof Node && !menuPanel.current?.contains(event.target) && !menuButton.current?.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [menuOpen, searchOpen]);

  return (
    <header className="ref-header">
      <Container className="ref-header__inner">
        <Brand />
        <form className="ref-header__desktop-search" role="search" aria-label="Tìm kiếm sản phẩm" action="/san-pham" method="get">
          <input type="search" name="q" aria-label="Tìm sản phẩm" placeholder="Tìm sản phẩm: vở A4, vở B5, sổ tay..." maxLength={80}/>
          <button type="submit" aria-label="Tìm sản phẩm"><Icon name="search" size={22}/></button>
        </form>
        <div className="ref-header__right">
          <div className="ref-header__contact"><small>Thông tin liên hệ</small><strong>Đang cập nhật</strong></div>
          <button className="ref-header__desktop-action" type="button" disabled title="Tài khoản sẽ mở khi có phân quyền"><Icon name="user" size={24}/><span>Tài khoản</span></button>
          <button className="ref-header__desktop-action" type="button" disabled title="Giỏ hàng chưa mở"><Icon name="cart" size={24}/><span>Giỏ hàng</span></button>
          <button className="ref-header__mobile-icon" type="button"
            aria-label={searchOpen ? "Đóng thông báo tìm kiếm" : "Mở thông báo tìm kiếm"}
            aria-expanded={searchOpen} aria-controls="ref-mobile-search"
            onClick={() => { setSearchOpen(!searchOpen); setMenuOpen(false); }}><Icon name="search" size={23}/></button>
          <button className="ref-header__mobile-icon" type="button" disabled aria-label="Giỏ hàng chưa mở"><Icon name="cart" size={23}/></button>
          <button className="ref-header__mobile-icon" type="button" ref={menuButton}
            aria-label={menuOpen ? "Đóng danh mục điều hướng" : "Mở danh mục điều hướng"}
            aria-expanded={menuOpen} aria-controls="site-navigation"
            onClick={() => { setMenuOpen(!menuOpen); setSearchOpen(false); }}><Icon name={menuOpen ? "x" : "menu"} size={24}/></button>
        </div>
      </Container>
      <nav ref={menuPanel} id="site-navigation" className={"ref-navigation" + (menuOpen ? " ref-navigation--open" : "")} aria-label="Điều hướng chính">
        <Container className="ref-navigation__inner">
          <Link className="ref-navigation__catalog" href="/san-pham" onNavigate={() => beginNavigation("/san-pham")} onClick={() => setMenuOpen(false)}><Icon name="menu" size={17}/> Danh mục sản phẩm <Icon name="down" size={15}/></Link>
          {desktopNavigation.map(item => {
            const active = item.href === "/#home" ? pathname === "/" : pathname === item.href;
            return <Link className={"ref-navigation__link" + (active ? " ref-navigation__link--active" : "")}
              key={item.label} href={item.href}
              prefetch={item.href === "/san-pham" || item.href === "/#home" ? null : false}
              onNavigate={() => beginNavigation(item.href)} onClick={() => setMenuOpen(false)}
              aria-current={active ? "page" : undefined}>{item.label}</Link>;
          })}
          <AppDownloadMenuButton onOpen={() => setMenuOpen(false)} />
        </Container>
        <span className={"ref-navigation__progress" + (navigating ? " ref-navigation__progress--active" : "")} aria-hidden="true" />
      </nav>
      <div id="ref-mobile-search" className="ref-search-notice" hidden={!searchOpen} role="status">
        <Container><form action="/san-pham" method="get" role="search" aria-label="Tìm sản phẩm trên điện thoại" className="catalog-mobile-search"><label htmlFor="catalog-header-mobile-q">Tìm sản phẩm theo tên hoặc mã SKU</label><div><input id="catalog-header-mobile-q" name="q" type="search" maxLength={80} placeholder="Nhập sản phẩm cần tìm..." /><button type="submit">Tìm kiếm</button></div></form></Container>
      </div>
    </header>
  );
}
