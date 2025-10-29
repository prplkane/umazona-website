import React, { useState, useEffect} from "react";
import './index.css'

//components
import ContactForm from './components/ContactForm/ContactForm.js';
import Gallery from './components/Gallery/Gallery.js';
import Navbar from './components/Navbar/Navbar.js';
import Footer from './components/Footer/Footer.js';
import About from './components/About/About.js';
import Features from './components/Features/Features.js';
import Hero from './components/Hero/Hero.js';
import Events from './components/Events/Events.js';


function App() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState (null)

  useEffect(() => {
    async function fetchEvents() {
      try {
        const response = await fetch('http://localhost:3000/api/events');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setEvents(data.data);
      }
      catch (e) {
        setError(e.message);
        console.error('Error fetching events:', e);
      }
      finally {
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

  // 4. Render the page with our events
  return (
    <div className="App">
      <Navbar /> 
      <Hero />
      <main>
        <About />
        <Features />
        
        <Events 
          events={events} 
          loading={loading} 
          error={error} 
        />
        <Gallery />
        <ContactForm />
      </main>
     <Footer />
    </div>
  );
}

export default App;