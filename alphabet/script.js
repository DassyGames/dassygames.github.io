const questions = [
  { emoji: "🍉", word: "Арбуз", letter: "А" },
  { emoji: "🐿️", word: "Белка", letter: "Б" },
  { emoji: "🚲", word: "Велосипед", letter: "В" },
  { emoji: "🍇", word: "Груша", letter: "Г" },
  { emoji: "🏠", word: "Дом", letter: "Д" },
  { emoji: "🦝", word: "Енот", letter: "Е" },
  { emoji: "🦔", word: "Ёж", letter: "Ё" },
  { emoji: "🦒", word: "Жираф", letter: "Ж" },
  { emoji: "☂️", word: "Зонт", letter: "З" },
  { emoji: "🪡", word: "Иголка", letter: "И" },
  { emoji: "🧘", word: "Йог", letter: "Й" },
  { emoji: "🐱", word: "Кот", letter: "К" },
  { emoji: "🌙", word: "Луна", letter: "Л" },
  { emoji: "🐻", word: "Медведь", letter: "М" },
  { emoji: "🦏", word: "Носорог", letter: "Н" },
  { emoji: "🐵", word: "Обезьяна", letter: "О" },
  { emoji: "🦜", word: "Попугай", letter: "П" },
  { emoji: "🐟", word: "Рыба", letter: "Р" },
  { emoji: "🐘", word: "Слон", letter: "С" },
  { emoji: "🐯", word: "Тигр", letter: "Т" },
  { emoji: "🦆", word: "Утка", letter: "У" },
  { emoji: "🎆", word: "Фейерверк", letter: "Ф" },
  { emoji: "🍞", word: "Хлеб", letter: "Х" },
  { emoji: "🐢", word: "Цыплёнок", letter: "Ц" },
  { emoji: "⏰", word: "Часы", letter: "Ч" },
  { emoji: "🎩", word: "Шляпа", letter: "Ш" },
  { emoji: "🐊", word: "Щука", letter: "Щ" },
  { emoji: "🧩", word: "Подъём", letter: "П" },
  { emoji: "👨‍👩‍👧", word: "Семья", letter: "С" },
  { emoji: "🧀", word: "Сыр", letter: "С" },
  { emoji: "🧹", word: "Этаж", letter: "Э" },
  { emoji: "🪀", word: "Юла", letter: "Ю" },
  { emoji: "🥚", word: "Яйцо", letter: "Я" }
];

const alphabet = ["А","Б","В","Г","Д","Е","Ё","Ж","З","И","Й","К","Л","М","Н","О","П","Р","С","Т","У","Ф","Х","Ц","Ч","Ш","Щ","Ъ","Ы","Ь","Э","Ю","Я"];
const $ = (id) => document.getElementById(id);
let round = [], index = 0, score = 0, correctCount = 0, attempts = 0, streak = 0, soundOn = true, answered = false;

function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
function choicesFor(correct) {
  const others = shuffle(alphabet.filter(letter => letter !== correct)).slice(0, 3);
  return shuffle([correct, ...others]);
}
function playTone(success) {
  if (!soundOn) return;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator(), gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.value = success ? 660 : 220;
    gain.gain.setValueAtTime(.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + .18);
    osc.start(); osc.stop(ctx.currentTime + .18);
    osc.onended = () => ctx.close();
  } catch (_) {}
}
function updateStats() {
  $("score").textContent = score;
  $("streak").textContent = streak;
  $("accuracy").textContent = attempts ? Math.round(correctCount / attempts * 100) + "%" : "—";
  $("progressText").textContent = `Вопрос ${Math.min(index + 1, round.length)} из ${round.length}`;
  $("progressBar").style.width = `${(index / round.length) * 100}%`;
}
function renderQuestion() {
  answered = false;
  const q = round[index];
  $("picture").textContent = q.emoji;
  $("word").textContent = q.word;
  $("feedback").textContent = "";
  $("feedback").className = "feedback";
  $("nextBtn").disabled = true;
  $("nextBtn").innerHTML = index === round.length - 1 ? "Посмотреть результат <span>→</span>" : "Следующий вопрос <span>→</span>";
  $("answers").innerHTML = "";
  choicesFor(q.letter).forEach(letter => {
    const button = document.createElement("button");
    button.className = "answer";
    button.textContent = letter;
    button.type = "button";
    button.addEventListener("click", () => chooseAnswer(button, letter));
    $("answers").appendChild(button);
  });
  updateStats();
}
function chooseAnswer(button, letter) {
  if (answered) return;
  answered = true;
  attempts++;
  const q = round[index];
  const buttons = [...$("answers").querySelectorAll("button")];
  buttons.forEach(b => {
    b.disabled = true;
    if (b.textContent === q.letter) b.classList.add("correct");
  });
  if (letter === q.letter) {
    score += 10; correctCount++; streak++;
    $("feedback").textContent = "Правильно! Молодец! ⭐";
    $("feedback").classList.add("good");
    playTone(true);
  } else {
    streak = 0;
    button.classList.add("wrong");
    $("feedback").textContent = `Почти! Правильная буква — ${q.letter}.`;
    $("feedback").classList.add("bad");
    playTone(false);
  }
  $("nextBtn").disabled = false;
  updateStats();
}
function showResult() {
  $("progressBar").style.width = "100%";

  let card = document.querySelector(".game-card.result");

  // Создаём результат только один раз
  if (!card) {
    const percent = Math.round(correctCount / round.length * 100);

    let title = percent === 100
      ? "Великолепно!"
      : percent >= 70
        ? "Отличная работа!"
        : "Так держать!";

    card = document.createElement("section");
    card.className = "game-card result";

    card.innerHTML = `
      <div class="result-icon">
        ${percent === 100 ? "🏆" : percent >= 70 ? "🌟" : "📚"}
      </div>
      <h2>${title}</h2>
      <p>Ты завершил игру «Найди правильную букву»</p>
      <div class="result-score">${score} очков</div>
      <p>Правильных ответов: ${correctCount} из ${round.length} · Точность: ${percent}%</p>
      <button class="restart-btn" id="restartBtn">
        Играть ещё раз ↻
      </button>
    `;

    document.querySelector(".app").appendChild(card);

    $("restartBtn").addEventListener("click", () => location.reload());
  }

  // Прокрутка выполняется при каждом вызове
  setTimeout(() => {
    card.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }, 100);
}
function nextQuestion() {
  if (!answered) return;
  index++;
  if (index >= round.length) showResult();
  else renderQuestion();
}
function startGame() {
  round = shuffle(questions).slice(0, 10);
  index = score = correctCount = attempts = streak = 0;
  renderQuestion();
}
$("nextBtn").addEventListener("click", nextQuestion);
$("soundBtn").addEventListener("click", () => {
  soundOn = !soundOn;
  $("soundBtn").textContent = soundOn ? "🔊" : "🔇";
});
startGame();
