// Admin Dashboard logic (Creator Hub)

document.addEventListener('DOMContentLoaded', () => {
  setupTabs();
  setupBlogForm();
  setupArtForm();
  setupInlineImages();
  loadManagePortfolio();
});

// Switch between tabs
function setupTabs() {
  const tabs = document.querySelectorAll('.admin-tab');
  const contents = document.querySelectorAll('.tab-content');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetId = tab.dataset.tab;

      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      contents.forEach(content => {
        if (content.id === targetId) {
          content.classList.add('active');
        } else {
          content.classList.remove('active');
        }
      });

      if (targetId === 'tab-manage') {
        loadManagePortfolio();
      }
    });
  });
}

// Blog form submission (publish article)
function setupBlogForm() {
  const blogForm = document.getElementById('blog-form');
  if (!blogForm) return;

  blogForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = document.getElementById('blog-submit-btn');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span>Publishing...</span>`;

    const formData = new FormData(blogForm);

    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        window.showToast('Article published successfully!', 'success');
        blogForm.reset();
      } else {
        window.showToast(data.error || 'Failed to publish article', 'error');
      }
    } catch (err) {
      console.error(err);
      window.showToast('Network error, please try again.', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
    }
  });
}

// Art form logic (new portfolio piece upload)
let selectedTag = 'academic';

function setupArtForm() {
  // Tag buttons
  const tagButtons = document.querySelectorAll('.new-art-tag-btn');
  tagButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tagButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedTag = btn.dataset.tag;
    });
  });

  // File upload button
  const uploadBtn = document.getElementById('upload-file-btn');
  const fileInput = document.getElementById('art-file-input');
  const fileNameDisplay = document.getElementById('file-name-display');
  const preview = document.getElementById('image-preview');
  const previewImg = document.getElementById('preview-img');

  if (uploadBtn && fileInput) {
    uploadBtn.addEventListener('click', () => {
      fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        if (!file.type.startsWith('image/')) {
          window.showToast('Please select an image file.', 'error');
          return;
        }
        fileNameDisplay.textContent = file.name;

        const reader = new FileReader();
        reader.onload = (ev) => {
          previewImg.src = ev.target.result;
          preview.style.display = 'block';
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // Article Yes/No buttons
  const yesBtn = document.getElementById('article-yes');
  const noBtn = document.getElementById('article-no');
  const articleSection = document.getElementById('article-section');

  if (yesBtn) {
    yesBtn.addEventListener('click', () => {
      // Switch to blog tab and pre-select Dreamscapes
      const blogTab = document.querySelector('.admin-tab[data-tab="tab-blog"]');
      if (blogTab) blogTab.click();
      const categorySelect = document.getElementById('blog-category');
      if (categorySelect) categorySelect.value = 'Dreamscapes';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  if (noBtn) {
    noBtn.addEventListener('click', () => {
      articleSection.style.display = 'none';
    });
  }

  // Publish and Draft buttons
  const publishBtn = document.getElementById('art-publish-btn');
  const draftBtn = document.getElementById('art-draft-btn');

  if (publishBtn) {
    publishBtn.addEventListener('click', (e) => {
      e.preventDefault();
      submitArtPiece('published');
    });
  }

  if (draftBtn) {
    draftBtn.addEventListener('click', (e) => {
      e.preventDefault();
      submitArtPiece('draft');
    });
  }
}

async function submitArtPiece(status) {
  const title = document.getElementById('art-title').value.trim();
  const description = document.getElementById('art-description').value.trim();
  const fileInput = document.getElementById('art-file-input');

  if (!title) {
    window.showToast('Please enter a title.', 'error');
    return;
  }

  if (!fileInput.files[0]) {
    window.showToast('Please upload an image file.', 'error');
    return;
  }

  const publishBtn = document.getElementById('art-publish-btn');
  const draftBtn = document.getElementById('art-draft-btn');
  publishBtn.disabled = true;
  draftBtn.disabled = true;
  publishBtn.textContent = 'Saving...';

  const formData = new FormData();
  formData.append('title', title);
  formData.append('description', description);
  formData.append('tag', selectedTag);
  formData.append('status', status);
  formData.append('image', fileInput.files[0]);

  try {
    const response = await fetch('/api/portfolio-pieces', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (response.ok) {
      window.showToast(
        status === 'published' ? 'Piece published to portfolio!' : 'Piece saved to draft!',
        'success'
      );
      // Reset form
      document.getElementById('art-title').value = '';
      document.getElementById('art-description').value = '';
      fileInput.value = '';
      document.getElementById('file-name-display').textContent = 'No file selected';
      document.getElementById('image-preview').style.display = 'none';
      // Show article section again
      document.getElementById('article-section').style.display = 'block';
    } else {
      window.showToast(data.error || 'Failed to save piece.', 'error');
    }
  } catch (err) {
    console.error('Failed to submit piece:', err);
    window.showToast('Network error, please try again.', 'error');
  } finally {
    publishBtn.disabled = false;
    draftBtn.disabled = false;
    publishBtn.textContent = 'Publish';
  }
}

// Inline image insertion for articles
function setupInlineImages() {
  const inlineBtn = document.getElementById('inline-image-btn');
  const inlineInput = document.getElementById('inline-image-input');
  const contentTextarea = document.getElementById('blog-content');

  if (!inlineBtn || !inlineInput || !contentTextarea) return;

  inlineBtn.addEventListener('click', () => {
    inlineInput.click();
  });

  inlineInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      window.showToast('Please select an image file.', 'error');
      return;
    }

    // Insert placeholder at cursor position
    const cursorPos = contentTextarea.selectionStart;
    const textBefore = contentTextarea.value.substring(0, cursorPos);
    const textAfter = contentTextarea.value.substring(cursorPos);
    const placeholder = `[img:uploading...]`;
    contentTextarea.value = textBefore + placeholder + textAfter;

    // Upload the image
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch('/api/upload-inline-image', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.url) {
        // Replace placeholder with actual URL
        contentTextarea.value = contentTextarea.value.replace(
          `[img:uploading...]`,
          `[img:${data.url}]`
        );
        window.showToast('Image inserted!', 'success');
      } else {
        contentTextarea.value = contentTextarea.value.replace(`[img:uploading...]`, '');
        window.showToast(data.error || 'Failed to upload image.', 'error');
      }
    } catch (err) {
      console.error('Inline image upload failed:', err);
      contentTextarea.value = contentTextarea.value.replace(`[img:uploading...]`, '');
      window.showToast('Failed to upload image.', 'error');
    }

    // Reset input
    inlineInput.value = '';
  });
}

// Manage Portfolio tab - load and render pieces with feature toggle
async function loadManagePortfolio() {
  const grid = document.getElementById('manage-portfolio-grid');
  if (!grid) return;

  grid.innerHTML = '<p class="loading-text">Loading portfolio pieces...</p>';

  try {
    const response = await fetch('/api/portfolio-pieces');
    if (!response.ok) {
      throw new Error('Failed to fetch');
    }
    const pieces = await response.json();

    if (!Array.isArray(pieces) || pieces.length === 0) {
      grid.innerHTML = '<p class="loading-text">No pieces uploaded yet. Use the "Upload Art Piece" tab to add your first piece.</p>';
      return;
    }

    // Sort by created_at desc
    pieces.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    grid.innerHTML = '';
    pieces.forEach(piece => {
      const card = document.createElement('div');
      card.className = 'manage-piece-card';

      const imgUrl = piece.image_path
        ? `${SUPABASE_URL_FROM_CONFIG}/storage/v1/object/public/portfolio-images/${piece.image_path}`
        : '';

      const now = new Date();
      const isCurrentlyFeatured = piece.is_featured && piece.featured_until && new Date(piece.featured_until) > now;

      const statusBadge = piece.status === 'draft'
        ? '<span class="manage-status-badge draft">DRAFT</span>'
        : '<span class="manage-status-badge published">PUBLISHED</span>';

      card.innerHTML = `
        <div class="manage-piece-image">
          ${imgUrl ? `<img src="${imgUrl}" alt="${piece.title}">` : '<div class="no-image">No image</div>'}
          ${statusBadge}
        </div>
        <div class="manage-piece-info">
          <h4>${piece.title}</h4>
          <p class="manage-piece-tag">${piece.tag.toUpperCase()}</p>
          <p class="manage-piece-likes">&hearts; ${piece.likes || 0} likes</p>
          <button class="manage-feature-btn ${isCurrentlyFeatured ? 'featured' : ''}" data-id="${piece.id}">
            ${isCurrentlyFeatured ? 'Unfeature' : 'Feature for 1 month'}
          </button>
        </div>
      `;

      const featureBtn = card.querySelector('.manage-feature-btn');
      if (featureBtn) {
        featureBtn.addEventListener('click', () => toggleFeature(piece.id, isCurrentlyFeatured));
      }

      grid.appendChild(card);
    });
  } catch (err) {
    console.error('Failed to load manage portfolio:', err);
    grid.innerHTML = '<p class="loading-text">Error loading pieces. Please check the server is running.</p>';
  }
}

let SUPABASE_URL_FROM_CONFIG = '';

async function loadSupabaseConfig() {
  try {
    const res = await fetch('/api/config');
    const config = await res.json();
    SUPABASE_URL_FROM_CONFIG = config.supabaseUrl || '';
  } catch (err) {
    console.error('Failed to load config:', err);
  }
}

// Load config on startup
loadSupabaseConfig();

async function toggleFeature(pieceId, isCurrentlyFeatured) {
  try {
    const updates = isCurrentlyFeatured
      ? { is_featured: false, featured_until: null }
      : { is_featured: true, featured_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() };

    const response = await fetch(`/api/portfolio-pieces/${pieceId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });

    if (response.ok) {
      window.showToast(
        isCurrentlyFeatured ? 'Piece unfeatured.' : 'Piece featured for 1 month!',
        'success'
      );
      loadManagePortfolio();
    } else {
      window.showToast('Failed to update feature status.', 'error');
    }
  } catch (err) {
    console.error('Failed to toggle feature:', err);
    window.showToast('Failed to update feature status.', 'error');
  }
}
