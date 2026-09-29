import type React from 'react';
import { useState, useEffect } from 'react';
import api from '../api';
import type { Restaurant, MenuItem } from '../types';
import ItemSearchResult from '../components/ItemSearchResult';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';
import AutocompleteInput from '../components/AutocompleteInput';

const KNOWN_CITIES = ['Mumbai', 'Pune'];

interface ResultEntry {
  item: MenuItem;
  restaurant: Restaurant;
}

const pageStyle: React.CSSProperties = {
  padding: '24px 20px',
  maxWidth: 680,
  margin: '0 auto',
};

const searchBoxStyle: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #e8e8e8',
  borderRadius: 14,
  padding: '20px',
  marginBottom: 24,
  boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
};

const rowStyle: React.CSSProperties = {
  display: 'flex',
  gap: 10,
  flexWrap: 'wrap',
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
  whiteSpace: 'nowrap',
  flexShrink: 0,
};

const chipRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: 8,
  marginTop: 14,
  flexWrap: 'wrap',
  alignItems: 'center',
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
  gap: 10,
};

const emptyStyle: React.CSSProperties = {
  textAlign: 'center',
  padding: '40px 0',
  color: '#999',
};

const summaryStyle: React.CSSProperties = {
  fontSize: '0.82rem',
  color: '#888',
  marginBottom: 12,
};

const suggestionHintStyle: React.CSSProperties = {
  fontSize: '0.75rem',
  color: '#aaa',
  marginTop: 6,
  display: 'flex',
  alignItems: 'center',
  gap: 4,
};

export default function ItemSearch() {
  const [query, setQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState<string>('All');
  const [results, setResults] = useState<ResultEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [lastQuery, setLastQuery] = useState('');

  // Pre-fetched data for building autocomplete suggestion pool
  const [allMenuItems, setAllMenuItems] = useState<ResultEntry[]>([]);
  const [suggestionsReady, setSuggestionsReady] = useState(false);

  // Silently pre-fetch all restaurants + menus on mount to build suggestion pool
  useEffect(() => {
    async function prefetch() {
      try {
        const restaurantArrays = await Promise.all(
          KNOWN_CITIES.map((c) =>
            api.get<Restaurant[]>(`/restaurants/${c}`).then((r) => r.data)
          )
        );
        const allRestaurants = restaurantArrays.flat();

        const menuArrays = await Promise.all(
          allRestaurants.map((r) =>
            api.get<MenuItem[]>(`/menu/${r.restaurant_id}`).then((res) => ({
              restaurant: r,
              items: res.data,
            }))
          )
        );

        const pool: ResultEntry[] = [];
        for (const { restaurant, items } of menuArrays) {
          for (const item of items) {
            pool.push({ item, restaurant });
          }
        }
        setAllMenuItems(pool);
        setSuggestionsReady(true);
      } catch {
        // silent — no suggestions if backend is unreachable
      }
    }
    prefetch();
  }, []);

  // Unique dish name suggestions (deduplicated)
  const dishSuggestions = Array.from(
    new Set(allMenuItems.map((e) => e.item.item_name))
  ).sort();

  const citiesToSearch = selectedCity === 'All' ? KNOWN_CITIES : [selectedCity];

  const handleSearch = async (overrideQuery?: string) => {
    const trimmed = (overrideQuery ?? query).trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);
    setSearched(true);
    setLastQuery(trimmed);

    try {
      // If we already have the full pool loaded, filter it directly (fast path)
      if (allMenuItems.length > 0) {
        const lowerQ = trimmed.toLowerCase();
        const matches = allMenuItems.filter(({ item, restaurant }) => {
          const cityMatch =
            selectedCity === 'All' || restaurant.city === selectedCity;
          return cityMatch && item.item_name.toLowerCase().includes(lowerQ);
        });
        setResults(matches);
        setLoading(false);
        return;
      }

      // Fallback: fetch from API (slower, used if pre-fetch hasn't finished yet)
      const restaurantArrays = await Promise.all(
        citiesToSearch.map((city) =>
          api.get<Restaurant[]>(`/restaurants/${city}`).then((r) => r.data)
        )
      );
      const allRestaurants = restaurantArrays.flat();

      const menuArrays = await Promise.all(
        allRestaurants.map((r) =>
          api.get<MenuItem[]>(`/menu/${r.restaurant_id}`).then((res) => ({
            restaurant: r,
            items: res.data,
          }))
        )
      );

      const lowerQ = trimmed.toLowerCase();
      const matches: ResultEntry[] = [];
      for (const { restaurant, items } of menuArrays) {
        for (const item of items) {
          if (item.item_name.toLowerCase().includes(lowerQ)) {
            matches.push({ item, restaurant });
          }
        }
      }
      setResults(matches);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Search failed. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  // When a suggestion is selected from dropdown, immediately search for it
  const handleSelect = (val: string) => {
    setQuery(val);
    handleSearch(val);
  };

  return (
    <div style={pageStyle}>
      <h2 style={{ marginBottom: 4, color: '#222' }}>🔍 Find a Dish</h2>
      <p style={{ color: '#888', marginBottom: 20, fontSize: '0.9rem' }}>
        Search for any menu item and see which restaurants serve it.
      </p>

      <div style={searchBoxStyle}>
        {/* Search row with autocomplete */}
        <div style={rowStyle}>
          <AutocompleteInput
            value={query}
            onChange={setQuery}
            onSelect={handleSelect}
            suggestions={dishSuggestions}
            placeholder='e.g. "Butter Chicken", "Sushi", "Pasta"…'
            onEnter={() => handleSearch()}
            autoFocus
          />
          <button style={btnStyle} onClick={() => handleSearch()} disabled={loading}>
            Search
          </button>
        </div>

        {suggestionsReady && dishSuggestions.length > 0 && (
          <p style={suggestionHintStyle}>
            ✨ {dishSuggestions.length} dishes loaded — start typing for suggestions
          </p>
        )}

        {/* City filter chips */}
        <div style={chipRowStyle}>
          <span style={{ fontSize: '0.8rem', color: '#aaa' }}>City:</span>
          {(['All', ...KNOWN_CITIES] as const).map((c) => (
            <button
              key={c}
              style={chipStyle(selectedCity === c)}
              onClick={() => setSelectedCity(c)}
            >
              {c === 'All' ? '🌐 All Cities' : `📍 ${c}`}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <Loader
          message={`Searching menus across ${selectedCity === 'All' ? 'all cities' : selectedCity}…`}
        />
      )}
      {error && <ErrorMessage message={error} />}

      {!loading && !error && searched && (
        <>
          {results.length > 0 ? (
            <>
              <p style={summaryStyle}>
                Found <strong>{results.length}</strong> result
                {results.length !== 1 ? 's' : ''} for <strong>"{lastQuery}"</strong>
                {selectedCity !== 'All' ? ` in ${selectedCity}` : ' across all cities'}
              </p>
              <div style={listStyle}>
                {results.map((r, idx) => (
                  <ItemSearchResult
                    key={`${r.item.item_id}-${idx}`}
                    item={r.item}
                    restaurant={r.restaurant}
                  />
                ))}
              </div>
            </>
          ) : (
            <div style={emptyStyle}>
              <div style={{ fontSize: '2.5rem', marginBottom: 10 }}>🍽️</div>
              <p style={{ fontWeight: 600, color: '#555', marginBottom: 4 }}>
                No dishes found for "{lastQuery}"
              </p>
              <p style={{ fontSize: '0.85rem' }}>
                Try: <em>Butter Chicken, Sushi, Pasta, Salad</em>
              </p>
            </div>
          )}
        </>
      )}

      {!searched && !loading && (
        <div style={{ ...emptyStyle, paddingTop: 20 }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>🧑‍🍳</div>
          <p style={{ fontSize: '0.9rem' }}>
            Type a dish name above and hit <strong>Search</strong>
          </p>
        </div>
      )}
    </div>
  );
}
