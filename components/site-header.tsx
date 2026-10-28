"use client";

import { useState } from "react";
import Link from "next/link";
import { Container, Icon } from "./ui";

const navigation = [
  { label: "Trang chủ", href: "#home" },
  { label: "Giới thiệu", href: "#about" },
  { label: "Sản phẩm", href: "#categories" },
  { label: "Khuyến mãi", href: "", disabled: true },
  { label: "Tin tức", href: "", disabled: true },
  { label: "Liên hệ", href: "#contact" },
] as const;

function Brand() {
  return (
    <Link href="/#home" className="brand-logo" aria-label="Futurebook Miền Nam — về trang chủ">
      <span className="brand-logo__mark" aria-hidden="true">FB</span>
      <span className="brand-logo__type">
        <strong>FBMN</strong>
        <small>FUTUREBOOK MIỀN NAM</small>
      </span>
    </Link>
  );
}

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="site-header">
      <div className="announcement">
        <Container className="announcement__inner">
          <span>✦ Chào mừng bạn đến với Futurebook Miền Nam!</span>
          <span className="announcement__contact">Catalogue và thông tin liên hệ đang cập nhật <span aria-hidden="true">✦</span></span>
        </Container>
      </div>

      <Container className="header-main">
        <button
          className="icon-button menu-toggle"
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-expanded={menuOpen}
          aria-controls="site-navigation"
          aria-label={menuOpen ? "Đóng menu" : "Mở menu"}
        >
          <Icon name={menuOpen ? "x" : "menu"} size={24} />
        </button>
        <Brand />

        <div className="header-search" role="search" aria-label="Tìm kiếm sản phẩm">
          <label className="sr-only" htmlFor="desktop-search">Tìm kiếm sản phẩm</label>
          <input id="desktop-search" placeholder="Tìm tập vở, sổ tay, văn phòng phẩm..." disabled
            title="Tìm kiếm sẽ triển khai trong giai đoạn catalogue" />
          <button type="button" aria-label="Tìm kiếm — sắp ra mắt" disabled><Icon name="search" size={21} /></button>
        </div>

        <div className="header-actions">
          <button className="header-account" type="button" disabled title="Tài khoản sẽ mở khi hoàn tất tích hợp">
            <Icon name="user" size={25} />
            <span><strong>Tài khoản</strong><small>Chưa mở đăng nhập</small></span>
          </button>
          <button className="header-cart" type="button" disabled title="Giỏ hàng chưa được triển khai">
            <Icon name="cart" size={25} />
            <span><strong>Giỏ hàng</strong><small>Chưa mở đặt hàng</small></span>
          </button>
          <button className="icon-button mobile-search" type="button" disabled aria-label="Tìm kiếm — sắp ra mắt">
            <Icon name="search" size={22} />
          </button>
        </div>
      </Container>

      <nav id="site-navigation" className={["site-navigation", menuOpen ? "site-navigation--open" : ""].join(" ")}
        aria-label="Điều hướng chính">
        <Container className="site-navigation__inner">
          {navigation.map((item, index) =>
            "disabled" in item && item.disabled ? (
              <span key={item.label} className="nav-item nav-item--disabled" aria-disabled="true"
                title="Nội dung sắp được cập nhật">{item.label}</span>
            ) : (
              <Link
                className={["nav-item", index === 0 ? "nav-item--active" : ""].filter(Boolean).join(" ")}
                href={item.href}
                key={item.label}
                onClick={() => setMenuOpen(false)}
                aria-current={index === 0 ? "page" : undefined}
              >
                {index === 0 ? <Icon name="home" size={15} /> : null}
                {item.label}
                {index === 2 ? <Icon name="down" size={14} /> : null}
              </Link>
            )
          )}
        </Container>
      </nav>
    </header>
  );
}
