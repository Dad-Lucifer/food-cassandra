import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import RestaurantList from './pages/RestaurantList';
import Menu from './pages/Menu';
import OrderHistory from './pages/OrderHistory';
import ItemSearch from './pages/ItemSearch';
import AdminDashboard from './pages/AdminDashboard';
import RestaurantCustomDashboard from './pages/RestaurantCustomDashboard';
import Workflow from './pages/Workflow';

function App() {
  return (
    <div style={{ minHeight: '100vh', background: '#f7f7f7' }}>
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<RestaurantList />} />
          <Route path="/menu/:restaurantId" element={<Menu />} />
          <Route path="/orders" element={<OrderHistory />} />
          <Route path="/search" element={<ItemSearch />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/restaurants/:restaurantId" element={<RestaurantCustomDashboard />} />
          <Route path="/workflow" element={<Workflow />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
