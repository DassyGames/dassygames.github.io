
"use strict";

/* =========================================
   CLASSSPIN — APPLICATION LOGIC
========================================= */

// DEFAULT DATA
const DEFAULT_STUDENTS = [
    "Абдибаитов Рамзан Максатбекович",
    "Алижанов Абубакир Атаевич",
    "Арзибеков Элмирбек Каныбекович",
    "Кадырбеков Нурсултан Камчыбекович",
    "Кубанычбеков Нургелди Накенович",
    "Маматурдуева Аруужан Давлатбековна",
    "Медербеков Азиреттиали Атабекович",
    "Нурланбеков Усман Бексултанович",
    "Урустамова Айназик Чубаковна"
];


const DEFAULT_QUESTIONS = [
    // Грамота и буквы
    "Назови буквы А, О, И, Ы, У.",
    "Какой звук обозначает буква А?",
    "Назови слово, которое начинается на букву О.",
    "Назови слово, которое начинается на букву И.",
    "Составь слог с буквой М и буквой А.",
    "Прочитай слоги: МА, МО, МИ.",
    "Какая буква стоит первой в слове АРБУЗ?",
    "Назови слово, которое начинается на букву У.",

    // Математика
    "Посчитай от 1 до 10.",
    "Какое число идёт после числа 3?",
    "Какое число стоит перед числом 5?",
    "Сколько будет 1 + 1?",
    "Сколько будет 2 + 3?",
    "Сколько будет 5 - 2?",
    "Сколько будет 4 + 1?",
    "Сколько будет 10 - 5?",
    "Какое число больше: 3 или 5?",
    "Какое число меньше: 2 или 4?",
    "Сколько пальцев на одной руке?",
    "Сколько углов у треугольника?",

    // Логика
    "Что лишнее: яблоко, груша, машина?",
    "Продолжи ряд: 1, 2, 3, ...",
    "Что бывает круглым: мяч или книга?",
    "У Маши было 2 яблока, ей дали ещё 1. Сколько стало?",
    "Что тяжелее: камень или перышко?",

    // Я и мир
    "Почему нужно соблюдать режим дня?",
    "Что нужно делать утром после пробуждения?",
    "Почему нужно мыть руки перед едой?",
    "Для чего нужно ходить в школу?",
    "Почему нужно соблюдать правила поведения в классе?"
];


const STORAGE_KEYS = {
    students: "classspin_students",
    questions: "classspin_questions",
    selected: "classspin_selected",
    round: "classspin_round",
    sound: "classspin_sound"
};

const COLORS = [
    "#7963E9",
    "#397FE8",
    "#16A6A1",
    "#E18B46",
    "#D65D91",
    "#4C9A78",
    "#BD6BD4",
    "#4773BC",
    "#C27B4A",
    "#6876D9"
];

// DOM ELEMENTS
const canvas = document.getElementById("wheelCanvas");
const ctx = canvas.getContext("2d");

const spinButton = document.getElementById("spinButton");
const resetButton = document.getElementById("resetButton");

const studentsInput = document.getElementById("studentsInput");
const saveStudentsButton = document.getElementById("saveStudentsButton");

const questionsInput = document.getElementById("questionsInput");
const saveQuestionsButton = document.getElementById("saveQuestionsButton");

const nextQuestionButton = document.getElementById("nextQuestionButton");

const studentName = document.getElementById("studentName");
const studentAvatar = document.getElementById("studentAvatar");
const studentSubtitle = document.getElementById("studentSubtitle");

const questionContent = document.getElementById("questionContent");
const questionNumber = document.getElementById("questionNumber");

const totalCount = document.getElementById("totalCount");
const remainingCount = document.getElementById("remainingCount");
const selectedCount = document.getElementById("selectedCount");
const leftCount = document.getElementById("leftCount");
const progressPercent = document.getElementById("progressPercent");

const roundNumber = document.getElementById("roundNumber");
const studentListCount = document.getElementById("studentListCount");
const questionListCount = document.getElementById("questionListCount");

const soundToggle = document.getElementById("soundToggle");
const toast = document.getElementById("toast");

// APPLICATION STATE
let students = loadData(STORAGE_KEYS.students, DEFAULT_STUDENTS);
let questions = loadData(STORAGE_KEYS.questions, DEFAULT_QUESTIONS);

let selectedStudents = new Set(
    loadData(STORAGE_KEYS.selected, [])
);

let round = Number(localStorage.getItem(STORAGE_KEYS.round)) || 1;

let soundEnabled =
    localStorage.getItem(STORAGE_KEYS.sound) !== "false";

let currentStudent = null;
let currentQuestion = null;

let rotation = 0;
let isSpinning = false;
let audioContext = null;
let toastTimer = null;

const TAU = Math.PI * 2;

// =========================================
// STORAGE
// =========================================

function loadData(key, fallback) {
    try {
        const saved = localStorage.getItem(key);
        return saved ? JSON.parse(saved) : [...fallback];
    } catch {
        return [...fallback];
    }
}

function saveData() {
    localStorage.setItem(
        STORAGE_KEYS.students,
        JSON.stringify(students)
    );

    localStorage.setItem(
        STORAGE_KEYS.questions,
        JSON.stringify(questions)
    );

    localStorage.setItem(
        STORAGE_KEYS.selected,
        JSON.stringify([...selectedStudents])
    );

    localStorage.setItem(
        STORAGE_KEYS.round,
        String(round)
    );

    localStorage.setItem(
        STORAGE_KEYS.sound,
        String(soundEnabled)
    );
}

// =========================================
// HELPERS
// =========================================

function normalizeAngle(angle) {
    return ((angle % TAU) + TAU) % TAU;
}

function randomIndex(length) {
    return Math.floor(Math.random() * length);
}

function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {
        toast.classList.remove("show");
    }, 2600);
}

// =========================================
// AUDIO
// =========================================

function playTone(
    frequency = 500,
    duration = 0.08,
    volume = 0.04
) {
    if (!soundEnabled) return;

    try {
        const AudioContextClass =
            window.AudioContext ||
            window.webkitAudioContext;

        if (!AudioContextClass) return;

        audioContext ||= new AudioContextClass();

        if (audioContext.state === "suspended") {
            audioContext.resume();
        }

        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();

        oscillator.type = "sine";
        oscillator.frequency.value = frequency;

        gain.gain.setValueAtTime(
            volume,
            audioContext.currentTime
        );

        gain.gain.exponentialRampToValueAtTime(
            0.001,
            audioContext.currentTime + duration
        );

        oscillator.connect(gain);
        gain.connect(audioContext.destination);

        oscillator.start();
        oscillator.stop(
            audioContext.currentTime + duration
        );

    } catch (error) {
        console.warn("Audio unavailable:", error);
    }
}

function playWinSound() {
    playTone(523, 0.15);

    setTimeout(() => playTone(659, 0.15), 120);
    setTimeout(() => playTone(784, 0.25), 240);
}

soundToggle.addEventListener("click", () => {
    soundEnabled = !soundEnabled;

    soundToggle.textContent =
        soundEnabled ? "🔊" : "🔇";

    saveData();

    if (soundEnabled) playTone(600);

    showToast(
        soundEnabled ? "Звук включен" : "Звук выключен"
    );
});

// =========================================
// WHEEL DRAWING
// =========================================

function drawWheel() {
    const size = canvas.width;
    const center = size / 2;
    const radius = center - 15;

    ctx.clearRect(0, 0, size, size);

    if (students.length === 0) {
        ctx.beginPath();
        ctx.arc(center, center, radius, 0, TAU);
        ctx.fillStyle = "#263253";
        ctx.fill();
        return;
    }

    const slice = TAU / students.length;

    ctx.save();

    ctx.translate(center, center);
    ctx.rotate(rotation);

    students.forEach((student, index) => {

        const start = -Math.PI / 2 + index * slice;
        const end = start + slice;

        // Draw sector
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, radius, start, end);
        ctx.closePath();

        ctx.fillStyle =
            COLORS[index % COLORS.length];

        ctx.fill();

        ctx.strokeStyle = "#ffffff35";
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw name
        const middle = start + slice / 2;

        ctx.save();
        ctx.rotate(middle);

        ctx.textAlign = "right";
        ctx.textBaseline = "middle";

        const maxFont = students.length > 25 ? 12 : 15;

        const fontSize = Math.min(
            maxFont,
            Math.max(8, 250 / students.length)
        );

        ctx.font = `600 ${fontSize}px Inter, Arial`;

        const availableWidth = radius * 0.60;

        let label = student;

        while (
            ctx.measureText(label).width > availableWidth &&
            label.length > 5
        ) {
            label = label.slice(0, -2) + "…";
        }

        ctx.fillStyle = "#ffffff";
        ctx.shadowColor = "#00000055";
        ctx.shadowBlur = 3;

        ctx.fillText(
            label,
            radius - 20,
            0
        );

        ctx.restore();
    });

    ctx.restore();

    // Outer ring
    ctx.beginPath();
    ctx.arc(center, center, radius + 5, 0, TAU);

    ctx.strokeStyle = "#e8eaff";
    ctx.lineWidth = 7;
    ctx.stroke();

    // Decorative dots
    for (let i = 0; i < 36; i++) {

        const angle =
            (TAU / 36) * i - Math.PI / 2;

        const x =
            center + (radius + 5) * Math.cos(angle);

        const y =
            center + (radius + 5) * Math.sin(angle);

        ctx.beginPath();
        ctx.arc(x, y, 3, 0, TAU);

        ctx.fillStyle = "#ffffff";
        ctx.fill();
    }
}

// =========================================
// WINNER CALCULATION
// =========================================

function getWinnerIndex() {
    const slice = TAU / students.length;
    const relativeAngle = normalizeAngle(-rotation);

    return Math.floor(
        relativeAngle / slice
    ) % students.length;
}

// =========================================
// SPIN WHEEL
// =========================================

function spinWheel() {

    if (isSpinning) return;

    if (students.length === 0) {
        showToast("Сначала добавьте учеников!");
        return;
    }

    const availableStudents = students
        .map((name, index) => ({ name, index }))
        .filter(
            item => !selectedStudents.has(item.name)
        );

    if (availableStudents.length === 0) {
        showToast(
            "Все ученики уже отвечали. Начните новый раунд!"
        );
        return;
    }

    isSpinning = true;

    spinButton.disabled = true;

    spinButton.querySelector(
        "span:nth-child(2)"
    ).textContent = "ВЫБИРАЕМ...";

    // Random available student
    const winner = availableStudents[
        randomIndex(availableStudents.length)
    ];

    const winnerIndex = winner.index;

    const slice = TAU / students.length;

    // Center of selected sector
    const desiredRotation = normalizeAngle(
        -(winnerIndex + 0.5) * slice
    );

    const currentRotation = normalizeAngle(rotation);

    const extraRotation = normalizeAngle(
        desiredRotation - currentRotation
    );

    const startRotation = rotation;

    const finalRotation =
        rotation + TAU * 7 + extraRotation;

    const duration = 5500;
    const startTime = performance.now();

    let lastTick = 0;

    function animate(now) {

        const progress = Math.min(
            (now - startTime) / duration,
            1
        );

        // Ease-out cubic
        const eased =
            1 - Math.pow(1 - progress, 4);

        rotation =
            startRotation +
            (finalRotation - startRotation) * eased;

        drawWheel();

        const tick = Math.floor(progress * 35);

        if (tick > lastTick) {
            playTone(
                400 + (1 - progress) * 300,
                0.035,
                0.018
            );

            lastTick = tick;
        }

        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            rotation = finalRotation;
            drawWheel();
            finishSpin();
        }
    }

    requestAnimationFrame(animate);
}

// =========================================
// FINISH SPIN
// =========================================

function finishSpin() {

    isSpinning = false;

    const winnerIndex = getWinnerIndex();
    const winner = students[winnerIndex];

    currentStudent = winner;

    selectedStudents.add(winner);

    // Automatically select question
    selectQuestion();

    // Update student card
    studentName.textContent = winner;

    studentAvatar.textContent =
        winner.charAt(0).toUpperCase();

    studentSubtitle.textContent =
        "Поздравляем! Сегодня ваша очередь отвечать.";

    studentName.style.color = "#ffffff";
    studentSubtitle.style.color = "#35d6a0";

    spinButton.disabled = false;

    spinButton.querySelector(
        "span:nth-child(2)"
    ).textContent = "КРУТИТЬ КОЛЕСО";

    updateUI();
    saveData();

    playWinSound();

    showToast(`🎉 Выбран ученик: ${winner}`);
}

// =========================================
// QUESTIONS
// =========================================

function selectQuestion(excludeCurrent = false) {

    if (questions.length === 0) {

        currentQuestion = null;

        questionContent.textContent =
            "Добавьте вопросы в банк вопросов.";

        questionNumber.textContent =
            "НЕТ ВОПРОСОВ";

        nextQuestionButton.disabled = true;

        return;
    }

    let availableQuestions = questions;

    if (excludeCurrent && questions.length > 1) {

        availableQuestions = questions.filter(
            question => question !== currentQuestion
        );
    }

    currentQuestion = availableQuestions[
        randomIndex(availableQuestions.length)
    ];

    questionContent.textContent = currentQuestion;

    const originalIndex =
        questions.indexOf(currentQuestion);

    questionNumber.textContent =
        `ВОПРОС ${originalIndex + 1} / ${questions.length}`;

    nextQuestionButton.disabled = false;
}

nextQuestionButton.addEventListener("click", () => {

    if (!currentStudent) {
        showToast("Сначала выберите ученика!");
        return;
    }

    selectQuestion(true);

    playTone(650);
});

// =========================================
// STUDENTS MANAGEMENT
// =========================================

saveStudentsButton.addEventListener("click", () => {

    if (isSpinning) {
        showToast("Дождитесь окончания вращения!");
        return;
    }

    const newStudents = studentsInput.value
        .split("\n")
        .map(name => name.trim())
        .filter(Boolean);

    // Remove duplicates, ignoring letter case
    const uniqueStudents = [
        ...new Map(
            newStudents.map(name => [
                name.toLowerCase(),
                name
            ])
        ).values()
    ];

    if (uniqueStudents.length === 0) {
        showToast("Добавьте хотя бы одного ученика!");
        return;
    }

    const oldStudents = students;

    // Replace student list
    students = uniqueStudents;

    // Keep selections for students still in the list
    selectedStudents = new Set(
        [...selectedStudents].filter(
            name => students.includes(name)
        )
    );

    // Reset current result if student was removed
    if (!students.includes(currentStudent)) {

        currentStudent = null;
        currentQuestion = null;

        studentName.textContent = "Ожидание выбора";
        studentAvatar.textContent = "?";

        studentSubtitle.textContent =
            "Нажмите кнопку вращения";

        studentSubtitle.style.color = "";

        questionContent.textContent =
            "Здесь появится вопрос после выбора ученика.";

        questionNumber.textContent =
            "ВОПРОС НЕ ВЫБРАН";

        nextQuestionButton.disabled = true;
    }

    drawWheel();
    updateUI();
    saveData();

    showToast(
        `Список обновлён! Учеников: ${students.length}`
    );
});

// =========================================
// QUESTIONS MANAGEMENT
// =========================================

saveQuestionsButton.addEventListener("click", () => {

    const newQuestions = questionsInput.value
        .split("\n")
        .map(question => question.trim())
        .filter(Boolean);

    const uniqueQuestions = [
        ...new Set(newQuestions)
    ];

    if (uniqueQuestions.length === 0) {
        showToast("Добавьте хотя бы один вопрос!");
        return;
    }

    questions = uniqueQuestions;

    currentQuestion = null;

    if (currentStudent) {
        selectQuestion();
    } else {

        questionContent.textContent =
            "Вопросы сохранены. Выберите ученика.";

        questionNumber.textContent =
            "ОЖИДАНИЕ ВЫБОРА";

        nextQuestionButton.disabled = true;
    }

    updateUI();
    saveData();

    showToast(
        `Сохранено вопросов: ${questions.length}`
    );
});

// =========================================
// STATISTICS & UI
// =========================================

function updateUI() {

    const total = students.length;

    const selected = students.filter(
        student => selectedStudents.has(student)
    ).length;

    const remaining = total - selected;

    const progress = total > 0
        ? Math.round((selected / total) * 100)
        : 0;

    totalCount.textContent = total;
    remainingCount.textContent = remaining;

    selectedCount.textContent = selected;
    leftCount.textContent = remaining;

    progressPercent.textContent =
        `${progress}%`;

    roundNumber.textContent =
        String(round).padStart(2, "0");

    studentListCount.textContent =
        `${total} учеников`;

    questionListCount.textContent =
        `${questions.length} вопросов`;

    // Synchronize text editors
    studentsInput.value = students.join("\n");
    questionsInput.value = questions.join("\n");

    // Disable spin when all students have answered
    spinButton.disabled =
        isSpinning || remaining === 0;
}

// =========================================
// NEW ROUND
// =========================================

resetButton.addEventListener("click", () => {

    if (isSpinning) return;

    if (students.length === 0) {
        showToast("Список учеников пуст!");
        return;
    }

    const confirmed = confirm(
        "Начать новый раунд? История выбранных учеников будет сброшена."
    );

    if (!confirmed) return;

    selectedStudents.clear();

    currentStudent = null;
    currentQuestion = null;

    round++;

    studentName.textContent =
        "Ожидание выбора";

    studentAvatar.textContent = "?";

    studentSubtitle.textContent =
        "Нажмите кнопку вращения";

    studentSubtitle.style.color = "";

    questionContent.textContent =
        "Здесь появится вопрос после выбора ученика.";

    questionNumber.textContent =
        "ВОПРОС НЕ ВЫБРАН";

    nextQuestionButton.disabled = true;

    updateUI();
    saveData();

    showToast(`Начат раунд №${round}`);
});

// =========================================
// EVENTS
// =========================================

spinButton.addEventListener("click", spinWheel);

// =========================================
// INITIALIZATION
// =========================================

function init() {

    // Validate students
    students = [
        ...new Set(
            students.filter(
                student =>
                    typeof student === "string" &&
                    student.trim()
            )
        )
    ];

    // Validate questions
    questions = [
        ...new Set(
            questions.filter(
                question =>
                    typeof question === "string" &&
                    question.trim()
            )
        )
    ];

    // Remove invalid selections
    selectedStudents = new Set(
        [...selectedStudents].filter(
            name => students.includes(name)
        )
    );

    soundToggle.textContent =
        soundEnabled ? "🔊" : "🔇";

    drawWheel();
    updateUI();
    saveData();

    window.addEventListener("resize", drawWheel);
}

init();
