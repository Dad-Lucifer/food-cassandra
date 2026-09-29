// ── Shared TypeScript interfaces for the Food Delivery App ──────────────────

export interface Restaurant {
  restaurant_id: string;
  city: string;
  name: string;
  cuisine: string;
  rating: number;
}

export interface MenuItem {
  item_id: string;
  restaurant_id: string;
  item_name: string;
  category: string;
  price: string | number;
}

export interface Order {
  order_id: string;
  user_id: string;
  restaurant_id: string;
  status: string;
  total: string | number;
  items?: string[];
  last_updated?: string;
}

export interface OrderConfirmation {
  order_id: string;
  status: string;
}

export interface ClusterHost {
  address: string;
  datacenter: string;
  rack: string;
  isUp: boolean;
  tokens: number;
}

export interface ClusterInfo {
  clusterName: string;
  keyspace: string;
  replication: {
    strategy: string;
    DC1: number;
  };
  nodeCount: number;
  upCount: number;
  hosts: ClusterHost[];
}

export interface NewRestaurantPayload {
  name: string;
  cuisine: string;
  city: string;
  rating: number;
}

export interface UpdateRestaurantPayload {
  name: string;
  cuisine: string;
  city: string;
  rating: number;
}

export interface NewMenuItemPayload {
  item_name: string;
  category: string;
  price: number;
}

export interface RestaurantDashboardMetrics {
  totalRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
  menuCount: number;
  rating: number;
}

export interface RestaurantDashboardData {
  restaurant: Restaurant;
  metrics: RestaurantDashboardMetrics;
  orders: Order[];
  menu: MenuItem[];
}
