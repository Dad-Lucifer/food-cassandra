const express = require('express');
const cors = require('cors');
const client = require('./db');
const { TimeUuid, Uuid, BigDecimal } = require('cassandra-driver').types;

const app = express();
app.use(cors());
app.use(express.json());

// Health check — confirms server is up
app.get('/', (req, res) => {
  res.json({ status: 'Backend running', message: 'Food Delivery API' });
});

// Helper to format restaurant rating to strictly 1 decimal place
function formatRestaurant(r) {
  if (!r) return r;
  return {
    ...r,
    rating: parseFloat(Number(r.rating || 0).toFixed(1))
  };
}

// ── USER-FACING ENDPOINTS ───────────────────────────────────────────────────

// Get all restaurants in a city
app.get('/api/restaurants/:city', async (req, res) => {
  try {
    const result = await client.execute(
      'SELECT * FROM restaurants_by_city WHERE city = ?',
      [req.params.city],
      { prepare: true }
    );
    res.json(result.rows.map(formatRestaurant));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Get menu for a restaurant
app.get('/api/menu/:restaurantId', async (req, res) => {
  try {
    const result = await client.execute(
      'SELECT * FROM menu_by_restaurant WHERE restaurant_id = ?',
      [req.params.restaurantId],
      { prepare: true }
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Place an order (writes to orders_by_user, orders_by_id, and orders_by_restaurant)
app.post('/api/orders', async (req, res) => {
  try {
    const { user_id, restaurant_id, items, total } = req.body;
    const order_id = TimeUuid.now();
    const status = 'PLACED';
    const last_updated = new Date();

    // 1. Write to orders_by_user (query pattern: get a user's orders)
    await client.execute(
      `INSERT INTO orders_by_user (user_id, order_id, restaurant_id, status, total)
       VALUES (?, ?, ?, ?, ?)`,
      [user_id, order_id, restaurant_id, status, total],
      { prepare: true }
    );

    // 2. Write to orders_by_id (query pattern: get a single order by its ID)
    await client.execute(
      `INSERT INTO orders_by_id (order_id, user_id, restaurant_id, items, status, last_updated)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [order_id, user_id, restaurant_id, items, status, last_updated],
      { prepare: true }
    );

    // 3. Write to orders_by_restaurant (query pattern: get a restaurant's order history & revenue)
    await client.execute(
      `INSERT INTO orders_by_restaurant (restaurant_id, order_id, user_id, status, total, items, last_updated)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [restaurant_id, order_id, user_id, status, total, items, last_updated],
      { prepare: true }
    );

    res.status(201).json({ order_id: order_id.toString(), status });
  } catch (err) {
    console.error('Error placing order:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get a single order by ID
app.get('/api/orders/:orderId', async (req, res) => {
  try {
    const result = await client.execute(
      'SELECT * FROM orders_by_id WHERE order_id = ?',
      [req.params.orderId],
      { prepare: true }
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Get a user's order history
app.get('/api/users/:userId/orders', async (req, res) => {
  try {
    const result = await client.execute(
      'SELECT * FROM orders_by_user WHERE user_id = ?',
      [req.params.userId],
      { prepare: true }
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ── ADMIN ENDPOINTS ─────────────────────────────────────────────────────────

// 1. Live Cassandra Cluster Health & Node Status
app.get('/api/admin/cluster', (req, res) => {
  try {
    const hosts = [];
    if (client.hosts) {
      client.hosts.forEach((host) => {
        hosts.push({
          address: host.address,
          datacenter: host.datacenter || 'DC1',
          rack: host.rack || 'RACK1',
          isUp: typeof host.isUp === 'function' ? host.isUp() : true,
          tokens: host.tokens ? host.tokens.length : 0
        });
      });
    }

    res.json({
      clusterName: 'FoodDeliveryCluster',
      keyspace: 'food_delivery',
      replication: { strategy: 'NetworkTopologyStrategy', DC1: 3 },
      nodeCount: hosts.length,
      upCount: hosts.filter((h) => h.isUp).length,
      hosts
    });
  } catch (err) {
    console.error('Error fetching cluster status:', err);
    res.status(500).json({ error: err.message });
  }
});

// 2. Get All Available Cities (across the cluster)
app.get('/api/admin/cities', async (req, res) => {
  try {
    const result = await client.execute(
      'SELECT city FROM restaurants_by_id',
      [],
      { prepare: true }
    );
    const citiesSet = new Set();
    result.rows.forEach((r) => {
      if (r.city && r.city.trim()) citiesSet.add(r.city.trim());
    });
    const cities = Array.from(citiesSet).sort();
    res.json(cities);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// 3. Get All Restaurants (with city, cuisine, rating)
app.get('/api/admin/restaurants', async (req, res) => {
  try {
    const result = await client.execute(
      'SELECT * FROM restaurants_by_id',
      [],
      { prepare: true }
    );
    const restaurants = result.rows.sort((a, b) => {
      if (a.city !== b.city) return (a.city || '').localeCompare(b.city || '');
      return (a.name || '').localeCompare(b.name || '');
    });
    res.json(restaurants.map(formatRestaurant));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// 4. Get a Single Restaurant
app.get('/api/admin/restaurants/:restaurantId', async (req, res) => {
  try {
    const result = await client.execute(
      'SELECT * FROM restaurants_by_id WHERE restaurant_id = ?',
      [req.params.restaurantId],
      { prepare: true }
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }
    res.json(formatRestaurant(result.rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// 5. Add a New Restaurant (Dual-table write to restaurants_by_id & restaurants_by_city)
app.post('/api/admin/restaurants', async (req, res) => {
  try {
    const { name, cuisine, city, rating } = req.body;
    if (!name || !city || !cuisine) {
      return res.status(400).json({ error: 'Name, cuisine, and city are required' });
    }

    const restaurant_id = Uuid.random();
    const cleanCity = city.trim();
    const cleanName = name.trim();
    const cleanCuisine = cuisine.trim();
    const numRating = parseFloat(rating) || 4.0;

    await client.execute(
      `INSERT INTO restaurants_by_id (restaurant_id, name, cuisine, city, rating)
       VALUES (?, ?, ?, ?, ?)`,
      [restaurant_id, cleanName, cleanCuisine, cleanCity, numRating],
      { prepare: true }
    );

    await client.execute(
      `INSERT INTO restaurants_by_city (city, restaurant_id, name, cuisine, rating)
       VALUES (?, ?, ?, ?, ?)`,
      [cleanCity, restaurant_id, cleanName, cleanCuisine, numRating],
      { prepare: true }
    );

    res.status(201).json({
      restaurant_id: restaurant_id.toString(),
      name: cleanName,
      cuisine: cleanCuisine,
      city: cleanCity,
      rating: numRating
    });
  } catch (err) {
    console.error('Error adding restaurant:', err);
    res.status(500).json({ error: err.message });
  }
});

// 6. Update an Existing Restaurant's Data (Handles city partition key changes safely)
app.put('/api/admin/restaurants/:restaurantId', async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { name, cuisine, city, rating } = req.body;

    if (!name || !city || !cuisine) {
      return res.status(400).json({ error: 'Name, cuisine, and city are required' });
    }

    // 1. Fetch current restaurant to inspect previous city
    const existing = await client.execute(
      'SELECT * FROM restaurants_by_id WHERE restaurant_id = ?',
      [restaurantId],
      { prepare: true }
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    const oldCity = existing.rows[0].city;
    const newCity = city.trim();
    const newName = name.trim();
    const newCuisine = cuisine.trim();
    const newRating = parseFloat(rating) || 4.0;

    // 2. If city changed, delete from old partition in restaurants_by_city
    if (oldCity.toLowerCase() !== newCity.toLowerCase()) {
      await client.execute(
        'DELETE FROM restaurants_by_city WHERE city = ? AND restaurant_id = ?',
        [oldCity, restaurantId],
        { prepare: true }
      );
    }

    // 3. Upsert into new partition in restaurants_by_city
    await client.execute(
      `INSERT INTO restaurants_by_city (city, restaurant_id, name, cuisine, rating)
       VALUES (?, ?, ?, ?, ?)`,
      [newCity, restaurantId, newName, newCuisine, newRating],
      { prepare: true }
    );

    // 4. Update in restaurants_by_id
    await client.execute(
      `INSERT INTO restaurants_by_id (restaurant_id, name, cuisine, city, rating)
       VALUES (?, ?, ?, ?, ?)`,
      [restaurantId, newName, newCuisine, newCity, newRating],
      { prepare: true }
    );

    res.json({
      restaurant_id: restaurantId,
      name: newName,
      cuisine: newCuisine,
      city: newCity,
      rating: newRating
    });
  } catch (err) {
    console.error('Error updating restaurant:', err);
    res.status(500).json({ error: err.message });
  }
});

// 7. Delete Restaurant (Cascaded delete from both restaurant tables & menus)
app.delete('/api/admin/restaurants/:restaurantId', async (req, res) => {
  try {
    const { restaurantId } = req.params;

    const lookup = await client.execute(
      'SELECT city FROM restaurants_by_id WHERE restaurant_id = ?',
      [restaurantId],
      { prepare: true }
    );

    if (lookup.rows.length === 0) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    const city = lookup.rows[0].city;

    await client.execute(
      'DELETE FROM restaurants_by_city WHERE city = ? AND restaurant_id = ?',
      [city, restaurantId],
      { prepare: true }
    );

    await client.execute(
      'DELETE FROM restaurants_by_id WHERE restaurant_id = ?',
      [restaurantId],
      { prepare: true }
    );

    await client.execute(
      'DELETE FROM menu_by_restaurant WHERE restaurant_id = ?',
      [restaurantId],
      { prepare: true }
    );

    await client.execute(
      'DELETE FROM orders_by_restaurant WHERE restaurant_id = ?',
      [restaurantId],
      { prepare: true }
    );

    res.json({
      message: 'Restaurant, menu, and orders deleted successfully',
      restaurant_id: restaurantId,
      city
    });
  } catch (err) {
    console.error('Error deleting restaurant:', err);
    res.status(500).json({ error: err.message });
  }
});

// 8. Custom Specific Restaurant Dashboard Data (Orders, Revenue, Menu & Metrics)
app.get('/api/admin/restaurants/:restaurantId/dashboard', async (req, res) => {
  try {
    const { restaurantId } = req.params;

    // 1. Fetch Restaurant details
    const restResult = await client.execute(
      'SELECT * FROM restaurants_by_id WHERE restaurant_id = ?',
      [restaurantId],
      { prepare: true }
    );

    if (restResult.rows.length === 0) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }
    const restaurant = restResult.rows[0];

    // 2. Fetch Orders for this specific restaurant
    let orders = [];
    try {
      const ordersResult = await client.execute(
        'SELECT * FROM orders_by_restaurant WHERE restaurant_id = ?',
        [restaurantId],
        { prepare: true }
      );
      orders = ordersResult.rows;
    } catch {
      orders = [];
    }

    // 3. Fetch Menu for this restaurant
    const menuResult = await client.execute(
      'SELECT * FROM menu_by_restaurant WHERE restaurant_id = ?',
      [restaurantId],
      { prepare: true }
    );
    const menu = menuResult.rows;

    // 4. Calculate Revenue & KPIs
    const totalRevenue = orders.reduce((sum, o) => sum + parseFloat(String(o.total || 0)), 0);
    const totalOrders = orders.length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    res.json({
      restaurant: formatRestaurant(restaurant),
      metrics: {
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
        totalOrders,
        avgOrderValue: parseFloat(avgOrderValue.toFixed(2)),
        menuCount: menu.length,
        rating: parseFloat(Number(restaurant.rating || 4.5).toFixed(1))
      },
      orders,
      menu
    });
  } catch (err) {
    console.error('Error fetching restaurant dashboard:', err);
    res.status(500).json({ error: err.message });
  }
});

// 9. Simulate / Place Test Order for this restaurant
app.post('/api/admin/restaurants/:restaurantId/demo-order', async (req, res) => {
  try {
    const { restaurantId } = req.params;

    // Fetch menu to pick items from
    const menuResult = await client.execute(
      'SELECT * FROM menu_by_restaurant WHERE restaurant_id = ?',
      [restaurantId],
      { prepare: true }
    );

    let items = ['Chef Special Dish'];
    let total = '250.00';

    if (menuResult.rows.length > 0) {
      const picked = menuResult.rows[Math.floor(Math.random() * menuResult.rows.length)];
      items = [picked.item_name];
      total = parseFloat(String(picked.price)).toFixed(2);
    }

    const order_id = TimeUuid.now();
    const user_id = Uuid.random();
    const status = 'PLACED';
    const last_updated = new Date();

    await client.execute(
      `INSERT INTO orders_by_user (user_id, order_id, restaurant_id, status, total)
       VALUES (?, ?, ?, ?, ?)`,
      [user_id, order_id, restaurantId, status, total],
      { prepare: true }
    );

    await client.execute(
      `INSERT INTO orders_by_id (order_id, user_id, restaurant_id, items, status, last_updated)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [order_id, user_id, restaurantId, items, status, last_updated],
      { prepare: true }
    );

    await client.execute(
      `INSERT INTO orders_by_restaurant (restaurant_id, order_id, user_id, status, total, items, last_updated)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [restaurantId, order_id, user_id, status, total, items, last_updated],
      { prepare: true }
    );

    res.status(201).json({
      order_id: order_id.toString(),
      user_id: user_id.toString(),
      restaurant_id: restaurantId,
      items,
      total,
      status,
      last_updated
    });
  } catch (err) {
    console.error('Error generating demo order:', err);
    res.status(500).json({ error: err.message });
  }
});

// 10. Add Menu Item to Restaurant
app.post('/api/admin/menu/:restaurantId', async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { item_name, category, price } = req.body;

    if (!item_name || !category || price === undefined) {
      return res.status(400).json({ error: 'item_name, category, and price are required' });
    }

    const item_id = Uuid.random();
    const cleanName = item_name.trim();
    const cleanCategory = category.trim();
    const numPrice = parseFloat(price) || 0;
    const decimalPrice = BigDecimal.fromString(numPrice.toFixed(2));

    await client.execute(
      `INSERT INTO menu_by_restaurant (restaurant_id, item_id, item_name, price, category)
       VALUES (?, ?, ?, ?, ?)`,
      [restaurantId, item_id, cleanName, decimalPrice, cleanCategory],
      { prepare: true }
    );

    res.status(201).json({
      restaurant_id: restaurantId,
      item_id: item_id.toString(),
      item_name: cleanName,
      category: cleanCategory,
      price: numPrice.toFixed(2)
    });
  } catch (err) {
    console.error('Error adding menu item:', err);
    res.status(500).json({ error: err.message });
  }
});

// 11. Delete Menu Item from Restaurant
app.delete('/api/admin/menu/:restaurantId/:itemId', async (req, res) => {
  try {
    const { restaurantId, itemId } = req.params;

    await client.execute(
      'DELETE FROM menu_by_restaurant WHERE restaurant_id = ? AND item_id = ?',
      [restaurantId, itemId],
      { prepare: true }
    );

    res.json({
      message: 'Menu item deleted successfully',
      restaurant_id: restaurantId,
      item_id: itemId
    });
  } catch (err) {
    console.error('Error deleting menu item:', err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});