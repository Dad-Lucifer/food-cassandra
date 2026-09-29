import type React from 'react';
import { useState, useEffect } from 'react';
import type { Restaurant, UpdateRestaurantPayload } from '../types';

interface Props {
  isOpen: boolean;
  restaurant: Restaurant | null;
  existingCities: string[];
  loading: boolean;
  onClose: () => void;
  onSubmit: (payload: UpdateRestaurantPayload) => Promise<void>;
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
  maxWidth: 480,
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

const CUISINE_OPTIONS = [
  'Indian',
  'North Indian',
  'South Indian',
  'Continental',
  'Italian',
  'Chinese',
  'Japanese',
  'Asian',
  'Fast Food',
  'Cafe',
  'Desserts',
];

export default function AdminEditRestaurantModal({
  isOpen,
  restaurant,
  existingCities,
  loading,
  onClose,
  onSubmit,
}: Props) {
  const [name, setName] = useState('');
  const [cityChoice, setCityChoice] = useState('');
  const [customCity, setCustomCity] = useState('');
  const [cuisine, setCuisine] = useState(CUISINE_OPTIONS[0]);
  const [rating, setRating] = useState('4.5');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (restaurant) {
      setName(restaurant.name || '');
      setCuisine(restaurant.cuisine || CUISINE_OPTIONS[0]);
      setRating(String(restaurant.rating || 4.5));

      const foundCity = existingCities.find(
        (c) => c.toLowerCase() === (restaurant.city || '').toLowerCase()
      );
      if (foundCity) {
        setCityChoice(foundCity);
        setCustomCity('');
      } else {
        setCityChoice('__CUSTOM__');
        setCustomCity(restaurant.city || '');
      }
    }
  }, [restaurant, existingCities]);

  if (!isOpen || !restaurant) return null;

  const isCustomCity = cityChoice === '__CUSTOM__';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const finalName = name.trim();
    const finalCity = isCustomCity ? customCity.trim() : cityChoice.trim();
    const finalRating = parseFloat(rating);

    if (!finalName) {
      setFormError('Restaurant name is required');
      return;
    }
    if (!finalCity) {
      setFormError('Please specify a city');
      return;
    }
    if (isNaN(finalRating) || finalRating < 1 || finalRating > 5) {
      setFormError('Rating must be between 1.0 and 5.0');
      return;
    }

    try {
      await onSubmit({
        name: finalName,
        city: finalCity,
        cuisine,
        rating: finalRating,
      });
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to update restaurant');
    }
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h3 style={{ margin: 0, color: '#222', fontSize: '1.2rem' }}>✏️ Edit Restaurant Details</h3>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#888' }}
          >
            ✕
          </button>
        </div>

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
            <label style={labelStyle}>Restaurant Name *</label>
            <input
              style={inputStyle}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div style={formGroupStyle}>
            <label style={labelStyle}>City *</label>
            <select
              style={{ ...inputStyle, cursor: 'pointer' }}
              value={cityChoice}
              onChange={(e) => setCityChoice(e.target.value)}
            >
              {existingCities.map((c) => (
                <option key={c} value={c}>
                  📍 {c}
                </option>
              ))}
              <option value="__CUSTOM__">➕ Enter custom city...</option>
            </select>
          </div>

          {isCustomCity && (
            <div style={formGroupStyle}>
              <label style={labelStyle}>Custom City Name *</label>
              <input
                style={inputStyle}
                value={customCity}
                onChange={(e) => setCustomCity(e.target.value)}
                placeholder="Enter city name..."
                required
              />
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={formGroupStyle}>
              <label style={labelStyle}>Cuisine *</label>
              <select
                style={{ ...inputStyle, cursor: 'pointer' }}
                value={cuisine}
                onChange={(e) => setCuisine(e.target.value)}
              >
                {CUISINE_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div style={formGroupStyle}>
              <label style={labelStyle}>Rating (1.0 - 5.0)</label>
              <input
                style={inputStyle}
                type="number"
                step="0.1"
                min="1.0"
                max="5.0"
                value={rating}
                onChange={(e) => setRating(e.target.value)}
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
              {loading ? 'Saving in Cassandra...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
