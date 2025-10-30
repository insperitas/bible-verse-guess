/* -------------------------------------------------
   CONFIG – point to the CSV file (must be in the same folder)
   ------------------------------------------------- */
const CSV_URL = './verses.csv';   // <-- keep the name exactly as the file above

/* -------------------------------------------------
   Global state
   ------------------------------------------------- */
let verses = [];          // all rows from the CSV
let todayVerse = null;    // the verse object for *today*
let attemptsLeft = 5;     // max attempts per round

/* -------------------------------------------------
   Helper: tiny CSV parser (expects the header row)
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
      if (['chapter', 'verse'].includes(key)) val = Number(val);
      else if (key === 'date') val = val;          // keep as string (ISO)
      else if (key === 'text') val = val;          // verse text
      else if (key === 'author') val = val;
      else if (key === 'book') val = val;

      obj[key] = val;
    });
    return obj;
  });
}

/* -------------------------------------------------
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
    startRound();          // pick today’s verse and initialise UI
  })
  .catch(err => {
    console.error('❌ CSV load error →', err);
    document.getElementById('verse').textContent =
      '⚠️ Could not load verse data – see console.';
  });

/* -------------------------------------------------
   Choose today’s verse (based on the ISO date)
   ------------------------------------------------- */
function startRound() {
  const today = new Date().toISOString().slice(0, 10); // YYYY‑MM‑DD
  todayVerse = verses.find(v => v.date === today);

  if (!todayVerse) {
    // No entry for today – show a friendly message
    document.getElementById('verse').textContent =
      'No verse scheduled for today. Add a row to verses.csv.';
    return;
  }

  // Show the verse text
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

/* -------------------------------------------------
   “Next” button – useful while developing (or after a round ends)
   ------------------------------------------------- */
document.getElementById('nextBtn').addEventListener('click', () => {
  // For a real production version you would probably reload the page
  // or fetch the next day’s verse. Here we just restart the round.
  startRound();
});