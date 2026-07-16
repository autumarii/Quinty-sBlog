// Admin Dashboard logic (Creator Hub)

document.addEventListener('DOMContentLoaded', () => {
  setupTabs();
  setupDragAndDrop();
  setupFormSubmissions();
  
  // Set default art creation date to today
  const dateInput = document.getElementById('art-date');
  if (dateInput) {
    dateInput.value = new Date().toISOString().split('T')[0];
  }
});

// Switch between tabs
function setupTabs() {
  const tabs = document.querySelectorAll('.admin-tab');
  const contents = document.querySelectorAll('.tab-content');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetId = tab.dataset.tab;
      
      // Update tab active class
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      // Update content active class
      contents.forEach(content => {
        if (content.id === targetId) {
          content.classList.add('active');
        } else {
          content.classList.remove('active');
        }
      });
    });
  });
}

// Drag & Drop Upload mechanics
function setupDragAndDrop() {
  setupZone('blog-dropzone', 'blog-image-input', 'blog-preview-container', 'blog-preview-img', 'blog-remove-preview');
  setupZone('art-dropzone', 'art-image-input', 'art-preview-container', 'art-preview-img', 'art-remove-preview');

  function setupZone(dropzoneId, inputId, previewContainerId, previewImgId, removeBtnId) {
    const dropzone = document.getElementById(dropzoneId);
    const input = document.getElementById(inputId);
    const previewContainer = document.getElementById(previewContainerId);
    const previewImg = document.getElementById(previewImgId);
    const removeBtn = document.getElementById(removeBtnId);

    if (!dropzone || !input) return;

    // Trigger file dialog on click
    dropzone.addEventListener('click', () => {
      // Done via natural label/nesting, but just in case:
      if (document.activeElement !== input) {
        input.click();
      }
    });

    // Dragover effects
    ['dragenter', 'dragover'].forEach(eventName => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.add('dragover');
      }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.remove('dragover');
      }, false);
    });

    // Drop handler
    dropzone.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      const files = dt.files;
      if (files.length > 0) {
        input.files = files;
        handleFileSelection(files[0]);
      }
    });

    // Input selection handler
    input.addEventListener('change', () => {
      if (input.files.length > 0) {
        handleFileSelection(input.files[0]);
      }
    });

    // Remove preview handler
    removeBtn.addEventListener('click', (e) => {
      e.stopPropagation(); // Avoid triggering dropzone click
      input.value = ''; // Reset input
      previewContainer.style.display = 'none';
      dropzone.style.display = 'block';
    });

    function handleFileSelection(file) {
      if (!file.type.startsWith('image/')) {
        window.showToast('Please upload an image file!', 'error');
        input.value = '';
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        previewImg.src = e.target.result;
        dropzone.style.display = 'none';
        previewContainer.style.display = 'flex';
      };
      reader.readAsDataURL(file);
    }
  }
}

// Form submissions (Fetch API)
function setupFormSubmissions() {
  const blogForm = document.getElementById('blog-form');
  const artForm = document.getElementById('art-form');

  if (blogForm) {
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
          // Reset file preview
          document.getElementById('blog-remove-preview').click();
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

  if (artForm) {
    artForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const submitBtn = document.getElementById('art-submit-btn');
      const originalText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span>Uploading Art...</span>`;

      const formData = new FormData(artForm);

      try {
        const response = await fetch('/api/portfolio', {
          method: 'POST',
          body: formData
        });

        const data = await response.json();

        if (response.ok) {
          window.showToast('Art piece added to portfolio!', 'success');
          artForm.reset();
          // Reset file preview
          document.getElementById('art-remove-preview').click();
          // Reset completion date to today
          document.getElementById('art-date').value = new Date().toISOString().split('T')[0];
        } else {
          window.showToast(data.error || 'Failed to upload art piece', 'error');
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
}
