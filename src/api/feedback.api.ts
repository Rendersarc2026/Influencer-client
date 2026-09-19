import { useMutation } from '@tanstack/react-query';
import { apiClient } from './axios.client';
import {
  SubmitBugReportRequest,
  SubmitFeedbackRequest,
  SubmitReportResponse,
} from '@contracts';

/**
 * Bug reports and product feedback.
 *
 * Write-only: the reports land in a database the developers read directly, so
 * there is nothing to fetch back and no cache for a submit to invalidate. Bugs
 * and feedback are separate tables behind separate endpoints.
 */
export async function submitBugReport(
  payload: SubmitBugReportRequest,
): Promise<SubmitReportResponse> {
  const response = await apiClient.post<SubmitReportResponse>('/reports/bugs', payload);
  return response.data;
}

export async function submitFeedback(
  payload: SubmitFeedbackRequest,
): Promise<SubmitReportResponse> {
  const response = await apiClient.post<SubmitReportResponse>('/reports/feedback', payload);
  return response.data;
}

/**
 * The screenshot on a report. Goes to the reports bucket through the reports
 * route, never through `/uploads` — that one writes to the application's own
 * bucket.
 */
export async function uploadReportAttachment(file: File): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append('screenshot', file);

  const response = await apiClient.post<{ url: string }>('/reports/attachment', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}

export function useSubmitBugReport() {
  return useMutation<SubmitReportResponse, unknown, SubmitBugReportRequest>({
    mutationFn: submitBugReport,
  });
}

export function useSubmitFeedback() {
  return useMutation<SubmitReportResponse, unknown, SubmitFeedbackRequest>({
    mutationFn: submitFeedback,
  });
}
