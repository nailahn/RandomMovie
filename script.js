/* ═══════════════════════════════════════════════════
   WhatMovie? — script.js
   Vanilla JS — TMDB API v3
   Replace YOUR_TMDB_API_KEY with your actual key
   ═══════════════════════════════════════════════════ */

const API_KEY = "22e2207e5735bce300670ed11a4e72d9";
const BASE = "https://api.themoviedb.org/3";
const IMG = "https://image.tmdb.org/t/p/w780";
const IMG_LG = "https://image.tmdb.org/t/p/original";

/* ─── State ─── */
let selectedGenres = new Set();
let selectedRating = 6.5;
let currentMovie = null;
let currentTrailerKey = null;

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

/* ─── Loader phrases ─── */
const LOADER_PHRASES = [
  "Mencari film terbaik untukmu",
  "Memindai ribuan judul",
  "Menyortir calon terbaik",
  "Hampir menemukan pilihanmu",
];
const LOADER_SUBS = [
  "Scanning reels...",
  "Fetching frames...",
  "Loading cinematic...",
  "Curating picks...",
];

let phraseInterval = null;

/* ══════════════════════════════════════════
   TYPEWRITER HERO EFFECT
══════════════════════════════════════════ */
(function initTypewriter() {
  const el = document.getElementById("heroTyped");
  const text = "WhatMovie?\nMalem ini nonton apa nih?";
  const lines = text.split("\n");
  let li = 0,
    ci = 0;
  let output = "";
  const speed = 60;

  function type() {
    if (li >= lines.length) return; // done
    const line = lines[li];

    if (ci < line.length) {
      output += line[ci];
      ci++;
      el.innerHTML = output.replace(/\n/g, "<br>");
      setTimeout(type, speed);
    } else {
      output += "\n";
      li++;
      ci = 0;
      if (li < lines.length) {
        setTimeout(type, 300);
      } else {
        el.innerHTML = output.replace(/\n/g, "<br>");
      }
    }
  }

  setTimeout(type, 800);
})();

/* ══════════════════════════════════════════
   LUCIDE ICONS INIT
══════════════════════════════════════════ */
document.addEventListener("DOMContentLoaded", () => {
  if (window.lucide) lucide.createIcons();
  fetchGenres();
  renderFavBar();
});

/* ══════════════════════════════════════════
   FETCH GENRES
══════════════════════════════════════════ */
async function fetchGenres() {
  try {
    const res = await fetch(
      `${BASE}/genre/movie/list?api_key=${API_KEY}&language=id-ID`,
    );
    const data = await res.json();

    if (!data.genres || data.genres.length === 0) throw new Error("No genres");

    genreChips.innerHTML = "";
    data.genres.forEach((g) => {
      const chip = document.createElement("button");
      chip.className = "genre-chip";
      chip.dataset.id = g.id;
      chip.textContent = g.name;
      chip.addEventListener("click", () => toggleGenre(chip, g.id));
      genreChips.appendChild(chip);
    });

    if (window.lucide) lucide.createIcons();
  } catch (err) {
    // Fallback static genres (Indonesian names)
    const fallback = [
      { id: 28, name: "Aksi" },
      { id: 12, name: "Petualangan" },
      { id: 16, name: "Animasi" },
      { id: 35, name: "Komedi" },
      { id: 80, name: "Kriminal" },
      { id: 99, name: "Dokumenter" },
      { id: 18, name: "Drama" },
      { id: 10751, name: "Keluarga" },
      { id: 14, name: "Fantasi" },
      { id: 36, name: "Sejarah" },
      { id: 27, name: "Horor" },
      { id: 10402, name: "Musik" },
      { id: 9648, name: "Misteri" },
      { id: 10749, name: "Romantis" },
      { id: 878, name: "Fiksi Ilmiah" },
      { id: 53, name: "Thriller" },
      { id: 10752, name: "Perang" },
    ];
    genreChips.innerHTML = "";
    fallback.forEach((g) => {
      const chip = document.createElement("button");
      chip.className = "genre-chip";
      chip.dataset.id = g.id;
      chip.textContent = g.name;
      chip.addEventListener("click", () => toggleGenre(chip, g.id));
      genreChips.appendChild(chip);
    });
  }
}

function toggleGenre(chip, id) {
  if (selectedGenres.has(id)) {
    selectedGenres.delete(id);
    chip.classList.remove("selected");
  } else {
    selectedGenres.add(id);
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
   LOADING OVERLAY CONTROL
══════════════════════════════════════════ */
function showLoader() {
  let pi = 0,
    si = 0;
  loaderPhrase.textContent = LOADER_PHRASES[0];
  loaderSub.textContent = LOADER_SUBS[0];

  phraseInterval = setInterval(() => {
    pi = (pi + 1) % LOADER_PHRASES.length;
    si = (si + 1) % LOADER_SUBS.length;
    loaderPhrase.textContent = LOADER_PHRASES[pi];
    loaderSub.textContent = LOADER_SUBS[si];
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
   DISCOVER MOVIE
══════════════════════════════════════════ */
async function discoverMovie() {
  showLoader();
  hideError();
  resultSection.classList.remove("visible");

  const startTime = Date.now();

  try {
    // Build params
    const fromYear = parseInt(yearFrom.value) || 2000;
    const toYear = parseInt(yearTo.value) || 2026;
    const lang = langSelect.value;
    const rating = selectedRating;
    const genres = Array.from(selectedGenres).join(",");
    const page = Math.floor(Math.random() * 8) + 1;

    const params = new URLSearchParams({
      api_key: API_KEY,
      language: "id-ID",
      sort_by: "popularity.desc",
      include_adult: "false",
      page: page,
      "primary_release_date.gte": `${fromYear}-01-01`,
      "primary_release_date.lte": `${toYear}-12-31`,
    });

    if (rating > 0) params.append("vote_average.gte", rating);
    if (genres) params.append("with_genres", genres);
    if (lang) params.append("with_original_language", lang);

    const res = await fetch(`${BASE}/discover/movie?${params}`);
    const data = await res.json();

    if (!data.results || data.results.length === 0) {
      throw new Error("no_results");
    }

    // Pick a random movie from results
    const movies = data.results.filter((m) => m.poster_path);
    if (movies.length === 0) throw new Error("no_poster");

    const picked = movies[Math.floor(Math.random() * movies.length)];

    // Fetch details + videos in parallel
    const [detailRes, videoRes] = await Promise.all([
      fetch(`${BASE}/movie/${picked.id}?api_key=${API_KEY}&language=id-ID`),
      fetch(
        `${BASE}/movie/${picked.id}/videos?api_key=${API_KEY}&language=en-US`,
      ),
    ]);

    const detail = await detailRes.json();
    const videos = await videoRes.json();

    // Find best trailer
    const trailers = (videos.results || []).filter(
      (v) => v.type === "Trailer" && v.site === "YouTube",
    );
    currentTrailerKey = trailers.length > 0 ? trailers[0].key : null;

    currentMovie = { ...detail, trailerKey: currentTrailerKey };

    // Ensure minimum display time of 1.5s
    const elapsed = Date.now() - startTime;
    const delay = Math.max(0, 1500 - elapsed);

    setTimeout(() => {
      hideLoader();
      renderResult(detail);
      updateFavBtn();
    }, delay);
  } catch (err) {
    const elapsed = Date.now() - startTime;
    const delay = Math.max(0, 1500 - elapsed);

    setTimeout(() => {
      hideLoader();
      if (err.message === "no_results" || err.message === "no_poster") {
        showError("Yah, filmnya lagi pada libur... coba ubah filter ya? 🎬");
      } else {
        showError(
          "Koneksi ke gudang film gagal. Cek API key atau coba lagi sebentar. 📡",
        );
      }
    }, delay);
  }
}

/* ══════════════════════════════════════════
   RENDER RESULT
══════════════════════════════════════════ */
function renderResult(movie) {
  const posterUrl = movie.poster_path
    ? `${IMG}${movie.poster_path}`
    : "https://via.placeholder.com/300x450/111111/666666?text=No+Poster";

  const bgUrl = movie.backdrop_path
    ? `${IMG_LG}${movie.backdrop_path}`
    : posterUrl;

  // Set blurred background
  resultBg.style.backgroundImage = `url('${bgUrl}')`;

  // Genres
  const genreTags = (movie.genres || [])
    .slice(0, 4)
    .map((g) => `<span class="result-genre-tag">${g.name}</span>`)
    .join("");

  // Rating display
  const rating = movie.vote_average ? movie.vote_average.toFixed(1) : "—";
  const year = movie.release_date ? movie.release_date.slice(0, 4) : "—";
  const runtime = movie.runtime ? `${movie.runtime} menit` : "";
  const langLabel = movie.original_language
    ? movie.original_language.toUpperCase()
    : "";
  const overview = movie.overview || "Sinopsis tidak tersedia untuk film ini.";
  const title = movie.title || movie.original_title || "Judul Tidak Diketahui";

  resultCard.innerHTML = `
    <div class="result-poster-wrap">
      <img
        class="result-poster"
        src="${posterUrl}"
        alt="Poster ${title}"
        loading="lazy"
        onerror="this.src='https://via.placeholder.com/300x450/111111/666666?text=No+Poster'"
      />
      <div class="result-rating-badge">
        ★ ${rating}
      </div>
    </div>
    <div class="result-meta">
      <div class="result-genres">${genreTags}</div>
      <h2 class="result-title">${title}</h2>
      <p class="result-year-lang">${year} &nbsp;·&nbsp; ${langLabel} ${runtime ? "·&nbsp;" + runtime : ""}</p>
      <div class="result-divider"></div>
      <p class="result-overview">${overview}</p>
    </div>
  `;

  resultSection.classList.add("visible");
  resultSection.scrollIntoView({ behavior: "smooth", block: "start" });

  if (window.lucide) lucide.createIcons();

  // Confetti for high rating
  if (parseFloat(rating) >= 8.0 && window.confetti) {
    setTimeout(() => {
      confetti({
        particleCount: 60,
        angle: 90,
        spread: 55,
        origin: { y: 0.5 },
        colors: ["#991b1b", "#ca8a04", "#e8e4dc", "#b91c1c"],
        gravity: 0.8,
        scalar: 0.9,
      });
    }, 400);
  }
}

/* ══════════════════════════════════════════
   ACTION BUTTONS
══════════════════════════════════════════ */

// Trailer
trailerBtn.addEventListener("click", () => {
  if (!currentTrailerKey) {
    openModal(null);
    return;
  }
  openModal(currentTrailerKey);
});

function openModal(key) {
  if (key) {
    trailerFrame.src = `https://www.youtube.com/embed/${key}?autoplay=1&rel=0&modestbranding=1&showinfo=0&controls=1&origin=${window.location.origin}`;
  } else {
    trailerFrame.src = "";
    trailerFrame.insertAdjacentHTML(
      "afterend",
      '<p class="no-trailer">Trailer tidak ditemukan untuk film ini 🎬</p>',
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

// Search again
searchAgainBtn.addEventListener("click", (e) => {
  addRipple(searchAgainBtn, e);
  discoverMovie();
});

// Favorites
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
  const saved = isFavorited(currentMovie.id);
  favBtn.classList.toggle("saved", saved);
  const icon = favBtn.querySelector("svg, i");
  favBtn.innerHTML = saved
    ? `<i data-lucide="bookmark-check"></i> Tersimpan`
    : `<i data-lucide="bookmark"></i> Simpan Favorit`;
  if (window.lucide) lucide.createIcons();
}

function renderFavBar() {
  const favs = getFavorites();

  if (favs.length === 0) {
    favList.innerHTML = '<p class="fav-empty">Belum ada favorit.</p>';
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
      <button class="fav-remove" data-id="${f.id}" title="Hapus">
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

// Fav bar toggle
favBarHeader.addEventListener("click", () => {
  favBar.classList.toggle("expanded");
});

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

  // Auto hide after 5s
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
   RE-INIT ICONS AFTER DYNAMIC CONTENT
══════════════════════════════════════════ */
// Small MutationObserver to auto-init lucide icons on new content
if (window.lucide) {
  const observer = new MutationObserver(() => {
    lucide.createIcons();
  });
  observer.observe(document.body, { childList: true, subtree: true });
}
