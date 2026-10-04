import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Order, Retailer } from '../types';

interface OrderPassQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
  retailer?: Retailer | null;
  onConfirmPickupHandover?: () => void;
  isRetailerSide?: boolean;
}

export const OrderPassQrModal: React.FC<OrderPassQrModalProps> = ({
  isOpen,
  onClose,
  order,
  retailer,
  onConfirmPickupHandover,
  isRetailerSide = false
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    if (!isOpen || !order) return;

    const qrPayload = JSON.stringify({
      orderId: order.id,
      orderNumber: order.orderNumber,
      token: order.qrCodeToken || `PASS-${order.id.slice(0, 6)}`,
      total: order.totalAmount,
      customer: order.customerName,
      retailer: order.retailerName
    });

    QRCode.toDataURL(qrPayload, { width: 260, margin: 1 })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error(err));
  }, [isOpen, order]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-sm bg-surface-container-lowest rounded-3xl shadow-2xl border border-outline-variant/30 flex flex-col items-center p-6 text-center z-10 animate-in fade-in zoom-in-95">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-on-surface-variant hover:bg-surface-container transition"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>

        {/* Brand Pass Header */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-bold mb-3">
          <span className="material-symbols-outlined text-[16px]">qr_code_scanner</span>
          Smart Pickup Counter Pass
        </div>

        <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
          {order.orderNumber}
        </h3>
        <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
          {order.retailerName} • ₹{order.totalAmount}
        </p>

        {/* QR Code Container */}
        <div className="my-5 p-3 rounded-2xl bg-white border-2 border-primary shadow-inner flex items-center justify-center">
          {qrDataUrl ? (
            <img src={qrDataUrl} alt="Order QR Pass" className="w-56 h-56 object-contain" />
          ) : (
            <div className="w-56 h-56 flex items-center justify-center text-on-surface-variant font-body-sm">
              Generating Digital Pass...
            </div>
          )}
        </div>

        <div className="w-full bg-surface-container-low p-3 rounded-xl border border-outline-variant/20 text-left space-y-1.5 text-body-sm mb-4">
          <div className="flex justify-between">
            <span className="text-on-surface-variant">Security Token:</span>
            <span className="font-mono font-bold text-on-surface">{order.qrCodeToken || 'TOKEN-ACTIVE'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-on-surface-variant">Customer:</span>
            <span className="font-semibold text-on-surface">{order.customerName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-on-surface-variant">Order Status:</span>
            <span className="uppercase font-bold text-secondary">{order.status.replace(/_/g, ' ')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-on-surface-variant">Items:</span>
            <span className="font-semibold text-on-surface">{order.items.length} items</span>
          </div>
        </div>

        {isRetailerSide && onConfirmPickupHandover ? (
          <button
            onClick={() => {
              onConfirmPickupHandover();
              onClose();
            }}
            className="w-full py-3 rounded-xl bg-secondary text-on-secondary font-label-md text-label-md font-bold shadow-sm hover:opacity-95 transition"
          >
            Verify & Hand Over Order
          </button>
        ) : (
          <div className="text-xs text-on-surface-variant">
            Show this digital barcode pass to the shopkeeper at the counter to collect your order.
          </div>
        )}
      </div>
    </div>
  );
};
