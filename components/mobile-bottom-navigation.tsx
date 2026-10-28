import { Icon } from "./ui";

export function MobileBottomNavigation() {
  return (
    <nav className="ref-bottom-nav" aria-label="Điều hướng dưới cùng trên điện thoại">
      <a className="ref-bottom-nav__link ref-bottom-nav__link--active" href="#home" aria-current="page">
        <Icon name="home" size={23} /><span>Trang chủ</span>
      </a>
      <a className="ref-bottom-nav__link" href="#categories">
        <Icon name="menu" size={23} /><span>Danh mục</span>
      </a>
      <button className="ref-bottom-nav__link" type="button" disabled aria-label="Giỏ hàng chưa mở">
        <Icon name="cart" size={23} /><span>Giỏ hàng</span>
      </button>
      <button className="ref-bottom-nav__link" type="button" disabled aria-label="Tài khoản chưa mở">
        <Icon name="user" size={23} /><span>Tài khoản</span>
      </button>
    </nav>
  );
}
