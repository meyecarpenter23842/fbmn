/** Giao diện phác thảo: không phải catalogue hoặc danh sách bán chạy được xác minh. */
export const categories = [
  { title: "Tập học sinh", note: "B5 – A4", kind: "rose" },
  { title: "Tập sinh viên", note: "Ghi chép trên giảng đường", kind: "sky" },
  { title: "Sổ ghi chép", note: "Nhiều phong cách ghi chú", kind: "kraft" },
  { title: "Văn phòng phẩm", note: "Dụng cụ học tập và làm việc", kind: "stationery" },
] as const;

export const previewProducts = [
  { title: "Mẫu trưng bày 01", group: "Tập học sinh", cover: "kraft" },
  { title: "Mẫu trưng bày 02", group: "Tập vở", cover: "dark" },
  { title: "Mẫu trưng bày 03", group: "Tập sinh viên", cover: "rose" },
  { title: "Mẫu trưng bày 04", group: "Sổ tay", cover: "sky" },
  { title: "Mẫu trưng bày 05", group: "Bìa tập", cover: "lime" },
] as const;
