import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../HomePage/components/Gallery/Gallery.css';

function GalleryPage() {
    const { folderId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [photos, setPhotos] = useState([]);
    const [titlePhoto, setTitlePhoto] = useState(null);
    const [folderName, setFolderName] = useState('');

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

                const url = `${API_BASE}/api/photos?folderId=${encodeURIComponent(folderId)}`;
                const json = await safeFetchJson(url);
                if (json && json.__raw) {
                    throw new Error('Invalid JSON response from server');
                }

                if (!mounted) return;

                // If no explicit titlePhoto was returned, fall back to the first photo
                const photosArr = json.data || [];
                const title = json.titlePhoto || (photosArr && photosArr.length > 0 ? photosArr[0] : null);

                setPhotos(photosArr);
                setTitlePhoto(title);
                setFolderName(json.folderName || json.folderId || folderId);
            } catch (err) {
                console.error('Failed to load gallery page', err);
            } finally {
                if (mounted) setLoading(false);
            }
        }

        load();
        return () => { mounted = false; };
    }, [folderId]);

    if (loading) return (
        <section className="gallery-section">
            <div className="gallery-intro">
                <p className="gallery-eyebrow">Загрузка альбома...</p>
            </div>
        </section>
    );

    const API_BASE = process.env.REACT_APP_API_BASE || process.env.REACT_APP_PUBLIC_API_BASE_URL || process.env.REACT_APP_ADMIN_API_BASE_URL || '';

    return (
        <section className="gallery-section">
            <div className="gallery-intro">
                <p className="gallery-eyebrow">Альбом</p>
                <h2>{folderName}</h2>
                <p>
                    Нажмите на любое изображение для увеличения.
                </p>
                <button onClick={() => navigate(-1)} style={{ marginTop: 8 }}>Back</button>
            </div>

            <div className="gallery-modal-inner">
                {titlePhoto ? (
                    <div className="title-photo">
                        <img src={`${API_BASE ? API_BASE : ''}/api/photo/${titlePhoto.id}`} alt="title" />
                    </div>
                ) : null}

                <div className="thumbnails">
                    {photos && photos.length > 0 ? (
                        photos.map(p => (
                            <figure key={p.id} className="thumb">
                                <img src={`${API_BASE ? API_BASE : ''}/api/photo/${p.id}`} alt={p.name} loading="lazy" />
                                <figcaption>{p.name}</figcaption>
                            </figure>
                        ))
                    ) : (
                        <p>No photos in this album.</p>
                    )}
                </div>
            </div>
        </section>
    );
}

export default GalleryPage;
