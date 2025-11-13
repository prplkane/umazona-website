import React, { useState, useEffect, useCallback, useMemo } from 'react';

// components
// UPDATE THESE PATHS to be correct!
import Gallery from './components/Gallery/Gallery.js';
import NextGames from './components/NextGames/NextGames.js';
import Features from './components/Features/Features.js';
import Extras from './components/Extras/Extras.js';
import Hero from './components/Hero/Hero.js';
import Events from './components/Events/Events.js';
import ContactForm from './components/ContactForm/ContactForm.js';

function HomePage() {
  // All this data-fetching logic belongs on the HomePage
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reservationOpen, setReservationOpen] = useState(false);
  const [reservationDetails, setReservationDetails] = useState({
    eventName: '',
    eventDate: '',
    eventId: null,
  });

  const apiBaseUrl = useMemo(() => {
    const base =
      process.env.REACT_APP_PUBLIC_API_BASE_URL ||
      process.env.REACT_APP_ADMIN_API_BASE_URL ||
      (process.env.NODE_ENV !== 'production' ? 'http://localhost:3000' : '');

    if (!base) {
      return '';
    }
    return base.endsWith('/') ? base.slice(0, -1) : base;
  }, []);

  const resolveMediaUrl = useCallback(
    (url) => {
      if (!url) {
        return '';
      }
      if (/^https?:\/\//i.test(url) || url.startsWith('//')) {
        return url;
      }
      if (!apiBaseUrl) {
        return url;
      }
      return `${apiBaseUrl}${url}`;
    },
    [apiBaseUrl]
  );

  const fetchEvents = useCallback(async () => {
    try {
      const url = apiBaseUrl ? `${apiBaseUrl}/api/events` : '/api/events';
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      const now = new Date();
      const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const normalized = (Array.isArray(data.data) ? data.data : [])
        .filter((event) => {
          if (!event) {
            return false;
          }
          if (event.status && String(event.status).toLowerCase() === 'completed') {
            return false;
          }
          if (!event.event_date) {
            return false;
          }
          const parsed = new Date(event.event_date);
          if (Number.isNaN(parsed.getTime())) {
            return false;
          }
          return parsed >= dayAgo;
        })
        .map((event) => ({
          ...event,
          theme_image_url: resolveMediaUrl(event.theme_image_url),
        }))
        .sort((a, b) => new Date(a.event_date) - new Date(b.event_date));

      setEvents(normalized);
      setError(null);
    } catch (e) {
      setError(e.message);
      console.error('Error fetching events:', e);
    } finally {
      setLoading(false);
    }
  }, [apiBaseUrl, resolveMediaUrl]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    const handleAdminUpdate = () => {
      setLoading(true);
      fetchEvents();
    };

    window.addEventListener('admin:next-game-updated', handleAdminUpdate);
    return () => {
      window.removeEventListener('admin:next-game-updated', handleAdminUpdate);
    };
  }, [fetchEvents]);

  useEffect(() => {
    const handleReservation = (event) => {
      const detail = event.detail || {};
      setReservationDetails({
        eventName: detail.eventName || '',
        eventDate: detail.eventDate || '',
        eventId: detail.eventId ?? null,
      });
      setReservationOpen(true);
    };

    window.addEventListener('events:reserve', handleReservation);
    return () => {
      window.removeEventListener('events:reserve', handleReservation);
    };
  }, []);

  const handleReservationClose = useCallback(() => {
    setReservationOpen(false);
    setReservationDetails({
      eventName: '',
      eventDate: '',
      eventId: null,
    });
  }, []);

  if (loading) {
    return <div className="App">Loading upcoming events...</div>;
  }
  if (error) {
    return <div className="App">Error: {error}</div>;
  }

  // We use <></> (a Fragment) because the <main> tag is now in App.js
  return (
    <>
      <Hero />
      <NextGames 
        events={events}
        loading={loading}
        error={error}
      />
      <Gallery />
      <Features />
      <Extras />
      <Events 
        events={events} 
        loading={loading} 
        error={error} 
      />
      <ContactForm
        isOpen={reservationOpen}
        onClose={handleReservationClose}
        eventName={reservationDetails.eventName}
        eventDate={reservationDetails.eventDate}
      />
    </>
  );
}

export default HomePage;