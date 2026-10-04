import React from 'react';
import { Retailer, DisputeItem, Order, NavTab } from '../types';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToTab: (tab: NavTab) => void;
  pendingRetailers?: Retailer[];
  disputes?: DisputeItem[];
  orders?: Order[];
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
  onNavigateToTab,
  pendingRetailers = [],
  disputes = [],
  orders = []
}) => {
  if (!isOpen) return null;

  // Build 100% dynamic notifications from real Firestore state
  const dynamicNotifications: {
    id: string;
    title: string;
    desc: string;
    time: string;
    type: 'urgent' | 'info' | 'success';
    tab: NavTab;
  }[] = [];

  // 1. Pending retailer onboarding notifications
  pendingRetailers.forEach((r) => {
    dynamicNotifications.push({
      id: `pending-${r.id}`,
      title: `Store Application: ${r.shopName}`,
      desc: `${r.ownerName} submitted verification details for ${r.category} in ${r.city}.`,
      time: r.createdAt ? new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent',
      type: 'urgent',
      tab: 'retailers'
    });
  });

  // 2. Real disputes notifications
  disputes.forEach((d) => {
    dynamicNotifications.push({
      id: `dispute-${d.id}`,
      title: `Escrow Hold: ${d.orderId}`,
      desc: `${d.issue || 'Escrow dispute requires arbitration'} (${d.town || 'HP North'}).`,
      time: 'Action Needed',
      type: 'urgent',
      tab: 'disputes'
    });
  });

  // 3. Recent orders if any
  const recentOrders = orders.slice(0, 3);
  recentOrders.forEach((o) => {
    dynamicNotifications.push({
      id: `order-${o.id}`,
      title: `Live Order: ${o.orderNumber || o.id.slice(0, 8)}`,
      desc: `${o.customerName} placed ₹${o.totalAmount} ${o.fulfillmentType} with ${o.retailerName}.`,
      time: o.createdAt ? new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Live',
      type: 'info',
      tab: 'orders'
    });
  });

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end p-4 pt-16 sm:p-6 sm:pt-20">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-xs" onClick={onClose} />

      <div className="relative w-full max-w-md bg-surface-container-lowest rounded-2xl shadow-2xl border border-outline-variant/30 overflow-hidden z-10 animate-in fade-in slide-in-from-top-4 duration-150">
        <div className="px-5 py-4 border-b border-outline-variant/20 flex items-center justify-between bg-surface-container-low">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-on-surface">notifications</span>
            <span className="font-headline-sm text-headline-sm text-on-surface font-bold">
              Cluster Notifications
            </span>
            {dynamicNotifications.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-bold">
                {dynamicNotifications.length}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-on-surface-variant hover:bg-surface-container transition"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <div className="p-4 space-y-3 max-h-[70vh] overflow-y-auto">
          {dynamicNotifications.length === 0 ? (
            <div className="py-12 text-center text-on-surface-variant space-y-2">
              <span className="material-symbols-outlined text-[36px] text-secondary">check_circle</span>
              <p className="font-label-md text-label-md font-bold text-on-surface">
                No new notifications right now.
              </p>
              <p className="font-body-sm text-body-sm max-w-xs mx-auto">
                All retailer verifications, orders, and merchant escrows are completely up to date.
              </p>
            </div>
          ) : (
            dynamicNotifications.map((n) => (
              <div
                key={n.id}
                className={`p-3 rounded-xl border transition-colors cursor-pointer ${
                  n.type === 'urgent'
                    ? 'bg-error-container/20 border-error/30 hover:bg-error-container/30'
                    : 'bg-surface-container-low border-outline-variant/20 hover:bg-surface-container'
                }`}
                onClick={() => {
                  onNavigateToTab(n.tab);
                  onClose();
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-label-md text-label-md text-on-surface font-bold">
                    {n.title}
                  </span>
                  <span className="font-body-sm text-[11px] text-on-surface-variant shrink-0">
                    {n.time}
                  </span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 leading-snug">
                  {n.desc}
                </p>
              </div>
            ))
          )}
        </div>

        <div className="p-3 border-t border-outline-variant/20 bg-surface-container-low flex justify-between items-center text-[12px] text-on-surface-variant">
          <span>Himachal Pradesh North Region</span>
          <button
            onClick={onClose}
            className="text-secondary font-bold hover:underline"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
