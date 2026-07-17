// Home page logic: fetch and display 2x2 grid of posts with Latest/Popular/All filter tabs
let allPosts = [];
let currentFilter = 'latest';

document.addEventListener('DOMContentLoaded', () => {
  loadHomeContent();
  setupFilterTabs();
});

async function loadHomeContent() {
  const blogGrid = document.getElementById('home-blog-grid');
  if (!blogGrid) return;

  try {
    const res = await fetch('/api/posts');
    allPosts = await res.json();

    // Inject simulated popularity score (views) to ensure consistent popular sorting
    allPosts.forEach(post => {
      // Create a stable pseudo-random view count based on slug characters
      let score = 0;
      for (let i = 0; i < post.slug.length; i++) {
        score += post.slug.charCodeAt(i);
      }
      post.views = (score % 250) + 50; // Stable view count between 50 and 300
    });

    renderHomeGrid();
  } catch (err) {
    console.error('Failed to load posts:', err);
    blogGrid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: var(--color-primary); padding: 3rem 0;">Failed to load posts. Please verify the server is running.</p>`;
  }
}

function setupFilterTabs() {
  const tabs = document.querySelectorAll('.posts-tab-btn');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentFilter = tab.getAttribute('data-filter');
      renderHomeGrid();
    });
  });
}

function renderHomeGrid() {
  const blogGrid = document.getElementById('home-blog-grid');
  if (!blogGrid) return;

  if (allPosts.length === 0) {
    blogGrid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 4rem 0; border: 2px dashed var(--border-color); border-radius: var(--radius-md); background: var(--bg-surface);">
        <p style="color: var(--color-muted); margin-bottom: 1.5rem;">No articles published yet.</p>
        <a href="admin.html" class="btn btn-secondary" style="border-color: var(--color-primary); color: var(--color-primary);">Write Your First Post</a>
      </div>
    `;
    return;
  }

  let postsToRender = [...allPosts];

  if (currentFilter === 'latest') {
    // Sort by date descending (latest first)
    postsToRender.sort((a, b) => new Date(b.date) - new Date(a.date));
    postsToRender = postsToRender.slice(0, 4);
  } else if (currentFilter === 'popular') {
    // Sort by simulated views descending
    postsToRender.sort((a, b) => b.views - a.views);
    postsToRender = postsToRender.slice(0, 4);
  } else {
    // All (first 4 posts in order)
    postsToRender = postsToRender.slice(0, 4);
  }

  blogGrid.innerHTML = '';
  postsToRender.forEach(post => {
    const dateFormatted = new Date(post.date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const coverImgSrc = post.coverImage || 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?q=80&w=600&auto=format&fit=crop';

    const postEl = document.createElement('div');
    postEl.className = 'glass-card blog-card fade-in';
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
      <div style="display: flex; justify-content: space-between; align-items: center; margin-top: auto; padding-top: 1rem; border-top: 1px solid var(--border-color);">
        <a href="blog.html?post=${post.slug}" class="blog-card-link">
          <span>Read Article</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
        </a>
        ${currentFilter === 'popular' ? `<span style="font-size: 0.85rem; color: var(--color-muted); font-weight: 600;">👁️ ${post.views} views</span>` : ''}
      </div>
    `;
    blogGrid.appendChild(postEl);
  });
}
