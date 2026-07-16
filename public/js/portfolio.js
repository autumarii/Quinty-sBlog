// Portfolio gallery logic: fetch, filter, and lightbox modal interactions

let allArtPieces = [];

document.addEventListener('DOMContentLoaded', () => {
  loadPortfolio();
  setupLightbox();
});

async function loadPortfolio() {
  const grid = document.getElementById('portfolio-grid');
  if (!grid) return;

  try {
    const res = await fetch('/api/portfolio');
    allArtPieces = await res.json();

    if (allArtPieces.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 5rem 0; border: 1px dashed var(--border-color); border-radius: var(--radius-md); background: rgba(255,255,255,0.01);">
          <p style="color: var(--color-muted); margin-bottom: 1.5rem;">No artwork uploaded to the portfolio yet.</p>
          <a href="admin.html" class="btn btn-primary">Add Your First Piece</a>
        </div>
      `;
      return;
    }

    // Generate dynamic filter buttons based on actual uploaded mediums
    generateFilterButtons();

    // Render all pieces
    renderArtGrid(allArtPieces);

  } catch (err) {
    console.error('Failed to load portfolio items:', err);
    grid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: var(--accent-pink); padding: 3rem 0;">Error loading artwork. Please verify the server is running.</p>`;
  }
}

// Extract unique mediums and build category buttons
function generateFilterButtons() {
  const filterContainer = document.getElementById('filter-container');
  if (!filterContainer) return;

  // Extract unique mediums, clean and normalize them
  const mediums = new Set();
  allArtPieces.forEach(art => {
    if (art.medium) {
      mediums.add(art.medium.trim());
    }
  });

  // Re-build standard first button "All"
  filterContainer.innerHTML = `<button class="filter-btn active" data-filter="all">All Pieces</button>`;

  // Add a button for each unique medium
  mediums.forEach(medium => {
    const btn = document.createElement('button');
    btn.className = 'filter-btn';
    btn.setAttribute('data-filter', medium.toLowerCase());
    btn.innerText = medium;
    filterContainer.appendChild(btn);
  });

  // Setup click listeners for filters
  const filterButtons = document.querySelectorAll('.filter-btn');
  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      filterButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filterValue = btn.getAttribute('data-filter');
      
      if (filterValue === 'all') {
        renderArtGrid(allArtPieces);
      } else {
        const filtered = allArtPieces.filter(art => art.medium.toLowerCase() === filterValue);
        renderArtGrid(filtered);
      }
    });
  });
}

// Render filtered art items into column layout
function renderArtGrid(items) {
  const grid = document.getElementById('portfolio-grid');
  if (!grid) return;
  
  grid.innerHTML = '';

  items.forEach(art => {
    const artEl = document.createElement('div');
    artEl.className = 'portfolio-item fade-in';
    artEl.setAttribute('data-id', art.id);
    artEl.innerHTML = `
      <img src="${art.imageUrl}" alt="${art.title}" loading="lazy">
      <div class="portfolio-overlay">
        <h3 class="portfolio-item-title">${art.title}</h3>
        <span class="portfolio-item-meta">${art.medium}</span>
      </div>
    `;

    // Save metadata on element for lightbox access
    artEl.dataset.title = art.title;
    artEl.dataset.medium = art.medium;
    artEl.dataset.date = art.date;
    artEl.dataset.description = art.description || 'No story or description written for this art piece yet.';
    artEl.dataset.image = art.imageUrl;

    grid.appendChild(artEl);
  });
}

// Lightbox modal logic
function setupLightbox() {
  const lightbox = document.getElementById('art-lightbox');
  const closeBtn = document.getElementById('lightbox-close-btn');
  const grid = document.getElementById('portfolio-grid');

  if (!lightbox || !closeBtn || !grid) return;

  // Open lightbox on portfolio item click
  grid.addEventListener('click', (e) => {
    const item = e.target.closest('.portfolio-item');
    if (!item) return;

    document.getElementById('lightbox-img').src = item.dataset.image;
    document.getElementById('lightbox-title').innerText = item.dataset.title;
    document.getElementById('lightbox-medium').innerText = item.dataset.medium;

    // Format date nicely
    const rawDate = item.dataset.date;
    const formattedDate = new Date(rawDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC' // Keep date exact as inputted
    });
    document.getElementById('lightbox-date').innerText = formattedDate;
    document.getElementById('lightbox-description').innerText = item.dataset.description;

    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden'; // Stop page scroll
  });

  // Close lightbox
  const closeLightbox = () => {
    lightbox.classList.remove('active');
    document.body.style.overflow = ''; // Restore scroll
  };

  closeBtn.addEventListener('click', closeLightbox);
  
  // Close on outer container click
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) {
      closeLightbox();
    }
  });

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lightbox.classList.contains('active')) {
      closeLightbox();
    }
  });
}
