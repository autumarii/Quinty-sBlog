const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Enable CORS and body parsing
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Directories
const CONTENT_DIR = path.join(__dirname, 'content');
const POSTS_DIR = path.join(CONTENT_DIR, 'posts');
const PORTFOLIO_FILE = path.join(CONTENT_DIR, 'portfolio.json');
const UPLOADS_DIR = path.join(__dirname, 'public', 'uploads');

// Ensure directories exist
if (!fs.existsSync(CONTENT_DIR)) {
  fs.mkdirSync(CONTENT_DIR, { recursive: true });
}
if (!fs.existsSync(POSTS_DIR)) {
  fs.mkdirSync(POSTS_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
if (!fs.existsSync(PORTFOLIO_FILE)) {
  fs.writeFileSync(PORTFOLIO_FILE, JSON.stringify([], null, 2));
}

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'public')));

// Configure Multer for file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    // Sanitize filename and append unique timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '_');
    cb(null, `${base}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif|webp/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only images (jpg, jpeg, png, gif, webp) are allowed!'));
  }
});

// Helper: Helper function to generate slug from title
function generateSlug(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// --- BLOG POSTS API ENDPOINTS ---

// GET /api/posts - Get all blog posts sorted by date descending
app.get('/api/posts', (req, res) => {
  try {
    const files = fs.readdirSync(POSTS_DIR);
    const posts = files
      .filter(file => file.endsWith('.json'))
      .map(file => {
        const filePath = path.join(POSTS_DIR, file);
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
      })
      // Sort: latest posts first
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve posts', details: error.message });
  }
});

// GET /api/posts/:slug - Get a single post by slug
app.get('/api/posts/:slug', (req, res) => {
  try {
    const slug = req.params.slug;
    const filePath = path.join(POSTS_DIR, `${slug}.json`);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Post not found' });
    }
    const data = fs.readFileSync(filePath, 'utf8');
    res.json(JSON.parse(data));
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve the post', details: error.message });
  }
});

// POST /api/posts - Create a new post
app.post('/api/posts', upload.single('coverImage'), (req, res) => {
  try {
    const { title, subtitle, excerpt, content, tags, category } = req.body;
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and Content are required.' });
    }

    let slug = generateSlug(title);
    let filePath = path.join(POSTS_DIR, `${slug}.json`);

    // De-duplicate slug if file already exists
    let counter = 1;
    while (fs.existsSync(filePath)) {
      slug = `${generateSlug(title)}-${counter}`;
      filePath = path.join(POSTS_DIR, `${slug}.json`);
      counter++;
    }

    // Relative image path for front-end serving
    const coverImageUrl = req.file ? `/uploads/${req.file.filename}` : '';

    const newPost = {
      slug,
      title,
      subtitle: subtitle || '',
      excerpt: excerpt || content.substring(0, 150).replace(/<[^>]*>/g, '') + '...',
      content,
      coverImage: coverImageUrl,
      category: category || 'Uncategorized',
      tags: tags ? tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
      date: new Date().toISOString()
    };

    fs.writeFileSync(filePath, JSON.stringify(newPost, null, 2));
    res.status(201).json({ message: 'Post created successfully!', post: newPost });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create post', details: error.message });
  }
});

// --- PORTFOLIO API ENDPOINTS ---

// GET /api/portfolio - Get all art pieces
app.get('/api/portfolio', (req, res) => {
  try {
    if (!fs.existsSync(PORTFOLIO_FILE)) {
      return res.json([]);
    }
    const data = fs.readFileSync(PORTFOLIO_FILE, 'utf8');
    // Sort: latest art first
    const portfolio = JSON.parse(data).sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));
    res.json(portfolio);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve portfolio', details: error.message });
  }
});

// POST /api/portfolio - Add an art piece to portfolio
app.post('/api/portfolio', upload.single('artImage'), (req, res) => {
  try {
    const { title, medium, date, description } = req.body;
    if (!title || !req.file) {
      return res.status(400).json({ error: 'Title and Art Image are required.' });
    }

    const artImageUrl = `/uploads/${req.file.filename}`;

    const newArtPiece = {
      id: Date.now().toString(),
      title,
      medium: medium || 'Unknown Medium',
      date: date || new Date().toISOString().split('T')[0],
      description: description || '',
      imageUrl: artImageUrl,
      uploadDate: new Date().toISOString()
    };

    // Read existing portfolio data
    let portfolio = [];
    if (fs.existsSync(PORTFOLIO_FILE)) {
      const fileData = fs.readFileSync(PORTFOLIO_FILE, 'utf8');
      portfolio = JSON.parse(fileData);
    }

    portfolio.push(newArtPiece);
    fs.writeFileSync(PORTFOLIO_FILE, JSON.stringify(portfolio, null, 2));

    res.status(201).json({ message: 'Art piece added successfully!', artPiece: newArtPiece });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add art piece', details: error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: `File upload error: ${err.message}` });
  }
  res.status(500).json({ error: err.message });
});

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
