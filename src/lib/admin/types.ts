import type { LastOrder } from "@/lib/order";

export type StoredOrder = LastOrder & {
  savedAt: string;
  userId?: number;
};

export type StoredUser = {
  id: number;
  phone: string;
  name: string;
  email: string | null;
  createdAt: string;
  updatedAt: string;
  ordersCount: number;
  totalSpent: number;
};

export type DashboardStats = {
  ordersTotal: number;
  ordersToday: number;
  revenueTotal: number;
  revenueToday: number;
  usersTotal: number;
  avgOrder: number;
  promoOrders: number;
  recentOrders: StoredOrder[];
  topUsers: StoredUser[];
};
