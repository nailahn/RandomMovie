/* ═══════════════════════════════════════════════════
   WhatMovie? — script.js
   Vanilla JS — TMDB API v3
   Replace YOUR_TMDB_API_KEY with your actual key
   ═══════════════════════════════════════════════════ */

const API_KEY = "22e2207e5735bce300670ed11a4e72d9";
const BASE = "https://api.themoviedb.org/3";
const IMG = "https://image.tmdb.org/t/p/w780";
const IMG_LG = "https://image.tmdb.org/t/p/original";

/* ══════════════════════════════════════════
   LANGUAGE / i18n SYSTEM
   currentLang: 'id' | 'en'
   Genre chips & genre result tags always
   stay English regardless of toggle.
══════════════════════════════════════════ */
const TEXTS = {
  id: {
    eyebrow: "🎬 \u00a0Rekomendasi Film Sinematik",
    heroLine1: "WhatMovie?",
    heroLine2: "Malem ini nonton apa nih?",
    heroSub: "Filter sesuai selera. Temukan film yang kamu butuhkan malam ini.",
    scrollCta: "Mulai sekarang",
    sectionLabel: "// Konfigurasi Selera",
    labelGenre: "Genre",
    labelYear: "Tahun Rilis",
    labelRating: "Rating Minimal",
    labelLang: "Bahasa / Negara",
    yearFrom: "dari",
    yearTo: "sampai",
    ratingAll: "Semua",
    searchBtn: "Cari Rekomendasi!",
    loaderPhrases: [
      "Mencari film terbaik untukmu",
      "Memindai ribuan judul",
      "Menyortir calon terbaik",
      "Hampir menemukan pilihanmu",
    ],
    loaderSubs: [
      "Scanning reels...",
      "Fetching frames...",
      "Loading cinematic...",
      "Curating picks...",
    ],
    btnTrailer: "Tonton Trailer",
    btnSearchAgain: "Cari Lagi",
    btnSaveFav: "Simpan Favorit",
    btnSaved: "Tersimpan",
    favHeader: "Favorit Saya",
    favEmpty: "Belum ada favorit.",
    noTrailer: "Trailer tidak ditemukan untuk film ini 🎬",
    overviewFallback: "Sinopsis tidak tersedia untuk film ini.",
    titleFallback: "Judul Tidak Diketahui",
    errNoResult: "Yah, filmnya lagi pada libur... coba ubah filter ya? 🎬",
    errNetwork:
      "Koneksi ke gudang film gagal. Cek API key atau coba lagi sebentar. 📡",
    chipsLoading: "Memuat genre...",
    langToggleLabel: "EN",
  },
  en: {
    eyebrow: "🎬 \u00a0Cinematic Movie Recommender",
    heroLine1: "WhatMovie?",
    heroLine2: "What to watch tonight?",
    heroSub: "Filter by taste. Find the perfect film for tonight.",
    scrollCta: "Get started",
    sectionLabel: "// Configure Your Taste",
    labelGenre: "Genre",
    labelYear: "Release Year",
    labelRating: "Min Rating",
    labelLang: "Language / Country",
    yearFrom: "from",
    yearTo: "to",
    ratingAll: "All",
    searchBtn: "Find My Movie!",
    loaderPhrases: [
      "Finding the best film for you",
      "Scanning thousands of titles",
      "Sorting top candidates",
      "Almost there...",
    ],
    loaderSubs: [
      "Scanning reels...",
      "Fetching frames...",
      "Loading cinematic...",
      "Curating picks...",
    ],
    btnTrailer: "Watch Trailer",
    btnSearchAgain: "Try Again",
    btnSaveFav: "Save to Favorites",
    btnSaved: "Saved",
    favHeader: "My Favorites",
    favEmpty: "No favorites yet.",
    noTrailer: "No trailer found for this film 🎬",
    overviewFallback: "No synopsis available for this film.",
    titleFallback: "Unknown Title",
    errNoResult: "No films found... try adjusting your filters? 🎬",
    errNetwork:
      "Failed to reach the film vault. Check API key or try again. 📡",
    chipsLoading: "Loading genres...",
    langToggleLabel: "ID",
  },
};

let currentLang = "id"; // default language

/* ─── State ─── */
let selectedGenres = new Set();
let selectedRating = 6.5;
let currentMovie = null;
let currentTrailerKey = null;
const seenThisSession = new Set(); // no repeat movies per session

/* ─── DOM refs ─── */
const genreChips = document.getElementById("genreChips");
const yearFrom = document.getElementById("yearFrom");
const yearTo = document.getElementById("yearTo");
const ratingBtns = document.querySelectorAll(".rating-btn");
const langSelect = document.getElementById("languageSelect");
const searchBtn = document.getElementById("searchBtn");
const loadingOverlay = document.getElementById("loadingOverlay");
const loaderPhrase = document.getElementById("loaderPhrase");
const loaderSub = document.getElementById("loaderSub");
const resultSection = document.getElementById("resultSection");
const resultCard = document.getElementById("resultCard");
const resultBg = document.getElementById("resultBg");
const resultActions = document.getElementById("resultActions");
const trailerBtn = document.getElementById("trailerBtn");
const searchAgainBtn = document.getElementById("searchAgainBtn");
const favBtn = document.getElementById("favBtn");
const trailerModal = document.getElementById("trailerModal");
const trailerFrame = document.getElementById("trailerFrame");
const modalClose = document.getElementById("modalClose");
const errorMsg = document.getElementById("errorMsg");
const errorText = document.getElementById("errorText");
const errorClose = document.getElementById("errorClose");
const favBar = document.getElementById("favBar");
const favToggle = document.getElementById("favToggle");
const favList = document.getElementById("favList");
const favBarHeader = document.querySelector(".fav-bar-header");
const langToggleBtn = document.getElementById("langToggleBtn");

let phraseInterval = null;

/* ══════════════════════════════════════════
   APPLY LANGUAGE TO UI
   Note: genre chip labels are NOT changed —
   they always stay English from TMDB en-US.
   Genre tags in result card also stay English.
══════════════════════════════════════════ */
function applyLang(lang) {
  const t = TEXTS[lang];

  // hero eyebrow
  const eyebrow = document.querySelector(".hero-eyebrow");
  if (eyebrow) eyebrow.textContent = t.eyebrow;

  // hero subtitle
  const heroSub = document.querySelector(".hero-sub");
  if (heroSub) heroSub.textContent = t.heroSub;

  // scroll CTA text
  const scrollCtaSpan = document.querySelector(".scroll-cta span");
  if (scrollCtaSpan) scrollCtaSpan.textContent = t.scrollCta;

  // section label
  const sectionLabel = document.querySelector(".section-label");
  if (sectionLabel) sectionLabel.textContent = t.sectionLabel;

  // filter labels via data-i18n
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.dataset.i18n;
    if (t[key] !== undefined) el.textContent = t[key];
  });

  // year range labels
  const yearFromLabel = document.querySelector(".year-from-label");
  const yearToLabel = document.querySelector(".year-to-label");
  if (yearFromLabel) yearFromLabel.textContent = t.yearFrom;
  if (yearToLabel) yearToLabel.textContent = t.yearTo;

  // rating "All/Semua" button
  const ratingAllBtn = document.querySelector('.rating-btn[data-rating="0"]');
  if (ratingAllBtn) ratingAllBtn.textContent = t.ratingAll;

  // search CTA label
  const ctaLabel = searchBtn.querySelector(".cta-label");
  if (ctaLabel) ctaLabel.textContent = t.searchBtn;

  // lang toggle button label (shows opposite lang)
  if (langToggleBtn) langToggleBtn.textContent = t.langToggleLabel;

  // chips loading message
  const chipsLoadingEl = document.querySelector(".chips-loading");
  if (chipsLoadingEl) chipsLoadingEl.textContent = t.chipsLoading;

  // fav bar header text — preserve the icon SVG node
  const favHeaderSpan = document.querySelector(".fav-bar-header > span");
  if (favHeaderSpan) {
    const textNode = [...favHeaderSpan.childNodes].find(
      (n) => n.nodeType === Node.TEXT_NODE,
    );
    if (textNode) {
      textNode.textContent = " " + t.favHeader;
    }
  }

  // fav list empty message
  const favEmptyEl = favList.querySelector(".fav-empty");
  if (favEmptyEl) favEmptyEl.textContent = t.favEmpty;

  // result action buttons (only when result is visible)
  if (resultSection.classList.contains("visible")) {
    trailerBtn.innerHTML = `<i data-lucide="play-circle"></i> ${t.btnTrailer}`;
    searchAgainBtn.innerHTML = `<i data-lucide="refresh-cw"></i> ${t.btnSearchAgain}`;
    updateFavBtn();
    if (window.lucide) lucide.createIcons();
  }
}

/* ══════════════════════════════════════════
   LANGUAGE TOGGLE BUTTON HANDLER
══════════════════════════════════════════ */
if (langToggleBtn) {
  langToggleBtn.addEventListener("click", () => {
    currentLang = currentLang === "id" ? "en" : "id";
    applyLang(currentLang);
    restartTypewriter();
  });
}

/* ══════════════════════════════════════════
   TYPEWRITER HERO EFFECT
   Reads heroLine1 + heroLine2 from TEXTS
══════════════════════════════════════════ */
let typewriterTimer = null;

function startTypewriter() {
  const el = document.getElementById("heroTyped");
  const t = TEXTS[currentLang];
  const lines = [t.heroLine1, t.heroLine2];
  let li = 0,
    ci = 0;
  let output = "";
  const speed = 60;

  el.innerHTML = "";

  function type() {
    if (li >= lines.length) return;
    const line = lines[li];
    if (ci < line.length) {
      output += line[ci];
      ci++;
      el.innerHTML = output.replace(/\n/g, "<br>");
      typewriterTimer = setTimeout(type, speed);
    } else {
      output += "\n";
      li++;
      ci = 0;
      if (li < lines.length) {
        typewriterTimer = setTimeout(type, 300);
      } else {
        el.innerHTML = output.replace(/\n/g, "<br>");
      }
    }
  }

  typewriterTimer = setTimeout(type, 200);
}

function restartTypewriter() {
  clearTimeout(typewriterTimer);
  startTypewriter();
}

/* ══════════════════════════════════════════
   INIT on DOMContentLoaded
══════════════════════════════════════════ */
document.addEventListener("DOMContentLoaded", () => {
  if (window.lucide) lucide.createIcons();
  startTypewriter();
  applyLang(currentLang);
  fetchGenres();
  renderFavBar();
});

/* ══════════════════════════════════════════
   FETCH GENRES
   Always language=en-US so chip names and
   result genre tags are always English.
══════════════════════════════════════════ */
async function fetchGenres() {
  try {
    const res = await fetch(
      `${BASE}/genre/movie/list?api_key=${API_KEY}&language=en-US`,
    );
    const data = await res.json();
    if (!data.genres || data.genres.length === 0) throw new Error("No genres");
    renderGenreChips(data.genres);
  } catch (_) {
    // English fallback list
    renderGenreChips([
      { id: 28, name: "Action" },
      { id: 12, name: "Adventure" },
      { id: 16, name: "Animation" },
      { id: 35, name: "Comedy" },
      { id: 80, name: "Crime" },
      { id: 99, name: "Documentary" },
      { id: 18, name: "Drama" },
      { id: 10751, name: "Family" },
      { id: 14, name: "Fantasy" },
      { id: 36, name: "History" },
      { id: 27, name: "Horror" },
      { id: 10402, name: "Music" },
      { id: 9648, name: "Mystery" },
      { id: 10749, name: "Romance" },
      { id: 878, name: "Sci-Fi" },
      { id: 53, name: "Thriller" },
      { id: 10752, name: "War" },
      { id: 37, name: "Western" },
    ]);
  }
}

function renderGenreChips(genres) {
  genreChips.innerHTML = "";
  genres.forEach((g) => {
    const chip = document.createElement("button");
    chip.className = "genre-chip";
    chip.dataset.id = g.id;
    chip.textContent = g.name; // always English
    chip.addEventListener("click", () => toggleGenre(chip, g.id));
    genreChips.appendChild(chip);
  });
  if (window.lucide) lucide.createIcons();
}

function toggleGenre(chip, id) {
  const numId = Number(id);
  if (selectedGenres.has(numId)) {
    selectedGenres.delete(numId);
    chip.classList.remove("selected");
  } else {
    selectedGenres.add(numId);
    chip.classList.add("selected");
  }
}

/* ══════════════════════════════════════════
   RATING BUTTONS
══════════════════════════════════════════ */
ratingBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    ratingBtns.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    selectedRating = parseFloat(btn.dataset.rating);
  });
});

/* ══════════════════════════════════════════
   RIPPLE EFFECT
══════════════════════════════════════════ */
function addRipple(btn, e) {
  const rect = btn.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  const x = e.clientX - rect.left - size / 2;
  const y = e.clientY - rect.top - size / 2;
  const ripple = document.createElement("span");
  ripple.className = "ripple";
  ripple.style.cssText = `width:${size}px;height:${size}px;left:${x}px;top:${y}px`;
  btn.appendChild(ripple);
  ripple.addEventListener("animationend", () => ripple.remove());
}

searchBtn.addEventListener("click", (e) => {
  addRipple(searchBtn, e);
  discoverMovie();
});

/* ══════════════════════════════════════════
   LOADING OVERLAY
══════════════════════════════════════════ */
function showLoader() {
  const t = TEXTS[currentLang];
  let pi = 0,
    si = 0;
  loaderPhrase.textContent = t.loaderPhrases[0];
  loaderSub.textContent = t.loaderSubs[0];

  phraseInterval = setInterval(() => {
    pi = (pi + 1) % t.loaderPhrases.length;
    si = (si + 1) % t.loaderSubs.length;
    loaderPhrase.textContent = t.loaderPhrases[pi];
    loaderSub.textContent = t.loaderSubs[si];
  }, 2000);

  loadingOverlay.classList.add("active");
  requestAnimationFrame(() => {
    requestAnimationFrame(() => loadingOverlay.classList.add("visible"));
  });
}

function hideLoader() {
  clearInterval(phraseInterval);
  loadingOverlay.classList.add("fade-out");
  setTimeout(() => {
    loadingOverlay.classList.remove("active", "visible", "fade-out");
  }, 380);
}

/* ══════════════════════════════════════════
   HELPER — Genre Match Score
   Counts how many of the movie's genre IDs
   overlap with what the user selected.
   Handles both discover results (genre_ids[])
   and detail results (genres[{id}]).
══════════════════════════════════════════ */
function calculateGenreMatch(movie, genreSet) {
  if (!genreSet || genreSet.size === 0) return 0;
  const ids = movie.genre_ids
    ? movie.genre_ids
    : (movie.genres || []).map((g) => g.id);
  let score = 0;
  for (const id of ids) {
    if (genreSet.has(Number(id))) score++;
  }
  return score;
}

/* ══════════════════════════════════════════
   DISCOVER MOVIE

   API changes vs original:
   - with_genres uses pipe (|) = OR logic, not
     comma (AND), avoids empty results for
     multi-genre selections.
   - vote_count.gte=50 added for credibility.

   Post-processing pipeline:
   1. Filter: poster + overview>30 + voteCount
      >= 50 + not seen this session.
   2. Score each by genre overlap count.
   3. Sort descending by score.
   4. Random pick from top 30% of sorted list.

   Detail fetch strategy (3 parallel requests):
   - detail en-US  → movie.genres[].name (English tags)
   - detail appLang → movie.title + movie.overview
   - videos en-US  → trailer key
   Merge: genres from en-US, rest from appLang.
══════════════════════════════════════════ */
async function discoverMovie() {
  showLoader();
  hideError();
  resultSection.classList.remove("visible");

  const startTime = Date.now();
  const t = TEXTS[currentLang];

  try {
    const fromYear = parseInt(yearFrom.value) || 2000;
    const toYear = parseInt(yearTo.value) || 2026;
    const lang = langSelect.value;
    const rating = selectedRating;
    const genreParam = Array.from(selectedGenres).join("|"); // pipe = OR
    const page = Math.floor(Math.random() * 8) + 1;

    const params = new URLSearchParams({
      api_key: API_KEY,
      language: "id-ID",
      sort_by: "popularity.desc",
      include_adult: "false",
      page,
      "vote_count.gte": 50,
      "primary_release_date.gte": `${fromYear}-01-01`,
      "primary_release_date.lte": `${toYear}-12-31`,
    });

    if (rating > 0) params.append("vote_average.gte", rating);
    if (genreParam) params.append("with_genres", genreParam);
    if (lang) params.append("with_original_language", lang);

    const res = await fetch(`${BASE}/discover/movie?${params}`);
    const data = await res.json();

    if (!data.results || data.results.length === 0)
      throw new Error("no_results");

    /* ── Post-processing ── */
    const filtered = data.results.filter(
      (m) =>
        m.poster_path &&
        (m.overview || "").length > 30 &&
        m.vote_count >= 50 &&
        !seenThisSession.has(m.id),
    );

    if (filtered.length === 0) throw new Error("no_results");

    // Score by genre match then sort descending
    filtered.forEach((m) => {
      m._matchScore = calculateGenreMatch(m, selectedGenres);
    });
    filtered.sort((a, b) => b._matchScore - a._matchScore);

    // Random pick from top 30% (at least 1)
    const poolSize = Math.max(1, Math.ceil(filtered.length * 0.3));
    const pool = filtered.slice(0, poolSize);
    const picked = pool[Math.floor(Math.random() * pool.length)];

    seenThisSession.add(picked.id);

    /* ── 3 parallel fetches ── */
    const appLang = currentLang === "id" ? "id-ID" : "en-US";

    const [detailEnRes, detailAppRes, videoRes] = await Promise.all([
      fetch(`${BASE}/movie/${picked.id}?api_key=${API_KEY}&language=en-US`),
      fetch(
        `${BASE}/movie/${picked.id}?api_key=${API_KEY}&language=${appLang}`,
      ),
      fetch(
        `${BASE}/movie/${picked.id}/videos?api_key=${API_KEY}&language=en-US`,
      ),
    ]);

    const detailEn = await detailEnRes.json();
    const detailApp = await detailAppRes.json();
    const videos = await videoRes.json();

    // Merge: English genre names + app-language title/overview
    const detail = {
      ...detailApp,
      genres: detailEn.genres || [], // always English
    };

    const trailers = (videos.results || []).filter(
      (v) => v.type === "Trailer" && v.site === "YouTube",
    );
    currentTrailerKey = trailers.length > 0 ? trailers[0].key : null;
    currentMovie = { ...detail, trailerKey: currentTrailerKey };

    const delay = Math.max(0, 1500 - (Date.now() - startTime));
    setTimeout(() => {
      hideLoader();
      renderResult(detail);
      updateFavBtn();
    }, delay);
  } catch (err) {
    const delay = Math.max(0, 1500 - (Date.now() - startTime));
    setTimeout(() => {
      hideLoader();
      showError(err.message === "no_results" ? t.errNoResult : t.errNetwork);
    }, delay);
  }
}

/* ══════════════════════════════════════════
   RENDER RESULT
   movie.genres[].name → always English
   (comes from the en-US detail merge above)
══════════════════════════════════════════ */
function renderResult(movie) {
  const t = TEXTS[currentLang];

  const posterUrl = movie.poster_path
    ? `${IMG}${movie.poster_path}`
    : "https://via.placeholder.com/300x450/111111/666666?text=No+Poster";

  const bgUrl = movie.backdrop_path
    ? `${IMG_LG}${movie.backdrop_path}`
    : posterUrl;

  resultBg.style.backgroundImage = `url('${bgUrl}')`;

  // Genre tags — always English (from en-US detail)
  const genreTags = (movie.genres || [])
    .slice(0, 4)
    .map((g) => `<span class="result-genre-tag">${g.name}</span>`)
    .join("");

  const rating = movie.vote_average ? movie.vote_average.toFixed(1) : "—";
  const year = movie.release_date ? movie.release_date.slice(0, 4) : "—";
  const runtime = movie.runtime ? `${movie.runtime} min` : "";
  const langLbl = movie.original_language
    ? movie.original_language.toUpperCase()
    : "";
  const overview =
    movie.overview && movie.overview.length > 10
      ? movie.overview
      : t.overviewFallback;
  const title = movie.title || movie.original_title || t.titleFallback;

  resultCard.innerHTML = `
    <div class="result-poster-wrap">
      <img
        class="result-poster"
        src="${posterUrl}"
        alt="Poster ${title}"
        loading="lazy"
        onerror="this.src='https://via.placeholder.com/300x450/111111/666666?text=No+Poster'"
      />
      <div class="result-rating-badge">★ ${rating}</div>
    </div>
    <div class="result-meta">
      <div class="result-genres">${genreTags}</div>
      <h2 class="result-title">${title}</h2>
      <p class="result-year-lang">${year} &nbsp;·&nbsp; ${langLbl}${runtime ? " &nbsp;·&nbsp; " + runtime : ""}</p>
      <div class="result-divider"></div>
      <p class="result-overview">${overview}</p>
    </div>
  `;

  // Rebuild action button labels in current language
  trailerBtn.innerHTML = `<i data-lucide="play-circle"></i> ${t.btnTrailer}`;
  searchAgainBtn.innerHTML = `<i data-lucide="refresh-cw"></i> ${t.btnSearchAgain}`;

  resultSection.classList.add("visible");
  resultSection.scrollIntoView({ behavior: "smooth", block: "start" });

  if (window.lucide) lucide.createIcons();

  // Confetti for rating >= 8.0
  if (parseFloat(rating) >= 8.0 && window.confetti) {
    setTimeout(
      () =>
        confetti({
          particleCount: 60,
          angle: 90,
          spread: 55,
          origin: { y: 0.5 },
          colors: ["#991b1b", "#ca8a04", "#e8e4dc", "#b91c1c"],
          gravity: 0.8,
          scalar: 0.9,
        }),
      400,
    );
  }
}

/* ══════════════════════════════════════════
   ACTION BUTTONS
══════════════════════════════════════════ */
trailerBtn.addEventListener("click", () =>
  openModal(currentTrailerKey || null),
);

function openModal(key) {
  const t = TEXTS[currentLang];
  const old = trailerModal.querySelector(".no-trailer");
  if (old) old.remove();

  if (key) {
    trailerFrame.src = `https://www.youtube.com/embed/${key}?autoplay=1&rel=0`;
  } else {
    trailerFrame.src = "";
    trailerFrame.insertAdjacentHTML(
      "afterend",
      `<p class="no-trailer">${t.noTrailer}</p>`,
    );
  }
  trailerModal.classList.add("active");
  requestAnimationFrame(() => {
    requestAnimationFrame(() => trailerModal.classList.add("visible"));
  });
  document.body.style.overflow = "hidden";
}

function closeModal() {
  trailerModal.classList.remove("visible");
  setTimeout(() => {
    trailerModal.classList.remove("active");
    trailerFrame.src = "";
    const noTrailer = trailerModal.querySelector(".no-trailer");
    if (noTrailer) noTrailer.remove();
  }, 300);
  document.body.style.overflow = "";
}

modalClose.addEventListener("click", closeModal);
trailerModal.addEventListener("click", (e) => {
  if (e.target === trailerModal) closeModal();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeModal();
});

searchAgainBtn.addEventListener("click", (e) => {
  addRipple(searchAgainBtn, e);
  discoverMovie();
});

favBtn.addEventListener("click", (e) => {
  addRipple(favBtn, e);
  if (!currentMovie) return;
  toggleFavorite(currentMovie);
  updateFavBtn();
});

/* ══════════════════════════════════════════
   FAVORITES — localStorage
══════════════════════════════════════════ */
function getFavorites() {
  try {
    return JSON.parse(localStorage.getItem("whatmovie_favorites") || "[]");
  } catch {
    return [];
  }
}

function saveFavorites(favs) {
  localStorage.setItem("whatmovie_favorites", JSON.stringify(favs));
}

function isFavorited(id) {
  return getFavorites().some((f) => f.id === id);
}

function toggleFavorite(movie) {
  const favs = getFavorites();
  const idx = favs.findIndex((f) => f.id === movie.id);
  if (idx !== -1) {
    favs.splice(idx, 1);
  } else {
    favs.unshift({
      id: movie.id,
      title: movie.title || movie.original_title,
      poster: movie.poster_path
        ? `https://image.tmdb.org/t/p/w92${movie.poster_path}`
        : null,
    });
    if (favs.length > 20) favs.pop(); // max 20 items
  }
  saveFavorites(favs);
  renderFavBar();
}

function updateFavBtn() {
  if (!currentMovie) return;
  const t = TEXTS[currentLang];
  const saved = isFavorited(currentMovie.id);
  favBtn.classList.toggle("saved", saved);
  favBtn.innerHTML = saved
    ? `<i data-lucide="bookmark-check"></i> ${t.btnSaved}`
    : `<i data-lucide="bookmark"></i> ${t.btnSaveFav}`;
  if (window.lucide) lucide.createIcons();
}

function renderFavBar() {
  const t = TEXTS[currentLang];
  const favs = getFavorites();

  if (favs.length === 0) {
    favList.innerHTML = `<p class="fav-empty">${t.favEmpty}</p>`;
    return;
  }

  favList.innerHTML = favs
    .map(
      (f) => `
    <div class="fav-item" data-id="${f.id}">
      ${
        f.poster
          ? `<img src="${f.poster}" alt="${f.title}" loading="lazy">`
          : `<div style="width:32px;height:48px;background:#1a1a1a;flex-shrink:0;"></div>`
      }
      <span class="fav-item-title" title="${f.title}">${f.title}</span>
      <button class="fav-remove" data-id="${f.id}" title="Remove">
        <i data-lucide="x"></i>
      </button>
    </div>
  `,
    )
    .join("");

  favList.querySelectorAll(".fav-remove").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = parseInt(btn.dataset.id);
      const favs = getFavorites().filter((f) => f.id !== id);
      saveFavorites(favs);
      renderFavBar();
      if (currentMovie && currentMovie.id === id) updateFavBtn();
    });
  });

  if (window.lucide) lucide.createIcons();
}

favBarHeader.addEventListener("click", () =>
  favBar.classList.toggle("expanded"),
);
favToggle.addEventListener("click", (e) => {
  e.stopPropagation();
  favBar.classList.toggle("expanded");
});

/* ══════════════════════════════════════════
   ERROR HANDLING
══════════════════════════════════════════ */
function showError(msg) {
  errorText.textContent = msg;
  errorMsg.classList.add("visible");
  setTimeout(hideError, 5000);
}

function hideError() {
  errorMsg.classList.remove("visible");
}

errorClose.addEventListener("click", hideError);

/* ══════════════════════════════════════════
   YEAR INPUT VALIDATION
══════════════════════════════════════════ */
yearFrom.addEventListener("change", () => {
  let v = parseInt(yearFrom.value);
  if (isNaN(v) || v < 1900) v = 1900;
  if (v > parseInt(yearTo.value)) v = parseInt(yearTo.value) - 1;
  yearFrom.value = v;
});

yearTo.addEventListener("change", () => {
  let v = parseInt(yearTo.value);
  if (isNaN(v) || v > 2026) v = 2026;
  if (v < parseInt(yearFrom.value)) v = parseInt(yearFrom.value) + 1;
  yearTo.value = v;
});

/* ══════════════════════════════════════════
   AUTO-INIT LUCIDE ICONS on DOM mutation
══════════════════════════════════════════ */
if (window.lucide) {
  const observer = new MutationObserver(() => lucide.createIcons());
  observer.observe(document.body, { childList: true, subtree: true });
}
