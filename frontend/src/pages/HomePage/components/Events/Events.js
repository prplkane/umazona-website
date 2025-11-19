import React from 'react';
import './Events.css';

function Events({ events, loading, error }) {
  const renderEvents = () => {
    if (loading) {
      return <p className="events-status">Loading upcoming events...</p>;
    }

    if (error) {
      return <p className="events-status error">Error: {error}</p>;
    }

    if (events.length === 0) {
      return <p className="events-status">No upcoming events. Check back soon!</p>;
    }

    return (
      <div className="event-grid">
        {events.map((event, index) => {
          const parsedDate = event.event_date ? new Date(event.event_date) : null;
          const formattedDate = parsedDate && !Number.isNaN(parsedDate.getTime())
            ? parsedDate.toLocaleDateString(undefined, {
                weekday: 'short',
                month: 'long',
                day: 'numeric',
              })
            : event.event_date;

          const formattedTime = event.start_time
            ? event.start_time
            : parsedDate && !Number.isNaN(parsedDate.getTime())
            ? parsedDate.toLocaleTimeString(undefined, {
                hour: '2-digit',
                minute: '2-digit',
              })
            : null;

          const tagLabel =
            index === 0 ? 'Next up' : index === 1 ? 'Just announced' : 'Upcoming';

          return (
            <article key={event.id || `${event.event_name}-${event.event_date}`} className="event-card">
              <div className="event-card__content">
                <div className="event-card__badge">{tagLabel}</div>
                <header className="event-card__header">
                  <h3 className="event-card__title">{event.event_name}</h3>
                </header>
                <div className="event-card__body">
                  {formattedDate && (
                    <div className="event-card__row">
                      <span className="event-card__label">When</span>
                      <span className="event-card__value">
                        {formattedDate}
                        {formattedTime ? ` · ${formattedTime}` : ''}
                      </span>
                    </div>
                  )}
                  {event.address && (
                    <div className="event-card__row">
                      <span className="event-card__label">Where</span>
                      <span className="event-card__value event-card__value--link">
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.address)}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {event.address}
                        </a>
                      </span>
                    </div>
                  )}
                  {event.details && (
                    <div className="event-card__row">
                      <span className="event-card__label">Details</span>
                      <span className="event-card__value">{event.details}</span>
                    </div>
                  )}
                </div>
                <div className="event-card__footer">
                  <button
                    type="button"
                    className="event-card__cta"
                    onClick={() =>
                      window.dispatchEvent(
                        new CustomEvent('events:reserve', {
                          detail: {
                            eventName: event.event_name,
                            eventDate: formattedDate,
                            eventId: event.id,
                          },
                        })
                      )
                    }
                  >
                    Забронировать стол →
                  </button>
                </div>
              </div>
              {event.theme_image_url && (
                <div className="event-card__media">
                  <img src={event.theme_image_url} alt={`Тема игры ${event.event_name}`} />
                </div>
              )}
            </article>
          );
        })}
      </div>
    );
  };

  return (
    <section id="events" className="events-section">
      <div className="events-container">
        <div className="events-heading">
          <span className="events-eyebrow">Upcoming Experiences</span>
          <h2>Следующая игра уже ждёт тебя</h2>
          <p>
            Выбирайте формат: сыграйте с командой, посмотрите архив прошедших игр или забронируйте частное
            мероприятие.
          </p>
        </div>
        {renderEvents()}
      </div>
    </section>
  );
}

export default Events;