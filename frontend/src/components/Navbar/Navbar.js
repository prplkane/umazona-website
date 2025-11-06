import React from 'react';
// 1. IMPORT from the new library instead of 'react-router-dom'
import { HashLink as Link } from 'react-router-hash-link'; 
import './Navbar.css';

function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* 2. This <Link> should point to the root page */}
        <Link to="/" className="navbar-logo">
          UMAZONA
        </Link>
        <ul className="nav-menu">
          <li className="nav-item">
            {/* This still works perfectly */}
            <Link to="/" className="nav-link">
              Home
            </Link>
          </li>
          <li className="nav-item">
            {/* 3. This <Link> will now work! */}
            <Link to="/#features" className="nav-link">
              About
            </Link>
          </li>
          <li className="nav-item">
            {/* 4. This <Link> will also work! */}
            <Link to="/#events" className="nav-link">
              Events
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/#gallery" className="nav-link nav-link--accent">
              Gallery
            </Link>
          </li>
          <li className="nav-item">
            {/* 5. This <Link> to a different page will also still work! */}
            <Link to="/members" className="nav-link nav-link--accent">
              Contact Us
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
}

export default Navbar;