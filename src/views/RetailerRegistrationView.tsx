import React, { useState } from 'react';
import { createRetailerApplication } from '../services/firebaseService';
import { Retailer } from '../types';

interface RetailerRegistrationViewProps {
  onRegistrationSuccess: (newRetailerId: string) => void;
  onGoToPortal: () => void;
  onGoToAdmin: () => void;
}

export const RetailerRegistrationView: React.FC<RetailerRegistrationViewProps> = ({
  onRegistrationSuccess,
  onGoToPortal,
  onGoToAdmin
}) => {
  // Step tracker: 1: Auth & Owner, 2: Business Info & Location, 3: Fulfillment & Photos, 4: Submitted
  const [step, setStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdRetailerId, setCreatedRetailerId] = useState<string | null>(null);

  // Form State
  const [authMethod, setAuthMethod] = useState<'phone' | 'email'>('phone');
  const [phone, setPhone] = useState('+91 98160 55420');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('123456');
  const [otpVerified, setOtpVerified] = useState(false);

  const [email, setEmail] = useState('gupta.kirana@gmail.com');
  const [password, setPassword] = useState('LocalMarket@2026');

  // Business Information
  const [ownerName, setOwnerName] = useState('Amit Gupta');
  const [shopName, setShopName] = useState('Gupta General Store');
  const [category, setCategory] = useState('Daily Kirana & Provisions');
  const [address, setAddress] = useState('Shop #12, Near Bus Stand, Main Market');
  const [city, setCity] = useState('Ghumarwin');
  const [area, setArea] = useState('Ghumarwin Bazaar');
  const [pincode, setPincode] = useState('174021');
  const [latitude, setLatitude] = useState(31.4429);
  const [longitude, setLongitude] = useState(76.7118);
  const [openingTime, setOpeningTime] = useState('08:00 AM');
  const [closingTime, setClosingTime] = useState('09:00 PM');
  const [weeklyClosedDay, setWeeklyClosedDay] = useState('Tuesday');

  // Fulfillment Options
  const [enableSmartPickup, setEnableSmartPickup] = useState(true);
  const [enableDirectDelivery, setEnableDirectDelivery] = useState(true);

  // Store Presentation
  const [logoUrl, setLogoUrl] = useState(
    'https://lh3.googleusercontent.com/aida-public/AB6AXuA4MNhkPeUaC0k3r4c02_O-FWoprhHgfURROdKYFrVAgXekV1tjQGJiJ_EZCd6Lih-gpkvcjBxzCIPOvYPilSIsGKAqo-s8TLZAOOkhfIEzLwNgSk5fG5t3cwMT4NFc5z0OA5MVazhjLTg4Q2lkMPG2jHhkyUbxYDr62pQN7betK5AZMYiUgxg6o7Q2VuDwBg9wIpmTQ_Un6l9n6OUwaOFbqw0cI3hP-zxmJHp9MLapV4RNUM4VWtG4RQ'
  );
  const [description, setDescription] = useState(
    'Trusted neighborhood grocery & daily essentials store serving Ghumarwin with fast counter pickup and local home delivery.'
  );
  const [preparationTime, setPreparationTime] = useState('15 mins');

  // Coordinates preset helpers
  const handleTownPreset = (townName: string) => {
    setCity(townName);
    if (townName === 'Ghumarwin') {
      setArea('Ghumarwin Bazaar');
      setPincode('174021');
      setLatitude(31.4429);
      setLongitude(76.7118);
    } else if (townName === 'Bilaspur') {
      setArea('Bilaspur Main Chowk');
      setPincode('174001');
      setLatitude(31.3260);
      setLongitude(76.7570);
    } else if (townName === 'Sundernagar') {
      setArea('Sundernagar Cinema Road');
      setPincode('175002');
      setLatitude(31.5332);
      setLongitude(76.8920);
    }
  };

  const handleFetchCurrentGps = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLatitude(Number(pos.coords.latitude.toFixed(4)));
          setLongitude(Number(pos.coords.longitude.toFixed(4)));
          alert(`GPS Coordinates locked: ${pos.coords.latitude.toFixed(4)}° N, ${pos.coords.longitude.toFixed(4)}° E`);
        },
        () => {
          // Fallback demo location
          alert('GPS permission granted. Locked to Ghumarwin Central Node (31.4429° N, 76.7118° E)');
        }
      );
    }
  };

  const handleVerifyOtp = () => {
    setOtpVerified(true);
  };

  const handleSubmitRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ownerName.trim() || !shopName.trim()) {
      alert('Please provide Owner Name and Shop Name');
      return;
    }

    const fulfillmentOptions: ('Smart Pickup' | 'Retailer Direct Delivery')[] = [];
    if (enableSmartPickup) fulfillmentOptions.push('Smart Pickup');
    if (enableDirectDelivery) fulfillmentOptions.push('Retailer Direct Delivery');

    if (fulfillmentOptions.length === 0) {
      alert('Please select at least one fulfillment option (Smart Pickup or Store Delivery).');
      return;
    }

    setIsSubmitting(true);
    try {
      const newRetailerData: Omit<Retailer, 'id'> = {
        ownerName: ownerName.trim(),
        shopName: shopName.trim(),
        category,
        phone: phone.trim(),
        email: email.trim(),
        address: address.trim(),
        city,
        area,
        pincode,
        latitude,
        longitude,
        openingTime,
        closingTime,
        closedDay: weeklyClosedDay,
        logoUrl,
        description: description.trim(),
        fulfillmentOptions,
        preparationTime,
        status: 'pending_review',
        createdAt: new Date().toISOString(),
        dossierNumber: `MER-${Math.floor(10000 + Math.random() * 90000)}`,
        fssaiNumber: `FSSAI-${Math.floor(10000000000000 + Math.random() * 90000000000000)}`,
        udyamNumber: `UDYAM-HP-02-00${Math.floor(10000 + Math.random() * 90000)}`,
        bankName: 'HDFC Bank HP',
        accountMasked: `••••••••${Math.floor(1000 + Math.random() * 9000)}`,
        ifsc: 'HDFC0001928',
        upiId: `${ownerName.toLowerCase().replace(/[^a-z0-9]/g, '')}@okhdfcbank`
      };

      const docId = await createRetailerApplication(newRetailerData);
      setCreatedRetailerId(docId);
      setStep(4);
      onRegistrationSuccess(docId);
    } catch (err: any) {
      alert(`Registration submission failed: ${err.message || err}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header Banner */}
      <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-outline-variant/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-secondary animate-pulse" />
            <span className="font-label-sm text-label-sm uppercase font-bold text-secondary tracking-wider">
              Himachal Pradesh North Retail Network
            </span>
          </div>
          <h1 className="font-headline-lg text-headline-lg font-bold text-on-surface">
            Merchant Onboarding & Store Registration
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            Join LocalMarket to enable Smart Counter Pickup Passes & Direct Deliveries for your local shop.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onGoToAdmin}
            className="px-3.5 py-2 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface font-label-md text-label-md font-semibold border border-outline-variant/30 transition"
          >
            Switch to Admin Console
          </button>
        </div>
      </div>

      {/* Step Indicators */}
      {step < 4 && (
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => setStep(1)}
            className={`p-3 rounded-xl border text-left transition ${
              step === 1
                ? 'bg-primary text-on-primary border-primary font-bold shadow-xs'
                : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant/20'
            }`}
          >
            <span className="text-[11px] uppercase tracking-wider block opacity-80">Step 1</span>
            <span className="font-label-md text-label-md">Account & Owner</span>
          </button>

          <button
            onClick={() => setStep(2)}
            className={`p-3 rounded-xl border text-left transition ${
              step === 2
                ? 'bg-primary text-on-primary border-primary font-bold shadow-xs'
                : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant/20'
            }`}
          >
            <span className="text-[11px] uppercase tracking-wider block opacity-80">Step 2</span>
            <span className="font-label-md text-label-md">Business & Location</span>
          </button>

          <button
            onClick={() => setStep(3)}
            className={`p-3 rounded-xl border text-left transition ${
              step === 3
                ? 'bg-primary text-on-primary border-primary font-bold shadow-xs'
                : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant/20'
            }`}
          >
            <span className="text-[11px] uppercase tracking-wider block opacity-80">Step 3</span>
            <span className="font-label-md text-label-md">Fulfillment & Profile</span>
          </button>
        </div>
      )}

      {/* STEP 1: Account Creation & Basic Credentials */}
      {step === 1 && (
        <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-outline-variant/20 space-y-6">
          <div className="border-b border-outline-variant/20 pb-3">
            <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">
              Step 1: Retailer Authentication & Identity
            </h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Create your authorized proprietor account on LocalMarket.
            </p>
          </div>

          {/* Auth Method Selector */}
          <div className="flex items-center gap-2 p-1 bg-surface-container-low rounded-xl w-max border border-outline-variant/30">
            <button
              type="button"
              onClick={() => setAuthMethod('phone')}
              className={`px-4 py-1.5 rounded-lg font-label-md text-label-md transition ${
                authMethod === 'phone'
                  ? 'bg-surface-container-lowest text-on-surface font-bold shadow-xs'
                  : 'text-on-surface-variant'
              }`}
            >
              📱 Mobile Number + OTP
            </button>
            <button
              type="button"
              onClick={() => setAuthMethod('email')}
              className={`px-4 py-1.5 rounded-lg font-label-md text-label-md transition ${
                authMethod === 'email'
                  ? 'bg-surface-container-lowest text-on-surface font-bold shadow-xs'
                  : 'text-on-surface-variant'
              }`}
            >
              ✉️ Email & Password
            </button>
          </div>

          {authMethod === 'phone' ? (
            <div className="space-y-4 max-w-md">
              <div>
                <label className="block font-label-md text-label-md font-bold text-on-surface mb-1">
                  Proprietor Mobile Number *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98160 00000"
                    className="flex-1 px-3.5 py-2.5 rounded-lg bg-surface-container-low border border-outline-variant/30 font-body-md text-on-surface focus:outline-none"
                  />
                  {!otpSent ? (
                    <button
                      type="button"
                      onClick={() => setOtpSent(true)}
                      className="px-4 py-2.5 rounded-lg bg-secondary text-on-secondary font-label-md text-label-md font-bold hover:opacity-95 transition"
                    >
                      Send OTP
                    </button>
                  ) : (
                    <span className="px-3 py-2 text-secondary font-bold text-sm flex items-center">
                      OTP Sent
                    </span>
                  )}
                </div>
              </div>

              {otpSent && (
                <div className="space-y-2 p-4 bg-surface-container-low rounded-xl border border-outline-variant/30">
                  <label className="block font-label-sm text-label-sm font-bold text-on-surface">
                    Enter 6-Digit SMS Code (Pre-filled for simulation)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      className="w-36 px-3 py-2 text-center tracking-widest font-bold rounded-lg bg-surface-container-lowest border border-outline-variant/30 text-on-surface"
                    />
                    <button
                      type="button"
                      onClick={handleVerifyOtp}
                      className={`px-4 py-2 rounded-lg font-label-md text-label-md font-bold transition ${
                        otpVerified
                          ? 'bg-secondary text-on-secondary'
                          : 'bg-primary text-on-primary'
                      }`}
                    >
                      {otpVerified ? '✓ Verified' : 'Verify OTP'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-label-md text-label-md font-bold text-on-surface mb-1">
                  Business Email *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-surface-container-low border border-outline-variant/30 font-body-md text-on-surface focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-label-md text-label-md font-bold text-on-surface mb-1">
                  Password *
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-surface-container-low border border-outline-variant/30 font-body-md text-on-surface focus:outline-none"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-outline-variant/20">
            <div>
              <label className="block font-label-md text-label-md font-bold text-on-surface mb-1">
                Owner / Proprietor Full Name *
              </label>
              <input
                type="text"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="e.g. Amit Gupta"
                className="w-full px-3.5 py-2.5 rounded-lg bg-surface-container-low border border-outline-variant/30 font-body-md text-on-surface focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-label-md text-label-md font-bold text-on-surface mb-1">
                Contact Email for Invoicing & Reports
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-surface-container-low border border-outline-variant/30 font-body-md text-on-surface focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="px-6 py-2.5 rounded-xl bg-primary text-on-primary font-label-md text-label-md font-bold shadow-sm hover:bg-neutral-800 transition"
            >
              Continue to Step 2: Business Info →
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Business Info, Addresses, Operating Hours */}
      {step === 2 && (
        <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-outline-variant/20 space-y-6">
          <div className="border-b border-outline-variant/20 pb-3">
            <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">
              Step 2: Business & Geolocation Setup
            </h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Specify your shop name, market cluster, operating hours, and counter GPS coordinates.
            </p>
          </div>

          {/* Quick Town Presets */}
          <div className="flex items-center gap-2">
            <span className="font-label-sm text-label-sm font-bold text-on-surface-variant">
              Quick Cluster Presets:
            </span>
            {['Ghumarwin', 'Bilaspur', 'Sundernagar'].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => handleTownPreset(t)}
                className={`px-3 py-1 rounded-lg font-label-sm text-label-sm font-semibold border transition ${
                  city === t
                    ? 'bg-secondary-container text-on-secondary-container border-secondary font-bold'
                    : 'bg-surface-container-low text-on-surface border-outline-variant/30'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-label-md text-label-md font-bold text-on-surface mb-1">
                Shop / Business Name *
              </label>
              <input
                type="text"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                placeholder="e.g. Gupta General Store"
                className="w-full px-3.5 py-2.5 rounded-lg bg-surface-container-low border border-outline-variant/30 font-body-md text-on-surface focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-label-md text-label-md font-bold text-on-surface mb-1">
                Business Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-surface-container-low border border-outline-variant/30 font-body-md text-on-surface focus:outline-none"
              >
                <option value="Daily Kirana & Provisions">Daily Kirana & Provisions</option>
                <option value="Dairy, Sweets & Bakery">Dairy, Sweets & Bakery</option>
                <option value="Chemist & Health">Chemist & Health</option>
                <option value="Electronics & Mobile">Electronics & Mobile</option>
                <option value="Apparel & Boutique">Apparel & Boutique</option>
                <option value="Fresh Fruits & Vegetables">Fresh Fruits & Vegetables</option>
                <option value="Hardware & Sanitary">Hardware & Sanitary</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-label-md text-label-md font-bold text-on-surface mb-1">
              Complete Shop Address *
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. Shop #12, Near Bus Stand, Main Market"
              className="w-full px-3.5 py-2.5 rounded-lg bg-surface-container-low border border-outline-variant/30 font-body-md text-on-surface focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-label-md text-label-md font-bold text-on-surface mb-1">
                City / Town *
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-surface-container-low border border-outline-variant/30 font-body-md text-on-surface focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-label-md text-label-md font-bold text-on-surface mb-1">
                Area / Locality *
              </label>
              <input
                type="text"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-surface-container-low border border-outline-variant/30 font-body-md text-on-surface focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-label-md text-label-md font-bold text-on-surface mb-1">
                Pincode *
              </label>
              <input
                type="text"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-surface-container-low border border-outline-variant/30 font-body-md text-on-surface focus:outline-none"
              />
            </div>
          </div>

          {/* GPS Coordinates with auto-pin */}
          <div className="p-4 bg-surface-container-low rounded-xl border border-outline-variant/30 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-label-md text-label-md font-bold text-on-surface">
                  Counter GPS Coordinates
                </p>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Required for Himachal North KYC Policy v2.4 geofencing accuracy.
                </p>
              </div>
              <button
                type="button"
                onClick={handleFetchCurrentGps}
                className="px-3 py-1.5 rounded-lg bg-surface-container-lowest text-secondary font-label-sm text-label-sm font-bold border border-secondary/30 hover:bg-secondary-container transition flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[16px]">my_location</span>
                <span>Fetch Current GPS</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-body-sm text-[12px] text-on-surface-variant mb-1">Latitude</label>
                <input
                  type="number"
                  step="0.0001"
                  value={latitude}
                  onChange={(e) => setLatitude(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-lg bg-surface-container-lowest border border-outline-variant/30 text-on-surface font-mono text-sm"
                />
              </div>
              <div>
                <label className="block font-body-sm text-[12px] text-on-surface-variant mb-1">Longitude</label>
                <input
                  type="number"
                  step="0.0001"
                  value={longitude}
                  onChange={(e) => setLongitude(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-lg bg-surface-container-lowest border border-outline-variant/30 text-on-surface font-mono text-sm"
                />
              </div>
            </div>
          </div>

          {/* Operating Hours */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-label-md text-label-md font-bold text-on-surface mb-1">
                Opening Time
              </label>
              <input
                type="text"
                value={openingTime}
                onChange={(e) => setOpeningTime(e.target.value)}
                placeholder="08:00 AM"
                className="w-full px-3.5 py-2.5 rounded-lg bg-surface-container-low border border-outline-variant/30 font-body-md text-on-surface"
              />
            </div>

            <div>
              <label className="block font-label-md text-label-md font-bold text-on-surface mb-1">
                Closing Time
              </label>
              <input
                type="text"
                value={closingTime}
                onChange={(e) => setClosingTime(e.target.value)}
                placeholder="09:00 PM"
                className="w-full px-3.5 py-2.5 rounded-lg bg-surface-container-low border border-outline-variant/30 font-body-md text-on-surface"
              />
            </div>

            <div>
              <label className="block font-label-md text-label-md font-bold text-on-surface mb-1">
                Weekly Closed Day
              </label>
              <select
                value={weeklyClosedDay}
                onChange={(e) => setWeeklyClosedDay(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-surface-container-low border border-outline-variant/30 font-body-md text-on-surface"
              >
                <option value="None (Open 7 Days)">None (Open 7 Days)</option>
                <option value="Tuesday">Tuesday</option>
                <option value="Sunday">Sunday</option>
                <option value="Monday">Monday</option>
                <option value="Wednesday">Wednesday</option>
              </select>
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-outline-variant/20">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-5 py-2.5 rounded-xl text-on-surface font-label-md text-label-md hover:bg-surface-container transition"
            >
              ← Back
            </button>
            <button
              type="button"
              onClick={() => setStep(3)}
              className="px-6 py-2.5 rounded-xl bg-primary text-on-primary font-label-md text-label-md font-bold shadow-sm hover:bg-neutral-800 transition"
            >
              Continue to Step 3: Fulfillment →
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Fulfillment & Photos & Submission */}
      {step === 3 && (
        <form onSubmit={handleSubmitRegistration} className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-outline-variant/20 space-y-6">
          <div className="border-b border-outline-variant/20 pb-3">
            <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">
              Step 3: Fulfillment & Store Presentation
            </h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Select customer fulfillment modes and showcase your storefront.
            </p>
          </div>

          {/* Fulfillment options */}
          <div className="space-y-3">
            <label className="block font-label-md text-label-md font-bold text-on-surface">
              Fulfillment Options Offered *
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label
                className={`p-4 rounded-xl border flex items-start gap-3 cursor-pointer transition ${
                  enableSmartPickup
                    ? 'border-secondary bg-secondary-container/20 ring-1 ring-secondary/30'
                    : 'border-outline-variant/30 bg-surface-container-low'
                }`}
              >
                <input
                  type="checkbox"
                  checked={enableSmartPickup}
                  onChange={(e) => setEnableSmartPickup(e.target.checked)}
                  className="w-5 h-5 accent-secondary mt-0.5"
                />
                <div>
                  <span className="font-label-md text-label-md font-bold text-on-surface block">
                    🛍️ Smart Pickup Counter
                  </span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    Customer orders ahead, selects ETA, and presents digital pass for 2-min counter scan.
                  </span>
                </div>
              </label>

              <label
                className={`p-4 rounded-xl border flex items-start gap-3 cursor-pointer transition ${
                  enableDirectDelivery
                    ? 'border-secondary bg-secondary-container/20 ring-1 ring-secondary/30'
                    : 'border-outline-variant/30 bg-surface-container-low'
                }`}
              >
                <input
                  type="checkbox"
                  checked={enableDirectDelivery}
                  onChange={(e) => setEnableDirectDelivery(e.target.checked)}
                  className="w-5 h-5 accent-secondary mt-0.5"
                />
                <div>
                  <span className="font-label-md text-label-md font-bold text-on-surface block">
                    🛵 Retailer Direct Delivery
                  </span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    Your own staff/riders deliver within your town geofence perimeter.
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Prep SLA & Description */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-label-md text-label-md font-bold text-on-surface mb-1">
                Estimated Order Preparation Time *
              </label>
              <select
                value={preparationTime}
                onChange={(e) => setPreparationTime(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-surface-container-low border border-outline-variant/30 font-body-md text-on-surface focus:outline-none"
              >
                <option value="10 mins">10 mins (Rapid Counter Handover)</option>
                <option value="15 mins">15 mins (Standard Groceries & Kirana)</option>
                <option value="25 mins">25 mins (Fresh Bakery / Prepared Items)</option>
                <option value="45 mins">45 mins (Special Orders)</option>
              </select>
            </div>

            <div>
              <label className="block font-label-md text-label-md font-bold text-on-surface mb-1">
                Store Logo / Counter Image URL
              </label>
              <input
                type="text"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://... photo link"
                className="w-full px-3.5 py-2.5 rounded-lg bg-surface-container-low border border-outline-variant/30 font-body-md text-on-surface focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-label-md text-label-md font-bold text-on-surface mb-1">
              Store Public Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell local customers about your products and specialties..."
              className="w-full px-3.5 py-2.5 rounded-lg bg-surface-container-low border border-outline-variant/30 font-body-md text-on-surface focus:outline-none"
            />
          </div>

          {/* Review Summary Box */}
          <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/30 space-y-2">
            <span className="font-label-sm text-label-sm uppercase font-bold text-secondary">
              Review Before Submission:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-body-sm text-body-sm text-on-surface-variant">
              <div>Store: <strong className="text-on-surface">{shopName}</strong></div>
              <div>Owner: <strong className="text-on-surface">{ownerName}</strong></div>
              <div>Town: <strong className="text-on-surface">{city}</strong></div>
              <div>Category: <strong className="text-on-surface">{category}</strong></div>
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-outline-variant/20">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="px-5 py-2.5 rounded-xl text-on-surface font-label-md text-label-md hover:bg-surface-container transition"
            >
              ← Back
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-3 rounded-xl bg-secondary text-on-secondary font-label-lg text-label-lg font-bold shadow-md hover:opacity-95 transition flex items-center gap-2"
            >
              {isSubmitting ? (
                <span>Submitting to Firebase...</span>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[20px]">send</span>
                  <span>Submit Store Application</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* STEP 4: Successful Submission Notice */}
      {step === 4 && (
        <div className="bg-surface-container-lowest rounded-2xl p-8 sm:p-10 shadow-lg border border-secondary/30 text-center space-y-6 animate-in fade-in zoom-in-95">
          <div className="w-16 h-16 rounded-full bg-secondary-container text-secondary flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-[36px]">verified</span>
          </div>

          <div className="space-y-2 max-w-lg mx-auto">
            <h2 className="font-headline-lg text-headline-lg font-bold text-on-surface">
              Registration Submitted Successfully
            </h2>
            <p className="font-body-lg text-body-lg text-on-surface font-medium">
              “Your store registration has been submitted successfully. Our team will review your details before activating your storefront.”
            </p>
            <div className="mt-4 p-4 rounded-xl bg-surface-container-low text-left font-body-sm text-body-sm space-y-1">
              <p><strong>Shop:</strong> {shopName}</p>
              <p><strong>Owner:</strong> {ownerName} ({phone})</p>
              <p><strong>Cluster:</strong> {city} ({area})</p>
              <p><strong>Initial Status:</strong> <span className="text-secondary font-bold uppercase">Pending Review</span></p>
              <p className="text-[11px] text-on-surface-variant font-mono pt-1">Doc ID: {createdRetailerId}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-4 border-t border-outline-variant/20">
            <button
              onClick={onGoToAdmin}
              className="px-6 py-2.5 rounded-xl bg-primary text-on-primary font-label-md text-label-md font-bold hover:bg-neutral-800 transition"
            >
              Open Admin Console to Approve Store
            </button>
            <button
              onClick={onGoToPortal}
              className="px-6 py-2.5 rounded-xl bg-surface-container-high text-on-surface font-label-md text-label-md font-bold hover:bg-surface-container-highest transition"
            >
              Go to Retailer Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
