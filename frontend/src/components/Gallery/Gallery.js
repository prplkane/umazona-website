import React from 'react';
import './Gallery.css'; // Import the component-specific styles

// We'll hard-code a list of image sources
// When you have real images, you'll put them in the /public/images folder
// and the paths would be like '/images/gallery-photo-1.jpg'
const imagePlaceholders = [
  'https://via.placeholder.com/400x300.png/1565c0/ffffff?text=Umazona+Photo+1',
  'https://via.placeholder.com/400x300.png/1565c0/ffffff?text=Umazona+Photo+2',
  'https://via.placeholder.com/400x300.png/1565c0/ffffff?text=Umazona+Photo+3',
  'https://via.placeholder.com/400x300.png/1565c0/ffffff?text=Umazona+Photo+4',
  'https://via.placeholder.com/400x300.png/1565c0/ffffff?text=Umazona+Photo+5',
  'https://via.placeholder.com/400x300.png/1565c0/ffffff?text=Umazona+Photo+6',
];

function Gallery() {
  return (
    <div className="gallery-grid">
      {/* We map over the array and create an <img> tag for each one.
        This dynamically builds our gallery.
      */}
      {imagePlaceholders.map((src, index) => (
        <div className="gallery-item" key={index}>
          <img src={src} alt={`Umazona trivia event ${index + 1}`} />
        </div>
      ))}
    </div>
  );
}

export default Gallery;