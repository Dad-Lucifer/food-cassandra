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
