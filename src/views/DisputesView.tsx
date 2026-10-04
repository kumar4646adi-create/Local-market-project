import React, { useState } from 'react';
import { DisputeItem } from '../types';

interface DisputesViewProps {
  disputes: DisputeItem[];
  onResolveDispute: (id: string) => void;
}

export const DisputesView: React.FC<DisputesViewProps> = ({ disputes, onResolveDispute }) => {
  const [selectedDispute, setSelectedDispute] = useState<DisputeItem | null>(null);
  const [resolutionNote, setResolutionNote] = useState('Refund approved and credited to customer UPI wallet. Merchant fee adjusted.');

  const totalEscrow = disputes.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
  const avgResolution = disputes.length > 0 ? '14.2 mins' : '—';
  const satisfactionIndex = disputes.length > 0 ? '99.4%' : '—';

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[24px] text-error">support_agent</span>
            <h1 className="font-headline-lg text-headline-lg text-on-surface font-bold">
              Disputes & Merchant Escrow Desk
            </h1>
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant mt-0.5">
            Real-time arbitration of counter pass disputes, stock discrepancies, and customer refund claims.
          </p>
        </div>

        <span className={`px-3 py-1 rounded-full font-label-sm text-label-sm font-bold w-max ${
          disputes.length > 0 ? 'bg-error-container text-on-error-container' : 'bg-secondary-container text-on-secondary-container'
        }`}>
          {disputes.length} Active Escrow Hold{disputes.length === 1 ? '' : 's'}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/20 shadow-xs">
          <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-semibold">Total Escrow At Stake</span>
          <p className="font-headline-lg text-headline-lg font-bold text-on-surface mt-1">₹{totalEscrow.toLocaleString('en-IN')}</p>
        </div>
        <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/20 shadow-xs">
          <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-semibold">Average Resolution Time</span>
          <p className="font-headline-lg text-headline-lg font-bold text-secondary mt-1">{avgResolution}</p>
        </div>
        <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/20 shadow-xs">
          <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-semibold">Customer Satisfaction Index</span>
          <p className="font-headline-lg text-headline-lg font-bold text-on-surface mt-1">{satisfactionIndex}</p>
        </div>
      </div>

      <div className="bg-surface-container-lowest rounded-xl p-5 shadow-xs border border-outline-variant/20 space-y-4">
        <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
          Active Dispute Queue ({disputes.length})
        </h3>

        <div className="space-y-3">
          {disputes.map((dispute) => (
            <div
              key={dispute.id}
              className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/20 flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-error-container text-on-error-container shrink-0 mt-0.5">
                  <span className="material-symbols-outlined text-[20px]">report_problem</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-label-md text-label-md font-bold text-on-surface">
                      {dispute.orderId}
                    </span>
                    <span className="font-label-sm text-label-sm bg-surface-container-highest px-2 py-0.5 rounded text-on-surface-variant font-bold">
                      {dispute.town}
                    </span>
                    <span className="font-label-sm text-label-sm text-error font-bold uppercase">
                      {dispute.severity} priority
                    </span>
                  </div>
                  <h4 className="font-label-md text-label-md font-bold text-on-surface mt-1">
                    {dispute.issue}
                  </h4>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                    {dispute.details}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <span className="font-body-sm text-body-sm text-on-surface-variant">Escrow Amount</span>
                  <p className="font-headline-sm text-[16px] font-bold text-on-surface">₹{dispute.amount}</p>
                </div>
                <button
                  onClick={() => setSelectedDispute(dispute)}
                  className="px-4 py-2 rounded-lg bg-primary hover:bg-neutral-800 text-on-primary font-label-md text-label-md font-bold shadow-xs transition"
                >
                  Arbitrate
                </button>
              </div>
            </div>
          ))}

          {disputes.length === 0 && (
            <div className="text-center py-12 text-on-surface-variant font-body-md text-body-md space-y-1">
              <span className="material-symbols-outlined text-[36px] text-secondary mb-2">check_circle</span>
              <p className="font-bold text-on-surface">No active disputes.</p>
              <p className="text-on-surface-variant text-body-sm">All escrow accounts balanced across Himachal North Cluster.</p>
            </div>
          )}
        </div>
      </div>

      {/* Resolution Dialog */}
      {selectedDispute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedDispute(null)} />
          <div className="relative w-full max-w-lg bg-surface-container-lowest rounded-2xl shadow-xl p-6 z-10 border border-outline-variant/30 space-y-4">
            <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
              Arbitrate Dispute {selectedDispute.orderId}
            </h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Customer: Ghumarwin Consumer • Order Total: ₹{selectedDispute.amount}
            </p>

            <div className="p-3 bg-surface-container-low rounded-lg text-body-sm font-body-sm">
              <p className="font-bold text-on-surface">{selectedDispute.issue}</p>
              <p className="text-on-surface-variant mt-1">{selectedDispute.details}</p>
            </div>

            <div>
              <label className="block font-label-md text-label-md font-semibold text-on-surface mb-1">
                Resolution Determination:
              </label>
              <textarea
                value={resolutionNote}
                onChange={(e) => setResolutionNote(e.target.value)}
                rows={3}
                className="w-full p-2.5 rounded-lg bg-surface-container-low border border-outline-variant/40 font-body-sm text-body-sm text-on-surface focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedDispute(null)}
                className="px-4 py-2 rounded-lg text-on-surface font-label-md text-label-md hover:bg-surface-container transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onResolveDispute(selectedDispute.id);
                  setSelectedDispute(null);
                }}
                className="px-4 py-2 rounded-lg bg-secondary text-on-secondary font-label-md text-label-md font-bold hover:opacity-95 shadow-sm transition"
              >
                Approve Refund & Close Case
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
