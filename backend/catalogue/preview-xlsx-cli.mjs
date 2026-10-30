#!/usr/bin/env node
// ADM-02 #19: offline local-file preview ONLY. Never logs monetary/stock values.
import { readFile, writeFile, realpath } from "node:fs/promises";
import { resolve, relative, isAbsolute, dirname, basename, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { previewXlsxImport, readXlsxSkuRows, toImportCsv } from "./xlsx-adapter.mjs";

const args = process.argv.slice(2);
if (!args.length || args.includes("--help")) {
  console.log("Usage: node backend/catalogue/preview-xlsx-cli.mjs <private-master.xlsx> [--csv-out /tmp/preview.csv] [--report-out /tmp/preview.json]");
  process.exit(args.length ? 0 : 2);
}
function option(name) {
  const index = args.indexOf(name);
  if (index < 0) return null;
  if (!args[index + 1] || args[index + 1].startsWith("--")) throw new Error("missing_output_path:" + name);
  return args[index + 1];
}
async function privateOutput(path) {
  if (!isAbsolute(path)) throw new Error("output_must_be_absolute_outside_repository");
  const target = resolve(path);
  const root = await realpath(resolve(dirname(fileURLToPath(import.meta.url)), "..", ".."));
  // Resolve the real parent to prevent symlink escape into the repository.
  const targetParent = await realpath(dirname(target));
  const destination = resolve(targetParent, basename(target));
  const rel = relative(root, destination);
  if (rel === "" || (rel !== ".." && !rel.startsWith(".." + sep) && !isAbsolute(rel)))
    throw new Error("output_inside_repository_forbidden");
  return destination;
}
async function main() {
  const file = await readFile(resolve(args[0]));
  const [result, parsed] = await Promise.all([previewXlsxImport(file), readXlsxSkuRows(file)]);
  const summary = { applied: false, source_sheet: result.source_sheet, totals: result.totals,
    counts: result.counts, warnings: "Review source anomalies; no DB/R2/public API or price/stock payload was changed." };
  console.log(JSON.stringify(summary, null, 2));
  const csv = option("--csv-out"), report = option("--report-out");
  if ((csv || report) && result.totals.error > 0) throw new Error("fix_validation_errors_before_export");
  if (csv) await writeFile(await privateOutput(csv), toImportCsv(parsed.rows), { encoding: "utf8", mode: 0o600, flag: "wx" });
  if (report) await writeFile(await privateOutput(report), JSON.stringify(result, null, 2) + "\n",
    { encoding: "utf8", mode: 0o600, flag: "wx" });
}
main().catch(err => { console.error("ADM02 dry-run failed: " + err.message); process.exitCode = 1; });
