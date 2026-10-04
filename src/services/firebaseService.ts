import {
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Retailer, Product, Order, RetailerStatus, ChatMessage, StoreReview } from '../types';

// ==================== RETAILERS ====================

export function subscribeAllRetailers(
  onData: (retailers: Retailer[]) => void,
  onError?: (err: any) => void
) {
  const colRef = collection(db, 'retailers');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const retailers: Retailer[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
        } as Retailer;
      });
      onData(retailers);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'retailers');
      onError?.(error);
    }
  );
}

export function subscribeActiveRetailers(
  onData: (retailers: Retailer[]) => void,
  onError?: (err: any) => void
) {
  const colRef = collection(db, 'retailers');
  const q = query(colRef, where('status', '==', 'active'));
  return onSnapshot(
    q,
    (snapshot) => {
      const retailers: Retailer[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
        } as Retailer;
      });
      onData(retailers);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'retailers');
      onError?.(error);
    }
  );
}

export async function createRetailerApplication(data: Omit<Retailer, 'id'>): Promise<string> {
  const colRef = collection(db, 'retailers');
  try {
    const docRef = await addDoc(colRef, {
      ...data,
      status: 'pending_review',
      createdAt: new Date().toISOString(),
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'retailers');
    throw error;
  }
}

export async function updateRetailerStatus(
  retailerId: string,
  status: RetailerStatus,
  extra: {
    approvedBy?: string;
    rejectionReason?: string;
    resubmissionNotes?: string;
  } = {}
) {
  const docRef = doc(db, 'retailers', retailerId);
  try {
    const updatePayload: Record<string, any> = {
      status,
    };
    if (status === 'active') {
      updatePayload.approvedAt = new Date().toISOString();
      if (extra.approvedBy) updatePayload.approvedBy = extra.approvedBy;
    }
    if (status === 'rejected' && extra.rejectionReason) {
      updatePayload.rejectionReason = extra.rejectionReason;
    }
    if (status === 'action_required' && extra.resubmissionNotes) {
      updatePayload.resubmissionNotes = extra.resubmissionNotes;
    }
    if (status === 'pending_review') {
      updatePayload.resubmittedAt = new Date().toISOString();
    }
    await updateDoc(docRef, updatePayload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `retailers/${retailerId}`);
    throw error;
  }
}

export async function updateRetailerProfile(retailerId: string, updates: Partial<Retailer>) {
  const docRef = doc(db, 'retailers', retailerId);
  try {
    await updateDoc(docRef, updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `retailers/${retailerId}`);
    throw error;
  }
}

// ==================== PRODUCTS ====================

export function subscribeRetailerProducts(
  retailerId: string,
  onData: (products: Product[]) => void,
  onError?: (err: any) => void
) {
  const colRef = collection(db, 'products');
  const q = query(colRef, where('retailerId', '==', retailerId));
  return onSnapshot(
    q,
    (snapshot) => {
      const products: Product[] = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      } as Product));
      onData(products);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, `products (retailerId: ${retailerId})`);
      onError?.(error);
    }
  );
}

export async function addProduct(product: Omit<Product, 'id' | 'createdAt'>): Promise<string> {
  const colRef = collection(db, 'products');
  try {
    const docRef = await addDoc(colRef, {
      ...product,
      createdAt: new Date().toISOString(),
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'products');
    throw error;
  }
}

export async function updateProduct(productId: string, updates: Partial<Product>) {
  const docRef = doc(db, 'products', productId);
  try {
    await updateDoc(docRef, updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `products/${productId}`);
    throw error;
  }
}

export async function deleteProduct(productId: string) {
  const docRef = doc(db, 'products', productId);
  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `products/${productId}`);
    throw error;
  }
}

// ==================== ORDERS ====================

export function subscribeAllOrders(
  onData: (orders: Order[]) => void,
  onError?: (err: any) => void
) {
  const colRef = collection(db, 'orders');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const orders: Order[] = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      } as Order));
      // Sort client-side by date desc
      orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      onData(orders);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'orders');
      onError?.(error);
    }
  );
}

export function subscribeRetailerOrders(
  retailerId: string,
  onData: (orders: Order[]) => void,
  onError?: (err: any) => void
) {
  const colRef = collection(db, 'orders');
  const q = query(colRef, where('retailerId', '==', retailerId));
  return onSnapshot(
    q,
    (snapshot) => {
      const orders: Order[] = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      } as Order));
      orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      onData(orders);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, `orders (retailerId: ${retailerId})`);
      onError?.(error);
    }
  );
}

export function subscribeCustomerOrders(
  customerId: string,
  onData: (orders: Order[]) => void,
  onError?: (err: any) => void
) {
  const colRef = collection(db, 'orders');
  const q = query(colRef, where('customerId', '==', customerId));
  return onSnapshot(
    q,
    (snapshot) => {
      const orders: Order[] = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      } as Order));
      orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      onData(orders);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, `orders (customerId: ${customerId})`);
      onError?.(error);
    }
  );
}

export async function createOrder(order: Omit<Order, 'id'>): Promise<string> {
  const colRef = collection(db, 'orders');
  try {
    const docRef = await addDoc(colRef, {
      ...order,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'orders');
    throw error;
  }
}

export async function updateOrderStatus(
  orderId: string,
  status: Order['status'],
  extraUpdates: Record<string, any> = {}
) {
  const docRef = doc(db, 'orders', orderId);
  try {
    await updateDoc(docRef, {
      status,
      updatedAt: new Date().toISOString(),
      ...extraUpdates,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
    throw error;
  }
}

export async function updateOrder(orderId: string, updates: Partial<Order>) {
  const docRef = doc(db, 'orders', orderId);
  try {
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
    throw error;
  }
}

// ==================== CHAT MESSAGES ====================

export function subscribeMessages(
  retailerId: string,
  customerId: string | undefined,
  onData: (messages: ChatMessage[]) => void,
  onError?: (err: any) => void
) {
  const colRef = collection(db, 'messages');
  let q;
  if (customerId) {
    q = query(colRef, where('retailerId', '==', retailerId), where('customerId', '==', customerId));
  } else {
    q = query(colRef, where('retailerId', '==', retailerId));
  }

  return onSnapshot(
    q,
    (snapshot) => {
      const messages = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data()
      })) as ChatMessage[];
      messages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      onData(messages);
    },
    (error) => {
      onData([]);
      onError?.(error);
    }
  );
}

export async function sendMessage(msg: Omit<ChatMessage, 'id' | 'createdAt'>): Promise<string> {
  const colRef = collection(db, 'messages');
  try {
    const docRef = await addDoc(colRef, {
      ...msg,
      createdAt: new Date().toISOString()
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'messages');
    throw error;
  }
}

// ==================== STORE REVIEWS ====================

export function subscribeStoreReviews(
  retailerId: string,
  onData: (reviews: StoreReview[]) => void,
  onError?: (err: any) => void
) {
  const colRef = collection(db, 'reviews');
  const q = query(colRef, where('retailerId', '==', retailerId));
  return onSnapshot(
    q,
    (snapshot) => {
      const reviews = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data()
      })) as StoreReview[];
      reviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      onData(reviews);
    },
    (error) => {
      onData([]);
      onError?.(error);
    }
  );
}

export async function addStoreReview(review: Omit<StoreReview, 'id' | 'createdAt'>): Promise<string> {
  const colRef = collection(db, 'reviews');
  try {
    const docRef = await addDoc(colRef, {
      ...review,
      createdAt: new Date().toISOString()
    });

    // Mark order as rated
    if (review.orderId) {
      await updateOrderStatus(review.orderId, 'completed', { rated: true });
    }

    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'reviews');
    throw error;
  }
}

// ==================== DISPUTES & APPOINTMENTS ====================

export function subscribeDisputes(
  onData: (disputes: any[]) => void,
  onError?: (err: any) => void
) {
  const colRef = collection(db, 'disputes');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const disputes = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
      onData(disputes);
    },
    (error) => {
      // If collection doesn't exist yet, return empty array gracefully
      onData([]);
    }
  );
}

export function subscribeAppointments(
  onData: (appointments: any[]) => void,
  onError?: (err: any) => void
) {
  const colRef = collection(db, 'appointments');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const appointments = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
      onData(appointments);
    },
    (error) => {
      onData([]);
    }
  );
}

