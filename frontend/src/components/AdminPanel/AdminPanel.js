import React, { useState, useEffect, useMemo, useCallback } from 'react';
import './AdminPanel.css';

const WEEKDAY_LABELS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const CLOCK_LABELS = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const HOUR_OPTIONS = Array.from({ length: 24 }, (_, index) => index);
const MINUTE_OPTIONS = Array.from({ length: 60 }, (_, index) => index);

const parseTimeValue = (value) => {
  if (!value || typeof value !== 'string') {
    return { hours: 19, minutes: 0 };
  }
  const [hoursStr, minutesStr] = value.split(':');
  const hours = Number.parseInt(hoursStr, 10);
  const minutes = Number.parseInt(minutesStr, 10);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return { hours: 19, minutes: 0 };
  }
  return {
    hours: Math.min(Math.max(hours, 0), 23),
    minutes: Math.min(Math.max(minutes, 0), 59),
  };
};

const formatTimeString = (hours, minutes) =>
  `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

const formatDateInputValue = (date) =>
  `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date
    .getDate()
    .toString()
    .padStart(2, '0')}`;

const parseInputDateValue = (value) => {
  if (!value || typeof value !== 'string') {
    return null;
  }
  const parts = value.split('-').map((segment) => Number.parseInt(segment, 10));
  if (parts.length !== 3 || parts.some((segment) => Number.isNaN(segment))) {
    return null;
  }
  const [year, month, day] = parts;
  return new Date(year, month - 1, day);
};

const stripTime = (date) => {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

const isSameDay = (first, second) =>
  stripTime(first).getTime() === stripTime(second).getTime();

const isBeforeDay = (first, second) =>
  stripTime(first).getTime() < stripTime(second).getTime();

const buildCalendarMatrix = (cursorDate) => {
  const startOfMonth = new Date(cursorDate.getFullYear(), cursorDate.getMonth(), 1);
  const totalDays = new Date(cursorDate.getFullYear(), cursorDate.getMonth() + 1, 0).getDate();
  const firstWeekday = (startOfMonth.getDay() + 6) % 7; // convert Sunday(0) to 6

  const cells = [];
  for (let i = 0; i < firstWeekday; i += 1) {
    cells.push(null);
  }
  for (let day = 1; day <= totalDays; day += 1) {
    cells.push(new Date(cursorDate.getFullYear(), cursorDate.getMonth(), day));
  }
  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }
  return weeks;
};

const API_BASE_URL =
  (process.env.REACT_APP_ADMIN_API_BASE_URL ||
    process.env.REACT_APP_API_BASE_URL ||
    'http://localhost:3000').replace(/\/$/, '');

const API_ENDPOINT = process.env.REACT_APP_ADMIN_API_ENDPOINT || '/api/admin/next-game';
const ADMIN_UPLOAD_ENDPOINT = process.env.REACT_APP_ADMIN_UPLOAD_ENDPOINT || '/api/admin/upload-theme';
const ADMIN_EVENTS_ENDPOINT = process.env.REACT_APP_ADMIN_EVENTS_ENDPOINT || '/api/admin/events';
const ADMIN_API_TOKEN = process.env.REACT_APP_ADMIN_API_TOKEN;

const emptyForm = {
  event_name: '',
  event_date: '',
  start_time: '',
  address: '',
  details: '',
  theme_image_url: '',
  notes: '',
  status: 'upcoming',
};

function AdminPanel({ isOpen, onClose }) {
  const [form, setForm] = useState(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [panelMode, setPanelMode] = useState('create');
  const [eventsList, setEventsList] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsError, setEventsError] = useState(null);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setForm(emptyForm);
      setStatus(null);
      setUploadError(null);
      setUploading(false);
      setPanelMode('create');
      setSelectedEventId(null);
      return;
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const submitUrl = useMemo(() => {
    if (!API_ENDPOINT.startsWith('/')) {
      return `${API_BASE_URL}/${API_ENDPOINT}`;
    }
    return `${API_BASE_URL}${API_ENDPOINT}`;
  }, []);

  const uploadUrl = useMemo(() => {
    if (!ADMIN_UPLOAD_ENDPOINT.startsWith('/')) {
      return `${API_BASE_URL}/${ADMIN_UPLOAD_ENDPOINT}`;
    }
    return `${API_BASE_URL}${ADMIN_UPLOAD_ENDPOINT}`;
  }, []);

  const adminEventsUrl = useMemo(() => {
    if (!ADMIN_EVENTS_ENDPOINT.startsWith('/')) {
      return `${API_BASE_URL}/${ADMIN_EVENTS_ENDPOINT}`;
    }
    return `${API_BASE_URL}${ADMIN_EVENTS_ENDPOINT}`;
  }, []);

  const resolveAssetUrl = useCallback((url) => {
    if (!url) {
      return '';
    }
    if (/^https?:\/\//i.test(url) || url.startsWith('//')) {
      return url;
    }
    return `${API_BASE_URL}${url}`;
  }, []);

  const formatOptionDate = useCallback((iso) => {
    if (!iso) {
      return '';
    }

    const parsed = new Date(iso);
    if (Number.isNaN(parsed.getTime())) {
      return iso;
    }

    return parsed.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
  }, []);

  const fetchEventsList = useCallback(async () => {
    setEventsLoading(true);
    setEventsError(null);
    try {
      const headers = {};
      if (ADMIN_API_TOKEN) {
        headers['x-admin-token'] = ADMIN_API_TOKEN;
      }

      const response = await fetch(adminEventsUrl, {
        headers,
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || `Не удалось получить список событий (${response.status}).`);
      }

      const rows = Array.isArray(result.data) ? result.data : [];
      setEventsList(rows);
    } catch (error) {
      setEventsError(error.message || 'Не удалось получить список событий.');
      setEventsList([]);
    } finally {
      setEventsLoading(false);
    }
  }, [adminEventsUrl]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const parsedEventDate = useMemo(() => parseInputDateValue(form.event_date), [form.event_date]);

  const minEventDate = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  }, []);

  const [calendarCursor, setCalendarCursor] = useState(
    () => stripTime(parsedEventDate || minEventDate)
  );

  useEffect(() => {
    setCalendarCursor(stripTime(parsedEventDate || minEventDate));
  }, [parsedEventDate, minEventDate]);

  const calendarMatrix = useMemo(
    () => buildCalendarMatrix(calendarCursor),
    [calendarCursor]
  );

  const calendarLabel = useMemo(
    () =>
      calendarCursor.toLocaleDateString('ru-RU', {
        month: 'long',
        year: 'numeric',
      }),
    [calendarCursor]
  );

  const monthIndex = calendarCursor.getFullYear() * 12 + calendarCursor.getMonth();
  const minMonthIndex = minEventDate.getFullYear() * 12 + minEventDate.getMonth();
  const isPrevMonthDisabled = monthIndex <= minMonthIndex;

  const handleMonthStep = useCallback(
    (step) => {
      setCalendarCursor((prev) => {
        const updated = new Date(prev.getFullYear(), prev.getMonth() + step, 1);
        const minMonth = new Date(minEventDate.getFullYear(), minEventDate.getMonth(), 1);
        return updated < minMonth ? minMonth : updated;
      });
    },
    [minEventDate]
  );

  const handleDateSelect = useCallback((value) => {
    setForm((prev) => ({
      ...prev,
      event_date: value ? formatDateInputValue(value) : '',
    }));
    if (value) {
      setCalendarCursor(stripTime(value));
    }
  }, []);

  const timeParts = useMemo(() => parseTimeValue(form.start_time), [form.start_time]);

  const setTimeFromParts = useCallback((hours, minutes) => {
    setForm((prev) => ({
      ...prev,
      start_time: formatTimeString(hours, minutes),
    }));
  }, []);

  const shiftMinutes = useCallback((delta) => {
    setForm((prev) => {
      const { hours, minutes } = parseTimeValue(prev.start_time);
      const totalMinutes = hours * 60 + minutes + delta;
      const normalized = ((totalMinutes % (24 * 60)) + 24 * 60) % (24 * 60);
      const nextHours = Math.floor(normalized / 60);
      const nextMinutes = normalized % 60;
      return {
        ...prev,
        start_time: formatTimeString(nextHours, nextMinutes),
      };
    });
  }, []);

  const handleSetNow = useCallback(() => {
    const now = new Date();
    setTimeFromParts(now.getHours(), now.getMinutes());
  }, [setTimeFromParts]);

  const hourRotation = useMemo(
    () => ((timeParts.hours % 12) + timeParts.minutes / 60) * 30,
    [timeParts.hours, timeParts.minutes]
  );
  const minuteRotation = useMemo(
    () => timeParts.minutes * 6,
    [timeParts.minutes]
  );

  const populateFormFromEvent = useCallback((event) => {
    if (!event) {
      return;
    }

    let dateValue = '';
    if (event.event_date) {
      const parsed = new Date(event.event_date);
      if (!Number.isNaN(parsed.getTime())) {
        dateValue = parsed.toISOString().slice(0, 10);
      }
    }

    setForm({
      event_name: event.event_name || '',
      event_date: dateValue,
      start_time: event.start_time || '',
      address: event.address || '',
      details: event.details || '',
      theme_image_url: event.theme_image_url || '',
      notes: event.notes || '',
      status: event.status || 'upcoming',
    });
    setUploadError(null);
    setStatus(null);
  }, []);

  const handleModeChange = useCallback(
    (mode) => {
      setPanelMode(mode);
      setStatus(null);
      setUploadError(null);
      if (mode === 'create') {
        setForm(emptyForm);
        setSelectedEventId(null);
        setConfirmDelete(false);
      } else if (mode === 'edit') {
        fetchEventsList();
        if (eventsList.length > 0) {
          const first = eventsList[0];
          setSelectedEventId(first.id);
          populateFormFromEvent(first);
        } else {
          setSelectedEventId(null);
          setForm(emptyForm);
        }
        setConfirmDelete(false);
      }
    },
    [eventsList, populateFormFromEvent, fetchEventsList]
  );

  const handleSelectEvent = useCallback(
    (event) => {
      const value = event.target.value;
      if (!value) {
        setSelectedEventId(null);
        setForm(emptyForm);
        return;
      }

      const id = Number.parseInt(value, 10);
      setSelectedEventId(id);
      const selected = eventsList.find((item) => item.id === id);
      if (selected) {
        populateFormFromEvent(selected);
      }
      setConfirmDelete(false);
    },
    [eventsList, populateFormFromEvent]
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    fetchEventsList();
  }, [isOpen, fetchEventsList]);

  useEffect(() => {
    if (!isOpen || panelMode !== 'edit') {
      return;
    }

    if (!selectedEventId && eventsList.length > 0) {
      const first = eventsList[0];
      setSelectedEventId(first.id);
      populateFormFromEvent(first);
    }
  }, [isOpen, panelMode, eventsList, selectedEventId, populateFormFromEvent]);

  const handleThemeFileChange = async (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) {
      return;
    }

    setUploading(true);
    setUploadError(null);
    setStatus(null);

    const formData = new FormData();
    formData.append('theme', file);

    try {
      const headers = {};
      if (ADMIN_API_TOKEN) {
        headers['x-admin-token'] = ADMIN_API_TOKEN;
      }

      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers,
        body: formData,
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || `Не удалось загрузить изображение (${response.status}).`);
      }

      setForm((prev) => ({
        ...prev,
        theme_image_url: result.url,
      }));
      setStatus({
        type: 'success',
        message: 'Изображение загружено. Не забудьте сохранить событие.',
      });
    } catch (error) {
      setUploadError(error.message || 'Произошла ошибка при загрузке изображения.');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const handleRemoveTheme = () => {
    setForm((prev) => ({
      ...prev,
      theme_image_url: '',
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus(null);

    const trimmedName = form.event_name.trim();
    if (!trimmedName) {
      setStatus({
        type: 'error',
        message: 'Укажите название события, чтобы сохранить изменения.',
      });
      return;
    }

    if (!form.event_date) {
      setStatus({
        type: 'error',
        message: 'Выберите дату проведения события.',
      });
      return;
    }

    const parsedDate = parseInputDateValue(form.event_date);
    if (!parsedDate || Number.isNaN(parsedDate.getTime())) {
      setStatus({
        type: 'error',
        message: 'Дата события указана в неверном формате.',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        event_name: trimmedName,
        event_date: parsedDate.toISOString(),
        start_time: form.start_time || null,
        address: form.address || null,
        details: form.details || null,
        theme_image_url: form.theme_image_url || null,
        notes: form.notes || null,
        status: form.status || 'upcoming',
      };

      const headers = {
        'Content-Type': 'application/json',
      };
      if (ADMIN_API_TOKEN) {
        headers['x-admin-token'] = ADMIN_API_TOKEN;
      }

      let response;
      let result;

      if (panelMode === 'edit' && selectedEventId) {
        response = await fetch(`${adminEventsUrl}/${selectedEventId}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(payload),
        });
        result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || `Не удалось обновить событие (${response.status}).`);
        }

        if (result && result.data) {
          populateFormFromEvent(result.data);
        }

        setStatus({
          type: 'success',
          message: 'Событие обновлено.',
        });
      } else {
        response = await fetch(submitUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const message = await response.text();
          throw new Error(message || `Запрос отклонён: ${response.status}`);
        }

        setStatus({
          type: 'success',
          message: 'Событие добавлено. Обновите страницу, чтобы увидеть изменения.',
        });
        setForm(emptyForm);
      }

      await fetchEventsList();
      window.dispatchEvent(new CustomEvent('admin:next-game-updated'));
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.message || 'Не удалось сохранить данные. Попробуйте ещё раз.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const themePreviewUrl = resolveAssetUrl(form.theme_image_url);

  const handleDeleteEvent = async () => {
    if (!selectedEventId) {
      return;
    }

    setIsSubmitting(true);
    setStatus(null);
    try {
      const headers = {};
      if (ADMIN_API_TOKEN) {
        headers['x-admin-token'] = ADMIN_API_TOKEN;
      }

      const response = await fetch(`${adminEventsUrl}/${selectedEventId}`, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || `Не удалось удалить событие (${response.status}).`);
      }

      setStatus({
        type: 'success',
        message: 'Событие удалено.',
      });

      await fetchEventsList();
      setSelectedEventId(null);
      setForm(emptyForm);
      setConfirmDelete(false);
      window.dispatchEvent(new CustomEvent('admin:next-game-updated'));
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.message || 'Не удалось удалить событие.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="admin-panel-overlay" role="dialog" aria-modal="true" aria-labelledby="admin-panel-title">
      <div className="admin-panel">
        <div className="admin-panel__header">
          <h2 id="admin-panel-title">Редактор следующей игры</h2>
          <button type="button" className="admin-panel__close" onClick={onClose} aria-label="Закрыть панель">
            ×
          </button>
        </div>

        <p className="admin-panel__subtitle">
          Заполните информацию о следующем мероприятии и сохраните. Данные отправятся на служебную конечную точку.
        </p>

        <form className="admin-panel__form" onSubmit={handleSubmit}>
          <div className="admin-panel__mode">
            <button
              type="button"
              className={`admin-panel__mode-button ${panelMode === 'create' ? 'is-active' : ''}`}
              onClick={() => handleModeChange('create')}
            >
              Добавить событие
            </button>
            <button
              type="button"
              className={`admin-panel__mode-button ${panelMode === 'edit' ? 'is-active' : ''}`}
              onClick={() => handleModeChange('edit')}
            >
              Редактировать событие
            </button>
          </div>

          {panelMode === 'edit' && (
            <div className="admin-panel__field">
              <span>Выберите событие</span>
              {eventsLoading ? (
                <p className="admin-panel__info">Загружаем список…</p>
              ) : eventsList.length > 0 ? (
                <select value={selectedEventId ?? ''} onChange={handleSelectEvent}>
                  <option value="">— Выберите событие —</option>
                  {eventsList.map((event) => (
                    <option key={event.id} value={event.id}>
                      {event.event_name}
                      {event.event_date ? ` · ${formatOptionDate(event.event_date)}` : ''}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="admin-panel__info">Событий пока нет. Добавьте новое.</p>
              )}
              {eventsError && <p className="admin-panel__file-error">{eventsError}</p>}
            </div>
          )}

          <div className="admin-panel__fieldset">
            <div className="admin-panel__fieldset-head">
              <p className="admin-panel__fieldset-title">Основные параметры</p>
              <p className="admin-panel__fieldset-hint">Название, дата и статус вечеринки.</p>
            </div>
            <div className="admin-panel__grid admin-panel__grid--two">
              <label className="admin-panel__field admin-panel__field--full">
                <span>Название события</span>
                <input
                  type="text"
                  name="event_name"
                  value={form.event_name}
                  onChange={handleChange}
                  placeholder="Например, «Квиз #125 — Космический»"
                  required
                />
              </label>

              <label className="admin-panel__field admin-panel__field--calendar">
                <span>Дата события</span>
                <div className="admin-panel__calendar">
                  <div className="admin-panel__calendar-header">
                    <button
                      type="button"
                      className="admin-panel__calendar-nav"
                      onClick={() => handleMonthStep(-1)}
                      disabled={isPrevMonthDisabled}
                      aria-label="Предыдущий месяц"
                    >
                      ‹
                    </button>
                    <strong>{calendarLabel}</strong>
                    <button
                      type="button"
                      className="admin-panel__calendar-nav"
                      onClick={() => handleMonthStep(1)}
                      aria-label="Следующий месяц"
                    >
                      ›
                    </button>
                  </div>
                  <div className="admin-panel__calendar-grid admin-panel__calendar-grid--labels">
                    {WEEKDAY_LABELS.map((label) => (
                      <span key={label}>{label}</span>
                    ))}
                  </div>
                  <div className="admin-panel__calendar-grid" role="grid">
                    {calendarMatrix.map((week, weekIndex) =>
                      week.map((cell, cellIndex) => {
                        const key = `${weekIndex}-${cellIndex}-${cell ? cell.getDate() : 'empty'}`;
                        if (!cell) {
                          return <span key={key} className="admin-panel__calendar-placeholder" />;
                        }
                        const disabled = isBeforeDay(cell, minEventDate);
                        const selected = parsedEventDate && isSameDay(cell, parsedEventDate);
                        const isToday = isSameDay(cell, minEventDate);
                        return (
                          <button
                            type="button"
                            key={key}
                            className={`admin-panel__calendar-day ${
                              selected ? 'is-selected' : ''
                            } ${isToday ? 'is-today' : ''}`}
                            onClick={() => handleDateSelect(cell)}
                            disabled={disabled}
                            aria-pressed={selected}
                          >
                            {cell.getDate()}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              </label>

              <label className="admin-panel__field admin-panel__field--time">
                <span>Время начала</span>
                <div className="admin-panel__time-field">
                  <div className="admin-panel__clock">
                    <div className="admin-panel__clock-face">
                      <span
                        className="admin-panel__clock-hand admin-panel__clock-hand--hour"
                        style={{ '--rotation': `${hourRotation}deg` }}
                      />
                      <span
                        className="admin-panel__clock-hand admin-panel__clock-hand--minute"
                        style={{ '--rotation': `${minuteRotation}deg` }}
                      />
                      {CLOCK_LABELS.map((label, index) => (
                        <span
                          key={`mark-${index}`}
                          className="admin-panel__clock-mark"
                          style={{ '--rotation': `${index * 30}deg` }}
                        >
                          {label}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="admin-panel__time-controls">
                    <div className="admin-panel__time-selects">
                      <label>
                        <span>Часы</span>
                        <select
                          value={timeParts.hours}
                          onChange={(event) =>
                            setTimeFromParts(Number(event.target.value), timeParts.minutes)
                          }
                        >
                          {HOUR_OPTIONS.map((hour) => (
                            <option key={hour} value={hour}>
                              {hour.toString().padStart(2, '0')}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        <span>Минуты</span>
                        <select
                          value={timeParts.minutes}
                          onChange={(event) =>
                            setTimeFromParts(timeParts.hours, Number(event.target.value))
                          }
                        >
                          {MINUTE_OPTIONS.map((minute) => (
                            <option key={minute} value={minute}>
                              {minute.toString().padStart(2, '0')}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <div className="admin-panel__time-quick">
                      <button type="button" onClick={() => shiftMinutes(-15)}>
                        −15 мин
                      </button>
                      <button type="button" onClick={() => shiftMinutes(15)}>
                        +15 мин
                      </button>
                      <button type="button" onClick={handleSetNow}>
                        Сейчас
                      </button>
                    </div>
                    <p className="admin-panel__time-preview">
                      Текущее значение: <strong>{formatTimeString(timeParts.hours, timeParts.minutes)}</strong>
                    </p>
                  </div>
                </div>
              </label>

              <label className="admin-panel__field">
                <span>Статус события</span>
                <select name="status" value={form.status} onChange={handleChange}>
                  <option value="upcoming">Запланировано</option>
                  <option value="completed">Завершено</option>
                </select>
              </label>
            </div>
          </div>

          <div className="admin-panel__fieldset">
            <div className="admin-panel__fieldset-head">
              <p className="admin-panel__fieldset-title">Локация и описание</p>
              <p className="admin-panel__fieldset-hint">Где встречаемся и какой формат ждёт игроков.</p>
            </div>
            <div className="admin-panel__grid admin-panel__grid--two">
              <label className="admin-panel__field admin-panel__field--full">
                <span>Адрес площадки</span>
                <input
                  type="text"
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  placeholder="Бар «Мосты», Кирова 12"
                />
              </label>

              <label className="admin-panel__field admin-panel__field--full">
                <span>Детали / формат</span>
                <textarea
                  name="details"
                  value={form.details}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Командная игра, 7 раундов по 7 вопросов…"
                />
              </label>
            </div>
          </div>

          <div className="admin-panel__fieldset">
            <div className="admin-panel__fieldset-head">
              <p className="admin-panel__fieldset-title">Материалы и заметки</p>
              <p className="admin-panel__fieldset-hint">Добавьте визуал и приватные комментарии для команды.</p>
            </div>
            <div className="admin-panel__grid admin-panel__grid--two">
              <div className="admin-panel__field admin-panel__field--file admin-panel__field--full">
                <span>Изображение темы</span>
                <div className="admin-panel__file-controls">
                  <label className="admin-panel__file-button">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleThemeFileChange}
                      disabled={uploading}
                    />
                    {uploading ? 'Загружаем…' : 'Загрузить файл'}
                  </label>
                  {form.theme_image_url && (
                    <button type="button" className="admin-panel__remove" onClick={handleRemoveTheme}>
                      Удалить
                    </button>
                  )}
                </div>
                <p className="admin-panel__file-hint">Поддерживаемые форматы: JPG, PNG. Максимум 5 МБ.</p>
                {uploadError && <p className="admin-panel__file-error">{uploadError}</p>}
                {form.theme_image_url && (
                  <figure className="admin-panel__preview">
                    <img src={themePreviewUrl} alt="Превью изображения темы" />
                    <a href={themePreviewUrl} target="_blank" rel="noreferrer">
                      Открыть в новой вкладке →
                    </a>
                  </figure>
                )}
              </div>

              <label className="admin-panel__field admin-panel__field--full">
                <span>Заметки (видят только организаторы)</span>
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  rows={2}
                  placeholder="Например: не забыть сертификаты для призёров."
                />
              </label>
            </div>
          </div>

          {status && (
            <div className={`admin-panel__status admin-panel__status--${status.type}`}>
              {status.message}
            </div>
          )}

          <div className="admin-panel__actions">
            <div className="admin-panel__actions-left">
              {panelMode === 'edit' && selectedEventId && (
                <button
                  type="button"
                  className={`admin-panel__danger ${confirmDelete ? 'is-confirm' : ''}`}
                  onClick={() => {
                    if (confirmDelete) {
                      handleDeleteEvent();
                    } else {
                      setConfirmDelete(true);
                    }
                  }}
                  disabled={isSubmitting}
                >
                  {confirmDelete ? 'Подтвердить удаление' : 'Удалить событие'}
                </button>
              )}
            </div>
            <div className="admin-panel__actions-right">
              <button type="button" className="admin-panel__secondary" onClick={onClose}>
                Отмена
              </button>
              <button
                type="submit"
                className="admin-panel__primary"
                disabled={isSubmitting || (panelMode === 'edit' && !selectedEventId)}
              >
                {isSubmitting ? 'Сохраняем…' : panelMode === 'edit' ? 'Сохранить изменения' : 'Создать событие'}
              </button>
            </div>
          </div>
        </form>

        <p className="admin-panel__hint">
          Подсказка: настройте <code>REACT_APP_ADMIN_API_BASE_URL</code>,{' '}
          <code>REACT_APP_ADMIN_API_ENDPOINT</code>, <code>REACT_APP_ADMIN_UPLOAD_ENDPOINT</code> и{' '}
          <code>REACT_APP_ADMIN_EVENTS_ENDPOINT</code> вместе с <code>REACT_APP_ADMIN_API_TOKEN</code> для интеграции с
          сервером.
        </p>
      </div>
    </div>
  );
}

export default AdminPanel;

