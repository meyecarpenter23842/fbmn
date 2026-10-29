"use client";

import { useCallback, useEffect, useState } from "react";
import { createAuthClient } from "@neondatabase/auth/next";

type State = "checking" | "anonymous" | "authorised" | "forbidden" | "unavailable";
type AdminSession = { role: string; channels: string[] };
type Channel = { code: string; label: string };
const authClient = createAuthClient();

export default function AdminPage() {
  const [state, setState] = useState<State>("checking");
  const [session, setSession] = useState<AdminSession | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    setState("checking");
    setError("");
    try {
      const auth = await authClient.getSession();
      if (auth.error) { setState("unavailable"); return; }
      if (!auth.data?.user) { setState("anonymous"); return; }
      setName(auth.data.user.name || auth.data.user.email || "");
      const response = await fetch("/api/admin/session", { cache: "no-store", credentials: "same-origin" });
      if (response.status === 401) { setState("anonymous"); return; }
      if (response.status === 403) { setState("forbidden"); return; }
      if (!response.ok) { setState("unavailable"); return; }
      const body = await response.json() as { data?: AdminSession };
      if (!body.data?.role || !Array.isArray(body.data.channels)) throw new Error("Invalid server response");
      setSession(body.data);
      setState("authorised");
      const ch = await fetch("/api/admin/channels", { cache: "no-store", credentials: "same-origin" });
      if (ch.ok) {
        const result = await ch.json() as { data?: Channel[] };
        if (Array.isArray(result.data)) setChannels(result.data);
      }
    } catch {
      setState("unavailable");
    }
  }, []);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => { if (active) void refresh(); });
    return () => { active = false; };
  }, [refresh]);

  async function login() {
    setBusy(true);
    setError("");
    try {
      const result = await authClient.signIn.social({ provider: "google", callbackURL: "/" });
      if (result.error) setError("Không khởi tạo được đăng nhập Google. Vui lòng thử lại.");
    } catch {
      setError("Không kết nối được dịch vụ đăng nhập.");
    } finally { setBusy(false); }
  }

  async function logout() {
    setBusy(true);
    try { await authClient.signOut(); setSession(null); setChannels([]); setState("anonymous"); }
    catch { setError("Không đăng xuất được. Vui lòng thử lại."); }
    finally { setBusy(false); }
  }

  return (
    <main className="admin-shell">
      <header className="admin-topbar">
        <div className="admin-brand"><span className="admin-brand-mark">F</span>
          <span><strong>Futurebook</strong><small>MIỀN NAM · QUẢN TRỊ</small></span>
        </div>
        <div className="admin-topright"><span className="admin-env">MÔI TRƯỜNG THỬ NGHIỆM</span>{name && state !== "anonymous" && <span className="admin-user">{name}</span>}</div>
      </header>
      <div className="admin-page">
        <aside className="admin-side" aria-label="Điều hướng quản trị">
          <div className="admin-side-title">TỔNG QUAN</div>
          <div className="admin-menu current">▦ <span>Bảng điều khiển</span></div>
          <div className="admin-side-title">QUẢN LÝ</div>
          <div className="admin-menu locked">▤ <span>Sản phẩm · sắp triển khai</span></div>
          <div className="admin-menu locked">▧ <span>Hình ảnh · sắp triển khai</span></div>
          <div className="admin-menu locked">◫ <span>Banner · sắp triển khai</span></div>
          <div className="admin-menu locked">⚙ <span>Cấu hình · sắp triển khai</span></div>
          <div className="admin-side-bottom">Truy cập phải được cấp quyền. Không tự động tạo tài khoản Admin.</div>
        </aside>
        <section className="admin-content" aria-live="polite">
          <div className="admin-intro"><p>HỆ THỐNG NỘI BỘ</p><h1>Quản trị Futurebook Miền Nam</h1>
            <span>Quản lý quyền truy cập và các kênh xuất bản từ một hệ thống.</span></div>
          {state === "checking" && <div className="admin-panel admin-center" role="status"><div className="admin-spinner" />Đang kiểm tra đăng nhập và quyền truy cập…</div>}
          {state === "anonymous" && <div className="admin-panel admin-login">
            <div className="admin-login-art">F</div>
            <div className="admin-login-body"><div className="admin-kicker">CHỈ DÀNH CHO NHÂN SỰ ĐƯỢC DUYỆT</div>
              <h2>Đăng nhập vào Admin</h2>
              <p>Sử dụng tài khoản Google của anh. Đăng nhập thành công chưa đồng nghĩa được cấp quyền quản trị.</p>
              <button disabled={busy} type="button" onClick={() => void login()} className="admin-google">
                <span className="google-symbol" aria-hidden="true">G</span>{busy ? "Đang chuyển hướng…" : "Tiếp tục với Google"}
              </button>
              {error && <p className="admin-error" role="alert">{error}</p>}
            </div>
          </div>}
          {state === "forbidden" && <div className="admin-panel admin-notice">
            <span className="admin-notice-icon">!</span><h2>Tài khoản chưa được cấp quyền</h2>
            <p>Google đã đăng nhập, nhưng tài khoản này chưa được phê duyệt trên hệ thống Futurebook. Không có quyền xem dữ liệu quản trị.</p>
            <button type="button" className="admin-secondary" onClick={() => void logout()} disabled={busy}>Đăng xuất</button>
          </div>}
          {state === "unavailable" && <div className="admin-panel admin-notice">
            <span className="admin-notice-icon">i</span><h2>Chưa kết nối được hệ thống thử nghiệm</h2>
            <p>Chưa thể xác minh phiên và quyền truy cập. Không hiển thị dữ liệu mẫu như dữ liệu thật.</p>
            <button type="button" className="admin-secondary" onClick={() => void refresh()}>Thử kiểm tra lại</button>
          </div>}
          {state === "authorised" && session && <>
            <div className="admin-stat-grid">
              <article className="admin-stat"><span>Trạng thái truy cập</span><strong>Đã xác thực</strong><small>Quyền kiểm tra trực tiếp từ backend</small></article>
              <article className="admin-stat"><span>Vai trò được duyệt</span><strong>{session.role.toUpperCase()}</strong><small>Không lấy quyền từ trình duyệt</small></article>
              <article className="admin-stat"><span>Kênh được xem</span><strong>{session.channels.length}</strong><small>Phân quyền theo kênh</small></article>
            </div>
            <div className="admin-panel admin-detail">
              <div className="admin-panel-head"><h2>Kênh kinh doanh</h2><span>Chỉ đọc · ADM-01</span></div>
              {channels.length ? <div className="admin-channels">{channels.map(channel => (
                <div className="admin-channel" key={channel.code}><div><strong>{channel.label}</strong><small>{channel.code}</small></div>
                  <span className={session.channels.includes(channel.code) || session.role === "admin" ? "admin-yes" : "admin-no"}>
                    {session.channels.includes(channel.code) || session.role === "admin" ? "Có quyền xem" : "Không có quyền"}
                  </span></div>
              ))}</div> : <p>Không có kênh nào được cấp quyền.</p>}
              <p className="admin-hint">Quản lý sản phẩm, hình ảnh và xuất bản sẽ được mở ở giai đoạn catalogue. Không có dữ liệu hoặc chức năng giả.</p>
              <button type="button" className="admin-secondary" onClick={() => void logout()} disabled={busy}>Đăng xuất</button>
            </div>
          </>}
          <div className="admin-footer">Futurebook Miền Nam · Bản kiểm tra đăng nhập và phân quyền · Không phải trang quản trị sản phẩm hoàn chỉnh.</div>
        </section>
      </div>
    </main>
  );
}
