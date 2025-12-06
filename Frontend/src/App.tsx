import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ToastProvider } from './context/ToastContext';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import About from './pages/About';
import Investors from './pages/Investors';
import Blog from './pages/Blog';
import Contact from './pages/Contact';
import Login from './pages/Login';
import Register from './pages/Register';
import Products from './pages/Products';
import ProductDetails from './pages/ProductDetails';
import Cart from './pages/Cart';
import Quote from './pages/Quote';
import AdminDashboard from './pages/AdminDashboard';
import UserDashboard from './pages/UserDashboard';
import RetailerDashboard from './pages/RetailerDashboard';
import WarrantyRegistration from './pages/WarrantyRegistration';
import RetailerInventory from './pages/RetailerInventory';
import BlogManagement from './pages/admin/BlogManagement';
import TeamManagement from './pages/admin/TeamManagement';
import EventManagement from './pages/admin/EventManagement';
import ReportManagement from './pages/admin/ReportManagement';
import PageContent from './pages/admin/PageContent';
import StatsManagement from './pages/admin/StatsManagement';
import RetailerManagement from './pages/admin/RetailerManagement';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsAndConditions from './pages/TermsAndConditions';
import SiteMap from './pages/SiteMap';

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <CartProvider>
          <Router>
            <Header />
            <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/investors" element={<Investors />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/products" element={<Products />} />
            <Route path="/product/:id" element={<ProductDetails />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/quote" element={<Quote />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/blog-management" element={<BlogManagement />} />
            <Route path="/admin/team-management" element={<TeamManagement />} />
            <Route path="/admin/event-management" element={<EventManagement />} />
            <Route path="/admin/report-management" element={<ReportManagement />} />
            <Route path="/admin/page-content" element={<PageContent />} />
            <Route path="/admin/stats-management" element={<StatsManagement />} />
            <Route path="/admin/retailer-management" element={<RetailerManagement />} />
            <Route path="/user-dashboard" element={<UserDashboard />} />
            <Route path="/retailer-dashboard" element={<RetailerDashboard />} />
            <Route path="/warranty" element={<WarrantyRegistration />} />
            <Route path="/retailer-inventory" element={<RetailerInventory />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
            <Route path="/site-map" element={<SiteMap />} />
          </Routes>
          <Footer />
        </Router>
      </CartProvider>
    </AuthProvider>
    </ToastProvider>
  );
}

export default App;
