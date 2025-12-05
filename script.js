/* -------------------------------------------------
   CONFIG – point to the CSV file (must be in the same folder)
   ------------------------------------------------- */
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
let bookWrongCount = 0;   // number of times the player has guessed the book incorrectly this round

/* -------------------------------------------------
   Helper: tiny CSV parser (expects a header row)
   ------------------------------------------------- */
function parseCSV(csvText) {
  // --- BEGIN: Improved CSV parsing for quoted fields (easy to revert) ---
  const lines = csvText.trim().split('\n');
  // normalize header names: lower-case and replace spaces with underscores
  const header = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s+/g, '_'));

  return lines.slice(1).map(line => {
    // Split only on commas outside quotes
    const cols = line.match(/("[^"]*"|[^,]+)/g).map(c => {
      c = c.trim();
      // Remove leading/trailing quotes
      if (c.startsWith('"') && c.endsWith('"')) c = c.slice(1, -1);
      return c;
    });
    const obj = {};
    header.forEach((key, i) => {
      let val = cols[i] ?? '';
      if (["chapter", "verse"].includes(key)) val = Number(val);
      obj[key] = val;
    });
    return obj;
  });
  // --- END: Improved CSV parsing for quoted fields ---
}

/* -------------------------------------------------
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
   Load the CSV file (works locally and on GitHub Pages)
   Tries CSV_URL first, then a couple of sensible fallbacks
   ------------------------------------------------- */
function tryFetchCsv(urls) {
  // tries each URL in order, returns a promise that resolves to the text
  let idx = 0;
  function attempt() {
    if (idx >= urls.length) return Promise.reject(new Error('All fetch attempts failed'));
    const u = urls[idx++];
    console.log('Attempting to load CSV from', u);
    return fetch(u).then(r => {
      if (!r.ok) throw new Error(`HTTP ${r.status} for ${u}`);
      return r.text();
    }).catch(err => {
      console.warn('Fetch failed for', u, err.message);
      return attempt();
    });
  }
  return attempt();
}

// Build fallback URL candidates
const candidateUrls = [CSV_URL];
try {
  // base path of current page (keeps any repo subpath)
  const pathBase = location.pathname.endsWith('/') ? location.pathname : location.pathname.replace(/\/[^/]*$/, '/');
  const baseCandidate = location.origin + pathBase;
  candidateUrls.push(baseCandidate + 'verses.csv');
} catch (e) {
  // ignore
}
// If repository info is known, try GitHub Pages canonical URL
try {
  const ghOwner = 'insperitas';
  const ghRepo = 'bible-verse-guess';
  candidateUrls.push(`https://` + ghOwner + `.github.io/` + ghRepo + `/verses.csv`);
} catch (e) {}

tryFetchCsv(candidateUrls)
  .then(csv => {
    verses = parseCSV(csv);
    console.log('✅ CSV parsed – rows:', verses.length);

    // populate writer datalist now we have data
    populateWriterDatalist();

    startRound();   // pick today’s verse and initialise UI
  })
  .catch(err => {
    console.error('❌ CSV load error →', err);
    const verseEl = document.getElementById('verse');
    if (verseEl) verseEl.textContent = '⚠️ Could not load verse data – check that verses.csv is published and reachable (see console).';
  });

/* -------------------------------------------------
   Choose today’s verse (based on the ISO date)
   ------------------------------------------------- */
function startRound() {
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
      'No verse scheduled for today. Add a row to verses.csv.';
    return;
  }

  // Show the verse text
  const verseEl = document.getElementById('verse');
  if (verseEl) {
    // strip any accidental surrounding quotes (CSV parser already strips most quotes)
    let t = String(todayVerse.text || '');
    if (t.startsWith('"') && t.endsWith('"')) t = t.slice(1, -1);
    verseEl.textContent = t;
  }

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
  // Reset clue counter & clear any displayed clues
  bookWrongCount = 0;
  const cluesEl = document.getElementById('clues');
  if (cluesEl) cluesEl.innerHTML = '';
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

    // If the book guess is wrong, show the next clue (if available)
    if (!results.book) {
      bookWrongCount = (bookWrongCount || 0) + 1;
      const clueKey = `clue_${bookWrongCount}`;
      const clueText = todayVerse && (todayVerse[clueKey] || todayVerse[clueKey.toLowerCase()]);
      if (clueText) {
        const cluesEl = document.getElementById('clues');
        if (cluesEl) {
          const p = document.createElement('p');
          p.className = 'clue';
          p.textContent = `Clue ${bookWrongCount}: ${clueText}`;
          cluesEl.appendChild(p);
        }
      }
    }

    // -----------------------------------------------------------------
    // 7️⃣ Did the player get everything right?
    // -----------------------------------------------------------------
    const allCorrect = Object.values(results).every(v => v);
    const feedbackEl = document.getElementById('feedback');

    if (allCorrect) {
      feedbackEl.textContent = '✅ Perfect! You got everything right.';
      // Append link to the official text & comments for the day
      try {
        const jwUrl = 'https://wol.jw.org/en/wol/h/r1/lp-e';
        const br = document.createElement('br');
        const a = document.createElement('a');
        a.href = jwUrl;
        a.target = '_blank';
        a.rel = 'noopener';
        a.textContent = 'Read the actual text and comments for today';
  a.classList.add('jw-link');
        feedbackEl.appendChild(br);
        feedbackEl.appendChild(a);
      } catch (e) {
        // defensive: if DOM isn't available for some reason, skip linking
        console.error('Could not append JW link', e);
      }

    // Next button removed — no UI action needed
      // compute attempts used (1 = first try)
      const attemptsUsed = MAX_ATTEMPTS - attemptsLeft + 1;
      try {
        const score = computeScore(guess, todayVerse, attemptsUsed);
        // persist numeric score for today
        recordScoreForToday(score);
        // show the numeric score in the feedback area
        const pScore = document.createElement('p');
        pScore.className = 'round-score';
        pScore.textContent = `Score for today: ${score}/100`;
        feedbackEl.appendChild(document.createElement('br'));
        feedbackEl.appendChild(pScore);
      } catch (e) {
        console.error('Scoring failed', e);
      }

      recordWinForToday();                       // <-- record the success (win metadata)
      // trigger fireworks for correct answer
      if (typeof startFireworks === 'function') {
        console.log('Triggering fireworks for correct answer');
        startFireworks(3000); // 3s by default
      } else {
        console.warn('startFireworks is not defined');
      }
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
      // Append link to the official text & comments for the day
      try {
        const jwUrl = 'https://wol.jw.org/en/wol/h/r1/lp-e';
        const a = document.createElement('a');
        a.href = jwUrl;
        a.target = '_blank';
        a.rel = 'noopener';
        a.textContent = 'Read the actual text and comments for today';
  a.classList.add('jw-link');
        feedbackEl.appendChild(document.createElement('br'));
        feedbackEl.appendChild(a);
      } catch (e) {
        console.error('Could not append JW link', e);
      }

      // compute and save a numeric score for today based on the final (failed) guess
      try {
        const attemptsUsed = MAX_ATTEMPTS - attemptsLeft; // when attemptsLeft===0 this equals MAX_ATTEMPTS
        const score = computeScore(guess, todayVerse, attemptsUsed);
        recordScoreForToday(score);
        const pScore = document.createElement('p');
        pScore.className = 'round-score';
        pScore.textContent = `Score for today: ${score}/100`;
        feedbackEl.appendChild(document.createElement('br'));
        feedbackEl.appendChild(pScore);
      } catch (e) {
        console.error('Failed to compute/save score on round end', e);
      }

    // Next button removed — no UI action needed
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

/* Next button removed from HTML — no event wiring required */

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
  console.log('startFireworks called with duration=', duration, 'canvasExists=', !!canvas);
  if (!canvas) {
    console.warn('startFireworks: no canvas element with id fwCanvas found');
    return;
  }
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
  console.log('stopFireworks called, canvasExists=', !!canvas);
  if (!canvas) {
    console.warn('stopFireworks: no canvas element with id fwCanvas found');
    return;
  }
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
    if (!raw) return { totalWins: 0, totalDays: 0, streak: 0, lastWin: null, wins: {}, scores: {} };
    const parsed = JSON.parse(raw);
    // Backwards-compat: ensure scores map exists
    if (!parsed.scores) parsed.scores = {};
    return parsed;
  } catch (e) {
    console.error('loadStats failed', e);
    return { totalWins: 0, totalDays: 0, streak: 0, lastWin: null, wins: {}, scores: {} };
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

/* -------------------------------------------------
   Scoring: compute a 0-100 score for a round
   Inputs:
     - guess: { writer, book, chapter, verse } (normalized writer/book)
     - answer: todayVerse row from CSV (raw values: writer/book/chapter/verse)
     - attemptsUsed: integer >=1 (1 = first try)
   Outputs: integer score 0..100
   ------------------------------------------------- */
function computeScore(guess, answer, attemptsUsed) {
  // defensive checks
  if (!answer || !guess || !Number.isFinite(attemptsUsed)) return 0;

  // Weights (sum to 100)
  const W = { writer: 25, book: 30, chapter: 20, verse: 25 };

  // writer & book are strict equality (normalized)
  const writerScore = (guess.writer === normalize(answer.writer)) ? 1 : 0;
  const bookScore = (guess.book === normalize(answer.book)) ? 1 : 0;

  // Chapter proximity: exact=1, ±1=0.6, within 3=0.3, else 0
  let chapterScore = 0;
  if (Number.isFinite(guess.chapter) && Number.isFinite(answer.chapter)) {
    const d = Math.abs(guess.chapter - answer.chapter);
    if (d === 0) chapterScore = 1;
    else if (d === 1) chapterScore = 0.6;
    else if (d <= 3) chapterScore = 0.3;
    else chapterScore = 0;
  }

  // Verse proximity: exact=1, ±1=0.7, within 3=0.4, within 10=0.15, else 0
  let verseScore = 0;
  if (Number.isFinite(guess.verse) && Number.isFinite(answer.verse)) {
    const d = Math.abs(guess.verse - answer.verse);
    if (d === 0) verseScore = 1;
    else if (d === 1) verseScore = 0.7;
    else if (d <= 3) verseScore = 0.4;
    else if (d <= 10) verseScore = 0.15;
    else verseScore = 0;
  }

  const base = writerScore * W.writer + bookScore * W.book + chapterScore * W.chapter + verseScore * W.verse;

  // Attempts multiplier: first try = 1.0, then decays. Keep a sensible floor.
  const decayPerExtraAttempt = 0.12; // reduce multiplier per extra attempt after the first
  const mult = Math.max(0.35, 1 - (attemptsUsed - 1) * decayPerExtraAttempt);

  const finalScore = Math.round(Math.max(0, Math.min(100, base * mult)));
  return finalScore;
}

// Record a numeric score for today (idempotent). Stores under stats.scores[YYYY-MM-DD]
function recordScoreForToday(score) {
  try {
    const today = getTodayIso();
    const stats = loadStats();
    stats.scores = stats.scores || {};
    // Only store highest score for the day (in case of multiple wins)
    const existing = Number.isFinite(stats.scores[today]) ? stats.scores[today] : null;
    if (existing === null || score > existing) stats.scores[today] = score;
    stats.lastScore = stats.scores[today];
    saveStats(stats);
    displayStats();
    return stats;
  } catch (e) {
    console.error('recordScoreForToday failed', e);
  }
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
  // Show basic stats plus today's numeric score if available
  const today = getTodayIso();
  const todaysScore = (s.scores && Number.isFinite(s.scores[today])) ? s.scores[today] : null;
  el.innerHTML = `Streak: <strong>${s.streak || 0}</strong> day(s) · Total wins: <strong>${s.totalWins || 0}</strong> · Days played: <strong>${s.totalDays || 0}</strong>`;
  if (todaysScore !== null) {
    el.innerHTML += ` · Today's score: <strong>${todaysScore}/100</strong>`;
  }
}

// call displayStats on load so users immediately see their stats
displayStats();