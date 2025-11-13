import React, { useEffect, useMemo, useState } from 'react';
import './ContactForm.css';

function ContactForm({ isOpen, onClose, eventName, eventDate }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [responseMsg, setResponseMsg] = useState(null);

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

  useEffect(() => {
    if (isOpen) {
      const parts = [];
      if (eventName) {
        parts.push(`Хотим забронировать стол на игру "${eventName}"`);
      }
      if (eventDate) {
        parts.push(`Планируемая дата: ${eventDate}`);
      }
      parts.push('Количество игроков: ');

      setMessage(parts.join('\n'));
      setResponseMsg(null);
      setLoading(false);
      return;
    }

    setName('');
    setEmail('');
    setPhone('');
    setMessage('');
    setResponseMsg(null);
  }, [eventName, eventDate, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose?.();
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setResponseMsg(null);

    const endpoint = apiBaseUrl ? `${apiBaseUrl}/api/contacts` : '/api/contacts';
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
        throw new Error(result.error || 'Что-то пошло не так.');
      }

      setResponseMsg({ success: true, text: 'Заявка отправлена! Мы свяжемся с вами в ближайшее время.' });
      setName('');
      setEmail('');
      setPhone('');

      setTimeout(() => {
        onClose?.();
      }, 1500);
    } catch (error) {
      setResponseMsg({ success: false, text: error.message });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="contact-modal-overlay" role="dialog" aria-modal="true">
      <div className="contact-modal">
        <button type="button" className="contact-modal__close" onClick={onClose} aria-label="Закрыть форму">
          ×
        </button>
        <header className="contact-modal__header">
          <span className="contact-modal__eyebrow">Reserve a Table</span>
          <h3>Забронируйте место для команды</h3>
          {eventName && (
            <p className="contact-modal__summary">
              {eventName}
              {eventDate ? ` · ${eventDate}` : ''}
            </p>
          )}
        </header>

        <form onSubmit={handleSubmit} className="contact-form">
          {responseMsg && (
            <div className={responseMsg.success ? 'msg-success' : 'msg-error'}>{responseMsg.text}</div>
          )}

          <div className="form-group">
            <label htmlFor="name">Имя (обязательно)</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email (обязательно)</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone">Телефон (опционально)</label>
            <input
              type="tel"
              id="phone"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="message">Комментарий</label>
            <textarea
              id="message"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              rows="5"
            />
          </div>

          <button type="submit" disabled={loading}>
            {loading ? 'Отправляем...' : 'Отправить заявку'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ContactForm;