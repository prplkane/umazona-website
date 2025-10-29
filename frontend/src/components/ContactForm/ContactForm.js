import React, { useState } from 'react';
import './ContactForm.css'; // We'll create this file next for styles

function ContactForm() {
  // 1. Create state for each form field
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');

  // 2. Create state for loading and server response
  const [loading, setLoading] = useState(false);
  const [responseMsg, setResponseMsg] = useState(null);

  // 3. Handle the form submission
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent the browser from reloading
    setLoading(true); // Show a loading message
    setResponseMsg(null); // Clear old messages

    // Our backend API endpoint
    const endpoint = 'http://localhost:3000/api/contacts';

    // The data to send, matching our backend
    const formData = { name, email, phone, message };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        // If the server sent a 4xx or 5xx error
        throw new Error(result.error || 'Something went wrong.');
      }

      // Success!
      setResponseMsg({ success: true, text: result.message });
      // Clear the form
      setName('');
      setEmail('');
      setPhone('');
      setMessage('');
    } catch (err) {
      // Handle fetch errors or errors from our backend
      setResponseMsg({ success: false, text: err.message });
    } finally {
      setLoading(false); // Hide loading message
    }
  };

  return (
    <form onSubmit={handleSubmit} className="contact-form">
      {/* 4. Show success/error messages */}
      {responseMsg && (
        <div className={responseMsg.success ? 'msg-success' : 'msg-error'}>
          {responseMsg.text}
        </div>
      )}

      {/* 5. Form Fields */}
      <div className="form-group">
        <label htmlFor="name">Name (Required)</label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="email">Email (Required)</label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="phone">Phone (Optional)</label>
        <input
          type="tel"
          id="phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </div>

      <div className="form-group">
        <label htmlFor="message">Message (Optional)</label>
        <textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows="5"
        ></textarea>
      </div>

      {/* 6. Submit Button */}
      <button type="submit" disabled={loading}>
        {loading ? 'Submitting...' : 'Submit'}
      </button>
    </form>
  );
}

export default ContactForm;