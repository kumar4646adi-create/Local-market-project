import React, { useState, useEffect } from 'react';
import { Order, OrderItem, Product } from '../types';
import { updateOrder } from '../services/firebaseService';

interface OrderEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
  storeProducts: Product[];
  onOrderSaved?: () => void;
}

export const OrderEditModal: React.FC<OrderEditModalProps> = ({
  isOpen,
  onClose,
  order,
  storeProducts,
  onOrderSaved
}) => {
  const [items, setItems] = useState<OrderItem[]>([]);
  const [timeLeftSec, setTimeLeftSec] = useState<number>(300);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedAddProductId, setSelectedAddProductId] = useState('');

  // Initialize items from order
  useEffect(() => {
    if (order && order.items) {
      setItems([...order.items]);
    }
  }, [order]);

  // Compute 5-minute countdown from order.placedAt or order.createdAt
  useEffect(() => {
    if (!isOpen || !order) return;

    const placedTime = new Date(order.placedAt || order.createdAt).getTime();
    const expiryTime = placedTime + 5 * 60 * 1000;

    const updateTimer = () => {
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((expiryTime - now) / 1000));
      setTimeLeftSec(remaining);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [isOpen, order]);

  const isExpired = timeLeftSec <= 0 || order.status !== 'placed';

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleUpdateQty = (index: number, delta: number) => {
    if (isExpired) return;
    setItems((prev) => {
      const copy = [...prev];
      const newQty = copy[index].quantity + delta;
      if (newQty <= 0) {
        copy.splice(index, 1);
      } else {
        copy[index] = { ...copy[index], quantity: newQty };
      }
      return copy;
    });
  };

  const handleRemoveItem = (index: number) => {
    if (isExpired) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddProduct = () => {
    if (isExpired || !selectedAddProductId) return;
    const prod = storeProducts.find((p) => p.id === selectedAddProductId);
    if (!prod) return;

    setItems((prev) => {
      const existingIdx = prev.findIndex((i) => i.productId === prod.id);
      if (existingIdx >= 0) {
        const copy = [...prev];
        copy[existingIdx].quantity += 1;
        return copy;
      }
      return [
        ...prev,
        {
          productId: prod.id,
          name: prod.name,
          price: prod.price,
          quantity: 1,
          unit: prod.unit
        }
      ];
    });
    setSelectedAddProductId('');
  };

  const newTotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleSave = async () => {
    if (isExpired) {
      alert('Order editing closed because the 5-minute edit window has expired.');
      return;
    }

    if (items.length === 0) {
      alert('Order cannot be empty. Please keep at least one product.');
      return;
    }

    setIsSaving(true);
    try {
      await updateOrder(order.id, {
        items,
        totalAmount: newTotal
      });
      onOrderSaved?.();
      onClose();
    } catch (err: any) {
      alert(`Failed to update order: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-surface-container-lowest rounded-2xl shadow-2xl border border-outline-variant/30 flex flex-col max-h-[90vh] overflow-hidden z-10 animate-in fade-in zoom-in-95">
        {/* Header with 5-min timer */}
        <div className="p-5 border-b border-outline-variant/20 bg-surface-container-low flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-secondary">edit_note</span>
              <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                Edit Order {order.orderNumber}
              </h3>
            </div>
            <p className="font-body-sm text-[12px] text-on-surface-variant">
              5-minute courtesy window to adjust items & quantities before shop preparation begins.
            </p>
          </div>

          <div
            className={`px-3 py-1.5 rounded-xl font-mono text-sm font-bold flex items-center gap-1.5 shrink-0 ${
              isExpired
                ? 'bg-error-container text-on-error-container'
                : 'bg-secondary-container text-on-secondary-container animate-pulse'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">timer</span>
            <span>{isExpired ? 'Expired' : `${formatTimer(timeLeftSec)} remaining`}</span>
          </div>
        </div>

        {/* Warning if expired or retailer already preparing */}
        {isExpired && (
          <div className="p-3.5 bg-error-container/40 text-on-error-container text-xs font-semibold flex items-center gap-2 border-b border-error/20">
            <span className="material-symbols-outlined text-[18px]">lock</span>
            <span>Order editing closed because the 5-minute edit window has expired or the store has started preparing your items.</span>
          </div>
        )}

        {/* Current Items Editor */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4">
          <div className="space-y-2">
            <span className="font-label-sm text-label-sm uppercase font-bold text-on-surface-variant tracking-wider">
              Current Order Items ({items.length})
            </span>

            {items.map((item, idx) => (
              <div
                key={item.productId || idx}
                className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/20 flex items-center justify-between gap-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-label-md text-label-md font-bold text-on-surface truncate">{item.name}</p>
                  <p className="font-body-sm text-xs text-on-surface-variant">
                    ₹{item.price} {item.unit ? `per ${item.unit}` : ''}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="flex items-center bg-surface-container-lowest rounded-lg border border-outline-variant/30">
                    <button
                      type="button"
                      disabled={isExpired}
                      onClick={() => handleUpdateQty(idx, -1)}
                      className="w-8 h-8 flex items-center justify-center text-on-surface hover:bg-surface-container font-bold disabled:opacity-40"
                    >
                      -
                    </button>
                    <span className="w-8 text-center font-bold text-sm text-on-surface">{item.quantity}</span>
                    <button
                      type="button"
                      disabled={isExpired}
                      onClick={() => handleUpdateQty(idx, 1)}
                      className="w-8 h-8 flex items-center justify-center text-on-surface hover:bg-surface-container font-bold disabled:opacity-40"
                    >
                      +
                    </button>
                  </div>

                  <span className="w-16 text-right font-bold text-on-surface text-sm">
                    ₹{item.price * item.quantity}
                  </span>

                  <button
                    type="button"
                    disabled={isExpired}
                    onClick={() => handleRemoveItem(idx)}
                    className="p-1 rounded text-on-surface-variant hover:text-error hover:bg-error-container/20 transition disabled:opacity-40"
                    title="Remove item"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Add more products dropdown */}
          {!isExpired && storeProducts.length > 0 && (
            <div className="pt-2 border-t border-outline-variant/20 space-y-2">
              <span className="font-label-sm text-label-sm uppercase font-bold text-on-surface-variant tracking-wider">
                + Add Another Product from this Store
              </span>
              <div className="flex gap-2">
                <select
                  value={selectedAddProductId}
                  onChange={(e) => setSelectedAddProductId(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl bg-surface-container-low border border-outline-variant/30 text-on-surface font-body-sm text-body-sm focus:outline-none"
                >
                  <option value="">Select a product to add...</option>
                  {storeProducts
                    .filter((p) => p.available && p.stock > 0)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} — ₹{p.price} (Stock: {p.stock})
                      </option>
                    ))}
                </select>
                <button
                  type="button"
                  disabled={!selectedAddProductId}
                  onClick={handleAddProduct}
                  className="px-4 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md font-bold transition disabled:opacity-40"
                >
                  Add
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer / Total & Submit */}
        <div className="p-4 bg-surface-container-low border-t border-outline-variant/20 flex items-center justify-between">
          <div>
            <span className="text-xs text-on-surface-variant block uppercase font-semibold">Updated Total</span>
            <span className="font-headline-sm text-headline-sm font-bold text-on-surface">₹{newTotal}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-on-surface hover:bg-surface-container transition font-label-md text-label-md"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isExpired || isSaving}
              onClick={handleSave}
              className="px-5 py-2.5 rounded-xl bg-primary hover:bg-neutral-800 text-on-primary font-label-md text-label-md font-bold shadow-sm transition disabled:opacity-50 flex items-center gap-1.5"
            >
              {isSaving ? 'Updating...' : 'Save & Update Order'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
