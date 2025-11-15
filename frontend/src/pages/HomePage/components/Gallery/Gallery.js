import React, { useMemo } from 'react';
import './Gallery.css';

const mockAlbums = [
  {
    id: 'spring-cup-2025',
    title: 'Spring Cup · March 2025',
    location: 'Sochi',
    cover:
      'https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?auto=format&fit=crop&w=600&q=80',
    preview:
      'https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?auto=format&fit=crop&w=400&q=60',
    photos: 48,
  },
  {
    id: 'corporate-night',
    title: 'Corporate Night · Gazprom',
    location: 'Moscow',
    cover:
      'https://images.unsplash.com/photo-1529158062015-cad636e69505?auto=format&fit=crop&w=600&q=80',
    preview:
      'https://images.unsplash.com/photo-1529158062015-cad636e69505?auto=format&fit=crop&w=400&q=60',
    photos: 36,
  },
  {
    id: 'beach-quiz',
    title: 'Beach Trivia Sunset',
    location: 'Adler',
    cover:
      'https://images.unsplash.com/photo-1530023367847-a683933f4177?auto=format&fit=crop&w=600&q=80',
    preview:
      'https://images.unsplash.com/photo-1530023367847-a683933f4177?auto=format&fit=crop&w=400&q=60',
    photos: 24,
  },
  {
    id: 'halloween-special',
    title: 'Halloween Special',
    location: 'St. Petersburg',
    cover:
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=600&q=80',
    preview:
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=400&q=60',
    photos: 52,
  },
  {
    id: 'family-day',
    title: 'Family Day Mini Quiz',
    location: 'Krasnaya Polyana',
    cover:
      'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=600&q=80',
    preview:
      'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=400&q=60',
    photos: 31,
  },
];

function Gallery() {
  const albums = useMemo(() => mockAlbums, []);

  return (
    <section id="gallery" className="gallery-section">
      <div className="gallery-intro">
        <p className="gallery-eyebrow">Моменты вечеров</p>
        <h2>Погрузись в атмосферу УмAZона</h2>
        <p>
          Каждое событие — новая история. Скоро здесь появится живая лента альбомов, которую вы сможете
          пополнять через Cloudinary.
        </p>
      </div>

      <div className="album-carousel" role="list">
        {albums.map((album) => (
          <article className="album-card" key={album.id} role="listitem">
            <div className="album-cover">
              <img src={album.cover} alt={`${album.title} cover`} loading="lazy" />
              <div className="album-cover-glow" />
            </div>
            <div className="album-meta">
              <div className="album-header">
                <span className="album-location">{album.location}</span>
                <span className="album-count">{album.photos} photos</span>
              </div>
              <h3>{album.title}</h3>
              <button type="button" className="album-button">
                View album
              </button>
            </div>
          </article>
        ))}
        <div className="album-card album-card--upload" role="listitem">
          <div className="upload-inner">
            <div className="upload-icon" aria-hidden="true">+</div>
            <h3>Добавить альбом</h3>
            <p>Подготовьте Cloudinary preset и загрузите новые фото, чтобы гости увидели себя.</p>
            <button type="button" className="album-button upload-button">
              Upload via Cloudinary
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Gallery;