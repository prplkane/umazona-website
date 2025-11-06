import React, { useState } from 'react'; // <-- 1. Import useState
import './Events.css';

// We "destructure" the props we're getting from App.js
function Events({ events, loading, error }) {
  // 2. Add a new state for toggling
  const [isExpanded, setIsExpanded] = useState(false);

  // 3. All the logic now lives in this component
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

    // 4. Determine which events to show
    // If not expanded, show the first 3. Otherwise, show all.
    const displayedEvents = isExpanded ? events : events.slice(0, 3);

    // 5. This is the .map() loop, same as before
    return (
      <div className="event-list">
        {displayedEvents.map((event) => (
          <div key={event.id} className="event-card">
            <h3>{event.event_name}</h3>
            <p><strong>When:</strong> {event.event_date}</p>
            {event.address && (
              <p><strong>Where:</strong> {event.address}</p>
            )}
            {event.details && (
              <p><strong>Details:</strong> {event.details}</p>
            )}
          </div>
        ))}
      </div>
    );
  };

  // 6. Handle the button click
  const handleToggle = () => {
    setIsExpanded(!isExpanded); // Toggles the state from true to false
  };

  // 7. This is the main return for the component
  return (
    <section id="events" className="events-section">
      <div className="events-container">
        <h2>Upcoming Events</h2>
        {renderEvents()}

        {/* 8. Show the button ONLY if there are more than 3 events */}
        {events.length > 3 && (
          <button onClick={handleToggle} className="show-more-button">
            {isExpanded ? 'Show Less' : 'Show More'}
          </button>
        )}
      </div>
    </section>
  );
}

export default Events;