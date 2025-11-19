import React, { useEffect, useMemo, useState } from 'react';
import './HireForm.css';

const ORGANIZER_EMAILS = [
  'letterforkate@gmail.com',
  'daria.belkina@gmail.com',
  'eugeniashpunt55@gmail.com',
];

function HireForm({ isOpen, onClose }) {
  const [company, setCompany] = useState('');
  const [contact, setContact] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [format, setFormat] = useState('');
  const [expectations, setExpectations] = useState('');
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
      setResponseMsg(null);
      setLoading(false);
      return;
    }

    setCompany('');
    setContact('');
    setEmail('');
    setPhone('');
    setFormat('');
    setExpectations('');
    setResponseMsg(null);
  }, [isOpen]);

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
    const formData = {
      name: contact || company,
      email,
      phone,
      message: [
        `Компания / бренд: ${company || 'не указано'}`,
        `Контактное лицо: ${contact || 'не указано'}`,
        `Формат / город / дата: ${format || 'не указано'}`,
        '',
        'Ожидания:',
        expectations || '(не заполнено)',
        '',
        `Отправить презентацию организаторам: ${ORGANIZER_EMAILS.join(', ')}`,
      ].join('\n'),
    };

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

      setResponseMsg({
        success: true,
        text: 'Спасибо! Мы получили запрос и свяжемся в течение рабочего дня.',
      });
      setCompany('');
      setContact('');
      setEmail('');
      setPhone('');
      setFormat('');
      setExpectations('');

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
    <div className="hire-modal-overlay" role="dialog" aria-modal="true">
      <div className="hire-modal">
        <button type="button" className="hire-modal__close" onClick={onClose} aria-label="Закрыть форму">
          ×
        </button>

        <header className="hire-modal__header">
          <span className="hire-modal__eyebrow">Corporate / Private</span>
          <h3>Нанять УмAZону</h3>
          <p>
            Создадим фирменный квиз под ваш бренд: сценарий, ведущий, призы и техническая команда — полный VIP-сервис. Команда
            ответит в течение рабочего дня.
          </p>
          <div className="hire-modal__chips">
            <span className="hire-modal__chip">Бренды</span>
            <span className="hire-modal__chip">HR / тимбилдинг</span>
            <span className="hire-modal__chip hire-modal__chip--soft">Ивенты на 20–500 участников</span>
          </div>
        </header>

        <form onSubmit={handleSubmit} className="hire-form">
          {responseMsg && (
            <div className={responseMsg.success ? 'hire-msg hire-msg--success' : 'hire-msg hire-msg--error'}>
              {responseMsg.text}
            </div>
          )}

          <div className="hire-form__grid">
            <label className="hire-form__group">
              <span>Компания / бренд</span>
              <input
                type="text"
                value={company}
                onChange={(event) => setCompany(event.target.value)}
                placeholder="Например, «Techvoyage»"
              />
            </label>

            <label className="hire-form__group">
              <span>Контактное лицо</span>
              <input
                type="text"
                value={contact}
                onChange={(event) => setContact(event.target.value)}
                placeholder="Имя и должность"
                required
              />
            </label>

            <label className="hire-form__group">
              <span>Email</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Ваш рабочий email"
                required
              />
            </label>

            <label className="hire-form__group">
              <span>Телефон</span>
              <input
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="+7 (___) ___-__-__"
              />
            </label>
          </div>

          <label className="hire-form__group hire-form__group--full">
            <span>Формат, город, желаемая дата</span>
            <input
              type="text"
              value={format}
              onChange={(event) => setFormat(event.target.value)}
              placeholder="Например, «Сан-Франциско, корпоративный вечер, 15 декабря»"
            />
          </label>

          <label className="hire-form__group hire-form__group--full">
            <span>Чего вы ждёте от квиза?</span>
            <textarea
              rows="4"
              value={expectations}
              onChange={(event) => setExpectations(event.target.value)}
              placeholder="Количество гостей, задачи и идеи — мы всё учтём."
            />
          </label>

          <div className="hire-form__actions">
            <p className="hire-form__note">
              Письмо получат {ORGANIZER_EMAILS.join(', ')} — организаторы УмAZоны.
            </p>
            <button type="submit" disabled={loading}>
              {loading ? 'Отправляем…' : 'Отправить запрос'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default HireForm;

