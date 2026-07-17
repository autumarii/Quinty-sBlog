// Blog listing and single post reader page logic

let allBlogPosts = [];
let activeTag = 'all';

document.addEventListener('DOMContentLoaded', () => {
  routePage();
});

// Watch for URL query parameters or hash changes
function routePage() {
  const urlParams = new URLSearchParams(window.location.search);
  const slug = urlParams.get('post');

  if (slug) {
    showSinglePost(slug);
  } else {
    showBlogFeed();
  }
}

// Renders the feed grid
async function showBlogFeed() {
  document.getElementById('blog-reader-container').style.display = 'none';
  document.getElementById('blog-feed-container').style.display = 'block';

  const grid = document.getElementById('blog-grid');
  if (!grid) return;

  try {
    const res = await fetch('/api/posts');
    allBlogPosts = await res.json();

    if (allBlogPosts.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 5rem 0; border: 1px dashed var(--border-color); border-radius: var(--radius-md); background: rgba(255,255,255,0.01);">
          <p style="color: var(--color-muted); margin-bottom: 1.5rem;">No blog articles published yet.</p>
          <a href="admin.html" class="btn btn-primary">Publish Your First Article</a>
        </div>
      `;
      return;
    }

    // Generate tag filters
    generateTagFilters();

    // Render feed
    renderBlogGrid(allBlogPosts);

    // Setup live search
    const searchBar = document.getElementById('search-bar');
    if (searchBar) {
      searchBar.addEventListener('input', () => {
        filterPosts();
      });
    }

  } catch (err) {
    console.error('Failed to load blog posts:', err);
    grid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: var(--accent-pink); padding: 3rem 0;">Error loading articles. Please verify the server is running.</p>`;
  }
}

// Generate tags from articles database
function generateTagFilters() {
  const filterContainer = document.getElementById('tag-filters');
  if (!filterContainer) return;

  const tags = new Set();
  allBlogPosts.forEach(post => {
    if (post.tags && Array.isArray(post.tags)) {
      post.tags.forEach(tag => tags.add(tag.trim()));
    }
  });

  filterContainer.innerHTML = `<button class="filter-btn active" data-tag="all">All Articles</button>`;

  tags.forEach(tag => {
    const btn = document.createElement('button');
    btn.className = 'filter-btn';
    btn.setAttribute('data-tag', tag.toLowerCase());
    btn.innerText = `#${tag}`;
    filterContainer.appendChild(btn);
  });

  // Setup click listeners
  const tagButtons = document.querySelectorAll('#tag-filters .filter-btn');
  tagButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tagButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      activeTag = btn.getAttribute('data-tag');
      filterPosts();
    });
  });
}

// Combined Search & Tag filter logic
function filterPosts() {
  const searchInput = document.getElementById('search-bar');
  const query = searchInput ? searchInput.value.toLowerCase().trim() : '';

  let filtered = allBlogPosts;

  // Filter by tag
  if (activeTag !== 'all') {
    filtered = filtered.filter(post => 
      post.tags.some(tag => tag.toLowerCase() === activeTag)
    );
  }

  // Filter by search query
  if (query) {
    filtered = filtered.filter(post => 
      post.title.toLowerCase().includes(query) ||
      post.excerpt.toLowerCase().includes(query) ||
      post.content.toLowerCase().includes(query) ||
      post.tags.some(tag => tag.toLowerCase().includes(query)) ||
      post.category.toLowerCase().includes(query)
    );
  }

  renderBlogGrid(filtered);
}

// Render cards in layout
function renderBlogGrid(posts) {
  const grid = document.getElementById('blog-grid');
  if (!grid) return;

  if (posts.length === 0) {
    grid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: var(--color-muted); padding: 3rem 0;">No articles match your search criteria.</p>`;
    return;
  }

  grid.innerHTML = '';

  posts.forEach(post => {
    const dateFormatted = new Date(post.date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const coverImgSrc = post.coverImage || 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?q=80&w=600&auto=format&fit=crop';

    const card = document.createElement('div');
    card.className = 'glass-card blog-card fade-in';
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
      <div>
        <a href="blog.html?post=${post.slug}" class="blog-card-link">
          <span>Read Article</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
        </a>
      </div>
    `;

    grid.appendChild(card);
  });
}

// --- SINGLE POST VIEW ---

async function showSinglePost(slug) {
  document.getElementById('blog-feed-container').style.display = 'none';
  document.getElementById('blog-reader-container').style.display = 'block';

  try {
    const res = await fetch(`/api/posts/${slug}`);
    if (!res.ok) {
      throw new Error('Post not found');
    }

    const post = await res.json();

    // Set page title
    document.title = `${post.title} | Qunity's Blog`;

    // Category & Title
    document.getElementById('article-view-category').innerText = post.category;
    document.getElementById('article-view-title').innerText = post.title;

    // Date
    const dateFormatted = new Date(post.date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    document.getElementById('article-view-date').innerText = dateFormatted;

    // Reading time calculation
    const words = post.content.replace(/<[^>]*>/g, '').trim().split(/\s+/).length;
    const readingTime = Math.max(1, Math.ceil(words / 200));
    document.getElementById('article-view-reading-time').innerText = `${readingTime} min read`;

    // Hero image (hide if none uploaded, or load default)
    const imgEl = document.getElementById('article-view-image');
    if (post.coverImage) {
      imgEl.src = post.coverImage;
      imgEl.style.display = 'block';
    } else {
      imgEl.style.display = 'none';
    }

    // Content Formatting (Formats markdown-like headers, lists, paragraphs and HTML safely)
    const formattedContent = formatContent(post.content);
    document.getElementById('article-view-content').innerHTML = formattedContent;

    // Render Tags list
    const tagsContainer = document.getElementById('article-view-tags');
    tagsContainer.innerHTML = '';
    if (post.tags && post.tags.length > 0) {
      post.tags.forEach(tag => {
        const span = document.createElement('span');
        span.className = 'article-tag';
        span.innerText = `#${tag}`;
        tagsContainer.appendChild(span);
      });
      tagsContainer.style.display = 'flex';
    } else {
      tagsContainer.style.display = 'none';
    }

    // Scroll to top of viewport
    window.scrollTo({ top: 0, behavior: 'smooth' });

  } catch (err) {
    console.error(err);
    document.getElementById('article-view-content').innerHTML = `
      <div style="text-align: center; padding: 4rem 0;">
        <h3 style="color: var(--accent-pink); margin-bottom: 1rem;">Article Not Found</h3>
        <p style="color: var(--color-muted);">The post you are trying to read doesn't exist or was removed.</p>
        <a href="blog.html" class="btn btn-secondary" style="margin-top: 1.5rem;">Return to Blog</a>
      </div>
    `;
  }
}

// Convert newline blocks into proper HTML paragraph blocks (if HTML tags not present)
// Also handles basic Markdown styles if written (e.g. headers #, lists -, bold **)
// Renders inline images marked as [img:URL]
function formatContent(text) {
  // First, replace [img:URL] tags with actual <img> tags (before other processing)
  text = text.replace(/\[img:(https?:\/\/[^\]\s]+)\]/g, (match, url) => {
    return `\n\n<img src="${url}" alt="Article image" class="article-inline-image" loading="lazy">\n\n`;
  });

  // If the user entered HTML already (contains tags like <p>, <div>, <br>), don't alter it
  if (/<[a-z][\s\S]*>/i.test(text)) {
    return text;
  }

  // Otherwise format as paragraphs and basic markdown
  const lines = text.split('\n\n');
  return lines.map(line => {
    let trimmed = line.trim();
    if (!trimmed) return '';

    // Skip if it's already an img tag
    if (trimmed.startsWith('<img')) {
      return trimmed;
    }

    // Handle Headers: # Title, ## Subtitle
    if (trimmed.startsWith('### ')) {
      return `<h3>${trimmed.replace('### ', '')}</h3>`;
    }
    if (trimmed.startsWith('## ')) {
      return `<h2>${trimmed.replace('## ', '')}</h2>`;
    }
    if (trimmed.startsWith('# ')) {
      return `<h1>${trimmed.replace('# ', '')}</h1>`;
    }

    // Handle lists starting with - or *
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const items = trimmed.split(/\n[-*]\s/).map(item => `<li>${item.replace(/^[-*]\s/, '')}</li>`).join('');
      return `<ul>${items}</ul>`;
    }

    // Handle Blockquote starting with >
    if (trimmed.startsWith('> ')) {
      return `<blockquote>${trimmed.replace(/^>\s/, '')}</blockquote>`;
    }

    // Handle Bold (**bold**)
    trimmed = trimmed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Handle Italic (*italic*)
    trimmed = trimmed.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // Replace single newlines with breaklines inside standard paragraphs
    trimmed = trimmed.replace(/\n/g, '<br>');

    return `<p>${trimmed}</p>`;
  }).join('');
}
