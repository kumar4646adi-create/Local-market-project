import React, { useState, useEffect } from 'react';
import { Retailer, Product, Order, OrderItem, StoreReview, PaymentMethod } from '../types';
import {
  subscribeActiveRetailers,
  subscribeRetailerProducts,
  subscribeCustomerOrders,
  createOrder,
  updateOrderStatus,
  subscribeStoreReviews,
  addStoreReview
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
  const [storeReviews, setStoreReviews] = useState<StoreReview[]>([]);
  const [storeTab, setStoreTab] = useState<'products' | 'reviews'>('products');

  // Search & Category Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Cart: Map from productId to { product, quantity }
  const [cart, setCart] = useState<Record<string, { product: Product; quantity: number }>>({});
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Fulfillment & Checkout State
  const [fulfillmentType, setFulfillmentType] = useState<'Smart Pickup' | 'Store Delivery'>('Smart Pickup');
  const [selectedETA, setSelectedETA] = useState<string>('20 min');
  const [customerName, setCustomerName] = useState('Rahul Kumar');
  const [customerPhone, setCustomerPhone] = useState('+91 94182 11094');
  const [deliveryAddress, setDeliveryAddress] = useState('House #24, Near Civil Hospital, Ghumarwin');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('upi_qr');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  // Customer Orders & Active Tab
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<'explore' | 'passes'>('explore');

  // Review Modal State
  const [reviewOrder, setReviewOrder] = useState<Order | null>(null);
  const [ratingVal, setRatingVal] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>(['Quick Counter Pickup', 'Fresh Quality']);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Real-time tick for 5-minute edit window countdown
  const [, setClockTick] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setClockTick(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Customer ID for persistent session
  const customerId = 'cust-rahul-hp01';

  // Real-time listener for active stores
  useEffect(() => {
    const unsub = subscribeActiveRetailers((stores) => {
      setActiveStores(stores);
      if (selectedStore) {
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

  // Fetch products and reviews when a store is selected
  useEffect(() => {
    if (!selectedStore) {
      setStoreProducts([]);
      setStoreReviews([]);
      return;
    }
    const unsubProds = subscribeRetailerProducts(selectedStore.id, (prods) => {
      setStoreProducts(prods);
    });
    const unsubReviews = subscribeStoreReviews(selectedStore.id, (revs) => {
      setStoreReviews(revs);
    });
    return () => {
      unsubProds();
      unsubReviews();
    };
  }, [selectedStore?.id]);

  // Distance calculator relative to selected town center
  const getSimulatedDistance = (store: Retailer) => {
    if (store.city.toLowerCase() !== selectedTown.toLowerCase()) {
      return (14.5 + Math.abs(store.latitude - 31.4429) * 10).toFixed(1);
    }
    const dist = (0.5 + Math.abs(store.latitude % 0.05) * 20).toFixed(1);
    return dist;
  };

  // Dynamic Open / Closed Status based on Store Timings
  const getStoreTimingStatus = (store: Retailer) => {
    if (store.temporarilyClosed) {
      return { isOpen: false, text: 'CLOSED TEMPORARILY', color: 'bg-error-container text-on-error-container' };
    }
    const now = new Date();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDayName = days[now.getDay()];

    if (store.closedDay && store.closedDay.toLowerCase() === currentDayName.toLowerCase()) {
      return { isOpen: false, text: `CLOSED TODAY (${store.closedDay.toUpperCase()})`, color: 'bg-error-container text-on-error-container' };
    }
    if (store.closedDays && store.closedDays.map((d) => d.toLowerCase()).includes(currentDayName.toLowerCase())) {
      return { isOpen: false, text: `CLOSED TODAY (${currentDayName.toUpperCase()})`, color: 'bg-error-container text-on-error-container' };
    }

    const parseTime = (timeStr?: string) => {
      if (!timeStr) return null;
      const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
      if (!match) return null;
      let hours = parseInt(match[1], 10);
      const minutes = parseInt(match[2], 10);
      const meridiem = match[3]?.toUpperCase();
      if (meridiem === 'PM' && hours < 12) hours += 12;
      if (meridiem === 'AM' && hours === 12) hours = 0;
      return hours * 60 + minutes;
    };

    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const openMinutes = parseTime(store.openingTime);
    const closeMinutes = parseTime(store.closingTime);

    if (openMinutes !== null && closeMinutes !== null) {
      if (currentMinutes < openMinutes) {
        return { isOpen: false, text: `CLOSED • OPENS AT ${store.openingTime}`, color: 'bg-amber-100 text-amber-900 border border-amber-300' };
      }
      if (currentMinutes >= closeMinutes) {
        return { isOpen: false, text: `CLOSED • OPENS AT ${store.openingTime}`, color: 'bg-amber-100 text-amber-900 border border-amber-300' };
      }
      return { isOpen: true, text: `OPEN • CLOSES AT ${store.closingTime}`, color: 'bg-emerald-100 text-emerald-800 border border-emerald-300' };
    }

    return { isOpen: true, text: 'OPEN', color: 'bg-emerald-100 text-emerald-800 border border-emerald-300' };
  };

  // Filter and sort stores
  const filteredStores = activeStores.filter((store) => {
    const matchesSearch =
      store.shopName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      store.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      store.area.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = categoryFilter === 'All' || store.category.toLowerCase().includes(categoryFilter.toLowerCase());
    return matchesSearch && matchesCat;
  });

  const sortedStores = [...filteredStores]
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

  // Place Order with 5-minute edit window & payment method
  const handlePlaceOrder = async () => {
    if (!selectedStore || cartItems.length === 0) return;

    setIsPlacingOrder(true);
    try {
      const orderNumber = `#LM-${Math.floor(1000 + Math.random() * 9000)}`;
      const qrCodeToken = `PASS-${Math.floor(100000 + Math.random() * 900000)}`;
      const nowIso = new Date().toISOString();
      const editExpiresIso = new Date(Date.now() + 5 * 60 * 1000).toISOString();

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
        status: 'placed',
        orderNumber,
        qrCodeToken,
        createdAt: nowIso,
        placedAt: nowIso,
        editWindowExpiresAt: editExpiresIso,
        paymentStatus: paymentMethod === 'upi_qr' ? 'paid' : 'pending',
        paymentMethod,
        updatedAt: nowIso,
        deliveryAddress: fulfillmentType === 'Store Delivery' ? deliveryAddress : undefined,
      });

      setCart({});
      setIsCartOpen(false);
      setActiveTab('passes');
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
    } catch (err: any) {
      alert(`Update failed: ${err.message}`);
    }
  };

  // Cancel order within 5-minute window
  const handleCancelOrder = async (order: Order) => {
    if (!window.confirm(`Are you sure you want to cancel order ${order.orderNumber}?`)) return;
    try {
      await updateOrderStatus(order.id, 'cancelled');
    } catch (err: any) {
      alert(`Cancellation failed: ${err.message}`);
    }
  };

  // Submit Rating & Review
  const handleSubmitReview = async () => {
    if (!reviewOrder) return;
    setIsSubmittingReview(true);
    try {
      await addStoreReview({
        retailerId: reviewOrder.retailerId,
        orderId: reviewOrder.id,
        customerId,
        customerName,
        rating: ratingVal,
        tags: selectedTags,
        comment: reviewComment.trim() || undefined,
      });
      setReviewOrder(null);
      setReviewComment('');
    } catch (err: any) {
      alert(`Review submission failed: ${err.message}`);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Top Header & Navigation */}
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
            Order directly from approved neighborhood merchants with 2-minute Smart Pickup or Local Delivery.
          </p>
        </div>

        {/* Location & Cart */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-surface-container-low px-3.5 py-2 rounded-xl border border-outline-variant/30">
            <span className="material-symbols-outlined text-[20px] text-secondary">location_on</span>
            <div className="flex flex-col text-left">
              <span className="text-[10px] uppercase font-bold text-on-surface-variant leading-none">Your Town</span>
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

          <button
            onClick={() => setIsCartOpen(true)}
            className="relative px-4 py-2.5 rounded-xl bg-primary text-on-primary font-label-md text-label-md font-bold shadow-xs hover:bg-neutral-800 transition flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[20px]">shopping_cart</span>
            <span>Cart ({cartItems.reduce((s, i) => s + i.quantity, 0)})</span>
            {cartItems.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-secondary text-on-secondary rounded-full text-xs font-bold flex items-center justify-center">
                {cartItems.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Tabs: Explore Stores vs My Digital Passes */}
      <div className="flex items-center gap-3 border-b border-outline-variant/20 pb-2">
        <button
          onClick={() => {
            setActiveTab('explore');
            setSelectedStore(null);
          }}
          className={`px-4 py-2 rounded-xl font-label-md text-label-md font-bold transition flex items-center gap-2 ${
            activeTab === 'explore'
              ? 'bg-secondary text-on-secondary shadow-xs'
              : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">storefront</span>
          <span>Explore Dukaans ({activeStores.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('passes')}
          className={`px-4 py-2 rounded-xl font-label-md text-label-md font-bold transition flex items-center gap-2 ${
            activeTab === 'passes'
              ? 'bg-secondary text-on-secondary shadow-xs'
              : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">confirmation_number</span>
          <span>My Orders & Passes ({customerOrders.length})</span>
        </button>
      </div>

      {/* ================= VIEW 1: EXPLORE STORES LIST ================= */}
      {activeTab === 'explore' && !selectedStore && (
        <div className="space-y-6">
          {/* Search & Category Filter */}
          <div className="flex flex-col sm:flex-row items-center gap-3 bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/20 shadow-xs">
            <div className="relative flex-1 w-full">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-on-surface-variant text-[20px]">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search store name, groceries, sweets, chemist..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-surface-container-low border border-outline-variant/30 text-on-surface font-body-md text-body-md focus:outline-none focus:ring-1 focus:ring-secondary"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              {['All', 'Kirana', 'Dairy', 'Bakery', 'Chemist'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition shrink-0 ${
                    categoryFilter === cat
                      ? 'bg-primary text-on-primary'
                      : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Stores List */}
          {sortedStores.length === 0 ? (
            <div className="p-12 text-center bg-surface-container-lowest rounded-2xl border border-outline-variant/20 space-y-4 max-w-lg mx-auto">
              <span className="material-symbols-outlined text-[48px] text-on-surface-variant">store</span>
              <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                No active stores found
              </h3>
              <p className="font-body-md text-body-md text-on-surface-variant">
                {activeStores.length === 0
                  ? 'No stores have been approved yet by the Super Admin. Registered stores will appear live as soon as they are verified.'
                  : 'No stores match your search criteria in this area.'}
              </p>
              <button
                onClick={onGoToRegistration}
                className="px-5 py-2.5 rounded-xl bg-primary text-on-primary font-label-md text-label-md font-bold hover:bg-neutral-800 transition"
              >
                + Onboard a New Store
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {sortedStores.map((store) => {
                const timingStatus = getStoreTimingStatus(store);
                const offersPickup = store.fulfillmentOptions?.includes('Smart Pickup') ?? true;
                const offersDelivery = store.fulfillmentOptions?.includes('Retailer Direct Delivery');

                return (
                  <div
                    key={store.id}
                    onClick={() => {
                      setSelectedStore(store);
                      setStoreTab('products');
                    }}
                    className="p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/20 shadow-xs hover:shadow-md hover:border-secondary transition cursor-pointer flex flex-col justify-between group"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start gap-3.5">
                        <img
                          src={store.logoUrl || 'https://via.placeholder.com/80'}
                          alt={store.shopName}
                          className="w-16 h-16 rounded-xl object-cover border border-outline-variant/20 shrink-0 group-hover:scale-105 transition"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${timingStatus.color}`}>
                              {timingStatus.text}
                            </span>
                            <span className="text-[11px] font-bold text-secondary">
                              📍 {store.distanceKm} km away
                            </span>
                          </div>
                          <h3 className="font-headline-sm text-[17px] font-bold text-on-surface truncate mt-1">
                            {store.shopName}
                          </h3>
                          <p className="font-body-sm text-[12px] text-on-surface-variant truncate">
                            {store.category} • {store.area}
                          </p>
                        </div>
                      </div>

                      <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-2">
                        {store.description}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-outline-variant/20 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        {offersPickup && (
                          <span className="px-2 py-0.5 rounded bg-secondary-container text-on-secondary-container text-[11px] font-bold">
                            🛍️ Pickup
                          </span>
                        )}
                        {offersDelivery && (
                          <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface-variant text-[11px] font-bold">
                            🛵 Delivery
                          </span>
                        )}
                      </div>

                      <span className="text-secondary font-bold text-label-sm flex items-center gap-0.5 group-hover:translate-x-1 transition">
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

      {/* ================= VIEW 2: STORE DETAIL & PRODUCTS MENU ================= */}
      {activeTab === 'explore' && selectedStore && (
        <div className="space-y-6">
          <button
            onClick={() => setSelectedStore(null)}
            className="flex items-center gap-1 text-on-surface-variant hover:text-on-surface font-label-md text-label-md font-bold transition"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            <span>Back to All Stores in {selectedTown}</span>
          </button>

          {/* Store Hero Banner */}
          <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-outline-variant/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <img
                src={selectedStore.logoUrl || 'https://via.placeholder.com/80'}
                alt={selectedStore.shopName}
                className="w-20 h-20 rounded-2xl object-cover border border-outline-variant/30 shadow-xs"
              />
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-headline-lg text-headline-lg font-bold text-on-surface">
                    {selectedStore.shopName}
                  </h2>
                  <span className={`px-2.5 py-0.5 rounded text-[11px] font-bold ${getStoreTimingStatus(selectedStore).color}`}>
                    {getStoreTimingStatus(selectedStore).text}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-bold">
                    ✓ Verified Storefront
                  </span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  {selectedStore.address}, {selectedStore.city} • Regular Hours: {selectedStore.openingTime} - {selectedStore.closingTime}
                </p>
                <div className="flex items-center gap-2 text-[12px] font-bold text-secondary pt-1 flex-wrap">
                  <span>⏱️ Handover SLA: {selectedStore.preparationTime || '15 mins'}</span>
                  <span>•</span>
                  <span>📍 {selectedStore.area}</span>
                  {storeReviews.length > 0 && (
                    <>
                      <span>•</span>
                      <span className="text-amber-600">
                        ⭐ {(storeReviews.reduce((s, r) => s + r.rating, 0) / storeReviews.length).toFixed(1)} ({storeReviews.length} reviews)
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setStoreTab('products')}
                className={`px-3 py-1.5 rounded-lg font-label-sm text-label-sm font-bold transition ${
                  storeTab === 'products'
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Products ({storeProducts.length})
              </button>
              <button
                onClick={() => setStoreTab('reviews')}
                className={`px-3 py-1.5 rounded-lg font-label-sm text-label-sm font-bold transition ${
                  storeTab === 'reviews'
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Reviews ({storeReviews.length})
              </button>
            </div>
          </div>

          {/* Tab 1: Products */}
          {storeTab === 'products' && (
            <div className="space-y-4">
              <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                Catalog & Inventory ({storeProducts.length})
              </h3>

              {storeProducts.length === 0 ? (
                <div className="p-8 text-center bg-surface-container-lowest rounded-2xl border border-outline-variant/20 space-y-2">
                  <p className="font-headline-sm text-headline-sm font-bold text-on-surface">
                    No products uploaded yet by this merchant
                  </p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    The merchant can add products anytime through their Retailer Dashboard.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {storeProducts.map((product) => {
                    const inCartQty = cart[product.id]?.quantity || 0;

                    return (
                      <div
                        key={product.id}
                        className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/20 shadow-xs flex flex-col justify-between"
                      >
                        <div className="space-y-2">
                          <img
                            src={product.imageUrl || 'https://via.placeholder.com/300'}
                            alt={product.name}
                            className="w-full h-36 object-cover rounded-lg border border-outline-variant/20"
                          />
                          <div>
                            <span className="text-[10px] font-bold text-on-surface-variant uppercase">
                              {product.category}
                            </span>
                            <h4 className="font-headline-sm text-[15px] font-bold text-on-surface truncate">
                              {product.name}
                            </h4>
                            <p className="font-body-sm text-[12px] text-on-surface-variant line-clamp-2">
                              {product.description}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 pt-2 border-t border-outline-variant/20 flex items-center justify-between">
                          <div>
                            <span className="font-headline-sm text-[17px] font-bold text-on-surface">
                              ₹{product.price}
                            </span>
                          </div>

                          {inCartQty === 0 ? (
                            <button
                              disabled={!product.available || product.stock <= 0}
                              onClick={() => addToCart(product)}
                              className="px-3 py-1.5 rounded-lg bg-secondary text-on-secondary font-label-sm text-label-sm font-bold shadow-xs hover:opacity-95 disabled:opacity-50 transition"
                            >
                              + Add
                            </button>
                          ) : (
                            <div className="flex items-center gap-1.5 bg-secondary-container px-2 py-1 rounded-lg">
                              <button
                                onClick={() => updateQuantity(product.id, -1)}
                                className="w-5 h-5 rounded bg-surface-container-lowest font-bold text-on-surface flex items-center justify-center hover:bg-surface-container"
                              >
                                -
                              </button>
                              <span className="font-bold text-on-surface text-xs px-1">{inCartQty}</span>
                              <button
                                onClick={() => updateQuantity(product.id, 1)}
                                className="w-5 h-5 rounded bg-surface-container-lowest font-bold text-on-surface flex items-center justify-center hover:bg-surface-container"
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
          )}

          {/* Tab 2: Reviews */}
          {storeTab === 'reviews' && (
            <div className="space-y-4">
              <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                Customer Reviews & Ratings ({storeReviews.length})
              </h3>

              {storeReviews.length === 0 ? (
                <div className="p-8 text-center bg-surface-container-lowest rounded-2xl border border-outline-variant/20 space-y-2">
                  <p className="font-headline-sm text-headline-sm font-bold text-on-surface">
                    No customer reviews yet
                  </p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Completed orders can be rated by customers right after picking up or receiving their delivery.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {storeReviews.map((rev) => (
                    <div
                      key={rev.id}
                      className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/20 shadow-xs space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-amber-500">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <span key={i} className="material-symbols-outlined text-[18px]">
                              {i < rev.rating ? 'star' : 'star_outline'}
                            </span>
                          ))}
                        </div>
                        <span className="text-[12px] text-on-surface-variant font-mono">
                          {new Date(rev.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {rev.tags?.map((t, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-[11px] font-bold"
                          >
                            ✓ {t}
                          </span>
                        ))}
                      </div>

                      {rev.comment && (
                        <p className="font-body-sm text-body-sm text-on-surface italic pt-1">
                          "{rev.comment}"
                        </p>
                      )}

                      <p className="text-[11px] font-semibold text-on-surface-variant">
                        By {rev.customerName || 'Verified Customer'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
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
                const isCancelled = order.status === 'cancelled';

                // Check 5-minute modification window
                const now = Date.now();
                const expiresAt = order.editWindowExpiresAt ? new Date(order.editWindowExpiresAt).getTime() : 0;
                const remainingMs = Math.max(0, expiresAt - now);
                const canModify = remainingMs > 0 && (order.status === 'placed' || order.status === 'pending');
                const remainingMins = Math.floor(remainingMs / 60000);
                const remainingSecs = Math.floor((remainingMs % 60000) / 1000);

                return (
                  <div
                    key={order.id}
                    className={`p-6 rounded-2xl bg-surface-container-lowest border space-y-4 shadow-sm ${
                      isReady || isArrived
                        ? 'border-secondary ring-2 ring-secondary/30'
                        : isCancelled
                        ? 'border-error/40 opacity-75'
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
                            ? 'bg-secondary text-on-secondary'
                            : isCancelled
                            ? 'bg-error-container text-on-error-container'
                            : isArrived
                            ? 'bg-secondary-container text-on-secondary-container'
                            : isReady
                            ? 'bg-secondary-container text-on-secondary-container animate-pulse'
                            : 'bg-tertiary-fixed text-on-tertiary-fixed'
                        }`}
                      >
                        {order.status}
                      </span>
                    </div>

                    {/* 5-Minute Window Notification & Cancel/Edit Option */}
                    {canModify && (
                      <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-center justify-between gap-3 text-amber-900">
                        <div className="flex items-center gap-1.5 text-xs font-semibold">
                          <span className="material-symbols-outlined text-[18px] text-amber-700">timer</span>
                          <span>
                            Edit/Cancel window: <strong>{remainingMins}m {remainingSecs}s</strong> remaining
                          </span>
                        </div>
                        <button
                          onClick={() => handleCancelOrder(order)}
                          className="px-2.5 py-1 rounded bg-error-container text-on-error-container text-xs font-bold hover:opacity-90"
                        >
                          Cancel Order
                        </button>
                      </div>
                    )}

                    {/* QR Code Pass Box for Smart Pickup */}
                    {order.fulfillmentType === 'Smart Pickup' && !isCancelled && (
                      <div className="p-4 bg-surface-container-low rounded-xl border border-outline-variant/30 flex items-center justify-between gap-4">
                        <div className="space-y-1">
                          <p className="font-label-md text-label-md font-bold text-on-surface">
                            Digital Counter Pass
                          </p>
                          <p className="text-[12px] text-on-surface-variant">
                            Selected ETA: <strong>{order.customerETA}</strong>
                          </p>
                          <p className="font-mono text-sm font-bold text-secondary pt-1">
                            {order.qrCodeToken || '#PASS-8812'}
                          </p>
                        </div>

                        {/* Pass Token Tile */}
                        <div className="w-20 h-20 bg-surface-container-lowest p-2 rounded-lg border border-outline-variant/40 flex flex-col justify-between items-center shadow-xs">
                          <span className="material-symbols-outlined text-[32px] text-primary">qr_code_2</span>
                          <span className="text-[8px] font-mono font-bold text-on-surface-variant">TOKEN</span>
                        </div>
                      </div>
                    )}

                    {/* Order summary list */}
                    <div className="text-body-sm font-body-sm text-on-surface-variant space-y-1">
                      {order.items.map((it, idx) => (
                        <div key={idx} className="flex justify-between">
                          <span>
                            {it.quantity}x {it.name}
                          </span>
                          <span className="font-semibold text-on-surface">₹{it.price * it.quantity}</span>
                        </div>
                      ))}
                      <div className="flex justify-between font-bold text-on-surface pt-2 border-t border-outline-variant/20">
                        <span>Total Paid ({order.paymentMethod === 'upi_qr' ? 'Direct UPI' : 'Counter'})</span>
                        <span className="text-secondary font-bold">₹{order.totalAmount}</span>
                      </div>
                    </div>

                    {/* "I'M HERE" Action Button */}
                    {!isCompleted && !isCancelled && (
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
                            ✓ Counter notified! Present your token at billing desk.
                          </div>
                        )}
                      </div>
                    )}

                    {/* Completed Handover & Review prompt */}
                    {isCompleted && (
                      <div className="pt-2 space-y-2">
                        <div className="p-2.5 bg-secondary-container rounded-lg text-center font-label-sm text-label-sm font-bold text-on-secondary-container">
                          ✓ Order Collected & Handover Verified
                        </div>

                        {!order.rated ? (
                          <button
                            onClick={() => setReviewOrder(order)}
                            className="w-full py-2 rounded-xl bg-primary text-on-primary font-label-md text-label-md font-bold hover:bg-neutral-800 transition flex items-center justify-center gap-1.5"
                          >
                            <span className="material-symbols-outlined text-[18px]">rate_review</span>
                            <span>Rate & Review Storefront</span>
                          </button>
                        ) : (
                          <p className="text-center text-xs font-bold text-secondary">
                            ★ Thank you for rating this store!
                          </p>
                        )}
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
                <div className="space-y-4 pt-4 overflow-y-auto max-h-[60vh] pr-1">
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
                          Store Delivery Disabled
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

                  {/* Payment Method Section */}
                  <div className="space-y-2 pt-2 border-t border-outline-variant/20">
                    <label className="block font-label-md text-label-md font-bold text-on-surface">
                      Payment Option:
                    </label>

                    <div className="space-y-2">
                      {selectedStore?.paymentQrUrl ? (
                        <div
                          onClick={() => setPaymentMethod('upi_qr')}
                          className={`p-3 rounded-xl border cursor-pointer transition ${
                            paymentMethod === 'upi_qr'
                              ? 'bg-secondary-container/30 border-secondary ring-1 ring-secondary'
                              : 'bg-surface-container-low border-outline-variant/30'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="material-symbols-outlined text-secondary text-[20px]">qr_code</span>
                              <span className="font-bold text-on-surface text-sm">Pay Directly to Store (UPI QR)</span>
                            </div>
                            <span className="text-[10px] font-bold uppercase bg-secondary-container text-on-secondary-container px-2 py-0.5 rounded">
                              Direct UPI
                            </span>
                          </div>

                          {paymentMethod === 'upi_qr' && (
                            <div className="mt-3 p-3 bg-surface-container-lowest rounded-xl border border-outline-variant/30 flex flex-col items-center text-center space-y-2">
                              <p className="text-xs font-bold text-secondary uppercase">
                                Scan & Pay Directly to {selectedStore.shopName}
                              </p>
                              <img
                                src={selectedStore.paymentQrUrl}
                                alt="Store UPI QR Code"
                                className="w-36 h-36 object-contain rounded-lg border border-outline-variant/30 shadow-xs"
                              />
                              <p className="text-[11px] text-on-surface-variant font-mono">
                                Amount to pay: <strong>₹{cartTotal}</strong>
                              </p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div
                          onClick={() => setPaymentMethod('upi_qr')}
                          className={`p-3 rounded-xl border cursor-pointer ${
                            paymentMethod === 'upi_qr'
                              ? 'bg-secondary-container/30 border-secondary'
                              : 'bg-surface-container-low border-outline-variant/30'
                          }`}
                        >
                          <span className="font-bold text-on-surface text-sm">UPI Payment</span>
                        </div>
                      )}

                      <div
                        onClick={() => setPaymentMethod('pay_at_store')}
                        className={`p-3 rounded-xl border cursor-pointer transition ${
                          paymentMethod === 'pay_at_store'
                            ? 'bg-secondary-container/30 border-secondary ring-1 ring-secondary'
                            : 'bg-surface-container-low border-outline-variant/30'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-[20px]">payments</span>
                            <span className="font-bold text-on-surface text-sm">
                              {fulfillmentType === 'Smart Pickup' ? 'Pay at Counter (Cash/Card)' : 'Cash on Delivery'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
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
                  <span>Generating Order Pass...</span>
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

      {/* ================= REVIEW & RATING MODAL ================= */}
      {reviewOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setReviewOrder(null)} />
          <div className="relative w-full max-w-md bg-surface-container-lowest rounded-2xl shadow-2xl p-6 z-10 border border-outline-variant/30 space-y-4">
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
              <div>
                <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                  Rate Your Experience
                </h3>
                <p className="text-xs text-on-surface-variant font-semibold">
                  {reviewOrder.retailerName} ({reviewOrder.orderNumber})
                </p>
              </div>
              <button
                onClick={() => setReviewOrder(null)}
                className="p-1 rounded-lg text-on-surface-variant hover:bg-surface-container"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Star Rating Selector */}
            <div className="flex items-center justify-center gap-2 py-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRatingVal(star)}
                  className="p-1 hover:scale-110 transition"
                >
                  <span
                    className={`material-symbols-outlined text-[36px] ${
                      star <= ratingVal ? 'text-amber-500' : 'text-outline-variant'
                    }`}
                  >
                    star
                  </span>
                </button>
              ))}
            </div>

            {/* Quick Feedback Tags */}
            <div>
              <label className="block text-xs font-bold uppercase text-on-surface-variant mb-1.5">
                What went well?
              </label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Quick Counter Pickup',
                  'Fresh Quality',
                  'Accurate Items',
                  'Friendly Staff',
                  'Great Packaging',
                ].map((tag) => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => {
                        setSelectedTags((prev) =>
                          isSelected ? prev.filter((t) => t !== tag) : [...prev, tag]
                        );
                      }}
                      className={`px-3 py-1 rounded-full text-xs font-bold border transition ${
                        isSelected
                          ? 'bg-secondary-container text-on-secondary-container border-secondary'
                          : 'bg-surface-container-low text-on-surface-variant border-outline-variant/30'
                      }`}
                    >
                      {isSelected ? '✓ ' : ''}{tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Optional Comment */}
            <div>
              <label className="block text-xs font-bold uppercase text-on-surface-variant mb-1">
                Your Review (Optional)
              </label>
              <textarea
                rows={3}
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Share your experience picking up from this shop..."
                className="w-full px-3.5 py-2 rounded-xl bg-surface-container-low border border-outline-variant/30 text-on-surface font-body-sm text-body-sm focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-outline-variant/20">
              <button
                type="button"
                onClick={() => setReviewOrder(null)}
                className="px-4 py-2 rounded-xl text-on-surface font-label-md text-label-md hover:bg-surface-container"
              >
                Skip
              </button>
              <button
                type="button"
                disabled={isSubmittingReview}
                onClick={handleSubmitReview}
                className="px-6 py-2 rounded-xl bg-primary text-on-primary font-label-md text-label-md font-bold hover:bg-neutral-800 transition"
              >
                {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
