const express = require('express');
const cors = require('cors');
const app = express();

// CORS Configuration - Allow all origins for production
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow all origins - you can restrict this to specific domains if needed
    // For production, allow requests from the frontend domain
    const allowedOrigins = [
      'https://dd.cp.hupcfl.com',
      'http://localhost:3000',
      'http://localhost:5173'
    ];
    
    // Allow if origin is in allowed list or if it's a development environment
    if (allowedOrigins.includes(origin) || !origin || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      // In production, still allow but log it
      console.log('CORS: Allowing origin:', origin);
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH', 'HEAD'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Authorization'],
  optionsSuccessStatus: 200,
  preflightContinue: false
};

// Apply CORS middleware before all other middleware
app.use(cors(corsOptions));

// Manual CORS headers as fallback (in case cors middleware fails)
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = [
    'https://dd.cp.hupcfl.com',
    'http://localhost:3000',
    'http://localhost:5173'
  ];
  
  // Set CORS headers
  if (origin && (allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production')) {
    res.header('Access-Control-Allow-Origin', origin);
  } else {
    res.header('Access-Control-Allow-Origin', '*');
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Max-Age', '86400'); // 24 hours
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

// Explicitly handle OPTIONS requests for all routes
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware (for debugging)
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  next();
});

// Routes
app.get('/', (req, res) => {
  res.send('Hello from the backend!');
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Test endpoint to verify routing works (accepts all methods)
app.all('/api/test', (req, res) => {
  res.json({ 
    status: 'ok', 
    method: req.method,
    path: req.path,
    originalUrl: req.originalUrl,
    timestamp: new Date().toISOString() 
  });
});

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/companies', require('./routes/companyRoutes'));
app.use('/api/responses', require('./routes/checklistResponseRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/documents', require('./routes/documentRoutes')); // New document routes
app.use('/api/checklist', require('./routes/checklistRoutes'));

// Catch-all route for unmatched API requests (must be last)
app.use('/api', (req, res) => {
  console.error(`Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ 
    message: 'Route not found', 
    method: req.method, 
    path: req.originalUrl 
  });
});

module.exports = app;
