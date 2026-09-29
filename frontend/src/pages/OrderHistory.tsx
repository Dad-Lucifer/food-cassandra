import type React from 'react';
import { useState } from 'react';
import api from '../api';
import type { Order } from '../types';
import OrderCard from '../components/OrderCard';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';

const DEFAULT_USER_ID = '11111111-1111-1111-1111-111111111111';

const pageStyle: React.CSSProperties = {
  padding: '24px 20px',
  maxWidth: 680,
  margin: '0 auto',
};

const searchRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: 10,
  marginBottom: 24,
  flexWrap: 'wrap',
};

const inputStyle: React.CSSProperties = {
  flex: 1,
  padding: '10px 14px',
  fontSize: '0.85rem',
  fontFamily: 'ui-monospace, Consolas, monospace',
  border: '1px solid #ddd',
  borderRadius: 8,
  outline: 'none',
  minWidth: 200,
  color: '#222',
  background: '#fff',
};

const btnStyle: React.CSSProperties = {
  background: '#FF5733',
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  padding: '10px 20px',
  fontSize: '0.95rem',
  fontWeight: 600,
  cursor: 'pointer',
};

const listStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
};

const emptyStyle: React.CSSProperties = {
  textAlign: 'center',
  padding: '40px 0',
  color: '#999',
  fontSize: '0.95rem',
};

const hintStyle: React.CSSProperties = {
  background: '#fff8f7',
  border: '1px solid #ffd0c3',
  borderRadius: 8,
  padding: '10px 14px',
  fontSize: '0.82rem',
  color: '#c0392b',
  marginBottom: 20,
};

export default function OrderHistory() {
  const [userId, setUserId] = useState(DEFAULT_USER_ID);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const fetchOrders = async () => {
    if (!userId.trim()) return;
    setLoading(true);
    setError(null);
    setSearched(true);
    try {
      const res = await api.get<Order[]>(`/users/${userId.trim()}/orders`);
      setOrders(res.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch orders.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={pageStyle}>
      <h2 style={{ marginBottom: 6, color: '#222' }}>📦 Order History</h2>
      <p style={{ color: '#888', marginBottom: 20, fontSize: '0.9rem' }}>
        Enter a user ID to view past orders.
      </p>

      <div style={hintStyle}>
        💡 Test user ID: <code>{DEFAULT_USER_ID}</code>
      </div>

      <div style={searchRowStyle}>
        <input
          style={inputStyle}
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          placeholder="Enter user UUID…"
          onKeyDown={(e) => e.key === 'Enter' && fetchOrders()}
        />
        <button style={btnStyle} onClick={fetchOrders}>
          Search
        </button>
      </div>

      {loading && <Loader message="Fetching orders…" />}
      {error && <ErrorMessage message={error} />}

      {!loading && !error && (
        <>
          {orders.length > 0 && (
            <p style={{ fontSize: '0.82rem', color: '#888', marginBottom: 12 }}>
              {orders.length} order{orders.length !== 1 ? 's' : ''} found
            </p>
          )}
          <div style={listStyle}>
            {orders.length > 0
              ? orders.map((o) => <OrderCard key={o.order_id} order={o} />)
              : searched && (
                  <div style={emptyStyle}>
                    <div style={{ fontSize: '2rem', marginBottom: 8 }}>📭</div>
                    <p>No orders found for this user.</p>
                  </div>
                )}
          </div>
        </>
      )}
    </div>
  );
}
