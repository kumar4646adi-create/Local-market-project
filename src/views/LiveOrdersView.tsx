import React, { useState } from 'react';
import { LiveOrder } from '../types';

interface LiveOrdersViewProps {
  orders: LiveOrder[];
}

export const LiveOrdersView: React.FC<LiveOrdersViewProps> = ({ orders }) => {
  const [filter, setFilter] = useState<'all' | 'Smart Pickup' | 'Store Delivery'>('all');
  const [search, setSearch] = useState('');

  const displayOrders = orders.filter((o) => {
    const matchesFilter = filter === 'all' || o.type === filter;
    const matchesSearch =
      o.id.toLowerCase().includes(search.toLowerCase()) ||
      o.customerName.toLowerCase().includes(search.toLowerCase()) ||
      o.storeName.toLowerCase().includes(search.toLowerCase()) ||
      o.area.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const activePickups = orders.filter((o) => o.type === 'Smart Pickup').length;
  const activeDeliveries = orders.filter((o) => o.type === 'Store Delivery').length;
  const avgQueueWait = orders.length > 0 ? '2.4 mins' : '—';

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-secondary animate-pulse" />
            <h1 className="font-headline-lg text-headline-lg text-on-surface font-bold">
              Live Orders & Dispatch Tracker
            </h1>
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant mt-0.5">
            Real-time pickup pass scanning and door delivery dispatches across HP North.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
              search
            </span>
            <input
              type="text"
              placeholder="Search active orders..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-3 py-2 rounded-lg bg-surface-container-low text-on-surface font-body-sm text-body-sm border border-outline-variant/30 focus:outline-none"
            />
          </div>

          <div className="flex items-center bg-surface-container-low p-1 rounded-lg border border-outline-variant/30">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded font-label-sm text-label-sm font-semibold transition ${
                filter === 'all' ? 'bg-surface-container-lowest text-on-surface shadow-xs font-bold' : 'text-on-surface-variant'
              }`}
            >
              All ({orders.length})
            </button>
            <button
              onClick={() => setFilter('Smart Pickup')}
              className={`px-3 py-1 rounded font-label-sm text-label-sm font-semibold transition ${
                filter === 'Smart Pickup' ? 'bg-surface-container-lowest text-on-surface shadow-xs font-bold' : 'text-on-surface-variant'
              }`}
            >
              Smart Pickup ({activePickups})
            </button>
            <button
              onClick={() => setFilter('Store Delivery')}
              className={`px-3 py-1 rounded font-label-sm text-label-sm font-semibold transition ${
                filter === 'Store Delivery' ? 'bg-surface-container-lowest text-on-surface shadow-xs font-bold' : 'text-on-surface-variant'
              }`}
            >
              Delivery ({activeDeliveries})
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/20 shadow-xs flex items-center justify-between">
          <div>
            <span className="font-label-sm text-label-sm uppercase text-on-surface-variant tracking-wider font-semibold">Active In-Store Pickups</span>
            <p className="font-headline-lg text-headline-lg font-bold text-on-surface mt-1">{activePickups} Passes</p>
          </div>
          <div className="p-3 rounded-lg bg-secondary-container text-on-secondary-container">
            <span className="material-symbols-outlined text-[24px]">storefront</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/20 shadow-xs flex items-center justify-between">
          <div>
            <span className="font-label-sm text-label-sm uppercase text-on-surface-variant tracking-wider font-semibold">Average Queue Wait</span>
            <p className="font-headline-lg text-headline-lg font-bold text-secondary mt-1">{avgQueueWait}</p>
          </div>
          <div className="p-3 rounded-lg bg-secondary-container text-on-secondary-container">
            <span className="material-symbols-outlined text-[24px]">timer</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/20 shadow-xs flex items-center justify-between">
          <div>
            <span className="font-label-sm text-label-sm uppercase text-on-surface-variant tracking-wider font-semibold">Riders On Road</span>
            <p className="font-headline-lg text-headline-lg font-bold text-on-surface mt-1">{activeDeliveries} Active</p>
          </div>
          <div className="p-3 rounded-lg bg-tertiary-fixed text-on-tertiary-fixed">
            <span className="material-symbols-outlined text-[24px]">moped</span>
          </div>
        </div>
      </div>

      <div className="bg-surface-container-lowest rounded-xl p-5 shadow-xs border border-outline-variant/20">
        {displayOrders.length === 0 ? (
          <div className="py-16 text-center text-on-surface-variant space-y-2">
            <span className="material-symbols-outlined text-[40px]">local_shipping</span>
            <p className="font-headline-sm text-headline-sm font-bold text-on-surface">No active orders</p>
            <p className="font-body-sm text-body-sm max-w-md mx-auto">
              Live pickup pass scanning and dispatch tickets will stream here automatically once customers place orders.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-body-sm text-body-sm">
              <thead>
                <tr className="bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider">
                  <th className="py-3 px-4 rounded-l-lg">Order ID</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Store</th>
                  <th className="py-3 px-4">Cluster Area</th>
                  <th className="py-3 px-4">Fulfillment Mode</th>
                  <th className="py-3 px-4">SLA / Status</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4 rounded-r-lg text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {displayOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-surface-container-low/60 transition">
                    <td className="py-3.5 px-4 font-bold text-on-surface">{order.id}</td>
                    <td className="py-3.5 px-4 font-medium text-on-surface">{order.customerName}</td>
                    <td className="py-3.5 px-4 text-on-surface-variant">{order.storeName}</td>
                    <td className="py-3.5 px-4">{order.area}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-label-sm font-bold inline-flex items-center gap-1 ${
                          order.type === 'Smart Pickup'
                            ? 'bg-secondary-container text-on-secondary-container'
                            : 'bg-tertiary-fixed text-on-tertiary-fixed'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[14px]">
                          {order.type === 'Smart Pickup' ? 'storefront' : 'two_wheeler'}
                        </span>
                        {order.type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded bg-surface-container font-semibold text-on-surface">
                        {order.etaProgress}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-on-surface">₹{order.amount}</td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => alert(`Tracking telemetry for ${order.id}: Dispatched via HP-North Gateway`)}
                        className="px-2.5 py-1 rounded bg-surface-container hover:bg-surface-container-high text-on-surface font-label-sm text-label-sm font-semibold transition"
                      >
                        Inspect Pass
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
