import React, { useEffect, useId, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import CircularProgress from '@mui/material/CircularProgress';
import BugReportOutlinedIcon from '@mui/icons-material/BugReportOutlined';
import ChatBubbleOutlineRoundedIcon from '@mui/icons-material/ChatBubbleOutlineRounded';
import AddPhotoAlternateRoundedIcon from '@mui/icons-material/AddPhotoAlternateRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import { useTheme } from '@mui/material/styles';
import { FeedbackTypeCode, FeedbackType } from '@contracts';
import { submitBugReport, submitFeedback, uploadReportAttachment } from '@api';
import { useToast } from '@hooks';

const TITLE_MAX = 160;
const DESCRIPTION_MAX = 4000;
const DESCRIPTION_MIN = 10;
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

/**
 * The prompt under the description changes with the type on purpose. A bug
 * report is only worth filing if it says what happened, what was expected and
 * how to get back to it; feedback needs none of that and asking for it puts
 * people off writing anything at all.
 */
const COPY = {
  [FeedbackTypeCode.BUG]: {
    heading: 'Report a Bug',
    subtitle: 'Tell us what broke. It goes straight to the developers.',
    titleLabel: 'What went wrong?',
    titlePlaceholder: 'Campaign list shows a blank row',
    descriptionLabel: 'Details',
    descriptionPlaceholder:
      'What did you do, what happened, and what did you expect instead?\n\n1. Opened Campaigns\n2. ...',
    submitLabel: 'Send Bug Report',
  },
  [FeedbackTypeCode.FEEDBACK]: {
    heading: 'Send Feedback',
    subtitle: 'Ideas, rough edges, anything that would make this better.',
    titleLabel: 'In a line',
    titlePlaceholder: 'Let me filter campaigns by brand',
    descriptionLabel: 'Details',
    descriptionPlaceholder: 'What would you like to see, and what would it let you do?',
    submitLabel: 'Send Feedback',
  },
} as const;

export interface FeedbackDialogProps {
  open: boolean;
  /** Which of the two the entry point asked for. The toggle can still change it. */
  initialType?: FeedbackType;
  onClose: () => void;
}

export const FeedbackDialog: React.FC<FeedbackDialogProps> = ({
  open,
  initialType = FeedbackTypeCode.FEEDBACK,
  onClose,
}) => {
  const theme = useTheme();
  const location = useLocation();
  const { showSuccess, showError } = useToast();
  const baseId = useId();
  const titleId = `${baseId}-title`;
  const subtitleId = `${baseId}-subtitle`;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [type, setType] = useState<FeedbackType>(initialType);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  /**
   * Errors appear once someone has tried to send, not before.
   *
   * This used to be a `touched` flag set on blur, and the dialog opened with
   * both fields already red: `autoFocus` puts the caret in the title field, the
   * dialog's focus trap moves focus again on mount, and that counted as a blur
   * of a field nobody had touched.
   */
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Reopening starts a fresh report — including from the other menu item, which
  // is why the type resets from the prop rather than keeping the last toggle.
  useEffect(() => {
    if (!open) return;
    setType(initialType);
    setTitle('');
    setDescription('');
    setScreenshot(null);
    setSubmitAttempted(false);
    setSubmitting(false);
  }, [open, initialType]);

  const copy = COPY[type];
  const isBug = type === FeedbackTypeCode.BUG;
  const trimmedTitle = title.trim();
  const trimmedDescription = description.trim();
  const titleValid = trimmedTitle.length > 0 && trimmedTitle.length <= TITLE_MAX;
  const descriptionValid =
    trimmedDescription.length >= DESCRIPTION_MIN && trimmedDescription.length <= DESCRIPTION_MAX;

  const handlePickScreenshot = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // Clear the input so picking the same file twice still fires a change.
    event.target.value = '';
    if (!file) return;

    if (!ALLOWED_MIME_TYPES.includes(file.type.toLowerCase())) {
      showError('Attach a JPEG, PNG, WEBP or GIF image.');
      return;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      showError('Screenshot must be smaller than 5MB.');
      return;
    }
    setScreenshot(file);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitAttempted(true);
    if (!titleValid || !descriptionValid || submitting) return;

    setSubmitting(true);
    try {
      // Uploaded first: the report carries the URL, so a failed upload must not
      // leave a report pointing at nothing.
      let screenshotUrl: string | undefined;
      if (screenshot) {
        const uploaded = await uploadReportAttachment(screenshot);
        screenshotUrl = uploaded.url;
      }

      const common = {
        title: trimmedTitle,
        description: trimmedDescription,
        // Where they were when they hit the problem, which is the one detail
        // nobody remembers to include.
        pageUrl: `${location.pathname}${location.search}`,
        screenshotUrl,
      };

      // Two tables, two endpoints.
      if (isBug) {
        await submitBugReport(common);
      } else {
        await submitFeedback(common);
      }

      showSuccess(
        isBug ? 'Bug report sent. Thank you.' : 'Feedback sent. Thank you.',
      );
      onClose();
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      showError(
        errorObj?.response?.data?.message ||
          errorObj?.message ||
          'Could not send that just now. Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={submitting ? undefined : onClose}
      maxWidth="sm"
      fullWidth
      aria-labelledby={titleId}
      aria-describedby={subtitleId}
      slotProps={{
        paper: {
          sx: {
            borderRadius: `${theme.customRadii.card}px`,
            padding: '8px',
            backgroundImage: 'none',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            '&::-webkit-scrollbar': { display: 'none' },
          },
        },
      }}
    >
      <form onSubmit={handleSubmit}>
        <DialogTitle component="div" sx={{ pb: 1 }}>
          <Typography id={titleId} variant="h2" sx={{ fontSize: '20px' }}>
            {copy.heading}
          </Typography>
          <Typography
            id={subtitleId}
            variant="body2"
            sx={{ color: theme.palette.tokens.textSecondary, mt: '2px' }}
          >
            {copy.subtitle}
          </Typography>
        </DialogTitle>

        <DialogContent
          sx={{
            pt: 1.5,
            display: 'flex',
            flexDirection: 'column',
            gap: 1.25,
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            '&::-webkit-scrollbar': { display: 'none' },
          }}
        >
          <ToggleButtonGroup
            exclusive
            fullWidth
            size="small"
            value={type}
            onChange={(_event, next: FeedbackType | null) => {
              if (next === null) return;
              setType(next);
              // The other form's errors are not this form's: switching tabs
              // should not land on a field already marked red.
              setSubmitAttempted(false);
            }}
            disabled={submitting}
            sx={{ mt: 0.5 }}
          >
            <ToggleButton value={FeedbackTypeCode.FEEDBACK} sx={{ gap: 1, textTransform: 'none' }}>
              <ChatBubbleOutlineRoundedIcon fontSize="small" />
              Feedback
            </ToggleButton>
            <ToggleButton value={FeedbackTypeCode.BUG} sx={{ gap: 1, textTransform: 'none' }}>
              <BugReportOutlinedIcon fontSize="small" />
              Bug
            </ToggleButton>
          </ToggleButtonGroup>

          <TextField
            fullWidth
            autoFocus
            label={copy.titleLabel}
            placeholder={copy.titlePlaceholder}
            value={title}
            onChange={(e) => setTitle(e.target.value.slice(0, TITLE_MAX))}
            error={submitAttempted && !titleValid}
            helperText={submitAttempted && !titleValid ? 'Give it a short summary' : ''}
            disabled={submitting}
          />

          <TextField
            fullWidth
            multiline
            minRows={5}
            label={copy.descriptionLabel}
            placeholder={copy.descriptionPlaceholder}
            value={description}
            onChange={(e) => setDescription(e.target.value.slice(0, DESCRIPTION_MAX))}
            error={submitAttempted && !descriptionValid}
            helperText={
              submitAttempted && !descriptionValid
                ? `At least ${DESCRIPTION_MIN} characters`
                : `${trimmedDescription.length}/${DESCRIPTION_MAX}`
            }
            disabled={submitting}
          />

          <Box>
            <input
              ref={fileInputRef}
              type="file"
              accept={ALLOWED_MIME_TYPES.join(',')}
              onChange={handlePickScreenshot}
              style={{ display: 'none' }}
            />
            {screenshot ? (
              <Chip
                label={screenshot.name}
                onDelete={submitting ? undefined : () => setScreenshot(null)}
                deleteIcon={
                  <IconButton size="small" component="span" aria-label="Remove screenshot">
                    <DeleteOutlineRoundedIcon fontSize="small" />
                  </IconButton>
                }
                sx={{ maxWidth: '100%' }}
              />
            ) : (
              <Button
                variant="outlined"
                size="small"
                startIcon={<AddPhotoAlternateRoundedIcon />}
                onClick={() => fileInputRef.current?.click()}
                disabled={submitting}
                sx={{ textTransform: 'none' }}
              >
                Attach a screenshot (optional)
              </Button>
            )}
          </Box>

          <Typography variant="caption" sx={{ color: theme.palette.tokens.textSecondary }}>
            Your name, email and the page you are on are attached automatically.
          </Typography>
        </DialogContent>

        <DialogActions sx={{ gap: 1 }}>
          <Button variant="outlined" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" variant="dark" disabled={submitting}>
            {submitting ? <CircularProgress size={20} color="inherit" /> : copy.submitLabel}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
