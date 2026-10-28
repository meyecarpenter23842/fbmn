"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Container, Icon } from "./ui";
import { VerifiedMediaImage } from "./verified-media-image";
import { approvedSiteMedia } from "@/lib/media/approved-site-media";

const desktopNavigation = [
  { label: "Trang chủ", href: "#home" },
  { label: "Giới thiệu", href: "#about" },
  { label: "Sản phẩm", href: "#categories" },
  { label: "Khuyến mãi", href: "#collections" },
  { label: "Dành cho đại lý", href: "#agency" },
  { label: "Tin tức", href: "", disabled: true },
  { label: "Liên hệ", href: "#contact" },
] as const;

function Brand() {
  return (
    <Link className="ref-brand" href="/#home" aria-label="Futurebook Miền Nam — Trang chủ">
      <span className="ref-brand__emblem" aria-hidden="true">
        <VerifiedMediaImage asset={approvedSiteMedia.brandLogo} fallback="FB" className="ref-brand__img" priority sizes="54px" />
      </span>
      <span className="ref-brand__name"><strong>FBMN</strong><small>FUTUREBOOK MIỀN NAM</small></span>
    </Link>
  );
}

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!menuOpen && !searchOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        setSearchOpen(false);
        menuButton.current?.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [menuOpen, searchOpen]);

  return (
    <header className="ref-header">
      <Container className="ref-header__inner">
        <Brand />
        <div className="ref-header__desktop-search" role="search" aria-label="Tìm kiếm sản phẩm">
          <input type="search" aria-label="Tìm sản phẩm" placeholder="Tìm sản phẩm: vở A4, vở B5, sổ tay..." disabled title="Tìm kiếm chưa mở" />
          <button type="button" disabled aria-label="Tìm kiếm chưa mở"><Icon name="search" size={22}/></button>
        </div>
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
      <nav id="site-navigation" className={"ref-navigation" + (menuOpen ? " ref-navigation--open" : "")} aria-label="Điều hướng chính">
        <Container className="ref-navigation__inner">
          <Link className="ref-navigation__catalog" href="#categories" onClick={() => setMenuOpen(false)}><Icon name="menu" size={17}/> Danh mục sản phẩm <Icon name="down" size={15}/></Link>
          {desktopNavigation.map(item => "disabled" in item && item.disabled ? (
            <span className="ref-navigation__link ref-navigation__link--disabled" aria-disabled="true" key={item.label}>{item.label}</span>
          ) : (
            <Link className={"ref-navigation__link" + (item.href === "#home" ? " ref-navigation__link--active" : "")}
              key={item.label} href={item.href} onClick={() => setMenuOpen(false)}
              aria-current={item.href === "#home" ? "page" : undefined}>{item.label}</Link>
          ))}
        </Container>
      </nav>
      <div id="ref-mobile-search" className="ref-search-notice" hidden={!searchOpen} role="status">
        <Container>Tìm kiếm sản phẩm đang được hoàn thiện. <Link href="#categories" onClick={() => setSearchOpen(false)}>Xem danh mục</Link></Container>
      </div>
    </header>
  );
}
