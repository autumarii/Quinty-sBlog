// New Art upload form logic
// Uploads image to Supabase storage, inserts row into portfolio_pieces table

let supabaseConfig = null;
let selectedTag = 'academic';
let selectedFile = null;

document.addEventListener('DOMContentLoaded', () => {
  loadConfig().then(() => {
    setupForm();
    setupTagButtons();
    setupFileUpload();
    setupArticleButtons();
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

function setupTagButtons() {
  const buttons = document.querySelectorAll('.new-art-tag-btn');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedTag = btn.dataset.tag;
    });
  });
}

function setupFileUpload() {
  const uploadBtn = document.getElementById('upload-file-btn');
  const fileInput = document.getElementById('art-file-input');
  const fileNameDisplay = document.getElementById('file-name-display');
  const preview = document.getElementById('image-preview');
  const previewImg = document.getElementById('preview-img');

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
      selectedFile = file;
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

function setupArticleButtons() {
  const yesBtn = document.getElementById('article-yes');
  const noBtn = document.getElementById('article-no');
  const articleSection = document.getElementById('article-section');

  yesBtn.addEventListener('click', () => {
    // Navigate to article writing page, auto-set to Dreamscapes topic
    window.location.href = 'dreamscapes.html?new=true&topic=dreamscapes';
  });

  noBtn.addEventListener('click', () => {
    articleSection.style.display = 'none';
  });
}

function setupForm() {
  const form = document.getElementById('new-art-form');
  const publishBtn = document.getElementById('publish-btn');
  const draftBtn = document.getElementById('draft-btn');

  publishBtn.addEventListener('click', (e) => {
    e.preventDefault();
    submitPiece('published');
  });

  draftBtn.addEventListener('click', (e) => {
    e.preventDefault();
    submitPiece('draft');
  });
}

async function submitPiece(status) {
  const title = document.getElementById('art-title').value.trim();
  const description = document.getElementById('art-description').value.trim();

  if (!title) {
    window.showToast('Please enter a title.', 'error');
    return;
  }

  if (!selectedFile) {
    window.showToast('Please upload an image file.', 'error');
    return;
  }

  const publishBtn = document.getElementById('publish-btn');
  const draftBtn = document.getElementById('draft-btn');
  publishBtn.disabled = true;
  draftBtn.disabled = true;
  publishBtn.textContent = 'Saving...';

  try {
    // 1. Upload image to Supabase storage
    const fileExt = selectedFile.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    const uploadUrl = `${getSupabaseUrl()}/storage/v1/object/portfolio-images/${fileName}`;

    const uploadRes = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getSupabaseAnonKey()}`,
        'apikey': getSupabaseAnonKey(),
        'Content-Type': selectedFile.type,
      },
      body: selectedFile,
    });

    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      throw new Error(`Upload failed: ${errText}`);
    }

    // 2. Insert row into portfolio_pieces table
    const insertUrl = `${getSupabaseUrl()}/rest/v1/portfolio_pieces`;
    const insertRes = await fetch(insertUrl, {
      method: 'POST',
      headers: {
        'apikey': getSupabaseAnonKey(),
        'Authorization': `Bearer ${getSupabaseAnonKey()}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({
        title,
        description,
        image_path: fileName,
        tag: selectedTag,
        status,
      }),
    });

    if (!insertRes.ok) {
      const errText = await insertRes.text();
      throw new Error(`Insert failed: ${errText}`);
    }

    window.showToast(
      status === 'published' ? 'Piece published to portfolio!' : 'Piece saved to draft!',
      'success'
    );

    // Redirect back to admin page
    setTimeout(() => {
      window.location.href = 'quinty-portfolio-admin.html';
    }, 1500);
  } catch (err) {
    console.error('Failed to submit piece:', err);
    window.showToast('Failed to save piece. Please try again.', 'error');
  } finally {
    publishBtn.disabled = false;
    draftBtn.disabled = false;
    publishBtn.textContent = 'Publish';
  }
}
