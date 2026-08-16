import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Grid from '@mui/material/Grid2';
import HourglassEmptyRoundedIcon from '@mui/icons-material/HourglassEmptyRounded';
import AttachMoneyRoundedIcon from '@mui/icons-material/AttachMoneyRounded';
import CampaignRoundedIcon from '@mui/icons-material/CampaignRounded';
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import MoreHorizRoundedIcon from '@mui/icons-material/MoreHorizRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import AssessmentRoundedIcon from '@mui/icons-material/AssessmentRounded';
import AutoGraphRoundedIcon from '@mui/icons-material/AutoGraphRounded';
import SecurityRoundedIcon from '@mui/icons-material/SecurityRounded';
import { useTheme } from '@mui/material/styles';

// Atoms
import {
  ColorSwatch,
  StatValue,
  DeltaBadge,
  TintCard,
  RailIconButton,
  IconSquare,
  SectionHeading,
  Pill,
  StatusChip,
  MoneyText,
  EmptyState,
  LoadingBlock,
} from '@atoms';

// Molecules
import {
  MetricCard,
  ChartCard,
  DataTable,
  DataTableColumn,
  PromoCard,
  UserMenu,
  FilterBar,
  ConfirmDialog,
  CommentDialog,
} from '@molecules';

import { navConfig } from '@routes/navConfig';
import { SidebarRail } from './SidebarRail';

interface SampleCampaignRow extends Record<string, unknown> {
  id: string;
  name: string;
  brand: string;
  influencer: string;
  influencerHandle: string;
  avatarUrl?: string;
  budget: string;
  reach: string;
  growth: number;
  rateStatus: string;
  brandStatus: string;
  isFavorite: boolean;
}

export const StyleGuideOrganism: React.FC = () => {
  const theme = useTheme();

  // FilterBar state
  const [activeFilterPill, setActiveFilterPill] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSort, setSelectedSort] = useState('newest');

  // Chart timeframe state
  const [chartTimeframe, setChartTimeframe] = useState('30D');

  // Standalone Pill demo state
  const [activeStandalonePill, setActiveStandalonePill] = useState('active');

  // Dialog states
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmVariant, setConfirmVariant] = useState<'neutral' | 'destructive'>('neutral');
  const [commentOpen, setCommentOpen] = useState(false);
  const [commentVariant, setCommentVariant] = useState<'neutral' | 'destructive'>('neutral');

  // Interactive table rows state
  const [tableRows, setTableRows] = useState<SampleCampaignRow[]>([
    {
      id: '1',
      name: 'Summer Glow Skincare Launch',
      brand: 'GlowSkin Co.',
      influencer: 'Alex Rivera',
      influencerHandle: '@alexrivera',
      budget: '45000',
      reach: '450,000',
      growth: 14.2,
      rateStatus: 'AGENCY_APPROVED',
      brandStatus: 'APPROVED',
      isFavorite: true,
    },
    {
      id: '2',
      name: 'HydraBoost Monsoon Series',
      brand: 'GlowSkin Co.',
      influencer: 'Maya Sen',
      influencerHandle: '@mayasen.glow',
      budget: '35000',
      reach: '280,000',
      growth: -2.4,
      rateStatus: 'SUBMITTED',
      brandStatus: 'PENDING_REVIEW',
      isFavorite: false,
    },
    {
      id: '3',
      name: 'Youth Serum Rebrand',
      brand: 'Nexus Tech',
      influencer: 'Rohan Mehra',
      influencerHandle: '@rohan.tech',
      budget: '60000',
      reach: '620,000',
      growth: 8.5,
      rateStatus: 'REVISION_REQUESTED',
      brandStatus: 'CORRECTION_REQUESTED',
      isFavorite: true,
    },
    {
      id: '4',
      name: 'Eco-Matte Sunscreen Promo',
      brand: 'Nexus Tech',
      influencer: 'Priya Sharma',
      influencerHandle: '@priya.creates',
      budget: '30000',
      reach: '310,000',
      growth: 0,
      rateStatus: 'PENDING_SUBMISSION',
      brandStatus: 'NOT_VISIBLE',
      isFavorite: false,
    },
  ]);

  const handleStarToggle = (row: SampleCampaignRow) => {
    setTableRows((prev) =>
      prev.map((r) => (r.id === row.id ? { ...r, isFavorite: !r.isFavorite } : r)),
    );
  };

  const swatches = [
    { name: 'Page Background', hex: '#EDF3F9', bg: theme.palette.tokens.pageBg, hasBorder: true },
    { name: 'Surface / Card', hex: '#FFFFFF', bg: theme.palette.tokens.surface, hasBorder: true },
    { name: 'Rail Sidebar', hex: '#1B1C1E', bg: theme.palette.tokens.rail },
    { name: 'Field Background', hex: '#F4F6F9', bg: theme.palette.tokens.fieldBg, hasBorder: true },
    { name: 'Text Primary', hex: '#101114', bg: theme.palette.tokens.textPrimary },
    { name: 'Text Secondary', hex: '#8A9099', bg: theme.palette.tokens.textSecondary },
    { name: 'Divider', hex: '#EEF0F3', bg: theme.palette.tokens.divider, hasBorder: true },
    { name: 'Accent', hex: '#2F80ED', bg: theme.palette.tokens.accent },
    { name: 'Positive', hex: '#2E9E5B', bg: theme.palette.tokens.positive },
    { name: 'Negative', hex: '#E05252', bg: theme.palette.tokens.negative },
    { name: 'Lavender Tint', hex: '#EDE7FB', bg: theme.palette.tints.lavender },
    { name: 'Mint Tint', hex: '#DEF2E5', bg: theme.palette.tints.mint },
    { name: 'Butter Tint', hex: '#FBF2D6', bg: theme.palette.tints.butter },
    { name: 'Sky Tint', hex: '#DCEAFA', bg: theme.palette.tints.sky },
  ];

  const chartData = [
    { label: 'Jan 01', value: 12000 },
    { label: 'Jan 07', value: 18500 },
    { label: 'Jan 14', value: 16000 },
    { label: 'Jan 21', value: 29000 },
    { label: 'Jan 28', value: 34000 },
    { label: 'Feb 04', value: 42500 },
    { label: 'Feb 11', value: 58000 },
  ];

  const tableColumns: Array<DataTableColumn<SampleCampaignRow>> = [
    {
      id: 'favorite',
      header: '',
      type: 'star',
      width: '48px',
      isStarred: (row) => row.isFavorite,
      onStarClick: handleStarToggle,
    },
    {
      id: 'campaign',
      header: 'Campaign & Brand',
      type: 'entity',
      accessor: 'name',
      subAccessor: 'brand',
    },
    {
      id: 'influencer',
      header: 'Influencer',
      type: 'entity',
      accessor: 'influencer',
      subAccessor: 'influencerHandle',
    },
    {
      id: 'budget',
      header: 'Budget',
      type: 'money',
      accessor: 'budget',
    },
    {
      id: 'growth',
      header: '30D Growth',
      type: 'delta',
      accessor: 'growth',
    },
    {
      id: 'rateStatus',
      header: 'Rate Status',
      type: 'status',
      accessor: 'rateStatus',
    },
    {
      id: 'brandStatus',
      header: 'Brand Status',
      type: 'status',
      accessor: 'brandStatus',
    },
    {
      id: 'actions',
      header: 'Actions',
      type: 'actions',
      align: 'right',
      render: (_row) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <IconButton size="small" onClick={() => {}}>
            <VisibilityRoundedIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={() => {}}>
            <EditRoundedIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={() => {}}>
            <MoreHorizRoundedIcon fontSize="small" />
          </IconButton>
        </Box>
      ),
    },
  ];

  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        backgroundColor: theme.palette.tokens.pageBg,
        padding: '16px',
        gap: '20px',
      }}
    >
      {/* 1. Floating Dark Sidebar Rail */}
      <SidebarRail
        items={navConfig.AGENCY}
        activePath="/style-guide"
        onNavigate={(path) => console.log('Navigated to:', path)}
        onLogout={() => console.log('Logged out')}
      />

      {/* 2. Main Content Surface */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: `${theme.customSpacing.cardGap}px`,
          maxWidth: 'calc(100% - 92px)',
        }}
      >
        {/* Top App Bar with UserMenu & Title */}
        <Card sx={{ padding: `${theme.customSpacing.cardPadding}px` }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h1">Style Guide & Component Library</Typography>
              <Typography
                variant="body1"
                sx={{ color: theme.palette.tokens.textSecondary, mt: '4px' }}
              >
                Atomic Design System: Tokens, Atoms, and Generic Molecules.
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <UserMenu
                user={{
                  name: 'Abin Fetch',
                  email: 'lead@fetch.com',
                  roleCode: 'AGENCY',
                }}
              />
            </Box>
          </Box>
        </Card>

        {/* Section 1: Molecule Showcase - Metric Cards (4 Tints) */}
        <Box>
          <SectionHeading
            title="Molecules: MetricCard (All 4 Pastel Tints)"
            subtitle="Composed of TintCard + IconSquare + StatValue + DeltaBadge"
          />
          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <MetricCard
                tint="lavender"
                title="Active Campaigns"
                value="28"
                icon={<CampaignRoundedIcon fontSize="small" />}
                delta={18.4}
                deltaLabel="vs last month"
                onKebabClick={() => {}}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <MetricCard
                tint="mint"
                title="Approved Payouts"
                value="₹24.8L"
                icon={<AttachMoneyRoundedIcon fontSize="small" />}
                delta={6.2}
                deltaLabel="vs budget"
                onKebabClick={() => {}}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <MetricCard
                tint="butter"
                title="Pending Approvals"
                value="9"
                icon={<HourglassEmptyRoundedIcon fontSize="small" />}
                delta={-12.5}
                deltaLabel="action needed"
                onKebabClick={() => {}}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <MetricCard
                tint="sky"
                title="Avg. Engagement"
                value="4.82%"
                icon={<AutoGraphRoundedIcon fontSize="small" />}
                delta={2.1}
                deltaLabel="top quartile"
                onKebabClick={() => {}}
              />
            </Grid>
          </Grid>
        </Box>

        {/* Section 2: Molecule Showcase - ChartCard & PromoCard */}
        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12, lg: 8 }}>
            <ChartCard
              title="Campaign Reach & Velocity"
              value="582,400"
              delta={24.6}
              deltaLabel="this cycle"
              activeTimeframe={chartTimeframe}
              onTimeframeChange={setChartTimeframe}
              data={chartData}
            />
          </Grid>
          <Grid size={{ xs: 12, lg: 4 }}>
            <PromoCard
              badgeText="Agency Hub"
              title="Scale Brand Collaborations"
              description="Unlock automated rate approvals, instant metrics aggregation, and segregated client reporting in one unified dashboard."
              ctaText="Explore Workflows"
              onCtaClick={() => {}}
              illustration={
                <IconSquare
                  icon={<SecurityRoundedIcon fontSize="large" />}
                  size={56}
                  bg="rgba(255, 255, 255, 0.1)"
                  color="#FFFFFF"
                />
              }
            />
          </Grid>
        </Grid>

        {/* Section 3: Molecule Showcase - Generic DataTable with FilterBar */}
        <Box>
          <SectionHeading
            title="Molecules: DataTable & FilterBar"
            subtitle="Generic column-config driven table used by all role screens (Entity, Money, Delta, Status, Star, Actions)"
          />
          <Card sx={{ padding: `${theme.customSpacing.cardPadding}px`, mb: 2 }}>
            <FilterBar
              pills={[
                { id: 'all', label: 'All Campaigns', count: 24 },
                { id: 'approved', label: 'Approved', count: 14 },
                { id: 'pending', label: 'Pending Review', count: 6 },
                { id: 'corrections', label: 'Corrections', count: 4 },
              ]}
              activePillId={activeFilterPill}
              onPillChange={setActiveFilterPill}
              searchValue={searchQuery}
              onSearchChange={setSearchQuery}
              selectOptions={[
                { value: 'newest', label: 'Newest First' },
                { value: 'budget_high', label: 'Highest Budget' },
                { value: 'reach_high', label: 'Highest Reach' },
              ]}
              selectedOption={selectedSort}
              onSelectChange={setSelectedSort}
              selectLabel="Sort by"
              extraAction={
                <Button variant="contained" startIcon={<AddRoundedIcon fontSize="small" />}>
                  New Campaign
                </Button>
              }
            />
          </Card>

          <DataTable<SampleCampaignRow>
            columns={tableColumns}
            rows={tableRows}
            onRowClick={(row) => console.log('Row clicked:', row.id)}
          />
        </Box>

        {/* Section 4: Molecule Showcase - Interactive Dialogs */}
        <Card sx={{ padding: `${theme.customSpacing.cardPadding}px` }}>
          <SectionHeading
            title="Molecules: ConfirmDialog & CommentDialog"
            subtitle="Interactive modal dialogs for critical state transitions, destructive actions, and rejection flows"
          />
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <Button
              variant="outlined"
              onClick={() => {
                setConfirmVariant('neutral');
                setConfirmOpen(true);
              }}
            >
              Open Neutral ConfirmDialog
            </Button>
            <Button
              variant="contained"
              sx={{
                backgroundColor: theme.palette.tokens.negative,
                '&:hover': { backgroundColor: '#B91C1C' },
              }}
              onClick={() => {
                setConfirmVariant('destructive');
                setConfirmOpen(true);
              }}
            >
              Open Destructive ConfirmDialog
            </Button>
            <Button
              variant="dark"
              onClick={() => {
                setCommentVariant('neutral');
                setCommentOpen(true);
              }}
            >
              Open Correction CommentDialog
            </Button>
            <Button
              variant="contained"
              sx={{
                backgroundColor: theme.palette.tokens.negative,
                '&:hover': { backgroundColor: '#B91C1C' },
              }}
              onClick={() => {
                setCommentVariant('destructive');
                setCommentOpen(true);
              }}
            >
              Open Rejection CommentDialog
            </Button>
          </Box>
        </Card>

        {/* Section 5: Atom Showcase - TintCard, StatValue, Pill, StatusChip, MoneyText, DeltaBadge */}
        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12, md: 6 }}>
            <TintCard
              title="Atoms: TintCard & StatValue"
              subtitle="Card with custom tint prop, title slot, and bold StatValue figures"
            >
              <Box sx={{ display: 'flex', gap: 4, my: 2 }}>
                <StatValue value="1,248" label="Registered Creators" />
                <StatValue
                  value="99.4%"
                  label="Platform Uptime"
                  valueColor={theme.palette.tokens.positive}
                />
                <StatValue
                  value="₹42.5L"
                  label="Processed Volume"
                  valueColor={theme.palette.tokens.accent}
                />
              </Box>
              <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                <Pill
                  label="All Statuses"
                  selected={activeStandalonePill === 'all'}
                  onClick={() => setActiveStandalonePill('all')}
                  count={42}
                />
                <Pill
                  label="Active"
                  selected={activeStandalonePill === 'active'}
                  onClick={() => setActiveStandalonePill('active')}
                  count={28}
                />
                <Pill
                  label="Completed"
                  selected={activeStandalonePill === 'completed'}
                  onClick={() => setActiveStandalonePill('completed')}
                  count={14}
                />
              </Box>
            </TintCard>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ padding: `${theme.customSpacing.cardPadding}px`, height: '100%' }}>
              <Typography variant="h2" sx={{ mb: 1 }}>
                Atoms: StatusChip (State Mappings)
              </Typography>
              <Typography variant="body2" sx={{ color: theme.palette.tokens.textSecondary, mb: 2 }}>
                Automatic color and label mapping for rate_status, brand_status, and lifecycle
                states.
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                <StatusChip status="PENDING_SUBMISSION" />
                <StatusChip status="SUBMITTED" />
                <StatusChip status="AGENCY_APPROVED" />
                <StatusChip status="REVISION_REQUESTED" />
                <StatusChip status="NOT_VISIBLE" />
                <StatusChip status="PENDING_REVIEW" />
                <StatusChip status="APPROVED" />
                <StatusChip status="REJECTED" />
                <StatusChip status="CORRECTION_REQUESTED" />
                <StatusChip status="PAID" />
                <StatusChip status="CANCELLED" />
              </Box>
            </Card>
          </Grid>
        </Grid>

        {/* Section 6: Atom Showcase - MoneyText & DeltaBadge */}
        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ padding: `${theme.customSpacing.cardPadding}px`, height: '100%' }}>
              <Typography variant="h2" sx={{ mb: 1 }}>
                Atoms: MoneyText & Currency Formatting
              </Typography>
              <Typography variant="body2" sx={{ color: theme.palette.tokens.textSecondary, mb: 2 }}>
                Decimal string INR currency formatting (full & compact).
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Box
                  sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <Typography variant="body2">Full INR Amount:</Typography>
                  <MoneyText amount="1250000" variant="h3" />
                </Box>
                <Box
                  sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <Typography variant="body2">Compact INR Amount (Lakhs):</Typography>
                  <MoneyText amount="1840000" compact variant="h3" />
                </Box>
                <Box
                  sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <Typography variant="body2">Delta Badges:</Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <DeltaBadge delta={18.5} label="growth" />
                    <DeltaBadge delta={-6.2} label="dip" />
                    <DeltaBadge delta={0} label="even" />
                  </Box>
                </Box>
              </Box>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ padding: `${theme.customSpacing.cardPadding}px`, height: '100%' }}>
              <Typography variant="h2" sx={{ mb: 1 }}>
                Theme Input Overrides & Form Controls
              </Typography>
              <Typography variant="body2" sx={{ color: theme.palette.tokens.textSecondary, mb: 2 }}>
                Filled variant on #F4F6F9 with 16px radius and 1px accent focus ring.
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="Campaign Name"
                  defaultValue="Summer Glow Skincare Launch"
                  fullWidth
                />
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                  <Chip
                    label="Sky Chip"
                    sx={{
                      backgroundColor: theme.palette.tints.sky,
                      color: theme.palette.tokens.accent,
                    }}
                  />
                  <Chip
                    label="Mint Chip"
                    sx={{
                      backgroundColor: theme.palette.tints.mint,
                      color: theme.palette.tokens.positive,
                    }}
                  />
                  <Chip
                    label="Lavender Chip"
                    sx={{
                      backgroundColor: theme.palette.tints.lavender,
                      color: theme.palette.tokens.purpleText,
                    }}
                  />
                  <Chip
                    label="Butter Chip"
                    sx={{
                      backgroundColor: theme.palette.tints.butter,
                      color: theme.palette.tokens.warningText,
                    }}
                  />
                </Box>
              </Box>
            </Card>
          </Grid>
        </Grid>

        {/* Section 7: Atom Showcase - EmptyState & LoadingBlock Skeletons */}
        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12, md: 6 }}>
            <EmptyState
              title="No active submissions"
              description="When creators submit their rates and deliverables for approval, they will appear here."
              action={
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<AddRoundedIcon fontSize="small" />}
                >
                  Invite Influencer
                </Button>
              }
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <LoadingBlock variant="table" rows={3} />
          </Grid>
        </Grid>

        {/* Section 8: Atom Showcase - RailIconButton, IconSquare, Swatches */}
        <Card sx={{ padding: `${theme.customSpacing.cardPadding}px` }}>
          <SectionHeading
            title="Atoms: IconSquare, RailIconButton & Color Swatches"
            subtitle="Fundamental atomic components, icon containers, and color palette tokens"
          />
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', mb: 3 }}>
            <IconSquare icon={<CampaignRoundedIcon fontSize="small" />} />
            <IconSquare
              icon={<AssessmentRoundedIcon fontSize="small" />}
              bg={theme.palette.tints.sky}
              color={theme.palette.tokens.accent}
            />
            <IconSquare
              icon={<AttachMoneyRoundedIcon fontSize="small" />}
              bg={theme.palette.tints.mint}
              color={theme.palette.tokens.positive}
            />
            <IconSquare
              icon={<HourglassEmptyRoundedIcon fontSize="small" />}
              bg={theme.palette.tints.butter}
              color={theme.palette.tokens.warningText}
            />
            <IconSquare
              icon={<PeopleAltRoundedIcon fontSize="small" />}
              bg={theme.palette.tints.lavender}
              color={theme.palette.tokens.purpleText}
            />
            <RailIconButton
              icon={<CampaignRoundedIcon fontSize="small" />}
              label="Rail Button Active"
              active={true}
            />
            <RailIconButton
              icon={<AssessmentRoundedIcon fontSize="small" />}
              label="Rail Button Inactive"
              active={false}
            />
          </Box>

          <Grid container spacing={2}>
            {swatches.map((s) => (
              <Grid key={s.name} size={{ xs: 6, sm: 4, md: 3, lg: 2.4 }}>
                <ColorSwatch {...s} />
              </Grid>
            ))}
          </Grid>
        </Card>
      </Box>

      {/* Render Dialogs */}
      <ConfirmDialog
        open={confirmOpen}
        title={
          confirmVariant === 'destructive'
            ? 'Revoke Influencer Assignment?'
            : 'Approve Campaign Submission'
        }
        body={
          confirmVariant === 'destructive'
            ? 'This will soft-delete the influencer assignment from this campaign. This action can be audited.'
            : 'This will lock the rate and make the campaign budget visible to the brand.'
        }
        confirmText={confirmVariant === 'destructive' ? 'Revoke Assignment' : 'Approve Submission'}
        variant={confirmVariant}
        onConfirm={() => {
          setConfirmOpen(false);
        }}
        onCancel={() => setConfirmOpen(false)}
      />

      <CommentDialog
        open={commentOpen}
        title={commentVariant === 'destructive' ? 'Reject Deliverable' : 'Request Rate Correction'}
        subtitle="Please specify detailed feedback for the creator or brand manager."
        placeholder="Type clear and concise feedback..."
        confirmText={
          commentVariant === 'destructive' ? 'Reject with Reason' : 'Send Correction Request'
        }
        variant={commentVariant}
        onConfirm={(comment) => {
          console.log('Submitted comment:', comment);
          setCommentOpen(false);
        }}
        onCancel={() => setCommentOpen(false)}
      />
    </Box>
  );
};
