# Frontend Build Instructions: Food Delivery App (React + Vite)

Paste this whole document into a new session (or give it to an AI coding agent) to scaffold and wire up the complete React frontend in one pass, with no follow-up questions needed.

## 0. Context

This frontend is for a food delivery web app backed by a self-managed 3-node Apache Cassandra cluster. The backend is already built, containerized, and running:

- Backend API base URL: `http://localhost:5000/api`
- Backend runs via Docker (`docker compose up -d --build backend`) — already confirmed working
- Endpoints available:
  - `GET /api/restaurants/:city` → list of restaurants in a city
  - `GET /api/menu/:restaurantId` → menu items for a restaurant
  - `POST /api/orders` → place an order. Body: `{ user_id, restaurant_id, items: [string], total: number }`. Returns `{ order_id, status }`
  - `GET /api/orders/:orderId` → single order by ID
  - `GET /api/users/:userId/orders` → order history for a user

Known test data already seeded in Cassandra:
- Restaurants: Spice Villa (Mumbai, Indian), Green Leaf Cafe (Mumbai, Continental), Sushi Zen (Pune, Japanese), Pasta Palace (Pune, Italian) — each with 3 menu items
- Test user ID to use for demos: `11111111-1111-1111-1111-111111111111`

## 1. Requirements / Constraints

- **Frontend runs locally via `npm run dev`, OUTSIDE Docker** — not containerized, not added to `docker-compose.yml`. It talks to the backend over `http://localhost:5000`.
- **Location:** new folder `frontend/` inside the project root: `C:\Users\rosha\Desktop\project\food-delivery-cassandra\frontend`
- **Stack:** React + Vite, `axios` for API calls, `react-router-dom` for routing
- **UI polish level:** bare-bones/functional — plain inline styles are fine, focus on correct wiring to the API, not visual design
- Backend already has CORS enabled (`app.use(cors())`), so no proxy config is needed — call `http://localhost:5000/api` directly from the browser.

## 2. Execute All Setup Commands (run in order, one block)

```powershell
cd C:\Users\rosha\Desktop\project\food-delivery-cassandra
npm create vite@latest frontend -- --template react
cd frontend
npm install
npm install axios react-router-dom
```

## 3. Create/Replace These Files Exactly

### `frontend/src/main.jsx`
```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
```

### `frontend/src/api.js`
```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
});

export default api;
```

### `frontend/src/App.jsx`
```jsx
import { Routes, Route, Link } from 'react-router-dom';
import RestaurantList from './pages/RestaurantList';
import Menu from './pages/Menu';
import OrderHistory from './pages/OrderHistory';

function App() {
  return (
    <div style={{ fontFamily: 'sans-serif', maxWidth: 700, margin: '0 auto', padding: 20 }}>
      <nav style={{ marginBottom: 20 }}>
        <Link to="/" style={{ marginRight: 15 }}>Restaurants</Link>
        <Link to="/orders">Order History</Link>
      </nav>
      <Routes>
        <Route path="/" element={<RestaurantList />} />
        <Route path="/menu/:restaurantId" element={<Menu />} />
        <Route path="/orders" element={<OrderHistory />} />
      </Routes>
    </div>
  );
}

export default App;
```

### `frontend/src/pages/RestaurantList.jsx`
```jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

function RestaurantList() {
  const [city, setCity] = useState('Mumbai');
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchRestaurants = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/restaurants/${city}`);
      setRestaurants(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Browse Restaurants</h2>
      <input
        value={city}
        onChange={(e) => setCity(e.target.value)}
        placeholder="City (e.g. Mumbai, Pune)"
      />
      <button onClick={fetchRestaurants} style={{ marginLeft: 8 }}>
        Search
      </button>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}

      <ul>
        {restaurants.map((r) => (
          <li key={r.restaurant_id} style={{ margin: '10px 0' }}>
            <strong>{r.name}</strong> — {r.cuisine} — ⭐ {r.rating}
            <br />
            <Link to={`/menu/${r.restaurant_id}`}>View Menu</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default RestaurantList;
```

### `frontend/src/pages/Menu.jsx`
```jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';

function Menu() {
  const { restaurantId } = useParams();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState({});
  const [userId, setUserId] = useState('11111111-1111-1111-1111-111111111111');
  const [placing, setPlacing] = useState(false);
  const [confirmation, setConfirmation] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get(`/menu/${restaurantId}`).then((res) => setItems(res.data));
  }, [restaurantId]);

  const toggleItem = (item) => {
    setSelected((prev) => {
      const next = { ...prev };
      if (next[item.item_id]) delete next[item.item_id];
      else next[item.item_id] = item;
      return next;
    });
  };

  const selectedItems = Object.values(selected);
  const total = selectedItems.reduce((sum, i) => sum + parseFloat(i.price), 0);

  const placeOrder = async () => {
    if (selectedItems.length === 0) return;
    setPlacing(true);
    setError(null);
    try {
      const res = await api.post('/orders', {
        user_id: userId,
        restaurant_id: restaurantId,
        items: selectedItems.map((i) => i.item_name),
        total: total.toFixed(2),
      });
      setConfirmation(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setPlacing(false);
    }
  };

  if (confirmation) {
    return (
      <div>
        <h2>Order Placed ✅</h2>
        <p>Order ID: {confirmation.order_id}</p>
        <p>Status: {confirmation.status}</p>
        <button onClick={() => navigate('/orders')}>View Order History</button>
      </div>
    );
  }

  return (
    <div>
      <h2>Menu</h2>
      <div style={{ marginBottom: 10 }}>
        <label>
          User ID:{' '}
          <input
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            style={{ width: 300 }}
          />
        </label>
      </div>

      <ul>
        {items.map((item) => (
          <li key={item.item_id} style={{ margin: '8px 0' }}>
            <label>
              <input
                type="checkbox"
                checked={!!selected[item.item_id]}
                onChange={() => toggleItem(item)}
              />{' '}
              {item.item_name} ({item.category}) — ₹{item.price}
            </label>
          </li>
        ))}
      </ul>

      <p><strong>Total: ₹{total.toFixed(2)}</strong></p>
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      <button onClick={placeOrder} disabled={placing || selectedItems.length === 0}>
        {placing ? 'Placing order...' : 'Place Order'}
      </button>
    </div>
  );
}

export default Menu;
```

### `frontend/src/pages/OrderHistory.jsx`
```jsx
import { useState } from 'react';
import api from '../api';

function OrderHistory() {
  const [userId, setUserId] = useState('11111111-1111-1111-1111-111111111111');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/users/${userId}/orders`);
      setOrders(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Order History</h2>
      <input
        value={userId}
        onChange={(e) => setUserId(e.target.value)}
        style={{ width: 320 }}
      />
      <button onClick={fetchOrders} style={{ marginLeft: 8 }}>
        Search
      </button>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}

      <ul>
        {orders.map((o) => (
          <li key={o.order_id} style={{ margin: '10px 0' }}>
            Order <code>{o.order_id}</code> — {o.status} — ₹{o.total}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default OrderHistory;
```

## 4. Delete Unused Vite Boilerplate (optional but recommended)

Vite's default template creates `frontend/src/App.css` and references to it, plus a default `frontend/src/assets/react.svg`. Since `App.jsx` above has no `import './App.css'` line, you can safely delete `App.css` and its import will already be absent — no action strictly needed here, but if the scaffolded `App.jsx` still has `import './App.css'` before being overwritten, that's fine since the file is fully replaced above.

## 5. Run It

```powershell
cd C:\Users\rosha\Desktop\project\food-delivery-cassandra\frontend
npm run dev
```

Open the printed URL (default `http://localhost:5173`).

## 6. Verification Checklist (execute in order, confirm each before moving to next)

1. **Restaurant list loads:** Home page shows a city input pre-filled with `Mumbai` and a Search button. Click Search → expect Spice Villa and Green Leaf Cafe to appear.
2. **City switch works:** Change input to `Pune`, click Search → expect Sushi Zen and Pasta Palace.
3. **Menu loads:** Click "View Menu" on any restaurant → expect 3 menu items with checkboxes, prices, and categories.
4. **Order placement works:** Check 1–2 items, confirm the running total updates, click "Place Order" → expect an "Order Placed ✅" confirmation screen with a real `order_id` and status `PLACED`.
5. **Order history works:** Click "View Order History" from the confirmation screen (or nav link) → with the same User ID field pre-filled, click Search → expect the just-placed order to appear in the list with matching order ID and total.
6. **No CORS errors:** Open browser dev tools console during all of the above — there should be no cross-origin errors. If any appear, the backend's CORS config needs review (should already work as-is via the backend's `app.use(cors())`).

If any step fails, capture the exact error message (terminal output and/or browser console) before proceeding — do not guess-fix silently.

## 7. Out of Scope for This Pass

Do NOT attempt in this pass (these are separate, later steps in the overall project):
- Admin dashboard / live Cassandra cluster stats UI
- Node-failure or horizontal-scaling live demo UI
- User authentication/login
- Styling polish / CSS framework integration
- Dockerizing the frontend
