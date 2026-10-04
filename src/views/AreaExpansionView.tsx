import React, { useState } from 'react';
import { Retailer, Order } from '../types';

interface AreaExpansionViewProps {
  retailers: Retailer[];
  orders: Order[];
}

export const AreaExpansionView: React.FC<AreaExpansionViewProps> = ({ retailers, orders }) => {
  const [selectedTown, setSelectedTown] = useState<string>('ghumarwin');

  const townDefinitions = [
    { id: 'ghumarwin', name: 'Ghumarwin Bazaar', defaultTag: 'Core' },
    { id: 'bilaspur', name: 'Bilaspur Main', defaultTag: 'Central' },
    { id: 'sundernagar', name: 'Sundernagar Chowk', defaultTag: 'Phase 2' }
  ];

  const activeRetailers = retailers.filter((r) => r.status === 'active');

  const dynamicClusters = townDefinitions.map((town) => {
    const townStores = activeRetailers.filter(
      (r) => r.city?.toLowerCase().includes(town.id) || r.area?.toLowerCase().includes(town.id)
    );
    const allTownStores = retailers.filter(
      (r) => r.city?.toLowerCase().includes(town.id) || r.area?.toLowerCase().includes(town.id)
    );
    const townOrders = orders.filter((o) => {
      const store = retailers.find((r) => r.id === o.retailerId);
      return store?.city?.toLowerCase().includes(town.id) || store?.area?.toLowerCase().includes(town.id);
    });
    const townGmv = townOrders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
    const capacity = townStores.length > 0 ? Math.min(townStores.length * 15, 100) : 0;

    return {
      id: town.id,
      name: town.name,
      tag: townStores.length > 0 ? 'Operational' : town.defaultTag,
      tagColor: townStores.length > 0 ? 'bg-secondary-container text-on-secondary-container' : 'bg-surface-container text-on-surface-variant',
      activeStores: townStores.length,
      totalRegistered: allTownStores.length,
      gmvToday: townGmv,
      ordersCount: townOrders.length,
      onTimePrepRate: townOrders.length > 0 ? '98.5%' : '—',
      capacityIndex: capacity,
    };
  });

  const activeCluster = dynamicClusters.find((c) => c.id === selectedTown) || dynamicClusters[0];

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[24px] text-primary">map</span>
            <h1 className="font-headline-lg text-headline-lg text-on-surface font-bold">
              Area & Expansion Management
            </h1>
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant mt-0.5">
            Geofencing boundaries, cluster capacity indices, and Phase 2 merchant expansion in Himachal North.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => alert('New expansion territory request logged for Bilaspur South & Ner Chowk')}
            className="px-4 py-2.5 rounded-xl bg-primary text-on-primary font-label-md text-label-md font-bold shadow-sm hover:bg-neutral-800 transition flex items-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">add_location_alt</span>
            <span>+ Add Territory Cluster</span>
          </button>
        </div>
      </div>

      {/* Dynamic Cluster Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {dynamicClusters.map((cluster) => {
          const isSelected = cluster.id === selectedTown;
          return (
            <div
              key={cluster.id}
              onClick={() => setSelectedTown(cluster.id)}
              className={`p-5 rounded-xl bg-surface-container-lowest border transition-all cursor-pointer ${
                isSelected
                  ? 'border-secondary ring-1 ring-secondary/20 shadow-md'
                  : 'border-outline-variant/20 hover:shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-label-lg text-label-lg font-bold text-on-surface">
                  {cluster.name}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-label-sm font-bold ${cluster.tagColor}`}>
                  {cluster.tag}
                </span>
              </div>

              <div className="mt-4 space-y-2 font-body-sm text-body-sm">
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Active Dukaans:</span>
                  <span className="font-bold text-on-surface">{cluster.activeStores} Stores</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">GMV Today:</span>
                  <span className="font-bold text-on-surface">₹{cluster.gmvToday.toLocaleString('en-IN')} GMV</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">On-Time Prep:</span>
                  <span className={`font-bold ${cluster.ordersCount > 0 ? 'text-secondary' : 'text-on-surface-variant'}`}>
                    {cluster.onTimePrepRate}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-2 border-t border-outline-variant/20">
                <div className="flex justify-between text-[11px] text-on-surface-variant mb-1 font-semibold">
                  <span>Capacity</span>
                  <span>{cluster.capacityIndex}%</span>
                </div>
                <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
                  <div className="bg-secondary h-full" style={{ width: `${cluster.capacityIndex}%` }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Territory Detail & Geofence Matrix */}
      <div className="bg-surface-container-lowest rounded-xl p-6 shadow-xs border border-outline-variant/20 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-outline-variant/20 pb-4">
          <div>
            <h3 className="font-headline-md text-headline-md text-on-surface font-bold">
              {activeCluster.name} Detailed Geofence Topology
            </h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Zone ID: HP-{selectedTown.toUpperCase()}-01 • Radio Perimeter: 4.8 km radius
            </p>
          </div>
          <span className="px-3 py-1 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-bold w-max">
            Active Geofence Locked
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="font-label-md text-label-md uppercase font-bold text-on-surface-variant tracking-wider">
              Enforced Policy Rules
            </h4>
            <div className="space-y-3 font-body-sm text-body-sm">
              <div className="p-3 rounded-lg bg-surface-container-low border border-outline-variant/20 flex items-start gap-3">
                <span className="material-symbols-outlined text-[18px] text-secondary mt-0.5">verified</span>
                <div>
                  <p className="font-bold text-on-surface">Himachal North KYC Policy v2.4</p>
                  <p className="text-on-surface-variant">Requires GPS tag accuracy under 8 meters prior to commercial activation.</p>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-surface-container-low border border-outline-variant/20 flex items-start gap-3">
                <span className="material-symbols-outlined text-[18px] text-secondary mt-0.5">timer</span>
                <div>
                  <p className="font-bold text-on-surface">Smart Pickup Counter SLA Guarantee</p>
                  <p className="text-on-surface-variant">Orders prepared within 15 mins max; merchant must scan customer digital pass token.</p>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-surface-container-low border border-outline-variant/20 flex items-start gap-3">
                <span className="material-symbols-outlined text-[18px] text-secondary mt-0.5">payments</span>
                <div>
                  <p className="font-bold text-on-surface">Direct Automated T+1 Settlement</p>
                  <p className="text-on-surface-variant">Funds released upon verified customer barcode scan at shop counter.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-surface-container-low rounded-xl p-5 border border-outline-variant/20 flex flex-col justify-between">
            <div>
              <span className="font-label-sm text-label-sm uppercase font-bold text-on-surface-variant tracking-wider">
                Ground Execution Metrics
              </span>
              <div className="mt-4 space-y-3 font-body-sm text-body-sm">
                <div className="flex justify-between py-1 border-b border-outline-variant/20">
                  <span className="text-on-surface-variant">Assigned Ground Node:</span>
                  <span className="font-bold text-on-surface">HP-{selectedTown.toUpperCase()}-Field</span>
                </div>
                <div className="flex justify-between py-1 border-b border-outline-variant/20">
                  <span className="text-on-surface-variant">Physical Audits Completed:</span>
                  <span className="font-bold text-secondary">{activeCluster.activeStores} / {activeCluster.totalRegistered} Dukaans</span>
                </div>
                <div className="flex justify-between py-1 border-b border-outline-variant/20">
                  <span className="text-on-surface-variant">Orders Handled:</span>
                  <span className="font-bold text-on-surface">
                    {activeCluster.ordersCount > 0 ? `${activeCluster.ordersCount} Orders` : 'No order activity'}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-on-surface-variant">Gateway Latency:</span>
                  <span className="font-bold text-secondary">18ms to Shimla Cloud Node</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-outline-variant/20 flex justify-end">
              <button
                onClick={() => alert(`Full audit log for ${activeCluster.name} exported.`)}
                className="px-3.5 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-sm text-label-sm font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">download</span>
                <span>Export Cluster Audit Log</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
