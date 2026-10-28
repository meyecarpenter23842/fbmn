export default function HomePage() {
  return (
    <main className="foundation">
      <div className="brand" aria-label="Futurebook Miền Nam">
        <span className="brandMark">FBMN</span>
        <span>FUTUREBOOK MIỀN NAM</span>
      </div>
      <section className="notice" aria-labelledby="foundation-title">
        <span className="eyebrow">WEBSITE FOUNDATION · PR 00</span>
        <h1 id="foundation-title">Futurebook Miền Nam</h1>
        <p>
          Nền tảng website đã được khởi tạo. Giao diện chính thức trên desktop
          và mobile sẽ được triển khai theo thiết kế đã duyệt ở các PR tiếp theo.
        </p>
        <div className="status" role="status">Đang xây dựng · Chưa mở bán trực tuyến</div>
      </section>
      <footer>Website Futurebook Miền Nam · Bản thử nghiệm nội bộ</footer>
    </main>
  );
}
