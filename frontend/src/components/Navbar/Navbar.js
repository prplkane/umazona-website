import React from 'react';
import './Navbar.css';

function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <a href="#home" className="navbar-logo">
          {/* We can put the logo text here, or an <img> tag */}
          UMAZONA
        </a>
        <ul className="nav-menu">
          <li className="nav-item">
            <a href="#home" className="nav-link">
              Home
            </a>
          </li>
          <li className="nav-item">
            <a href="#about" className="nav-link">
              About
            </a>
          </li>
          <li className="nav-item">
            <a href="#events" className="nav-link">
              Events
            </a>
          </li>
          <li className="nav-item">
            <a href="#gallery" className="nav-link nav-link--accent">
              Gallery
            </a>
          </li>
          <li className="nav-item">
            <a href="#contact" className="nav-link nav-link--accent">
              Contact Us
            </a>
          </li>
        </ul>
      </div>
    </nav>
  );
}

export default Navbar;