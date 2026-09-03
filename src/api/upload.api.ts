import { apiClient } from './axios.client';

export interface UploadResult {
  success: boolean;
  url: string;
  key: string;
  bucket: string;
  mimeType: string;
  size: number;
}

export interface UploadAvatarResult {
  message: string;
  avatarUrl: string;
  profile: Record<string, unknown>;
}

export interface RemoveAvatarResult {
  message: string;
  avatarUrl: null;
  profile: Record<string, unknown>;
}

export async function uploadImage(file: File, folder: string = 'general'): Promise<UploadResult> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', folder);

  const response = await apiClient.post<UploadResult>('/uploads/image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
}

export async function uploadAvatar(file: File): Promise<UploadAvatarResult> {
  const formData = new FormData();
  formData.append('avatar', file);

  const response = await apiClient.post<UploadAvatarResult>('/users/profile/avatar', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
}

export async function removeAvatar(): Promise<RemoveAvatarResult> {
  const response = await apiClient.delete<RemoveAvatarResult>('/users/profile/avatar');
  return response.data;
}

export async function uploadChatAttachment(chatId: string, file: File): Promise<UploadResult> {
  const formData = new FormData();
  formData.append('attachment', file);

  const response = await apiClient.post<UploadResult>(`/chats/${chatId}/attachment`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
}
