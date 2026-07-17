// Quinty's Portfolio - public page logic
// Fetches portfolio pieces from Supabase and renders Featured + All sections

let supabaseConfig = null;
let allPieces = [];
let activeTag = 'all';

document.addEventListener('DOMContentLoaded', () => {
  loadConfig().then(() => {
    loadPortfolio();
    setupTagButtons();
  });
});

async function loadConfig() {
  try {
    const res = await fetch('/api/config');
    supabaseConfig = await res.json();
  } catch (err) {
    console.error('Failed to load config:', err);
  }
}

function getSupabaseUrl() {
  return supabaseConfig?.supabaseUrl || '';
}

function getSupabaseAnonKey() {
  return supabaseConfig?.supabaseAnonKey || '';
}

function getImageUrl(path) {
  if (!path) return '';
  return `${getSupabaseUrl()}/storage/v1/object/public/portfolio-images/${path}`;
}

async function loadPortfolio() {
  const featuredGrid = document.getElementById('featured-grid');
  const allGrid = document.getElementById('all-grid');

  try {
    const url = `${getSupabaseUrl()}/rest/v1/portfolio_pieces?select=*`;
    const res = await fetch(url, {
      headers: {
        'apikey': getSupabaseAnonKey(),
        'Authorization': `Bearer ${getSupabaseAnonKey()}`,
      },
    });
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

  // Sort remaining by likes desc, then by created_at desc
  remaining.sort((a, b) => {
    if (b.likes !== a.likes) return b.likes - a.likes;
    return new Date(b.created_at) - new Date(a.created_at);
  });

  // Fill up to 4 slots
  const result = [...featured];
  for (const p of remaining) {
    if (result.length >= 4) break;
    result.push(p);
  }

  // If fewer than 4, we already have all remaining
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

  // Fill remaining slots with placeholders
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

  // Sort by created_at desc
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
      </div>
    </div>
  `;

  return card;
}
