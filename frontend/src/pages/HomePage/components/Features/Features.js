import React from 'react';
import './Features.css';

const featuresData = [
  {
    icon: '🎉',
    label: 'Private Nights',
    title: 'Пора по-серьезному!',
    description:
      'Закажите интеллектуальный вечер, который запомнится гостям надолго. Индивидуальный сценарий, ведущий и весь реквизит — мы всё привезём.',
    cta: 'Запросить праздник',
    href: '/members',
    accent: '#7ec4f0',
  },
  {
    icon: '🧩',
    label: 'Family Fun for Kids',
    title: 'Вам не с кем оставить детей?',
    description:
      'Игровая комната с няней присмотрит за малышами (от 1,5 лет), пока вы погружаетесь в квиз. Забота о детях — на нас.',
    cta: 'Узнать про комнату',
    href: '/members',
    accent: '#a6e3bd',
  },
  {
    icon: '🏆',
    label: 'Champions League',
    title: 'Quote',
    description:
      '«После УмAZона мы стали одной командой и на работе, и в жизни». — отзыв постоянных игроков. Присоединяйтесь к сообществу победителей.',
    cta: 'Читать отзывы',
    href: '#gallery',
    accent: '#ffe19a',
  },
];

function Features() {
  return (
    <section id="features" className="features-section">
      <div className="features-wrapper">
        <div className="features-header">
          <span className="features-eyebrow">Почему именно УмAZона</span>
          <h2>Больше, чем просто квиз</h2>
          <p>
            От семейных праздников до корпоративных чемпионатов — мы создаём атмосферу, в
            которой хочется играть, делиться эмоциями и возвращаться снова.
          </p>
        </div>

        <div className="features-grid">
          {featuresData.map((feature) => (
            <article
              key={feature.title}
              className="feature-card"
              style={{ '--feature-accent': feature.accent }}
            >
              <div className="feature-icon" aria-hidden="true">
                {feature.icon}
              </div>
              <span className="feature-label">{feature.label}</span>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
              <a className="feature-link" href={feature.href}>
                {feature.cta}
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Features;