import React, { useCallback } from 'react';
import './Footer.css';
import { useAdminPanel } from '../AdminPanel/AdminPanelProvider';

const currentYear = new Date().getFullYear();

function Footer() {
  const { requestOpen } = useAdminPanel();

  const handleSecretActivate = useCallback(() => {
    requestOpen();
  }, [requestOpen]);

  const handleSecretKeyDown = useCallback(
    (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        requestOpen();
      }
    },
    [requestOpen]
  );

  return (
    <footer className="site-footer" id="contact">
      <div className="footer-sheen" aria-hidden="true" />
      <div className="footer-content">
        <div className="footer-brand">
          <a href="#home" className="footer-logo" aria-label="Вернуться на главную УмAZона">
            <span className="footer-logo-script">Ум</span>
            <span className="footer-logo-geo">AZ</span>
            <span className="footer-logo-script footer-logo-script--end">она</span>
          </a>
          <button
            type="button"
            className="footer-tagline footer-secret-trigger"
            onDoubleClick={handleSecretActivate}
            onKeyDown={handleSecretKeyDown}
            aria-label="Дополнительная панель организаторов"
          >
            Любишь играть? Люби и играй!
          </button>
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
            <a href="#features">Why УмAZона</a>
            <a href="#extras">Extras</a>
          </div>
          <div className="footer-column">
            <h4>Plan A Night</h4>
            <a href="#next-games">Schedule &amp; Tickets</a>
            <a href="#gallery">Gallery</a>
            <a href="#extras">Mock Game</a>
            <button
              type="button"
              className="footer-link-button"
              onClick={() => window.dispatchEvent(new CustomEvent('extras:hire'))}
            >
              Hire УмAZона
            </button>
          </div>
          <div className="footer-column">
            <h4>Contact</h4>
            <p>+1 (415) 555-6420</p>
            <p>hello@umazona.com</p>
            <p>New York · Los Angeles · Remote</p>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; {currentYear} УмAZона. Crafted for unforgettable quiz nights.</p>
        <div className="footer-bottom-links">
          <button
            type="button"
            className="footer-link-button"
            onClick={() => window.dispatchEvent(new CustomEvent('extras:hire'))}
          >
            Book a private game
          </button>
          <a href="#gallery">Gallery</a>
        </div>
      </div>
    </footer>
  );
}

export default Footer;