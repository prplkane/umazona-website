import React, { useState } from 'react';
// 1. IMPORT from the new library instead of 'react-router-dom'
import { HashLink as Link } from 'react-router-hash-link'; 
import './Navbar.css';

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => {
    setMenuOpen((prev) => !prev);
  };

  const handleNavLinkClick = () => {
    setMenuOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* 2. This <Link> should point to the root page */}
        <Link to="/" className="navbar-logo" aria-label="УмAZона home">
          <span className="navbar-logo__script">Ум</span>
          <span className="navbar-logo__geo">AZ</span>
          <span className="navbar-logo__script navbar-logo__script--end">она</span>
        </Link>
        <button
          className={`navbar-toggle ${menuOpen ? 'navbar-toggle--active' : ''}`}
          type="button"
          aria-label="Toggle navigation menu"
          aria-expanded={menuOpen}
          onClick={toggleMenu}
        >
          <span />
          <span />
          <span />
        </button>

        <ul className={`nav-menu ${menuOpen ? 'nav-menu--open' : ''}`}>
          <li className="nav-item">
            {/* This still works perfectly */}
            <Link to="/" className="nav-link" onClick={handleNavLinkClick}>
              Home
            </Link>
          </li>
          <li className="nav-item">
            {/* 3. This <Link> will now work! */}
            <Link to="/#features" className="nav-link" onClick={handleNavLinkClick}>
              About
            </Link>
          </li>
          <li className="nav-item">
            {/* 4. This <Link> will also work! */}
            <Link to="/#events" className="nav-link" onClick={handleNavLinkClick}>
              Events
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/#gallery" className="nav-link nav-link--accent" onClick={handleNavLinkClick}>
              Gallery
            </Link>
          </li>
          <li className="nav-item">
            {/* 5. This <Link> to a different page will also still work! */}
            <Link to="/members" className="nav-link nav-link--accent" onClick={handleNavLinkClick}>
              Contact Us
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
}

export default Navbar;