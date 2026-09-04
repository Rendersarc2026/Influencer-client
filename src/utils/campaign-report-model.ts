import { getStatusLabel, getDeliverableStatus } from './status-label';

/**
 * The campaign performance report as data, independent of the file it is
 * written into. Both writers — the Excel workbook and the PDF — consume this,
 * so the two downloads can never disagree about a number.
 */
export interface ReportSection {
  heading: string;
  rows: Array<[string, string | number]>;
}

export interface ReportTable {
  title: string;
  headers: string[];
  rows: Array<Array<string | number>>;
}

/**
 * A page-sized slice of the wide creator table, by column index. A spreadsheet
 * scrolls sideways forever; a PDF page does not, so the same columns are dealt
 * out across a few stacked tables instead of shrinking past readability.
 */
export interface ReportColumnGroup {
  title: string;
  columns: number[];
}

export interface CampaignReportModel {
  title: string;
  /** Campaign identity: name, brand, status, timeline, generated-on. */
  meta: Array<[string, string | number]>;
  sections: ReportSection[];
  mainTable: ReportTable;
  pdfGroups: ReportColumnGroup[];
  postTable: ReportTable | null;
  /** Filename without extension or date stamp. */
  filenameBase: string;
}

const REPORT_TITLE = 'CAMPAIGN PERFORMANCE & POST-EVALUATION REPORT';

function formatDay(value: string | Date | null | undefined): string {
  return value ? new Date(value).toLocaleDateString('en-IN') : 'TBD';
}

function socialHandle(mapper: { instagram?: string | null; youtube?: string | null }): string {
  return mapper.instagram
    ? `@${mapper.instagram.replace(/^https?:\/\/(www\.)?instagram\.com\//, '').replace(/\/$/, '')}`
    : mapper.youtube || '—';
}

function cleanFileBase(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
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

export interface BrandCampaignReportExportInput {
  campaign: CampaignReportExportInput['campaign'];
  mappers: Array<{
    id: string;
    influencerName?: string;
    instagram?: string | null;
    youtube?: string | null;
    region?: string | null;
    category?: string | null;
    followers?: number | null;
    deliverables?: string | null;
    reachFromRegion?: string | null;
    committedViews?: number | null;
    preEvalEr?: number | null;
    preEvalCpv?: number | null;
    brandFit?: string | null;
    clientRate?: number | null;
    brandStatus?: number;
  }>;
  metricsByMapperId?: CampaignReportExportInput['metricsByMapperId'];
}

const POST_TABLE_HEADERS = [
  'Post #',
  'Post URL',
  'Likes',
  'Comments',
  'Shares',
  'Saves',
  'Engagements',
  'Recorded Date',
];

/**
 * The agency's model: influencer commercials and agency margin included.
 */
export function buildCampaignReportModel(input: CampaignReportExportInput): CampaignReportModel {
  const { campaign, mappers, metricsByMapperId = {} } = input;

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

  // Every recorded post across every influencer, for the post-level table.
  const postRows: Array<Array<string | number>> = [];

  const influencerRows = mappers.map((mapper, index) => {
    const infRate = mapper.influencerRate ?? 0;
    const margin = mapper.margin ?? 0;
    const clientRate = mapper.clientRate ?? 0;

    totalInfluencerPayout += infRate;
    totalAgencyMargin += margin;
    totalClientSpend += clientRate;

    const metricsList = metricsByMapperId[mapper.id] || [];
    // Rows arrive newest first, so the head is the current post-evaluation.
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
      socialHandle(mapper),
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

  return {
    title: REPORT_TITLE,
    meta: [
      ['Campaign Name', campaign.name],
      ['Client Brand', campaign.brandName || '—'],
      [
        'Campaign Status',
        campaign.status ? getStatusLabel('CAMPAIGN_STATUS', Number(campaign.status)) : '—',
      ],
      ['Campaign Timeline', `${formatDay(campaign.startDate)} — ${formatDay(campaign.endDate)}`],
      ['Report Generated Date', new Date().toLocaleDateString('en-IN')],
    ],
    sections: [
      {
        heading: 'EXECUTIVE PERFORMANCE METRICS',
        rows: [
          ['Total Assigned Influencers', mappers.length],
          ['Total Client Billing (₹)', totalClientSpend],
          ['Total Influencer Payout (₹)', totalInfluencerPayout],
          ['Total Agency Margin (₹)', totalAgencyMargin],
          ['Agency Margin %', `${marginPercent}%`],
        ],
      },
      {
        heading: 'POST-EVALUATION DELIVERABLE METRICS',
        rows: [
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
        ],
      },
    ],
    mainTable: {
      title: 'Influencer Performance',
      headers: [
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
        'Agency Status',
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
      ],
      rows: influencerRows,
    },
    pdfGroups: [
      {
        title: 'Roster, Deliverables & Commercials',
        columns: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
      },
      {
        title: 'Post-Evaluation Metrics',
        columns: [0, 1, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 26],
      },
      { title: 'Live Deliverable URLs', columns: [0, 1, 25] },
    ],
    postTable:
      postRows.length > 0
        ? {
            title: 'Post-Level Performance',
            headers: ['Influencer Name', ...POST_TABLE_HEADERS],
            rows: postRows,
          }
        : null,
    filenameBase: `${cleanFileBase(campaign.name)}_performance_report`,
  };
}

/**
 * The brand's model.
 *
 * Deliberately a separate builder rather than a flag on the agency one: the
 * agency report is built around influencer commercials and agency margin, and
 * the brand must never see either. A shared builder with a `role` switch is one
 * wrong condition away from writing a margin column into a file the brand
 * downloads, so the two never share a row shape.
 */
export function buildBrandCampaignReportModel(
  input: BrandCampaignReportExportInput,
): CampaignReportModel {
  const { campaign, mappers, metricsByMapperId = {} } = input;

  let totalCommercials = 0;
  let totalCommittedViews = 0;
  let preEvalErSum = 0;
  let preEvalErCount = 0;
  let totalReach = 0;
  let totalEngagements = 0;
  let totalViews = 0;
  let totalImpressions = 0;
  let totalLikes = 0;
  let totalComments = 0;
  let totalShares = 0;
  let totalSaves = 0;

  // Every recorded post across every creator, for the post-level table.
  const postRows: Array<Array<string | number>> = [];

  const influencerRows = mappers.map((mapper, index) => {
    const clientRate = mapper.clientRate ?? 0;
    const committedViews = mapper.committedViews ?? 0;

    totalCommercials += clientRate;
    totalCommittedViews += committedViews;
    if (mapper.preEvalEr) {
      preEvalErSum += mapper.preEvalEr;
      preEvalErCount += 1;
    }

    const metricsList = metricsByMapperId[mapper.id] || [];
    // Rows arrive newest first, so the head is the current post-evaluation.
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

    const brandStatusLabel =
      mapper.brandStatus !== undefined ? getStatusLabel('BRAND_STATUS', mapper.brandStatus) : '—';

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
      socialHandle(mapper),
      mapper.region || 'India',
      mapper.category || 'General',
      mapper.followers ?? '—',
      mapper.deliverables || 'Pending',
      deliverableStatus,
      brandStatusLabel,
      mapper.reachFromRegion || '—',
      committedViews > 0 ? committedViews : '—',
      mapper.preEvalEr ? `${mapper.preEvalEr}%` : '—',
      mapper.preEvalCpv ?? '—',
      clientRate > 0 ? clientRate : '—',
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
    totalCommercials > 0 && totalViews > 0
      ? Number((totalCommercials / totalViews).toFixed(2))
      : null;
  const avgPreEvalEr = preEvalErCount > 0 ? Number((preEvalErSum / preEvalErCount).toFixed(2)) : 0;
  const avgPreEvalCpv =
    totalCommercials > 0 && totalCommittedViews > 0
      ? Number((totalCommercials / totalCommittedViews).toFixed(2))
      : null;
  const viewsDelivery =
    totalCommittedViews > 0 ? Number(((totalViews / totalCommittedViews) * 100).toFixed(1)) : null;

  return {
    title: REPORT_TITLE,
    meta: [
      ['Campaign Name', campaign.name],
      ['Brand', campaign.brandName || '—'],
      [
        'Campaign Status',
        campaign.status ? getStatusLabel('CAMPAIGN_STATUS', Number(campaign.status)) : '—',
      ],
      ['Campaign Timeline', `${formatDay(campaign.startDate)} — ${formatDay(campaign.endDate)}`],
      ['Report Generated Date', new Date().toLocaleDateString('en-IN')],
    ],
    sections: [
      {
        heading: 'COMMITTED AT PRE-EVALUATION',
        rows: [
          ['Total Creators', mappers.length],
          ['Total Committed Views', totalCommittedViews > 0 ? totalCommittedViews : '—'],
          ['Average Pre-Eval ER %', avgPreEvalEr > 0 ? `${avgPreEvalEr}%` : '—'],
          ['Average Pre-Eval CPV', avgPreEvalCpv !== null ? `₹${avgPreEvalCpv}` : '—'],
          ['Total Commercial Budget (₹)', totalCommercials],
        ],
      },
      {
        heading: 'DELIVERED AT POST-EVALUATION',
        rows: [
          ['Total Reach (Unique)', totalReach > 0 ? totalReach : '—'],
          ['Total Engagements', totalEngagements > 0 ? totalEngagements : '—'],
          ['Overall Campaign ER %', totalReach > 0 ? `${overallErPercent}%` : '—'],
          ['Total Views Delivered', totalViews > 0 ? totalViews : '—'],
          ['Views vs Committed %', viewsDelivery !== null ? `${viewsDelivery}%` : '—'],
          ['Average Cost Per View (CPV)', overallCpv !== null ? `₹${overallCpv}` : '—'],
          ['Total Impressions', totalImpressions > 0 ? totalImpressions : '—'],
          ['Total Likes', totalLikes > 0 ? totalLikes : '—'],
          ['Total Comments', totalComments > 0 ? totalComments : '—'],
          ['Total Shares', totalShares > 0 ? totalShares : '—'],
          ['Total Saves', totalSaves > 0 ? totalSaves : '—'],
          ['Total Published Posts', postRows.length > 0 ? postRows.length : '—'],
        ],
      },
    ],
    mainTable: {
      title: 'Creator Performance',
      // No influencer commercial, no agency margin — the brand's API never
      // returns either, and neither belongs in its report.
      headers: [
        'Sr No',
        'Creator Name',
        'Social Handle',
        'Region',
        'Category',
        'Followers',
        'Deliverables',
        'Deliverable Status',
        'Approval Status',
        'Target Region Reach',
        'Committed Views',
        'Pre-Eval ER %',
        'Pre-Eval CPV (₹)',
        'Final Commercials (₹)',
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
      ],
      rows: influencerRows,
    },
    pdfGroups: [
      {
        title: 'Roster, Deliverables & Commitments',
        columns: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
      },
      {
        title: 'Post-Evaluation Delivery',
        columns: [0, 1, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 28],
      },
      { title: 'Live Deliverable URLs', columns: [0, 1, 27] },
    ],
    postTable:
      postRows.length > 0
        ? {
            title: 'Post-Level Performance',
            headers: ['Creator Name', ...POST_TABLE_HEADERS],
            rows: postRows,
          }
        : null,
    filenameBase: `${cleanFileBase(campaign.name)}_campaign_report`,
  };
}
