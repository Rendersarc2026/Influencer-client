import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import CircularProgress from '@mui/material/CircularProgress';
import MailOutlineRoundedIcon from '@mui/icons-material/MailOutlineRounded';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import { useTheme } from '@mui/material/styles';
import { RequestOtpRequestSchema, VerifyOtpRequestSchema } from '@contracts';
import { useAuth, useToast } from '@hooks';
import { prefetchForRoute } from '@api';
import { getRoleDashboardPath } from '@routes/navConfig';
import { BrandLogo } from '@atoms';

export const LoginOrganism: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { requestOtp, verifyOtp } = useAuth();
  const { showSuccess, showError } = useToast();

  // Step state: 1 = email, 2 = otp
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isEmailBlocked, setIsEmailBlocked] = useState(false);

  // OTP boxes state (6 digits)
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState('');
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null);

  // Loading & countdown state
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // OTP input refs
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // 15s countdown timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  // Step 1: Submit Email
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError('');

    const validation = RequestOtpRequestSchema.safeParse({ email: email.trim() });
    if (!validation.success) {
      setEmailError(validation.error.errors[0]?.message || 'Please enter a valid email address');
      return;
    }

    try {
      setLoading(true);
      await requestOtp(email.trim());
      showSuccess(`Verification code sent to ${email.trim()}`);
      setStep(2);
      setCountdown(15);
      setOtp(['', '', '', '', '', '']);
      setOtpError('');
      setAttemptsRemaining(null);
      setIsEmailBlocked(false);
    } catch (err: unknown) {
      const errorObj = err as {
        response?: { data?: { message?: string; code?: string } };
        message?: string;
      };
      const data = errorObj?.response?.data;
      const msg =
        data?.message ||
        errorObj?.message ||
        'No active account found with this email address. Please check your email or contact support.';
      setEmailError(msg);
      showError(msg);
      if (data?.code === 'ACCOUNT_LOCKED' || msg.toLowerCase().includes('blocked for 30 minutes')) {
        setIsEmailBlocked(true);
      }
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP handler
  const handleResendOtp = async () => {
    if (countdown > 0 || loading || isEmailBlocked) return;
    try {
      setLoading(true);
      setOtpError('');
      await requestOtp(email.trim());
      showSuccess(`New verification code sent to ${email.trim()}`);
      setCountdown(15);
      setOtp(['', '', '', '', '', '']);
      setAttemptsRemaining(null);
    } catch (err: unknown) {
      const errorObj = err as {
        response?: { data?: { message?: string; code?: string } };
        message?: string;
      };
      const data = errorObj?.response?.data;
      const msg = data?.message || errorObj?.message || 'Failed to resend login code.';
      setOtpError(msg);
      showError(msg);
      if (data?.code === 'ACCOUNT_LOCKED' || msg.toLowerCase().includes('blocked for 30 minutes')) {
        setIsEmailBlocked(true);
        setAttemptsRemaining(0);
      }
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Handle single digit input
  const handleOtpChange = (index: number, value: string) => {
    setOtpError('');
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    // Handle single character
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // Auto-advance to next input if digit entered
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Step 2: Handle KeyDown (Backspace navigation)
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  // Step 2: Handle Paste of 6 digits
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    setOtpError('');
    const pastedData = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split('');
      setOtp(digits);
      inputRefs.current[5]?.focus();
    }
  };

  // Step 2: Submit OTP
  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError('');

    const fullCode = otp.join('');
    const validation = VerifyOtpRequestSchema.safeParse({ email: email.trim(), code: fullCode });
    if (!validation.success) {
      setOtpError('Please enter all 6 digits of the verification code');
      return;
    }

    try {
      setLoading(true);
      const authResult = await verifyOtp(email.trim(), fullCode);
      showSuccess('Login successful! Welcome back.');
      if (!authResult.termsAccepted) {
        navigate('/accept-terms', { replace: true });
      } else if (!authResult.profileComplete) {
        navigate('/complete-profile', { replace: true });
      } else {
        const target = getRoleDashboardPath(authResult.roleCode);
        // Start the dashboard's queries before navigating, so they overlap the
        // route chunk load and first render instead of queueing behind them.
        // Same warming the boot prefetch does on a cold page load — which never
        // fires here, since the app booted on /login.
        prefetchForRoute(target);
        navigate(target, { replace: true });
      }
    } catch (err: unknown) {
      const errorObj = err as {
        response?: { data?: { message?: string; attemptsRemaining?: number; code?: string } };
        message?: string;
      };
      const data = errorObj?.response?.data;
      const msg =
        data?.message || errorObj?.message || 'Invalid or expired code. Please try again.';
      setOtpError(msg);
      showError(msg);
      if (data?.code === 'ACCOUNT_LOCKED') {
        setAttemptsRemaining(0);
      } else if (typeof data?.attemptsRemaining === 'number') {
        setAttemptsRemaining(data.attemptsRemaining);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        height: '100vh',
        '@supports (height: 100dvh)': { height: '100dvh' },
        overflowY: 'auto',
        overflowX: 'hidden',
        backgroundColor: theme.palette.tokens.pageBg,
        padding: { xs: '24px 16px', sm: '32px 24px' },
      }}
    >
      <Card
        sx={{
          my: 'auto',
          width: '100%',
          maxWidth: 440,
          flexShrink: 0,
          padding: { xs: '28px 20px', sm: '40px 36px' },
          borderRadius: `${theme.customRadii.card}px`,
          backgroundColor: theme.palette.tokens.surface,
          border: `1px solid ${theme.palette.tokens.divider}`,
          boxShadow: 'none',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Brand Symbol */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
          <BrandLogo
            size={56}
            sx={{
              borderRadius: `${theme.customRadii.inner}px`,
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
            }}
          />
        </Box>

        {step === 1 ? (
          /* STEP 1: EMAIL ENTRY */
          <form onSubmit={handleEmailSubmit}>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Typography variant="h1" sx={{ fontSize: '26px', mb: 1 }}>
                Welcome back
              </Typography>
              <Typography variant="body2" sx={{ color: theme.palette.tokens.textSecondary }}>
                Enter your email address to receive a secure one-time login code.
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Email address"
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) setEmailError('');
                  if (isEmailBlocked) setIsEmailBlocked(false);
                }}
                error={Boolean(emailError)}
                fullWidth
                autoFocus
                disabled={loading}
              />

              {emailError && (
                <Box
                  sx={{
                    padding: '10px 14px',
                    borderRadius: `${theme.customRadii.inner}px`,
                    backgroundColor: '#FDE8E8',
                    border: `1px solid ${theme.palette.tokens.negative}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <ErrorOutlineRoundedIcon
                    sx={{ color: theme.palette.tokens.negative, fontSize: 18 }}
                  />
                  <Typography
                    variant="body2"
                    sx={{ color: theme.palette.tokens.negative, fontWeight: 600 }}
                  >
                    {emailError}
                  </Typography>
                </Box>
              )}

              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={loading || !email.trim() || isEmailBlocked}
                sx={{ height: 48, fontSize: '15px', mt: 0.5 }}
              >
                {loading ? (
                  <CircularProgress size={22} color="inherit" />
                ) : isEmailBlocked ? (
                  'Email Blocked (30 min)'
                ) : (
                  'Send Login Code'
                )}
              </Button>
            </Box>
          </form>
        ) : (
          /* STEP 2: 6-DIGIT OTP ENTRY */
          <form onSubmit={handleVerifySubmit}>
            <Box sx={{ textAlign: 'center', mb: 3.5 }}>
              <Typography variant="h1" sx={{ fontSize: '24px', mb: 1 }}>
                Check your email
              </Typography>
              <Typography variant="body2" sx={{ color: theme.palette.tokens.textSecondary }}>
                We sent a 6-digit verification code to
              </Typography>
              <Typography
                variant="body2"
                sx={{ fontWeight: 600, color: theme.palette.tokens.textPrimary, mt: '2px' }}
              >
                {email}
              </Typography>
            </Box>

            {/* 6 OTP Boxes */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: { xs: 1, sm: 1.5 },
                mb: 2.5,
              }}
              onPaste={handlePaste}
            >
              {otp.map((digit, idx) => (
                <Box
                  key={idx}
                  component="input"
                  ref={(el: HTMLInputElement | null) => (inputRefs.current[idx] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    handleOtpChange(idx, e.target.value)
                  }
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => handleKeyDown(idx, e)}
                  disabled={loading || isEmailBlocked || attemptsRemaining === 0}
                  autoFocus={idx === 0}
                  sx={{
                    // Fixed 48px each overflows a phone; below `sm` the six
                    // boxes divide the available width evenly instead.
                    flex: { xs: '1 1 0', sm: '0 0 48px' },
                    minWidth: 0,
                    width: { xs: 'auto', sm: '48px' },
                    height: { xs: '52px', sm: '56px' },
                    textAlign: 'center',
                    fontSize: { xs: '20px', sm: '22px' },
                    fontWeight: 700,
                    borderRadius: `${theme.customRadii.inner}px`,
                    border: `1px solid ${otpError ? theme.palette.tokens.negative : digit ? theme.palette.tokens.accent : theme.palette.tokens.divider}`,
                    backgroundColor: theme.palette.tokens.fieldBg,
                    color: theme.palette.tokens.textPrimary,
                    outline: 'none',
                    transition: 'all 0.15s ease',
                    '&:focus': {
                      borderColor: theme.palette.tokens.accent,
                      backgroundColor: theme.palette.tokens.surface,
                    },
                  }}
                />
              ))}
            </Box>

            {/* Inline Error and Attempts Remaining message */}
            {otpError && (
              <Box sx={{ mb: 2, textAlign: 'center' }}>
                <Typography
                  variant="body2"
                  sx={{ color: theme.palette.tokens.negative, fontWeight: 500 }}
                >
                  {otpError}
                </Typography>
                {attemptsRemaining !== null && (
                  <Typography
                    variant="caption"
                    sx={{ color: theme.palette.tokens.negative, display: 'block', mt: 0.5 }}
                  >
                    {attemptsRemaining} attempt{attemptsRemaining === 1 ? '' : 's'} remaining before
                    code expires.
                  </Typography>
                )}
              </Box>
            )}

            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading || otp.some((d) => !d) || isEmailBlocked || attemptsRemaining === 0}
              sx={{ height: 48, fontSize: '15px', mb: 2 }}
            >
              {loading ? (
                <CircularProgress size={22} color="inherit" />
              ) : isEmailBlocked || attemptsRemaining === 0 ? (
                'Account Locked (30 min)'
              ) : (
                'Verify & Continue'
              )}
            </Button>

            {/* Resend countdown and Back action */}
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 1.5,
                mt: 1,
              }}
            >
              {countdown > 0 ? (
                <Typography variant="caption" sx={{ color: theme.palette.tokens.textSecondary }}>
                  Resend code in{' '}
                  <Box
                    component="span"
                    sx={{ fontWeight: 600, color: theme.palette.tokens.textPrimary }}
                  >
                    {countdown}s
                  </Box>
                </Typography>
              ) : (
                <Button
                  variant="text"
                  size="small"
                  onClick={handleResendOtp}
                  disabled={loading || isEmailBlocked || attemptsRemaining === 0}
                  startIcon={<MailOutlineRoundedIcon fontSize="small" />}
                  sx={{ color: theme.palette.tokens.accent, fontWeight: 600 }}
                >
                  Resend Code
                </Button>
              )}

              <Button
                variant="text"
                size="small"
                onClick={() => {
                  setStep(1);
                  setCountdown(0);
                  setOtpError('');
                  setIsEmailBlocked(false);
                }}
                disabled={loading}
                startIcon={<ArrowBackRoundedIcon fontSize="small" />}
                sx={{ color: theme.palette.tokens.textSecondary }}
              >
                Change Email
              </Button>
            </Box>
          </form>
        )}
      </Card>
    </Box>
  );
};
