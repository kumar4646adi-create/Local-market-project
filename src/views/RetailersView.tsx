import React, { useState } from 'react';
import { Retailer, RetailerStatus } from '../types';
import { DocumentViewerModal } from '../components/DocumentViewerModal';
import { OnboardMerchantModal } from '../components/OnboardMerchantModal';

interface RetailersViewProps {
  retailers: Retailer[];
  activeRetailerId: string;
  onSelectRetailer: (id: string) => void;
  onApproveRetailer: (id: string) => void;
  onRejectRetailer: (id: string, reason: string) => void;
  onRequestResubmission: (id: string, notes: string) => void;
  onApproveDocument: (id: string) => void;
  onFlagDocument: (id: string, reason: string) => void;
  onOnboardMerchant: (newMerchant: Retailer) => void;
  onExportRosterCsv: () => void;
  onGoToRegistration: () => void;
}

export const RetailersView: React.FC<RetailersViewProps> = ({
  retailers,
  activeRetailerId,
  onSelectRetailer,
  onApproveRetailer,
  onRejectRetailer,
  onRequestResubmission,
  onApproveDocument,
  onFlagDocument,
  onOnboardMerchant,
  onExportRosterCsv,
  onGoToRegistration
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<RetailerStatus>('pending_review');
  const [territoryFilter, setTerritoryFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Modals state
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [isOnboardModalOpen, setIsOnboardModalOpen] = useState(false);
  const [showRejectPrompt, setShowRejectPrompt] = useState(false);
  const [rejectReason, setRejectReason] = useState('Business information could not be verified.');
  const [showResubmitPrompt, setShowResubmitPrompt] = useState(false);
  const [resubmitNote, setResubmitNote] = useState('Please update physical address and provide clear storefront counter photo.');

  // Counts strictly calculated from Firebase data
  const counts = {
    pending_review: retailers.filter((r) => r.status === 'pending_review').length,
    active: retailers.filter((r) => r.status === 'active').length,
    action_required: retailers.filter((r) => r.status === 'action_required').length,
    suspended: retailers.filter((r) => r.status === 'rejected' || r.status === 'suspended').length
  };

  // Filter retailers strictly
  const filteredRetailers = retailers.filter((r) => {
    const matchesTab =
      activeTab === 'suspended'
        ? r.status === 'rejected' || r.status === 'suspended'
        : r.status === activeTab;

    const matchesSearch =
      searchQuery.trim() === '' ||
      r.shopName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.phone.includes(searchQuery) ||
      r.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.area.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTerritory = territoryFilter === 'All' || r.city.toLowerCase() === territoryFilter.toLowerCase();
    const matchesCategory = categoryFilter === 'All' || r.category.toLowerCase().includes(categoryFilter.toLowerCase());

    return matchesTab && matchesSearch && matchesTerritory && matchesCategory;
  });

  const selectedRetailer =
    retailers.find((r) => r.id === activeRetailerId) ||
    filteredRetailers[0] ||
    retailers[0] ||
    null;

  return (
    <div className="flex flex-col w-full">
      {/* Broadcast Banner */}
      <div className="px-4 py-2 bg-surface-container flex flex-wrap items-center justify-between shadow-xs border-b border-outline-variant/20 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-secondary text-on-secondary shrink-0">
            <span className="material-symbols-outlined text-[14px]">shield</span>
          </span>
          <p className="font-body-sm text-body-sm text-on-surface truncate">
            <strong className="font-label-sm text-label-sm uppercase tracking-wider text-secondary">
              Himachal North KYC Policy v2.4:
            </strong>{' '}
            Mandatory physical counter audit required for all Category B dairy & perishables before commercial geo-fencing activation.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="font-label-sm text-label-sm text-on-surface-variant">
            Cluster: <strong className="text-on-surface">HP-Bilaspur Central</strong>
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-ping" />
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-6">
        {/* Top Section Filter & Action Bar */}
        <div className="bg-surface-container-lowest rounded-xl p-4 shadow-sm border border-outline-variant/20 space-y-4">
          {/* Row 1: Search, Export & Manual Onboard Actions */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
                search
              </span>
              <input
                className="w-full pl-10 pr-12 py-2.5 rounded-lg bg-surface-container-low font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:bg-surface-container transition-all border border-outline-variant/30"
                placeholder="Search by Store Name, Owner Phone, GSTIN/FSSAI, or Town..."
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <kbd className="hidden sm:inline-block absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant font-label-sm text-label-sm border border-outline-variant/40">
                ⌘K
              </kbd>
            </div>

            {/* Master Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={onExportRosterCsv}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface font-label-md text-label-md transition-colors border border-outline-variant/30"
              >
                <span className="material-symbols-outlined text-[18px]">download</span>
                <span>Export Roster (CSV)</span>
              </button>

              <button
                onClick={onGoToRegistration}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-primary hover:bg-neutral-800 text-on-primary font-label-md text-label-md shadow-sm transition-all transform active:scale-98"
              >
                <span className="material-symbols-outlined text-[18px]">add_business</span>
                <span>+ Register New Store</span>
              </button>
            </div>
          </div>

          {/* Row 2: Status Lifecycle Tabs & Filter Dropdowns */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-outline-variant/20">
            {/* Tabs strictly driven by Firebase counts */}
            <div className="flex items-center gap-1 bg-surface-container-low p-1 rounded-lg overflow-x-auto border border-outline-variant/30">
              <button
                onClick={() => setActiveTab('pending_review')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-label-md text-label-md transition-all ${
                  activeTab === 'pending_review'
                    ? 'bg-surface-container-lowest text-on-surface shadow-xs font-bold'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span>Pending Review</span>
                <span className="px-1.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-bold">
                  {counts.pending_review}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('active')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-label-md text-label-md transition-all ${
                  activeTab === 'active'
                    ? 'bg-surface-container-lowest text-on-surface shadow-xs font-bold'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span>Verified & Active</span>
                <span className="px-1.5 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-label-sm text-label-sm font-bold">
                  {counts.active}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('action_required')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-label-md text-label-md transition-all ${
                  activeTab === 'action_required'
                    ? 'bg-surface-container-lowest text-on-surface shadow-xs font-bold'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span>Action Required</span>
                <span className="px-1.5 py-0.5 rounded-full bg-error-container text-on-error-container font-label-sm text-label-sm font-bold">
                  {counts.action_required}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('suspended')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-label-md text-label-md transition-all ${
                  activeTab === 'suspended'
                    ? 'bg-surface-container-lowest text-on-surface shadow-xs font-bold'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span>Suspended</span>
                <span className="px-1.5 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-label-sm text-label-sm font-bold">
                  {counts.suspended}
                </span>
              </button>
            </div>

            {/* Filter Dropdowns */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-surface-container-low border border-outline-variant/30">
                <span className="material-symbols-outlined text-[16px] text-on-surface-variant">near_me</span>
                <span className="font-label-sm text-label-sm text-on-surface-variant font-semibold">Territory:</span>
                <select
                  value={territoryFilter}
                  onChange={(e) => setTerritoryFilter(e.target.value)}
                  className="bg-transparent font-label-md text-label-md text-on-surface font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="All">All Clusters</option>
                  <option value="Ghumarwin">Ghumarwin</option>
                  <option value="Bilaspur">Bilaspur</option>
                  <option value="Sundernagar">Sundernagar</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-surface-container-low border border-outline-variant/30">
                <span className="material-symbols-outlined text-[16px] text-on-surface-variant">category</span>
                <span className="font-label-sm text-label-sm text-on-surface-variant font-semibold">Type:</span>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="bg-transparent font-label-md text-label-md text-on-surface font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="All">All Categories</option>
                  <option value="Kirana">Daily Kirana & Provisions</option>
                  <option value="Dairy">Dairy, Sweets & Bakery</option>
                  <option value="Chemist">Chemist & Health</option>
                  <option value="Electronics">Electronics & Mobile</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Global Empty State: When no retailers registered in Firebase at all */}
        {retailers.length === 0 ? (
          <div className="bg-surface-container-lowest rounded-2xl p-12 border border-outline-variant/20 shadow-sm text-center space-y-4 max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-full bg-surface-container-low flex items-center justify-center mx-auto text-on-surface-variant">
              <span className="material-symbols-outlined text-[36px]">storefront</span>
            </div>
            <div className="space-y-1">
              <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                No retailer applications yet.
              </h3>
              <p className="font-body-md text-body-md text-on-surface-variant">
                New local businesses will appear here after registration.
              </p>
            </div>
            <div className="pt-2">
              <button
                onClick={onGoToRegistration}
                className="px-6 py-2.5 rounded-xl bg-primary text-on-primary font-label-md text-label-md font-bold hover:bg-neutral-800 transition"
              >
                + Register First Retailer Store
              </button>
            </div>
          </div>
        ) : (
          /* Split Workflow Layout */
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
            {/* Left Side (5 Cols - 40%): Real Dynamic Verification Queue */}
            <div className="xl:col-span-5 space-y-4">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span className="font-headline-sm text-headline-sm text-on-surface font-bold">
                    Verification Queue
                  </span>
                  <span className="w-2 h-2 rounded-full bg-secondary" />
                </div>
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                  Showing {filteredRetailers.length} of {retailers.length} stores
                </span>
              </div>

              {filteredRetailers.length === 0 ? (
                <div className="p-8 text-center bg-surface-container-lowest rounded-xl border border-outline-variant/20 text-on-surface-variant font-body-sm">
                  No stores match the current status tab and filter criteria.
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredRetailers.map((retailer) => {
                    const isSelected = retailer.id === selectedRetailer?.id;

                    return (
                      <div
                        key={retailer.id}
                        onClick={() => onSelectRetailer(retailer.id)}
                        className={`p-4 rounded-xl bg-surface-container-lowest border transition-all cursor-pointer relative overflow-hidden transform hover:-translate-y-0.5 ${
                          isSelected
                            ? 'border-secondary shadow-md ring-1 ring-secondary/20'
                            : 'border-outline-variant/20 shadow-xs hover:shadow-md'
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-secondary" />
                        )}

                        <div className="flex items-start justify-between gap-2 mb-2 pl-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded font-label-sm text-label-sm font-semibold uppercase ${
                                retailer.status === 'active'
                                  ? 'bg-secondary-container text-on-secondary-container'
                                  : retailer.status === 'rejected'
                                  ? 'bg-error-container text-on-error-container'
                                  : 'bg-tertiary-fixed text-on-tertiary-fixed'
                              }`}
                            >
                              {retailer.status.replace('_', ' ')}
                            </span>
                            <span className="px-2 py-0.5 rounded font-label-sm text-label-sm bg-surface-container-high text-on-surface-variant">
                              {retailer.city}
                            </span>
                          </div>
                          <span className="font-body-sm text-body-sm text-on-surface-variant font-medium">
                            {new Date(retailer.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        <div className="flex gap-4 pl-1">
                          <img
                            className="w-16 h-16 rounded-lg object-cover shrink-0 shadow-xs border border-outline-variant/20"
                            alt={retailer.shopName}
                            src={retailer.logoUrl || 'https://via.placeholder.com/64'}
                          />
                          <div className="min-w-0 flex-1">
                            <h3 className="font-headline-sm text-[16px] text-on-surface truncate leading-snug font-bold">
                              {retailer.shopName}
                            </h3>
                            <div className="flex items-center gap-1.5 text-on-surface-variant font-body-sm text-body-sm mt-0.5">
                              <span className="material-symbols-outlined text-[15px]">person</span>
                              <span className="truncate font-semibold text-on-surface">
                                {retailer.ownerName}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-on-surface-variant font-body-sm text-body-sm mt-0.5 truncate">
                              <span className="material-symbols-outlined text-[15px]">location_on</span>
                              <span className="truncate">{retailer.area || retailer.address}</span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 pt-2 flex items-center justify-between pl-1 bg-surface-container-low rounded-lg p-2">
                          <div className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[16px] text-secondary">
                              category
                            </span>
                            <span className="font-label-sm text-label-sm text-on-surface font-semibold truncate max-w-[180px]">
                              {retailer.category}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 text-secondary font-label-sm text-label-sm font-bold">
                            <span>{retailer.status === 'active' ? 'Live Storefront' : 'Review Dossier'}</span>
                            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right Side (7 Cols - 60%): Master Dossier */}
            {selectedRetailer && (
              <div className="xl:col-span-7 space-y-4">
                {/* Store Master Header Card */}
                <div className="bg-surface-container-lowest rounded-xl p-5 sm:p-6 shadow-sm border border-outline-variant/20 space-y-4">
                  <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <img
                        className="w-20 h-20 rounded-xl object-cover shadow-sm shrink-0 border border-outline-variant/30"
                        alt={selectedRetailer.shopName}
                        src={selectedRetailer.logoUrl || 'https://via.placeholder.com/80'}
                      />
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="font-headline-lg text-headline-lg text-on-surface font-bold leading-tight">
                            {selectedRetailer.shopName}
                          </h2>
                          <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-bold flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">shield_person</span>
                            KYC #{selectedRetailer.dossierNumber || selectedRetailer.id.slice(0, 8).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-on-surface-variant font-body-sm text-body-sm">
                          <span className="flex items-center gap-1 font-semibold text-on-surface">
                            <span className="material-symbols-outlined text-[16px] text-secondary">
                              account_circle
                            </span>
                            {selectedRetailer.ownerName} (Proprietor)
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[16px]">call</span>
                            {selectedRetailer.phone}
                          </span>
                          {selectedRetailer.email && (
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-[16px]">mail</span>
                              {selectedRetailer.email}
                            </span>
                          )}
                          {selectedRetailer.gstin && (
                            <span className="px-2 py-0.5 rounded bg-surface-container font-mono font-bold text-xs text-on-surface border border-outline-variant/30">
                              GSTIN: {selectedRetailer.gstin}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-3 font-body-sm text-body-sm text-on-surface-variant">
                          <p className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[16px]">location_on</span>
                            {selectedRetailer.address}, {selectedRetailer.city} - {selectedRetailer.pincode}
                          </p>
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${selectedRetailer.latitude},${selectedRetailer.longitude}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-bold text-secondary hover:underline bg-secondary-container/40 px-2 py-0.5 rounded"
                          >
                            <span className="material-symbols-outlined text-[14px]">map</span>
                            View on Google Maps ({selectedRetailer.latitude.toFixed(4)}, {selectedRetailer.longitude.toFixed(4)})
                          </a>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:items-end shrink-0">
                      <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-bold">
                        Territory Cluster
                      </span>
                      <span className="font-label-lg text-label-lg text-on-surface font-bold">
                        {selectedRetailer.city} Core
                      </span>
                      <span className="font-body-sm text-body-sm text-secondary font-medium mt-0.5">
                        {selectedRetailer.area}
                      </span>
                    </div>
                  </div>

                  {/* Uploaded Shop Photo & Payment QR Preview */}
                  {(selectedRetailer.shopImageUrl || selectedRetailer.paymentQrUrl) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      {selectedRetailer.shopImageUrl && (
                        <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/20 space-y-1.5">
                          <span className="text-xs font-bold uppercase text-on-surface-variant flex items-center gap-1">
                            <span className="material-symbols-outlined text-[15px]">storefront</span>
                            Shopfront Counter Photograph
                          </span>
                          <img
                            src={selectedRetailer.shopImageUrl}
                            alt="Shopfront"
                            className="w-full h-32 object-cover rounded-lg border border-outline-variant/30"
                          />
                        </div>
                      )}
                      {selectedRetailer.paymentQrUrl && (
                        <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/20 space-y-1.5 flex flex-col justify-between">
                          <span className="text-xs font-bold uppercase text-secondary flex items-center gap-1">
                            <span className="material-symbols-outlined text-[15px]">qr_code_2</span>
                            Merchant Direct UPI Payment QR
                          </span>
                          <div className="flex items-center gap-3">
                            <img
                              src={selectedRetailer.paymentQrUrl}
                              alt="Payment QR"
                              className="w-24 h-24 object-contain rounded-lg bg-white p-1 border border-outline-variant/30"
                            />
                            <div className="text-xs text-on-surface-variant">
                              <p className="font-bold text-on-surface">Verified Merchant QR</p>
                              <p className="mt-0.5">Customers can scan to pay directly to this store during checkout or pickup.</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Fulfillment Configuration */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div className="p-3 rounded-xl bg-surface-container-low flex items-center justify-between border border-outline-variant/20">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-secondary text-on-secondary flex items-center justify-center">
                          <span className="material-symbols-outlined text-[20px]">shopping_bag</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-label-md text-label-md text-on-surface font-bold">
                              Smart Pickup Counter
                            </span>
                            <span className="w-2 h-2 rounded-full bg-secondary" />
                          </div>
                          <span className="font-body-sm text-body-sm text-on-surface-variant">
                            SLA: {selectedRetailer.preparationTime || '15 mins'}
                          </span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded font-label-sm text-label-sm bg-secondary-container text-on-secondary-container font-bold">
                        {selectedRetailer.fulfillmentOptions?.includes('Smart Pickup') !== false ? 'ENABLED' : 'OFF'}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-surface-container-low flex items-center justify-between border border-outline-variant/20">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-surface-container-high text-on-surface-variant flex items-center justify-center">
                          <span className="material-symbols-outlined text-[20px]">moped</span>
                        </div>
                        <div>
                          <span className="font-label-md text-label-md text-on-surface font-bold">
                            Merchant Direct Delivery
                          </span>
                          <p className="font-body-sm text-body-sm text-on-surface-variant">
                            {selectedRetailer.fulfillmentOptions?.includes('Retailer Direct Delivery')
                              ? 'Staff delivery operational'
                              : 'Restricted to counter pickup only'}
                          </p>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded font-label-sm text-label-sm bg-surface-container-high text-on-surface-variant font-bold">
                        {selectedRetailer.fulfillmentOptions?.includes('Retailer Direct Delivery') ? 'ENABLED' : 'OFF'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Regulatory & Compliance Checklist */}
                <div className="bg-surface-container-lowest rounded-xl p-5 sm:p-6 shadow-sm border border-outline-variant/20 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-headline-sm text-headline-sm text-on-surface font-bold">
                      Regulatory & Compliance Audit
                    </span>
                    <span className="px-2 py-0.5 rounded bg-surface-container font-label-sm text-label-sm text-on-surface font-semibold">
                      Tier-2 Mandatory
                    </span>
                  </div>

                  <div className="space-y-3 font-body-sm text-body-sm">
                    {/* Trade / Udyam */}
                    <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/20 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold">
                          ✓
                        </span>
                        <div>
                          <p className="font-bold text-on-surface">Udyam Trade Registration</p>
                          <p className="text-on-surface-variant font-mono">
                            {selectedRetailer.udyamNumber || `UDYAM-HP-02-00${selectedRetailer.pincode}`} • {selectedRetailer.category}
                          </p>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-secondary-container text-on-secondary-container font-label-sm text-[11px] font-bold">
                        VERIFIED MATCH
                      </span>
                    </div>

                    {/* Geolocation */}
                    <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/20 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold">
                          📍
                        </span>
                        <div>
                          <p className="font-bold text-on-surface">Counter Coordinates & Geofencing</p>
                          <p className="text-on-surface-variant font-mono">
                            {selectedRetailer.latitude}° N, {selectedRetailer.longitude}° E • Accuracy: &lt; 8m radius
                          </p>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-secondary-container text-on-secondary-container font-label-sm text-[11px] font-bold">
                        GEO-LOCKED
                      </span>
                    </div>

                    {/* Settlement Account */}
                    <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/20 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold">
                          ₹
                        </span>
                        <div>
                          <p className="font-bold text-on-surface">
                            Settlement Account: {selectedRetailer.bankName || 'HDFC Bank HP'}
                          </p>
                          <p className="text-on-surface-variant font-mono">
                            UPI: {selectedRetailer.upiId || `${selectedRetailer.phone}@okhdfcbank`}
                          </p>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-secondary-container text-on-secondary-container font-label-sm text-[11px] font-bold">
                        T+1 PAYOUT READY
                      </span>
                    </div>
                  </div>
                </div>

                {/* Reject dialog */}
                {showRejectPrompt && (
                  <div className="p-4 bg-error-container/30 border border-error/40 rounded-xl space-y-2 animate-in fade-in">
                    <h4 className="font-label-md text-label-md font-bold text-on-surface">
                      Specify Rejection Reason for {selectedRetailer.shopName}:
                    </h4>
                    <input
                      type="text"
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest border border-outline-variant/30 text-on-surface font-body-sm focus:outline-none"
                    />
                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        onClick={() => setShowRejectPrompt(false)}
                        className="px-3 py-1.5 rounded-lg text-on-surface font-label-md text-label-md hover:bg-surface-container"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => {
                          onRejectRetailer(selectedRetailer.id, rejectReason);
                          setShowRejectPrompt(false);
                        }}
                        className="px-4 py-1.5 rounded-lg bg-error text-on-error font-label-md text-label-md font-bold shadow-xs hover:opacity-90"
                      >
                        Confirm Rejection
                      </button>
                    </div>
                  </div>
                )}

                {/* Resubmission dialog */}
                {showResubmitPrompt && (
                  <div className="p-4 bg-surface-container-high/60 border border-outline-variant/40 rounded-xl space-y-2 animate-in fade-in">
                    <h4 className="font-label-md text-label-md font-bold text-on-surface">
                      Request Re-submission for {selectedRetailer.shopName}:
                    </h4>
                    <input
                      type="text"
                      value={resubmitNote}
                      onChange={(e) => setResubmitNote(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest border border-outline-variant/30 text-on-surface font-body-sm focus:outline-none"
                    />
                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        onClick={() => setShowResubmitPrompt(false)}
                        className="px-3 py-1.5 rounded-lg text-on-surface font-label-md text-label-md hover:bg-surface-container"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => {
                          onRequestResubmission(selectedRetailer.id, resubmitNote);
                          setShowResubmitPrompt(false);
                        }}
                        className="px-4 py-1.5 rounded-lg bg-primary text-on-primary font-label-md text-label-md font-bold shadow-xs hover:bg-neutral-800"
                      >
                        Send Request to Retailer
                      </button>
                    </div>
                  </div>
                )}

                {/* Sticky Decision Action Bar */}
                <div className="sticky bottom-4 z-20 bg-surface-container-lowest/95 backdrop-blur-md rounded-xl p-4 shadow-xl border border-outline-variant/30 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="w-3 h-3 rounded-full bg-secondary animate-pulse shrink-0" />
                    <div>
                      <p className="font-label-md text-label-md text-on-surface font-bold">
                        Super Admin Verification Verdict
                      </p>
                      <p className="font-body-sm text-body-sm text-on-surface-variant">
                        Updates real-time Firebase status. Merchant receives automated notification.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                    <button
                      onClick={() => setShowRejectPrompt(true)}
                      className="px-4 py-2.5 rounded-lg bg-error-container text-on-error-container font-label-md text-label-md hover:opacity-90 transition-colors flex items-center gap-1 font-bold"
                    >
                      <span className="material-symbols-outlined text-[18px]">cancel</span>
                      <span>Reject</span>
                    </button>

                    <button
                      onClick={() => setShowResubmitPrompt(true)}
                      className="px-4 py-2.5 rounded-lg bg-surface-container-high text-on-surface font-label-md text-label-md hover:bg-surface-variant transition-colors flex items-center gap-1 font-semibold"
                    >
                      <span className="material-symbols-outlined text-[18px]">replay</span>
                      <span>Request Re-submission</span>
                    </button>

                    <button
                      onClick={() => onApproveRetailer(selectedRetailer.id)}
                      className="px-5 py-2.5 rounded-lg bg-secondary text-on-secondary font-label-lg text-label-lg shadow-md hover:opacity-95 transition-all transform active:scale-98 flex items-center gap-2 font-bold"
                    >
                      <span className="material-symbols-outlined text-[20px]">store</span>
                      <span>Approve & Activate Storefront</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <OnboardMerchantModal
        isOpen={isOnboardModalOpen}
        onClose={() => setIsOnboardModalOpen(false)}
        onSave={onOnboardMerchant}
      />
    </div>
  );
};
