import React, { useCallback, useMemo, useState } from 'react';
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
      { label: 'В УмAZоне нравится', value: 'превращать интересные факты в вопросы' }
    ],
    lifeFacts: [
      { text: 'Сертифицированный специалист по Фен-Шуй', verdict: 'truth' },
      { text: 'Прыгала с парашютом', verdict: 'truth' },
      { text: 'Сыграла с командой Балаша Касумова в "Что? Где? Когда?"', verdict: 'truth' },
      { text: 'Коллекционирую спичечные коробки', verdict: 'lie' },
      { text: 'Пронесла в самолет кухонный нож', verdict: 'lie' },
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
      { label: 'В УмAZоне нравится', value: 'проверять ответы игроков' }
    ],
    lifeFacts: [
      { text: 'Владею 3-мя языками', verdict: 'truth' },
      { text: 'Продвинутый редактор Wikipedia', verdict: 'truth' },
      { text: 'Пропустила 2 класса школы', verdict: 'truth' },
      { text: 'Ни разу не участвовала в политическом голосовании', verdict: 'lie' },
      { text: 'Получала штраф за вождение в нетрезвом виде', verdict: 'lie' },
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
      { label: 'В УмAZоне нравится', value: 'волнение перед началом игры, адреналин во время и кайф по окончании' }
    ],
    lifeFacts: [
      { text: 'Случайно поступила на мех-мат, а закончила его с красным дипломом', verdict: 'truth' },
      { text: 'Помню дни рождения всех, даже тех, кого не помню', verdict: 'truth' },
      { text: 'Обладаю топографическим кретинизмом, без навигатора из дома не выхожу', verdict: 'truth' },
      { text: 'Обожаю жареный лук и морепродукты', verdict: 'lie' },
      { text: 'Путаю право и лево', verdict: 'lie' },
    ]
  },
];

function Members() {
  const teamPhoto = useMemo(
    () => `${process.env.PUBLIC_URL || ''}/images/team-placeholder.jpg`,
    []
  );

  const [revealedFacts, setRevealedFacts] = useState(() =>
    memberData.reduce((acc, member) => {
      acc[member.id] = member.lifeFacts.map(() => false);
      return acc;
    }, {})
  );

  const handleFactClick = useCallback((memberId, factIndex) => {
    setRevealedFacts((prev) => {
      const memberFacts = prev[memberId] || [];
      const updatedMemberFacts = [...memberFacts];
      updatedMemberFacts[factIndex] = !memberFacts[factIndex];
      return {
        ...prev,
        [memberId]: updatedMemberFacts,
      };
    });
  }, []);

  return (
    <section id="members" className="members-section">
      <div className="members-container">
        <header className="members-header">
          <h2>Наши ведущие</h2>
          <p>
            Познакомьтесь с командой УмAZона. Нажмите на факт, чтобы отметить, правда это или хитрая
            выдумка.
          </p>
        </header>

        <figure className="members-hero" aria-label="Фотография команды УмAZона">
          <img
            src={teamPhoto}
            alt="Команда УмAZона ведёт игру за большим столом"
            loading="lazy"
          />
        </figure>

        <div className="members-grid">
          {memberData.map((member) => (
            <article className="member-card" key={member.id}>
              <div className="member-card__media">
                <img
                  src={member.image}
                  alt={`Портрет ${member.name}`}
                  className="member-card__photo"
                  loading="lazy"
                />
              </div>

              <div className="member-card__content">
                <h3 className="member-card__name">{member.name}</h3>
                <p className="member-card__contact">
                  <span>Связаться:</span>
                  <a href={`mailto:${member.contact}`}>{member.contact}</a>
                </p>

                <div className="member-card__section">
                  <h4>Про себя</h4>
                  <ul className="member-card__about-list">
                    {member.aboutMe.map((item, index) => (
                      <li key={item.label + item.value}>
                        <span className="about-label">{item.label}:</span>
                        <span className="about-value">{item.value}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="member-card__section">
                  <h4>3 правды · 2 выдумки</h4>
                  <ul className="member-card__facts-list">
                    {member.lifeFacts.map((fact, index) => {
                      const isRevealed = revealedFacts[member.id]?.[index] ?? false;
                      const icon = isRevealed
                        ? fact.verdict === 'truth'
                          ? '✓'
                          : '✕'
                        : '•';
                      const statusLabel = isRevealed
                        ? fact.verdict === 'truth'
                          ? 'Это правда'
                          : 'Это выдумка'
                        : 'Нажмите, чтобы раскрыть';

                      return (
                        <li key={`${member.id}-fact-${index}`}>
                          <button
                            type="button"
                            className={`life-fact-button verdict-${fact.verdict}`}
                            data-revealed={isRevealed}
                            onClick={() => handleFactClick(member.id, index)}
                            aria-pressed={isRevealed}
                            aria-label={`${statusLabel}. ${fact.text}`}
                          >
                            <span className="life-fact-button__icon" aria-hidden="true">
                              {icon}
                            </span>
                            <span className="life-fact-button__text">{fact.text}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Members;