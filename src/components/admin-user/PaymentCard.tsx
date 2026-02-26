import { UserPayment } from '../../data/userProfileData';

type PaymentCardProps = {
  payment: UserPayment;
};

const statusStyles = {
  active: { bg: '#ecfdf5', text: '#10b981', label: 'Active' },
  cancelled: { bg: '#fef2f2', text: '#ef4444', label: 'Cancelled' },
  expired: { bg: '#f3f4f6', text: '#6b7280', label: 'Expired' }
};

const packagePrices = {
  starter: 'Starter',
  standard: 'Standard',
  premium: 'Premium'
};

export default function PaymentCard({ payment }: PaymentCardProps) {
  const status = statusStyles[payment.subscriptionStatus];
  const renewalDate = new Date(payment.renewalDate);
  const renewalText = renewalDate.toLocaleDateString();

  return (
    <div className="rounded-hero border border-borderGray bg-white p-6 shadow-card">
      <h3 className="text-lg font-bold text-textMain mb-4">Payment & Subscription</h3>

      <div className="space-y-4">
        {/* Subscription Status */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-muted/60 mb-2">Status</p>
          <div
            className="inline-flex items-center rounded-lg px-3 py-1.5 text-sm font-semibold"
            style={{
              backgroundColor: status.bg,
              color: status.text
            }}
          >
            {status.label}
          </div>
        </div>

        {/* Package Type */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-muted/60 mb-1">Package</p>
          <p className="text-sm font-semibold text-textMain">{packagePrices[payment.packageType]}</p>
        </div>

        {/* Amount */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted/60 mb-1">Amount</p>
            <p className="text-lg font-bold text-textMain">
              {payment.amount}
              <span className="text-xs text-muted ml-1">{payment.currency}</span>
            </p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted/60 mb-1">Cycle</p>
            <p className="text-sm font-semibold text-textMain capitalize">{payment.billingCycle}</p>
          </div>
        </div>

        {payment.subscriptionStatus === 'active' && (
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted/60 mb-1">Next Renewal</p>
            <p className="text-sm font-semibold text-textMain">{renewalText}</p>
          </div>
        )}

        {/* Payment History */}
        {payment.transactionHistory.length > 0 && (
          <div className="border-t border-borderGray/40 pt-4">
            <p className="text-xs font-bold uppercase tracking-widest text-muted/60 mb-3">Recent Transactions</p>
            <div className="space-y-2">
              {payment.transactionHistory.slice(0, 3).map((txn, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-lg bg-primaryBg/30 p-2"
                >
                  <div>
                    <p className="text-xs font-semibold text-textMain">
                      {new Date(txn.date).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-muted capitalize">{txn.status}</p>
                  </div>
                  <p className="text-sm font-bold text-primary">
                    {txn.amount} {payment.currency}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
