import { useEffect, useMemo, useState } from 'react';
import Header from '../components/Header';
import { apiJson, apiRequest } from '../utils/api';

type FinancialRow = {
  period: string;
  total_amount: string;
  paid_count: number;
  pending_count: number;
  failed_count: number;
};

type InsuranceRow = {
  insurance_provider: string;
  total_amount: string;
  payments_count: number;
};

type FinancialReport = {
  from_date: string;
  to_date: string;
  granularity: 'daily' | 'monthly';
  total_amount: string;
  rows: FinancialRow[];
  insurance_breakdown: InsuranceRow[];
};

type ProfileUpdateRequest = {
  id: string;
  doctor_user_id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  admin_note: string | null;
  created_at: string;
};

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString();
}

function isoDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

export default function AdminFinancialReportsPage() {
  const today = useMemo(() => new Date(), []);
  const thirtyDaysAgo = useMemo(() => new Date(Date.now() - 29 * 24 * 60 * 60 * 1000), []);

  const [fromDate, setFromDate] = useState(isoDate(thirtyDaysAgo));
  const [toDate, setToDate] = useState(isoDate(today));
  const [granularity, setGranularity] = useState<'daily' | 'monthly'>('daily');
  const [report, setReport] = useState<FinancialReport | null>(null);
  const [pendingUpdates, setPendingUpdates] = useState<ProfileUpdateRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);

  const loadPage = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [reportPayload, updatesPayload] = await Promise.all([
        apiJson<FinancialReport>(
          `/admin/financial-reports?from_date=${fromDate}&to_date=${toDate}&granularity=${granularity}`,
          undefined,
          true,
          'Failed to load financial report'
        ),
        apiJson<ProfileUpdateRequest[]>(
          '/admin/profile-updates?status=PENDING',
          undefined,
          true,
          'Failed to load pending profile updates'
        )
      ]);
      setReport(reportPayload);
      setPendingUpdates(updatesPayload);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to load admin financial page');
      setReport(null);
      setPendingUpdates([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadPage();
  }, []);

  const downloadCsv = async () => {
    setBusyAction('csv');
    setErrorMessage(null);
    try {
      const response = await apiRequest(
        `/admin/financial-reports?from_date=${fromDate}&to_date=${toDate}&granularity=${granularity}&output=csv`,
        undefined,
        true
      );
      if (!response.ok) {
        throw new Error(`Failed to download CSV (${response.status})`);
      }
      const text = await response.text();
      const blob = new Blob([text], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `financial-report-${fromDate}-${toDate}.csv`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to download CSV');
    } finally {
      setBusyAction(null);
    }
  };

  const reviewProfileUpdate = async (requestId: string, status: 'APPROVED' | 'REJECTED') => {
    setBusyAction(`${status}_${requestId}`);
    setErrorMessage(null);
    try {
      await apiJson(
        `/admin/profile-updates/${requestId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status,
            admin_note: status === 'APPROVED' ? 'Approved by admin review.' : 'Rejected by admin review.'
          })
        },
        true,
        'Failed to review update request'
      );
      await loadPage();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to review update request');
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-cyan-50/40 via-white to-white text-textMain">
      <Header
        brandHref="/admin/financial-reports"
        navItems={[
          { labelKey: 'nav.dashboard', href: '/admin/applications' },
          { labelKey: 'nav.users', href: '/admin/users' },
          { labelKey: 'nav.about', href: '/about' }
        ]}
      />

      <main className="section-shell py-6 sm:py-8">
        <section className="rounded-hero border border-cyan-100 bg-white p-6 shadow-card">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-textMain sm:text-3xl">Financial & Insurance Reports</h1>
              <p className="mt-2 text-sm text-muted">Track daily/monthly totals and insurance-provider breakdowns.</p>
            </div>
            <button
              type="button"
              onClick={() => void loadPage()}
              className="rounded-lg border border-borderGray px-3 py-2 text-xs font-semibold text-textMain transition hover:border-primary/40 hover:text-primary"
            >
              Refresh
            </button>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-4">
            <label className="text-xs font-semibold text-muted">
              From
              <input
                type="date"
                value={fromDate}
                onChange={(event) => setFromDate(event.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-borderGray bg-white px-3 text-sm text-textMain"
              />
            </label>
            <label className="text-xs font-semibold text-muted">
              To
              <input
                type="date"
                value={toDate}
                onChange={(event) => setToDate(event.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-borderGray bg-white px-3 text-sm text-textMain"
              />
            </label>
            <label className="text-xs font-semibold text-muted">
              Granularity
              <select
                value={granularity}
                onChange={(event) => setGranularity(event.target.value as 'daily' | 'monthly')}
                className="mt-1 h-10 w-full rounded-lg border border-borderGray bg-white px-3 text-sm text-textMain"
              >
                <option value="daily">Daily</option>
                <option value="monthly">Monthly</option>
              </select>
            </label>
            <button
              type="button"
              onClick={() => void loadPage()}
              className="mt-5 h-10 rounded-lg bg-primary px-3 text-sm font-semibold text-white transition hover:bg-primaryDark"
            >
              Load Report
            </button>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void downloadCsv()}
              disabled={busyAction === 'csv'}
              className="rounded-lg border border-borderGray bg-white px-3 py-1.5 text-xs font-semibold text-textMain transition hover:border-primary/40 hover:text-primary disabled:opacity-60"
            >
              {busyAction === 'csv' ? 'Preparing...' : 'Download CSV'}
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="rounded-lg border border-borderGray bg-white px-3 py-1.5 text-xs font-semibold text-textMain transition hover:border-primary/40 hover:text-primary"
            >
              Download PDF (Print)
            </button>
          </div>

          {errorMessage && (
            <p className="mt-4 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">{errorMessage}</p>
          )}
        </section>

        <section className="mt-6 rounded-hero border border-borderGray bg-white p-6 shadow-card">
          <h2 className="text-xl font-black text-textMain">Financial Summary</h2>
          {isLoading ? (
            <p className="mt-4 text-sm text-muted">Loading report...</p>
          ) : !report ? (
            <p className="mt-4 text-sm text-muted">No report data available.</p>
          ) : (
            <>
              <p className="mt-2 text-sm text-muted">
                {report.from_date} to {report.to_date} • Total: {report.total_amount}
              </p>
              <div className="mt-4 overflow-x-auto rounded-xl border border-borderGray">
                <table className="min-w-full divide-y divide-borderGray text-left text-xs">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-3 py-2 font-black uppercase tracking-wide text-muted">Period</th>
                      <th className="px-3 py-2 font-black uppercase tracking-wide text-muted">Total Amount</th>
                      <th className="px-3 py-2 font-black uppercase tracking-wide text-muted">Paid</th>
                      <th className="px-3 py-2 font-black uppercase tracking-wide text-muted">Pending</th>
                      <th className="px-3 py-2 font-black uppercase tracking-wide text-muted">Failed</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-borderGray bg-white">
                    {report.rows.map((row) => (
                      <tr key={row.period}>
                        <td className="px-3 py-2 text-textMain">{row.period}</td>
                        <td className="px-3 py-2 text-textMain">{row.total_amount}</td>
                        <td className="px-3 py-2 text-textMain">{row.paid_count}</td>
                        <td className="px-3 py-2 text-textMain">{row.pending_count}</td>
                        <td className="px-3 py-2 text-textMain">{row.failed_count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <h3 className="mt-5 text-sm font-bold text-textMain">Insurance Breakdown</h3>
              <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {report.insurance_breakdown.map((item) => (
                  <article key={item.insurance_provider} className="rounded-lg border border-borderGray bg-slate-50 p-3">
                    <p className="text-xs font-bold text-textMain">{item.insurance_provider}</p>
                    <p className="mt-1 text-xs text-muted">Total: {item.total_amount}</p>
                    <p className="mt-1 text-xs text-muted">Payments: {item.payments_count}</p>
                  </article>
                ))}
              </div>
            </>
          )}
        </section>

        <section className="mt-6 rounded-hero border border-borderGray bg-white p-6 shadow-card">
          <h2 className="text-xl font-black text-textMain">Pending Doctor Profile Updates</h2>
          {pendingUpdates.length === 0 ? (
            <p className="mt-4 text-sm text-muted">No pending update requests.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {pendingUpdates.map((item) => (
                <article key={item.id} className="rounded-xl border border-borderGray bg-slate-50 p-4">
                  <p className="text-xs text-muted">Doctor #{item.doctor_user_id.slice(0, 8)}</p>
                  <p className="mt-1 text-sm text-textMain">Requested: {formatDate(item.created_at)}</p>
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => void reviewProfileUpdate(item.id, 'APPROVED')}
                      disabled={busyAction === `APPROVED_${item.id}`}
                      className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => void reviewProfileUpdate(item.id, 'REJECTED')}
                      disabled={busyAction === `REJECTED_${item.id}`}
                      className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-rose-700 disabled:opacity-60"
                    >
                      Reject
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
