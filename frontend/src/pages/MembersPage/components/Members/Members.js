import React, { useState, useEffect } from 'react';
import './Members.css';

// Our static member data
const memberData = [
  {
    id: 1,
    name: 'Евгения',
    contact: 'evgenia@umazona.com', 
    image: '/images/Evgenia.png', 
    aboutMe: [
      { label: 'Родной город', value: 'Ташкент' },
      { label: 'Любимая еда', value: 'самса из тандыра' },
      { label: 'Люблю', value: 'планировать маршруты поездок' },
      { label: 'Не люблю', value: 'крошки на столе' },
      { label: 'В УмАЗоне нравится', value: 'превращать интересные факты в вопросы' }
    ],
    lifeFacts: [
      'Сертифицированный специалист по Фен-Шуй',
      'Прыгала с парашютом',
      'Сыграла с командой Балаша Касумова в "Что? Где? Когда?"',
      'Коллекционирую спичечные коробки',
      'Пронесла в самолет кухонный нож'
    ]
  },
  {
    id: 2,
    name: 'Дарья',
    contact: 'daria@umazona.com', 
    image: '/images/Daria.png', 
    aboutMe: [
      { label: 'Родной город', value: 'Нижний Новгород' },
      { label: 'Любимая еда', value: 'та, которую готовят с любовью' },
      { label: 'Люблю', value: 'плохую погоду' },
      { label: 'Не люблю', value: 'оперу' },
      { label: 'В УмАЗоне нравится', value: 'проверять ответы игроков' }
    ],
    lifeFacts: [
      'Владею 3-мя языками',
      'Продвинутый редактор Wikipedia',
      'Пропустила 2 класса школы',
      'Ни разу не участвовала в политическом голосовании',
      'Получала штраф за вождение в нетрезвом виде'
    ]
  },
  {
    id: 3,
    name: 'Екатерина', 
    contact: 'presenter3@umazona.com', 
    image: '/images/Ekaterina.png', 
    aboutMe: [
      { label: 'Родной город', value: 'Нижний Новгород' },
      { label: 'Любимая еда', value: 'шампанское с апельсиновым соком и можно без еды' },
      { label: 'Люблю', value: 'порядок в доме и в голове' },
      { label: 'Не люблю', value: 'ложь, особенно если это глагол' },
      { label: 'В УмАЗоне нравится', value: 'волнение перед началом игры, адреналин во время и кайф по окончании' }
    ],
    lifeFacts: [
      'Случайно поступила на мех-мат, а закончила его с красным дипломом',
      'Помню дни рождения всех, даже тех, кого не помню',
      'Обладаю топографическим кретинизмом, без навигатора из дома не выхожу',
      'Обожаю жареный лук и морепродукты',
      'Путаю право и лево'
    ]
  },
];

// A simple array shuffle function (Fisher-Yates)
function shuffleArray(array) {
  let a = [...array]; // Create a copy
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]; // Swap elements
  }
  return a;
}

function Members() {
  // State to hold the shuffled list
  const [shuffledMembers, setShuffledMembers] = useState([]);

  // useEffect hook to shuffle the list ONCE on component load
  useEffect(() => {
    setShuffledMembers(shuffleArray(memberData));
  }, []); // The empty array [] means "run this only once"

 return (
    <section id="members" className="members-section">
      <div className="members-container">
        <h2>Our Team</h2>
        <p>Contact any of our team members to help plan your event.</p>
        
        <div className="members-list">
          {/* We map over the SHUFFLED state, not the original data */}
          {shuffledMembers.map((member) => (
            <div className="member-bio-card" key={member.id}>
              
              {/* --- Left Column (Info) --- */}
              <div className="member-info">
                <h3 className="member-name-header">{member.name}</h3>
                
                <h4 className="info-title">ПРО СЕБЯ:</h4>
                <ul className="about-me-list">
                  {member.aboutMe.map((item, index) => (
                    <li key={index}>
                      <strong>{item.label}:</strong> {item.value}
                    </li>
                  ))}
                </ul>
                
                <h4 className="info-title">ФАКТЫ ИЗ ЖИЗНИ:</h4>
                <ol className="life-facts-list">
                  {member.lifeFacts.map((fact, index) => (
                    <li key={index}>{fact}</li>
                  ))}
                </ol>
                
                <p className="member-contact-info">
                  <strong>Contact:</strong> {member.contact}
                </p>
              </div>

              {/* --- Right Column (Photo) --- */}
              <div className="member-photo">
                <img src={member.image} alt={member.name} className="member-image" />
              </div>
              
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Members;