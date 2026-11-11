"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Container, Icon } from "./ui";

const desktopNavigation = [
  { label: "Trang chủ", href: "/#home" },
  { label: "Sản phẩm", href: "/san-pham" },
  { label: "Gia công", href: "/gia-cong" },
  { label: "Bảng tin", href: "/bang-tin" },
  { label: "Catalogue", href: "/catalogue" },
  { label: "Liên hệ", href: "/lien-he" },
] as const;

function Brand({mobile=false}: {mobile?:boolean}) {
  return (
    <Link className={"ref-brand"+(mobile?" ref-brand--mobile":"")} href="/#home" aria-label="Futurebook Miền Nam — Trang chủ">
      <Image src="/brand/fbmn-transparent-logo.webp" alt="Logo chính thức Futurebook Miền Nam" width={300} height={84} sizes={mobile?"132px":"144px"} priority className="ref-brand__official-image" />
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
  const searchButton = useRef<HTMLButtonElement>(null);
  const menuPanel = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!menuOpen && !searchOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        setSearchOpen(false);
        (searchOpen?searchButton:menuButton).current?.focus();
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
          <button className="ref-header__mobile-icon ref-header__mobile-search" type="button"
            aria-label={searchOpen ? "Đóng thông báo tìm kiếm" : "Mở thông báo tìm kiếm"}
            ref={searchButton} aria-expanded={searchOpen} aria-controls="ref-mobile-search"
            onClick={() => { setSearchOpen(!searchOpen); setMenuOpen(false); }}><Icon name="search" size={23}/></button>
        <Brand mobile />
        <form className="ref-header__desktop-search" role="search" aria-label="Tìm kiếm sản phẩm" action="/san-pham" method="get">
          <input type="search" name="q" aria-label="Tìm sản phẩm" placeholder="Tìm sản phẩm" maxLength={80}/>
          <button type="submit" aria-label="Tìm sản phẩm"><Icon name="search" size={22}/></button>
        </form>
      <nav ref={menuPanel} id="site-navigation" className={"ref-navigation" + (menuOpen ? " ref-navigation--open" : "")} aria-label="Điều hướng chính">
        <div className="ref-navigation__inner">
          {[desktopNavigation.slice(0,3),desktopNavigation.slice(3)].map((group,index)=><Fragment key={index}><div className={"ref-navigation__group"+(index?" ref-navigation__group--right":"")}>{group.map(item => {
            const active = item.href === "/#home" ? pathname === "/"
              : item.href === "/san-pham" ? pathname === "/san-pham" || pathname.startsWith("/san-pham/") || pathname.startsWith("/danh-muc/")
              : item.href === "/bang-tin" ? pathname === "/bang-tin" || pathname.startsWith("/tin-tuc") || pathname.startsWith("/khuyen-mai")
              : item.href === "/lien-he" ? pathname === "/lien-he" || pathname === "/dai-ly"
              : pathname === item.href;
            return <Link className={"ref-navigation__link" + (active ? " ref-navigation__link--active" : "")}
              key={item.label} href={item.href}
              prefetch={item.href === "/san-pham" || item.href === "/#home" ? null : false}
              onNavigate={() => beginNavigation(item.href)} onClick={() => setMenuOpen(false)}
              aria-current={active ? "page" : undefined}>{item.label}</Link>;
          })}</div>{index===0&&<Brand />}</Fragment>)}
          <Link className="ref-navigation__dealer-cta-mobile" href="/lien-he#thong-tin-lien-he"
            onNavigate={() => beginNavigation("/lien-he")} onClick={() => setMenuOpen(false)}>
            <Icon name="arrow" size={17}/> Hợp tác đại lý · Báo giá sỉ
          </Link>
        </div>

      </nav>
        <div className="ref-header__right">
          <Link className="ref-header__dealer-cta" href="/lien-he#thong-tin-lien-he"
            onNavigate={() => beginNavigation("/lien-he")}
            aria-label="Liên hệ Futurebook để hỏi báo giá sỉ và hợp tác đại lý">
            <span className="ref-header__dealer-full">Liên hệ đại lý</span><span className="ref-header__dealer-short">Đại lý</span><Icon name="arrow" size={16}/>
          </Link>
          <button className="ref-header__mobile-icon" type="button" ref={menuButton}
            aria-label={menuOpen ? "Đóng danh mục điều hướng" : "Mở danh mục điều hướng"}
            aria-expanded={menuOpen} aria-controls="site-navigation"
            onClick={() => { setMenuOpen(!menuOpen); setSearchOpen(false); }}><Icon name={menuOpen ? "x" : "menu"} size={24}/></button>
        </div>
      </Container>
      <span className={"ref-navigation__progress" + (navigating ? " ref-navigation__progress--active" : "")} aria-hidden="true" />
      <div id="ref-mobile-search" className="ref-search-notice" hidden={!searchOpen} role="status">
        <Container><form action="/san-pham" method="get" role="search" aria-label="Tìm sản phẩm trên điện thoại" className="catalog-mobile-search"><label htmlFor="catalog-header-mobile-q">Tìm sản phẩm theo tên hoặc mã SKU</label><div><input id="catalog-header-mobile-q" name="q" type="search" maxLength={80} placeholder="Nhập sản phẩm cần tìm..." /><button type="submit">Tìm kiếm</button></div></form></Container>
      </div>
    </header>
  );
}
