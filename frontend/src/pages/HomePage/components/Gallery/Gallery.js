import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Gallery.css';

function Gallery() {
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(null);

  const navigate = useNavigate();
  const API_BASE = process.env.REACT_APP_API_BASE || '';

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      try {
        const API_BASE = process.env.REACT_APP_API_BASE || '';

        async function safeFetchJson(url, opts) {
          const resp = await fetch(url, opts);
          const contentType = resp.headers.get('content-type') || '';
          if (!resp.ok) {
            const text = await resp.text();
            throw new Error(`Request failed (${resp.status}): ${text}`);
          }
          if (contentType.includes('application/json')) {
            return resp.json();
          }

          const text = await resp.text();
          return { __raw: text };
        }

        // Default to 'umazon test' when REACT_APP_GALLERY_PARENT is not set
        const GALLERY_PARENT = process.env.REACT_APP_GALLERY_PARENT || 'umazon test';
        const parentQuery = GALLERY_PARENT ? `?parent=${encodeURIComponent(GALLERY_PARENT)}` : '';

        // Use combined endpoint to fetch children + cover id in a single request
        const foldersJson = await safeFetchJson(`${API_BASE}/api/folders/children-with-cover${parentQuery}`);
        const folders = foldersJson.folders || [];

        const mapped = folders.map((f) => {
          return {
            name: f.name,
            id: f.id,
            coverId: f.coverId || null,
            count: f.count || 0,
            titlePhoto: f.titlePhoto || null,
            photos: [],
            redirected: false,
            folderId: f.id,
          };
        });

        if (mounted) setAlbums(mapped);
      } catch (err) {
        console.error('Failed to load galleries', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => { mounted = false; };
  }, []);

  // Note: album opening now navigates to a dedicated page (`/gallery/:folderId`).
  // The previous `openAlbum` helper (which fetched /api/photos and opened a modal)
  // was removed to avoid an unused-variable ESLint warning.

  if (loading) {
    return (
      <section id="gallery" className="gallery-section">
        <div className="gallery-intro">
          <p className="gallery-eyebrow">Моменты вечеров</p>
          <h2>Погрузись в атмосферу УмAZона</h2>
          <p>Загрузка альбомов...</p>
        </div>
      </section>
    );
  }

  return (
    <section id="gallery" className="gallery-section">
      <div className="gallery-intro">
        <p className="gallery-eyebrow">Моменты вечеров</p>
        <h2>Погрузись в атмосферу УмAZона</h2>
        <p>
          Каждое событие — новая история. Альбомы автоматически подтягиваются из Google Drive.
        </p>
      </div>

      <div className="album-carousel" role="list">
        {albums.map((album) => (
          <article className="album-card" key={album.id || album.name} role="listitem">
            <div className="album-cover" onClick={() => navigate(`/gallery/${encodeURIComponent(album.id)}`)} style={{ cursor: 'pointer' }}>
              {album.coverId ? (
                <img src={`${API_BASE ? API_BASE : ''}/api/photo/${album.coverId}`} alt={`${album.name} cover`} loading="lazy" />
              ) : (
                <div className="album-placeholder">No cover</div>
              )}
              <div className="album-cover-glow" />
            </div>
            <div className="album-meta">
              <div className="album-header">
                <span className="album-location">{album.name}</span>
                <span className="album-count">{album.count} photos</span>
              </div>
              <h3>{album.name}</h3>
              <button type="button" className="album-button" onClick={() => navigate(`/gallery/${encodeURIComponent(album.id)}`)}>
                View album
              </button>
            </div>
          </article>
        ))}
      </div>

      {/* Simple modal viewer for active album */}
      {active && (
        <div className="gallery-modal" onClick={() => setActive(null)}>
          <div className="gallery-modal-inner" onClick={(e) => e.stopPropagation()}>
            <header className="gallery-modal-header">
              <h3>{active.name}</h3>
              <button onClick={() => setActive(null)}>Close</button>
            </header>
            <div className="gallery-modal-body">
              {active.titlePhoto ? (
                <div className="title-photo">
                  <img src={(active.titlePhoto.webContentLink || active.titlePhoto.webViewLink)} alt="title" />
                </div>
              ) : null}
              <div className="thumbnails">
                {active.photos && active.photos.length > 0 ? (
                  active.photos.map(p => (
                    <figure key={p.id} className="thumb">
                      <img src={(p.webContentLink || p.webViewLink)} alt={p.name} loading="lazy" />
                      <figcaption>{p.name}</figcaption>
                    </figure>
                  ))
                ) : (
                  <p>No photos in this album.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default Gallery;