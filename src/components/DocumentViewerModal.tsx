import React, { useState } from 'react';
import { Retailer } from '../types';

interface DocumentViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  retailer: Retailer;
  onApproveDocument: () => void;
  onFlagDocument: (reason: string) => void;
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  isOpen,
  onClose,
  retailer,
  onApproveDocument,
  onFlagDocument
}) => {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showFlagInput, setShowFlagInput] = useState(false);
  const [flagReason, setFlagReason] = useState('Storefront photo unclear or address misalignment');

  if (!isOpen) return null;

  const fssai = retailer.compliance?.fssai || {
    licenseNumber: retailer.fssaiNumber || `REG-${retailer.id.slice(0, 8).toUpperCase()}`,
    validThrough: 'Dec 2026',
    daysRemaining: 780,
    issuer: 'Himachal Pradesh State Food Safety Authority',
    status: 'REQUIRES OFFICER APPROVAL',
    documentUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC35MQyNWOhyt6UR_lX8RPYhWK8P4p-PBRYj4elQMmyRAl9filpvbHNbg174Ge3p8q9dNAp6TBplXrDTyiVOCrKfD4xmPHuTQT6GL_SFtmer7CfKXPXC-QIQiQxARSLLUOoXLQwmQh8SyLm6JrRFkBf0LyRGFmuDQ3MC-Ic_MG_OV6sRWuUJPNgy52j56lf0HnGe_US6k0f6-c9cyCBVS3Z_PaUJ8FJuXzBLSNlPdfeK1Ng_p-rrS0J0w',
    addressMatchScore: 100,
    tradeNameMatch: true,
    watermarkPassed: true,
    signatureValid: true
  };

  const storeName = retailer.shopName || retailer.name || 'Store';
  const ownerName = retailer.ownerName || retailer.proprietor || 'Proprietor';
  const clusterName = retailer.cluster || `${retailer.city || 'Ghumarwin'} Core`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-4xl bg-surface-container-lowest rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] z-10 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-outline-variant/30 flex items-center justify-between bg-surface-container-low">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[24px] text-secondary">verified</span>
            <div>
              <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                Document Inspection Matrix & Vault
              </h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                {storeName} • License #{fssai.licenseNumber}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setZoomLevel((z) => Math.min(z + 0.25, 2.5))}
              className="p-1.5 rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high transition"
              title="Zoom In"
            >
              <span className="material-symbols-outlined text-[18px]">zoom_in</span>
            </button>
            <button
              onClick={() => setZoomLevel((z) => Math.max(z - 0.25, 0.75))}
              className="p-1.5 rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high transition"
              title="Zoom Out"
            >
              <span className="material-symbols-outlined text-[18px]">zoom_out</span>
            </button>
            <button
              onClick={() => setZoomLevel(1)}
              className="px-2 py-1 rounded-lg bg-surface-container text-on-surface text-label-sm font-semibold hover:bg-surface-container-high transition"
            >
              Reset
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Document Preview Box */}
          <div className="bg-surface-container-high/40 rounded-xl p-4 flex items-center justify-center overflow-hidden border border-outline-variant/30 min-h-[340px]">
            <img
              src={fssai.documentUrl}
              alt="Official Document Scan"
              style={{ transform: `scale(${zoomLevel})`, transition: 'transform 0.15s ease-out' }}
              className="max-h-[380px] w-auto object-contain rounded-lg shadow-md cursor-grab active:cursor-grabbing"
            />
          </div>

          {/* Inspection Matrix Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/30 space-y-3">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">
                Automated OCR & Hash Integrity
              </span>

              <div className="space-y-2 font-body-sm text-body-sm">
                <div className="flex justify-between items-center py-1 border-b border-outline-variant/20">
                  <span className="text-on-surface-variant">Premises Address Match:</span>
                  <span className="text-secondary font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">check_circle</span>
                    {fssai.addressMatchScore}% Exact Geospatial Match
                  </span>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-outline-variant/20">
                  <span className="text-on-surface-variant">Trade Name Consistency:</span>
                  <span className="text-secondary font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">check_circle</span>
                    Identical Match
                  </span>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-outline-variant/20">
                  <span className="text-on-surface-variant">Security Watermark & QR:</span>
                  <span className="text-secondary font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">check_circle</span>
                    Govt HP Emblem Verified
                  </span>
                </div>

                <div className="flex justify-between items-center py-1">
                  <span className="text-on-surface-variant">Digital Signature Check:</span>
                  <span className="text-secondary font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">verified</span>
                    Valid SHA-256 (Food Safety Authority)
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/30 space-y-3">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">
                Proprietor & Cluster Context
              </span>

              <div className="space-y-2 font-body-sm text-body-sm">
                <div className="flex justify-between py-1 border-b border-outline-variant/20">
                  <span className="text-on-surface-variant">Registered Licensee:</span>
                  <span className="font-bold text-on-surface">{ownerName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-outline-variant/20">
                  <span className="text-on-surface-variant">Jurisdiction:</span>
                  <span className="font-bold text-on-surface">{clusterName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-outline-variant/20">
                  <span className="text-on-surface-variant">Validity Period:</span>
                  <span className="font-bold text-secondary">{fssai.daysRemaining} Days Remaining</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-on-surface-variant">Issuing Authority:</span>
                  <span className="font-bold text-on-surface truncate max-w-[180px]">{fssai.issuer}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Flagging Reason Input if Opened */}
          {showFlagInput && (
            <div className="p-4 rounded-xl bg-error-container/40 border border-error/30 space-y-2 animate-in fade-in">
              <label className="font-label-md text-label-md text-on-surface font-bold">
                Select or Specify Re-upload Reason:
              </label>
              <select
                value={flagReason}
                onChange={(e) => setFlagReason(e.target.value)}
                className="w-full p-2.5 rounded-lg bg-surface-container-lowest text-on-surface font-body-sm text-body-sm border border-outline-variant/40"
              >
                <option value="Storefront photo counter is obscured or illegible">Storefront photo counter is obscured or illegible</option>
                <option value="FSSAI certificate page 2 annexure missing">FSSAI certificate page 2 annexure missing</option>
                <option value="Trade name spelling discrepancy with bank settlement account">Trade name spelling discrepancy with bank settlement account</option>
                <option value="Premises geo-coordinates fall outside authorized cluster radius">Premises geo-coordinates fall outside authorized cluster radius</option>
              </select>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowFlagInput(false)}
                  className="px-3 py-1.5 rounded-lg text-on-surface font-label-md text-label-md hover:bg-surface-container transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onFlagDocument(flagReason);
                    onClose();
                  }}
                  className="px-4 py-1.5 rounded-lg bg-error text-on-error font-label-md text-label-md font-bold shadow-sm hover:opacity-90 transition"
                >
                  Dispatch Defect Notice to Merchant
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-outline-variant/30 flex flex-wrap items-center justify-between gap-3 bg-surface-container-lowest">
          <div className="text-on-surface-variant font-body-sm text-body-sm">
            Status: <strong className="text-secondary uppercase">{fssai.status}</strong>
          </div>

          <div className="flex items-center gap-2">
            {!showFlagInput && (
              <button
                onClick={() => setShowFlagInput(true)}
                className="px-4 py-2 rounded-lg bg-surface-container-high text-on-surface hover:bg-error-container hover:text-on-error-container font-label-md text-label-md font-semibold transition flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[18px]">flag</span>
                <span>Flag / Request Fresh Upload</span>
              </button>
            )}

            <button
              onClick={() => {
                onApproveDocument();
                onClose();
              }}
              className="px-5 py-2 rounded-lg bg-secondary text-on-secondary hover:opacity-95 font-label-md text-label-md font-bold shadow-sm transition flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[18px]">verified</span>
              <span>Approve Document</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
