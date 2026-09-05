import React, { useState, useEffect, useRef, useMemo } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import LinearProgress from '@mui/material/LinearProgress';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import PhotoCameraRoundedIcon from '@mui/icons-material/PhotoCameraRounded';
import CloudUploadRoundedIcon from '@mui/icons-material/CloudUploadRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import AddPhotoAlternateRoundedIcon from '@mui/icons-material/AddPhotoAlternateRounded';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import LocalOfferRoundedIcon from '@mui/icons-material/LocalOfferRounded';
import LocationOnRoundedIcon from '@mui/icons-material/LocationOnRounded';
import VerifiedRoundedIcon from '@mui/icons-material/VerifiedRounded';
import ZoomInRoundedIcon from '@mui/icons-material/ZoomInRounded';
import { useTheme } from '@mui/material/styles';
import { useCreateOrFindChat, uploadChatAttachment, sendMessageApi } from '@api';
import { useToast } from '@hooks';
import { ImagePreviewDialog } from './ImagePreviewDialog';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

export interface SendProofScreenshotsDialogProps {
  open: boolean;
  onClose: () => void;
  campaignId?: string;
  campaignName?: string;
  brandName?: string;
  reachRegion?: string | null;
  deliverables?: string | null;
  onSuccess?: (chatId: string) => void;
}

async function ensureCompatibleImageFile(file: File): Promise<File> {
  if (file.type.toLowerCase() === 'image/webp') {
    try {
      const bitmap = await createImageBitmap(file);
      const canvas = document.createElement('canvas');
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(bitmap, 0, 0);
        const blob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob(resolve, 'image/jpeg', 0.95),
        );
        if (blob) {
          const newName = file.name.replace(/\.webp$/i, '') + '.jpg';
          return new File([blob], newName, { type: 'image/jpeg' });
        }
      }
    } catch {
      return file;
    }
  }
  return file;
}

export const SendProofScreenshotsDialog: React.FC<SendProofScreenshotsDialogProps> = ({
  open,
  onClose,
  campaignId,
  campaignName,
  brandName,
  reachRegion,
  deliverables,
  onSuccess,
}) => {
  const theme = useTheme();
  const { showSuccess, showError } = useToast();
  const createChatMutation = useCreateOrFindChat();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const previewsRef = useRef<string[]>([]);
  previewsRef.current = previews;

  const [note, setNote] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadStep, setUploadStep] = useState<string>('');
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [error, setError] = useState('');
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!open) {
      previewsRef.current.forEach((url) => {
        try {
          URL.revokeObjectURL(url);
        } catch {
          // Ignore
        }
      });
      setFiles([]);
      setPreviews([]);
      setPreviewIndex(null);
      setNote('');
      setIsDragging(false);
      setIsSubmitting(false);
      setUploadStep('');
      setProgressPercent(0);
      setError('');
    }
  }, [open]);

  useEffect(() => {
    return () => {
      previewsRef.current.forEach((url) => {
        try {
          URL.revokeObjectURL(url);
        } catch {
          // Ignore
        }
      });
    };
  }, []);

  // Derived automatic tags
  const normalizedRegion = (reachRegion || '').trim();
  const regionTag = normalizedRegion
    ? `#${normalizedRegion.replace(/[^a-zA-Z0-9]/g, '')}`
    : '#RegionalReach';

  const autoTags = useMemo(() => {
    const tags = ['#AudienceProof'];
    if (normalizedRegion) {
      tags.push(regionTag);
    }
    tags.push('#LocationInsights');
    return tags;
  }, [normalizedRegion, regionTag]);

  const tagLabel = normalizedRegion
    ? `[Audience Reach Proof · ${normalizedRegion}]`
    : `[Audience Reach Proof${campaignName ? ` · ${campaignName}` : ''}]`;

  const handleProcessFiles = (incomingList: FileList | File[]) => {
    const newFiles: File[] = [];
    const newPreviews: string[] = [];
    let validationError = '';

    const list = Array.from(incomingList);

    for (const file of list) {
      if (!ALLOWED_MIME_TYPES.includes(file.type.toLowerCase())) {
        validationError = `"${file.name}" has an unsupported format. Please upload JPEG, PNG, WEBP, or GIF images.`;
        continue;
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        validationError = `"${file.name}" exceeds the 10MB size limit.`;
        continue;
      }

      // Check if already in list
      const alreadyExists = files.some(
        (f) => f.name === file.name && f.size === file.size && f.lastModified === file.lastModified,
      );
      if (!alreadyExists) {
        newFiles.push(file);
        newPreviews.push(URL.createObjectURL(file));
      }
    }

    if (validationError) {
      setError(validationError);
    } else {
      setError('');
    }

    if (newFiles.length > 0) {
      setFiles((prev) => [...prev, ...newFiles]);
      setPreviews((prev) => [...prev, ...newPreviews]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleProcessFiles(e.target.files);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveFile = (index: number) => {
    if (previews[index]) {
      try {
        URL.revokeObjectURL(previews[index]);
      } catch {
        // Ignore
      }
    }
    if (previewIndex === index) {
      setPreviewIndex(null);
    } else if (previewIndex !== null && previewIndex > index) {
      setPreviewIndex(previewIndex - 1);
    }
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleProcessFiles(e.dataTransfer.files);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (files.length === 0) {
      setError('Please add at least one screenshot to send.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setProgressPercent(5);
    setUploadStep('Connecting to agency conversation...');

    try {
      // 1. Create or find chat for this campaign
      const chat = await createChatMutation.mutateAsync({ campaignId });
      if (!chat?.id) {
        throw new Error('Unable to find or create chat conversation with the agency.');
      }

      const totalFiles = files.length;

      // 2. Upload screenshots and send each as a tagged message
      for (let i = 0; i < totalFiles; i++) {
        let file = files[i];
        file = await ensureCompatibleImageFile(file);
        const stepBase = 10 + Math.round((i / totalFiles) * 80);
        setProgressPercent(stepBase);
        setUploadStep(`Uploading screenshot ${i + 1} of ${totalFiles}: ${file.name}...`);

        // Upload attachment to backend
        const uploaded = await uploadChatAttachment(chat.id, file);

        // Compose body with auto tags
        const tagHeader = totalFiles > 1 ? `${tagLabel} (Proof ${i + 1}/${totalFiles})` : tagLabel;
        const hashtags = autoTags.join(' ');
        const customNote = note.trim();

        const bodyParts = [
          tagHeader,
          hashtags,
          customNote
            ? `\nNote: ${customNote}`
            : '\nInstagram Insights: Audience & Top Locations proof screenshot',
        ];
        const messageBody = bodyParts.filter(Boolean).join('\n');

        setUploadStep(`Sending proof ${i + 1} of ${totalFiles} to agency chat...`);
        setProgressPercent(stepBase + Math.round(80 / totalFiles / 2));

        // Send message with image attachment
        await sendMessageApi(chat.id, {
          body: messageBody,
          attachmentUrl: uploaded.url,
        });
      }

      setProgressPercent(100);
      setUploadStep('All screenshots sent successfully!');
      showSuccess(
        `Sent ${totalFiles} proof screenshot${totalFiles > 1 ? 's' : ''} to agency chat with tag "${tagLabel}".`,
      );

      // Clean up and close
      previews.forEach((url) => {
        try {
          URL.revokeObjectURL(url);
        } catch {
          // Ignore
        }
      });
      setFiles([]);
      setPreviews([]);
      setIsSubmitting(false);
      onClose();

      if (onSuccess) {
        onSuccess(chat.id);
      }
    } catch (err: unknown) {
      setIsSubmitting(false);
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      const errMsg =
        errorObj?.response?.data?.message ||
        errorObj?.message ||
        'Failed to send screenshots to chat. Please try again.';
      setError(errMsg);
      showError(errMsg);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const displayName = brandName && campaignName ? `${campaignName} (${brandName})` : campaignName;

  return (
    <Dialog
      open={open}
      onClose={() => {
        if (!isSubmitting) onClose();
      }}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: `${theme.customRadii.card}px`,
            padding: { xs: '16px', sm: '20px 24px' },
            backgroundImage: 'none',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            '&::-webkit-scrollbar': { display: 'none' },
          },
        },
      }}
    >
      <DialogTitle
        sx={{
          p: 0,
          pb: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: `${theme.customRadii.inner - 4}px`,
              backgroundColor: theme.palette.tokens.accentBg,
              color: theme.palette.tokens.accentText,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <PhotoCameraRoundedIcon fontSize="small" />
          </Box>
          <Box>
            <Typography variant="h3" sx={{ fontWeight: 700 }}>
              Send Reach Proof Screenshots
            </Typography>
            <Typography variant="caption" sx={{ color: theme.palette.tokens.textSecondary }}>
              Upload audience location insights to confirm your reach in the campaign region
            </Typography>
          </Box>
        </Box>
        <IconButton
          size="small"
          onClick={onClose}
          disabled={isSubmitting}
          sx={{ color: theme.palette.tokens.textSecondary, mt: -0.5, mr: -0.5 }}
        >
          <CloseRoundedIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        {/* Campaign & Target Region Summary Card */}
        <Box
          sx={{
            padding: '14px 16px',
            backgroundColor: theme.palette.tokens.fieldBg,
            borderRadius: `${theme.customRadii.inner}px`,
            border: `1px solid ${theme.palette.tokens.divider}`,
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 1,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <LocationOnRoundedIcon fontSize="small" sx={{ color: theme.palette.tokens.accent }} />
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                {normalizedRegion
                  ? `Recorded Reach: ${normalizedRegion}`
                  : 'Audience Location Proof'}
              </Typography>
            </Box>
            {displayName && (
              <Chip
                size="small"
                label={displayName}
                sx={{
                  fontWeight: 600,
                  fontSize: '11px',
                  backgroundColor: theme.palette.tokens.surface,
                  border: `1px solid ${theme.palette.tokens.divider}`,
                }}
              />
            )}
          </Box>

          {deliverables && (
            <Typography
              variant="caption"
              sx={{ color: theme.palette.tokens.textSecondary, display: 'block' }}
            >
              <strong>Deliverables:</strong> {deliverables}
            </Typography>
          )}

          <Typography variant="caption" sx={{ color: theme.palette.tokens.textSecondary }}>
            Please attach screenshots from <strong>Insights &gt; Audience &gt; Locations</strong> to
            verify your reach in {normalizedRegion || 'the campaign region'}.
          </Typography>
        </Box>

        {/* Automatic Tag Banner */}
        <Box
          sx={{
            padding: '12px 14px',
            backgroundColor: theme.palette.tokens.accentBg,
            borderRadius: `${theme.customRadii.inner - 4}px`,
            border: `1px solid ${theme.palette.tokens.divider}`,
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LocalOfferRoundedIcon
              fontSize="small"
              sx={{ color: theme.palette.tokens.accent, fontSize: 18 }}
            />
            <Typography
              variant="caption"
              sx={{ color: theme.palette.tokens.accentText, fontWeight: 700 }}
            >
              AUTOMATIC TAG ADDED TO CHAT
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, alignItems: 'center' }}>
            <Chip
              size="small"
              icon={
                <VerifiedRoundedIcon
                  sx={{
                    fontSize: '14px !important',
                    color: `${theme.palette.tokens.accentText} !important`,
                  }}
                />
              }
              label={tagLabel}
              sx={{
                fontWeight: 700,
                fontSize: '12px',
                backgroundColor: theme.palette.tokens.surface,
                color: theme.palette.tokens.accentText,
                border: `1px solid ${theme.palette.tokens.divider}`,
              }}
            />
            {autoTags.map((tag) => (
              <Chip
                key={tag}
                size="small"
                label={tag}
                sx={{
                  fontWeight: 600,
                  fontSize: '11.5px',
                  backgroundColor: theme.palette.tokens.surface,
                  color: theme.palette.tokens.accent,
                  border: `1px solid ${theme.palette.tokens.divider}`,
                }}
              />
            ))}
          </Box>
          <Typography
            variant="caption"
            sx={{ color: theme.palette.tokens.accentText, fontSize: '11px', lineHeight: 1.4 }}
          >
            This tag is automatically added to each screenshot message in the chat so the agency
            partner can immediately verify your proof.
          </Typography>
        </Box>

        {/* Hidden File Input for Multiple Uploads */}
        <input
          ref={fileInputRef}
          type="file"
          accept={ALLOWED_MIME_TYPES.join(',')}
          multiple
          style={{ display: 'none' }}
          onChange={handleFileInputChange}
          disabled={isSubmitting}
        />

        {/* Dropzone & Screenshot Selector */}
        <Box>
          <Typography
            variant="caption"
            sx={{
              color: theme.palette.tokens.textSecondary,
              fontWeight: 700,
              display: 'block',
              mb: 1,
              letterSpacing: '0.5px',
            }}
          >
            SCREENSHOT ATTACHMENTS ({files.length} SELECTED)
          </Typography>

          <Box
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => {
              if (!isSubmitting) fileInputRef.current?.click();
            }}
            sx={{
              p: 3,
              borderRadius: `${theme.customRadii.inner}px`,
              border: `2px dashed ${
                isDragging ? theme.palette.tokens.accent : theme.palette.tokens.divider
              }`,
              backgroundColor: isDragging
                ? theme.palette.tokens.accentBg
                : theme.palette.tokens.fieldBg,
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              textAlign: 'center',
              transition: 'all 0.2s ease',
              '&:hover': {
                borderColor: isSubmitting
                  ? theme.palette.tokens.divider
                  : theme.palette.tokens.accent,
                backgroundColor: isSubmitting
                  ? theme.palette.tokens.fieldBg
                  : theme.palette.tokens.tableHover,
              },
            }}
          >
            <CloudUploadRoundedIcon
              sx={{
                fontSize: 36,
                color: isDragging
                  ? theme.palette.tokens.accent
                  : theme.palette.tokens.textSecondary,
                mb: 1,
              }}
            />
            <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>
              Click to select multiple screenshots or drag and drop
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: theme.palette.tokens.textSecondary, display: 'block' }}
            >
              Select all your proof images at once (PNG, JPG, JPEG, WEBP · up to 10MB each)
            </Typography>
          </Box>
        </Box>

        {/* Thumbnail Preview Grid */}
        {files.length > 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography
                variant="caption"
                sx={{ fontWeight: 700, color: theme.palette.tokens.textPrimary }}
              >
                Ready to send ({files.length} {files.length === 1 ? 'screenshot' : 'screenshots'}):
              </Typography>
              <Button
                size="small"
                startIcon={<AddPhotoAlternateRoundedIcon fontSize="small" />}
                onClick={() => fileInputRef.current?.click()}
                disabled={isSubmitting}
                sx={{ textTransform: 'none', py: 0.25 }}
              >
                Add More
              </Button>
            </Box>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)' },
                gap: 1.5,
                maxHeight: 220,
                overflowY: 'auto',
                p: 0.5,
              }}
            >
              {files.map((file, index) => (
                <Box
                  key={`${file.name}-${index}`}
                  onClick={() => setPreviewIndex(index)}
                  sx={{
                    position: 'relative',
                    borderRadius: `${theme.customRadii.inner - 4}px`,
                    border: `1px solid ${theme.palette.tokens.divider}`,
                    overflow: 'hidden',
                    backgroundColor: theme.palette.tokens.surface,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      borderColor: theme.palette.tokens.accent,
                      boxShadow: '0 4px 14px rgba(0,0,0,0.12)',
                      '& .screenshot-zoom-overlay': {
                        opacity: 1,
                      },
                      '& img': {
                        transform: 'scale(1.05)',
                      },
                    },
                  }}
                >
                  <Box
                    component="img"
                    src={previews[index]}
                    alt={file.name}
                    sx={{
                      width: '100%',
                      height: 100,
                      objectFit: 'cover',
                      display: 'block',
                      transition: 'transform 0.2s ease',
                    }}
                  />

                  {/* Zoom hint overlay on hover */}
                  <Box
                    className="screenshot-zoom-overlay"
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: 100,
                      backgroundColor: 'rgba(10, 11, 14, 0.48)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 0.5,
                      color: '#FFFFFF',
                      opacity: 0,
                      transition: 'opacity 0.15s ease',
                      pointerEvents: 'none',
                    }}
                  >
                    <ZoomInRoundedIcon sx={{ fontSize: 18 }} />
                    <Typography sx={{ fontSize: '11px', fontWeight: 600 }}>Click to zoom</Typography>
                  </Box>

                  {/* Badge top-left */}
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 4,
                      left: 4,
                      backgroundColor: 'rgba(0,0,0,0.75)',
                      color: '#FFFFFF',
                      borderRadius: '4px',
                      px: 0.75,
                      py: 0.2,
                      fontSize: '10px',
                      fontWeight: 700,
                      zIndex: 2,
                    }}
                  >
                    #{index + 1}
                  </Box>

                  {/* Remove button top-right */}
                  {!isSubmitting && (
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFile(index);
                      }}
                      sx={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        zIndex: 3,
                        backgroundColor: 'rgba(255, 255, 255, 0.92)',
                        color: theme.palette.tokens.negativeText,
                        p: 0.35,
                        '&:hover': {
                          backgroundColor: theme.palette.tokens.negativeBg,
                        },
                      }}
                    >
                      <DeleteOutlineRoundedIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  )}

                  {/* Footer filename & size */}
                  <Box sx={{ p: 0.75, backgroundColor: theme.palette.tokens.surface }}>
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 600,
                        fontSize: '11px',
                        display: 'block',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                      title={file.name}
                    >
                      {file.name}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ fontSize: '10px', color: theme.palette.tokens.textSecondary }}
                    >
                      {formatFileSize(file.size)}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        )}

        {/* Optional Note Field */}
        <TextField
          label="Optional message / note to agency"
          placeholder="e.g. Attached are my Instagram Insights screenshots showing 65% audience reach in Kochi."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          multiline
          rows={2}
          disabled={isSubmitting}
          fullWidth
          variant="outlined"
          size="small"
          helperText="This note will accompany each tagged screenshot in the chat."
        />

        {/* Error message */}
        {error && (
          <Alert severity="error" sx={{ py: 0.5 }}>
            {error}
          </Alert>
        )}

        {/* Submitting Progress Indicator */}
        {isSubmitting && (
          <Box sx={{ mt: 1 }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 0.75,
              }}
            >
              <Typography
                variant="caption"
                sx={{ fontWeight: 600, color: theme.palette.tokens.textPrimary }}
              >
                {uploadStep}
              </Typography>
              <Typography
                variant="caption"
                sx={{ fontWeight: 700, color: theme.palette.tokens.accent }}
              >
                {progressPercent}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={progressPercent}
              sx={{
                height: 6,
                borderRadius: 3,
                backgroundColor: theme.palette.tokens.divider,
                '& .MuiLinearProgress-bar': {
                  backgroundColor: theme.palette.tokens.accent,
                },
              }}
            />
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 0, pt: 3, gap: 1.5 }}>
        <Button variant="outlined" onClick={onClose} disabled={isSubmitting} sx={{ minWidth: 100 }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={() => handleSubmit()}
          disabled={files.length === 0 || isSubmitting}
          startIcon={
            isSubmitting ? (
              <CircularProgress size={16} color="inherit" />
            ) : (
              <SendRoundedIcon fontSize="small" />
            )
          }
          sx={{ minWidth: 180 }}
        >
          {isSubmitting
            ? 'Sending Proof...'
            : `Send ${files.length > 0 ? `${files.length} ` : ''}Screenshot${files.length === 1 ? '' : 's'} to Chat`}
        </Button>
      </DialogActions>

      {/* Lightbox / Zoom Dialog for Uploaded Screenshot */}
      <ImagePreviewDialog
        open={previewIndex !== null}
        onClose={() => setPreviewIndex(null)}
        imageUrl={previewIndex !== null ? previews[previewIndex] : null}
        title={
          previewIndex !== null && files[previewIndex]
            ? files[previewIndex].name
            : 'Reach Proof Screenshot'
        }
        subtitle={
          previewIndex !== null && files[previewIndex]
            ? `${(files[previewIndex].size / 1024).toFixed(1)} KB · ${tagLabel}`
            : undefined
        }
      />
    </Dialog>
  );
};
