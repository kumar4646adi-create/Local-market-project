import { Retailer, LiveOrder, DisputeItem, ClusterStats } from '../types';

// PRODUCTION COMPLIANCE: Zero hardcoded/fabricated demo data.
// All entities are dynamically pulled from Firebase / Firestore as the single source of truth.

export const INITIAL_RETAILERS: Retailer[] = [];
export const INITIAL_ORDERS: LiveOrder[] = [];
export const INITIAL_DISPUTES: DisputeItem[] = [];
export const CLUSTER_STATS: ClusterStats[] = [];
