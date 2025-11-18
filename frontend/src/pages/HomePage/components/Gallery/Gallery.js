import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Gallery.css';

function Gallery() {
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(null);

  const navigate = useNavigate();
  const API_BASE = process.env.REACT_APP_API_BASE || process.env.REACT_APP_PUBLIC_API_BASE_URL || process.env.REACT_APP_ADMIN_API_BASE_URL || '';

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);

      try {
        const API_BASE = process.env.REACT_APP_API_BASE || process.env.REACT_APP_PUBLIC_API_BASE_URL || process.env.REACT_APP_ADMIN_API_BASE_URL || '';

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

        const mapped = await Promise.all(folders.map(async (f) => {
          let coverId = f.coverId || null;
          let titlePhoto = f.titlePhoto || null;
          let count = f.count || 0;

          try {
            const photosJson = await safeFetchJson(`${API_BASE}/api/photos?folderId=${encodeURIComponent(f.id)}`);
            const files = photosJson.data || [];
            count = photosJson.count || (files.length) || count;

            // Find a title image
            const titleFile = files.find(p => p.name?.toLowerCase().replace(/\.[^/.]+$/, '') === 'title');

            if (titleFile) {
              titlePhoto = titleFile;
              coverId = titleFile.id; // set coverId to titlePhoto
            } else if (!coverId && files.length > 0) {
              // fallback to first photo
              titlePhoto = files[0];
              coverId = files[0].id;
            }
          } catch (err) {
            console.warn('Failed to fetch photos for folder', f.id, err);
          }

          return {
            name: f.name,
            id: f.id,
            coverId: coverId || null,
            count,
            titlePhoto: titlePhoto || null,
            photos: [],
            redirected: false,
            folderId: f.id,
          };
      }));

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
            <div className="album-cover">
            {album.coverId ? (
              <img
                src={`${API_BASE}/api/photo/${album.coverId}`}
                alt={`${album.name} cover`}
                loading="lazy"
              />
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

              <a
                className="album-drive-link"
                href={`https://drive.google.com/drive/folders/${album.id}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open in Drive
              </a>
            </div>
          </article>
        ))}
      </div>

      {/* Simple modal viewer for active album */}
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
                  <img
                    src={`${API_BASE}/api/photo/${active.titlePhoto.id}`}
                    alt="title"
                  />
                </div>
              ) : null}
              <div className="thumbnails">
                {active.photos && active.photos.length > 0 ? (
                  active.photos.map(p => (
                    <figure key={p.id} className="thumb">
                      <img
                        src={`${API_BASE}/api/photo/${p.id}`}
                        alt={p.name}
                        loading="lazy"
                      />
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