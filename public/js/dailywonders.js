// Daily Wonders page logic: fetch and render posts filtered by category/tag
let allPosts = [];
let filteredPosts = [];
let activeTag = 'all';

document.addEventListener('DOMContentLoaded', () => {
  loadDailyWondersContent();
});

async function loadDailyWondersContent() {
  const latestGrid = document.getElementById('dailywonders-latest-grid');
  const popularGrid = document.getElementById('dailywonders-popular-grid');

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
      post.views = (score % 220) + 60;
    });

    // Filter for Daily Wonders category or tag
    filteredPosts = allPosts.filter(post => 
      post.category.toLowerCase() === 'daily wonders' || 
      post.tags.some(t => t.toLowerCase() === 'daily wonders' || t.toLowerCase() === 'wonders' || t.toLowerCase() === 'journal')
    );

    // Fallback if no posts match, to avoid empty page
    if (filteredPosts.length === 0) {
      filteredPosts = allPosts;
    }

    generateSidebarTags();
    renderDailyWondersFeed();
  } catch (err) {
    console.error('Failed to load Daily Wonders content:', err);
    if (latestGrid) latestGrid.innerHTML = `<p style="color: var(--color-primary);">Error loading posts.</p>`;
    if (popularGrid) popularGrid.innerHTML = `<p style="color: var(--color-primary);">Error loading posts.</p>`;
  }
}

function generateSidebarTags() {
  const sidebarList = document.getElementById('dailywonders-sidebar-list');
  if (!sidebarList) return;

  const tags = new Set();
  filteredPosts.forEach(post => {
    if (post.tags && Array.isArray(post.tags)) {
      post.tags.forEach(tag => tags.add(tag.trim()));
    }
  });

  // Keep All, and append others
  sidebarList.innerHTML = `
    <li class="sidebar-list-header">Navigation</li>
    <li class="sidebar-list-item"><a href="#" data-tag="all" class="active">#all</a></li>
  `;

  // Display top 5 tags in the sidebar like the sketch (#1 to #5)
  const tagArray = Array.from(tags).slice(0, 5);
  tagArray.forEach((tag, idx) => {
    const li = document.createElement('li');
    li.className = 'sidebar-list-item';
    li.innerHTML = `<a href="#" data-tag="${tag.toLowerCase()}">#${idx + 1} ${tag}</a>`;
    sidebarList.appendChild(li);
  });

  // Setup click listeners
  const tagLinks = sidebarList.querySelectorAll('a');
  tagLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      tagLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      activeTag = link.getAttribute('data-tag');
      renderDailyWondersFeed();
    });
  });
}

function renderDailyWondersFeed() {
  const latestGrid = document.getElementById('dailywonders-latest-grid');
  const popularGrid = document.getElementById('dailywonders-popular-grid');
  const showcaseContainer = document.getElementById('dailywonders-showcase');

  if (!latestGrid || !popularGrid || !showcaseContainer) return;

  // Filter posts by active tag
  let displayPosts = [...filteredPosts];
  if (activeTag !== 'all') {
    displayPosts = displayPosts.filter(post => 
      post.tags.some(t => t.toLowerCase() === activeTag)
    );
  }

  // 1. Render LATEST (Limit to 2)
  const latestPosts = [...displayPosts].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 2);
  latestGrid.innerHTML = '';
  if (latestPosts.length === 0) {
    latestGrid.innerHTML = `<p style="color: var(--color-muted); grid-column: 1/-1;">No posts in this section.</p>`;
  } else {
    latestPosts.forEach(post => {
      latestGrid.appendChild(createPostCard(post));
    });
  }

  // 2. Render POPULAR (Limit to 2)
  const popularPosts = [...displayPosts].sort((a, b) => b.views - a.views).slice(0, 2);
  popularGrid.innerHTML = '';
  if (popularPosts.length === 0) {
    popularGrid.innerHTML = `<p style="color: var(--color-muted); grid-column: 1/-1;">No posts in this section.</p>`;
  } else {
    popularPosts.forEach(post => {
      popularGrid.appendChild(createPostCard(post, true));
    });
  }

  // 3. Render SHOWCASE POST #300 (Image left, text right)
  showcaseContainer.innerHTML = '';
  const showcasePost = displayPosts[0] || allPosts[0];
  if (!showcasePost) {
    showcaseContainer.innerHTML = `<p style="color: var(--color-muted); text-align: center; grid-column: 1/-1;">No featured post available.</p>`;
  } else {
    const coverImgSrc = showcasePost.coverImage || 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?q=80&w=600&auto=format&fit=crop';
    const dateFormatted = new Date(showcasePost.date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    showcaseContainer.innerHTML = `
      <div class="showcase-image-wrapper">
        <img src="${coverImgSrc}" alt="${showcasePost.title}">
      </div>
      <div class="showcase-content">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
          <span style="font-family: var(--font-heading); font-weight: 700; color: var(--color-primary); text-transform: uppercase; font-size: 0.9rem;">
            ${showcasePost.category}
          </span>
          <span style="font-size: 0.85rem; color: var(--color-muted);">${dateFormatted}</span>
        </div>
        <h3 style="font-family: var(--font-serif); font-size: 1.8rem; margin-bottom: 1rem;">
          <a href="blog.html?post=${showcasePost.slug}" style="color: var(--color-primary);">${showcasePost.title}</a>
        </h3>
        <p style="color: var(--color-muted); font-size: 0.95rem; margin-bottom: 1.5rem; line-height: 1.6;">
          ${showcasePost.excerpt}
        </p>
        <div>
          <a href="blog.html?post=${showcasePost.slug}" class="btn btn-secondary" style="border-color: var(--color-primary); color: var(--color-primary); padding: 0.6rem 1.2rem; font-size: 0.85rem;">
            Read Full Post &rarr;
          </a>
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
