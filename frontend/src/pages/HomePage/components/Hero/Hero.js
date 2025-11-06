import React from 'react';
import { Link } from 'react-router-dom';
import './Hero.css';
// Make sure you've added your logo to the /public folder
// or import it if it's in your /src
// import logo from './logo.png'; // Example if importing

function Hero() {
  return (
    <section className="hero-section">
      <div className="hero-content">
        
        {/* 1. The Logo */}
        <img 
          src="/images/umazona_logo.png" 
          alt="Umazona Logo" 
          className="hero-logo" 
        />
        
        {/* 2. The new "compact" text block */}
        <div className="hero-text-block">
          <h1 className="hero-heading">
            PLAY. LAUGH. CONQUER.
          </h1>
          <p className="hero-subheading">
            Любишь играть? Люби и играй!
          </p>
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