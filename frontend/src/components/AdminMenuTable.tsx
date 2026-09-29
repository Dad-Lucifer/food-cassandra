import type React from 'react';
import type { MenuItem, Restaurant } from '../types';

interface Props {
  restaurant: Restaurant | null;
  items: MenuItem[];
  loading: boolean;
  onAddItemClick: () => void;
  onDeleteItemClick: (item: MenuItem) => void;
}

const containerStyle: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #e8e8e8',
  borderRadius: 12,
  padding: '20px',
  boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 16,
  flexWrap: 'wrap',
  gap: 12,
};

const addBtnStyle: React.CSSProperties = {
  background: '#FF5733',
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  padding: '8px 16px',
  fontSize: '0.85rem',
  fontWeight: 600,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: 6,
};

const itemRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '10px 14px',
  background: '#fafafa',
  border: '1px solid #f0f0f0',
  borderRadius: 8,
  marginBottom: 8,
};

const deleteIconBtn: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: '#cf1322',
  fontSize: '0.9rem',
  cursor: 'pointer',
  padding: '4px 8px',
  borderRadius: 6,
};

export default function AdminMenuTable({
  restaurant,
  items,
  loading,
  onAddItemClick,
  onDeleteItemClick,
}: Props) {
  if (!restaurant) {
    return (
      <div style={{ ...containerStyle, textAlign: 'center', color: '#888', padding: '48px 20px' }}>
        <div style={{ fontSize: '2.4rem', marginBottom: 10 }}>👈</div>
        <p style={{ fontWeight: 600, fontSize: '0.95rem', color: '#444' }}>
          Select a restaurant from the left to view and manage its menu items
        </p>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <div>
          <h3 style={{ margin: '0 0 4px', fontSize: '1.15rem', color: '#222' }}>
            Menu: {restaurant.name}
          </h3>
          <span style={{ fontSize: '0.82rem', color: '#777' }}>
            📍 {restaurant.city} • {items.length} item{items.length !== 1 ? 's' : ''} in Cassandra
          </span>
        </div>
        <button style={addBtnStyle} onClick={onAddItemClick}>
          ➕ Add Menu Item
        </button>
      </div>

      {loading ? (
        <p style={{ color: '#888', fontSize: '0.88rem', padding: '16px 0' }}>Loading menu items...</p>
      ) : items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '32px 0', color: '#999' }}>
          <div style={{ fontSize: '2rem', marginBottom: 8 }}>🥣</div>
          <p style={{ fontSize: '0.9rem' }}>No dishes added to this menu yet.</p>
          <button
            onClick={onAddItemClick}
            style={{
              background: 'none',
              border: '1px dashed #FF5733',
              color: '#FF5733',
              padding: '6px 14px',
              borderRadius: 6,
              cursor: 'pointer',
              marginTop: 10,
              fontSize: '0.85rem',
              fontWeight: 600,
            }}
          >
            Add first dish
          </button>
        </div>
      ) : (
        <div>
          {items.map((item) => (
            <div key={item.item_id} style={itemRowStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontWeight: 600, color: '#333', fontSize: '0.92rem' }}>
                  {item.item_name}
                </span>
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
                <span style={{ fontWeight: 700, color: '#FF5733', fontSize: '0.95rem' }}>
                  ₹{parseFloat(String(item.price)).toFixed(2)}
                </span>
                <button
                  style={deleteIconBtn}
                  onClick={() => onDeleteItemClick(item)}
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
  );
}
