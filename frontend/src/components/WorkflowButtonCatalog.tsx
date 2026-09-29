import type React from 'react';
import { useState } from 'react';

export interface ButtonAction {
  id: string;
  buttonLabel: string;
  uiLocation: string;
  actionType: 'STORE' | 'ALTER' | 'DELETE' | 'READ';
  description: string;
  httpMethod: string;
  endpoint: string;
  targetTable: string;
  partitionKey: string;
  clusteringKey: string;
  cqlCommand: string;
  analogy: string;
}

const ACTIONS: ButtonAction[] = [
  {
    id: 'place-order',
    buttonLabel: '🛒 Place Order',
    uiLocation: 'Menu Page (Bottom Cart Summary Bar)',
    actionType: 'STORE',
    description: 'When a customer checks food dishes and clicks "Place Order", the app writes their order into Cassandra.',
    httpMethod: 'POST',
    endpoint: '/api/orders',
    targetTable: 'orders_by_user, orders_by_id, orders_by_restaurant (3-Table Dual-Write)',
    partitionKey: 'user_id in orders_by_user; order_id in orders_by_id; restaurant_id in orders_by_restaurant',
    clusteringKey: 'order_id DESC (stores newest orders first)',
    cqlCommand: `// 1. Write to user's order history notebook
INSERT INTO orders_by_user (user_id, order_id, restaurant_id, status, total)
VALUES (?, ?, ?, ?, ?);

// 2. Write to single order lookup notebook
INSERT INTO orders_by_id (order_id, user_id, restaurant_id, items, status, last_updated)
VALUES (?, ?, ?, ?, ?, ?);

// 3. Write to restaurant's revenue & order stream notebook
INSERT INTO orders_by_restaurant (restaurant_id, order_id, user_id, status, total, items, last_updated)
VALUES (?, ?, ?, ?, ?, ?, ?);`,
    analogy:
      'Imagine buying a pizza at school. The cashier writes 3 carbon-copy receipts at the same time: one for your backpack, one for the kitchen counter, and one for the principal! That way, nobody has to search through all the receipts in the school.',
  },
  {
    id: 'add-restaurant',
    buttonLabel: '➕ Create Restaurant',
    uiLocation: 'Admin Dashboard (Top Left Panel)',
    actionType: 'STORE',
    description: 'Admin enters restaurant name, city, cuisine, and rating to register a new store in Cassandra.',
    httpMethod: 'POST',
    endpoint: '/api/admin/restaurants',
    targetTable: 'restaurants_by_id & restaurants_by_city',
    partitionKey: 'restaurant_id in restaurants_by_id; city in restaurants_by_city',
    clusteringKey: 'restaurant_id ASC',
    cqlCommand: `// 1. Insert into Global Restaurant Directory (keyed by UUID)
INSERT INTO restaurants_by_id (restaurant_id, name, cuisine, city, rating)
VALUES (?, ?, ?, ?, ?);

// 2. Insert into City Browser (partitioned by City Name)
INSERT INTO restaurants_by_city (city, restaurant_id, name, cuisine, rating)
VALUES (?, ?, ?, ?, ?);`,
    analogy:
      'Imagine building a new restaurant in Delhi. You put a big shiny marker on the world map (restaurants_by_id) and also slip a delivery flyer into the Delhi city mailbox (restaurants_by_city).',
  },
  {
    id: 'edit-restaurant',
    buttonLabel: '✏️ Save Changes',
    uiLocation: 'Custom Restaurant Dashboard (Header Banner Edit Details)',
    actionType: 'ALTER',
    description: 'Updates restaurant name, cuisine, rating, or moves it to a new city. Handles partition migration safely.',
    httpMethod: 'PUT',
    endpoint: '/api/admin/restaurants/:restaurantId',
    targetTable: 'restaurants_by_id & restaurants_by_city',
    partitionKey: 'city (partition key of restaurants_by_city)',
    clusteringKey: 'restaurant_id',
    cqlCommand: `// If city changed from oldCity to newCity:
DELETE FROM restaurants_by_city 
WHERE city = oldCity AND restaurant_id = ?;

// Insert into the new city partition:
INSERT INTO restaurants_by_city (city, restaurant_id, name, cuisine, rating)
VALUES (newCity, ?, ?, ?, ?);

// Update global record:
INSERT INTO restaurants_by_id (restaurant_id, name, cuisine, city, rating)
VALUES (?, ?, ?, newCity, ?);`,
    analogy:
      'Because Cassandra organizes folders by city name, you cannot just scribble out the city name on a folder! If the store moves to Pune, Cassandra takes the flyer out of the Mumbai folder and puts it into the Pune folder.',
  },
  {
    id: 'delete-restaurant',
    buttonLabel: '🗑️ Delete Restaurant',
    uiLocation: 'Admin Dashboard (Restaurant Row Trash Icon)',
    actionType: 'DELETE',
    description: 'Permanently removes the restaurant from both Cassandra tables and cascades deletion of its menu dishes and orders.',
    httpMethod: 'DELETE',
    endpoint: '/api/admin/restaurants/:restaurantId',
    targetTable: 'restaurants_by_city, restaurants_by_id, menu_by_restaurant, orders_by_restaurant',
    partitionKey: 'city & restaurant_id',
    clusteringKey: 'restaurant_id',
    cqlCommand: `// 1. Delete from city table
DELETE FROM restaurants_by_city WHERE city = ? AND restaurant_id = ?;

// 2. Delete from global directory
DELETE FROM restaurants_by_id WHERE restaurant_id = ?;

// 3. Delete all dishes on this restaurant's menu
DELETE FROM menu_by_restaurant WHERE restaurant_id = ?;

// 4. Delete restaurant's orders
DELETE FROM orders_by_restaurant WHERE restaurant_id = ?;`,
    analogy:
      'When a restaurant closes down permanently, Cassandra shreds its city flyer, deletes it from the master phonebook, and throws away its entire printed menu.',
  },
  {
    id: 'add-menu-item',
    buttonLabel: '➕ Add Menu Item',
    uiLocation: 'Admin Menu Table / Custom Restaurant Dashboard',
    actionType: 'STORE',
    description: 'Admin adds a new dish (e.g. "Paneer Tikka", ₹250.00) with category to a specific restaurant.',
    httpMethod: 'POST',
    endpoint: '/api/admin/menu/:restaurantId',
    targetTable: 'menu_by_restaurant',
    partitionKey: 'restaurant_id',
    clusteringKey: 'item_id ASC',
    cqlCommand: `INSERT INTO menu_by_restaurant (restaurant_id, item_id, item_name, price, category)
VALUES (?, ?, ?, ?, ?);`,
    analogy:
      'The chef grabs a blank wooden clip, writes "Garlic Naan - ₹60" on it, and clips it onto that specific restaurant\'s menu board.',
  },
  {
    id: 'delete-menu-item',
    buttonLabel: '🗑️ Delete Dish',
    uiLocation: 'Admin Menu Table / Custom Restaurant Dashboard',
    actionType: 'DELETE',
    description: 'Removes a single dish from the restaurant menu using compound primary key (restaurant_id, item_id).',
    httpMethod: 'DELETE',
    endpoint: '/api/admin/menu/:restaurantId/:itemId',
    targetTable: 'menu_by_restaurant',
    partitionKey: 'restaurant_id',
    clusteringKey: 'item_id',
    cqlCommand: `DELETE FROM menu_by_restaurant 
WHERE restaurant_id = ? AND item_id = ?;`,
    analogy:
      'The chef takes off the wooden clip for that exact dish and tosses it into the recycle bin. The rest of the menu stays untouched.',
  },
  {
    id: 'search-city',
    buttonLabel: 'Search City / Chip',
    uiLocation: 'Browse Restaurants Page (/)',
    actionType: 'READ',
    description: 'Finds all restaurants situated in the selected city without scanning the whole database.',
    httpMethod: 'GET',
    endpoint: '/api/restaurants/:city',
    targetTable: 'restaurants_by_city',
    partitionKey: 'city',
    clusteringKey: 'restaurant_id ASC',
    cqlCommand: `SELECT * FROM restaurants_by_city 
WHERE city = 'Mumbai';`,
    analogy:
      'You open the drawer labeled "Mumbai" and pull out the restaurants folder. Cassandra does not look at Pune or Delhi at all!',
  },
  {
    id: 'search-dish',
    buttonLabel: '🔍 Search Dish',
    uiLocation: 'Find Dish Page (/search)',
    actionType: 'READ',
    description: 'Pre-fetches all restaurants & menus in parallel across cities and finds all places serving that dish.',
    httpMethod: 'GET',
    endpoint: '/api/restaurants/:city + /api/menu/:restaurantId',
    targetTable: 'restaurants_by_city & menu_by_restaurant',
    partitionKey: 'city in restaurants_by_city; restaurant_id in menu_by_restaurant',
    clusteringKey: 'item_id',
    cqlCommand: `// Fetches menu in parallel for each restaurant:
SELECT * FROM menu_by_restaurant 
WHERE restaurant_id = ?;`,
    analogy:
      'You shout into a walkie-talkie to all restaurant kitchens at the same time: "Who serves Butter Chicken?" and they all answer back together in half a second!',
  },
  {
    id: 'simulate-order',
    buttonLabel: '⚡ Simulate Order',
    uiLocation: 'Custom Restaurant Dashboard (Header Banner)',
    actionType: 'STORE',
    description: 'Generates a live test order in Cassandra for that restaurant and watches revenue & order count update live.',
    httpMethod: 'POST',
    endpoint: '/api/admin/restaurants/:restaurantId/demo-order',
    targetTable: 'orders_by_restaurant, orders_by_id, orders_by_user',
    partitionKey: 'restaurant_id, order_id, user_id',
    clusteringKey: 'order_id DESC',
    cqlCommand: `// Simulates a real order placed by a customer in Cassandra:
INSERT INTO orders_by_restaurant (restaurant_id, order_id, user_id, status, total, items, last_updated)
VALUES (?, ?, ?, 'PLACED', ?, ?, toTimestamp(now()));`,
    analogy:
      'A friendly robot customer rings the doorbell, orders a random dish from the menu, and hands you cash so you can test if your cash register and database are working perfectly!',
  },
  {
    id: 'cluster-health',
    buttonLabel: '🔄 Refresh Health',
    uiLocation: 'Admin Dashboard (Cassandra 3-Node Cluster Monitor)',
    actionType: 'READ',
    description: 'Pings all 3 Cassandra nodes across the Docker network to verify which nodes are UP and active.',
    httpMethod: 'GET',
    endpoint: '/api/admin/cluster',
    targetTable: 'Cassandra Driver Host Pool',
    partitionKey: 'Host IP (172.18.0.x:9042)',
    clusteringKey: 'DC1 / RACK1, RACK2, RACK3',
    cqlCommand: `// Node.js cassandra-driver heartbeats:
client.hosts.forEach(host => {
  console.log(host.address, host.datacenter, host.isUp());
});`,
    analogy:
      'A roll call in class: "Node 1?" - "Present!", "Node 2?" - "Present!", "Node 3?" - "Present!". All 3 computers are awake!',
  },
];

const badgeColors: Record<string, { bg: string; text: string; border: string }> = {
  STORE: { bg: '#f6ffed', text: '#389e0d', border: '#b7eb8f' },
  ALTER: { bg: '#e6f7ff', text: '#096dd9', border: '#91d5ff' },
  DELETE: { bg: '#fff1f0', text: '#cf1322', border: '#ffa39e' },
  READ: { bg: '#fff7e6', text: '#d46b08', border: '#ffd591' },
};

export default function WorkflowButtonCatalog() {
  const [selectedAction, setSelectedAction] = useState<ButtonAction>(ACTIONS[0]);
  const [filterType, setFilterType] = useState<string>('ALL');

  const filtered = ACTIONS.filter(
    (a) => filterType === 'ALL' || a.actionType === filterType
  );

  const colors = badgeColors[selectedAction.actionType];

  return (
    <div style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 16, padding: '24px', marginBottom: 28 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h3 style={{ margin: '0 0 4px', fontSize: '1.25rem', color: '#222' }}>
            🎮 Interactive Button-to-Database Command Inspector
          </h3>
          <p style={{ margin: 0, color: '#666', fontSize: '0.88rem' }}>
            Click any button below to see the exact Cassandra CQL command, HTTP call, and child-friendly explanation!
          </p>
        </div>

        {/* Action Type Filters */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {['ALL', 'STORE', 'ALTER', 'DELETE', 'READ'].map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setFilterType(type)}
              style={{
                background: filterType === type ? '#222' : '#f5f5f5',
                color: filterType === type ? '#fff' : '#555',
                border: 'none',
                borderRadius: 14,
                padding: '4px 12px',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Button Cards Row */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 12, marginBottom: 18 }}>
        {filtered.map((action) => {
          const isSelected = selectedAction.id === action.id;
          const c = badgeColors[action.actionType];
          return (
            <button
              key={action.id}
              type="button"
              onClick={() => setSelectedAction(action)}
              style={{
                background: isSelected ? '#fff8f7' : '#fafafa',
                border: `1.5px solid ${isSelected ? '#FF5733' : '#e0e0e0'}`,
                borderRadius: 10,
                padding: '10px 14px',
                minWidth: 160,
                textAlign: 'left',
                cursor: 'pointer',
                flexShrink: 0,
                transition: 'all 0.15s',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 6px', borderRadius: 8, background: c.bg, color: c.text, border: `1px solid ${c.border}` }}>
                  {action.actionType}
                </span>
                <span style={{ fontSize: '0.7rem', color: '#888' }}>{action.httpMethod}</span>
              </div>
              <strong style={{ fontSize: '0.88rem', color: isSelected ? '#FF5733' : '#333', display: 'block' }}>
                {action.buttonLabel}
              </strong>
            </button>
          );
        })}
      </div>

      {/* Detailed Inspection Panel */}
      <div style={{ background: '#fdfdfd', border: '1px solid #e8e8e8', borderRadius: 14, padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <h4 style={{ margin: 0, fontSize: '1.2rem', color: '#222' }}>{selectedAction.buttonLabel}</h4>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, padding: '3px 10px', borderRadius: 12, background: colors.bg, color: colors.text, border: `1px solid ${colors.border}` }}>
                {selectedAction.actionType} ACTION
              </span>
            </div>
            <span style={{ fontSize: '0.82rem', color: '#888' }}>
              📍 Located in: <strong>{selectedAction.uiLocation}</strong>
            </span>
          </div>

          <div style={{ background: '#f5f5f5', borderRadius: 8, padding: '6px 12px', fontSize: '0.82rem', fontFamily: 'monospace' }}>
            <span style={{ color: '#FF5733', fontWeight: 700 }}>{selectedAction.httpMethod}</span>{' '}
            <span style={{ color: '#333' }}>{selectedAction.endpoint}</span>
          </div>
        </div>

        <p style={{ fontSize: '0.9rem', color: '#444', lineHeight: 1.5, marginBottom: 16 }}>
          {selectedAction.description}
        </p>

        {/* 10-Year-Old Explanation Box */}
        <div style={{ background: '#fffbe6', border: '1px solid #ffe58f', borderRadius: 10, padding: '12px 16px', marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <span style={{ fontSize: '1.1rem' }}>💡</span>
            <strong style={{ fontSize: '0.88rem', color: '#874d00' }}>Explain Like I'm 10:</strong>
          </div>
          <p style={{ margin: 0, fontSize: '0.86rem', color: '#595959', lineHeight: 1.5 }}>
            {selectedAction.analogy}
          </p>
        </div>

        {/* Database Technical Breakdown */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14, marginBottom: 16 }}>
          <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 10, padding: '12px 14px' }}>
            <span style={{ fontSize: '0.75rem', color: '#888', textTransform: 'uppercase', fontWeight: 700 }}>Target Cassandra Table</span>
            <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#222', marginTop: 3 }}>
              <code>{selectedAction.targetTable}</code>
            </div>
          </div>

          <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 10, padding: '12px 14px' }}>
            <span style={{ fontSize: '0.75rem', color: '#888', textTransform: 'uppercase', fontWeight: 700 }}>Partition Key (Which Node Stores It)</span>
            <div style={{ fontSize: '0.82rem', fontWeight: 500, color: '#555', marginTop: 3 }}>
              <code>{selectedAction.partitionKey}</code>
            </div>
          </div>

          <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 10, padding: '12px 14px' }}>
            <span style={{ fontSize: '0.75rem', color: '#888', textTransform: 'uppercase', fontWeight: 700 }}>Clustering Column (How It's Sorted)</span>
            <div style={{ fontSize: '0.82rem', fontWeight: 500, color: '#555', marginTop: 3 }}>
              <code>{selectedAction.clusteringKey}</code>
            </div>
          </div>
        </div>

        {/* Actual CQL Command */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#555', textTransform: 'uppercase' }}>
              ⚡ Exact Cassandra CQL Command Executed in Cluster:
            </span>
          </div>
          <pre
            style={{
              background: '#1e1e2e',
              color: '#f8f8f2',
              borderRadius: 10,
              padding: '14px 16px',
              fontSize: '0.85rem',
              lineHeight: 1.5,
              overflowX: 'auto',
              margin: 0,
              fontFamily: 'ui-monospace, Consolas, Monaco, monospace',
            }}
          >
            {selectedAction.cqlCommand}
          </pre>
        </div>
      </div>
    </div>
  );
}
