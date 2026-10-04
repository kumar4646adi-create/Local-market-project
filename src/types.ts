export type NavTab = 
  | 'overview'
  | 'retailers'
  | 'customers'
  | 'orders'
  | 'area'
  | 'catalog'
  | 'appointments'
  | 'disputes'
  | 'settings';

export type Territory = 'all' | 'ghumarwin' | 'bilaspur' | 'sundernagar';

export type RetailerStatus = 'pending_review' | 'active' | 'action_required' | 'rejected' | 'suspended';

export type AppRole = 'admin' | 'retailer' | 'customer';

export interface SKUItem {
  id: string;
  name: string;
  category: string;
  price: number;
  unit: string;
  stockStatus: 'IN STOCK' | 'LOW STOCK' | 'OUT OF STOCK';
  shelfLife: string;
  description: string;
}

export interface Retailer {
  id: string;
  ownerName: string;
  shopName: string;
  category: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  area: string;
  pincode: string;
  latitude: number;
  longitude: number;
  openingTime: string;
  closingTime: string;
  closedDay: string;
  logoUrl: string;
  description: string;
  fulfillmentOptions: ('Smart Pickup' | 'Retailer Direct Delivery')[];
  preparationTime: string;
  status: RetailerStatus;
  createdAt: string;
  approvedAt?: string;
  approvedBy?: string;
  rejectionReason?: string;
  resubmissionNotes?: string;
  // Optional convenience properties
  name?: string;
  proprietor?: string;
  town?: string;
  cluster?: string;
  zoneTag?: string;
  appliedTime?: string;
  badgeTag?: string;
  badgeType?: 'secondary' | 'warning' | 'neutral' | 'error';
  image?: string;
  headerImage?: string;
  docsPreCleared?: string;
  sla?: string;
  pickupEnabled?: boolean;
  deliveryEnabled?: boolean;
  coordinates?: {
    lat: number;
    lng: number;
    accuracyRadius: number;
  };
  fieldAgent?: string;
  banking?: {
    bankName: string;
    accountMasked: string;
    ifsc: string;
    upiId: string;
    beneficiaryName: string;
    matchScore: number;
    pennyDropOk: boolean;
  };
  compliance?: {
    udyam: {
      number: string;
      category: string;
      verified: boolean;
      certUrl?: string;
    };
    fssai: {
      licenseNumber: string;
      validThrough: string;
      daysRemaining: number;
      issuer: string;
      status: 'REQUIRES OFFICER APPROVAL' | 'VERIFIED' | 'FLAGGED';
      documentUrl: string;
      addressMatchScore: number;
      tradeNameMatch: boolean;
      watermarkPassed: boolean;
      signatureValid: boolean;
    };
  };
  catalog?: SKUItem[];
  dossierNumber?: string;
  fssaiNumber?: string;
  udyamNumber?: string;
  bankName?: string;
  accountMasked?: string;
  ifsc?: string;
  upiId?: string;
}

export interface Product {
  id: string;
  retailerId: string;
  name: string;
  category: string;
  imageUrl: string;
  price: number;
  stock: number;
  available: boolean;
  description: string;
  shelfLife?: string;
  unit?: string;
  createdAt: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone?: string;
  retailerId: string;
  retailerName: string;
  items: OrderItem[];
  totalAmount: number;
  fulfillmentType: 'Smart Pickup' | 'Store Delivery';
  customerETA: string;
  status: 'pending' | 'preparing' | 'ready' | 'arrived' | 'completed' | 'cancelled';
  orderNumber: string;
  qrCodeToken?: string;
  createdAt: string;
  updatedAt: string;
  deliveryAddress?: string;
}

export interface LiveOrder {
  id: string;
  customerName: string;
  storeName: string;
  area: string;
  type: 'Smart Pickup' | 'Store Delivery';
  etaProgress: string;
  etaStatus: 'pending' | 'verified' | 'in_progress' | 'ready';
  amount: number;
  timestamp: string;
  itemsCount: number;
}

export interface DisputeItem {
  id: string;
  orderId: string;
  town: string;
  issue: string;
  details: string;
  amount: number;
  status: 'open' | 'investigating' | 'resolved';
  severity: 'high' | 'medium';
}

export interface ClusterStats {
  id: string;
  name: string;
  tag: string;
  tagColor: string;
  activeStores: number;
  gmvToday: number;
  onTimePrepRate: number;
  capacityIndex: number;
  target?: string;
}
