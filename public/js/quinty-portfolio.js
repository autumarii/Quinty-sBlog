// Quinty's Portfolio - public page logic
// Fetches portfolio pieces from server proxy and renders Featured + All sections

let allPieces = [];
let activeTag = 'all';
let supabaseUrl = '';

document.addEventListener('DOMContentLoaded', () => {
  loadConfig().then(() => {
    loadPortfolio();
    setupTagButtons();
  });
});

async function loadConfig() {
  try {
    const res = await fetch('/api/config');
    const config = await res.json();
    supabaseUrl = config.supabaseUrl || '';
  } catch (err) {
    console.error('Failed to load config:', err);
  }
}

function getImageUrl(path) {
  if (!path) return '';
  return `${supabaseUrl}/storage/v1/object/public/portfolio-images/${path}`;
}

async function loadPortfolio() {
  const featuredGrid = document.getElementById('featured-grid');
  const allGrid = document.getElementById('all-grid');

  try {
    const res = await fetch('/api/portfolio-pieces');
    if (!res.ok) throw new Error('Failed to fetch');
    allPieces = await res.json();

    if (!Array.isArray(allPieces)) allPieces = [];

    renderFeatured();
    renderAll();
  } catch (err) {
    console.error('Failed to load portfolio:', err);
    if (featuredGrid) featuredGrid.innerHTML = '<p class="loading-text">Error loading featured pieces.</p>';
    if (allGrid) allGrid.innerHTML = '<p class="loading-text">Error loading pieces.</p>';
  }
}

function setupTagButtons() {
  const buttons = document.querySelectorAll('.quinty-tag-btn');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeTag = btn.dataset.tag;
      renderFeatured();
      renderAll();
    });
  });
}

function getFilteredPieces() {
  if (activeTag === 'all') return [...allPieces];
  return allPieces.filter(p => p.tag === activeTag);
}

// Featured logic:
// 1. Admin-featured pieces (is_featured=true AND featured_until > now) stay for 1 month
// 2. Popular pieces (most likes)
// 3. Most recent pieces fill remaining slots
// Total: 4 featured slots
function getFeaturedPieces() {
  const pieces = getFilteredPieces().filter(p => p.status === 'published');
  const now = new Date();
  const featured = [];
  const remaining = [];

  pieces.forEach(p => {
    const isStillFeatured = p.is_featured && p.featured_until && new Date(p.featured_until) > now;
    if (isStillFeatured) {
      featured.push(p);
    } else {
      remaining.push(p);
    }
  });

  remaining.sort((a, b) => {
    if (b.likes !== a.likes) return b.likes - a.likes;
    return new Date(b.created_at) - new Date(a.created_at);
  });

  const result = [...featured];
  for (const p of remaining) {
    if (result.length >= 4) break;
    result.push(p);
  }

  return result.slice(0, 4);
}

function renderFeatured() {
  const grid = document.getElementById('featured-grid');
  if (!grid) return;

  const featured = getFeaturedPieces();

  if (featured.length === 0) {
    grid.innerHTML = '<div class="quinty-featured-placeholder">No featured pieces yet.</div>';
    return;
  }

  grid.innerHTML = '';
  featured.forEach(piece => {
    grid.appendChild(createPieceCard(piece, true));
  });

  for (let i = featured.length; i < 4; i++) {
    const ph = document.createElement('div');
    ph.className = 'quinty-featured-placeholder';
    ph.innerHTML = '<span>Slot available</span>';
    grid.appendChild(ph);
  }
}

function renderAll() {
  const grid = document.getElementById('all-grid');
  if (!grid) return;

  const pieces = getFilteredPieces().filter(p => p.status === 'published');

  if (pieces.length === 0) {
    grid.innerHTML = '<p class="loading-text">No pieces uploaded yet.</p>';
    return;
  }

  pieces.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  grid.innerHTML = '';
  pieces.forEach(piece => {
    grid.appendChild(createPieceCard(piece, false));
  });
}

function createPieceCard(piece, isFeatured) {
  const card = document.createElement('div');
  card.className = 'quinty-piece-card fade-in';

  const imgUrl = getImageUrl(piece.image_path);
  const placeholder = 'https://images.pexels.com/photos/1109541/pexels-photo-1109541.jpeg?auto=compress&cs=tinysrgb&w=600';
  const displayImg = imgUrl || placeholder;

  card.innerHTML = `
    <div class="quinty-piece-image-wrapper">
      <img src="${displayImg}" alt="${piece.title}" loading="lazy">
      <span class="quinty-piece-tag ${piece.tag}">${piece.tag.toUpperCase()}</span>
    </div>
    <div class="quinty-piece-info">
      <h3 class="quinty-piece-title">${piece.title}</h3>
      ${piece.description ? `<p class="quinty-piece-desc">${piece.description}</p>` : ''}
      <div class="quinty-piece-meta">
        <span class="quinty-piece-likes">&hearts; ${piece.likes || 0}</span>
        <button class="quinty-like-btn" data-id="${piece.id}">Like</button>
      </div>
    </div>
  `;

  const likeBtn = card.querySelector('.quinty-like-btn');
  if (likeBtn) {
    likeBtn.addEventListener('click', async () => {
      likeBtn.disabled = true;
      try {
        const res = await fetch(`/api/portfolio-pieces/${piece.id}/like`, { method: 'POST' });
        if (res.ok) {
          const data = await res.json();
          card.querySelector('.quinty-piece-likes').innerHTML = `&hearts; ${data.likes}`;
          likeBtn.textContent = 'Liked!';
        }
      } catch (err) {
        likeBtn.disabled = false;
      }
    });
  }

  return card;
}
