import type React from 'react';
import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../api';
import type { Restaurant, MenuItem, ClusterInfo, NewRestaurantPayload, NewMenuItemPayload } from '../types';
import AdminClusterStats from '../components/AdminClusterStats';
import AdminRestaurantRow from '../components/AdminRestaurantRow';
import AdminMenuTable from '../components/AdminMenuTable';
import AdminAddRestaurantModal from '../components/AdminAddRestaurantModal';
import AdminAddMenuItemModal from '../components/AdminAddMenuItemModal';
import AdminDeleteConfirmModal from '../components/AdminDeleteConfirmModal';
import Loader from '../components/Loader';

const pageStyle: React.CSSProperties = {
  padding: '24px 20px',
  maxWidth: 1100,
  margin: '0 auto',
};

const metricsRowStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: 12,
  marginBottom: 20,
};

const metricCardStyle: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #e8e8e8',
  borderRadius: 10,
  padding: '14px 16px',
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
};

const layoutGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
  gap: 20,
  alignItems: 'start',
};

const sectionCard: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #e8e8e8',
  borderRadius: 12,
  padding: '20px',
  boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
};

const chipStyle = (active: boolean): React.CSSProperties => ({
  padding: '4px 12px',
  borderRadius: 18,
  border: '1px solid',
  borderColor: active ? '#FF5733' : '#ddd',
  background: active ? '#fff8f7' : '#fafafa',
  color: active ? '#FF5733' : '#555',
  fontSize: '0.8rem',
  fontWeight: active ? 700 : 400,
  cursor: 'pointer',
});

const alertStyle = (isError: boolean): React.CSSProperties => ({
  padding: '10px 16px',
  borderRadius: 8,
  marginBottom: 16,
  fontSize: '0.88rem',
  fontWeight: 500,
  background: isError ? '#fff1f0' : '#f6ffed',
  border: `1px solid ${isError ? '#ffa39e' : '#b7eb8f'}`,
  color: isError ? '#cf1322' : '#389e0d',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
});

export default function AdminDashboard() {
  // Data states
  const [cluster, setCluster] = useState<ClusterInfo | null>(null);
  const [clusterLoading, setClusterLoading] = useState(false);

  const [cities, setCities] = useState<string[]>([]);
  const [selectedCity, setSelectedCity] = useState<string>('All');

  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [menuLoading, setMenuLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState<{ message: string; isError: boolean } | null>(null);

  // Ref to menu table container for smooth scrolling on small screens
  const menuRef = useRef<HTMLDivElement>(null);

  // Modals state
  const [isAddRestaurantOpen, setIsAddRestaurantOpen] = useState(false);
  const [isAddMenuItemOpen, setIsAddMenuItemOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'restaurant' | 'menuItem';
    restaurant?: Restaurant;
    menuItem?: MenuItem;
  } | null>(null);

  const showNotification = (message: string, isError = false) => {
    setNotification({ message, isError });
    setTimeout(() => setNotification(null), 5000);
  };

  // 1. Fetch Cluster Status
  const fetchCluster = useCallback(async () => {
    setClusterLoading(true);
    try {
      const res = await api.get<ClusterInfo>('/admin/cluster');
      setCluster(res.data);
    } catch {
      // Cluster status error
    } finally {
      setClusterLoading(false);
    }
  }, []);

  // 2. Fetch Cities
  const fetchCities = useCallback(async () => {
    try {
      const res = await api.get<string[]>('/admin/cities');
      setCities(res.data);
    } catch (err: unknown) {
      console.error(err);
    }
  }, []);

  // 3. Fetch Restaurants (Stable callback with NO selectedRestaurant dependency)
  const fetchRestaurants = useCallback(async () => {
    try {
      const res = await api.get<Restaurant[]>('/admin/restaurants');
      setRestaurants(res.data);
      // Automatically default to first restaurant only if none is currently selected
      setSelectedRestaurant((prev) => (prev ? prev : (res.data[0] || null)));
    } catch (err: unknown) {
      console.error(err);
    }
  }, []);

  // 4. Fetch Menu Items for chosen restaurant
  const fetchMenu = useCallback(async (restaurantId: string) => {
    setMenuLoading(true);
    try {
      const res = await api.get<MenuItem[]>(`/menu/${restaurantId}`);
      setMenuItems(res.data);
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setMenuLoading(false);
    }
  }, []);

  // Initial Load — runs strictly once on mount
  useEffect(() => {
    async function init() {
      setLoading(true);
      await Promise.all([fetchCluster(), fetchCities(), fetchRestaurants()]);
      setLoading(false);
    }
    init();
  }, [fetchCluster, fetchCities, fetchRestaurants]);

  // Sync menu when selected restaurant changes
  useEffect(() => {
    if (selectedRestaurant?.restaurant_id) {
      fetchMenu(selectedRestaurant.restaurant_id);
    } else {
      setMenuItems([]);
    }
  }, [selectedRestaurant, fetchMenu]);

  // Handle selecting a restaurant without throwing the user to top
  const handleSelectRestaurant = (restaurant: Restaurant) => {
    if (selectedRestaurant?.restaurant_id === restaurant.restaurant_id) return;
    setSelectedRestaurant(restaurant);

    // If on narrow/mobile view where columns stack vertically, smoothly scroll to menu
    if (window.innerWidth < 800 && menuRef.current) {
      menuRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // ── HANDLERS ──────────────────────────────────────────────────────────────

  const handleAddRestaurant = async (payload: NewRestaurantPayload) => {
    setActionLoading(true);
    try {
      const res = await api.post<Restaurant>('/admin/restaurants', payload);
      await Promise.all([fetchRestaurants(), fetchCities()]);
      setSelectedRestaurant(res.data);
      setIsAddRestaurantOpen(false);
      showNotification(`Restaurant "${payload.name}" successfully created across Cassandra tables!`);
    } catch (err: unknown) {
      showNotification(err instanceof Error ? err.message : 'Failed to create restaurant', true);
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddMenuItem = async (payload: NewMenuItemPayload) => {
    if (!selectedRestaurant) return;
    setActionLoading(true);
    try {
      await api.post(`/admin/menu/${selectedRestaurant.restaurant_id}`, payload);
      await fetchMenu(selectedRestaurant.restaurant_id);
      setIsAddMenuItemOpen(false);
      showNotification(`Menu item "${payload.item_name}" added to ${selectedRestaurant.name}!`);
    } catch (err: unknown) {
      showNotification(err instanceof Error ? err.message : 'Failed to add menu item', true);
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  const executeDelete = async () => {
    if (!deleteTarget) return;
    setActionLoading(true);

    try {
      if (deleteTarget.type === 'restaurant' && deleteTarget.restaurant) {
        const id = deleteTarget.restaurant.restaurant_id;
        const name = deleteTarget.restaurant.name;
        await api.delete(`/admin/restaurants/${id}`);

        // If the deleted restaurant was selected, reset selection
        if (selectedRestaurant?.restaurant_id === id) {
          const remaining = restaurants.filter((r) => r.restaurant_id !== id);
          setSelectedRestaurant(remaining[0] || null);
        }

        await Promise.all([fetchRestaurants(), fetchCities()]);
        showNotification(`Restaurant "${name}" and its menu were removed from Cassandra.`);
      } else if (deleteTarget.type === 'menuItem' && deleteTarget.menuItem && selectedRestaurant) {
        const itemId = deleteTarget.menuItem.item_id;
        const itemName = deleteTarget.menuItem.item_name;
        await api.delete(`/admin/menu/${selectedRestaurant.restaurant_id}/${itemId}`);
        await fetchMenu(selectedRestaurant.restaurant_id);
        showNotification(`Dish "${itemName}" deleted successfully.`);
      }
      setDeleteTarget(null);
    } catch (err: unknown) {
      showNotification(err instanceof Error ? err.message : 'Deletion failed', true);
    } finally {
      setActionLoading(false);
    }
  };

  // Filtered restaurants
  const filteredRestaurants = restaurants.filter((r) => {
    const cityMatch = selectedCity === 'All' || r.city.toLowerCase() === selectedCity.toLowerCase();
    const queryMatch =
      !searchQuery.trim() ||
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.cuisine.toLowerCase().includes(searchQuery.toLowerCase());
    return cityMatch && queryMatch;
  });

  return (
    <div style={pageStyle}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ color: '#222', display: 'flex', alignItems: 'center', gap: 10, margin: '0 0 6px' }}>
          🛡️ Cassandra Admin Dashboard
        </h2>
        <p style={{ color: '#666', fontSize: '0.9rem' }}>
          Full administrative control over available cities, restaurants, and menu catalog in Apache Cassandra.
        </p>
      </div>

      {/* Live Metrics Row */}
      <div style={metricsRowStyle}>
        <div style={metricCardStyle}>
          <span style={{ fontSize: '0.8rem', color: '#888' }}>Available Cities</span>
          <span style={{ fontSize: '1.4rem', fontWeight: 700, color: '#222' }}>{cities.length}</span>
          <span style={{ fontSize: '0.74rem', color: '#555' }}>{cities.join(', ') || 'None'}</span>
        </div>
        <div style={metricCardStyle}>
          <span style={{ fontSize: '0.8rem', color: '#888' }}>Total Restaurants</span>
          <span style={{ fontSize: '1.4rem', fontWeight: 700, color: '#FF5733' }}>{restaurants.length}</span>
          <span style={{ fontSize: '0.74rem', color: '#555' }}>Across {cities.length} cities</span>
        </div>
        <div style={metricCardStyle}>
          <span style={{ fontSize: '0.8rem', color: '#888' }}>Current Menu Items</span>
          <span style={{ fontSize: '1.4rem', fontWeight: 700, color: '#2e7d32' }}>
            {selectedRestaurant ? menuItems.length : '—'}
          </span>
          <span style={{ fontSize: '0.74rem', color: '#555' }}>
            {selectedRestaurant ? `in ${selectedRestaurant.name}` : 'Select a restaurant'}
          </span>
        </div>
        <div style={metricCardStyle}>
          <span style={{ fontSize: '0.8rem', color: '#888' }}>Cassandra Nodes</span>
          <span style={{ fontSize: '1.4rem', fontWeight: 700, color: cluster?.upCount === 3 ? '#1565c0' : '#cf1322' }}>
            {cluster ? `${cluster.upCount}/${cluster.nodeCount} UP` : 'Connecting...'}
          </span>
          <span style={{ fontSize: '0.74rem', color: '#555' }}>RF=3 (DC1)</span>
        </div>
      </div>

      {/* Live Cluster Monitor */}
      <AdminClusterStats cluster={cluster} loading={clusterLoading} onRefresh={fetchCluster} />

      {/* Notifications */}
      {notification && (
        <div style={alertStyle(notification.isError)}>
          <span>{notification.isError ? '⚠️ ' : '✅ '} {notification.message}</span>
          <button
            onClick={() => setNotification(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}
          >
            ✕
          </button>
        </div>
      )}

      {loading ? (
        <Loader message="Loading admin database state from Cassandra..." />
      ) : (
        <div style={layoutGrid}>
          {/* Left Column: Restaurants & Cities */}
          <div style={sectionCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#222' }}>
                Restaurants ({filteredRestaurants.length})
              </h3>
              <button
                type="button"
                onClick={() => setIsAddRestaurantOpen(true)}
                style={{
                  background: '#FF5733',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  padding: '8px 14px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                ➕ Add Restaurant
              </button>
            </div>

            {/* City Filters */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
              <button
                type="button"
                style={chipStyle(selectedCity === 'All')}
                onClick={() => setSelectedCity('All')}
              >
                All ({restaurants.length})
              </button>
              {cities.map((c) => {
                const count = restaurants.filter((r) => r.city.toLowerCase() === c.toLowerCase()).length;
                return (
                  <button
                    type="button"
                    key={c}
                    style={chipStyle(selectedCity === c)}
                    onClick={() => setSelectedCity(c)}
                  >
                    📍 {c} ({count})
                  </button>
                );
              })}
            </div>

            {/* Search Input */}
            <input
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: 8,
                border: '1px solid #ddd',
                fontSize: '0.88rem',
                color: '#222',
                background: '#fff',
                marginBottom: 14,
                boxSizing: 'border-box',
              }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by name or cuisine..."
            />

            {/* Restaurant Rows */}
            {filteredRestaurants.length === 0 ? (
              <p style={{ color: '#888', fontSize: '0.88rem', textAlign: 'center', padding: '24px 0' }}>
                No restaurants matching criteria.
              </p>
            ) : (
              <div>
                {filteredRestaurants.map((r) => (
                  <AdminRestaurantRow
                    key={r.restaurant_id}
                    restaurant={r}
                    isSelected={selectedRestaurant?.restaurant_id === r.restaurant_id}
                    onSelect={handleSelectRestaurant}
                    onDeleteClick={(res) => setDeleteTarget({ type: 'restaurant', restaurant: res })}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Menu Catalog Management */}
          <div ref={menuRef}>
            <AdminMenuTable
              restaurant={selectedRestaurant}
              items={menuItems}
              loading={menuLoading}
              onAddItemClick={() => setIsAddMenuItemOpen(true)}
              onDeleteItemClick={(item) => setDeleteTarget({ type: 'menuItem', menuItem: item })}
            />
          </div>
        </div>
      )}

      {/* Add Restaurant Modal */}
      <AdminAddRestaurantModal
        isOpen={isAddRestaurantOpen}
        existingCities={cities.length > 0 ? cities : ['Mumbai', 'Pune']}
        loading={actionLoading}
        onClose={() => setIsAddRestaurantOpen(false)}
        onSubmit={handleAddRestaurant}
      />

      {/* Add Menu Item Modal */}
      <AdminAddMenuItemModal
        isOpen={isAddMenuItemOpen}
        restaurantName={selectedRestaurant?.name || ''}
        loading={actionLoading}
        onClose={() => setIsAddMenuItemOpen(false)}
        onSubmit={handleAddMenuItem}
      />

      {/* Confirmation Modal */}
      <AdminDeleteConfirmModal
        isOpen={!!deleteTarget}
        title={deleteTarget?.type === 'restaurant' ? 'Delete Restaurant' : 'Delete Menu Item'}
        message={
          deleteTarget?.type === 'restaurant'
            ? 'This will permanently remove this restaurant from both Cassandra tables (restaurants_by_id and restaurants_by_city) along with all its menu items.'
            : 'Are you sure you want to delete this dish from the restaurant menu in Cassandra?'
        }
        itemName={
          deleteTarget?.type === 'restaurant'
            ? `${deleteTarget.restaurant?.name} (${deleteTarget.restaurant?.city})`
            : `${deleteTarget?.menuItem?.item_name} (₹${deleteTarget?.menuItem?.price})`
        }
        loading={actionLoading}
        onConfirm={executeDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
