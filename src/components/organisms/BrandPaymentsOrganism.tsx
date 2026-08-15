import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import { DashboardLayout } from '@templates';
import { navConfig } from '@routes/navConfig';
import { DataTable, DataTableColumn, FilterBar } from '@molecules';
import { SectionHeading, MoneyText } from '@atoms';
import { useBrandPayments, useApprovePayment } from '@api';
import { PaymentResponse } from '@contracts';
import { useAuth, useDebounce, useEnumPills, useToast, useViewFilters } from '@hooks';

export const BrandPaymentsOrganism: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { showSuccess, showError } = useToast();

  const {
    activePill,
    setActivePill,
    search,
    setSearch,
    page,
    setPage,
    rowsPerPage,
    setRowsPerPage,
  } = useViewFilters('brandPayments');
  const debouncedSearch = useDebounce(search, 300);

  const {
    data: paymentsData,
    isLoading: paymentsLoading,
    isFetching: paymentsFetching,
  } = useBrandPayments({
    status: activePill !== 'ALL' ? activePill : undefined,
    search: debouncedSearch.trim() || undefined,
    page: page + 1,
    limit: rowsPerPage,
  });

  const payments = paymentsData?.items || [];
  const totalPayments = paymentsData?.total ?? payments.length;

  const approvePaymentMutation = useApprovePayment();

  // Was filtering on DISBURSED, which is not a PaymentStatus at all — that pill
  // could never match a row. The registry supplies the real set.
  const statusPills = useEnumPills('PAYMENT_STATUS', 'All Payments');

  const handleApprovePayment = async (paymentId: string) => {
    try {
      await approvePaymentMutation.mutateAsync(paymentId);
      showSuccess('Deliverable payment authorized successfully.');
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      showError(
        errorObj?.response?.data?.message || errorObj?.message || 'Failed to authorize payment.',
      );
    }
  };

  const columns: Array<DataTableColumn<PaymentResponse>> = [
    {
      id: 'id',
      header: 'Disbursement Reference',
      type: 'entity',
      accessor: (row) => `Payment Ref #${row.id.slice(0, 8)}`,
      subAccessor: (row) => row.note || 'Milestone deliverable payment',
    },
    {
      id: 'amount',
      header: 'Disbursement Amount',
      type: 'custom',
      render: (row) => <MoneyText amount={row.amount} currency={row.currency} variant="body2" />,
    },
    {
      id: 'status',
      header: 'Payment Status',
      type: 'status',
      accessor: 'status',
    },
    {
      id: 'raisedOn',
      header: 'Raised Date',
      type: 'text',
      accessor: (row) =>
        row.raisedOn ? new Date(row.raisedOn).toLocaleDateString('en-IN') : 'Recent',
    },
    {
      id: 'actions',
      header: 'Authorization',
      type: 'actions',
      align: 'right',
      render: (row) => {
        const isPending = row.status === 'PENDING_APPROVAL';
        return isPending ? (
          <Button
            variant="contained"
            size="small"
            startIcon={<CheckCircleRoundedIcon fontSize="small" />}
            onClick={() => handleApprovePayment(row.id)}
            disabled={approvePaymentMutation.isPending}
          >
            Authorize Payment
          </Button>
        ) : (
          <Typography variant="caption" sx={{ color: '#2E9E5B', fontWeight: 600 }}>
            Authorized
          </Typography>
        );
      },
    },
  ];

  return (
    <DashboardLayout
      title="Payment Authorization Queue"
      subtitle="Verify and authorize deliverable disbursements for campaign creators"
      navItems={navConfig.BRAND}
      activePath={location.pathname}
      user={{
        name: user?.profile?.fullName || 'Brand Manager',
        email: user?.email,
        roleCode: 'BRAND',
      }}
      onNavigate={(path) => navigate(path)}
      onLogout={logout}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        <SectionHeading
          title="Deliverable Payments"
          subtitle="Pending creator disbursements verified by your agency"
        />

        <FilterBar
          pills={statusPills}
          activePillId={activePill}
          onPillChange={setActivePill}
          searchValue={search}
          onSearchChange={setSearch}
        />

        <DataTable<PaymentResponse>
          columns={columns}
          rows={payments}
          totalRows={totalPayments}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={setPage}
          onRowsPerPageChange={(limit) => {
            setRowsPerPage(limit);
            setPage(0);
          }}
          loading={paymentsLoading}
          isFetching={paymentsFetching}
        />
      </Box>
    </DashboardLayout>
  );
};
