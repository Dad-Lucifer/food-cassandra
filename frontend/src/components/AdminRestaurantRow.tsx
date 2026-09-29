import type React from 'react';
import { Link } from 'react-router-dom';
import type { Restaurant } from '../types';

interface Props {
  restaurant: Restaurant;
  isSelected: boolean;
  onSelect: (restaurant: Restaurant) => void;
  onDeleteClick: (restaurant: Restaurant) => void;
}

const rowStyle = (isSelected: boolean): React.CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '14px 18px',
  background: isSelected ? '#fff8f7' : '#fff',
  border: `1px solid ${isSelected ? '#FF5733' : '#e8e8e8'}`,
  borderRadius: 10,
  marginBottom: 8,
  transition: 'background 0.15s, border-color 0.15s',
  gap: 12,
  flexWrap: 'wrap',
});

const infoCol: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  minWidth: 200,
  flex: 1,
};

const badgeRow: React.CSSProperties = {
  display: 'flex',
  gap: 8,
  alignItems: 'center',
  flexWrap: 'wrap',
  marginTop: 2,
};

const cityBadge: React.CSSProperties = {
  fontSize: '0.75rem',
  fontWeight: 600,
  background: '#e3f2fd',
  color: '#1565c0',
  padding: '2px 8px',
  borderRadius: 12,
};

const cuisineBadge: React.CSSProperties = {
  fontSize: '0.75rem',
  fontWeight: 600,
  background: '#fff3e0',
  color: '#e65100',
  padding: '2px 8px',
  borderRadius: 12,
};

const actionRow: React.CSSProperties = {
  display: 'flex',
  gap: 8,
  alignItems: 'center',
  flexWrap: 'wrap',
};

const manageBtn = (isSelected: boolean): React.CSSProperties => ({
  background: isSelected ? '#FF5733' : '#f0f0f0',
  color: isSelected ? '#fff' : '#333',
  border: 'none',
  borderRadius: 6,
  padding: '6px 12px',
  fontSize: '0.82rem',
  fontWeight: 600,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
});

const dashboardBtn: React.CSSProperties = {
  background: '#e6f7ff',
  color: '#096dd9',
  border: '1px solid #91d5ff',
  borderRadius: 6,
  padding: '6px 12px',
  fontSize: '0.82rem',
  fontWeight: 600,
  textDecoration: 'none',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  whiteSpace: 'nowrap',
};

const deleteBtn: React.CSSProperties = {
  background: '#fff1f0',
  color: '#cf1322',
  border: '1px solid #ffa39e',
  borderRadius: 6,
  padding: '6px 10px',
  fontSize: '0.82rem',
  fontWeight: 600,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
};

export default function AdminRestaurantRow({
  restaurant,
  isSelected,
  onSelect,
  onDeleteClick,
}: Props) {
  const shortId = (restaurant.restaurant_id || '').slice(0, 8) + '...';

  return (
    <div style={rowStyle(isSelected)}>
      <div style={infoCol}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <strong style={{ fontSize: '1rem', color: '#222' }}>{restaurant.name}</strong>
          <code
            style={{ fontSize: '0.72rem', color: '#888', background: '#f5f5f5', padding: '1px 5px', borderRadius: 4 }}
            title={restaurant.restaurant_id}
          >
            {shortId}
          </code>
        </div>
        <div style={badgeRow}>
          <span style={cityBadge}>📍 {restaurant.city}</span>
          <span style={cuisineBadge}>🍲 {restaurant.cuisine}</span>
          <span style={{ fontSize: '0.8rem', color: '#555', fontWeight: 600 }}>
            ⭐ {Number(restaurant.rating || 0).toFixed(1)}
          </span>
        </div>
      </div>

      <div style={actionRow}>
        <button
          type="button"
          style={manageBtn(isSelected)}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onSelect(restaurant);
          }}
        >
          {isSelected ? '✓ Viewing Menu' : '📋 Quick Menu'}
        </button>

        <Link
          to={`/admin/restaurants/${restaurant.restaurant_id}`}
          style={dashboardBtn}
          title="Open dedicated Restaurant Analytics & Orders Dashboard"
        >
          📊 Custom Dashboard →
        </Link>

        <button
          type="button"
          style={deleteBtn}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDeleteClick(restaurant);
          }}
          title="Delete Restaurant & All Menus"
        >
          🗑️
        </button>
      </div>
    </div>
  );
}
