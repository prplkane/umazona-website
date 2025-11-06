import React from 'react';
import './About.css'; // We'll create this file next

function About() {
  return (
    // This 'id' is what the navbar link scrolls to
    <section id="about" className="about-section">
      <div className="about-container">
        <div className="about-text">
          <h2>Heading</h2> {/* From your prototype */}
          <p>
            Это интеллектуальная игра, в которой от 4 до 10 игроков. 
            Командная игра. Увлекательное и познавательное времяпрепровождение 
            для компаний и друзей!
          </p>
          <p>
            Ведущий задает 7 раундов по 7, похожая на «Что? Где? Когда?» 
            Вопросы на совершенно разнообразные темы. Они помогут 
            отдохнуть, посмеяться и узнать новое.
          </p>
        </div>
        <div className="about-image">
          {/* This is the gray box from your prototype */}
          <div className="image-placeholder">
            
          </div>
        </div>
      </div>
    </section>
  );
}

export default About;