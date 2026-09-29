# Project Context: Self-Managed Distributed Food Delivery System (Apache Cassandra)

Paste this whole document into a new chat to continue exactly where you left off.

## 1. Project Overview

**Name:** Self-Managed Distributed Food Delivery System using Apache Cassandra

**Goal:** Demonstrate how Apache Cassandra manages data across multiple database nodes without relying on a cloud-managed database service. Build a food delivery web app (React.js + Node.js) on top of a self-managed 3-node Cassandra cluster.

**Core concepts to demonstrate:**
- Query-driven data modelling
- Partitioning
- Replication
- CQL querying
- Fault tolerance (kill a node, app keeps working)
- Horizontal scalability (add a 4th node live)

**App features planned:**
- User-facing: browse restaurants, view menus, place orders, track orders
- Admin Dashboard: live Cassandra cluster info — node status, replication, partition distribution, query performance, scalability
- Live demo: stop one node to show fault tolerance; add a new node to show horizontal scaling

**Author's background:** No prior experience with Cassandra, Docker, or distributed databases before this project — needs beginner-level, step-by-step explanations, not just command dumps.

**Environment:** Windows, PowerShell, Docker Desktop. Project folder: `C:\Users\rosha\Desktop\project\food-delivery-cassandra`

## 2. Architecture Decisions

- **3 Cassandra nodes run as Docker containers** (not separate VMs) — faster to set up, still fully legitimate for demonstrating distributed concepts.
- **Node.js backend also runs inside Docker**, joined to the *same* Docker network as the Cassandra nodes (`cassandra-net`), connecting via container hostnames (`cassandra-node1`, `cassandra-node2`, `cassandra-node3`). This was a deliberate fix: running the backend directly on Windows would try to reach Cassandra's internal peer IPs (like `172.18.0.x`), which aren't reliably reachable from the host — running everything inside Docker on one network avoids this entirely.

## 3. Current Folder Structure

```
food-delivery-cassandra/
├── docker-compose.yml
└── backend/
    ├── db.js
    ├── server.js
    ├── package.json
    └── Dockerfile
```

## 4. Current `docker-compose.yml` (full, current version — includes backend service)

```yaml
version: '3.8'

services:
  cassandra-node1:
    image: cassandra:4.1
    container_name: cassandra-node1
    hostname: cassandra-node1
    ports:
      - "9042:9042"
    environment:
      - CASSANDRA_CLUSTER_NAME=FoodDeliveryCluster
      - CASSANDRA_SEEDS=cassandra-node1
      - CASSANDRA_DC=DC1
      - CASSANDRA_RACK=RACK1
      - CASSANDRA_ENDPOINT_SNITCH=GossipingPropertyFileSnitch
      - MAX_HEAP_SIZE=512M
      - HEAP_NEWSIZE=100M
    volumes:
      - cassandra-node1-data:/var/lib/cassandra
    networks:
      - cassandra-net

  cassandra-node2:
    image: cassandra:4.1
    container_name: cassandra-node2
    hostname: cassandra-node2
    ports:
      - "9043:9042"
    environment:
      - CASSANDRA_CLUSTER_NAME=FoodDeliveryCluster
      - CASSANDRA_SEEDS=cassandra-node1
      - CASSANDRA_DC=DC1
      - CASSANDRA_RACK=RACK2
      - CASSANDRA_ENDPOINT_SNITCH=GossipingPropertyFileSnitch
      - MAX_HEAP_SIZE=512M
      - HEAP_NEWSIZE=100M
    volumes:
      - cassandra-node2-data:/var/lib/cassandra
    networks:
      - cassandra-net
    depends_on:
      - cassandra-node1

  cassandra-node3:
    image: cassandra:4.1
    container_name: cassandra-node3
    hostname: cassandra-node3
    ports:
      - "9044:9042"
    environment:
      - CASSANDRA_CLUSTER_NAME=FoodDeliveryCluster
      - CASSANDRA_SEEDS=cassandra-node1
      - CASSANDRA_DC=DC1
      - CASSANDRA_RACK=RACK3
      - CASSANDRA_ENDPOINT_SNITCH=GossipingPropertyFileSnitch
      - MAX_HEAP_SIZE=512M
      - HEAP_NEWSIZE=100M
    volumes:
      - cassandra-node3-data:/var/lib/cassandra
    networks:
      - cassandra-net
    depends_on:
      - cassandra-node1

  backend:
    build: ./backend
    container_name: food-delivery-backend
    ports:
      - "5000:5000"
    networks:
      - cassandra-net
    depends_on:
      - cassandra-node1
      - cassandra-node2
      - cassandra-node3

networks:
  cassandra-net:
    driver: bridge

volumes:
  cassandra-node1-data:
  cassandra-node2-data:
  cassandra-node3-data:
```

## 5. Backend Files (current, working versions)

### `backend/db.js`
```javascript
const cassandra = require('cassandra-driver');

// Listing ALL 3 nodes here is what lets the app survive a node going down.
// The driver auto-discovers the rest of the ring and routes around failures.
const client = new cassandra.Client({
  contactPoints: ['cassandra-node1', 'cassandra-node2', 'cassandra-node3'],
  localDataCenter: 'DC1',
  keyspace: 'food_delivery'
});

client.connect()
  .then(() => console.log('✅ Connected to Cassandra cluster'))
  .catch((err) => console.error('❌ Cassandra connection error:', err));

module.exports = client;
```

### `backend/server.js`
```javascript
const express = require('express');
const cors = require('cors');
const client = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

// Health check — confirms server is up
app.get('/', (req, res) => {
  res.json({ status: 'Backend running', message: 'Food Delivery API' });
});

// Get all restaurants in a city
app.get('/api/restaurants/:city', async (req, res) => {
  try {
    const result = await client.execute(
      'SELECT * FROM restaurants_by_city WHERE city = ?',
      [req.params.city],
      { prepare: true }
    );
    res.json(result.rows);
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

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
```

### `backend/package.json`
```json
{
  "name": "food-delivery-backend",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "cassandra-driver": "^4.7.2",
    "cors": "^2.8.5",
    "express": "^4.19.2"
  }
}
```

### `backend/Dockerfile`
```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package.json .
RUN npm install

COPY . .

EXPOSE 5000

CMD ["npm", "start"]
```

## 6. Cassandra Schema (already created and verified working)

Keyspace:
```sql
CREATE KEYSPACE food_delivery
WITH replication = {
  'class': 'NetworkTopologyStrategy',
  'DC1': 3
};
```

Tables (all created successfully):
```sql
CREATE TABLE restaurants_by_id (
  restaurant_id UUID PRIMARY KEY,
  name TEXT,
  cuisine TEXT,
  city TEXT,
  rating FLOAT
);

CREATE TABLE restaurants_by_city (
  city TEXT,
  restaurant_id UUID,
  name TEXT,
  cuisine TEXT,
  rating FLOAT,
  PRIMARY KEY (city, restaurant_id)
);

CREATE TABLE menu_by_restaurant (
  restaurant_id UUID,
  item_id UUID,
  item_name TEXT,
  price DECIMAL,
  category TEXT,
  PRIMARY KEY (restaurant_id, item_id)
);

CREATE TABLE orders_by_user (
  user_id UUID,
  order_id TIMEUUID,
  restaurant_id UUID,
  status TEXT,
  total DECIMAL,
  PRIMARY KEY (user_id, order_id)
) WITH CLUSTERING ORDER BY (order_id DESC);

CREATE TABLE orders_by_id (
  order_id TIMEUUID PRIMARY KEY,
  user_id UUID,
  restaurant_id UUID,
  items LIST<TEXT>,
  status TEXT,
  last_updated TIMESTAMP
);
```

**Test data currently in the database:**
- `restaurants_by_city` / `restaurants_by_id`: one row — Spice Villa, Indian, Mumbai, rating 4.5, `restaurant_id = e1cc25ee-9513-452c-ac08-5512c96241ad`
- `menu_by_restaurant`: one row — Butter Chicken, Main Course, ₹320.00, linked to Spice Villa's `restaurant_id`

## 7. Correct Cassandra Startup Procedure (IMPORTANT — do not skip)

Starting all 3 Cassandra nodes simultaneously with `docker compose up -d` caused a **token collision bug** (nodes generated identical tokens, refused to fully join together). The reliable method is to start Cassandra nodes one at a time with a wait between each:

```powershell
# Full clean reset if restarting Cassandra from scratch (wipes all data + saved tokens)
docker compose down -v

# Start node1 alone, wait ~45s
docker compose up -d cassandra-node1
docker exec -it cassandra-node1 nodetool status   # expect 1 node, UN

# Start node2, wait ~45s
docker compose up -d cassandra-node2
docker exec -it cassandra-node1 nodetool status   # expect 2 nodes, UN

# Start node3, wait ~45s
docker compose up -d cassandra-node3
docker exec -it cassandra-node1 nodetool status   # expect 3 nodes, UN, ~33.3% owns each
```

**This procedure was run successfully** — confirmed all 3 nodes `UN` with owns 76.0% / 59.3% / 64.7% (uneven because this was before the keyspace existed; will even out to ~33% once keyspace/table data is queried against RF=3 keyspace).

Note: if you ever run `docker compose down -v`, it wipes Cassandra's data — you'll need to recreate the keyspace and tables in Section 6, and re-run the staggered startup above, before the backend can connect again.

## 8. Issues Encountered & Fixes So Far (so they aren't repeated)

| Issue | Cause | Fix |
|---|---|---|
| `no configuration file provided: not found` | `docker-compose.yml` wasn't actually in the working folder (or had hidden `.txt` extension) | Recreated file directly via PowerShell heredoc into the correct folder |
| Each Cassandra node using ~4.3GB RAM (~13GB total across 3 nodes, near system limit) | Cassandra auto-sizes heap based on total system RAM, unaware it's sharing with 2 sibling containers | Added `MAX_HEAP_SIZE=512M` and `HEAP_NEWSIZE=100M` env vars to each service in compose file → dropped to ~1GB per node |
| `nodetool status` showed inconsistent/partial cluster views across nodes (never all 3 together) | **Token collision**: nodes started at the exact same instant via `docker compose up -d` (all together), so random token generators produced identical token sets | Full reset with `docker compose down -v`, then start Cassandra nodes **one at a time** with ~45s gaps (Section 7 procedure) |
| (Anticipated, pre-empted) Node.js on Windows host would fail to reliably reach all Cassandra nodes | Cassandra peers advertise Docker-internal IPs (e.g. `172.18.0.x`) not reliably reachable from the Windows host | Backend runs inside Docker too, joined to the same `cassandra-net` network, connects via container hostnames instead of IPs/localhost |

## 9. Current Status / Last Action Taken

Just finished creating all backend files (`db.js`, `server.js`, `package.json`, `Dockerfile`) and added the `backend` service to `docker-compose.yml`. **Not yet run/verified** — the next immediate step is:

```powershell
cd C:\Users\rosha\Desktop\project\food-delivery-cassandra
docker compose up -d --build backend
docker logs food-delivery-backend --tail 30
```

Expected success output:
```
✅ Connected to Cassandra cluster
🚀 Server running on http://localhost:5000
```

Then test with:
```powershell
curl http://localhost:5000/api/restaurants/Mumbai
```
Expected: JSON response containing the Spice Villa row.

**If this hasn't been confirmed working yet in the new session, do this verification first before moving on.**

## 10. Next Steps (in order, after backend connectivity is confirmed)

1. **Confirm backend ↔ Cassandra connectivity** (Section 9).
2. **Add more API routes** as needed: place order (`POST /api/orders`), get order status (`GET /api/orders/:orderId`), get user's order history (`GET /api/users/:userId/orders`), etc. — map each to the corresponding query-driven table from Section 6.
3. **Add more test data**: more restaurants, more menu items, sample users, sample orders — needed before the frontend has anything real to display.
4. **Build the React frontend**: restaurant browsing, menu view, order placement, order tracking. Will call the Express API (`http://localhost:5000/api/...`).
5. **Build the Admin Dashboard**: pull live cluster stats by shelling out to `nodetool status` / `nodetool cfstats <table>` from Node.js (`child_process.exec`), or via JMX/Jolokia for a more programmatic approach. Since the backend runs in Docker, shelling out to `nodetool` will need either Cassandra's CLI tools available in the backend container, or (simpler) exec into the Cassandra containers via the Docker socket, or expose a small stats endpoint from a script run against the Cassandra containers directly.
6. **Rehearse the node-failure demo**: `docker stop cassandra-node2` (or `docker compose stop cassandra-node2`), show app still works (RF=3 means data survives on the other 2 nodes), show `nodetool status` marking that node `DN`. Then `docker start cassandra-node2` to bring it back and rejoin.
7. **Rehearse the horizontal-scaling demo**: add a 4th Cassandra node service to `docker-compose.yml` with the same cluster name/seed, fresh data volume, start it **using the staggered startup approach** (start alone, wait, confirm join), and show `nodetool status` picking it up with `Owns%` rebalancing across all 4 nodes.

## 11. Key Concepts to Remember for the Report/Viva

- **Node**: one instance of Cassandra (one "cabinet" storing part of the data).
- **Gossip protocol**: how nodes discover and keep track of each other's health/state.
- **Token**: a unique numeric range assigned to a node, determining which data it's responsible for; must be unique per node (this project hit a real token-collision bug — good real-world example to mention).
- **Seed node**: the node others contact first when joining the cluster.
- **Replication factor (RF)**: how many copies of each row exist across the cluster. RF=3 on a 3-node cluster means every node has a full copy — enables the fault-tolerance demo.
- **Query-driven modelling**: unlike SQL/normalization, Cassandra tables are designed one-per-query-pattern, duplicating data across tables to make reads fast without joins (e.g. `orders_by_user` vs `orders_by_id`).
- **`nodetool status`**: the single most important command for this project — shows cluster health (`UN`=Up/Normal, `UJ`=Up/Joining, `DN`=Down/Normal), used for both debugging and live demos.
- **Why the backend runs inside Docker**: avoids host-to-container-internal-IP networking issues when the driver auto-discovers peer nodes.
