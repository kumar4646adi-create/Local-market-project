import React, { useState } from 'react';

export const SettingsView: React.FC = () => {
  const [fssaiCategoryBStrict, setFssaiCategoryBStrict] = useState(true);
  const [pennyDropAutoPayout, setPennyDropAutoPayout] = useState(true);
  const [geoFencingAccuracyMeters, setGeoFencingAccuracyMeters] = useState(8);
  const [prepSlaDefaultMins, setPrepSlaDefaultMins] = useState(15);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-4xl">
      <div>
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[24px] text-primary">settings</span>
          <h1 className="font-headline-lg text-headline-lg text-on-surface font-bold">
            Platform Rules & Regional Directives
          </h1>
        </div>
        <p className="font-body-md text-body-md text-on-surface-variant mt-0.5">
          Cluster parameter controls for Himachal Pradesh North (Ghumarwin, Bilaspur, Sundernagar).
        </p>
      </div>

      {/* Super Admin Profile Identity Card */}
      <div className="bg-surface-container-lowest rounded-xl p-6 shadow-xs border border-outline-variant/20 space-y-4">
        <div className="border-b border-outline-variant/20 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
              Super Admin Profile & Access Credentials
            </h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
              Primary administrative identity and cluster governance key.
            </p>
          </div>
          <span className="px-3 py-1 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-bold flex items-center gap-1 w-max">
            <span className="material-symbols-outlined text-[15px]">verified</span>
            Super Admin Active
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-surface-container-low border border-outline-variant/30">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary text-on-primary font-bold text-lg flex items-center justify-center shadow-sm ring-1 ring-outline-variant/30 tracking-tight shrink-0">
              AK
            </div>
            <div>
              <h4 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                Aditya Kumar
              </h4>
              <p className="font-body-sm text-body-sm text-on-surface-variant font-medium">
                ADI98712KUMAR@GMAIL.COM
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className="px-2 py-0.5 rounded font-label-sm text-[11px] font-bold bg-secondary-container text-on-secondary-container">
                  Super Admin
                </span>
                <span className="font-body-sm text-[12px] text-on-surface-variant">
                  • LocalMarket Super Admin Console
                </span>
              </div>
            </div>
          </div>

          <div className="text-left sm:text-right font-body-sm text-body-sm text-on-surface-variant space-y-0.5 border-t sm:border-t-0 pt-2 sm:pt-0 border-outline-variant/20">
            <p className="font-semibold text-on-surface">Cluster Authority:</p>
            <p>Merchant KYC, T+1 Direct Settlements & Dispute Arbitration</p>
          </div>
        </div>
      </div>

      {isSaved && (
        <div className="p-4 rounded-xl bg-secondary-container text-on-secondary-container font-label-md text-label-md font-bold flex items-center gap-2 animate-in fade-in">
          <span className="material-symbols-outlined text-[20px]">check_circle</span>
          <span>Platform directives successfully synchronized across all HP North gateway nodes.</span>
        </div>
      )}

      <div className="bg-surface-container-lowest rounded-xl p-6 shadow-xs border border-outline-variant/20 space-y-6">
        <div className="border-b border-outline-variant/20 pb-4">
          <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
            Himachal North KYC Policy v2.4 Configuration
          </h3>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
            Mandated requirements for onboarding local confectionery, dairy, and perishables.
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4 p-3 rounded-lg bg-surface-container-low">
            <div>
              <p className="font-label-md text-label-md font-bold text-on-surface">
                Mandatory Physical Counter Audit for Category B Dairy & Perishables
              </p>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Enforces field agent ground verification photograph before storefront geo-fencing can go live.
              </p>
            </div>
            <input
              type="checkbox"
              checked={fssaiCategoryBStrict}
              onChange={(e) => setFssaiCategoryBStrict(e.target.checked)}
              className="w-5 h-5 accent-secondary cursor-pointer mt-1"
            />
          </div>

          <div className="flex items-start justify-between gap-4 p-3 rounded-lg bg-surface-container-low">
            <div>
              <p className="font-label-md text-label-md font-bold text-on-surface">
                Automated Penny Drop Bank Verification
              </p>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Directly triggers ₹1 penny deposit to match Trade Name with bank beneficiary before issuing T+1 payouts.
              </p>
            </div>
            <input
              type="checkbox"
              checked={pennyDropAutoPayout}
              onChange={(e) => setPennyDropAutoPayout(e.target.checked)}
              className="w-5 h-5 accent-secondary cursor-pointer mt-1"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block font-label-md text-label-md font-semibold text-on-surface mb-1">
                Max Allowed GPS Accuracy Radius (meters)
              </label>
              <input
                type="number"
                value={geoFencingAccuracyMeters}
                onChange={(e) => setGeoFencingAccuracyMeters(Number(e.target.value))}
                className="w-full p-2.5 rounded-lg bg-surface-container-low border border-outline-variant/30 text-on-surface font-body-sm text-body-sm focus:outline-none"
              />
              <span className="text-[11px] text-on-surface-variant">Standard threshold: 8 meters</span>
            </div>

            <div>
              <label className="block font-label-md text-label-md font-semibold text-on-surface mb-1">
                Default Smart Pickup Prep SLA (minutes)
              </label>
              <input
                type="number"
                value={prepSlaDefaultMins}
                onChange={(e) => setPrepSlaDefaultMins(Number(e.target.value))}
                className="w-full p-2.5 rounded-lg bg-surface-container-low border border-outline-variant/30 text-on-surface font-body-sm text-body-sm focus:outline-none"
              />
              <span className="text-[11px] text-on-surface-variant">Standard threshold: 15 mins</span>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-outline-variant/20 flex justify-end">
          <button
            onClick={handleSave}
            className="px-5 py-2.5 rounded-xl bg-primary hover:bg-neutral-800 text-on-primary font-label-md text-label-md font-bold shadow-sm transition cursor-pointer"
          >
            Save Policy Rules
          </button>
        </div>
      </div>
    </div>
  );
};
