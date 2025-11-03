import React from 'react';
import './Hero.css'; // We'll create this

function Hero() {
  return (
    <section id="home" className="hero-section">
      <div className="hero-content">
        <img src="/Picture1.png" alt="Umazona logo" className="hero-logo" />
        <h1 className="hero-heading">Play. Laugh. Conquer.</h1>
        <p className="hero-subheading">Любишь играть? Люби и играй!</p>
        <p className="hero-caption">Интеллектуальные вечера для друзей и коллег</p>
        <a href="#events" className="hero-button">Explore Upcoming Games</a>
      </div>
    </section>
  );
}

export default Hero;