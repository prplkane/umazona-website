import React from 'react';
import './Footer.css';

function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-container">
        <div className="footer-links">
          {/* Your prototype had footer link columns */}
          <div className="footer-column">
            <h4>About Us</h4>
            <a href="#about">Our Story</a>
            <a href="#events">Events</a>
          </div>
          <div className="footer-column">
            <h4>Explore</h4>
            <a href="#gallery">Gallery</a>
            <a href="#contact">Host an Event</a>
          </div>
          <div className="footer-column">
            <h4>Contact</h4>
            <p>Phone: (555) 123-4567</p>
            <p>Email: contact@umazona.com</p>
          </div>
        </div>
        <div className="footer-social">
          {/* You had social icons in your prototype */}
          <p>&copy; 2025 Umazona. All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;