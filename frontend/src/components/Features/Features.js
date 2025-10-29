import React from 'react';
import './Features.css';

// An array to hold the feature data. Easy to add/remove items.
const featuresData = [
  {
    icon: '🕒', // You can replace this with an icon image later
    title: 'Пора по-серьезному!',
    description: 'Пора по-серьезному! заказать праздник, чтобы он был, как до Гостеприимства.',
  },
  {
    icon: '👥',
    title: 'Вам не с кем оставить детей?',
    description: 'За ними присмотрит игровая комната (дети от 1,5 лет).',
  },
  {
    icon: '🏆',
    title: 'Quote',
    description: 'A third feature or quote can go here.',
  },
];

function Features() {
  return (
    <section id="features" className="features-section">
      <div className="features-container">
        {/* We map over the array to create the cards dynamically */}
        {featuresData.map((feature, index) => (
          <div className="feature-card" key={index}>
            <div className="feature-icon">{feature.icon}</div>
            <h3 className="feature-title">{feature.title}</h3>
            <p className="feature-description">{feature.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default Features;