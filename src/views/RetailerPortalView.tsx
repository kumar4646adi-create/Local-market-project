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

  // Resubmission state
  const [isResubmitting, setIsResubmitting] = useState(false);
  const [resubmitAddress, setResubmitAddress] = useState('');

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

  // Metrics
  const todayOrders = orders;
  const todaySales = orders.reduce((sum, o) => (o.status === 'completed' ? sum + o.totalAmount : sum), 0);
  const pendingOrders = orders.filter((o) => o.status === 'pending' || o.status === 'preparing');
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
          createdAt: new Date().toISOString(),
        });
      }
      setIsProductModalOpen(false);
      resetProductForm();
    } catch (err: any) {
      alert(`Product save failed: ${err.message}`);
    }
  };

  const resetProductForm = () => {
    setEditingProductId(null);
    setPName('');
    setPPrice(100);
    setPStock(25);
    setPAvailable(true);
    setPDescription('');
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

  const handleDeleteProduct = async (id: string) => {
    if (confirm('Delete this product from your inventory?')) {
      await deleteProduct(id);
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
                business details, FSSAI compliance, and GPS geofencing.
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
              <span className="text-[11px] font-bold text-on-surface-variant uppercase">Today's Sales</span>
              <p className="font-headline-sm text-headline-sm font-bold text-secondary mt-1">₹{todaySales}</p>
            </div>

            <div className="p-3 bg-surface-container-lowest rounded-xl border border-outline-variant/20 shadow-xs">
              <span className="text-[11px] font-bold text-on-surface-variant uppercase">Pending</span>
              <p className="font-headline-sm text-headline-sm font-bold text-on-surface mt-1">{pendingOrders.length}</p>
            </div>

            <div className="p-3 bg-surface-container-lowest rounded-xl border border-outline-variant/20 shadow-xs">
              <span className="text-[11px] font-bold text-on-surface-variant uppercase">Completed</span>
              <p className="font-headline-sm text-headline-sm font-bold text-on-surface mt-1">{completedOrders.length}</p>
            </div>

            <div className="p-3 bg-surface-container-lowest rounded-xl border border-outline-variant/20 shadow-xs">
              <span className="text-[11px] font-bold text-on-surface-variant uppercase">Pickup Passes</span>
              <p className="font-headline-sm text-headline-sm font-bold text-on-surface mt-1">{pickupOrders.length}</p>
            </div>

            <div className="p-3 bg-surface-container-lowest rounded-xl border border-outline-variant/20 shadow-xs">
              <span className="text-[11px] font-bold text-on-surface-variant uppercase">Deliveries</span>
              <p className="font-headline-sm text-headline-sm font-bold text-on-surface mt-1">{deliveryOrders.length}</p>
            </div>

            <div className="p-3 bg-surface-container-lowest rounded-xl border border-outline-variant/20 shadow-xs">
              <span className="text-[11px] font-bold text-error uppercase">Low Stock</span>
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
                    const isReady = order.status === 'ready';
                    const isCompleted = order.status === 'completed';

                    return (
                      <div
                        key={order.id}
                        className={`p-5 rounded-2xl bg-surface-container-lowest border transition-all ${
                          isArrived
                            ? 'border-secondary ring-2 ring-secondary/30 shadow-md bg-secondary-container/10'
                            : 'border-outline-variant/20 shadow-xs'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="font-label-sm text-label-sm uppercase font-bold text-on-surface-variant">
                              {order.orderNumber || order.id}
                            </span>
                            <h4 className="font-headline-sm text-[16px] font-bold text-on-surface mt-0.5">
                              {order.customerName}
                            </h4>
                          </div>
                          <span
                            className={`px-2.5 py-0.5 rounded-full font-label-sm text-label-sm font-bold uppercase ${
                              isCompleted
                                ? 'bg-surface-container text-on-surface-variant'
                                : isArrived
                                ? 'bg-secondary text-on-secondary animate-pulse'
                                : isReady
                                ? 'bg-secondary-container text-on-secondary-container'
                                : 'bg-tertiary-fixed text-on-tertiary-fixed'
                            }`}
                          >
                            {order.status === 'arrived' ? 'Customer Arrived!' : order.status}
                          </span>
                        </div>

                        {/* Order Items */}
                        <div className="mt-3 p-3 bg-surface-container-low rounded-xl text-body-sm font-body-sm space-y-1">
                          <div className="flex justify-between font-bold text-on-surface border-b border-outline-variant/20 pb-1 mb-1">
                            <span>Fulfillment: {order.fulfillmentType}</span>
                            <span>ETA: {order.customerETA}</span>
                          </div>
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-on-surface-variant">
                              <span>
                                {item.quantity}x {item.name}
                              </span>
                              <span className="font-semibold text-on-surface">
                                ₹{item.price * item.quantity}
                              </span>
                            </div>
                          ))}
                          <div className="flex justify-between font-bold text-on-surface pt-1 border-t border-outline-variant/20">
                            <span>Total Amount</span>
                            <span className="text-secondary text-base">₹{order.totalAmount}</span>
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
                          {order.status === 'pending' && (
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
    </div>
  );
};
