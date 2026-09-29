import type React from 'react';
import { useState } from 'react';
import type { NewMenuItemPayload } from '../types';

interface Props {
  isOpen: boolean;
  restaurantName: string;
  loading: boolean;
  onClose: () => void;
  onSubmit: (payload: NewMenuItemPayload) => Promise<void>;
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'rgba(0, 0, 0, 0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  padding: 16,
};

const modalStyle: React.CSSProperties = {
  background: '#fff',
  borderRadius: 14,
  width: '100%',
  maxWidth: 440,
  padding: 24,
  boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
};

const formGroupStyle: React.CSSProperties = {
  marginBottom: 16,
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
};

const labelStyle: React.CSSProperties = {
  fontSize: '0.85rem',
  fontWeight: 600,
  color: '#444',
};

const inputStyle: React.CSSProperties = {
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid #ddd',
  fontSize: '0.92rem',
  outline: 'none',
  color: '#222',
  background: '#fff',
};

const btnRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 10,
  marginTop: 20,
};

const CATEGORIES = [
  'Starter',
  'Main Course',
  'Bread',
  'Rice & Biryani',
  'Dessert',
  'Beverage',
  'Salad',
  'Side Order',
];

export default function AdminAddMenuItemModal({
  isOpen,
  restaurantName,
  loading,
  onClose,
  onSubmit,
}: Props) {
  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [price, setPrice] = useState('150.00');
  const [formError, setFormError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanName = itemName.trim();
    const cleanPrice = parseFloat(price);

    if (!cleanName) {
      setFormError('Item name is required');
      return;
    }
    if (isNaN(cleanPrice) || cleanPrice <= 0) {
      setFormError('Price must be greater than 0');
      return;
    }

    try {
      await onSubmit({
        item_name: cleanName,
        category,
        price: cleanPrice,
      });
      setItemName('');
      setPrice('150.00');
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to add menu item');
    }
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <h3 style={{ margin: 0, color: '#222', fontSize: '1.2rem' }}>🍲 Add Menu Item</h3>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#888' }}
          >
            ✕
          </button>
        </div>
        <p style={{ fontSize: '0.83rem', color: '#777', margin: '0 0 16px' }}>
          For <strong>{restaurantName}</strong>
        </p>

        {formError && (
          <div
            style={{
              background: '#fff1f0',
              border: '1px solid #ffa39e',
              borderRadius: 8,
              padding: '8px 12px',
              color: '#cf1322',
              fontSize: '0.85rem',
              marginBottom: 14,
            }}
          >
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={formGroupStyle}>
            <label style={labelStyle}>Item Name *</label>
            <input
              style={inputStyle}
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder='e.g. Butter Naan, Veg Crispy...'
              required
              autoFocus
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={formGroupStyle}>
              <label style={labelStyle}>Category *</label>
              <select
                style={{ ...inputStyle, cursor: 'pointer' }}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div style={formGroupStyle}>
              <label style={labelStyle}>Price (₹) *</label>
              <input
                style={inputStyle}
                type="number"
                step="0.5"
                min="1"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
            </div>
          </div>

          <div style={btnRowStyle}>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: '#f0f0f0',
                border: 'none',
                borderRadius: 8,
                padding: '10px 18px',
                fontWeight: 600,
                color: '#555',
                cursor: 'pointer',
              }}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                background: '#FF5733',
                border: 'none',
                borderRadius: 8,
                padding: '10px 20px',
                fontWeight: 600,
                color: '#fff',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
              disabled={loading}
            >
              {loading ? 'Adding Item...' : 'Add Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
