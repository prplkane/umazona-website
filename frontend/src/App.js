import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';

// Import SHARED components
import Navbar from './components/Navbar/Navbar.js';
import Footer from './components/Footer/Footer.js';
import { AdminPanelProvider } from './components/AdminPanel/AdminPanelProvider.js';

// Import PAGE components
import HomePage from './pages/HomePage/HomePage.js';
import MembersPage from './pages/MembersPage/MembersPage.js'; // This is your "Contact" page
import GalleryPage from './pages/GalleryPage/GalleryPage.js';

function App() {
  return (
    <AdminPanelProvider>
      <div className="App">
        {/* BrowserRouter wraps your entire app */}
        <BrowserRouter>
          <Navbar />

          <main>
            {/* Routes handles the page switching */}
            <Routes>
              {/* Route 1: The Home Page */}
              <Route path="/" element={<HomePage />} />
              <Route path="/gallery/:folderId" element={<GalleryPage />} />

              {/* Route 2: The Members/Contact Page */}
              <Route path="/members" element={<MembersPage />} />
            </Routes>
          </main>

          <Footer />
        </BrowserRouter>
      </div>
    </AdminPanelProvider>
  );
}

export default App;