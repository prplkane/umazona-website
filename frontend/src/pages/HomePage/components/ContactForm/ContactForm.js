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
          <h3>Забронируйте место для своей команды</h3>
          <p className="contact-modal__subtitle">
            Расскажите нам о команде и формате — мы подтвердим бронь, подберём комфортный стол и напомним о старте.
          </p>
          <div className="contact-modal__chips">
            {eventName && <span className="contact-modal__chip">{eventName}</span>}
            {eventDate && <span className="contact-modal__chip">{eventDate}</span>}
            <span className="contact-modal__chip contact-modal__chip--soft">Команды до 10 игроков</span>
          </div>
        </header>

        <div className="contact-modal__body">
          <section className="contact-modal__details">
            <p>
              Мы перезвоним или напишем в течение рабочего дня, уточним состав команды и закрепим бронь. Если у вас
              приватное событие — соберём индивидуальный пакет.
            </p>
            <ul className="contact-modal__highlights">
              <li>Ведём лист ожидания и помогаем подобрать ближайшую дату.</li>
              <li>Финальное подтверждение и напоминание приходят на почту.</li>
              <li>Можно указать технические пожелания: проектор, подарки, ведущий.</li>
            </ul>
          </section>

          <form onSubmit={handleSubmit} className="contact-form">
            {responseMsg && (
              <div className={responseMsg.success ? 'msg-success' : 'msg-error'}>{responseMsg.text}</div>
            )}

            <div className="contact-form__grid">
              <div className="form-group form-group--half">
                <label htmlFor="name">Имя (обязательно)</label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                />
              </div>

              <div className="form-group form-group--half">
                <label htmlFor="email">Email (обязательно)</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </div>

              <div className="form-group form-group--half">
                <label htmlFor="phone">Телефон (опционально)</label>
                <input
                  type="tel"
                  id="phone"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                />
              </div>

              <div className="form-group form-group--full">
                <label htmlFor="message">Комментарий</label>
                <textarea
                  id="message"
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  rows="5"
                />
              </div>
            </div>

            <div className="contact-form__actions">
              <p className="contact-form__note">
                Отправляя заявку, вы соглашаетесь с обработкой данных. Письмо сразу получают Катя, Дарья и Евгения —
                организаторы УмAZоны, и отвечают в течение рабочего дня.
              </p>
              <button type="submit" disabled={loading}>
                {loading ? 'Отправляем…' : 'Отправить заявку'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ContactForm;