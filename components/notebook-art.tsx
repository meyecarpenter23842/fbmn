type Cover = "rose" | "sky" | "lime" | "violet" | "kraft" | "dark";

export function NotebookArt({
  cover = "rose",
  className = "",
  title = "FUTUREBOOK",
}: { cover?: Cover; className?: string; title?: string }) {
  return (
    <div className={["notebook", "notebook--" + cover, className].filter(Boolean).join(" ")} aria-hidden="true">
      <div className="notebook__spine" />
      <div className="notebook__topline">FBMN</div>
      <div className="notebook__ornament">
        <span className="notebook__shape notebook__shape--one" />
        <span className="notebook__shape notebook__shape--two" />
        <span className="notebook__shape notebook__shape--three" />
      </div>
      <span className="notebook__title">{title}</span>
      <span className="notebook__footer">FUTUREBOOK MIỀN NAM</span>
    </div>
  );
}

export function StationeryArt() {
  return (
    <div className="stationery-art" aria-hidden="true">
      <span className="stationery-art__cup" />
      <span className="stationery-art__pen stationery-art__pen--1" />
      <span className="stationery-art__pen stationery-art__pen--2" />
      <span className="stationery-art__pen stationery-art__pen--3" />
      <span className="stationery-art__eraser" />
      <span className="stationery-art__ruler" />
    </div>
  );
}
