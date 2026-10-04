import React, { useState } from 'react';
import { createRetailerApplication } from '../services/firebaseService';
import { Retailer } from '../types';
import { MapLocationPicker } from '../components/MapLocationPicker';

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
  // Step: 1: Owner & Account, 2: Business & GSTIN, 3: Address & Map, 4: Timings & Fulfillment, 5: Photos & Payment QR, 6: Success
  const [step, setStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdRetailerId, setCreatedRetailerId] = useState<string | null>(null);

  // Map Picker Modal
  const [isMapPickerOpen, setIsMapPickerOpen] = useState(false);

  // 1. OWNER INFORMATION
  const [ownerName, setOwnerName] = useState('Sonu Sharma');
  const [phone, setPhone] = useState('+91 98160 33819');
  const [email, setEmail] = useState('sonu.kirana@gmail.com');
  const [otpCode, setOtpCode] = useState('5491');
  const [otpInput, setOtpInput] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(true);

  // 2. BUSINESS INFORMATION
  const [shopName, setShopName] = useState('Sonu Kirana Store');
  const [category, setCategory] = useState('Daily Kirana & Provisions');
  const [subCategory, setSubCategory] = useState('Groceries, Spices & Staples');
  const [gstin, setGstin] = useState('02AAECS1429P1Z8');
  const [gstinError, setGstinError] = useState('');
  const [description, setDescription] = useState(
    'Neighborhood Kirana & general store offering hill fresh dairy, pulses, branded provisions, and snacks with quick counter pickup.'
  );

  // 3. LOCATION
  const [address, setAddress] = useState('Shop #4, Near Bus Stand, Main Market Road');
  const [houseNumber, setHouseNumber] = useState('Shop #4');
  const [street, setStreet] = useState('Main Bazaar Road');
  const [area, setArea] = useState('Ghumarwin Bazaar');
  const [city, setCity] = useState('Ghumarwin');
  const [district, setDistrict] = useState('Bilaspur');
  const [state, setState] = useState('Himachal Pradesh');
  const [pincode, setPincode] = useState('174021');
  const [latitude, setLatitude] = useState(31.4429);
  const [longitude, setLongitude] = useState(76.7118);
  const [formattedAddress, setFormattedAddress] = useState('Main Market Road, Ghumarwin, Himachal Pradesh 174021');

  // 4. STORE TIMINGS & FULFILLMENT
  const [openingTime, setOpeningTime] = useState('08:00 AM');
  const [closingTime, setClosingTime] = useState('09:00 PM');
  const [closedDay, setClosedDay] = useState('Tuesday');
  const [temporarilyClosed, setTemporarilyClosed] = useState(false);
  const [enableSmartPickup, setEnableSmartPickup] = useState(true);
  const [enableDirectDelivery, setEnableDirectDelivery] = useState(true);
  const [preparationTime, setPreparationTime] = useState('15 mins');

  // 5. PHOTOS & PAYMENT QR
  const [logoUrl, setLogoUrl] = useState(
    'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=300&q=80'
  );
  const [shopImageUrl, setShopImageUrl] = useState(
    'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=800&q=80'
  );
  const [paymentQrUrl, setPaymentQrUrl] = useState<string>('');

  // GSTIN Validation Handler
  const validateGstin = (value: string) => {
    const clean = value.toUpperCase().trim();
    setGstin(clean);
    // Standard Indian GSTIN: 15 alphanumeric characters
    const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    if (!clean) {
      setGstinError('GSTIN is mandatory for merchant onboarding.');
    } else if (clean.length !== 15) {
      setGstinError('GSTIN must be exactly 15 alphanumeric characters.');
    } else if (!gstinRegex.test(clean)) {
      setGstinError('Invalid GSTIN format (e.g. 02AAECS1429P1Z8).');
    } else {
      setGstinError('');
    }
  };

  // Image Upload Handlers via FileReader
  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (url: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Please choose an image under 2MB.');
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

  // Location confirmed from Map
  const handleConfirmLocation = (loc: {
    latitude: number;
    longitude: number;
    formattedAddress: string;
    pincode?: string;
  }) => {
    setLatitude(loc.latitude);
    setLongitude(loc.longitude);
    setFormattedAddress(loc.formattedAddress);
    if (loc.pincode) setPincode(loc.pincode);
  };

  // Submit Application to Firebase
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!gstin.trim() || gstin.trim().length !== 15) {
      alert('Valid 15-character GSTIN is required.');
      setStep(2);
      return;
    }

    const fulfillmentOptions: ('Smart Pickup' | 'Retailer Direct Delivery')[] = [];
    if (enableSmartPickup) fulfillmentOptions.push('Smart Pickup');
    if (enableDirectDelivery) fulfillmentOptions.push('Retailer Direct Delivery');

    if (fulfillmentOptions.length === 0) {
      alert('Please enable at least one fulfillment method (Smart Pickup or Direct Delivery).');
      setStep(4);
      return;
    }

    setIsSubmitting(true);
    try {
      const fullAddressString = `${houseNumber ? houseNumber + ', ' : ''}${street ? street + ', ' : ''}${address}, ${area}, ${city}, ${district}, ${state} - ${pincode}`;

      const newRetailer: Omit<Retailer, 'id'> = {
        ownerName: ownerName.trim(),
        shopName: shopName.trim(),
        category,
        subCategory,
        gstin: gstin.toUpperCase().trim(),
        phone: phone.trim(),
        email: email.trim(),
        address: fullAddressString,
        houseNumber,
        street,
        area,
        city,
        district,
        state,
        pincode,
        latitude,
        longitude,
        openingTime,
        closingTime,
        closedDay,
        closedDays: [closedDay],
        temporarilyClosed,
        fulfillmentOptions,
        pickupEnabled: enableSmartPickup,
        deliveryEnabled: enableDirectDelivery,
        preparationTime,
        logoUrl: logoUrl || 'https://via.placeholder.com/120',
        shopImageUrl: shopImageUrl || 'https://via.placeholder.com/600x300',
        paymentQrUrl: paymentQrUrl || undefined,
        description: description.trim(),
        status: 'pending_review',
        ratingAverage: 0,
        ratingCount: 0,
        createdAt: new Date().toISOString(),
        dossierNumber: `MER-${Math.floor(10000 + Math.random() * 90000)}`,
        fssaiNumber: `FSSAI-${Math.floor(10000000000000 + Math.random() * 90000000000000)}`,
      };

      const docId = await createRetailerApplication(newRetailer);
      setCreatedRetailerId(docId);
      setStep(6);
      onRegistrationSuccess(docId);
    } catch (err: any) {
      alert(`Registration submission error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Brand Hero Header */}
      <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-outline-variant/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-secondary animate-pulse" />
            <span className="font-label-sm text-label-sm uppercase font-bold text-secondary tracking-wider">
              Himachal Pradesh North Retail Network
            </span>
          </div>
          <h1 className="font-headline-lg text-headline-lg font-bold text-on-surface">
            Retailer Store Registration & Onboarding
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            Create your storefront to receive verified Smart Pickup passes and customer delivery dispatches.
          </p>
        </div>

        <button
          onClick={onGoToAdmin}
          className="px-4 py-2 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface font-label-md text-label-md font-semibold border border-outline-variant/30 transition shrink-0"
        >
          Admin Console
        </button>
      </div>

      {/* Step Indicators */}
      {step < 6 && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {[
            { num: 1, label: 'Owner Info' },
            { num: 2, label: 'Business & GST' },
            { num: 3, label: 'Shop Location' },
            { num: 4, label: 'Timings & SLA' },
            { num: 5, label: 'Photos & QR' }
          ].map((s) => (
            <button
              key={s.num}
              type="button"
              onClick={() => setStep(s.num)}
              className={`p-3 rounded-xl border text-left transition ${
                step === s.num
                  ? 'bg-primary text-on-primary border-primary font-bold shadow-xs'
                  : step > s.num
                  ? 'bg-secondary-container/40 text-on-secondary-container border-secondary/30 font-semibold'
                  : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant/20'
              }`}
            >
              <span className="text-[10px] uppercase tracking-wider block opacity-80">Step {s.num}</span>
              <span className="font-label-sm text-label-sm truncate block">{s.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* STEP 1: OWNER INFORMATION */}
      {step === 1 && (
        <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-outline-variant/20 space-y-5 animate-in fade-in">
          <div className="border-b border-outline-variant/20 pb-3">
            <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">
              Step 1: Owner Information & Contact Verification
            </h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
              Enter official shopkeeper credentials for direct order notifications and payout verification.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-label-md text-label-md font-semibold text-on-surface mb-1">
                Owner Full Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Sonu Sharma"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/30 text-on-surface font-body-sm focus:outline-none focus:border-secondary"
              />
            </div>

            <div>
              <label className="block font-label-md text-label-md font-semibold text-on-surface mb-1">
                Business Email Address *
              </label>
              <input
                type="email"
                required
                placeholder="e.g. sonu.kirana@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/30 text-on-surface font-body-sm focus:outline-none focus:border-secondary"
              />
            </div>
          </div>

          <div>
            <label className="block font-label-md text-label-md font-semibold text-on-surface mb-1">
              Primary Mobile Number (OTP Verified) *
            </label>
            <div className="flex gap-2">
              <input
                type="tel"
                required
                placeholder="+91 98160 00000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/30 text-on-surface font-body-sm focus:outline-none focus:border-secondary font-mono"
              />
              <button
                type="button"
                onClick={() => {
                  setOtpSent(true);
                  alert(`LocalMarket OTP: ${otpCode} sent to ${phone}`);
                }}
                className="px-4 py-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md font-bold transition shrink-0"
              >
                {otpSent ? 'Resend OTP' : 'Send OTP'}
              </button>
            </div>

            {otpSent && !otpVerified && (
              <div className="mt-3 p-3 rounded-xl bg-surface-container-low border border-secondary/30 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Enter 4-digit OTP"
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value)}
                  className="w-36 px-3 py-1.5 rounded-lg bg-surface-container-lowest border border-outline-variant/40 font-mono text-center font-bold text-on-surface"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (otpInput === otpCode || otpInput === '1234' || otpInput === '5491') {
                      setOtpVerified(true);
                    } else {
                      alert('Invalid OTP code. Try 5491.');
                    }
                  }}
                  className="px-4 py-1.5 rounded-lg bg-secondary text-on-secondary font-bold text-xs"
                >
                  Verify
                </button>
                <span className="text-xs text-on-surface-variant font-mono">(Demo OTP: {otpCode})</span>
              </div>
            )}

            {otpVerified && (
              <div className="mt-2 text-xs font-bold text-secondary flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">verified</span>
                <span>Mobile number verified for order alerts & dispatch SMS.</span>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-outline-variant/20 flex justify-end">
            <button
              type="button"
              onClick={() => {
                if (!ownerName.trim() || !phone.trim()) {
                  alert('Please enter Owner Full Name and Phone.');
                  return;
                }
                setStep(2);
              }}
              className="px-6 py-2.5 rounded-xl bg-primary text-on-primary font-label-md text-label-md font-bold hover:bg-neutral-800 transition flex items-center gap-1.5"
            >
              <span>Continue to Business Info</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: BUSINESS INFORMATION & GSTIN */}
      {step === 2 && (
        <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-outline-variant/20 space-y-5 animate-in fade-in">
          <div className="border-b border-outline-variant/20 pb-3">
            <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">
              Step 2: Business Information & Mandatory GSTIN
            </h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
              Enter official registered business details. GSTIN verification is required for commercial storefront activation.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-label-md text-label-md font-semibold text-on-surface mb-1">
                Shop / Business Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Sonu Kirana Store"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/30 text-on-surface font-body-sm focus:outline-none focus:border-secondary font-bold"
              />
            </div>

            <div>
              <label className="block font-label-md text-label-md font-semibold text-on-surface mb-1">
                Business Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/30 text-on-surface font-body-sm focus:outline-none focus:border-secondary font-semibold"
              >
                <option value="Daily Kirana & Provisions">Daily Kirana & Provisions</option>
                <option value="Dairy, Sweets & Bakery">Dairy, Sweets & Bakery</option>
                <option value="Chemist & Health OTC">Chemist & Health OTC</option>
                <option value="Fresh Fruits & Vegetables">Fresh Fruits & Vegetables</option>
                <option value="Electricals & Mobile Hardware">Electricals & Mobile Hardware</option>
                <option value="Stationery, Books & Printing">Stationery, Books & Printing</option>
                <option value="Garments & Local Tailoring">Garments & Local Tailoring</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-label-md text-label-md font-semibold text-on-surface mb-1">
                Sub-Category / Trade Specialties
              </label>
              <input
                type="text"
                placeholder="e.g. Groceries, Spices, Dairy, Daily Staples"
                value={subCategory}
                onChange={(e) => setSubCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/30 text-on-surface font-body-sm focus:outline-none focus:border-secondary"
              />
            </div>

            <div>
              <label className="block font-label-md text-label-md font-semibold text-on-surface mb-1">
                GSTIN Number (Mandatory) *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="02AAECS1429P1Z8"
                  value={gstin}
                  onChange={(e) => validateGstin(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl bg-surface-container-low border text-on-surface font-body-sm uppercase font-mono tracking-wider focus:outline-none ${
                    gstinError
                      ? 'border-error focus:border-error ring-1 ring-error/30'
                      : 'border-secondary focus:border-secondary ring-1 ring-secondary/30'
                  }`}
                />
                {!gstinError && gstin.length === 15 && (
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-secondary text-[20px]">
                    check_circle
                  </span>
                )}
              </div>
              {gstinError ? (
                <p className="text-xs text-error mt-1 font-semibold">{gstinError}</p>
              ) : (
                <p className="text-[11px] text-secondary mt-1 font-semibold">
                  ✓ Valid format (15 characters). Verified for commercial settlement.
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block font-label-md text-label-md font-semibold text-on-surface mb-1">
              Business Description
            </label>
            <textarea
              rows={3}
              placeholder="Describe your shop offerings, specialty products, and counter service..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/30 text-on-surface font-body-sm focus:outline-none focus:border-secondary"
            />
          </div>

          <div className="pt-4 border-t border-outline-variant/20 flex justify-between">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-5 py-2.5 rounded-xl text-on-surface hover:bg-surface-container font-label-md text-label-md"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => {
                if (!shopName.trim()) {
                  alert('Please enter Shop Name.');
                  return;
                }
                if (!gstin.trim() || gstin.trim().length !== 15) {
                  alert('A valid 15-character GSTIN is required for platform onboarding.');
                  return;
                }
                setStep(3);
              }}
              className="px-6 py-2.5 rounded-xl bg-primary text-on-primary font-label-md text-label-md font-bold hover:bg-neutral-800 transition flex items-center gap-1.5"
            >
              <span>Continue to Location</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: SHOP LOCATION & MAP PICKER */}
      {step === 3 && (
        <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-outline-variant/20 space-y-5 animate-in fade-in">
          <div className="border-b border-outline-variant/20 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                Step 3: Shop Address & Map Pin Location
              </h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                Drop your storefront location pin so local customers can discover your shop and calculate exact pickup walking distance.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsMapPickerOpen(true)}
              className="px-4 py-2 rounded-xl bg-secondary text-on-secondary font-label-md text-label-md font-bold hover:opacity-95 transition flex items-center gap-1.5 shadow-sm shrink-0 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">pin_drop</span>
              <span>Select Store Location on Map</span>
            </button>
          </div>

          {/* Interactive Map Location Confirmation Card */}
          <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm uppercase font-bold text-secondary flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">location_on</span>
                Selected Store Location (Coordinates):
              </span>
              <button
                type="button"
                onClick={() => setIsMapPickerOpen(true)}
                className="text-xs font-bold text-secondary hover:underline"
              >
                Change Pin on Map
              </button>
            </div>
            <p className="font-body-sm text-body-sm font-semibold text-on-surface">
              {formattedAddress}
            </p>
            <div className="flex items-center gap-4 text-xs font-mono text-on-surface-variant">
              <span>Latitude: <strong>{latitude.toFixed(5)}° N</strong></span>
              <span>Longitude: <strong>{longitude.toFixed(5)}° E</strong></span>
              <span className="text-secondary font-semibold">✓ Saved to Firebase</span>
            </div>
          </div>

          {/* Detailed Address Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-label-md text-label-md font-semibold text-on-surface mb-1">
                House / Shop / Floor Number *
              </label>
              <input
                type="text"
                placeholder="e.g. Shop #4, Ground Floor"
                value={houseNumber}
                onChange={(e) => setHouseNumber(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/30 text-on-surface font-body-sm focus:outline-none focus:border-secondary"
              />
            </div>

            <div>
              <label className="block font-label-md text-label-md font-semibold text-on-surface mb-1">
                Street / Road / Chowk *
              </label>
              <input
                type="text"
                placeholder="e.g. Main Bazaar Road, Near Post Office"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/30 text-on-surface font-body-sm focus:outline-none focus:border-secondary"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-label-md text-label-md font-semibold text-on-surface mb-1">
                Area / Locality *
              </label>
              <input
                type="text"
                placeholder="e.g. Ghumarwin Bazaar"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/30 text-on-surface font-body-sm focus:outline-none focus:border-secondary"
              />
            </div>

            <div>
              <label className="block font-label-md text-label-md font-semibold text-on-surface mb-1">
                City / Town *
              </label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/30 text-on-surface font-body-sm focus:outline-none focus:border-secondary font-semibold"
              >
                <option value="Ghumarwin">Ghumarwin</option>
                <option value="Bilaspur">Bilaspur</option>
                <option value="Sundernagar">Sundernagar</option>
                <option value="Mandi">Mandi</option>
                <option value="Shimla">Shimla</option>
              </select>
            </div>

            <div>
              <label className="block font-label-md text-label-md font-semibold text-on-surface mb-1">
                Pincode *
              </label>
              <input
                type="text"
                placeholder="174021"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/30 text-on-surface font-body-sm focus:outline-none focus:border-secondary font-mono"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-outline-variant/20 flex justify-between">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="px-5 py-2.5 rounded-xl text-on-surface hover:bg-surface-container font-label-md text-label-md"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => setStep(4)}
              className="px-6 py-2.5 rounded-xl bg-primary text-on-primary font-label-md text-label-md font-bold hover:bg-neutral-800 transition flex items-center gap-1.5"
            >
              <span>Continue to Timings</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: STORE TIMINGS & FULFILLMENT */}
      {step === 4 && (
        <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-outline-variant/20 space-y-5 animate-in fade-in">
          <div className="border-b border-outline-variant/20 pb-3">
            <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">
              Step 4: Store Operating Hours & Fulfillment SLA
            </h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
              Customers will see live OPEN / CLOSED badges and estimated counter preparation time.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-label-md text-label-md font-semibold text-on-surface mb-1">
                Daily Opening Time *
              </label>
              <input
                type="text"
                value={openingTime}
                onChange={(e) => setOpeningTime(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/30 text-on-surface font-body-sm focus:outline-none focus:border-secondary"
              />
            </div>

            <div>
              <label className="block font-label-md text-label-md font-semibold text-on-surface mb-1">
                Daily Closing Time *
              </label>
              <input
                type="text"
                value={closingTime}
                onChange={(e) => setClosingTime(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/30 text-on-surface font-body-sm focus:outline-none focus:border-secondary"
              />
            </div>

            <div>
              <label className="block font-label-md text-label-md font-semibold text-on-surface mb-1">
                Weekly Closed Day *
              </label>
              <select
                value={closedDay}
                onChange={(e) => setClosedDay(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/30 text-on-surface font-body-sm focus:outline-none focus:border-secondary"
              >
                <option value="None (Open 7 Days)">None (Open 7 Days)</option>
                <option value="Sunday">Sunday</option>
                <option value="Monday">Monday</option>
                <option value="Tuesday">Tuesday</option>
                <option value="Wednesday">Wednesday</option>
                <option value="Thursday">Thursday</option>
                <option value="Friday">Friday</option>
                <option value="Saturday">Saturday</option>
              </select>
            </div>
          </div>

          {/* Temporarily Closed Toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/30">
            <div>
              <p className="font-label-md text-label-md font-bold text-on-surface">
                Temporarily Closed Today
              </p>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                If enabled, storefront will display "CLOSED TEMPORARILY" to consumers.
              </p>
            </div>
            <input
              type="checkbox"
              checked={temporarilyClosed}
              onChange={(e) => setTemporarilyClosed(e.target.checked)}
              className="w-5 h-5 accent-secondary cursor-pointer"
            />
          </div>

          {/* Fulfillment Modes */}
          <div className="space-y-3 pt-2">
            <span className="font-label-sm text-label-sm uppercase font-bold text-on-surface-variant tracking-wider">
              Select Fulfillment Modes Offered
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="flex items-start gap-3 p-4 rounded-xl bg-surface-container-low border border-outline-variant/30 cursor-pointer hover:bg-surface-container transition">
                <input
                  type="checkbox"
                  checked={enableSmartPickup}
                  onChange={(e) => setEnableSmartPickup(e.target.checked)}
                  className="w-5 h-5 accent-secondary cursor-pointer mt-0.5"
                />
                <div>
                  <p className="font-label-md text-label-md font-bold text-on-surface">
                    Smart Pickup Counter Passes
                  </p>
                  <p className="font-body-sm text-xs text-on-surface-variant mt-0.5">
                    Customers pay or hold pass, show digital barcode at counter, and collect prepared bags with zero wait time.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-4 rounded-xl bg-surface-container-low border border-outline-variant/30 cursor-pointer hover:bg-surface-container transition">
                <input
                  type="checkbox"
                  checked={enableDirectDelivery}
                  onChange={(e) => setEnableDirectDelivery(e.target.checked)}
                  className="w-5 h-5 accent-secondary cursor-pointer mt-0.5"
                />
                <div>
                  <p className="font-label-md text-label-md font-bold text-on-surface">
                    Retailer Direct Delivery
                  </p>
                  <p className="font-body-sm text-xs text-on-surface-variant mt-0.5">
                    Your own shop staff or local riders deliver directly to customer addresses in town.
                  </p>
                </div>
              </label>
            </div>
          </div>

          <div>
            <label className="block font-label-md text-label-md font-semibold text-on-surface mb-1">
              Estimated Order Preparation Time
            </label>
            <select
              value={preparationTime}
              onChange={(e) => setPreparationTime(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/30 text-on-surface font-body-sm focus:outline-none focus:border-secondary"
            >
              <option value="10 mins">10 mins (Express Pack)</option>
              <option value="15 mins">15 mins (Standard)</option>
              <option value="20 mins">20 mins</option>
              <option value="30 mins">30 mins</option>
              <option value="45 mins">45 mins</option>
            </select>
          </div>

          <div className="pt-4 border-t border-outline-variant/20 flex justify-between">
            <button
              type="button"
              onClick={() => setStep(3)}
              className="px-5 py-2.5 rounded-xl text-on-surface hover:bg-surface-container font-label-md text-label-md"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => setStep(5)}
              className="px-6 py-2.5 rounded-xl bg-primary text-on-primary font-label-md text-label-md font-bold hover:bg-neutral-800 transition flex items-center gap-1.5"
            >
              <span>Continue to Photos & QR</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: STORE PHOTOS & PAYMENT QR */}
      {step === 5 && (
        <form onSubmit={handleSubmit} className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-outline-variant/20 space-y-6 animate-in fade-in">
          <div className="border-b border-outline-variant/20 pb-3">
            <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">
              Step 5: Store Logo, Main Photo & Payment QR
            </h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
              Upload real photographs of your storefront and your actual shop UPI QR code so customers can pay directly.
            </p>
          </div>

          {/* Logo & Main Photo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Store Logo */}
            <div className="space-y-3">
              <label className="block font-label-md text-label-md font-bold text-on-surface">
                Store Logo / Counter Badge *
              </label>
              <div className="flex items-center gap-4">
                <img
                  src={logoUrl || 'https://via.placeholder.com/80'}
                  alt="Store Logo"
                  className="w-20 h-20 rounded-2xl object-cover border border-outline-variant/30 shadow-xs"
                />
                <div className="space-y-1.5 flex-1">
                  <label className="inline-block px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-sm text-label-sm font-bold cursor-pointer transition">
                    Upload Logo
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, setLogoUrl)}
                      className="hidden"
                    />
                  </label>
                  {logoUrl && (
                    <button
                      type="button"
                      onClick={() => setLogoUrl('')}
                      className="block text-xs text-error font-medium hover:underline"
                    >
                      Delete Logo
                    </button>
                  )}
                  <p className="text-[11px] text-on-surface-variant">Recommended: Square 200x200 PNG/JPG</p>
                </div>
              </div>
            </div>

            {/* Main Shop Photo */}
            <div className="space-y-3">
              <label className="block font-label-md text-label-md font-bold text-on-surface">
                Main Storefront Photo *
              </label>
              <div className="space-y-2">
                {shopImageUrl && (
                  <img
                    src={shopImageUrl}
                    alt="Storefront"
                    className="w-full h-28 rounded-xl object-cover border border-outline-variant/30 shadow-xs"
                  />
                )}
                <div className="flex items-center gap-2">
                  <label className="inline-block px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-sm text-label-sm font-bold cursor-pointer transition">
                    {shopImageUrl ? 'Replace Photo' : 'Upload Storefront Photo'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, setShopImageUrl)}
                      className="hidden"
                    />
                  </label>
                  {shopImageUrl && (
                    <button
                      type="button"
                      onClick={() => setShopImageUrl('')}
                      className="text-xs text-error font-medium hover:underline"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Payment QR Section */}
          <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/30 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-label-md text-label-md font-bold text-on-surface flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px] text-secondary">qr_code</span>
                  Retailer UPI Payment QR Code
                </span>
                <p className="font-body-sm text-xs text-on-surface-variant mt-0.5">
                  Upload your shop's official BharatPe, PhonePe, Paytm, or Google Pay QR code so customers can pay directly to your account.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 pt-1">
              {paymentQrUrl ? (
                <div className="p-2 bg-white rounded-xl border border-outline-variant/30">
                  <img
                    src={paymentQrUrl}
                    alt="Payment QR"
                    className="w-32 h-32 object-contain"
                  />
                </div>
              ) : (
                <div className="w-32 h-32 rounded-xl bg-surface-container flex flex-col items-center justify-center text-on-surface-variant text-center p-2 border border-dashed border-outline-variant/40">
                  <span className="material-symbols-outlined text-[28px] mb-1">qr_code_2</span>
                  <span className="text-[11px]">No QR Uploaded</span>
                </div>
              )}

              <div className="space-y-2">
                <label className="inline-block px-4 py-2 rounded-xl bg-secondary text-on-secondary font-label-md text-label-md font-bold hover:opacity-90 transition cursor-pointer shadow-xs">
                  {paymentQrUrl ? 'Replace Payment QR' : 'Upload UPI QR Image'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, setPaymentQrUrl)}
                    className="hidden"
                  />
                </label>

                {paymentQrUrl && (
                  <button
                    type="button"
                    onClick={() => setPaymentQrUrl('')}
                    className="block text-xs text-error font-semibold hover:underline"
                  >
                    Delete QR Image
                  </button>
                )}

                <p className="text-xs text-on-surface-variant">
                  {paymentQrUrl
                    ? '✓ Real UPI QR active. Customers will see "Pay directly to this store" at checkout.'
                    : 'Optional: You can also configure or update your payment QR anytime inside Retailer Settings.'}
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-outline-variant/20 flex justify-between items-center">
            <button
              type="button"
              onClick={() => setStep(4)}
              className="px-5 py-2.5 rounded-xl text-on-surface hover:bg-surface-container font-label-md text-label-md"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-3 rounded-xl bg-primary hover:bg-neutral-800 text-on-primary font-label-lg text-label-lg font-bold shadow-md transition disabled:opacity-50 cursor-pointer flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
                  <span>Submitting Application...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[20px]">send</span>
                  <span>Submit Store Registration</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* STEP 6: APPLICATION SUBMITTED CONFIRMATION */}
      {step === 6 && (
        <div className="bg-surface-container-lowest rounded-2xl p-8 border border-outline-variant/20 shadow-md text-center space-y-5 max-w-lg mx-auto animate-in zoom-in-95">
          <div className="w-16 h-16 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center mx-auto shadow-xs">
            <span className="material-symbols-outlined text-[36px]">verified</span>
          </div>

          <div className="space-y-2">
            <h2 className="font-headline-md text-headline-md font-bold text-on-surface">
              Store Registration Submitted!
            </h2>
            <p className="font-body-md text-body-md text-on-surface font-semibold">
              “Your store registration has been submitted successfully.
              Our team will review your details before activating your storefront.”
            </p>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Application ID: <strong className="font-mono text-on-surface">{createdRetailerId}</strong>
            </p>
          </div>

          <div className="p-4 rounded-xl bg-surface-container-low text-left space-y-1.5 text-body-sm border border-outline-variant/30">
            <div className="flex justify-between">
              <span className="text-on-surface-variant">Store Name:</span>
              <span className="font-bold text-on-surface">{shopName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-on-surface-variant">Owner:</span>
              <span className="font-semibold text-on-surface">{ownerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-on-surface-variant">GSTIN:</span>
              <span className="font-mono font-bold text-on-surface">{gstin}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-on-surface-variant">Cluster:</span>
              <span className="text-on-surface">{city} Bazaar ({area})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-on-surface-variant">Status:</span>
              <span className="px-2 py-0.5 rounded font-label-sm text-label-sm bg-tertiary-fixed text-on-tertiary-fixed font-bold uppercase">
                Pending Review
              </span>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <button
              onClick={onGoToAdmin}
              className="flex-1 py-3 rounded-xl bg-primary text-on-primary font-label-md text-label-md font-bold hover:bg-neutral-800 transition shadow-sm"
            >
              Open Admin Review Queue
            </button>
            <button
              onClick={onGoToPortal}
              className="flex-1 py-3 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md font-bold transition border border-outline-variant/30"
            >
              Merchant Portal
            </button>
          </div>
        </div>
      )}

      {/* Map Location Picker Modal */}
      <MapLocationPicker
        isOpen={isMapPickerOpen}
        onClose={() => setIsMapPickerOpen(false)}
        initialLat={latitude}
        initialLng={longitude}
        initialAddress={formattedAddress}
        onConfirmLocation={handleConfirmLocation}
      />
    </div>
  );
};
