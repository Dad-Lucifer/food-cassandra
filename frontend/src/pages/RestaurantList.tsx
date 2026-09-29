import type React from 'react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import type { Restaurant } from '../types';
import RestaurantCard from '../components/RestaurantCard';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';
import AutocompleteInput from '../components/AutocompleteInput';

const KNOWN_CITIES = ['Mumbai', 'Pune'];
const ALL_CITIES = ['Mumbai', 'Pune', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad', 'Kolkata'];

const pageStyle: React.CSSProperties = {
  padding: '24px 20px',
  maxWidth: 680,
  margin: '0 auto',
};

const searchRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: 10,
  marginBottom: 24,
  alignItems: 'flex-start',
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
  flexShrink: 0,
};

const quickCitiesStyle: React.CSSProperties = {
  display: 'flex',
  gap: 8,
  flexWrap: 'wrap',
  marginBottom: 20,
};

function chipStyle(active: boolean): React.CSSProperties {
  return {
    padding: '4px 14px',
    borderRadius: 20,
    border: '1px solid',
    borderColor: active ? '#FF5733' : '#ddd',
    background: active ? '#fff8f7' : '#fafafa',
    color: active ? '#FF5733' : '#555',
    fontSize: '0.82rem',
    fontWeight: active ? 700 : 400,
    cursor: 'pointer',
  };
}

const listStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
};

const emptyStyle: React.CSSProperties = {
  textAlign: 'center',
  padding: '40px 0',
  color: '#999',
  fontSize: '0.95rem',
};

const hintStyle: React.CSSProperties = {
  fontSize: '0.75rem',
  color: '#aaa',
  marginBottom: 16,
  display: 'flex',
  alignItems: 'center',
  gap: 4,
};

export default function RestaurantList() {
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [activeCity, setActiveCity] = useState('');

  // Pre-fetch all restaurants for suggestion pool
  const [allRestaurants, setAllRestaurants] = useState<Restaurant[]>([]);

  useEffect(() => {
    Promise.all(
      KNOWN_CITIES.map((c) =>
        api.get<Restaurant[]>(`/restaurants/${c}`).then((r) => r.data)
      )
    )
      .then((arrays) => setAllRestaurants(arrays.flat()))
      .catch(() => { /* silent */ });
  }, []);

  // Combined suggestions: city names + restaurant names
  const restaurantNames = allRestaurants.map((r) => r.name);
  const suggestions = Array.from(new Set([...ALL_CITIES, ...restaurantNames]));

  const isCity = (val: string) =>
    ALL_CITIES.some((c) => c.toLowerCase() === val.toLowerCase());

  const isRestaurantName = (val: string) =>
    allRestaurants.find((r) => r.name.toLowerCase() === val.toLowerCase());

  const doSearch = async (val: string = query) => {
    const trimmed = val.trim();
    if (!trimmed) return;

    // If it matches a restaurant name → navigate directly to its menu
    const matchedRestaurant = isRestaurantName(trimmed);
    if (matchedRestaurant) {
      navigate(`/menu/${matchedRestaurant.restaurant_id}`);
      return;
    }

    // Otherwise treat as city search
    setLoading(true);
    setError(null);
    setSearched(true);
    setActiveCity(trimmed);
    try {
      const res = await api.get<Restaurant[]>(`/restaurants/${trimmed}`);
      setRestaurants(res.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch restaurants.');
    } finally {
      setLoading(false);
    }
  };

  const handleChip = (city: string) => {
    setQuery(city);
    doSearch(city);
  };

  return (
    <div style={pageStyle}>
      <h2 style={{ marginBottom: 6, color: '#222' }}>🍽️ Browse Restaurants</h2>
      <p style={{ color: '#888', marginBottom: 20, fontSize: '0.9rem' }}>
        Search by city name or restaurant name.
      </p>

      {/* Quick city chips */}
      <div style={quickCitiesStyle}>
        {KNOWN_CITIES.map((c) => (
          <button
            key={c}
            style={chipStyle(activeCity.toLowerCase() === c.toLowerCase())}
            onClick={() => handleChip(c)}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Single unified search bar */}
      <div style={searchRowStyle}>
        <AutocompleteInput
          value={query}
          onChange={setQuery}
          onSelect={(val) => doSearch(val)}
          suggestions={suggestions}
          placeholder='Search city or restaurant name…'
          onEnter={() => doSearch()}
        />
        <button style={btnStyle} onClick={() => doSearch()}>
          Search
        </button>
      </div>

      {allRestaurants.length > 0 && (
        <p style={hintStyle}>
          ✨ Try: city (Mumbai, Pune) or restaurant name (
          {allRestaurants
            .slice(0, 2)
            .map((r) => r.name)
            .join(', ')}
          …)
        </p>
      )}

      {loading && <Loader message={`Searching for "${activeCity}"…`} />}
      {error && <ErrorMessage message={error} />}

      {!loading && !error && (
        <div style={listStyle}>
          {restaurants.length > 0
            ? restaurants.map((r) => (
                <RestaurantCard key={r.restaurant_id} restaurant={r} />
              ))
            : searched && (
                <div style={emptyStyle}>
                  <div style={{ fontSize: '2rem', marginBottom: 8 }}>🔍</div>
                  <p>
                    No restaurants found for <strong>"{activeCity}"</strong>.
                  </p>
                  <p style={{ fontSize: '0.82rem', marginTop: 4 }}>
                    Try: Mumbai, Pune
                  </p>
                </div>
              )}
        </div>
      )}
    </div>
  );
}
