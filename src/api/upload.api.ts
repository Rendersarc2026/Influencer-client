import { apiClient } from './axios.client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

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
  profile: any;
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

  const response = await apiClient.post<UploadAvatarResult>(
    '/users/profile/avatar',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  );
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

export function useUploadAvatar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => uploadAvatar(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
  });
}
