import React, { useState } from 'react';
import './Extras.css';

const quizQuestions = [
  {
    question: 'В какой стране родилась команда Umazonа?',
    options: ['Испания', 'США', 'Россия', 'Казахстан'],
    answer: 2,
    fact: 'Umazonа появилась в Сочи — отсюда и любовь к ярким курортным вечеринкам.',
  },
  {
    question: 'Сколько раундов мы обычно проводим за один квиз-вечер?',
    options: ['3 раунда', '5 раундов', '7 раундов', '10 раундов'],
    answer: 2,
    fact: 'Классический сет — 7 раундов по 7 вопросов, чтобы мозг успевал отдыхать.',
  },
  {
    question: 'Что делает команду-победителя особенной на наших играх?',
    options: [
      'Уходит без подарков',
      'Получает кубок и тематические призы',
      'Записывает подкаст',
      'Выбирает ведущего на следующий вечер',
    ],
    answer: 1,
    fact: 'Победители забирают тематические призы, иногда даже неожиданно полезные!',
  },
  {
    question: 'Какая атмосфера царит в зале во время финального раунда?',
    options: ['Тишина и напряжение', 'Караоке и танцы', 'Академический спор', 'Обсуждение сериалов'],
    answer: 0,
    fact: 'Финал — самый напряжённый момент. Но сразу после него начинается веселье.',
  },
  {
    question: 'Какой лучший способ собрать команду для игры?',
    options: [
      'Позвать коллег и выбрать капитана',
      'Играть в одиночку',
      'Попросить родителей',
      'Взять случайных гостей из соседнего зала',
    ],
    answer: 0,
    fact: 'Команды из коллег всегда раскрываются с новой стороны и сплачиваются.',
  },
];

function Extras() {
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState('');

  const totalQuestions = quizQuestions.length;

  const openQuiz = () => {
    setIsQuizOpen(true);
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setAnswers([]);
    setScore(0);
    setShowResults(false);
    setError('');
  };

  const closeQuiz = () => {
    setIsQuizOpen(false);
  };

  const handleSelect = (index) => {
    if (selectedOption !== null) {
      return;
    }
    setSelectedOption(index);
    if (error) {
      setError('');
    }
  };

  const handleNext = () => {
    if (selectedOption === null) {
      setError('Выберите ответ, прежде чем идти дальше.');
      return;
    }

    const updatedAnswers = [...answers, selectedOption];

    if (currentQuestionIndex === totalQuestions - 1) {
      const finalScore = updatedAnswers.reduce((acc, answerIndex, idx) => {
        return acc + (quizQuestions[idx].answer === answerIndex ? 1 : 0);
      }, 0);

      setAnswers(updatedAnswers);
      setScore(finalScore);
      setShowResults(true);
      setSelectedOption(null);
      return;
    }

    setAnswers(updatedAnswers);
    setCurrentQuestionIndex((prev) => prev + 1);
    setSelectedOption(null);
  };

  const restartQuiz = () => {
    openQuiz();
  };

  const question = quizQuestions[currentQuestionIndex];

  return (
    <section id="extras" className="extras-section">
      <div className="extras-wrapper">
        <div className="extras-header">
          <span className="extras-eyebrow">Extras & Community</span>
          <h2>Увидеть больше, сыграть больше</h2>
          <p>
            Погрузитесь в атмосферу Umazonа: вдохновитесь галереей, вспомните любимые викторины в архиве,
            запустите мини-квиз прямо сейчас или забронируйте собственный праздник.
          </p>
        </div>

        <div className="extras-grid">
          <a className="extras-card" data-accent="gallery" href="#gallery">
            <div className="extras-card-header">
              <span className="extras-icon" aria-hidden="true">📸</span>
              <span className="extras-badge">live vibes</span>
            </div>
            <h3>Галерея вечеров</h3>
            <p>
              Лица, эмоции и неожиданные победы — листайте лучшие моменты наших квизов и найдите свою команду.
            </p>
            <span className="extras-link">Перейти к галерее →</span>
          </a>

          <a className="extras-card" data-accent="archive" href="#archive" onClick={(event) => event.preventDefault()}>
            <div className="extras-card-header">
              <span className="extras-icon" aria-hidden="true">🗂️</span>
              <span className="extras-badge extras-badge--soon">скоро</span>
            </div>
            <h3>Архив игр</h3>
            <p>
              Сохраняем легендарные раунды и тематические подборки. Совсем скоро вы сможете пересматривать любимые загадки.
            </p>
            <span className="extras-link">Подписаться на обновление →</span>
          </a>

          <button
            type="button"
            className="extras-card extras-card--interactive"
            data-accent="play"
            onClick={openQuiz}
          >
            <div className="extras-card-header">
              <span className="extras-icon" aria-hidden="true">🧠</span>
              <span className="extras-badge">mini game</span>
            </div>
            <h3>Let's Play?</h3>
            <p>
              Разогрейте мозг перед встречей: ответьте на пять вопросов и посмотрите, насколько вы готовы к реальному турниру.
            </p>
            <span className="extras-link">Запустить мини-квиз →</span>
          </button>

          <a className="extras-card" data-accent="hire" href="#contact">
            <div className="extras-card-header">
              <span className="extras-icon" aria-hidden="true">🤝</span>
              <span className="extras-badge">corporate</span>
            </div>
            <h3>Нанять Umazonу</h3>
            <p>
              Создадим фирменный квиз под ваш бренд: сценарий, ведущий, призы и техническая команда — полный VIP-сервис.
            </p>
            <span className="extras-link">Забронировать событие →</span>
          </a>
        </div>
      </div>

      {isQuizOpen && (
        <div className="quiz-overlay" role="dialog" aria-modal="true" aria-labelledby="quiz-heading">
          <div className="quiz-modal">
            <button className="quiz-close" type="button" onClick={closeQuiz} aria-label="Закрыть мини-игру">
              ×
            </button>

            {showResults ? (
              <div className="quiz-results">
                <span className="quiz-eyebrow">Mini Challenge</span>
                <h3 id="quiz-heading">Вы набрали {score} из {totalQuestions}</h3>
                <p>
                  {score === totalQuestions
                    ? 'Идеально! Вы — мозг команды. Ждём на турнире.'
                    : score >= 3
                    ? 'Отличный результат. В живой игре будет ещё интереснее!'
                    : 'Разогрейтесь ещё немного — и вперёд к победам.'}
                </p>
                <button type="button" className="quiz-action" onClick={restartQuiz}>
                  Сыграть ещё раз
                </button>
              </div>
            ) : (
              <div className="quiz-body">
                <span className="quiz-eyebrow">Вопрос {currentQuestionIndex + 1} / {totalQuestions}</span>
                <h3 id="quiz-heading">{question.question}</h3>
                <ul className="quiz-options">
                  {question.options.map((option, index) => {
                    const isSelected = selectedOption === index;
                    const optionClasses = ['quiz-option'];
                    if (isSelected) {
                      optionClasses.push('quiz-option--selected');
                    }
                    if (selectedOption !== null && !isSelected) {
                      optionClasses.push('quiz-option--disabled');
                    }

                    return (
                      <li key={option}>
                        <button
                          type="button"
                          className={optionClasses.join(' ')}
                          onClick={() => handleSelect(index)}
                          disabled={selectedOption !== null}
                        >
                          <span>{option}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
                {error && <p className="quiz-error">{error}</p>}
                <div className="quiz-footer">
                  <p className="quiz-fact">
                    {selectedOption !== null ? question.fact : ''}
                  </p>
                  <button type="button" className="quiz-action" onClick={handleNext}>
                    {currentQuestionIndex === totalQuestions - 1 ? 'Завершить' : 'Дальше'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

export default Extras;

