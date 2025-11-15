import React from 'react';
import { Link } from 'react-router-dom';
import './Hero.css';
// Make sure you've added your logo to the /public folder
// or import it if it's in your /src
// import logo from './logo.png'; // Example if importing

function Hero() {
  const heroBackgroundUrl = `${process.env.PUBLIC_URL}/images/DSC_1600.JPG`;

  return (
    <section className="hero-section">
      <div
        className="hero-photo"
        style={{ backgroundImage: `url(${heroBackgroundUrl})` }}
        aria-hidden="true"
      />
      <div className="hero-content">
        
        {/* 1. The Logo */}
        <img 
          src="/images/umazona_logo_white.png" 
          alt="Логотип УмAZона" 
          className="hero-logo" 
        />
        
        {/* 2. The new "compact" text block */}
        <div className="hero-text-block">
          <h2 className="hero-heading">
            Любишь играть? Люби и играй!
          </h2>
          <p className="hero-caption">
            Интеллектуальные вечера для друзей и коллег
          </p>
        </div>
        
        {/* 3. The Button (as a Link) */}
        <Link to="/#events" className="hero-button">
          Explore Upcoming Games
        </Link>
        
      </div>
    </section>
  );
}

export default Hero;