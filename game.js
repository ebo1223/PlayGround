const symbols = ["🍓", "🍋", "🍇", "🥝", "🍊", "🫐", "🍒", "🥥"];

const board = document.getElementById("board");
const movesEl = document.getElementById("moves");
const timerEl = document.getElementById("timer");
const restartButton = document.getElementById("restartButton");
const playAgainButton = document.getElementById("playAgainButton");
const winModal = document.getElementById("winModal");
const finalMoves = document.getElementById("finalMoves");
const finalTime = document.getElementById("finalTime");
const soundButton = document.getElementById("soundButton");
const toast = document.getElementById("toast");

let deck = [];
let flipped = [];
let matchedCount = 0;
let moves = 0;
let seconds = 0;
let timerId = null;
let started = false;
let locked = false;
let soundEnabled = true;
let toastId = null;

function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function formatTime(value) {
  const minutes = Math.floor(value / 60);
  const remainder = value % 60;
  return `${minutes}:${String(remainder).padStart(2, "0")}`;
}

function startTimer() {
  if (started) return;
  started = true;
  timerId = setInterval(() => {
    seconds += 1;
    timerEl.textContent = formatTime(seconds);
  }, 1000);
}

function stopTimer() {
  clearInterval(timerId);
  timerId = null;
}

function tone(frequency, duration = 0.08) {
  if (!soundEnabled) return;
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const context = new AudioContext();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.frequency.value = frequency;
    oscillator.type = "sine";
    gain.gain.setValueAtTime(0.035, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + duration);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + duration);
  } catch (_) {}
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastId);
  toastId = setTimeout(() => toast.classList.remove("show"), 1300);
}

function renderBoard() {
  board.innerHTML = "";
  deck.forEach((symbol, index) => {
    const card = document.createElement("button");
    card.className = "card";
    card.type = "button";
    card.dataset.symbol = symbol;
    card.dataset.index = index;
    card.setAttribute("aria-label", "Hidden card");
    card.innerHTML = `
      <span class="card-inner">
        <span class="card-face card-back"></span>
        <span class="card-face card-front">${symbol}</span>
      </span>`;
    card.addEventListener("click", () => flipCard(card));
    board.appendChild(card);
  });
}

function flipCard(card) {
  if (locked || card.classList.contains("flipped") || card.classList.contains("matched")) return;
  startTimer();
  tone(420, 0.045);
  card.classList.add("flipped");
  card.setAttribute("aria-label", `Card ${card.dataset.symbol}`);
  flipped.push(card);

  if (flipped.length === 2) {
    moves += 1;
    movesEl.textContent = moves;
    const [first, second] = flipped;

    if (first.dataset.symbol === second.dataset.symbol) {
      setTimeout(() => {
        first.classList.add("matched");
        second.classList.add("matched");
        first.setAttribute("aria-label", "Matched card");
        second.setAttribute("aria-label", "Matched card");
        flipped = [];
        matchedCount += 2;
        tone(680, 0.12);
        if (matchedCount === deck.length) finishGame();
      }, 240);
    } else {
      locked = true;
      setTimeout(() => {
        first.classList.remove("flipped");
        second.classList.remove("flipped");
        first.setAttribute("aria-label", "Hidden card");
        second.setAttribute("aria-label", "Hidden card");
        flipped = [];
        locked = false;
      }, 760);
    }
  }
}

function finishGame() {
  stopTimer();
  setTimeout(() => {
    finalMoves.textContent = moves;
    finalTime.textContent = formatTime(seconds);
    winModal.classList.add("show");
    winModal.setAttribute("aria-hidden", "false");
  }, 350);
}

function resetGame() {
  stopTimer();
  deck = shuffle([...symbols, ...symbols]);
  flipped = [];
  matchedCount = 0;
  moves = 0;
  seconds = 0;
  started = false;
  locked = false;
  movesEl.textContent = "0";
  timerEl.textContent = "0:00";
  winModal.classList.remove("show");
  winModal.setAttribute("aria-hidden", "true");
  renderBoard();
}

restartButton.addEventListener("click", () => {
  resetGame();
  showToast("New game started");
  tone(520);
});

playAgainButton.addEventListener("click", resetGame);

soundButton.addEventListener("click", () => {
  soundEnabled = !soundEnabled;
  soundButton.classList.toggle("muted", !soundEnabled);
  soundButton.setAttribute("aria-label", soundEnabled ? "Mute sound" : "Unmute sound");
  if (soundEnabled) tone(520);
});

resetGame();
