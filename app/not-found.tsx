import Link from "next/link";

export default function NotFound() {
  return (
    <main className="foundation">
      <section className="notice">
        <h1>Không tìm thấy trang</h1>
        <p>Trang bạn đang tìm chưa có trên website Futurebook Miền Nam.</p>
        <Link href="/">Trở về trang chủ</Link>
      </section>
    </main>
  );
}
