/* -------------------------------------------------
   CONFIG – point to the CSV file (must be in the same folder)
   ------------------------------------------------- */
<<<<<<< HEAD
const CSV_URL = './verses.csv';   // keep the name exactly as the file above
// At the top of script.js, after the CSV_URL line
// Uncomment ONE of the following lines to force a specific date:
//const TEST_TODAY = '2025-10-28';   // <-- replace with any date you have in the CSV
 const TEST_TODAY = null;       // <-- comment out when you want the real date again

/* -------------------------------------------------
   LIST OF ALL 66 BIBLE BOOKS (used for autocomplete)
   ------------------------------------------------- */
const BIBLE_BOOKS = [
  "Genesis","Exodus","Leviticus","Numbers","Deuteronomy",
  "Joshua","Judges","Ruth","1 Samuel","2 Samuel",
  "1 Kings","2 Kings","1 Chronicles","2 Chronicles",
  "Ezra","Nehemiah","Esther","Job","Psalms",
  "Proverbs","Ecclesiastes","Song of Solomon","Isaiah","Jeremiah",
  "Lamentations","Ezekiel","Daniel","Hosea","Joel",
  "Amos","Obadiah","Jonah","Micah","Nahum",
  "Habakkuk","Zephaniah","Haggai","Zechariah","Malachi",
  "Matthew","Mark","Luke","John","Acts",
  "Romans","1 Corinthians","2 Corinthians","Galatians","Ephesians",
  "Philippians","Colossians","1 Thessalonians","2 Thessalonians",
  "1 Timothy","2 Timothy","Titus","Philemon","Hebrews",
  "James","1 Peter","2 Peter","1 John","2 John",
  "3 John","Jude","Revelation"
];

/* -------------------------------------------------
   GLOBAL STATE
   ------------------------------------------------- */
let verses = [];          // all rows from the CSV
let todayVerse = null;    // the verse object for today
let attemptsLeft = 5;     // max attempts per round
const MAX_ATTEMPTS = 5;   // keep a constant if you need it later

/* -------------------------------------------------
   Helper: tiny CSV parser (expects a header row)
=======
const CSV_URL = './verses.csv';   // <-- keep the name exactly as the file above

/* -------------------------------------------------
   Global state
   ------------------------------------------------- */
let verses = [];          // all rows from the CSV
let todayVerse = null;    // the verse object for *today*
let attemptsLeft = 5;     // max attempts per round

/* -------------------------------------------------
   Helper: tiny CSV parser (expects the header row)
>>>>>>> c504618 (Initial commit – Bible verse guessing game)
   ------------------------------------------------- */
function parseCSV(csvText) {
  const lines = csvText.trim().split('\n');
  const header = lines[0].split(',').map(h => h.trim().toLowerCase());

  return lines.slice(1).map(line => {
    const cols = line.split(',').map(c => c.trim());
    const obj = {};

    header.forEach((key, i) => {
      let val = cols[i] ?? '';

      // Cast numeric fields
<<<<<<< HEAD
      if (['chapter', 'verse'].includes(key)) {
        val = Number(val);
      } else if (key === 'date') {
        // keep as string (ISO format)
        val = val;
      } else if (key === 'text') {
        val = val;
      } else if (key === 'writer') {
        val = val;
      } else if (key === 'book') {
        val = val;
      }
=======
      if (['chapter', 'verse'].includes(key)) val = Number(val);
      else if (key === 'date') val = val;          // keep as string (ISO)
      else if (key === 'text') val = val;          // verse text
      else if (key === 'author') val = val;
      else if (key === 'book') val = val;
>>>>>>> c504618 (Initial commit – Bible verse guessing game)

      obj[key] = val;
    });
    return obj;
  });
}

/* -------------------------------------------------
<<<<<<< HEAD
   Helper: normalise strings for comparison
   ------------------------------------------------- */
function normalize(str) {
  return String(str).toLowerCase().trim().replace(/[^\w\s]/g, '');
}

/* -------------------------------------------------
   Populate the <datalist> – **dynamic version**
   ------------------------------------------------- */
function populateBookDatalist(filter = '') {
  const datalist = document.getElementById('book-list');
  if (!datalist) return; // safety guard

  // Clear any existing options
  datalist.innerHTML = '';

  // Normalise the filter once
  const term = normalize(filter);

  // Decide which books to show:
  //   * If no filter → show *all* books
  //   * Otherwise → show any book whose normalised title includes the term
  const booksToShow = term === ''
    ? BIBLE_BOOKS
    : BIBLE_BOOKS.filter(b => normalize(b).includes(term));

  booksToShow.forEach(book => {
    const opt = document.createElement('option');
    opt.value = book;          // the value that will be inserted into the input
    datalist.appendChild(opt);
  });
}

/* -------------------------------------------------
   Populate the <datalist> for writer (dynamic)
   ------------------------------------------------- */
function populateWriterDatalist(filter = '') {
  const datalist = document.getElementById('writer-list');
  if (!datalist) return; // safety guard

  // Build a unique sorted list of writers from the CSV data
  const writers = Array.from(new Set(verses.map(v => v.writer).filter(Boolean))).sort();

  // Normalise the filter once
  const term = normalize(filter);

  // Decide which writers to show
  const writersToShow = term === ''
    ? writers
    : writers.filter(w => normalize(w).includes(term));

  // Render options
  datalist.innerHTML = '';
  writersToShow.forEach(w => {
    const opt = document.createElement('option');
    opt.value = w;
    datalist.appendChild(opt);
  });
}

// Hook the Book input so it updates the list as you type
const bookInput = document.getElementById('book');
if (bookInput) {
  // Show the full list when the field gains focus
  bookInput.addEventListener('focus', () => populateBookDatalist());

  // Filter the list on every keystroke
  bookInput.addEventListener('input', e => {
    const typed = e.target.value;
    populateBookDatalist(typed);
  });
}

// Hook the Writer input to update the list as you type (similar to book)
const writerInput = document.getElementById('writer');
if (writerInput) {
  writerInput.addEventListener('focus', () => populateWriterDatalist());
  writerInput.addEventListener('input', e => populateWriterDatalist(e.target.value));
}

/* -------------------------------------------------
=======
>>>>>>> c504618 (Initial commit – Bible verse guessing game)
   Load the CSV file (fetch works on a local server)
   ------------------------------------------------- */
fetch(CSV_URL)
  .then(r => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.text();
  })
  .then(csv => {
    verses = parseCSV(csv);
    console.log('✅ CSV parsed – rows:', verses.length);
<<<<<<< HEAD

    // populate writer datalist now we have data
    populateWriterDatalist();

    startRound();   // pick today’s verse and initialise UI
  })
  .catch(err => {
    console.error('❌ CSV load error →', err);
    const verseEl = document.getElementById('verse');
    if (verseEl) verseEl.textContent = '⚠️ Could not load verse data – see console.';
=======
    startRound();          // pick today’s verse and initialise UI
  })
  .catch(err => {
    console.error('❌ CSV load error →', err);
    document.getElementById('verse').textContent =
      '⚠️ Could not load verse data – see console.';
>>>>>>> c504618 (Initial commit – Bible verse guessing game)
  });

/* -------------------------------------------------
   Choose today’s verse (based on the ISO date)
   ------------------------------------------------- */
function startRound() {
<<<<<<< HEAD
  // stop any running fireworks when a new round begins
  if (typeof stopFireworks === 'function') stopFireworks();

  // 1️⃣ Determine the date first
  const today = (typeof TEST_TODAY === 'string' && TEST_TODAY) ? TEST_TODAY : new Date().toISOString().slice(0, 10); // YYYY‑MM‑DD

  // 👇 Debug print – shows the date in the DevTools console
  console.log('📅 Using date →', today);

  // 2️⃣ Now look up the verse for that date
  todayVerse = verses.find(v => v.date === today);

  // 3️⃣ If no verse for today, show a friendly message
  if (!todayVerse) {
    const verseEl = document.getElementById('verse');
    if (verseEl) verseEl.textContent =
=======
  const today = new Date().toISOString().slice(0, 10); // YYYY‑MM‑DD
  todayVerse = verses.find(v => v.date === today);

  if (!todayVerse) {
    // No entry for today – show a friendly message
    document.getElementById('verse').textContent =
>>>>>>> c504618 (Initial commit – Bible verse guessing game)
      'No verse scheduled for today. Add a row to verses.csv.';
    return;
  }

  // Show the verse text
<<<<<<< HEAD
  const verseEl = document.getElementById('verse');
  if (verseEl) verseEl.textContent = `"${todayVerse.text}"`;

  // Reset UI for a fresh round
  attemptsLeft = 5;
  const attemptsEl = document.getElementById('attempts');
  if (attemptsEl) attemptsEl.textContent = attemptsLeft;

  const feedbackEl = document.getElementById('feedback');
  if (feedbackEl) feedbackEl.textContent = '';

  const dotsEl = document.getElementById('resultDots');
  if (dotsEl) dotsEl.innerHTML = '';

  const formEl = document.getElementById('guessForm');
  if (formEl) formEl.reset();

  const nextBtn = document.getElementById('nextBtn');
  if (nextBtn) nextBtn.style.display = 'none';
}



/* -------------------------------------------------
   Submit handler – this is the only place that reacts to the button
   ------------------------------------------------- */
const guessFormEl = document.getElementById('guessForm');
if (guessFormEl) {
  guessFormEl.addEventListener('submit', function (e) {
    e.preventDefault();                       // stop the form from reloading

    // -----------------------------------------------------------------
    // 1️⃣ Gather raw input values
    // -----------------------------------------------------------------
    const raw = {
      writer:   document.getElementById('writer').value.trim(),
      book:     document.getElementById('book').value.trim(),
      chapter:  Number(document.getElementById('chapter').value),
      verse:    Number(document.getElementById('verseNum').value)
    };

    // -----------------------------------------------------------------
    // 2️⃣ Simple “all fields required” validation
    // -----------------------------------------------------------------
    if (!raw.writer || !raw.book || !raw.chapter || !raw.verse) {
      document.getElementById('feedback').textContent =
        '⚠️ Please fill in **all** fields before submitting.';
      return;                                   // <-- stop here, but we’ll still get feedback later
    }

    // -----------------------------------------------------------------
    // 3️⃣ Normalise strings for case‑insensitive comparison
    // -----------------------------------------------------------------
    const guess = {
      writer:   normalize(raw.writer),   // helper that lower‑cases & strips punctuation
      book:     normalize(raw.book),
      chapter:  raw.chapter,
      verse:    raw.verse
    };

    // -----------------------------------------------------------------
    // 4️⃣ Validate the book name against our master list (optional but nice)
    // -----------------------------------------------------------------
    const isKnownBook = BIBLE_BOOKS.some(b => normalize(b) === guess.book);
    if (!isKnownBook) {
      document.getElementById('feedback').textContent =
        '⚠️ That book name isn’t recognised. Please pick a book from the list.';
      return;                                   // stop – don’t count this as an attempt
    }

    // -----------------------------------------------------------------
    // 5️⃣ Compare each part with the correct answer (todayVerse)
    // -----------------------------------------------------------------
    const results = {
      writer:   guess.writer === normalize(todayVerse.writer), // writer column in CSV
      book:     guess.book   === normalize(todayVerse.book),
      chapter:  guess.chapter === todayVerse.chapter,            // require exact match
      verse:    guess.verse === todayVerse.verse                 // require exact match (removed ±1 tolerance)
    };

    // -----------------------------------------------------------------
    // Optional: produce directional hints for chapter/verse when wrong
    // -----------------------------------------------------------------
    const numericHints = [];
    // chapter hint (direction only — no magnitude)
    if (!results.chapter && Number.isFinite(guess.chapter) && Number.isFinite(todayVerse.chapter)) {
      if (guess.chapter < todayVerse.chapter) {
        numericHints.push('Chapter is too low → try a higher number.');
      } else {
        numericHints.push('Chapter is too high → try a lower number.');
      }
    }
    // verse hint (direction only — no magnitude)
    if (!results.verse && Number.isFinite(guess.verse) && Number.isFinite(todayVerse.verse)) {
      if (guess.verse < todayVerse.verse) {
        numericHints.push('Verse is too low → try a higher number.');
      } else {
        numericHints.push('Verse is too high → try a lower number.');
      }
    }

    // -----------------------------------------------------------------
    // 6️⃣ Draw the coloured dots (green = correct, red = wrong)
    // -----------------------------------------------------------------
    const dotContainer = document.getElementById('resultDots');
    dotContainer.innerHTML = '';               // clear previous round
    ['writer', 'book', 'chapter', 'verse'].forEach(part => {
      const dot = document.createElement('div');
      dot.classList.add('dot');
      dot.classList.add(results[part] ? 'correct' : 'wrong');
      dot.title = `${part.charAt(0).toUpperCase() + part.slice(1)} ${results[part] ? '✔' : '✘'}`;
      dotContainer.appendChild(dot);
    });

    // -----------------------------------------------------------------
    // 7️⃣ Did the player get everything right?
    // -----------------------------------------------------------------
    const allCorrect = Object.values(results).every(v => v);
    const feedbackEl = document.getElementById('feedback');

    if (allCorrect) {
      feedbackEl.textContent = '✅ Perfect! You got everything right.';
      document.getElementById('nextBtn').style.display = 'inline-block';
      recordWinForToday();                       // <-- record the success
      // trigger fireworks for correct answer
      if (typeof startFireworks === 'function') startFireworks(3000); // 3s by default
      return;                                   // round ends – no attempt penalty
    }

    // -----------------------------------------------------------------
    // 8️⃣ Wrong guess – decrement attempts and show feedback
    // -----------------------------------------------------------------
    attemptsLeft--;
    document.getElementById('attempts').textContent = attemptsLeft;

    if (attemptsLeft === 0) {
      // Out of attempts – reveal the correct answer
      feedbackEl.innerHTML =
        `❌ Out of attempts.<br>
         Correct answer: <strong>${todayVerse.writer}</strong>,
         <strong>${todayVerse.book}</strong> ${todayVerse.chapter}:${todayVerse.verse}`;
      document.getElementById('nextBtn').style.display = 'inline-block';
    } else {
      // Still have tries left – encourage another attempt and show numeric hints if available
      if (numericHints.length) {
        // show both chapter and verse hints (each on its own line)
        feedbackEl.innerHTML = 'Some parts are wrong – try again!<br><strong>Hint:</strong><br>' +
          numericHints.map(h => `&nbsp;&nbsp;• ${h}`).join('<br>');
      } else {
        feedbackEl.textContent = 'Some parts are wrong – try again!';
      }
    }
  }); // end submit handler
} // end if (guessFormEl)
=======
  document.getElementById('verse').textContent = `"${todayVerse.text}"`;

  // Reset UI
  attemptsLeft = 5;
  document.getElementById('attempts').textContent = attemptsLeft;
  document.getElementById('feedback').textContent = '';
  document.getElementById('resultDots').innerHTML = '';
  document.getElementById('guessForm').reset();
  document.getElementById('nextBtn').style.display = 'none';
}

/* -------------------------------------------------
   Evaluate a guess
   ------------------------------------------------- */
document.getElementById('guessForm').addEventListener('submit', e => {
  e.preventDefault();

  if (!todayVerse) return;   // safety guard

  // Grab the user’s answers
  const guess = {
    author:   document.getElementById('author').value.trim().toLowerCase(),
    book:     document.getElementById('book').value.trim().toLowerCase(),
    chapter:  Number(document.getElementById('chapter').value),
    verse:    Number(document.getElementById('verseNum').value)
  };

  // Compare each part (case‑insensitive for strings)
  const results = {
    author:  guess.author   === todayVerse.author.toLowerCase(),
    book:    guess.book     === todayVerse.book.toLowerCase(),
    chapter: guess.chapter  === todayVerse.chapter,
    verse:   guess.verse    === todayVerse.verse
  };

  // Show coloured dots
  const dotContainer = document.getElementById('resultDots');
  dotContainer.innerHTML = '';   // clear previous round’s dots

  // Order: Author → Book → Chapter → Verse
  ['author', 'book', 'chapter', 'verse'].forEach(part => {
    const dot = document.createElement('div');
    dot.classList.add('dot');
    dot.classList.add(results[part] ? 'correct' : 'wrong');
    dot.title = `${part.charAt(0).toUpperCase()+part.slice(1)} ${results[part] ? '✔' : '✘'}`;
    dotContainer.appendChild(dot);
  });

  // Did the player get everything right?
  const allCorrect = Object.values(results).every(v => v);
  if (allCorrect) {
    document.getElementById('feedback').textContent = '✅ Perfect! You got everything right.';
    document.getElementById('nextBtn').style.display = 'inline-block';
    return;   // round ends – no more attempts needed
  }

  // Wrong guess – decrement attempts
  attemptsLeft--;
  document.getElementById('attempts').textContent = attemptsLeft;

  if (attemptsLeft === 0) {
    // Out of attempts – show the correct answer
    document.getElementById('feedback').innerHTML =
      `❌ Out of attempts.<br>
       Correct answer: <strong>${todayVerse.author}</strong>,
       <strong>${todayVerse.book}</strong> ${todayVerse.chapter}:${todayVerse.verse}`;
    document.getElementById('nextBtn').style.display = 'inline-block';
  } else {
    document.getElementById('feedback').textContent = 'Some parts are wrong – try again!';
  }
});
>>>>>>> c504618 (Initial commit – Bible verse guessing game)

/* -------------------------------------------------
   “Next” button – useful while developing (or after a round ends)
   ------------------------------------------------- */
<<<<<<< HEAD
const nextBtnEl = document.getElementById('nextBtn');
if (nextBtnEl) {
  nextBtnEl.addEventListener('click', () => {
    startRound();
  });
}

/* -------------------------------------------------
   Simple canvas fireworks — startFireworks / stopFireworks
   lightweight implementation, self-contained
   ------------------------------------------------- */
let __fw = {
  running: false,
  raf: null,
  ctx: null,
  particles: [],
  lastSpawn: 0,
  cw: 0,
  ch: 0,
  endTimer: null
};

function _fwResize() {
  const c = document.getElementById('fwCanvas');
  if (!c) return;
  c.width = window.innerWidth;
  c.height = window.innerHeight;
  __fw.cw = c.width;
  __fw.ch = c.height;
}

function _spawnBurst(x, y) {
  const count = 30 + Math.floor(Math.random() * 40);
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1 + Math.random() * 4;
    __fw.particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - (Math.random() * 1.5),
      life: 60 + Math.floor(Math.random() * 40),
      age: 0,
      color: `hsl(${Math.floor(Math.random() * 360)}, 90%, ${40 + Math.random() * 20}%)`,
      alpha: 1
    });
  }
}

function _fwTick() {
  const canvas = document.getElementById('fwCanvas');
  if (!canvas || !__fw.ctx) return;
  const ctx = __fw.ctx;
  ctx.clearRect(0, 0, __fw.cw, __fw.ch);

  const now = performance.now();
  // spawn occasional bursts while running
  if (now - __fw.lastSpawn > 250) {
    __fw.lastSpawn = now;
    const x = 100 + Math.random() * (__fw.cw - 200);
    const y = 100 + Math.random() * (__fw.ch / 2);
    _spawnBurst(x, y);
  }

  // update & draw particles
  for (let i = __fw.particles.length - 1; i >= 0; i--) {
    const p = __fw.particles[i];
    p.vy += 0.06; // gravity
    p.x += p.vx;
    p.y += p.vy;
    p.age++;
    p.alpha = 1 - p.age / p.life;

    if (p.alpha <= 0 || p.y > __fw.ch + 50) {
      __fw.particles.splice(i, 1);
      continue;
    }

    ctx.globalAlpha = p.alpha;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  if (__fw.running) __fw.raf = requestAnimationFrame(_fwTick);
}

function startFireworks(duration = 3000) {
  const canvas = document.getElementById('fwCanvas');
  if (!canvas) return;
  if (__fw.running) {
    // extend current fireworks
    clearTimeout(__fw.endTimer);
    __fw.endTimer = setTimeout(stopFireworks, duration);
    return;
  }

  canvas.style.display = 'block';
  __fw.ctx = canvas.getContext('2d');
  _fwResize();
  window.addEventListener('resize', _fwResize);

  __fw.running = true;
  __fw.lastSpawn = 0;
  __fw.particles = [];
  __fw.raf = requestAnimationFrame(_fwTick);

  __fw.endTimer = setTimeout(() => {
    stopFireworks();
  }, duration);
}

function stopFireworks() {
  const canvas = document.getElementById('fwCanvas');
  if (!canvas) return;
  __fw.running = false;
  if (__fw.raf) cancelAnimationFrame(__fw.raf);
  __fw.raf = null;
  __fw.particles = [];
  clearTimeout(__fw.endTimer);
  __fw.endTimer = null;
  window.removeEventListener('resize', _fwResize);
  if (__fw.ctx) {
    __fw.ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  canvas.style.display = 'none';
}

// Simple day helper (uses TEST_TODAY when set)
function getTodayIso() {
  return (typeof TEST_TODAY === 'string' && TEST_TODAY) ? TEST_TODAY : new Date().toISOString().slice(0, 10);
}

// localStorage key
const STATS_KEY = 'bg_user_stats_v1';

// load / save
function loadStats() {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (!raw) return { totalWins: 0, totalDays: 0, streak: 0, lastWin: null, wins: {} };
    return JSON.parse(raw);
  } catch (e) {
    console.error('loadStats failed', e);
    return { totalWins: 0, totalDays: 0, streak: 0, lastWin: null, wins: {} };
  }
}
function saveStats(s) {
  try { localStorage.setItem(STATS_KEY, JSON.stringify(s)); } catch (e) { console.error('saveStats failed', e); }
}

// helper: ISO date for "yesterday"
function isoOffsetDays(iso, delta) {
  const d = new Date(iso + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

// record a win for today (idempotent)
function recordWinForToday() {
  const today = getTodayIso();
  const stats = loadStats();
  if (stats.wins && stats.wins[today]) {
    // already recorded today
    return stats;
  }

  stats.wins = stats.wins || {};
  stats.wins[today] = true;
  stats.totalWins = (stats.totalWins || 0) + 1;
  stats.totalDays = Object.keys(stats.wins).length;

  // compute streak
  if (stats.lastWin === today) {
    // nothing
  } else if (stats.lastWin && stats.lastWin === isoOffsetDays(today, -1)) {
    stats.streak = (stats.streak || 0) + 1;
  } else {
    stats.streak = 1;
  }
  stats.lastWin = today;

  saveStats(stats);
  displayStats();
  return stats;
}

// render a small stats summary in the UI
function displayStats() {
  const el = document.getElementById('stats');
  if (!el) return;
  const s = loadStats();
  el.innerHTML = `Streak: <strong>${s.streak || 0}</strong> day(s) · Total wins: <strong>${s.totalWins || 0}</strong> · Days played: <strong>${s.totalDays || 0}</strong>`;
}

// call displayStats on load so users immediately see their stats
displayStats();
=======
document.getElementById('nextBtn').addEventListener('click', () => {
  // For a real production version you would probably reload the page
  // or fetch the next day’s verse. Here we just restart the round.
  startRound();
});
>>>>>>> c504618 (Initial commit – Bible verse guessing game)
