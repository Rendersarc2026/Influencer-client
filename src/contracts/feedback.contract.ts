import { z } from 'zod';
import { safeText, safeMultilineText, httpUrl } from './primitives';

/**
 * Bug reports and product feedback, submitted from the dialog above Log Out.
 *
 * Two shapes, two tables: a bug carries a severity and feedback does not, and
 * the two are triaged separately. What they share is the part the server fills
 * in — the application id, the reporter's identity and the user agent are never
 * accepted from the body, because a caller that could name its own reporter
 * could file a report as somebody else.
 */

/** The fields both shapes share. */
const reportBase = {
  /** A one-line summary. This is what a developer scanning the table reads. */
  title: safeText(160),
  /**
   * The body of the report. Generous ceiling — a long bug report is a good bug
   * report, and 4000 characters still sits far inside the 100kb body limit.
   */
  description: safeMultilineText(4000, 10),
  /**
   * The client route it was raised from. The client fills this in, so it is
   * capped and validated like anything else that arrives from outside.
   */
  pageUrl: safeText(500).optional(),
  /** Uploaded through `/reports/attachment` first; this carries the returned URL. */
  screenshotUrl: httpUrl.optional(),
};

/**
 * A bug report carries nothing a piece of feedback does not.
 *
 * Severity used to be asked for here and is not any more: everyone left it on
 * the default, which made the column say nothing. It is still on the table, set
 * by whoever triages the report.
 */
export const SubmitBugReportSchema = z.object(reportBase);

export type SubmitBugReportRequest = z.infer<typeof SubmitBugReportSchema>;

export const SubmitFeedbackSchema = z.object(reportBase);

export type SubmitFeedbackRequest = z.infer<typeof SubmitFeedbackSchema>;

/**
 * The acknowledgement. Deliberately thin: the submitter has no way to read a
 * report back, so there is nothing to return but proof it was stored.
 */
export const SubmitReportResponseSchema = z.object({
  id: z.string().uuid(),
  createdOn: z.string().or(z.date()),
});

export type SubmitReportResponse = z.infer<typeof SubmitReportResponseSchema>;
