import React, { useMemo } from 'react';
import './NextGames.css';

function NextGames({ events, loading, error }) {
  const sortedEvents = useMemo(() => {
    if (!Array.isArray(events)) {
      return [];
    }

    return [...events].sort((a, b) => {
      const dateA = new Date(a.event_date);
      const dateB = new Date(b.event_date);
      return dateA - dateB;
    });
  }, [events]);

  const nextEvent = sortedEvents[0];
  const featuredEvent = sortedEvents[1] || sortedEvents[0];

  const renderEventSummary = (event) => {
    if (!event) {
      return (
        <p className="next-games-status">Нет запланированных игр. Скоро обновим расписание!</p>
      );
    }

    const eventDate = new Date(event.event_date);
    const formattedDate = isNaN(eventDate.getTime())
      ? event.event_date
      : eventDate.toLocaleDateString(undefined, {
          weekday: 'short',
          month: 'long',
          day: 'numeric',
        });

    return (
      <>
        <h3 className="event-title">{event.event_name}</h3>
        <ul className="event-meta">
          <li>
            <span className="meta-label">Когда</span>
            <span className="meta-value">{formattedDate}</span>
          </li>
          {event.address && (
            <li>
              <span className="meta-label">Где</span>
              <span className="meta-value">{event.address}</span>
            </li>
          )}
          {event.details && (
            <li>
              <span className="meta-label">Формат</span>
              <span className="meta-value">{event.details}</span>
            </li>
          )}
        </ul>
      </>
    );
  };

  const renderNextGame = () => {
    if (loading) {
      return <p className="next-games-status">Загружаем ближайшую игру...</p>;
    }

    if (error) {
      return <p className="next-games-status error">Ошибка: {error}</p>;
    }

    return renderEventSummary(nextEvent);
  };

  const renderFeaturedGame = () => {
    if (loading) {
      return <p className="next-games-status">Подбираем лучшие игры...</p>;
    }

    if (error) {
      return <p className="next-games-status error">Ошибка: {error}</p>;
    }

    if (!featuredEvent) {
      return (
        <p className="next-games-status">Следите за обновлениями — новые игры уже скоро!</p>
      );
    }

    return (
      <>
        <span className="featured-eyebrow">Game Spotlight</span>
        {renderEventSummary(featuredEvent)}
        <a href="#contact" className="card-cta">Записаться →</a>
      </>
    );
  };

  return (
    <section id="next-games" className="next-games-section">
      <div className="next-games-header">
        <p className="section-eyebrow">Upcoming Experiences</p>
        <h2>Следующая игра уже ждёт тебя</h2>
        <p className="section-lead">
          Выбирайте формат: сыграйте с командой, посмотрите архив прошедших игр или забронируйте частное мероприятие.
        </p>
      </div>

      <div className="next-games-grid">
        <a href="#events" className="next-games-card schedule-card">
          <span className="card-eyebrow">Полное расписание</span>
          <h3>Каждый четверг и субботу — проверяй актуальные даты</h3>
          <span className="card-cta">Посмотреть все игры →</span>
        </a>

        <div className="next-games-card next-card">
          <span className="card-eyebrow">Ближайшая игра</span>
          {renderNextGame()}
          <a href="#contact" className="card-cta">Забронировать стол →</a>
        </div>

        <div className="next-games-card featured-card">
          {renderFeaturedGame()}
        </div>
      </div>
    </section>
  );
}

export default NextGames;

