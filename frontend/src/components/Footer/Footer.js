import React from 'react';
import './Footer.css';

const currentYear = new Date().getFullYear();

function Footer() {
  return (
    <footer className="site-footer" id="contact">
      <div className="footer-sheen" aria-hidden="true" />
      <div className="footer-content">
        <div className="footer-brand">
          <a href="#home" className="footer-logo" aria-label="Back to home">
            <span className="footer-logo-accent">U</span>MAZONA
          </a>
          <p className="footer-tagline">
            Интеллектуальные вечера, которые объединяют друзей, коллег и новые команды.
          </p>
          <div className="footer-social" aria-label="Social media">
            <a className="footer-social-link" href="https://instagram.com" target="_blank" rel="noreferrer">IG</a>
            <a className="footer-social-link" href="https://t.me" target="_blank" rel="noreferrer">TG</a>
            <a className="footer-social-link" href="https://youtube.com" target="_blank" rel="noreferrer">YT</a>
          </div>
        </div>

        <div className="footer-links">
          <div className="footer-column">
            <h4>Navigate</h4>
            <a href="#home">Home</a>
            <a href="#next-games">Next Games</a>
            <a href="#features">Why Umazonа</a>
            <a href="#extras">Extras</a>
          </div>
          <div className="footer-column">
            <h4>Plan A Night</h4>
            <a href="#next-games">Schedule &amp; Tickets</a>
            <a href="#gallery">Gallery</a>
            <a href="#extras">Mock Game</a>
            <a href="#contact">Hire Umazonа</a>
          </div>
          <div className="footer-column">
            <h4>Contact</h4>
            <p>+7 (555) 123-4567</p>
            <p>hello@umazona.com</p>
            <p>Sochi · Moscow · Remote</p>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; {currentYear} Umazonа. Crafted for unforgettable quiz nights.</p>
        <div className="footer-bottom-links">
          <a href="#gallery">Gallery</a>
          <a href="#contact">Book a private game</a>
        </div>
      </div>
    </footer>
  );
}

export default Footer;