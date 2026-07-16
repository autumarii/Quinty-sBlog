// Home page logic: fetch and display latest blog articles and art pieces

document.addEventListener('DOMContentLoaded', () => {
  loadHomeContent();
  setupLightbox();
});

async function loadHomeContent() {
  const artGrid = document.getElementById('home-art-grid');
  const blogGrid = document.getElementById('home-blog-grid');

  // 1. Fetch & Render Portfolio Creations
  try {
    const res = await fetch('/api/portfolio');
    const artPieces = await res.json();

    if (artPieces.length === 0) {
      artGrid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 3rem 0; border: 1px dashed var(--border-color); border-radius: var(--radius-md); background: rgba(255,255,255,0.01);">
          <p style="color: var(--color-muted); margin-bottom: 1rem;">No art uploaded yet.</p>
          <a href="admin.html" class="btn btn-secondary">Upload Your First Artwork</a>
        </div>
      `;
    } else {
      artGrid.innerHTML = '';
      // Limit to latest 3
      const recentArt = artPieces.slice(0, 3);
      recentArt.forEach(art => {
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
        artEl.dataset.description = art.description || 'No description provided.';
        artEl.dataset.image = art.imageUrl;

        artGrid.appendChild(artEl);
      });
    }
  } catch (err) {
    console.error('Failed to load portfolio:', err);
    artGrid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: var(--accent-pink);">Failed to load artworks.</p>`;
  }

  // 2. Fetch & Render Blog Articles
  try {
    const res = await fetch('/api/posts');
    const posts = await res.json();

    if (posts.length === 0) {
      blogGrid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 3rem 0; border: 1px dashed var(--border-color); border-radius: var(--radius-md); background: rgba(255,255,255,0.01);">
          <p style="color: var(--color-muted); margin-bottom: 1rem;">No articles published yet.</p>
          <a href="admin.html" class="btn btn-secondary">Write Your First Post</a>
        </div>
      `;
    } else {
      blogGrid.innerHTML = '';
      // Limit to latest 3
      const recentPosts = posts.slice(0, 3);
      recentPosts.forEach(post => {
        const dateFormatted = new Date(post.date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });

        const postEl = document.createElement('div');
        postEl.className = 'glass-card blog-card fade-in';
        
        // Cover image setup (use placeholder if none exists)
        const coverImgSrc = post.coverImage || 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?q=80&w=600&auto=format&fit=crop';
        
        postEl.innerHTML = `
          <div class="blog-card-image-wrapper">
            <img class="blog-card-image" src="${coverImgSrc}" alt="${post.title}" loading="lazy">
          </div>
          <div class="blog-card-meta">
            <span class="blog-card-category">${post.category}</span>
            <span>&bull;</span>
            <span>${dateFormatted}</span>
          </div>
          <h3 class="blog-card-title"><a href="blog.html?post=${post.slug}">${post.title}</a></h3>
          <p class="blog-card-excerpt">${post.excerpt}</p>
          <div>
            <a href="blog.html?post=${post.slug}" class="blog-card-link">
              <span>Read Article</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
            </a>
          </div>
        `;
        blogGrid.appendChild(postEl);
      });
    }
  } catch (err) {
    console.error('Failed to load posts:', err);
    blogGrid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: var(--accent-pink);">Failed to load articles.</p>`;
  }
}

// Lightbox modal logic for portfolio highlights
function setupLightbox() {
  const lightbox = document.getElementById('art-lightbox');
  const closeBtn = document.getElementById('lightbox-close-btn');
  const artGrid = document.getElementById('home-art-grid');

  if (!lightbox || !closeBtn || !artGrid) return;

  // Open lightbox on portfolio item click
  artGrid.addEventListener('click', (e) => {
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
