import { StatusCategory, getStatusLabel, getDeliverableStatus } from './status-label';

export interface ExcelColumnConfig<T = Record<string, unknown>> {
  id: string;
  header: string;
  type?: 'text' | 'entity' | 'money' | 'delta' | 'status' | 'star' | 'actions' | 'custom' | 'index';
  accessor?: keyof T | ((row: T) => unknown);
  subAccessor?: keyof T | ((row: T) => unknown);
  statusCategory?: StatusCategory;
  width?: number;
}

export interface ExportToExcelOptions<T = Record<string, unknown>> {
  filename: string;
  sheetName?: string;
  columns: Array<ExcelColumnConfig<T>>;
  rows: Array<T>;
}

/**
 * Extracts a clean display/export value from a row based on column configuration.
 */
export function formatCellValueForExport<T extends Record<string, unknown>>(
  row: T,
  col: ExcelColumnConfig<T>,
  rowIndex?: number,
): string | number | boolean {
  let value: unknown;
  if (typeof col.accessor === 'function') {
    value = (col.accessor as (row: T) => unknown)(row);
  } else if (col.accessor) {
    value = row[col.accessor];
  } else {
    value = row[col.id as keyof T];
  }

  // Serial number fallback
  if (
    (col.id === 'srNo' ||
      col.id === 'index' ||
      col.id === 'sNo' ||
      col.id === '#' ||
      col.id === 'rowNumber' ||
      col.type === 'index') &&
    (value === undefined || value === null)
  ) {
    return rowIndex !== undefined ? rowIndex + 1 : 1;
  }

  // Smart fallback for common entity ids when id doesn't directly match row key
  if (value === undefined || value === null) {
    if (col.id === 'influencer' && 'influencerName' in row) {
      value = row.influencerName;
    } else if (col.id === 'brand' && 'brandName' in row) {
      value = row.brandName;
    } else if (col.id === 'campaign' && 'campaignName' in row) {
      value = row.campaignName;
    }
  }

  let subValue: unknown = null;
  if (typeof col.subAccessor === 'function') {
    subValue = col.subAccessor(row);
  } else if (col.subAccessor) {
    subValue = row[col.subAccessor];
  }

  if (
    col.id === 'deliverableStatus' ||
    (col.id === 'status' && !col.statusCategory && typeof value !== 'number')
  ) {
    if (typeof value === 'string' && value.length > 0) return value;
    return getDeliverableStatus(row as {
      rateStatus?: number | null;
      brandStatus?: number | null;
      hasMetrics?: boolean;
      hasLiveLink?: boolean;
      campaignStatus?: number | string | null;
    });
  }

  if (col.type === 'status' || col.id.toLowerCase().endsWith('status')) {
    if (col.statusCategory && typeof value === 'number') {
      return getStatusLabel(col.statusCategory, value);
    }
    if (col.id === 'rateStatus' && typeof value === 'number') {
      return getStatusLabel('RATE_STATUS', value);
    }
    if (col.id === 'brandStatus' && typeof value === 'number') {
      return getStatusLabel('BRAND_STATUS', value);
    }
    if (col.id === 'paymentStatus' && typeof value === 'number') {
      return getStatusLabel('PAYMENT_STATUS', value);
    }
    if ((col.id === 'campaignStatus' || col.id === 'status') && typeof value === 'number') {
      return getStatusLabel('CAMPAIGN_STATUS', value);
    }
    if (typeof value === 'boolean') {
      return value ? 'Active' : 'Inactive';
    }
    if (value === null || value === undefined) return '—';
    return String(value);
  }

  if (col.type === 'money') {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const num = parseFloat(value.replace(/[^0-9.-]+/g, ''));
      if (!isNaN(num)) return num;
      return value;
    }
    return value === null || value === undefined ? 0 : String(value);
  }

  if (col.type === 'delta') {
    if (typeof value === 'number') return `${value > 0 ? '+' : ''}${value}%`;
    return value === null || value === undefined ? '—' : String(value);
  }

  if (col.type === 'entity') {
    const mainStr = value === null || value === undefined ? '' : String(value);
    const subStr = subValue === null || subValue === undefined ? '' : String(subValue);
    if (mainStr && subStr) {
      return `${mainStr} (${subStr})`;
    }
    return mainStr || subStr || '—';
  }

  if (value instanceof Date) {
    return value.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  if (value === null || value === undefined) {
    return subValue !== null && subValue !== undefined ? String(subValue) : '';
  }

  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  return value as string | number | boolean;
}

/**
 * Dynamically loads SheetJS and exports table data to an Excel (.xlsx) file.
 */
export async function exportTableToExcel<T extends Record<string, unknown>>({
  filename,
  sheetName = 'Data',
  columns,
  rows,
}: ExportToExcelOptions<T>): Promise<void> {
  // Dynamically import xlsx on demand (keeps initial bundle lightweight)
  const XLSX = await import('xlsx');

  // Filter out interactive/action columns
  const exportableColumns = columns.filter(
    (col) => col.type !== 'actions' && col.type !== 'star' && col.header,
  );

  if (exportableColumns.length === 0) {
    throw new Error('No exportable columns found');
  }

  // Header row
  const headers = exportableColumns.map((c) => c.header);

  // Data rows
  const dataRows = rows.map((row, rowIndex) =>
    exportableColumns.map((col) => formatCellValueForExport(row, col, rowIndex)),
  );

  const aoa = [headers, ...dataRows];
  const ws = XLSX.utils.aoa_to_sheet(aoa);

  // Auto-fit column widths based on maximum content length
  const colWidths = exportableColumns.map((col, colIdx) => {
    let maxLength = col.header.length;
    for (let r = 0; r < dataRows.length; r++) {
      const cell = dataRows[r][colIdx];
      if (cell !== null && cell !== undefined) {
        const cellLength = String(cell).length;
        if (cellLength > maxLength) {
          maxLength = cellLength;
        }
      }
    }
    return { wch: Math.min(Math.max(maxLength + 3, 12), 45) };
  });

  ws['!cols'] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31));

  const dateStamp = new Date().toISOString().split('T')[0];
  const cleanFilename = filename.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
  const fullFilename = `${cleanFilename}_${dateStamp}.xlsx`;

  XLSX.writeFile(wb, fullFilename);
}

export interface CampaignReportExportInput {
  campaign: {
    id: string;
    name: string;
    description?: string | null;
    brandName?: string | null;
    status?: number | string;
    startDate?: string | Date | null;
    endDate?: string | Date | null;
  };
  mappers: Array<{
    id: string;
    influencerName?: string;
    instagram?: string | null;
    youtube?: string | null;
    category?: string | null;
    followers?: number | null;
    deliverables?: string | null;
    reachFromRegion?: string | null;
    influencerRate?: number | null;
    margin?: number | null;
    clientRate?: number | null;
    rateStatus?: number;
    brandStatus?: number;
  }>;
  metricsByMapperId?: Record<
    string,
    Array<{
      reach: number;
      impressions?: number | null;
      engagements: number;
      erPercent: number;
      totalViews?: number | null;
      likes?: number | null;
      comments?: number | null;
      shares?: number | null;
      saves?: number | null;
      watchTime?: string | null;
      skipRate?: number | null;
      liveLink?: string | null;
      postEvalCpv?: number | null;
      posts?: Array<{
        position: number;
        postUrl: string;
        likes?: number | null;
        comments?: number | null;
        shares?: number | null;
        saves?: number | null;
      }>;
      recordedFor: string | Date;
    }>
  >;
}

/**
 * Generates and downloads a multi-sheet Post-Evaluation Campaign Performance Report in Excel.
 */
export async function exportCampaignPerformanceReport(
  input: CampaignReportExportInput,
): Promise<void> {
  const XLSX = await import('xlsx');
  const { campaign, mappers, metricsByMapperId = {} } = input;

  // 1. Calculate Aggregates
  let totalInfluencerPayout = 0;
  let totalAgencyMargin = 0;
  let totalClientSpend = 0;
  let totalReach = 0;
  let totalEngagements = 0;
  let totalViews = 0;
  let totalImpressions = 0;
  let totalLikes = 0;
  let totalComments = 0;
  let totalShares = 0;
  let totalSaves = 0;

  // Every recorded post across every influencer, for the post-level sheet.
  const postRows: Array<Array<string | number>> = [];

  const influencerRows = mappers.map((mapper, index) => {
    const infRate = mapper.influencerRate ?? 0;
    const margin = mapper.margin ?? 0;
    const clientRate = mapper.clientRate ?? 0;

    totalInfluencerPayout += infRate;
    totalAgencyMargin += margin;
    totalClientSpend += clientRate;

    const metricsList = metricsByMapperId[mapper.id] || [];
    // Take the latest metric entry or sum if multiple
    const latestMetric = metricsList.length > 0 ? metricsList[0] : null;

    const mapperReach = latestMetric ? latestMetric.reach : 0;
    const mapperEngagements = latestMetric ? latestMetric.engagements : 0;
    const mapperViews = latestMetric?.totalViews ?? 0;
    const mapperImpressions = latestMetric?.impressions ?? 0;
    const mapperLikes = latestMetric?.likes ?? 0;
    const mapperComments = latestMetric?.comments ?? 0;
    const mapperShares = latestMetric?.shares ?? 0;
    const mapperSaves = latestMetric?.saves ?? 0;
    const mapperEr =
      latestMetric?.erPercent ??
      (mapperReach > 0 ? Number(((mapperEngagements / mapperReach) * 100).toFixed(2)) : 0);
    const mapperCpv =
      latestMetric?.postEvalCpv ??
      (clientRate > 0 && mapperViews > 0 ? Number((clientRate / mapperViews).toFixed(2)) : null);

    totalReach += mapperReach;
    totalEngagements += mapperEngagements;
    totalViews += mapperViews;
    totalImpressions += mapperImpressions;
    totalLikes += mapperLikes;
    totalComments += mapperComments;
    totalShares += mapperShares;
    totalSaves += mapperSaves;

    const rateStatusLabel =
      mapper.rateStatus !== undefined ? getStatusLabel('RATE_STATUS', mapper.rateStatus) : '—';
    const brandStatusLabel =
      mapper.brandStatus !== undefined ? getStatusLabel('BRAND_STATUS', mapper.brandStatus) : '—';

    const handle = mapper.instagram
      ? `@${mapper.instagram.replace(/^https?:\/\/(www\.)?instagram\.com\//, '').replace(/\/$/, '')}`
      : mapper.youtube || '—';

    const recordedDate = latestMetric
      ? new Date(latestMetric.recordedFor).toLocaleDateString('en-IN')
      : '—';

    for (const post of latestMetric?.posts ?? []) {
      const postEngagements =
        (post.likes ?? 0) + (post.comments ?? 0) + (post.shares ?? 0) + (post.saves ?? 0);
      postRows.push([
        mapper.influencerName || '—',
        post.position,
        post.postUrl,
        post.likes ?? '—',
        post.comments ?? '—',
        post.shares ?? '—',
        post.saves ?? '—',
        postEngagements,
        recordedDate,
      ]);
    }

    const deliverableStatus = getDeliverableStatus({
      rateStatus: mapper.rateStatus,
      brandStatus: mapper.brandStatus,
      hasMetrics: Boolean(
        latestMetric && (latestMetric.reach > 0 || (latestMetric.totalViews ?? 0) > 0),
      ),
      hasLiveLink: Boolean(
        latestMetric?.liveLink || (latestMetric?.posts && latestMetric.posts.length > 0),
      ),
      campaignStatus: campaign.status,
    });

    return [
      index + 1,
      mapper.influencerName || '—',
      handle,
      mapper.category || 'General',
      mapper.followers ?? '—',
      mapper.deliverables || 'Pending',
      deliverableStatus,
      infRate > 0 ? infRate : '—',
      margin > 0 ? margin : '—',
      clientRate > 0 ? clientRate : '—',
      rateStatusLabel,
      brandStatusLabel,
      mapperReach > 0 ? mapperReach : '—',
      mapperEngagements > 0 ? mapperEngagements : '—',
      mapperEr > 0 ? `${mapperEr}%` : '—',
      mapperViews > 0 ? mapperViews : '—',
      mapperCpv !== null ? mapperCpv : '—',
      mapperLikes > 0 ? mapperLikes : '—',
      mapperComments > 0 ? mapperComments : '—',
      mapperShares > 0 ? mapperShares : '—',
      mapperSaves > 0 ? mapperSaves : '—',
      latestMetric?.posts?.length || '—',
      mapperImpressions > 0 ? mapperImpressions : '—',
      latestMetric?.watchTime || '—',
      latestMetric?.skipRate !== undefined && latestMetric?.skipRate !== null
        ? `${latestMetric.skipRate}%`
        : '—',
      latestMetric?.liveLink || '—',
      recordedDate,
    ];
  });

  const overallErPercent =
    totalReach > 0 ? Number(((totalEngagements / totalReach) * 100).toFixed(2)) : 0;
  const overallCpv =
    totalClientSpend > 0 && totalViews > 0
      ? Number((totalClientSpend / totalViews).toFixed(2))
      : null;
  const marginPercent =
    totalClientSpend > 0 ? Number(((totalAgencyMargin / totalClientSpend) * 100).toFixed(1)) : 0;

  // 2. Build Sheet 1: Campaign Summary
  const summaryAoa = [
    ['CAMPAIGN PERFORMANCE & POST-EVALUATION REPORT'],
    [],
    ['Campaign Name', campaign.name],
    ['Client Brand', campaign.brandName || '—'],
    [
      'Campaign Status',
      campaign.status ? getStatusLabel('CAMPAIGN_STATUS', Number(campaign.status)) : '—',
    ],
    [
      'Campaign Timeline',
      `${campaign.startDate ? new Date(campaign.startDate).toLocaleDateString('en-IN') : 'TBD'} — ${campaign.endDate ? new Date(campaign.endDate).toLocaleDateString('en-IN') : 'TBD'}`,
    ],
    ['Report Generated Date', new Date().toLocaleDateString('en-IN')],
    [],
    ['EXECUTIVE PERFORMANCE METRICS', ''],
    ['Total Assigned Influencers', mappers.length],
    ['Total Client Billing (₹)', totalClientSpend],
    ['Total Influencer Payout (₹)', totalInfluencerPayout],
    ['Total Agency Margin (₹)', totalAgencyMargin],
    ['Agency Margin %', `${marginPercent}%`],
    [],
    ['POST-EVALUATION DELIVERABLE METRICS', ''],
    ['Total Post-Eval Reach (Unique)', totalReach],
    ['Total Post-Eval Engagements', totalEngagements],
    ['Overall Campaign ER %', `${overallErPercent}%`],
    ['Total Post-Eval Views', totalViews],
    ['Average Cost Per View (CPV)', overallCpv !== null ? `₹${overallCpv}` : '—'],
    ['Total Impressions', totalImpressions > 0 ? totalImpressions : '—'],
    ['Total Likes', totalLikes > 0 ? totalLikes : '—'],
    ['Total Comments', totalComments > 0 ? totalComments : '—'],
    ['Total Shares', totalShares > 0 ? totalShares : '—'],
    ['Total Saves', totalSaves > 0 ? totalSaves : '—'],
    ['Total Published Posts', postRows.length > 0 ? postRows.length : '—'],
  ];

  // 3. Build Sheet 2: Influencer Post-Eval Metrics
  const influencerHeaders = [
    'Sr No',
    'Influencer Name',
    'Social Handle',
    'Category',
    'Followers',
    'Deliverables',
    'Status',
    'Influencer Commercial (₹)',
    'Agency Margin (₹)',
    'Client Rate (₹)',
    'Rate Status',
    'Brand Status',
    'Post-Eval Reach (Unique)',
    'Post-Eval Engagements',
    'Post-Eval ER %',
    'Total Views',
    'Post-Eval CPV (₹)',
    'Likes',
    'Comments',
    'Shares',
    'Saves',
    'Published Posts',
    'Impressions',
    'Watch Time',
    'Skip Rate %',
    'Live Deliverable URLs',
    'Recorded Date',
  ];

  const influencerAoa = [influencerHeaders, ...influencerRows];

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryAoa);
  wsSummary['!cols'] = [{ wch: 32 }, { wch: 36 }];

  const wsInfluencers = XLSX.utils.aoa_to_sheet(influencerAoa);
  wsInfluencers['!cols'] = [
    { wch: 8 }, // Sr No
    { wch: 22 }, // Influencer Name
    { wch: 20 }, // Social Handle
    { wch: 18 }, // Category
    { wch: 14 }, // Followers
    { wch: 26 }, // Deliverables
    { wch: 18 }, // Status
    { wch: 24 }, // Inf Rate
    { wch: 18 }, // Margin
    { wch: 18 }, // Client Rate
    { wch: 16 }, // Rate Status
    { wch: 16 }, // Brand Status
    { wch: 24 }, // Reach
    { wch: 22 }, // Engagements
    { wch: 16 }, // ER %
    { wch: 16 }, // Views
    { wch: 18 }, // CPV
    { wch: 14 }, // Likes
    { wch: 14 }, // Comments
    { wch: 14 }, // Shares
    { wch: 14 }, // Saves
    { wch: 16 }, // Published Posts
    { wch: 16 }, // Impressions
    { wch: 14 }, // Watch Time
    { wch: 14 }, // Skip Rate
    { wch: 35 }, // URLs
    { wch: 16 }, // Recorded Date
  ];

  // Sheet 3: the per-post breakdown the influencer totals were summed from.
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Campaign Summary');
  XLSX.utils.book_append_sheet(wb, wsInfluencers, 'Influencer Performance');

  if (postRows.length > 0) {
    const wsPosts = XLSX.utils.aoa_to_sheet([
      [
        'Influencer Name',
        'Post #',
        'Post URL',
        'Likes',
        'Comments',
        'Shares',
        'Saves',
        'Engagements',
        'Recorded Date',
      ],
      ...postRows,
    ]);
    wsPosts['!cols'] = [
      { wch: 22 }, // Influencer Name
      { wch: 8 }, // Post #
      { wch: 45 }, // Post URL
      { wch: 14 }, // Likes
      { wch: 14 }, // Comments
      { wch: 14 }, // Shares
      { wch: 14 }, // Saves
      { wch: 16 }, // Engagements
      { wch: 16 }, // Recorded Date
    ];
    XLSX.utils.book_append_sheet(wb, wsPosts, 'Post-Level Performance');
  }

  const cleanName = campaign.name.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
  const dateStamp = new Date().toISOString().split('T')[0];
  const filename = `${cleanName}_performance_report_${dateStamp}.xlsx`;

  XLSX.writeFile(wb, filename);
}

export interface MonthlyDeliverableExportRow {
  campaignId: string;
  campaignName: string; // Which brand/campaign this row belongs to (multi-campaign combination)
  brandName?: string | null;
  influencerName?: string | null;
  instagram?: string | null;
  youtube?: string | null;
  category?: string | null;
  followers?: number | null;
  deliverables?: string | null;
  status: string; // Where the deliverable stands (Briefed / Content Shared / Content Approved / Live / Completed / ...)
  reachFromRegion?: string | null;
  clientRate?: number | null;
  agencyMargin?: number | null;
  influencerRate?: number | null;
  rateStatus?: number | null;
  brandStatus?: number | null;
  reach?: number | null;
  engagements?: number | null;
  erPercent?: number | null;
  views?: number | null;
  cpv?: number | null;
  liveLink?: string | null;
  recordedDate?: string | Date | null;
}

export interface ExportMonthlyDeliverablesOptions {
  monthLabel?: string;
  brandLabel?: string;
  rows: MonthlyDeliverableExportRow[];
}

/**
 * Generates and downloads the comprehensive Monthly Deliverables & Performance Report in Excel.
 * Combines deliverables across multiple brands/campaigns with explicit "Campaign Name" and "Status" tracking.
 */
export async function exportMonthlyDeliverablesReport({
  monthLabel,
  brandLabel,
  rows,
}: ExportMonthlyDeliverablesOptions): Promise<void> {
  const XLSX = await import('xlsx');

  let totalClientSpend = 0;
  let totalMargin = 0;
  let totalPayout = 0;
  let totalReach = 0;
  let totalEngagements = 0;
  let totalViews = 0;

  const campaignCountMap = new Set<string>();

  const dataRows = rows.map((row, index) => {
    const clientRate = row.clientRate ?? 0;
    const margin = row.agencyMargin ?? 0;
    const infRate = row.influencerRate ?? 0;
    const reach = row.reach ?? 0;
    const engagements = row.engagements ?? 0;
    const views = row.views ?? 0;

    totalClientSpend += clientRate;
    totalMargin += margin;
    totalPayout += infRate;
    totalReach += reach;
    totalEngagements += engagements;
    totalViews += views;

    if (row.campaignName) {
      campaignCountMap.add(row.campaignName);
    }

    const handle = row.instagram
      ? `@${row.instagram.replace(/^https?:\/\/(www\.)?instagram\.com\//, '').replace(/\/$/, '')}`
      : row.youtube || '—';

    const recordedDate = row.recordedDate
      ? new Date(row.recordedDate).toLocaleDateString('en-IN')
      : '—';

    return [
      index + 1,
      row.campaignName || '—', // Explicit "Campaign Name" column for combined monthly multi-campaign report
      row.brandName || '—',
      row.influencerName || '—',
      handle,
      row.category || 'General',
      row.followers ?? '—',
      row.deliverables || 'Pending',
      row.status || 'Briefed', // "Where the deliverable stands (Briefed / Content Shared / Content Approved / Live / Completed / ...)"
      row.reachFromRegion || '—',
      clientRate > 0 ? clientRate : '—',
      margin > 0 ? margin : '—',
      infRate > 0 ? infRate : '—',
      reach > 0 ? reach : '—',
      engagements > 0 ? engagements : '—',
      row.erPercent !== undefined && row.erPercent !== null && row.erPercent > 0
        ? `${row.erPercent}%`
        : '—',
      views > 0 ? views : '—',
      row.cpv !== undefined && row.cpv !== null ? `₹${row.cpv}` : '—',
      row.liveLink || '—',
      recordedDate,
    ];
  });

  const overallEr =
    totalReach > 0 ? Number(((totalEngagements / totalReach) * 100).toFixed(2)) : 0;
  const overallMarginPercent =
    totalClientSpend > 0 ? Number(((totalMargin / totalClientSpend) * 100).toFixed(1)) : 0;

  // 1. Monthly Executive Summary Sheet
  const summaryAoa = [
    ['MONTHLY CAMPAIGN DELIVERABLES & PERFORMANCE REPORT'],
    [],
    ['Report Period', monthLabel || new Date().toLocaleString('en-IN', { month: 'long', year: 'numeric' })],
    ['Brand Filter', brandLabel || 'All Brands'],
    ['Total Campaigns Covered', campaignCountMap.size],
    ['Total Assigned Deliverables', rows.length],
    ['Report Generated Date', new Date().toLocaleDateString('en-IN')],
    [],
    ['FINANCIAL CONSOLIDATION', ''],
    ['Total Client Billings (₹)', totalClientSpend],
    ['Total Agency Margin (₹)', totalMargin],
    ['Total Influencer Payout (₹)', totalPayout],
    ['Overall Agency Margin %', `${overallMarginPercent}%`],
    [],
    ['AUDIENCE REACH & PERFORMANCE AGGREGATES', ''],
    ['Total Recorded Deliverable Reach', totalReach],
    ['Total Engagements', totalEngagements],
    ['Average Engagement Rate (ER %)', `${overallEr}%`],
    ['Total Video Views', totalViews],
  ];

  // 2. Deliverables Tracker Sheet
  const trackerHeaders = [
    'Sr No',
    'Campaign Name', // Column 2: Explicitly labeled Campaign Name
    'Client Brand',
    'Influencer Name',
    'Social Handle',
    'Category',
    'Followers',
    'Deliverables',
    'Status', // Status: Briefed / Content Shared / Content Approved / Live / Completed
    'Target Region Reach',
    'Client Rate (₹)',
    'Agency Margin (₹)',
    'Influencer Commercial (₹)',
    'Post-Eval Reach',
    'Post-Eval Engagements',
    'ER %',
    'Total Views',
    'Post-Eval CPV',
    'Live Deliverable URLs',
    'Recorded Date',
  ];

  const trackerAoa = [trackerHeaders, ...dataRows];

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryAoa);
  wsSummary['!cols'] = [{ wch: 34 }, { wch: 36 }];

  const wsTracker = XLSX.utils.aoa_to_sheet(trackerAoa);
  wsTracker['!cols'] = [
    { wch: 8 }, // Sr No
    { wch: 28 }, // Campaign Name
    { wch: 22 }, // Client Brand
    { wch: 22 }, // Influencer Name
    { wch: 20 }, // Social Handle
    { wch: 18 }, // Category
    { wch: 14 }, // Followers
    { wch: 26 }, // Deliverables
    { wch: 20 }, // Status (Briefed / Content Shared / Content Approved / Live / Completed)
    { wch: 20 }, // Target Region Reach
    { wch: 18 }, // Client Rate
    { wch: 18 }, // Agency Margin
    { wch: 24 }, // Influencer Commercial
    { wch: 18 }, // Reach
    { wch: 20 }, // Engagements
    { wch: 14 }, // ER %
    { wch: 16 }, // Views
    { wch: 16 }, // CPV
    { wch: 35 }, // URLs
    { wch: 16 }, // Recorded Date
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Monthly Summary');
  XLSX.utils.book_append_sheet(wb, wsTracker, 'Deliverables Tracker');

  const dateStamp = new Date().toISOString().split('T')[0];
  const cleanBrand = brandLabel ? brandLabel.toLowerCase().replace(/[^a-z0-9_-]/g, '_') : 'all_brands';
  const filename = `monthly_deliverables_report_${cleanBrand}_${dateStamp}.xlsx`;

  XLSX.writeFile(wb, filename);
}

