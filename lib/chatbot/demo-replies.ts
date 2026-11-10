/**
 * Local, non-network demonstration adapter.
 * Future Dialogflow CX integration should call a server-side authenticated
 * gateway here (never expose Dialogflow credentials in a client bundle).
 * This file intentionally makes no external requests or AI claims.
 */
export type ChatbotReply = Readonly<{
  text: string;
  href?: "/san-pham" | "/lien-he" | "/dai-ly";
  actionLabel?: string;
}>;

export function getDemoChatbotReply(message: string): ChatbotReply {
  const normalized = message.trim().toLocaleLowerCase("vi-VN");
  if (!normalized) return { text: "Anh chọn một chủ đề hoặc nhập câu hỏi để bắt đầu nhé." };
  if (/sản phẩm|san pham|tập|vở|sổ|văn phòng phẩm|catalog/i.test(normalized)) {
    return {
      text: "Anh có thể xem các nhóm tập vở, sổ và văn phòng phẩm ở trang Sản phẩm. Liên hệ Futurebook để được tư vấn giá và tình trạng hàng.",
      href: "/san-pham", actionLabel: "Xem sản phẩm",
    };
  }
  if (/đại lý|dai ly|phân phối|npp|hợp tác/i.test(normalized)) {
    return {
      text: "Thông tin hợp tác và kênh đại lý được giới thiệu tại trang Dành cho đại lý. Liên hệ Futurebook để trao đổi báo giá sỉ và điều kiện hợp tác.",
      href: "/dai-ly", actionLabel: "Dành cho đại lý",
    };
  }
  if (/liên hệ|lien he|điện thoại|hotline|email|địa chỉ/i.test(normalized)) {
    return {
      text: "Anh có thể xem địa chỉ và email của Futurebook tại trang Liên hệ.",
      href: "/lien-he", actionLabel: "Trang liên hệ",
    };
  }
  return {
    text: "Câu hỏi này chưa có trong phần hỗ trợ nhanh. Anh có thể liên hệ Futurebook để được tư vấn trực tiếp.",
    href: "/lien-he", actionLabel: "Liên hệ Futurebook",
  };
}
