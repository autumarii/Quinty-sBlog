// Dreamscapes page logic: fetch and render posts filtered by category/tag
let allPosts = [];
let filteredPosts = [];
let activeTag = 'all';

document.addEventListener('DOMContentLoaded', () => {
  loadDreamscapesContent();
});

async function loadDreamscapesContent() {
  const latestList = document.getElementById('dreamscapes-latest-list');
  const popularList = document.getElementById('dreamscapes-popular-list');
  const highlightPost = document.getElementById('dreamscapes-highlight-post');

  try {
    const res = await fetch('/api/posts');
    const posts = await res.json();
    
    allPosts = posts;

    // Inject simulated popularity score (views)
    allPosts.forEach(post => {
      let score = 0;
      for (let i = 0; i < post.slug.length; i++) {
        score += post.slug.charCodeAt(i);
      }
      post.views = (score % 250) + 75;
    });

    // Filter for Dreamscapes category or tag
    filteredPosts = allPosts.filter(post => 
      post.category.toLowerCase() === 'dreamscapes' || 
      post.tags.some(t => t.toLowerCase() === 'dreamscapes' || t.toLowerCase() === 'dream' || t.toLowerCase() === 'creative process')
    );

    // Fallback if no posts match, to avoid empty page
    if (filteredPosts.length === 0) {
      filteredPosts = allPosts;
    }

    generateTags();
    renderLists();
  } catch (err) {
    console.error('Failed to load Dreamscapes content:', err);
    if (latestList) latestList.innerHTML = `<p style="color: #ffffff;">Error loading posts.</p>`;
    if (popularList) popularList.innerHTML = `<p style="color: #ffffff;">Error loading posts.</p>`;
  }
}

function generateTags() {
  const container = document.getElementById('dynamic-tags-container');
  if (!container) return;

  const tags = new Set();
  filteredPosts.forEach(post => {
    if (post.tags && Array.isArray(post.tags)) {
      post.tags.slice(0, 3).forEach(tag => tags.add(tag.trim()));
    }
  });

  container.innerHTML = '';
  tags.forEach(tag => {
    const btn = document.createElement('button');
    btn.className = 'btn btn-secondary posts-tab-btn';
    btn.setAttribute('data-tag', tag.toLowerCase());
    btn.innerText = `#${tag}`;
    btn.style.borderColor = 'var(--border-color)';
    btn.style.color = 'var(--color-primary)';
    container.appendChild(btn);
  });

  // Setup listeners for all tags including "All"
  const tagButtons = document.querySelectorAll('.posts-tab-btn');
  tagButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tagButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeTag = btn.getAttribute('data-tag');
      renderLists();
    });
  });
}

function renderLists() {
  const latestList = document.getElementById('dreamscapes-latest-list');
  const popularList = document.getElementById('dreamscapes-popular-list');
  const highlightPost = document.getElementById('dreamscapes-highlight-post');

  if (!latestList || !popularList) return;

  // Filter posts by active tag
  let displayPosts = [...filteredPosts];
  if (activeTag !== 'all') {
    displayPosts = displayPosts.filter(post => 
      post.tags.some(t => t.toLowerCase() === activeTag)
    );
  }

  // 1. Render LATEST posts (Limit to 2)
  const latestPosts = [...displayPosts].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 2);
  latestList.innerHTML = '';
  if (latestPosts.length === 0) {
    latestList.innerHTML = `<p style="color: var(--color-muted); grid-column: 1/-1;">No posts in this section.</p>`;
  } else {
    latestPosts.forEach(post => {
      latestList.appendChild(createPostCard(post));
    });
  }

  // 2. Render POPULAR posts (Limit to 2, sorted by views)
  const popularPosts = [...displayPosts].sort((a, b) => b.views - a.views).slice(0, 2);
  popularList.innerHTML = '';
  if (popularPosts.length === 0) {
    popularList.innerHTML = `<p style="color: var(--color-muted); grid-column: 1/-1;">No posts in this section.</p>`;
  } else {
    popularPosts.forEach(post => {
      popularList.appendChild(createPostCard(post, true));
    });
  }

  // 3. Render HIGHLIGHT post (e.g. Post #67 in the drawing)
  highlightPost.innerHTML = '';
  const showcasePost = displayPosts[0] || allPosts[0];
  if (!showcasePost) {
    highlightPost.innerHTML = `<p style="color: var(--color-muted); text-align: center;">No featured post available.</p>`;
  } else {
    const dateFormatted = new Date(showcasePost.date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    highlightPost.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 1rem;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-family: var(--font-heading); font-weight: 700; color: var(--accent-color); font-size: 1.1rem; text-transform: uppercase;">
            ${showcasePost.category}
          </span>
          <span style="font-size: 0.85rem; color: var(--color-muted);">${dateFormatted}</span>
        </div>
        <h3 style="font-family: var(--font-serif); font-size: 1.8rem; margin: 0.5rem 0;">
          <a href="blog.html?post=${showcasePost.slug}" style="color: var(--color-primary);">${showcasePost.title}</a>
        </h3>
        <p style="color: var(--color-muted); line-height: 1.6; margin-bottom: 1rem;">
          ${showcasePost.content.substring(0, 280)}${showcasePost.content.length > 280 ? '...' : ''}
        </p>
        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-color); padding-top: 1rem;">
          <a href="blog.html?post=${showcasePost.slug}" class="blog-card-link" style="color: var(--accent-color); font-weight: 600;">
            Read Full Review &rarr;
          </a>
          <span style="font-size: 0.85rem; color: var(--color-muted); font-style: italic;">✨ featured review ✨</span>
        </div>
      </div>
    `;
  }
}

function createPostCard(post, showViews = false) {
  const card = document.createElement('div');
  card.className = 'glass-card blog-card fade-in';
  
  const coverImgSrc = post.coverImage || 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?q=80&w=600&auto=format&fit=crop';
  const dateFormatted = new Date(post.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  card.innerHTML = `
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
      ${showViews ? `<span style="font-size: 0.85rem; color: var(--color-secondary);">👁️ ${post.views} views</span>` : ''}
    </div>
  `;
  return card;
}
