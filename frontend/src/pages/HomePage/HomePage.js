import React, { useState, useEffect } from 'react';

// components
// UPDATE THESE PATHS to be correct!
import Gallery from './components/Gallery/Gallery.js';
import NextGames from './components/NextGames/NextGames.js';
import Features from './components/Features/Features.js';
import Extras from './components/Extras/Extras.js';
import Hero from './components/Hero/Hero.js';
import Events from './components/Events/Events.js';

function HomePage() {
  // All this data-fetching logic belongs on the HomePage
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchEvents() {
      try {
        const response = await fetch('http://localhost:3000/api/events');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setEvents(data.data);
      } catch (e) {
        setError(e.message);
        console.error('Error fetching events:', e);
      } finally {
        setLoading(false);
      }
    }
    fetchEvents();
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
    </>
  );
}

export default HomePage;