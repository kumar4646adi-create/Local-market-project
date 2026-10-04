import React, { useState } from 'react';
import { Retailer } from '../types';

interface OnboardMerchantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (retailer: Retailer) => void;
}

export const OnboardMerchantModal: React.FC<OnboardMerchantModalProps> = ({
  isOpen,
  onClose,
  onSave
}) => {
  const [name, setName] = useState('');
  const [proprietor, setProprietor] = useState('');
  const [phone, setPhone] = useState('+91 ');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [town, setTown] = useState('Ghumarwin');
  const [category, setCategory] = useState('Dairy, Sweets & Bakery');
  const [fssaiNumber, setFssaiNumber] = useState('');
  const [sla, setSla] = useState('Prep SLA: ≤ 15 mins');
  const [pickupEnabled, setPickupEnabled] = useState(true);
  const [deliveryEnabled, setDeliveryEnabled] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !proprietor.trim()) return;

    const idNumber = Math.floor(10000 + Math.random() * 90000);
    const newRetailer: Retailer = {
      id: `mer-${idNumber}`,
      dossierNumber: `MER-${idNumber}`,
      ownerName: proprietor.trim(),
      shopName: name.trim(),
      name: name.trim(),
      proprietor: proprietor.trim(),
      phone: phone.trim() || '+91 98160 00000',
      email: email.trim() || `${name.toLowerCase().replace(/[^a-z0-9]/g, '')}@gmail.com`,
      address: address.trim() || `${town} Main Chowk, Himachal Pradesh`,
      city: town,
      area: `${town} Bazaar`,
      pincode: town === 'Bilaspur' ? '174001' : town === 'Sundernagar' ? '175002' : '174021',
      latitude: town === 'Bilaspur' ? 31.326 : town === 'Sundernagar' ? 31.533 : 31.4429,
      longitude: town === 'Bilaspur' ? 76.757 : town === 'Sundernagar' ? 76.892 : 76.7118,
      openingTime: '08:00 AM',
      closingTime: '09:00 PM',
      closedDay: 'Tuesday',
      logoUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA4MNhkPeUaC0k3r4c02_O-FWoprhHgfURROdKYFrVAgXekV1tjQGJiJ_EZCd6Lih-gpkvcjBxzCIPOvYPilSIsGKAqo-s8TLZAOOkhfIEzLwNgSk5fG5t3cwMT4NFc5z0OA5MVazhjLTg4Q2lkMPG2jHhkyUbxYDr62pQN7betK5AZMYiUgxg6o7Q2VuDwBg9wIpmTQ_Un6l9n6OUwaOFbqw0cI3hP-zxmJHp9MLapV4RNUM4VWtG4RQ',
      description: `${name.trim()} - Local store in ${town}`,
      fulfillmentOptions: pickupEnabled && deliveryEnabled ? ['Smart Pickup', 'Retailer Direct Delivery'] : pickupEnabled ? ['Smart Pickup'] : ['Retailer Direct Delivery'],
      preparationTime: '15 mins',
      town,
      cluster: `${town} Cluster #${Math.floor(1 + Math.random() * 5)}`,
      zoneTag: 'Express Hyperlocal Node',
      category,
      appliedTime: 'Just now',
      badgeTag: 'Manual Admin Intake',
      badgeType: 'warning',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA4MNhkPeUaC0k3r4c02_O-FWoprhHgfURROdKYFrVAgXekV1tjQGJiJ_EZCd6Lih-gpkvcjBxzCIPOvYPilSIsGKAqo-s8TLZAOOkhfIEzLwNgSk5fG5t3cwMT4NFc5z0OA5MVazhjLTg4Q2lkMPG2jHhkyUbxYDr62pQN7betK5AZMYiUgxg6o7Q2VuDwBg9wIpmTQ_Un6l9n6OUwaOFbqw0cI3hP-zxmJHp9MLapV4RNUM4VWtG4RQ',
      headerImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDjJe04oUpoBGMopVMMQ6Uy9xUZ8eaz2uRk00ul9sY-oD_a4-KRTjYTSMLqVsKMC0Ij4RQY1SHI2NUPCdkEwKtOof1atkUxKV413r-zrV4JJn2mo3cq1w4uIVXQQXf20CqEvAV7pdeI7tKxsQ7xi57PeyceUfrIPE2fTh1CTt8NrrhGPgVoJfAG0bHIIiPDB_9Qp7a76BlaWLHusguWBk_qD4kAaDUqWrwNagYEd41hw0Jv2DhbsUL6FA',
      docsPreCleared: '2/4 Docs Pre-cleared',
      status: 'pending_review',
      createdAt: new Date().toISOString(),
      sla,
      pickupEnabled,
      deliveryEnabled,
      coordinates: {
        lat: town === 'Bilaspur' ? 31.326 : town === 'Sundernagar' ? 31.533 : 31.4429,
        lng: town === 'Bilaspur' ? 76.757 : town === 'Sundernagar' ? 76.892 : 76.7118,
        accuracyRadius: 6.5
      },
      fieldAgent: 'Vipin Kumar (Field Exec #HP-09)',
      banking: {
        bankName: 'HDFC Bank Himachal',
        accountMasked: '••••••••4812',
        ifsc: 'HDFC0001928',
        upiId: `${proprietor.toLowerCase().replace(/[^a-z0-9]/g, '')}@okhdfcbank`,
        beneficiaryName: name.toUpperCase(),
        matchScore: 95,
        pennyDropOk: true
      },
      compliance: {
        udyam: {
          number: `UDYAM-HP-0${Math.floor(1 + Math.random() * 4)}-00${idNumber}`,
          category: `Micro Enterprise (${category})`,
          verified: true
        },
        fssai: {
          licenseNumber: fssaiNumber || `2092400${idNumber}`,
          validThrough: 'Dec 2027',
          daysRemaining: 1095,
          issuer: 'Himachal Pradesh State Food Safety Authority',
          status: 'REQUIRES OFFICER APPROVAL',
          documentUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC35MQyNWOhyt6UR_lX8RPYhWK8P4p-PBRYj4elQMmyRAl9filpvbHNbg174Ge3p8q9dNAp6TBplXrDTyiVOCrKfD4xmPHuTQT6GL_SFtmer7CfKXPXC-QIQiQxARSLLUOoXLQwmQh8SyLm6JrRFkBf0LyRGFmuDQ3MC-Ic_MG_OV6sRWuUJPNgy52j56lf0HnGe_US6k0f6-c9cyCBVS3Z_PaUJ8FJuXzBLSNlPdfeK1Ng_p-rrS0J0w',
          addressMatchScore: 100,
          tradeNameMatch: true,
          watermarkPassed: true,
          signatureValid: true
        }
      },
      catalog: [
        {
          id: 'sku-new-1',
          name: 'Hero Store SKU Item #1',
          category: category.split(',')[0],
          price: 250,
          unit: 'unit',
          stockStatus: 'IN STOCK',
          shelfLife: 'Fresh Daily',
          description: 'Verified initial catalog item added during merchant onboarding.'
        }
      ]
    };

    onSave(newRetailer);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-2xl bg-surface-container-lowest rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] z-10 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-outline-variant/30 flex items-center justify-between bg-surface-container-low">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[24px] text-primary">add_business</span>
            <div>
              <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                Manually Onboard Local Merchant
              </h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Direct intake for Himachal Pradesh North Cluster dukaans
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-label-md text-label-md text-on-surface font-semibold mb-1">
                Store / Dukaan Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Hill Valley Organics"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-outline-variant/40 font-body-md text-body-md text-on-surface focus:outline-none focus:border-secondary"
              />
            </div>

            <div>
              <label className="block font-label-md text-label-md text-on-surface font-semibold mb-1">
                Proprietor Full Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Amit Gupta"
                value={proprietor}
                onChange={(e) => setProprietor(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-outline-variant/40 font-body-md text-body-md text-on-surface focus:outline-none focus:border-secondary"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-label-md text-label-md text-on-surface font-semibold mb-1">
                Primary Phone Number *
              </label>
              <input
                type="text"
                required
                placeholder="+91 98160 12345"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-outline-variant/40 font-body-md text-body-md text-on-surface focus:outline-none focus:border-secondary"
              />
            </div>

            <div>
              <label className="block font-label-md text-label-md text-on-surface font-semibold mb-1">
                Business Email Address
              </label>
              <input
                type="email"
                placeholder="storename@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-outline-variant/40 font-body-md text-body-md text-on-surface focus:outline-none focus:border-secondary"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-label-md text-label-md text-on-surface font-semibold mb-1">
                Town / Territory *
              </label>
              <select
                value={town}
                onChange={(e) => setTown(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-outline-variant/40 font-body-md text-body-md text-on-surface focus:outline-none focus:border-secondary"
              >
                <option value="Ghumarwin">Ghumarwin (Core Cluster #01)</option>
                <option value="Bilaspur">Bilaspur (Central Bazaar)</option>
                <option value="Sundernagar">Sundernagar (Highway Hub)</option>
              </select>
            </div>

            <div>
              <label className="block font-label-md text-label-md text-on-surface font-semibold mb-1">
                Business Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-outline-variant/40 font-body-md text-body-md text-on-surface focus:outline-none focus:border-secondary"
              >
                <option value="Dairy, Sweets & Bakery">Dairy, Sweets & Bakery</option>
                <option value="Daily Kirana & Provisions">Daily Kirana & Provisions</option>
                <option value="Chemist & Health">Chemist & Health</option>
                <option value="Electronics & Mobile">Electronics & Mobile</option>
                <option value="Apparel & Boutique">Apparel & Boutique</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-label-md text-label-md text-on-surface font-semibold mb-1">
              Store Physical Address
            </label>
            <input
              type="text"
              placeholder="e.g. Shop #12, Near Bus Stand, Main Market"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-outline-variant/40 font-body-md text-body-md text-on-surface focus:outline-none focus:border-secondary"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-label-md text-label-md text-on-surface font-semibold mb-1">
                FSSAI / Drug License / GSTIN
              </label>
              <input
                type="text"
                placeholder="License Registration #"
                value={fssaiNumber}
                onChange={(e) => setFssaiNumber(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-outline-variant/40 font-body-md text-body-md text-on-surface focus:outline-none focus:border-secondary"
              />
            </div>

            <div>
              <label className="block font-label-md text-label-md text-on-surface font-semibold mb-1">
                Prep SLA Guarantee
              </label>
              <select
                value={sla}
                onChange={(e) => setSla(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-outline-variant/40 font-body-md text-body-md text-on-surface focus:outline-none focus:border-secondary"
              >
                <option value="Prep SLA: ≤ 10 mins">Prep SLA: ≤ 10 mins</option>
                <option value="Prep SLA: ≤ 15 mins">Prep SLA: ≤ 15 mins</option>
                <option value="Prep SLA: ≤ 30 mins">Prep SLA: ≤ 30 mins</option>
                <option value="Next-day pickup">Next-day pickup</option>
              </select>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-surface-container-low flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-secondary">shopping_bag</span>
              <div>
                <p className="font-label-md text-label-md text-on-surface font-bold">
                  Enable Smart Pickup Counter
                </p>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Customer arrives with digital pickup pass for 2-min counter scan
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={pickupEnabled}
              onChange={(e) => setPickupEnabled(e.target.checked)}
              className="w-5 h-5 accent-secondary cursor-pointer"
            />
          </div>

          {/* Buttons */}
          <div className="pt-4 border-t border-outline-variant/30 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-on-surface font-label-md text-label-md hover:bg-surface-container transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-primary hover:bg-neutral-800 text-on-primary font-label-md text-label-md font-bold shadow-sm transition"
            >
              Onboard & Add to Verification Queue
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
