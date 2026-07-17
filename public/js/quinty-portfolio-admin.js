// Quinty's Portfolio - admin page logic
// Same as public page, plus ability to toggle featured status on pieces

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
    grid.appendChild(createPieceCard(piece, true, true));
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

  const pieces = getFilteredPieces();

  if (pieces.length === 0) {
    grid.innerHTML = '<p class="loading-text">No pieces uploaded yet.</p>';
    return;
  }

  pieces.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  grid.innerHTML = '';
  pieces.forEach(piece => {
    grid.appendChild(createPieceCard(piece, false, true));
  });
}

function createPieceCard(piece, isFeatured, isAdmin) {
  const card = document.createElement('div');
  card.className = 'quinty-piece-card fade-in';

  const imgUrl = getImageUrl(piece.image_path);
  const placeholder = 'https://images.pexels.com/photos/1109541/pexels-photo-1109541.jpeg?auto=compress&cs=tinysrgb&w=600';
  const displayImg = imgUrl || placeholder;

  const now = new Date();
  const isCurrentlyFeatured = piece.is_featured && piece.featured_until && new Date(piece.featured_until) > now;

  const statusBadge = piece.status === 'draft'
    ? '<span class="quinty-status-badge draft">DRAFT</span>'
    : '<span class="quinty-status-badge published">PUBLISHED</span>';

  const featureBtn = isAdmin && piece.status === 'published'
    ? `<button class="quinty-feature-btn ${isCurrentlyFeatured ? 'featured' : ''}" data-id="${piece.id}">
         ${isCurrentlyFeatured ? 'Unfeature' : 'Feature'}
       </button>`
    : '';

  card.innerHTML = `
    <div class="quinty-piece-image-wrapper">
      <img src="${displayImg}" alt="${piece.title}" loading="lazy">
      <span class="quinty-piece-tag ${piece.tag}">${piece.tag.toUpperCase()}</span>
      ${statusBadge}
    </div>
    <div class="quinty-piece-info">
      <h3 class="quinty-piece-title">${piece.title}</h3>
      ${piece.description ? `<p class="quinty-piece-desc">${piece.description}</p>` : ''}
      <div class="quinty-piece-meta">
        <span class="quinty-piece-likes">&hearts; ${piece.likes || 0}</span>
        ${featureBtn}
      </div>
    </div>
  `;

  if (isAdmin) {
    const btn = card.querySelector('.quinty-feature-btn');
    if (btn) {
      btn.addEventListener('click', () => toggleFeature(piece.id, isCurrentlyFeatured));
    }
  }

  return card;
}

async function toggleFeature(pieceId, isCurrentlyFeatured) {
  const url = `${getSupabaseUrl()}/rest/v1/portfolio_pieces?id=eq.${pieceId}`;
  const headers = {
    'apikey': getSupabaseAnonKey(),
    'Authorization': `Bearer ${getSupabaseAnonKey()}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=minimal',
  };

  try {
    if (isCurrentlyFeatured) {
      // Unfeature
      await fetch(url, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          is_featured: false,
          featured_until: null,
        }),
      });
      window.showToast('Piece unfeatured.', 'success');
    } else {
      // Feature for 1 month
      const oneMonthLater = new Date();
      oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);

      await fetch(url, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          is_featured: true,
          featured_until: oneMonthLater.toISOString(),
        }),
      });
      window.showToast('Piece featured for 1 month!', 'success');
    }

    // Reload
    await loadPortfolio();
  } catch (err) {
    console.error('Failed to toggle feature:', err);
    window.showToast('Failed to update feature status.', 'error');
  }
}
