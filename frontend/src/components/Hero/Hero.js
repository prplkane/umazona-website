import React from 'react';
import './Hero.css'; // We'll create this

function Hero() {
  return (
    <section id="home" className="hero-section">
      <h1>UMAZONA</h1>
      <p>Любишь играть? Люби и играй!</p>
      {/* We're just linking to sections, so we can use regular <a> tags.
        Your prototype buttons are here.
      */}
      <a href="#events" className="hero-button">
        Расписание Будущих Игр
      </a>
      <a href="#contact" className="hero-button">
        Заказать праздник
      </a>
    </section>
  );
}

export default Hero;