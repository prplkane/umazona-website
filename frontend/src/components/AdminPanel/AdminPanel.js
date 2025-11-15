import React, { useState, useEffect, useMemo, useCallback } from 'react';
import './AdminPanel.css';

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
    setIsSubmitting(true);
    setStatus(null);

    try {
      const payload = {
        event_name: form.event_name,
        event_date: form.event_date ? new Date(form.event_date).toISOString() : null,
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

          <label className="admin-panel__field">
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

          <label className="admin-panel__field">
            <span>Дата события</span>
            <input
              type="date"
              name="event_date"
              value={form.event_date}
              onChange={handleChange}
              required
            />
          </label>

          <label className="admin-panel__field">
            <span>Время начала</span>
            <input
              type="time"
              name="start_time"
              value={form.start_time}
              onChange={handleChange}
              placeholder="19:30"
            />
          </label>

          <label className="admin-panel__field">
            <span>Адрес площадки</span>
            <input
              type="text"
              name="address"
              value={form.address}
              onChange={handleChange}
              placeholder="Бар «Мосты», Кирова 12"
            />
          </label>

          <label className="admin-panel__field">
            <span>Детали / формат</span>
            <textarea
              name="details"
              value={form.details}
              onChange={handleChange}
              rows={3}
              placeholder="Командная игра, 7 раундов по 7 вопросов…"
            />
          </label>

          <label className="admin-panel__field">
            <span>Статус события</span>
            <select name="status" value={form.status} onChange={handleChange}>
              <option value="upcoming">Запланировано</option>
              <option value="completed">Завершено</option>
            </select>
          </label>

          <div className="admin-panel__field admin-panel__field--file">
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

          <label className="admin-panel__field">
            <span>Заметки (видят только организаторы)</span>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={2}
              placeholder="Например: не забыть сертификаты для призёров."
            />
          </label>

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

