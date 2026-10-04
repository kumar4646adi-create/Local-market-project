import React, { useState, useEffect } from 'react';
import { Retailer, Product, Order } from '../types';
import {
  subscribeRetailerProducts,
  subscribeRetailerOrders,
  addProduct,
  updateProduct,
  deleteProduct,
  updateOrderStatus,
  updateRetailerStatus,
  updateRetailerProfile
} from '../services/firebaseService';

interface RetailerPortalViewProps {
  currentRetailer: Retailer | null;
  allRetailers: Retailer[];
  onSelectRetailerToManage: (retailerId: string) => void;
  onGoToRegistration: () => void;
  onGoToCustomerApp: () => void;
}

export const RetailerPortalView: React.FC<RetailerPortalViewProps> = ({
  currentRetailer,
  allRetailers,
  onSelectRetailerToManage,
  onGoToRegistration,
  onGoToCustomerApp
}) => {
  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'settings'>('orders');

  // Real-time products & orders
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  // Add/Edit Product Modal State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [pName, setPName] = useState('');
  const [pCategory, setPCategory] = useState('Groceries');
  const [pPrice, setPPrice] = useState<number>(100);
  const [pStock, setPStock] = useState<number>(25);
  const [pAvailable, setPAvailable] = useState<boolean>(true);
  const [pDescription, setPDescription] = useState('');
  const [pImageUrl, setPImageUrl] = useState(
    'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80'
  );

  // Settings State
  const [openingTime, setOpeningTime] = useState(currentRetailer?.openingTime || '08:00 AM');
  const [closingTime, setClosingTime] = useState(currentRetailer?.closingTime || '09:00 PM');
  const [closedDay, setClosedDay] = useState(currentRetailer?.closedDay || 'None');
  const [temporarilyClosed, setTemporarilyClosed] = useState(currentRetailer?.temporarilyClosed || false);
  const [enableSmartPickup, setEnableSmartPickup] = useState(
    currentRetailer?.fulfillmentOptions?.includes('Smart Pickup') ?? true
  );
  const [enableDirectDelivery, setEnableDirectDelivery] = useState(
    currentRetailer?.fulfillmentOptions?.includes('Retailer Direct Delivery') ?? false
  );
  const [preparationTime, setPreparationTime] = useState(currentRetailer?.preparationTime || '15 mins');
  const [logoUrl, setLogoUrl] = useState(currentRetailer?.logoUrl || '');
  const [shopImageUrl, setShopImageUrl] = useState(currentRetailer?.shopImageUrl || '');
  const [paymentQrUrl, setPaymentQrUrl] = useState(currentRetailer?.paymentQrUrl || '');
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [previewQrModal, setPreviewQrModal] = useState(false);

  // Resubmission state
  const [isResubmitting, setIsResubmitting] = useState(false);
  const [resubmitAddress, setResubmitAddress] = useState('');

  // Sync settings when currentRetailer updates
  useEffect(() => {
    if (currentRetailer) {
      setOpeningTime(currentRetailer.openingTime || '08:00 AM');
      setClosingTime(currentRetailer.closingTime || '09:00 PM');
      setClosedDay(currentRetailer.closedDay || 'None');
      setTemporarilyClosed(currentRetailer.temporarilyClosed || false);
      setEnableSmartPickup(currentRetailer.fulfillmentOptions?.includes('Smart Pickup') ?? true);
      setEnableDirectDelivery(currentRetailer.fulfillmentOptions?.includes('Retailer Direct Delivery') ?? false);
      setPreparationTime(currentRetailer.preparationTime || '15 mins');
      setLogoUrl(currentRetailer.logoUrl || '');
      setShopImageUrl(currentRetailer.shopImageUrl || '');
      setPaymentQrUrl(currentRetailer.paymentQrUrl || '');
    }
  }, [currentRetailer]);

  // Subscribe to real-time products & orders when currentRetailer changes
  useEffect(() => {
    if (!currentRetailer?.id) return;

    const unsubProducts = subscribeRetailerProducts(currentRetailer.id, (data) => {
      setProducts(data);
    });

    const unsubOrders = subscribeRetailerOrders(currentRetailer.id, (data) => {
      setOrders(data);
    });

    return () => {
      unsubProducts();
      unsubOrders();
    };
  }, [currentRetailer?.id]);

  if (!currentRetailer) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="bg-surface-container-lowest rounded-2xl p-8 border border-outline-variant/20 shadow-sm text-center space-y-4">
          <span className="material-symbols-outlined text-[48px] text-on-surface-variant">store</span>
          <h2 className="font-headline-md text-headline-md font-bold text-on-surface">
            No Retailer Store Selected
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-md mx-auto">
            Select an existing registered store or create a new store application to access the merchant dashboard.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={onGoToRegistration}
              className="px-6 py-2.5 rounded-xl bg-primary text-on-primary font-label-md text-label-md font-bold hover:bg-neutral-800 transition"
            >
              + Register New Store
            </button>

            {allRetailers.length > 0 && (
              <div className="flex items-center gap-2 bg-surface-container-low px-3 py-1.5 rounded-xl border border-outline-variant/30">
                <span className="font-label-sm text-label-sm font-semibold text-on-surface-variant">
                  Switch Store:
                </span>
                <select
                  onChange={(e) => onSelectRetailerToManage(e.target.value)}
                  className="bg-transparent font-label-md text-label-md text-on-surface font-bold focus:outline-none cursor-pointer"
                >
                  <option value="">Select a store...</option>
                  {allRetailers.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.shopName} ({r.city}) - {r.status}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Handle Resubmission
  const handleResubmit = async () => {
    setIsResubmitting(true);
    try {
      await updateRetailerStatus(currentRetailer.id, 'pending_review');
      if (resubmitAddress.trim()) {
        await updateRetailerProfile(currentRetailer.id, { address: resubmitAddress.trim() });
      }
      alert('Application resubmitted successfully. It is now pending review by Super Admin.');
    } catch (err: any) {
      alert(`Resubmission failed: ${err.message}`);
    } finally {
      setIsResubmitting(false);
    }
  };

  // Image Upload helper
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        alert('File size exceeds 3MB limit.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setter(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentRetailer?.id) return;
    setIsSavingSettings(true);
    try {
      const fulfillmentOptions: ('Smart Pickup' | 'Retailer Direct Delivery')[] = [];
      if (enableSmartPickup) fulfillmentOptions.push('Smart Pickup');
      if (enableDirectDelivery) fulfillmentOptions.push('Retailer Direct Delivery');

      await updateRetailerProfile(currentRetailer.id, {
        openingTime,
        closingTime,
        closedDay,
        temporarilyClosed,
        fulfillmentOptions,
        preparationTime,
        logoUrl,
        shopImageUrl,
        paymentQrUrl,
      });
      alert('Store settings & payment QR updated successfully!');
    } catch (err: any) {
      alert(`Failed to save settings: ${err.message}`);
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Metrics
  const todayOrders = orders;
  const todaySales = orders.reduce((sum, o) => (o.status === 'completed' ? sum + o.totalAmount : sum), 0);
  const pendingOrders = orders.filter((o) => o.status === 'placed' || o.status === 'pending' || o.status === 'preparing');
  const completedOrders = orders.filter((o) => o.status === 'completed');
  const pickupOrders = orders.filter((o) => o.fulfillmentType === 'Smart Pickup');
  const deliveryOrders = orders.filter((o) => o.fulfillmentType === 'Store Delivery');
  const lowStockProducts = products.filter((p) => p.stock <= 5);

  // Save Product (Add or Edit)
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pName.trim()) return;

    try {
      if (editingProductId) {
        await updateProduct(editingProductId, {
          name: pName.trim(),
          category: pCategory,
          price: Number(pPrice),
          stock: Number(pStock),
          available: pAvailable,
          description: pDescription.trim(),
          imageUrl: pImageUrl.trim(),
        });
      } else {
        await addProduct({
          retailerId: currentRetailer.id,
          name: pName.trim(),
          category: pCategory,
          price: Number(pPrice),
          stock: Number(pStock),
          available: pAvailable,
          description: pDescription.trim(),
          imageUrl: pImageUrl.trim(),
        });
      }

      resetProductForm();
      setIsProductModalOpen(false);
    } catch (err: any) {
      alert(`Failed to save product: ${err.message}`);
    }
  };

  const resetProductForm = () => {
    setEditingProductId(null);
    setPName('');
    setPCategory('Groceries');
    setPPrice(100);
    setPStock(25);
    setPAvailable(true);
    setPDescription('');
    setPImageUrl('https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80');
  };

  const handleOpenEditProduct = (prod: Product) => {
    setEditingProductId(prod.id);
    setPName(prod.name);
    setPCategory(prod.category);
    setPPrice(prod.price);
    setPStock(prod.stock);
    setPAvailable(prod.available);
    setPDescription(prod.description);
    setPImageUrl(prod.imageUrl);
    setIsProductModalOpen(true);
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!window.confirm('Delete this product from your store inventory?')) return;
    try {
      await deleteProduct(productId);
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Top Header Card */}
      <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-outline-variant/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <img
            src={currentRetailer.logoUrl || 'https://via.placeholder.com/80'}
            alt={currentRetailer.shopName}
            className="w-16 h-16 rounded-xl object-cover border border-outline-variant/30 shadow-xs"
          />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-headline-lg text-headline-lg font-bold text-on-surface">
                {currentRetailer.shopName}
              </h1>
              <span
                className={`px-2.5 py-0.5 rounded-full font-label-sm text-label-sm font-bold uppercase ${
                  currentRetailer.status === 'active'
                    ? 'bg-secondary-container text-on-secondary-container'
                    : currentRetailer.status === 'rejected'
                    ? 'bg-error-container text-on-error-container'
                    : 'bg-tertiary-fixed text-on-tertiary-fixed'
                }`}
              >
                {currentRetailer.status.replace('_', ' ')}
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
              Proprietor: <strong>{currentRetailer.ownerName}</strong> • {currentRetailer.city} ({currentRetailer.area})
            </p>
          </div>
        </div>

        {/* Store Switcher for easy testing */}
        <div className="flex items-center gap-2 shrink-0">
          <select
            value={currentRetailer.id}
            onChange={(e) => onSelectRetailerToManage(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-surface-container-low border border-outline-variant/30 font-label-md text-label-md text-on-surface font-semibold focus:outline-none"
          >
            {allRetailers.map((r) => (
              <option key={r.id} value={r.id}>
                {r.shopName} ({r.city}) - {r.status}
              </option>
            ))}
          </select>

          <button
            onClick={onGoToRegistration}
            className="px-3 py-1.5 rounded-xl bg-primary text-on-primary font-label-md text-label-md font-bold hover:bg-neutral-800 transition"
          >
            + New Store
          </button>
        </div>
      </div>

      {/* STATUS CHECK: If PENDING REVIEW */}
      {currentRetailer.status === 'pending_review' && (
        <div className="bg-surface-container-lowest rounded-2xl p-6 sm:p-8 border border-tertiary-fixed shadow-sm space-y-4">
          <div className="flex items-start gap-4">
            <span className="material-symbols-outlined text-[36px] text-on-tertiary-container">
              hourglass_top
            </span>
            <div className="space-y-1">
              <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                Application Under Verification
              </h2>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Your store application for <strong>{currentRetailer.shopName}</strong> was submitted on{' '}
                {new Date(currentRetailer.createdAt).toLocaleDateString()}. The Super Admin is reviewing your
                business details, GSTIN compliance, and coordinates.
              </p>
              <div className="mt-3 p-3 rounded-lg bg-surface-container-low font-body-sm text-body-sm text-on-surface-variant flex items-center justify-between">
                <span>Once approved, your storefront will immediately go live for customers.</span>
                <span className="font-bold text-secondary">Est. approval time: ~15 mins</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STATUS CHECK: If REJECTED */}
      {currentRetailer.status === 'rejected' && (
        <div className="bg-surface-container-lowest rounded-2xl p-6 sm:p-8 border border-error shadow-sm space-y-4 animate-in fade-in">
          <div className="flex items-start gap-4">
            <span className="material-symbols-outlined text-[36px] text-error">
              error
            </span>
            <div className="space-y-2 flex-1">
              <h2 className="font-headline-sm text-headline-sm font-bold text-error">
                Application Rejected
              </h2>
              <div className="p-4 bg-error-container/40 rounded-xl border border-error/30 text-on-surface font-body-md text-body-md">
                <strong>Reason from Admin:</strong> {currentRetailer.rejectionReason || 'Business information could not be verified.'}
              </div>

              <div className="space-y-2 pt-2">
                <label className="block font-label-md text-label-md font-bold text-on-surface">
                  Update Address or Information to Resubmit:
                </label>
                <input
                  type="text"
                  placeholder="Update shop address or registration notes..."
                  value={resubmitAddress}
                  onChange={(e) => setResubmitAddress(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg bg-surface-container-low border border-outline-variant/30 text-on-surface font-body-sm"
                />
              </div>

              <div className="pt-2">
                <button
                  onClick={handleResubmit}
                  disabled={isResubmitting}
                  className="px-6 py-2.5 rounded-xl bg-primary text-on-primary font-label-md text-label-md font-bold hover:bg-neutral-800 transition"
                >
                  {isResubmitting ? 'Submitting...' : 'Edit & Resubmit'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STATUS CHECK: If ACTIVE - Full Dynamic Retailer Dashboard */}
      {currentRetailer.status === 'active' && (
        <div className="space-y-6">
          {/* Approved & Live Banner */}
          <div className="p-4 rounded-xl bg-secondary-container/40 border border-secondary/30 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-[24px] text-secondary">store</span>
              <p className="font-label-md text-label-md text-on-surface font-bold">
                “Your store has been approved and is now live on LocalMarket.”
              </p>
            </div>
            <button
              onClick={onGoToCustomerApp}
              className="px-3 py-1.5 rounded-lg bg-secondary text-on-secondary font-label-sm text-label-sm font-bold hover:opacity-95 transition"
            >
              View in Customer App →
            </button>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            <div className="p-3 bg-surface-container-lowest rounded-xl border border-outline-variant/20 shadow-xs">
              <span className="text-[11px] font-bold text-on-surface-variant uppercase">Today's Orders</span>
              <p className="font-headline-sm text-headline-sm font-bold text-on-surface mt-1">{todayOrders.length}</p>
            </div>

            <div className="p-3 bg-surface-container-lowest rounded-xl border border-outline-variant/20 shadow-xs">
              <span className="text-[11px] font-bold text-on-surface-variant uppercase">GMV Today</span>
              <p className="font-headline-sm text-headline-sm font-bold text-secondary mt-1">₹{todaySales}</p>
            </div>

            <div className="p-3 bg-surface-container-lowest rounded-xl border border-outline-variant/20 shadow-xs">
              <span className="text-[11px] font-bold text-on-surface-variant uppercase">Pending Queue</span>
              <p className="font-headline-sm text-headline-sm font-bold text-amber-600 mt-1">{pendingOrders.length}</p>
            </div>

            <div className="p-3 bg-surface-container-lowest rounded-xl border border-outline-variant/20 shadow-xs">
              <span className="text-[11px] font-bold text-on-surface-variant uppercase">Completed</span>
              <p className="font-headline-sm text-headline-sm font-bold text-on-surface mt-1">{completedOrders.length}</p>
            </div>

            <div className="p-3 bg-surface-container-lowest rounded-xl border border-outline-variant/20 shadow-xs">
              <span className="text-[11px] font-bold text-on-surface-variant uppercase">Smart Pickups</span>
              <p className="font-headline-sm text-headline-sm font-bold text-on-surface mt-1">{pickupOrders.length}</p>
            </div>

            <div className="p-3 bg-surface-container-lowest rounded-xl border border-outline-variant/20 shadow-xs">
              <span className="text-[11px] font-bold text-on-surface-variant uppercase">Deliveries</span>
              <p className="font-headline-sm text-headline-sm font-bold text-on-surface mt-1">{deliveryOrders.length}</p>
            </div>

            <div className="p-3 bg-surface-container-lowest rounded-xl border border-outline-variant/20 shadow-xs">
              <span className="text-[11px] font-bold text-on-surface-variant uppercase">Low Stock SKUs</span>
              <p className="font-headline-sm text-headline-sm font-bold text-error mt-1">{lowStockProducts.length}</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-outline-variant/20 pb-1">
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-4 py-2 rounded-lg font-label-md text-label-md font-bold transition ${
                activeTab === 'orders'
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Counter Orders & Passes ({orders.length})
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className={`px-4 py-2 rounded-lg font-label-md text-label-md font-bold transition ${
                activeTab === 'products'
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Product & Inventory Catalog ({products.length})
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-4 py-2 rounded-lg font-label-md text-label-md font-bold transition flex items-center gap-1.5 ${
                activeTab === 'settings'
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">settings</span>
              <span>Store Settings & Payment QR</span>
            </button>
          </div>

          {/* TAB 1: ORDERS STREAM & SMART PICKUP HANDOVER */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                    Incoming Order Queue & Counter Passes
                  </h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Real-time orders placed specifically for {currentRetailer.shopName}.
                  </p>
                </div>
              </div>

              {orders.length === 0 ? (
                <div className="p-12 text-center bg-surface-container-lowest rounded-2xl border border-outline-variant/20 space-y-3">
                  <span className="material-symbols-outlined text-[42px] text-on-surface-variant">
                    inbox
                  </span>
                  <p className="font-headline-sm text-headline-sm font-bold text-on-surface">
                    No orders received yet
                  </p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant max-w-sm mx-auto">
                    When customers in {currentRetailer.city} place a Smart Pickup or Delivery order, it will appear here in real-time.
                  </p>
                  <button
                    onClick={onGoToCustomerApp}
                    className="px-4 py-2 rounded-xl bg-secondary text-on-secondary font-label-md text-label-md font-bold shadow-xs hover:opacity-95 transition"
                  >
                    Place a Test Order as Customer →
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {orders.map((order) => {
                    const isArrived = order.status === 'arrived';
                    const isCompleted = order.status === 'completed';

                    return (
                      <div
                        key={order.id}
                        className={`p-5 rounded-2xl bg-surface-container-lowest border space-y-3 shadow-xs ${
                          isArrived
                            ? 'border-secondary ring-2 ring-secondary/40'
                            : 'border-outline-variant/20'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="font-label-sm text-label-sm font-bold text-secondary uppercase">
                              {order.fulfillmentType}
                            </span>
                            <h4 className="font-headline-sm text-headline-sm font-bold text-on-surface mt-0.5">
                              {order.orderNumber}
                            </h4>
                            <p className="font-body-sm text-body-sm text-on-surface-variant">
                              Customer: <strong>{order.customerName}</strong> ({order.customerPhone || 'N/A'})
                            </p>
                          </div>
                          <span
                            className={`px-3 py-1 rounded-full font-label-sm text-label-sm font-bold uppercase ${
                              isCompleted
                                ? 'bg-surface-container text-on-surface-variant'
                                : isArrived
                                ? 'bg-secondary text-on-secondary animate-bounce'
                                : 'bg-secondary-container text-on-secondary-container'
                            }`}
                          >
                            {order.status}
                          </span>
                        </div>

                        {/* Order items */}
                        <div className="p-3 bg-surface-container-low rounded-xl space-y-1.5 text-body-sm font-body-sm">
                          {order.items.map((it, idx) => (
                            <div key={idx} className="flex justify-between text-on-surface">
                              <span>
                                {it.quantity}x {it.name}
                              </span>
                              <span className="font-bold">₹{it.price * it.quantity}</span>
                            </div>
                          ))}
                          <div className="pt-2 border-t border-outline-variant/20 flex justify-between font-bold text-on-surface">
                            <span>Total Bill:</span>
                            <span className="text-secondary font-bold">₹{order.totalAmount}</span>
                          </div>
                        </div>

                        {/* Customer "I'M HERE" Banner Alert */}
                        {isArrived && (
                          <div className="mt-3 p-3 bg-secondary-container rounded-xl flex items-center justify-between text-on-secondary-container font-label-md text-label-md font-bold">
                            <span className="flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-[20px]">qr_code_scanner</span>
                              Customer at Counter with Pass!
                            </span>
                            <span className="font-mono bg-surface-container-lowest px-2 py-0.5 rounded text-on-surface">
                              Token: {order.qrCodeToken || '#PASS-99'}
                            </span>
                          </div>
                        )}

                        {/* Order Action Buttons */}
                        <div className="mt-4 flex items-center justify-end gap-2 pt-2 border-t border-outline-variant/20">
                          {(order.status === 'placed' || order.status === 'pending') && (
                            <button
                              onClick={() => updateOrderStatus(order.id, 'preparing')}
                              className="px-4 py-1.5 rounded-lg bg-primary text-on-primary font-label-sm text-label-sm font-bold shadow-xs hover:bg-neutral-800 transition"
                            >
                              Accept & Prepare
                            </button>
                          )}

                          {order.status === 'preparing' && (
                            <button
                              onClick={() => updateOrderStatus(order.id, 'ready')}
                              className="px-4 py-1.5 rounded-lg bg-secondary text-on-secondary font-label-sm text-label-sm font-bold shadow-xs hover:opacity-95 transition"
                            >
                              Mark Ready for Pickup
                            </button>
                          )}

                          {(order.status === 'ready' || order.status === 'arrived') && (
                            <button
                              onClick={() => updateOrderStatus(order.id, 'completed')}
                              className="px-4 py-2 rounded-lg bg-secondary text-on-secondary font-label-md text-label-md font-bold shadow-md hover:opacity-95 transition flex items-center gap-1.5"
                            >
                              <span className="material-symbols-outlined text-[18px]">verified</span>
                              <span>Scan Pass & Complete Handover</span>
                            </button>
                          )}

                          {isCompleted && (
                            <span className="text-secondary font-bold text-label-sm flex items-center gap-1">
                              <span className="material-symbols-outlined text-[16px]">check_circle</span>
                              Handover Completed
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PRODUCTS & INVENTORY MANAGEMENT */}
          {activeTab === 'products' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                    Store Products & Inventory
                  </h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Manage the items available for Smart Pickup and Local Delivery.
                  </p>
                </div>
                <button
                  onClick={() => {
                    resetProductForm();
                    setIsProductModalOpen(true);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-primary text-on-primary font-label-md text-label-md font-bold shadow-xs hover:bg-neutral-800 transition flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  <span>+ Add Product</span>
                </button>
              </div>

              {products.length === 0 ? (
                <div className="p-12 text-center bg-surface-container-lowest rounded-2xl border border-outline-variant/20 space-y-3">
                  <span className="material-symbols-outlined text-[42px] text-on-surface-variant">
                    inventory_2
                  </span>
                  <p className="font-headline-sm text-headline-sm font-bold text-on-surface">
                    No products added yet
                  </p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant max-w-sm mx-auto">
                    Add your store's inventory items so nearby customers in {currentRetailer.city} can browse and place orders.
                  </p>
                  <button
                    onClick={() => {
                      resetProductForm();
                      setIsProductModalOpen(true);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-primary text-on-primary font-label-md text-label-md font-bold hover:bg-neutral-800 transition"
                  >
                    + Add Your First Product
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {products.map((prod) => (
                    <div
                      key={prod.id}
                      className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/20 shadow-xs flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <img
                          src={prod.imageUrl}
                          alt={prod.name}
                          className="w-full h-36 object-cover rounded-lg border border-outline-variant/20"
                        />
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-on-surface-variant uppercase">
                              {prod.category}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                prod.available && prod.stock > 0
                                  ? 'bg-secondary-container text-on-secondary-container'
                                  : 'bg-error-container text-on-error-container'
                              }`}
                            >
                              {prod.available && prod.stock > 0 ? 'IN STOCK' : 'OUT OF STOCK'}
                            </span>
                          </div>
                          <h4 className="font-headline-sm text-[16px] font-bold text-on-surface mt-1 truncate">
                            {prod.name}
                          </h4>
                          <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-2 mt-0.5">
                            {prod.description}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-outline-variant/20 flex items-center justify-between">
                        <div>
                          <span className="font-headline-sm text-[18px] font-bold text-on-surface">
                            ₹{prod.price}
                          </span>
                          <span className="text-[11px] text-on-surface-variant ml-1 font-semibold">
                            (Stock: {prod.stock})
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleOpenEditProduct(prod)}
                            className="p-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface transition"
                            title="Edit Product"
                          >
                            <span className="material-symbols-outlined text-[16px]">edit</span>
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(prod.id)}
                            className="p-1.5 rounded-lg bg-surface-container hover:bg-error-container hover:text-on-error-container text-on-surface transition"
                            title="Delete Product"
                          >
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: STORE SETTINGS & PAYMENT QR */}
          {activeTab === 'settings' && (
            <form onSubmit={handleSaveSettings} className="space-y-6">
              {/* Timings & Operational Status */}
              <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/20 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                    Store Timings & Operational Controls
                  </h3>
                  <span className="text-xs font-bold text-secondary uppercase bg-secondary-container px-2.5 py-1 rounded-full">
                    Live Configuration
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant uppercase mb-1">
                      Opening Time
                    </label>
                    <input
                      type="text"
                      value={openingTime}
                      onChange={(e) => setOpeningTime(e.target.value)}
                      placeholder="e.g. 08:00 AM"
                      className="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-outline-variant/30 text-on-surface font-body-md"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant uppercase mb-1">
                      Closing Time
                    </label>
                    <input
                      type="text"
                      value={closingTime}
                      onChange={(e) => setClosingTime(e.target.value)}
                      placeholder="e.g. 09:00 PM"
                      className="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-outline-variant/30 text-on-surface font-body-md"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant uppercase mb-1">
                      Weekly Closed Day
                    </label>
                    <select
                      value={closedDay}
                      onChange={(e) => setClosedDay(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-outline-variant/30 text-on-surface font-body-md"
                    >
                      <option value="None">None (Open 7 Days)</option>
                      <option value="Sunday">Sunday</option>
                      <option value="Monday">Monday</option>
                      <option value="Tuesday">Tuesday</option>
                      <option value="Wednesday">Wednesday</option>
                      <option value="Thursday">Thursday</option>
                      <option value="Friday">Friday</option>
                      <option value="Saturday">Saturday</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant uppercase mb-1">
                      Handover SLA
                    </label>
                    <input
                      type="text"
                      value={preparationTime}
                      onChange={(e) => setPreparationTime(e.target.value)}
                      placeholder="e.g. 15 mins"
                      className="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-outline-variant/30 text-on-surface font-body-md"
                    />
                  </div>
                </div>

                {/* Temporarily Closed & Fulfillment Options */}
                <div className="pt-3 border-t border-outline-variant/20 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <label className="flex items-center gap-2 p-3 bg-surface-container-low rounded-xl cursor-pointer">
                    <input
                      type="checkbox"
                      checked={temporarilyClosed}
                      onChange={(e) => setTemporarilyClosed(e.target.checked)}
                      className="w-5 h-5 accent-error"
                    />
                    <span className="text-xs font-bold text-on-surface">Mark Store Temporarily Closed</span>
                  </label>

                  <label className="flex items-center gap-2 p-3 bg-surface-container-low rounded-xl cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enableSmartPickup}
                      onChange={(e) => setEnableSmartPickup(e.target.checked)}
                      className="w-5 h-5 accent-secondary"
                    />
                    <span className="text-xs font-bold text-on-surface">Enable Smart Pickup</span>
                  </label>

                  <label className="flex items-center gap-2 p-3 bg-surface-container-low rounded-xl cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enableDirectDelivery}
                      onChange={(e) => setEnableDirectDelivery(e.target.checked)}
                      className="w-5 h-5 accent-secondary"
                    />
                    <span className="text-xs font-bold text-on-surface">Enable Direct Delivery</span>
                  </label>
                </div>
              </div>

              {/* Retailer Payment QR Section */}
              <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/20 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                      Payment QR (UPI Direct to Store)
                    </h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      Upload your real store UPI QR code so customers can scan and pay directly to your account.
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded bg-secondary-container text-on-secondary-container text-xs font-bold">
                    Pay Directly to This Store
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                  {/* Left: QR Controls */}
                  <div className="space-y-3">
                    <label className="block text-xs font-bold uppercase text-on-surface-variant">
                      Upload UPI QR Code Image
                    </label>

                    <div className="flex items-center gap-3">
                      <label className="px-4 py-2 rounded-xl bg-primary text-on-primary font-label-md text-label-md font-bold hover:bg-neutral-800 transition cursor-pointer flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px]">upload</span>
                        <span>{paymentQrUrl ? 'Replace QR' : 'Upload QR Image'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageFileChange(e, setPaymentQrUrl)}
                          className="hidden"
                        />
                      </label>

                      {paymentQrUrl && (
                        <>
                          <button
                            type="button"
                            onClick={() => setPreviewQrModal(true)}
                            className="px-3 py-2 rounded-xl bg-surface-container text-on-surface font-label-sm text-label-sm font-bold hover:bg-surface-container-high transition flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-[16px]">visibility</span>
                            <span>Preview</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setPaymentQrUrl('')}
                            className="px-3 py-2 rounded-xl bg-error-container text-on-error-container font-label-sm text-label-sm font-bold hover:opacity-90 transition flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                            <span>Delete QR</span>
                          </button>
                        </>
                      )}
                    </div>

                    <p className="text-xs text-on-surface-variant">
                      Accepts standard BharatPe, Google Pay, Paytm, PhonePe, or BHIM merchant QR images.
                    </p>
                  </div>

                  {/* Right: QR Preview Display */}
                  <div className="p-4 bg-surface-container-low rounded-xl border border-outline-variant/30 flex flex-col items-center text-center space-y-2">
                    {paymentQrUrl ? (
                      <>
                        <img
                          src={paymentQrUrl}
                          alt="Merchant UPI QR Code"
                          className="w-40 h-40 object-contain rounded-lg border border-outline-variant/30 bg-white p-2 shadow-xs"
                        />
                        <p className="text-xs font-bold text-on-surface">
                          "Pay directly to this store"
                        </p>
                        <p className="text-[11px] text-on-surface-variant font-mono">
                          {currentRetailer.shopName} UPI Gateway
                        </p>
                      </>
                    ) : (
                      <div className="py-8 text-on-surface-variant space-y-2">
                        <span className="material-symbols-outlined text-[36px]">qr_code_2</span>
                        <p className="text-xs font-semibold">No UPI QR code uploaded yet</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Store Branding & Photographs */}
              <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/20 shadow-xs space-y-4">
                <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                  Store Logo & Shop Photographs
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Logo */}
                  <div className="p-4 bg-surface-container-low rounded-xl border border-outline-variant/30 space-y-3">
                    <label className="block text-xs font-bold uppercase text-on-surface-variant">
                      Store Logo
                    </label>
                    <div className="flex items-center gap-3">
                      <img
                        src={logoUrl || 'https://via.placeholder.com/80'}
                        alt="Store Logo"
                        className="w-16 h-16 rounded-xl object-cover border border-outline-variant/30 shrink-0"
                      />
                      <label className="px-3 py-1.5 rounded-lg bg-surface-container-lowest border border-outline-variant/30 text-on-surface font-label-sm text-label-sm font-bold cursor-pointer hover:bg-surface-container">
                        Replace Logo
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageFileChange(e, setLogoUrl)}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Shop Image */}
                  <div className="p-4 bg-surface-container-low rounded-xl border border-outline-variant/30 space-y-3">
                    <label className="block text-xs font-bold uppercase text-on-surface-variant">
                      Main Storefront Photograph
                    </label>
                    <div className="flex items-center gap-3">
                      <img
                        src={shopImageUrl || 'https://via.placeholder.com/120x80'}
                        alt="Shop Front"
                        className="w-24 h-16 rounded-xl object-cover border border-outline-variant/30 shrink-0"
                      />
                      <label className="px-3 py-1.5 rounded-lg bg-surface-container-lowest border border-outline-variant/30 text-on-surface font-label-sm text-label-sm font-bold cursor-pointer hover:bg-surface-container">
                        Replace Photo
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageFileChange(e, setShopImageUrl)}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit / Save Button */}
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isSavingSettings}
                  className="px-8 py-3 rounded-xl bg-primary text-on-primary font-label-lg text-label-lg font-bold shadow-md hover:bg-neutral-800 disabled:opacity-50 transition"
                >
                  {isSavingSettings ? 'Saving Settings...' : 'Save Storefront Settings'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Add / Edit Product Modal */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsProductModalOpen(false)} />
          <form
            onSubmit={handleSaveProduct}
            className="relative w-full max-w-lg bg-surface-container-lowest rounded-2xl shadow-xl p-6 z-10 border border-outline-variant/30 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
              <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                {editingProductId ? 'Edit Product' : 'Add New Product'}
              </h3>
              <button
                type="button"
                onClick={() => setIsProductModalOpen(false)}
                className="p-1 rounded-lg text-on-surface-variant hover:bg-surface-container"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div>
              <label className="block font-label-md text-label-md font-bold text-on-surface mb-1">
                Product Name *
              </label>
              <input
                type="text"
                required
                value={pName}
                onChange={(e) => setPName(e.target.value)}
                placeholder="e.g. Fresh Atta 5kg"
                className="w-full px-3.5 py-2 rounded-lg bg-surface-container-low border border-outline-variant/30 font-body-md text-on-surface focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-label-md text-label-md font-bold text-on-surface mb-1">
                  Price (₹) *
                </label>
                <input
                  type="number"
                  required
                  value={pPrice}
                  onChange={(e) => setPPrice(Number(e.target.value))}
                  className="w-full px-3.5 py-2 rounded-lg bg-surface-container-low border border-outline-variant/30 font-body-md text-on-surface focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-label-md text-label-md font-bold text-on-surface mb-1">
                  Stock Units *
                </label>
                <input
                  type="number"
                  required
                  value={pStock}
                  onChange={(e) => setPStock(Number(e.target.value))}
                  className="w-full px-3.5 py-2 rounded-lg bg-surface-container-low border border-outline-variant/30 font-body-md text-on-surface focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-label-md text-label-md font-bold text-on-surface mb-1">
                Category
              </label>
              <select
                value={pCategory}
                onChange={(e) => setPCategory(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg bg-surface-container-low border border-outline-variant/30 font-body-md text-on-surface"
              >
                <option value="Groceries">Groceries & Daily Essentials</option>
                <option value="Dairy & Sweets">Dairy & Sweets</option>
                <option value="Fresh Bakery">Fresh Bakery</option>
                <option value="Health & OTC">Health & OTC</option>
                <option value="Beverages">Beverages</option>
                <option value="Snacks">Snacks & Confectionery</option>
              </select>
            </div>

            <div>
              <label className="block font-label-md text-label-md font-bold text-on-surface mb-1">
                Product Image URL
              </label>
              <input
                type="text"
                value={pImageUrl}
                onChange={(e) => setPImageUrl(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg bg-surface-container-low border border-outline-variant/30 font-body-md text-on-surface"
              />
            </div>

            <div>
              <label className="block font-label-md text-label-md font-bold text-on-surface mb-1">
                Short Description
              </label>
              <textarea
                rows={2}
                value={pDescription}
                onChange={(e) => setPDescription(e.target.value)}
                placeholder="Product details, weight, ingredients..."
                className="w-full px-3.5 py-2 rounded-lg bg-surface-container-low border border-outline-variant/30 font-body-sm text-on-surface"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="availableCheck"
                checked={pAvailable}
                onChange={(e) => setPAvailable(e.target.checked)}
                className="w-5 h-5 accent-secondary"
              />
              <label htmlFor="availableCheck" className="font-label-md text-label-md font-bold text-on-surface cursor-pointer">
                Product is Available for Ordering
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-outline-variant/20">
              <button
                type="button"
                onClick={() => setIsProductModalOpen(false)}
                className="px-4 py-2 rounded-xl text-on-surface font-label-md text-label-md hover:bg-surface-container transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 rounded-xl bg-primary text-on-primary font-label-md text-label-md font-bold hover:bg-neutral-800 transition"
              >
                Save Product
              </button>
            </div>
          </form>
        </div>
      )}

      {/* QR Code Zoom Preview Modal */}
      {previewQrModal && paymentQrUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setPreviewQrModal(false)} />
          <div className="relative bg-surface-container-lowest p-6 rounded-2xl shadow-2xl max-w-sm w-full border border-outline-variant/30 text-center space-y-4 z-10 animate-in zoom-in-95">
            <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
              Store UPI QR Code
            </h3>
            <p className="text-xs text-on-surface-variant font-bold uppercase">
              Pay Directly to This Store
            </p>
            <div className="p-4 bg-white rounded-xl border border-outline-variant/20 inline-block shadow-sm">
              <img src={paymentQrUrl} alt="Store QR Preview" className="w-56 h-56 object-contain" />
            </div>
            <p className="text-xs text-on-surface-variant">
              This QR code is presented to customers during counter and delivery checkouts.
            </p>
            <button
              onClick={() => setPreviewQrModal(false)}
              className="w-full py-2.5 rounded-xl bg-primary text-on-primary font-label-md text-label-md font-bold hover:bg-neutral-800 transition"
            >
              Close Preview
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
