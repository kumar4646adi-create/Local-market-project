import React, { useState, useEffect } from 'react';
import { Retailer, Product, Order, OrderItem } from '../types';
import {
  subscribeActiveRetailers,
  subscribeRetailerProducts,
  subscribeCustomerOrders,
  createOrder,
  updateOrderStatus
} from '../services/firebaseService';

interface CustomerAppViewProps {
  onGoToRegistration: () => void;
  onGoToAdmin: () => void;
}

export const CustomerAppView: React.FC<CustomerAppViewProps> = ({
  onGoToRegistration,
  onGoToAdmin
}) => {
  // Town Location & Active Stores
  const [selectedTown, setSelectedTown] = useState<string>('Ghumarwin');
  const [activeStores, setActiveStores] = useState<Retailer[]>([]);
  const [selectedStore, setSelectedStore] = useState<Retailer | null>(null);
  const [storeProducts, setStoreProducts] = useState<Product[]>([]);

  // Cart: Map from productId to { product, quantity }
  const [cart, setCart] = useState<Record<string, { product: Product; quantity: number }>>({});
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Fulfillment Choice in Checkout
  const [fulfillmentType, setFulfillmentType] = useState<'Smart Pickup' | 'Store Delivery'>('Smart Pickup');
  const [selectedETA, setSelectedETA] = useState<string>('20 min');
  const [customerName, setCustomerName] = useState('Rahul Kumar');
  const [customerPhone, setCustomerPhone] = useState('+91 94182 11094');
  const [deliveryAddress, setDeliveryAddress] = useState('House #24, Near Civil Hospital, Ghumarwin');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  // Customer Orders
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<'explore' | 'passes'>('explore');

  // Customer ID for demo simulation
  const customerId = 'cust-rahul-hp01';

  // Real-time listener for active stores
  useEffect(() => {
    const unsub = subscribeActiveRetailers((stores) => {
      setActiveStores(stores);
      if (selectedStore) {
        // refresh current store if status changed
        const refreshed = stores.find((s) => s.id === selectedStore.id);
        if (refreshed) setSelectedStore(refreshed);
      }
    });
    return () => unsub();
  }, [selectedStore?.id]);

  // Real-time listener for customer orders
  useEffect(() => {
    const unsub = subscribeCustomerOrders(customerId, (orders) => {
      setCustomerOrders(orders);
    });
    return () => unsub();
  }, []);

  // Fetch products when a store is selected
  useEffect(() => {
    if (!selectedStore) {
      setStoreProducts([]);
      return;
    }
    const unsub = subscribeRetailerProducts(selectedStore.id, (prods) => {
      setStoreProducts(prods);
    });
    return () => unsub();
  }, [selectedStore?.id]);

  // Distance calculator simulation relative to town center
  const getSimulatedDistance = (store: Retailer) => {
    if (store.city.toLowerCase() !== selectedTown.toLowerCase()) {
      return (14.5 + Math.abs(store.latitude - 31.4429) * 10).toFixed(1);
    }
    // Same town: simulated between 0.4 and 2.4 km
    const dist = (0.5 + Math.abs(store.latitude % 0.05) * 20).toFixed(1);
    return dist;
  };

  // Filter and sort stores
  const sortedStores = [...activeStores]
    .map((store) => ({
      ...store,
      distanceKm: parseFloat(getSimulatedDistance(store)),
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm);

  // Cart operations
  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev[product.id];
      const newQty = existing ? existing.quantity + 1 : 1;
      return {
        ...prev,
        [product.id]: { product, quantity: newQty },
      };
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) => {
      const existing = prev[productId];
      if (!existing) return prev;
      const newQty = existing.quantity + delta;
      if (newQty <= 0) {
        const copy = { ...prev };
        delete copy[productId];
        return copy;
      }
      return {
        ...prev,
        [productId]: { ...existing, quantity: newQty },
      };
    });
  };

  const cartItems = Object.values(cart);
  const cartTotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  // Place Order
  const handlePlaceOrder = async () => {
    if (!selectedStore || cartItems.length === 0) return;

    setIsPlacingOrder(true);
    try {
      const orderNumber = `#LM-${Math.floor(1000 + Math.random() * 9000)}`;
      const qrCodeToken = `PASS-${Math.floor(100000 + Math.random() * 900000)}`;

      const orderItems: OrderItem[] = cartItems.map((ci) => ({
        productId: ci.product.id,
        name: ci.product.name,
        price: ci.product.price,
        quantity: ci.quantity,
      }));

      await createOrder({
        customerId,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        retailerId: selectedStore.id,
        retailerName: selectedStore.shopName,
        items: orderItems,
        totalAmount: cartTotal,
        fulfillmentType,
        customerETA: fulfillmentType === 'Smart Pickup' ? selectedETA : 'Store Dispatched',
        status: 'pending',
        orderNumber,
        qrCodeToken,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deliveryAddress: fulfillmentType === 'Store Delivery' ? deliveryAddress : undefined,
      });

      setCart({});
      setIsCartOpen(false);
      setActiveTab('passes');
      alert(`Order ${orderNumber} placed successfully! The merchant has been notified in real time.`);
    } catch (err: any) {
      alert(`Order placement failed: ${err.message}`);
    } finally {
      setIsPlacingOrder(false);
    }
  };

  // Customer triggers "I'M HERE"
  const handleMarkArrivedAtCounter = async (orderId: string) => {
    try {
      await updateOrderStatus(orderId, 'arrived');
      alert('Counter staff alerted! Please present your pass QR / Token at the billing desk.');
    } catch (err: any) {
      alert(`Update failed: ${err.message}`);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Top Navigation & Location Bar */}
      <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm border border-outline-variant/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-secondary animate-pulse" />
            <span className="font-label-sm text-label-sm font-bold text-secondary uppercase tracking-wider">
              LocalMarket Consumer Portal
            </span>
          </div>
          <h1 className="font-headline-lg text-headline-lg font-bold text-on-surface">
            Discover Verified Local Dukaans
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Browse real-time products, order ahead, and skip queues with 2-minute Smart Pickup passes.
          </p>
        </div>

        {/* Location Selector */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-surface-container-low px-3.5 py-2 rounded-xl border border-outline-variant/30">
            <span className="material-symbols-outlined text-[20px] text-secondary">location_on</span>
            <div className="flex flex-col text-left">
              <span className="text-[10px] uppercase font-bold text-on-surface-variant leading-none">Your Location</span>
              <select
                value={selectedTown}
                onChange={(e) => setSelectedTown(e.target.value)}
                className="bg-transparent font-label-md text-label-md text-on-surface font-bold focus:outline-none cursor-pointer"
              >
                <option value="Ghumarwin">📍 Ghumarwin Central</option>
                <option value="Bilaspur">📍 Bilaspur Main</option>
                <option value="Sundernagar">📍 Sundernagar Chowk</option>
              </select>
            </div>
          </div>

          {/* Cart Trigger */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="relative p-2.5 rounded-xl bg-primary text-on-primary hover:bg-neutral-800 transition flex items-center gap-2 font-label-md text-label-md font-bold"
          >
            <span className="material-symbols-outlined text-[20px]">shopping_bag</span>
            <span className="hidden sm:inline">Cart</span>
            {cartItems.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-secondary text-on-secondary font-bold text-[11px] flex items-center justify-center">
                {cartItems.reduce((sum, item) => sum + item.quantity, 0)}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Tabs: Explore Stores vs Active Passes */}
      <div className="flex items-center gap-2 border-b border-outline-variant/20 pb-1">
        <button
          onClick={() => {
            setActiveTab('explore');
            setSelectedStore(null);
          }}
          className={`px-4 py-2 rounded-lg font-label-md text-label-md font-bold transition ${
            activeTab === 'explore'
              ? 'bg-primary text-on-primary shadow-xs'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          Nearby Stores ({activeStores.length} Live)
        </button>

        <button
          onClick={() => setActiveTab('passes')}
          className={`px-4 py-2 rounded-lg font-label-md text-label-md font-bold transition flex items-center gap-2 ${
            activeTab === 'passes'
              ? 'bg-primary text-on-primary shadow-xs'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <span>My Pickup Passes & Orders</span>
          {customerOrders.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-[11px] font-bold">
              {customerOrders.length}
            </span>
          )}
        </button>
      </div>

      {/* ================= VIEW 1: STORE LISTING ================= */}
      {activeTab === 'explore' && !selectedStore && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">
              Verified Shops in & around {selectedTown}
            </h2>
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              Sorted by Distance & Availability
            </span>
          </div>

          {activeStores.length === 0 ? (
            <div className="p-12 text-center bg-surface-container-lowest rounded-2xl border border-outline-variant/20 space-y-4">
              <span className="material-symbols-outlined text-[48px] text-on-surface-variant">storefront</span>
              <div className="space-y-1">
                <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                  No verified local shops live in this area yet
                </h3>
                <p className="font-body-md text-body-md text-on-surface-variant max-w-md mx-auto">
                  LocalMarket reads exclusively from live Firebase records. Register a shop now and approve it in the Super Admin Console to see it appear here live!
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={onGoToRegistration}
                  className="px-5 py-2.5 rounded-xl bg-primary text-on-primary font-label-md text-label-md font-bold hover:bg-neutral-800 transition"
                >
                  + Register Your Dukaan
                </button>
                <button
                  onClick={onGoToAdmin}
                  className="px-5 py-2.5 rounded-xl bg-surface-container-low text-on-surface font-label-md text-label-md font-bold hover:bg-surface-container transition border border-outline-variant/30"
                >
                  Check Admin Verification Queue
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedStores.map((store) => {
                const offersDelivery = store.fulfillmentOptions?.includes('Retailer Direct Delivery');
                const offersPickup = store.fulfillmentOptions?.includes('Smart Pickup') !== false;

                return (
                  <div
                    key={store.id}
                    onClick={() => setSelectedStore(store)}
                    className="p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/20 shadow-xs hover:shadow-md hover:border-secondary transition cursor-pointer flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="relative">
                        <img
                          src={store.logoUrl || 'https://via.placeholder.com/300x160'}
                          alt={store.shopName}
                          className="w-full h-40 object-cover rounded-xl border border-outline-variant/20"
                        />
                        <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full bg-secondary text-on-secondary font-label-sm text-[11px] font-bold shadow-xs">
                          {store.distanceKm} km away
                        </span>
                        <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded bg-surface-container-lowest/90 backdrop-blur-xs text-on-surface font-label-sm text-[11px] font-bold shadow-xs">
                          Prep: {store.preparationTime || '15 mins'}
                        </span>
                      </div>

                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-on-surface-variant uppercase">
                            {store.category}
                          </span>
                          <span className="text-[11px] font-bold text-secondary flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                            Open ({store.openingTime} - {store.closingTime})
                          </span>
                        </div>
                        <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface mt-1">
                          {store.shopName}
                        </h3>
                        <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5 line-clamp-2">
                          {store.description || store.address}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-outline-variant/20 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        {offersPickup && (
                          <span className="px-2 py-0.5 rounded bg-secondary-container text-on-secondary-container text-[11px] font-bold">
                            Pickup Available
                          </span>
                        )}
                        {offersDelivery && (
                          <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface-variant text-[11px] font-bold">
                            + Delivery
                          </span>
                        )}
                      </div>

                      <span className="text-secondary font-bold text-label-sm flex items-center gap-0.5">
                        <span>Browse Shop</span>
                        <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ================= VIEW 2: STORE DETAIL & PRODUCT MENU ================= */}
      {activeTab === 'explore' && selectedStore && (
        <div className="space-y-6">
          {/* Back button */}
          <button
            onClick={() => setSelectedStore(null)}
            className="flex items-center gap-1 text-on-surface-variant hover:text-on-surface font-label-md text-label-md font-bold transition"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            <span>Back to All Stores in {selectedTown}</span>
          </button>

          {/* Store Header Banner */}
          <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-outline-variant/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <img
                src={selectedStore.logoUrl}
                alt={selectedStore.shopName}
                className="w-20 h-20 rounded-2xl object-cover border border-outline-variant/30 shadow-xs"
              />
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-headline-lg text-headline-lg font-bold text-on-surface">
                    {selectedStore.shopName}
                  </h2>
                  <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-bold">
                    ✓ Verified Local Merchant
                  </span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  {selectedStore.address}, {selectedStore.city} • Open {selectedStore.openingTime} - {selectedStore.closingTime}
                </p>
                <div className="flex items-center gap-2 text-[12px] font-bold text-secondary pt-1">
                  <span>⏱️ Handover SLA: {selectedStore.preparationTime || '15 mins'}</span>
                  <span>•</span>
                  <span>📍 {selectedStore.area}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col md:items-end gap-2">
              <div className="flex items-center gap-1.5">
                <span className="px-2.5 py-1 rounded-lg bg-surface-container font-label-sm text-label-sm font-bold text-on-surface">
                  Smart Pickup Enabled
                </span>
                {selectedStore.fulfillmentOptions?.includes('Retailer Direct Delivery') && (
                  <span className="px-2.5 py-1 rounded-lg bg-surface-container font-label-sm text-label-sm font-bold text-on-surface">
                    Direct Delivery
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Products Grid */}
          <div className="space-y-4">
            <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
              Available Store Products ({storeProducts.length})
            </h3>

            {storeProducts.length === 0 ? (
              <div className="p-8 text-center bg-surface-container-lowest rounded-2xl border border-outline-variant/20 space-y-2">
                <p className="font-headline-sm text-headline-sm font-bold text-on-surface">
                  No products uploaded yet by this merchant
                </p>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  The retailer can log in to their dashboard to add catalog inventory.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {storeProducts.map((product) => {
                  const inCartQty = cart[product.id]?.quantity || 0;

                  return (
                    <div
                      key={product.id}
                      className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/20 shadow-xs flex flex-col justify-between"
                    >
                      <div className="space-y-2.5">
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-full h-36 object-cover rounded-lg border border-outline-variant/20"
                        />
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-on-surface-variant uppercase">
                              {product.category}
                            </span>
                            <span className="text-[11px] font-bold text-secondary">
                              In Stock ({product.stock})
                            </span>
                          </div>
                          <h4 className="font-label-lg text-label-lg font-bold text-on-surface mt-0.5">
                            {product.name}
                          </h4>
                          <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-2 mt-0.5">
                            {product.description}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-outline-variant/20 flex items-center justify-between">
                        <span className="font-headline-sm text-[18px] font-bold text-on-surface">
                          ₹{product.price}
                        </span>

                        {inCartQty === 0 ? (
                          <button
                            onClick={() => addToCart(product)}
                            className="px-4 py-1.5 rounded-lg bg-primary text-on-primary font-label-md text-label-md font-bold shadow-xs hover:bg-neutral-800 transition"
                          >
                            + Add to Cart
                          </button>
                        ) : (
                          <div className="flex items-center gap-2 bg-surface-container-low px-2 py-1 rounded-lg border border-outline-variant/30">
                            <button
                              onClick={() => updateQuantity(product.id, -1)}
                              className="w-6 h-6 rounded bg-surface-container-lowest font-bold text-on-surface flex items-center justify-center hover:bg-surface-container"
                            >
                              -
                            </button>
                            <span className="font-bold text-on-surface text-sm px-1">{inCartQty}</span>
                            <button
                              onClick={() => updateQuantity(product.id, 1)}
                              className="w-6 h-6 rounded bg-surface-container-lowest font-bold text-on-surface flex items-center justify-center hover:bg-surface-container"
                            >
                              +
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= VIEW 3: PASSES & ORDERS ================= */}
      {activeTab === 'passes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">
              My Active Digital Passes & Orders
            </h2>
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              Customer: {customerName}
            </span>
          </div>

          {customerOrders.length === 0 ? (
            <div className="p-12 text-center bg-surface-container-lowest rounded-2xl border border-outline-variant/20 space-y-3">
              <span className="material-symbols-outlined text-[42px] text-on-surface-variant">
                qr_code_scanner
              </span>
              <p className="font-headline-sm text-headline-sm font-bold text-on-surface">
                No active orders yet
              </p>
              <p className="font-body-sm text-body-sm text-on-surface-variant max-w-sm mx-auto">
                Browse nearby stores in Ghumarwin or Bilaspur, add items to cart, and choose Smart Pickup or Delivery.
              </p>
              <button
                onClick={() => setActiveTab('explore')}
                className="px-5 py-2.5 rounded-xl bg-primary text-on-primary font-label-md text-label-md font-bold hover:bg-neutral-800 transition"
              >
                Browse Live Dukaans →
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {customerOrders.map((order) => {
                const isReady = order.status === 'ready';
                const isArrived = order.status === 'arrived';
                const isCompleted = order.status === 'completed';

                return (
                  <div
                    key={order.id}
                    className={`p-6 rounded-2xl bg-surface-container-lowest border space-y-4 shadow-sm ${
                      isReady || isArrived
                        ? 'border-secondary ring-2 ring-secondary/30'
                        : 'border-outline-variant/20'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-label-sm text-label-sm font-bold text-secondary uppercase">
                          {order.fulfillmentType} Pass
                        </span>
                        <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface mt-0.5">
                          {order.retailerName}
                        </h3>
                        <p className="font-body-sm text-body-sm text-on-surface-variant">
                          Order Number: <strong>{order.orderNumber}</strong>
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full font-label-sm text-label-sm font-bold uppercase ${
                          isCompleted
                            ? 'bg-surface-container text-on-surface-variant'
                            : isArrived
                            ? 'bg-secondary text-on-secondary'
                            : isReady
                            ? 'bg-secondary-container text-on-secondary-container animate-pulse'
                            : 'bg-tertiary-fixed text-on-tertiary-fixed'
                        }`}
                      >
                        {order.status}
                      </span>
                    </div>

                    {/* QR Code Pass Box */}
                    {order.fulfillmentType === 'Smart Pickup' && (
                      <div className="p-4 bg-surface-container-low rounded-xl border border-outline-variant/30 flex items-center justify-between gap-4">
                        <div className="space-y-1">
                          <p className="font-label-md text-label-md font-bold text-on-surface">
                            Digital Pickup Pass
                          </p>
                          <p className="text-[12px] text-on-surface-variant">
                            Selected ETA: <strong>{order.customerETA}</strong>
                          </p>
                          <p className="font-mono text-sm font-bold text-secondary pt-1">
                            {order.qrCodeToken || '#PASS-8812'}
                          </p>
                        </div>

                        {/* Simulated QR Code Graphic */}
                        <div className="w-20 h-20 bg-surface-container-lowest p-1.5 rounded-lg border border-outline-variant/40 flex flex-col justify-between shadow-xs">
                          <div className="flex justify-between">
                            <div className="w-5 h-5 bg-black rounded-xs" />
                            <div className="w-5 h-5 bg-black rounded-xs" />
                          </div>
                          <div className="text-[8px] font-mono text-center text-on-surface-variant">TOKEN</div>
                          <div className="flex justify-between">
                            <div className="w-5 h-5 bg-black rounded-xs" />
                            <div className="w-3 h-3 bg-secondary rounded-full" />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Order summary list */}
                    <div className="text-body-sm font-body-sm text-on-surface-variant space-y-1">
                      {order.items.map((it, idx) => (
                        <div key={idx} className="flex justify-between">
                          <span>{it.quantity}x {it.name}</span>
                          <span className="font-semibold text-on-surface">₹{it.price * it.quantity}</span>
                        </div>
                      ))}
                      <div className="flex justify-between font-bold text-on-surface pt-2 border-t border-outline-variant/20">
                        <span>Total Paid</span>
                        <span className="text-secondary font-bold">₹{order.totalAmount}</span>
                      </div>
                    </div>

                    {/* "I'M HERE" Action Button */}
                    {!isCompleted && (
                      <div className="pt-2">
                        {!isArrived ? (
                          <button
                            onClick={() => handleMarkArrivedAtCounter(order.id)}
                            className="w-full py-3 rounded-xl bg-secondary text-on-secondary font-label-lg text-label-lg font-bold shadow-md hover:opacity-95 transition flex items-center justify-center gap-2"
                          >
                            <span className="material-symbols-outlined text-[20px]">pin_drop</span>
                            <span>I'M HERE (Notify Counter Staff)</span>
                          </button>
                        ) : (
                          <div className="p-3 bg-secondary-container rounded-xl text-center font-label-md text-label-md font-bold text-on-secondary-container">
                            ✓ Counter notified! Show your pass to collect your items.
                          </div>
                        )}
                      </div>
                    )}

                    {isCompleted && (
                      <div className="p-2.5 bg-surface-container rounded-lg text-center font-label-sm text-label-sm font-bold text-secondary">
                        ✓ Order Collected & Handover Verified
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ================= CART & CHECKOUT DRAWER ================= */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsCartOpen(false)} />
          <div className="relative w-full max-w-md bg-surface-container-lowest h-full shadow-2xl flex flex-col justify-between p-6 z-10 animate-in slide-in-from-right duration-200">
            <div>
              <div className="flex items-center justify-between border-b border-outline-variant/20 pb-4">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[24px] text-primary">shopping_bag</span>
                  <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                    Your Order Cart
                  </h3>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              {cartItems.length === 0 ? (
                <div className="py-16 text-center text-on-surface-variant space-y-2">
                  <span className="material-symbols-outlined text-[40px]">remove_shopping_cart</span>
                  <p className="font-label-md text-label-md font-bold">Your cart is empty</p>
                  <p className="font-body-sm text-body-sm">Add items from the store to proceed.</p>
                </div>
              ) : (
                <div className="space-y-4 pt-4 overflow-y-auto max-h-[50vh]">
                  {cartItems.map(({ product, quantity }) => (
                    <div key={product.id} className="flex items-center justify-between p-3 bg-surface-container-low rounded-xl">
                      <div>
                        <p className="font-label-md text-label-md font-bold text-on-surface">{product.name}</p>
                        <p className="font-body-sm text-[12px] text-on-surface-variant">₹{product.price} each</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(product.id, -1)}
                          className="w-6 h-6 rounded bg-surface-container-lowest font-bold text-on-surface flex items-center justify-center border border-outline-variant/30"
                        >
                          -
                        </button>
                        <span className="font-bold text-sm w-4 text-center">{quantity}</span>
                        <button
                          onClick={() => updateQuantity(product.id, 1)}
                          className="w-6 h-6 rounded bg-surface-container-lowest font-bold text-on-surface flex items-center justify-center border border-outline-variant/30"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Fulfillment Option Choice */}
                  <div className="space-y-2 pt-2 border-t border-outline-variant/20">
                    <label className="block font-label-md text-label-md font-bold text-on-surface">
                      Choose Fulfillment Mode:
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setFulfillmentType('Smart Pickup')}
                        className={`p-2.5 rounded-xl border font-label-sm text-label-sm font-bold text-left transition ${
                          fulfillmentType === 'Smart Pickup'
                            ? 'bg-secondary-container text-on-secondary-container border-secondary ring-1 ring-secondary'
                            : 'bg-surface-container-low text-on-surface border-outline-variant/30'
                        }`}
                      >
                        🛍️ Smart Pickup
                      </button>

                      {selectedStore?.fulfillmentOptions?.includes('Retailer Direct Delivery') ? (
                        <button
                          type="button"
                          onClick={() => setFulfillmentType('Store Delivery')}
                          className={`p-2.5 rounded-xl border font-label-sm text-label-sm font-bold text-left transition ${
                            fulfillmentType === 'Store Delivery'
                              ? 'bg-secondary-container text-on-secondary-container border-secondary ring-1 ring-secondary'
                              : 'bg-surface-container-low text-on-surface border-outline-variant/30'
                          }`}
                        >
                          🛵 Store Delivery
                        </button>
                      ) : (
                        <div className="p-2.5 rounded-xl bg-surface-container-low/60 border border-outline-variant/20 opacity-60 text-[11px] text-on-surface-variant">
                          Store Delivery Disabled by Merchant
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Smart Pickup ETA Selector */}
                  {fulfillmentType === 'Smart Pickup' && (
                    <div className="space-y-1.5 p-3 rounded-xl bg-secondary-container/20 border border-secondary/30">
                      <label className="block font-label-sm text-label-sm font-bold text-secondary uppercase">
                        Select Counter Pickup ETA:
                      </label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {['10 min', '20 min', '30 min', '45 min', '1 hour', 'Custom'].map((eta) => (
                          <button
                            key={eta}
                            type="button"
                            onClick={() => setSelectedETA(eta)}
                            className={`py-1 rounded text-center text-xs font-bold border transition ${
                              selectedETA === eta
                                ? 'bg-secondary text-on-secondary border-secondary'
                                : 'bg-surface-container-lowest text-on-surface border-outline-variant/30'
                            }`}
                          >
                            {eta}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Delivery Address */}
                  {fulfillmentType === 'Store Delivery' && (
                    <div className="space-y-1">
                      <label className="block font-label-sm text-label-sm font-bold text-on-surface">
                        Delivery Address in {selectedTown}:
                      </label>
                      <input
                        type="text"
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-outline-variant/30 text-on-surface font-body-sm text-body-sm"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Checkout Actions */}
            <div className="pt-4 border-t border-outline-variant/20 space-y-3">
              <div className="flex justify-between items-center font-headline-sm text-headline-sm font-bold text-on-surface">
                <span>Total Amount:</span>
                <span className="text-secondary">₹{cartTotal}</span>
              </div>

              <button
                disabled={cartItems.length === 0 || isPlacingOrder}
                onClick={handlePlaceOrder}
                className="w-full py-3 rounded-xl bg-primary text-on-primary font-label-lg text-label-lg font-bold shadow-md hover:bg-neutral-800 disabled:opacity-50 transition flex items-center justify-center gap-2"
              >
                {isPlacingOrder ? (
                  <span>Placing Order into Firestore...</span>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[20px]">bolt</span>
                    <span>Confirm & Generate Digital Pass (₹{cartTotal})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
