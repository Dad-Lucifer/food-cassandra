import type React from 'react';
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import type { MenuItem, OrderConfirmation } from '../types';
import MenuItemRow from '../components/MenuItemRow';
import CartSummary from '../components/CartSummary';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';

const DEFAULT_USER_ID = '11111111-1111-1111-1111-111111111111';

const pageStyle: React.CSSProperties = {
  padding: '24px 20px',
  maxWidth: 680,
  margin: '0 auto',
  paddingBottom: 100,
};

const userRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  background: '#f8f8f8',
  border: '1px solid #e8e8e8',
  borderRadius: 8,
  padding: '10px 14px',
  marginBottom: 20,
};

const inputStyle: React.CSSProperties = {
  flex: 1,
  border: 'none',
  background: 'transparent',
  fontSize: '0.85rem',
  fontFamily: 'ui-monospace, Consolas, monospace',
  color: '#222',
  outline: 'none',
};

const listStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
};

const confirmBoxStyle: React.CSSProperties = {
  maxWidth: 480,
  margin: '60px auto',
  background: '#fff',
  border: '1px solid #e8e8e8',
  borderRadius: 16,
  padding: '36px 32px',
  textAlign: 'center',
  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
};

const confirmBtnStyle: React.CSSProperties = {
  background: '#FF5733',
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  padding: '10px 24px',
  fontSize: '0.95rem',
  fontWeight: 600,
  cursor: 'pointer',
  marginTop: 20,
};

export default function Menu() {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const navigate = useNavigate();

  const [items, setItems] = useState<MenuItem[]>([]);
  const [selected, setSelected] = useState<Record<string, MenuItem>>({});
  const [userId, setUserId] = useState(DEFAULT_USER_ID);
  const [placing, setPlacing] = useState(false);
  const [confirmation, setConfirmation] = useState<OrderConfirmation | null>(null);
  const [loadingMenu, setLoadingMenu] = useState(true);
  const [menuError, setMenuError] = useState<string | null>(null);
  const [orderError, setOrderError] = useState<string | null>(null);

  useEffect(() => {
    if (!restaurantId) return;
    setLoadingMenu(true);
    setMenuError(null);
    api
      .get<MenuItem[]>(`/menu/${restaurantId}`)
      .then((res) => setItems(res.data))
      .catch((err: unknown) =>
        setMenuError(err instanceof Error ? err.message : 'Failed to load menu.')
      )
      .finally(() => setLoadingMenu(false));
  }, [restaurantId]);

  const toggleItem = (item: MenuItem) => {
    setSelected((prev) => {
      const next = { ...prev };
      if (next[item.item_id]) delete next[item.item_id];
      else next[item.item_id] = item;
      return next;
    });
  };

  const selectedItems = Object.values(selected);
  const total = selectedItems.reduce((sum, i) => sum + parseFloat(String(i.price)), 0);

  const placeOrder = async () => {
    if (selectedItems.length === 0 || !restaurantId) return;
    setPlacing(true);
    setOrderError(null);
    try {
      const res = await api.post<OrderConfirmation>('/orders', {
        user_id: userId,
        restaurant_id: restaurantId,
        items: selectedItems.map((i) => i.item_name),
        total: total.toFixed(2),
      });
      setConfirmation(res.data);
    } catch (err: unknown) {
      setOrderError(err instanceof Error ? err.message : 'Failed to place order.');
    } finally {
      setPlacing(false);
    }
  };

  if (confirmation) {
    return (
      <div style={confirmBoxStyle}>
        <div style={{ fontSize: '3rem', marginBottom: 12 }}>✅</div>
        <h2 style={{ color: '#222', marginBottom: 8 }}>Order Placed!</h2>
        <p style={{ color: '#555', marginBottom: 16, fontSize: '0.9rem' }}>
          Your food is being prepared.
        </p>
        <div
          style={{
            background: '#f4f4f4',
            borderRadius: 8,
            padding: '12px 16px',
            marginBottom: 4,
            textAlign: 'left',
          }}
        >
          <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: 4 }}>Order ID</div>
          <code style={{ fontSize: '0.78rem', wordBreak: 'break-all', color: '#333' }}>
            {confirmation.order_id}
          </code>
        </div>
        <div
          style={{
            background: '#e8f5e9',
            borderRadius: 8,
            padding: '10px 16px',
            display: 'inline-block',
            color: '#2e7d32',
            fontWeight: 700,
            fontSize: '0.85rem',
            marginTop: 8,
          }}
        >
          Status: {confirmation.status}
        </div>
        <br />
        <button style={confirmBtnStyle} onClick={() => navigate('/orders')}>
          View Order History →
        </button>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <button
        onClick={() => navigate(-1)}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: '#FF5733',
          fontSize: '0.9rem',
          padding: 0,
          marginBottom: 16,
          fontWeight: 600,
        }}
      >
        ← Back
      </button>

      <h2 style={{ marginBottom: 4, color: '#222' }}>🧾 Menu</h2>
      <p style={{ color: '#888', fontSize: '0.88rem', marginBottom: 20 }}>
        Select items to add to your order.
      </p>

      <div style={userRowStyle}>
        <span style={{ fontSize: '0.8rem', color: '#888', whiteSpace: 'nowrap' }}>User ID:</span>
        <input
          style={inputStyle}
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          placeholder="Enter user UUID…"
        />
      </div>

      {loadingMenu && <Loader message="Loading menu…" />}
      {menuError && <ErrorMessage message={menuError} />}

      {!loadingMenu && !menuError && (
        <>
          <div style={listStyle}>
            {items.map((item) => (
              <MenuItemRow
                key={item.item_id}
                item={item}
                checked={!!selected[item.item_id]}
                onToggle={toggleItem}
              />
            ))}
          </div>
          {orderError && <ErrorMessage message={orderError} />}
          <CartSummary
            itemCount={selectedItems.length}
            total={total}
            onPlaceOrder={placeOrder}
            placing={placing}
          />
        </>
      )}
    </div>
  );
}
