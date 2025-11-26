import React, { useEffect, useState } from 'react';
import './Gallery.css';

function Gallery() {
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);

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

        const mapped = folders.map((f) => ({
          name: f.name,
          id: f.id,
          coverId: f.coverId || null,
          count: f.count || 0,
          titlePhoto: f.titlePhoto || null,
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
        {albums.map((album) => {
          const titlePhotoId = album.titlePhoto?.id;
          const coverSrc = titlePhotoId
            ? `${API_BASE}/api/photo/${titlePhotoId}`
            : album.coverId
              ? `${API_BASE}/api/photo/${album.coverId}`
              : album.titlePhoto?.webContentLink || album.titlePhoto?.webViewLink || null;

          return (
            <article className="album-card" key={album.id || album.name} role="listitem">
              <a
                className="album-cover"
                href={`https://drive.google.com/drive/folders/${album.id}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {coverSrc ? (
                  <img
                    src={coverSrc}
                    alt={`${album.name} cover`}
                    loading="lazy"
                  />
                ) : (
                  <div className="album-placeholder">No cover</div>
                )}
                {album.titlePhoto && (
                  <span className="album-badge">Title photo</span>
                )}
                <div className="album-cover-glow" />
              </a>

              <div className="album-meta">
                <div className="album-header">
                  <span className="album-location">{album.name}</span>
                  <span className="album-count">{album.count} photos</span>
                </div>
                <h3>{album.name}</h3>

                <a
                  className="album-button"
                  href={`https://drive.google.com/drive/folders/${album.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Открыть в Google Drive
                </a>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default Gallery;