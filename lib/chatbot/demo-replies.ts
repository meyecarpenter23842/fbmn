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
      text: "Anh có thể xem các nhóm tập vở, sổ và văn phòng phẩm ở trang Sản phẩm. Giá và tồn kho sẽ được cập nhật khi có dữ liệu được duyệt.",
      href: "/san-pham", actionLabel: "Xem sản phẩm",
    };
  }
  if (/đại lý|dai ly|phân phối|npp|hợp tác/i.test(normalized)) {
    return {
      text: "Thông tin hợp tác và kênh đại lý được giới thiệu tại trang Dành cho đại lý. Chatbot chưa có quyền báo giá NET hoặc chính sách phân phối.",
      href: "/dai-ly", actionLabel: "Dành cho đại lý",
    };
  }
  if (/liên hệ|lien he|điện thoại|hotline|email|địa chỉ/i.test(normalized)) {
    return {
      text: "Anh có thể xem thông tin liên hệ được công bố trên website tại trang Liên hệ.",
      href: "/lien-he", actionLabel: "Trang liên hệ",
    };
  }
  return {
    text: "Đây là chatbot demo, chưa kết nối Dialogflow CX nên em chưa thể trả lời tự động câu hỏi này. Anh có thể xem danh mục sản phẩm hoặc trang liên hệ để tìm hiểu thêm.",
    href: "/lien-he", actionLabel: "Liên hệ Futurebook",
  };
}
