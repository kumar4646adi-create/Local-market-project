import React from 'react';
import { Order, Retailer } from '../types';

interface CustomersViewProps {
  orders: Order[];
}

export const CustomersView: React.FC<CustomersViewProps> = ({ orders }) => {
  // Aggregate distinct customers from real orders
  const customerMap = new Map<string, { name: string; phone?: string; orderCount: number; lastOrder: string; totalSpend: number }>();

  orders.forEach((o) => {
    const id = o.customerId || o.customerName;
    const existing = customerMap.get(id);
    if (existing) {
      existing.orderCount += 1;
      existing.totalSpend += Number(o.totalAmount) || 0;
      if (new Date(o.createdAt) > new Date(existing.lastOrder)) {
        existing.lastOrder = o.createdAt;
      }
    } else {
      customerMap.set(id, {
        name: o.customerName,
        phone: o.customerPhone || '—',
        orderCount: 1,
        lastOrder: o.createdAt,
        totalSpend: Number(o.totalAmount) || 0,
      });
    }
  });

  const customersList = Array.from(customerMap.values());

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="font-headline-lg text-headline-lg text-on-surface font-bold">
          Customers & Accounts
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant mt-0.5">
          Real-time consumers, active counter passes, and verified order history from Firebase.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/20 shadow-xs">
          <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-semibold">Active Customers</span>
          <p className="font-headline-lg text-headline-lg font-bold text-on-surface mt-1">{customersList.length}</p>
        </div>
        <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/20 shadow-xs">
          <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-semibold">Orders Placed</span>
          <p className="font-headline-lg text-headline-lg font-bold text-secondary mt-1">{orders.length}</p>
        </div>
        <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/20 shadow-xs">
          <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-semibold">Transactions</span>
          <p className="font-headline-lg text-headline-lg font-bold text-on-surface mt-1">
            ₹{orders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0).toLocaleString('en-IN')}
          </p>
        </div>
      </div>

      <div className="bg-surface-container-lowest rounded-xl p-5 shadow-xs border border-outline-variant/20">
        {customersList.length === 0 ? (
          <div className="py-12 text-center text-on-surface-variant space-y-2">
            <span className="material-symbols-outlined text-[36px]">group</span>
            <p className="font-label-md text-label-md font-bold text-on-surface">No customer accounts yet</p>
            <p className="font-body-sm text-body-sm">
              Customers who place Smart Pickup passes or orders will automatically populate here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-body-sm text-body-sm">
              <thead>
                <tr className="bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider">
                  <th className="py-3 px-4 rounded-l-lg">Customer Name</th>
                  <th className="py-3 px-4">Contact Phone</th>
                  <th className="py-3 px-4">Orders Count</th>
                  <th className="py-3 px-4">Total Spend</th>
                  <th className="py-3 px-4 rounded-r-lg text-right">Last Activity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {customersList.map((c, i) => (
                  <tr key={i} className="hover:bg-surface-container-low/60 transition">
                    <td className="py-3.5 px-4 font-bold text-on-surface">{c.name}</td>
                    <td className="py-3.5 px-4 text-on-surface-variant">{c.phone}</td>
                    <td className="py-3.5 px-4 font-semibold">{c.orderCount} order(s)</td>
                    <td className="py-3.5 px-4 font-bold text-secondary">₹{c.totalSpend}</td>
                    <td className="py-3.5 px-4 text-right text-on-surface-variant">
                      {new Date(c.lastOrder).toLocaleDateString()}
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

interface CatalogViewProps {
  retailers: Retailer[];
}

export const CatalogView: React.FC<CatalogViewProps> = ({ retailers }) => {
  const activeRetailers = retailers.filter((r) => r.status === 'active');

  // Count active categories from actual retailers
  const categoriesMap: Record<string, number> = {};
  activeRetailers.forEach((r) => {
    const cat = r.category || 'General';
    categoriesMap[cat] = (categoriesMap[cat] || 0) + 1;
  });

  const categories = Object.entries(categoriesMap);

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface font-bold">
            Catalog & Categories Master
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-0.5">
            Real categories populated from approved merchants and inventory.
          </p>
        </div>
      </div>

      {categories.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-2xl p-12 border border-outline-variant/20 text-center space-y-2">
          <span className="material-symbols-outlined text-[36px] text-on-surface-variant">inventory_2</span>
          <p className="font-label-md text-label-md font-bold text-on-surface">No active category data yet</p>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Categories will reflect approved local stores registered in Firebase.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {categories.map(([categoryName, count], idx) => (
            <div key={idx} className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/20 shadow-xs">
              <span className="font-label-sm text-label-sm text-secondary font-bold">Active Domain</span>
              <p className="font-headline-sm text-headline-sm font-bold text-on-surface mt-1">{categoryName}</p>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">{count} participating store(s)</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const AppointmentsView: React.FC = () => {
  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="font-headline-lg text-headline-lg text-on-surface font-bold">
          Field Audits & Service Appointments
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant mt-0.5">
          Ground verification schedules and counter inspection appointments.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/20 shadow-xs">
          <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-semibold">Appointments Today</span>
          <p className="font-headline-lg text-headline-lg font-bold text-on-surface mt-1">0</p>
        </div>
        <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/20 shadow-xs">
          <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-semibold">Field Executives</span>
          <p className="font-headline-lg text-headline-lg font-bold text-secondary mt-1">HP-North Node</p>
        </div>
        <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/20 shadow-xs">
          <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-semibold">Pending Audits</span>
          <p className="font-headline-lg text-headline-lg font-bold text-on-surface mt-1">0</p>
        </div>
      </div>

      <div className="bg-surface-container-lowest rounded-xl p-8 shadow-xs border border-outline-variant/20 text-center space-y-2">
        <span className="material-symbols-outlined text-[36px] text-on-surface-variant">event_available</span>
        <p className="font-label-md text-label-md font-bold text-on-surface">No scheduled appointments</p>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          Appointments booked for field audits or vendor counter visits will display here.
        </p>
      </div>
    </div>
  );
};
