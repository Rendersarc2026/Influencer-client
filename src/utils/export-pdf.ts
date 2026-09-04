import { formatCellValueForExport, type ExportToExcelOptions } from './export-excel';
import {
  buildCampaignReportModel,
  buildBrandCampaignReportModel,
  type CampaignReportModel,
  type ReportTable,
  type CampaignReportExportInput,
  type BrandCampaignReportExportInput,
} from './campaign-report-model';

/** Brand palette, duplicated as RGB triples because jsPDF takes no hex tokens. */
const INK: [number, number, number] = [16, 17, 20];
const MUTED: [number, number, number] = [138, 144, 153];
const ACCENT: [number, number, number] = [47, 128, 237];
const HEAD_BG: [number, number, number] = [244, 246, 249];
const LINE: [number, number, number] = [226, 231, 238];

const MARGIN = 32;

/**
 * jsPDF ships Helvetica only, which has no glyph for `₹` — it would render as a
 * hollow box. Report labels carry the symbol, so it is spelled out instead of
 * silently dropped.
 */
function asciiSafe(value: string | number): string {
  return String(value)
    .replace(/₹(?=\d)/g, 'Rs. ')
    .replace(/₹/g, 'Rs.')
    .replace(/—/g, '-')
    .replace(/·/g, '-');
}

/**
 * Body cells only: a spreadsheet can format 2600000 for the reader, a printed
 * page cannot, so grouped digits are baked in here.
 */
function formatCell(value: string | number): string {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value.toLocaleString('en-IN');
  }
  return asciiSafe(value);
}

type Doc = import('jspdf').jsPDF;
type AutoTable = typeof import('jspdf-autotable').default;

/** Where the last autoTable finished, so the next block can stack under it. */
function lastY(doc: Doc, fallback: number): number {
  const y = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY;
  return y ? y + 22 : fallback;
}

function drawHeading(doc: Doc, text: string, y: number): number {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...INK);
  doc.text(asciiSafe(text), MARGIN, y);
  doc.setDrawColor(...LINE);
  doc.setLineWidth(0.75);
  doc.line(MARGIN, y + 4, doc.internal.pageSize.getWidth() - MARGIN, y + 4);
  return y + 14;
}

/** Slices the wide creator table down to one page-sized group of columns. */
function sliceTable(table: ReportTable, columns: number[]): ReportTable {
  return {
    title: table.title,
    headers: columns.map((i) => table.headers[i]),
    rows: table.rows.map((row) => columns.map((i) => row[i])),
  };
}

function renderTable(
  doc: Doc,
  autoTable: AutoTable,
  table: ReportTable,
  startY: number,
  fontSize: number,
): void {
  // A URL is one unbreakable word, so left to itself autoTable asks for a
  // column wider than the page. Capping it makes the link wrap instead.
  const columnStyles: Record<number, { cellWidth: number }> = {};
  table.headers.forEach((header, index) => {
    if (/URL/i.test(header)) columnStyles[index] = { cellWidth: 140 };
  });

  autoTable(doc, {
    startY,
    head: [table.headers.map(asciiSafe)],
    body: table.rows.map((row) => row.map(formatCell)),
    columnStyles,
    margin: { left: MARGIN, right: MARGIN, top: MARGIN + 24, bottom: MARGIN },
    styles: {
      font: 'helvetica',
      fontSize,
      cellPadding: 2.5,
      textColor: INK,
      lineColor: LINE,
      lineWidth: 0.5,
      overflow: 'linebreak',
    },
    headStyles: {
      fillColor: HEAD_BG,
      textColor: INK,
      fontStyle: 'bold',
      fontSize,
    },
    alternateRowStyles: { fillColor: [250, 251, 253] },
  });
}

/**
 * jsPDF and its autotable plugin are pulled in on demand, the way `xlsx`
 * already is, so a page that never exports never pays for them.
 */
async function loadPdfKit(): Promise<[typeof import('jspdf'), AutoTable]> {
  const [jspdf, autoTableModule] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);

  // jspdf-autotable ships a CommonJS build, so which level of `default` holds
  // the function depends on how the bundler wrapped it. Both shapes appear in
  // practice — unwrap until a callable turns up.
  const autoTableExport: unknown = autoTableModule.default ?? autoTableModule;
  const autoTable = (
    typeof autoTableExport === 'function'
      ? autoTableExport
      : (autoTableExport as { default: unknown }).default
  ) as AutoTable;

  return [jspdf, autoTable];
}

/** Footer on every page, written last so the page total is known. */
function stampPageNumbers(doc: Doc, caption: string | number, pageWidth: number): void {
  const pageCount = doc.getNumberOfPages();
  const footerY = doc.internal.pageSize.getHeight() - 16;
  for (let page = 1; page <= pageCount; page++) {
    doc.setPage(page);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text(`Page ${page} of ${pageCount}`, pageWidth - MARGIN, footerY, { align: 'right' });
    doc.setTextColor(...ACCENT);
    doc.text(asciiSafe(caption), MARGIN, footerY);
  }
}

/**
 * Renders a built report model as a landscape A4 PDF.
 *
 * The creator table carries close to thirty columns — a spreadsheet scrolls
 * sideways forever, a page does not — so `pdfGroups` deals those columns out
 * across a few stacked tables, each keyed by Sr No and name, rather than
 * shrinking every column past reading size.
 */
async function exportReportModelToPdf(model: CampaignReportModel): Promise<void> {
  const [{ jsPDF }, autoTable] = await loadPdfKit();

  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();

  // Title block
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(...INK);
  doc.text(asciiSafe(model.title), MARGIN, MARGIN + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  const campaignName = model.meta.find(([label]) => label === 'Campaign Name')?.[1] ?? '';
  doc.text(asciiSafe(campaignName), MARGIN, MARGIN + 24);

  let y = MARGIN + 44;

  y = drawHeading(doc, 'Campaign Details', y);
  autoTable(doc, {
    startY: y,
    body: model.meta.map(([label, value]) => [asciiSafe(label), formatCell(value)]),
    margin: { left: MARGIN, right: MARGIN, bottom: MARGIN },
    theme: 'plain',
    tableWidth: 'wrap',
    styles: { font: 'helvetica', fontSize: 9, cellPadding: 3, textColor: INK },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 160, textColor: MUTED },
      1: { cellWidth: 260 },
    },
  });
  y = lastY(doc, y);

  // Summary sections sit side by side across the landscape page when they fit.
  for (const section of model.sections) {
    y = drawHeading(doc, section.heading, y);
    autoTable(doc, {
      startY: y,
      body: section.rows.map(([label, value]) => [asciiSafe(label), formatCell(value)]),
      margin: { left: MARGIN, right: MARGIN, top: MARGIN + 24, bottom: MARGIN },
      theme: 'plain',
      tableWidth: 'wrap',
      styles: { font: 'helvetica', fontSize: 9, cellPadding: 3, textColor: INK },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 220, textColor: MUTED },
        1: { cellWidth: 160 },
      },
    });
    y = lastY(doc, y);
  }

  // Each column group starts its own page: the roster is the body of the
  // report and reads far better whole than wrapped around a section above it.
  for (const group of model.pdfGroups) {
    const slice = sliceTable(model.mainTable, group.columns);
    if (slice.rows.length === 0) continue;
    doc.addPage();
    const headingY = drawHeading(doc, `${model.mainTable.title} — ${group.title}`, MARGIN + 8);
    renderTable(doc, autoTable, slice, headingY, group.columns.length > 12 ? 6.5 : 8);
  }

  if (model.postTable) {
    doc.addPage();
    const headingY = drawHeading(doc, model.postTable.title, MARGIN + 8);
    renderTable(doc, autoTable, model.postTable, headingY, 7.5);
  }

  stampPageNumbers(doc, campaignName, pageWidth);

  const dateStamp = new Date().toISOString().split('T')[0];
  doc.save(`${model.filenameBase}_${dateStamp}.pdf`);
}

/**
 * Generates and downloads the agency's Post-Evaluation Campaign Performance
 * Report as a PDF — the same model the Excel workbook is written from.
 */
export async function exportCampaignPerformanceReportPdf(
  input: CampaignReportExportInput,
): Promise<void> {
  await exportReportModelToPdf(buildCampaignReportModel(input));
}

/**
 * The brand's copy of the performance report as a PDF. Built from the brand
 * model, which carries no influencer commercial and no agency margin.
 */
export async function exportBrandCampaignPerformanceReportPdf(
  input: BrandCampaignReportExportInput,
): Promise<void> {
  await exportReportModelToPdf(buildBrandCampaignReportModel(input));
}

/**
 * The list-page counterpart of `exportTableToExcel`: the same column config and
 * rows, rendered as a paginated PDF table. Landscape once a table is wide
 * enough that portrait would squeeze the columns.
 */
export async function exportTableToPdf<T extends Record<string, unknown>>({
  filename,
  sheetName = 'Data',
  columns,
  rows,
}: ExportToExcelOptions<T>): Promise<void> {
  // Interactive columns carry no value on a page, same as in the workbook.
  const exportableColumns = columns.filter(
    (col) => col.type !== 'actions' && col.type !== 'star' && col.header,
  );

  if (exportableColumns.length === 0) {
    throw new Error('No exportable columns found');
  }

  const [{ jsPDF }, autoTable] = await loadPdfKit();

  const doc = new jsPDF({
    orientation: exportableColumns.length > 6 ? 'landscape' : 'portrait',
    unit: 'pt',
    format: 'a4',
  });
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...INK);
  doc.text(asciiSafe(sheetName), MARGIN, MARGIN + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text(
    `${rows.length} ${rows.length === 1 ? 'record' : 'records'} - generated ${new Date().toLocaleDateString('en-IN')}`,
    MARGIN,
    MARGIN + 24,
  );

  const table: ReportTable = {
    title: sheetName,
    headers: exportableColumns.map((col) => col.header),
    rows: rows.map((row, rowIndex) =>
      exportableColumns.map((col) => {
        const value = formatCellValueForExport(row, col, rowIndex);
        // `formatCellValueForExport` escapes leading `=`, `+`, `-` and `@` with
        // a quote so a spreadsheet cannot execute the cell. Page text runs
        // nothing, so the escape is dropped rather than printed.
        if (typeof value === 'string' && value.startsWith("'")) return value.slice(1);
        return typeof value === 'boolean' ? String(value) : value;
      }),
    ),
  };

  renderTable(
    doc,
    autoTable,
    table,
    MARGIN + 44,
    exportableColumns.length > 12 ? 6.5 : exportableColumns.length > 8 ? 7.5 : 8.5,
  );

  stampPageNumbers(doc, sheetName, pageWidth);

  const dateStamp = new Date().toISOString().split('T')[0];
  const cleanFilename = filename.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
  doc.save(`${cleanFilename}_${dateStamp}.pdf`);
}
