import type React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api';
import type {
  Restaurant,
  MenuItem,
  Order,
  RestaurantDashboardData,
  UpdateRestaurantPayload,
  NewMenuItemPayload,
} from '../types';
import AdminEditRestaurantModal from '../components/AdminEditRestaurantModal';
import AdminAddMenuItemModal from '../components/AdminAddMenuItemModal';
import AdminDeleteConfirmModal from '../components/AdminDeleteConfirmModal';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';

const pageStyle: React.CSSProperties = {
  padding: '24px 20px',
  maxWidth: 1100,
  margin: '0 auto',
};

const topNavStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 16,
  flexWrap: 'wrap',
  gap: 12,
};

const backLinkStyle: React.CSSProperties = {
  textDecoration: 'none',
  color: '#FF5733',
  fontWeight: 600,
  fontSize: '0.9rem',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
};

const bannerCardStyle: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #e8e8e8',
  borderRadius: 14,
  padding: '22px 24px',
  marginBottom: 20,
  boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: 16,
};

const badgeRow: React.CSSProperties = {
  display: 'flex',
  gap: 8,
  alignItems: 'center',
  flexWrap: 'wrap',
  marginTop: 6,
};

const cityBadge: React.CSSProperties = {
  fontSize: '0.78rem',
  fontWeight: 600,
  background: '#e3f2fd',
  color: '#1565c0',
  padding: '3px 10px',
  borderRadius: 12,
};

const cuisineBadge: React.CSSProperties = {
  fontSize: '0.78rem',
  fontWeight: 600,
  background: '#fff3e0',
  color: '#e65100',
  padding: '3px 10px',
  borderRadius: 12,
};

const metricsGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: 12,
  marginBottom: 24,
};

const metricCard: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #e8e8e8',
  borderRadius: 12,
  padding: '16px 18px',
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
};

const tabNavStyle: React.CSSProperties = {
  display: 'flex',
  gap: 8,
  marginBottom: 16,
  borderBottom: '1px solid #e8e8e8',
  paddingBottom: 8,
};

const tabBtnStyle = (active: boolean): React.CSSProperties => ({
  background: active ? '#FF5733' : 'transparent',
  color: active ? '#fff' : '#666',
  border: 'none',
  borderRadius: 8,
  padding: '8px 18px',
  fontSize: '0.9rem',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 0.15s',
});

const contentCardStyle: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #e8e8e8',
  borderRadius: 12,
  padding: '20px',
  boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
};

const tableRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '12px 14px',
  background: '#fafafa',
  border: '1px solid #f0f0f0',
  borderRadius: 8,
  marginBottom: 8,
  flexWrap: 'wrap',
  gap: 10,
};

export default function RestaurantCustomDashboard() {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const navigate = useNavigate();

  const [data, setData] = useState<RestaurantDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'orders' | 'menu'>('orders');

  // Existing cities for modal dropdown
  const [existingCities, setExistingCities] = useState<string[]>(['Mumbai', 'Pune']);

  // Modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddMenuModalOpen, setIsAddMenuModalOpen] = useState(false);
  const [deleteMenuItemTarget, setDeleteMenuItemTarget] = useState<MenuItem | null>(null);

  const [notification, setNotification] = useState<string | null>(null);

  const notify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  // Fetch all dashboard data for this restaurant
  const fetchDashboardData = useCallback(async () => {
    if (!restaurantId) return;
    try {
      const [dashRes, citiesRes] = await Promise.all([
        api.get<RestaurantDashboardData>(`/admin/restaurants/${restaurantId}/dashboard`),
        api.get<string[]>('/admin/cities').catch(() => ({ data: ['Mumbai', 'Pune'] })),
      ]);
      setData(dashRes.data);
      if (citiesRes.data) setExistingCities(citiesRes.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load restaurant dashboard');
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Edit Restaurant Details
  const handleUpdateRestaurant = async (payload: UpdateRestaurantPayload) => {
    if (!restaurantId) return;
    setActionLoading(true);
    try {
      await api.put(`/admin/restaurants/${restaurantId}`, payload);
      await fetchDashboardData();
      setIsEditModalOpen(false);
      notify(`Restaurant details updated successfully in Cassandra!`);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setActionLoading(false);
    }
  };

  // Add Dish to Menu
  const handleAddMenuItem = async (payload: NewMenuItemPayload) => {
    if (!restaurantId) return;
    setActionLoading(true);
    try {
      await api.post(`/admin/menu/${restaurantId}`, payload);
      await fetchDashboardData();
      setIsAddMenuModalOpen(false);
      notify(`Added "${payload.item_name}" to menu!`);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to add dish');
    } finally {
      setActionLoading(false);
    }
  };

  // Delete Dish from Menu
  const handleDeleteMenuItem = async () => {
    if (!restaurantId || !deleteMenuItemTarget) return;
    setActionLoading(true);
    try {
      await api.delete(`/admin/menu/${restaurantId}/${deleteMenuItemTarget.item_id}`);
      await fetchDashboardData();
      notify(`Deleted "${deleteMenuItemTarget.item_name}" from menu.`);
      setDeleteMenuItemTarget(null);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to delete dish');
    } finally {
      setActionLoading(false);
    }
  };

  // Simulate Order in Cassandra
  const handleSimulateOrder = async () => {
    if (!restaurantId) return;
    setActionLoading(true);
    try {
      const res = await api.post<Order>(`/admin/restaurants/${restaurantId}/demo-order`);
      await fetchDashboardData();
      notify(`⚡ Order #${(res.data.order_id || '').slice(0, 8)} placed! Added ₹${res.data.total} to revenue.`);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to simulate order');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div style={pageStyle}><Loader message="Loading restaurant telemetry..." /></div>;
  if (error || !data) return <div style={pageStyle}><ErrorMessage message={error || 'Restaurant not found'} /></div>;

  const { restaurant, metrics, orders, menu } = data;

  return (
    <div style={pageStyle}>
      {/* Top Breadcrumb & Actions */}
      <div style={topNavStyle}>
        <Link to="/admin" style={backLinkStyle}>
          ← Back to Admin Overview
        </Link>
        <button
          type="button"
          onClick={fetchDashboardData}
          style={{
            background: '#f4f4f4',
            border: '1px solid #ddd',
            borderRadius: 6,
            padding: '6px 12px',
            fontSize: '0.8rem',
            cursor: 'pointer',
            color: '#444',
            fontWeight: 600,
          }}
        >
          🔄 Refresh
        </button>
      </div>

      {notification && (
        <div
          style={{
            background: '#f6ffed',
            border: '1px solid #b7eb8f',
            color: '#389e0d',
            padding: '10px 16px',
            borderRadius: 8,
            marginBottom: 16,
            fontWeight: 600,
            fontSize: '0.88rem',
          }}
        >
          ✅ {notification}
        </div>
      )}

      {/* Restaurant Header Banner */}
      <div style={bannerCardStyle}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h2 style={{ margin: 0, color: '#222', fontSize: '1.4rem' }}>{restaurant.name}</h2>
            <code
              style={{
                fontSize: '0.74rem',
                background: '#f5f5f5',
                color: '#888',
                padding: '2px 6px',
                borderRadius: 4,
              }}
              title={restaurant.restaurant_id}
            >
              {(restaurant.restaurant_id || '').slice(0, 8)}...
            </code>
          </div>
          <div style={badgeRow}>
            <span style={cityBadge}>📍 {restaurant.city}</span>
            <span style={cuisineBadge}>🍲 {restaurant.cuisine}</span>
            <span style={{ fontSize: '0.85rem', color: '#555', fontWeight: 600 }}>
              ⭐ {Number(restaurant.rating || 0).toFixed(1)}
            </span>
            <span style={{ fontSize: '0.78rem', color: '#888' }}>• Apache Cassandra Cluster DC1</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setIsEditModalOpen(true)}
            style={{
              background: '#f0f0f0',
              border: '1px solid #ddd',
              color: '#333',
              borderRadius: 8,
              padding: '9px 16px',
              fontSize: '0.86rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            ✏️ Edit Details
          </button>
          <button
            type="button"
            onClick={handleSimulateOrder}
            disabled={actionLoading}
            style={{
              background: '#FF5733',
              border: 'none',
              color: '#fff',
              borderRadius: 8,
              padding: '9px 16px',
              fontSize: '0.86rem',
              fontWeight: 600,
              cursor: actionLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              opacity: actionLoading ? 0.7 : 1,
            }}
            title="Generates a live order in Cassandra across orders_by_restaurant, orders_by_id, and orders_by_user"
          >
            {actionLoading ? 'Writing to Cassandra...' : '⚡ Simulate Order'}
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div style={metricsGridStyle}>
        <div style={metricCard}>
          <span style={{ fontSize: '0.8rem', color: '#888' }}>Total Revenue</span>
          <span style={{ fontSize: '1.45rem', fontWeight: 700, color: '#2e7d32' }}>
            ₹{metrics.totalRevenue.toFixed(2)}
          </span>
          <span style={{ fontSize: '0.74rem', color: '#666' }}>From {metrics.totalOrders} total orders</span>
        </div>

        <div style={metricCard}>
          <span style={{ fontSize: '0.8rem', color: '#888' }}>Total Orders</span>
          <span style={{ fontSize: '1.45rem', fontWeight: 700, color: '#FF5733' }}>
            {metrics.totalOrders}
          </span>
          <span style={{ fontSize: '0.74rem', color: '#666' }}>Recorded in orders_by_restaurant</span>
        </div>

        <div style={metricCard}>
          <span style={{ fontSize: '0.8rem', color: '#888' }}>Avg. Order Value</span>
          <span style={{ fontSize: '1.45rem', fontWeight: 700, color: '#1565c0' }}>
            ₹{metrics.avgOrderValue.toFixed(2)}
          </span>
          <span style={{ fontSize: '0.74rem', color: '#666' }}>Revenue / Orders</span>
        </div>

        <div style={metricCard}>
          <span style={{ fontSize: '0.8rem', color: '#888' }}>Menu Dishes</span>
          <span style={{ fontSize: '1.45rem', fontWeight: 700, color: '#7b1fa2' }}>
            {metrics.menuCount}
          </span>
          <span style={{ fontSize: '0.74rem', color: '#666' }}>Active catalog items</span>
        </div>

        <div style={metricCard}>
          <span style={{ fontSize: '0.8rem', color: '#888' }}>Customer Rating</span>
          <span style={{ fontSize: '1.45rem', fontWeight: 700, color: '#e65100' }}>
            ⭐ {Number(metrics.rating || 0).toFixed(1)}
          </span>
          <span style={{ fontSize: '0.74rem', color: '#666' }}>Out of 5.0</span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={tabNavStyle}>
        <button
          type="button"
          style={tabBtnStyle(activeTab === 'orders')}
          onClick={() => setActiveTab('orders')}
        >
          📦 Recent Orders ({orders.length})
        </button>
        <button
          type="button"
          style={tabBtnStyle(activeTab === 'menu')}
          onClick={() => setActiveTab('menu')}
        >
          🧾 Menu Catalog ({menu.length})
        </button>
      </div>

      {/* TAB 1: ORDERS & REVENUE */}
      {activeTab === 'orders' && (
        <div style={contentCardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#222' }}>
              Order History & Revenue Stream
            </h3>
            <span style={{ fontSize: '0.8rem', color: '#888' }}>
              Query table: <code>orders_by_restaurant</code> (Clustered by order_id DESC)
            </span>
          </div>

          {orders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#888' }}>
              <div style={{ fontSize: '2.4rem', marginBottom: 8 }}>📭</div>
              <p style={{ fontWeight: 600, color: '#444' }}>No orders placed for this restaurant yet.</p>
              <button
                type="button"
                onClick={handleSimulateOrder}
                style={{
                  background: '#FF5733',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  padding: '8px 16px',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  marginTop: 10,
                }}
              >
                ⚡ Place First Simulated Order
              </button>
            </div>
          ) : (
            <div>
              {orders.map((o) => {
                const shortOrderId = (o.order_id || '').slice(0, 8) + '...';
                const dateStr = o.last_updated
                  ? new Date(o.last_updated).toLocaleString('en-IN', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })
                  : 'Recent';

                return (
                  <div key={o.order_id} style={tableRowStyle}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <code style={{ fontSize: '0.78rem', color: '#333', background: '#eee', padding: '2px 6px', borderRadius: 4 }}>
                          {shortOrderId}
                        </code>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: 12,
                            background: '#e3f2fd',
                            color: '#1565c0',
                          }}
                        >
                          {o.status}
                        </span>
                        <span style={{ fontSize: '0.78rem', color: '#888' }}>{dateStr}</span>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#444' }}>
                        <strong>Items:</strong> {Array.isArray(o.items) ? o.items.join(', ') : 'Order items'}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#FF5733' }}>
                        ₹{parseFloat(String(o.total || 0)).toFixed(2)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MENU CATALOG */}
      {activeTab === 'menu' && (
        <div style={contentCardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <h3 style={{ margin: '0 0 4px', fontSize: '1.1rem', color: '#222' }}>
                Menu Catalog Management
              </h3>
              <span style={{ fontSize: '0.8rem', color: '#888' }}>
                Query table: <code>menu_by_restaurant</code> (Partition: {restaurant.name})
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsAddMenuModalOpen(true)}
              style={{
                background: '#FF5733',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '8px 16px',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              ➕ Add Menu Item
            </button>
          </div>

          {menu.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: '#999' }}>
              <div style={{ fontSize: '2rem', marginBottom: 8 }}>🥣</div>
              <p>No dishes on the menu yet.</p>
            </div>
          ) : (
            <div>
              {menu.map((item) => (
                <div
                  key={item.item_id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 14px',
                    background: '#fafafa',
                    border: '1px solid #f0f0f0',
                    borderRadius: 8,
                    marginBottom: 8,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <strong style={{ fontSize: '0.94rem', color: '#333' }}>{item.item_name}</strong>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        background: '#e8f5e9',
                        color: '#2e7d32',
                        padding: '2px 8px',
                        borderRadius: 12,
                        fontWeight: 600,
                      }}
                    >
                      {item.category}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <span style={{ fontWeight: 700, color: '#FF5733', fontSize: '1rem' }}>
                      ₹{parseFloat(String(item.price)).toFixed(2)}
                    </span>
                    <button
                      type="button"
                      onClick={() => setDeleteMenuItemTarget(item)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        color: '#cf1322',
                      }}
                      title={`Delete ${item.item_name}`}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Edit Restaurant Modal */}
      <AdminEditRestaurantModal
        isOpen={isEditModalOpen}
        restaurant={restaurant}
        existingCities={existingCities}
        loading={actionLoading}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleUpdateRestaurant}
      />

      {/* Add Menu Item Modal */}
      <AdminAddMenuItemModal
        isOpen={isAddMenuModalOpen}
        restaurantName={restaurant.name}
        loading={actionLoading}
        onClose={() => setIsAddMenuModalOpen(false)}
        onSubmit={handleAddMenuItem}
      />

      {/* Delete Menu Item Confirmation Modal */}
      <AdminDeleteConfirmModal
        isOpen={!!deleteMenuItemTarget}
        title="Delete Menu Item"
        message="Are you sure you want to delete this dish from Cassandra?"
        itemName={`${deleteMenuItemTarget?.item_name || ''} (₹${deleteMenuItemTarget?.price || 0})`}
        loading={actionLoading}
        onConfirm={handleDeleteMenuItem}
        onCancel={() => setDeleteMenuItemTarget(null)}
      />
    </div>
  );
}
