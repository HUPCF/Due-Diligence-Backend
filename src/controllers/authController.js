const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

const login = async (req, res) => {
  console.log('=== LOGIN REQUEST RECEIVED ===');
  console.log('Method:', req.method);
  console.log('Path:', req.path);
  console.log('Original URL:', req.originalUrl);
  console.log('Body:', { email: req.body?.email, password: req.body?.password ? '***' : undefined });
  
  const { email, password } = req.body;

  try {
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Check if JWT_SECRET is configured
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not configured in environment variables');
      return res.status(500).json({ message: 'Server configuration error' });
    }

    console.log(`Login attempt for email: ${email}`);
    
    // Check database connection first
    let user;
    try {
      user = await User.findByEmail(email);
    } catch (dbError) {
      console.error('Database error when finding user:', dbError.message);
      console.error('Database error stack:', dbError.stack);
      throw new Error(`Database error: ${dbError.message}`);
    }

    if (!user) {
      console.log(`User not found: ${email}`);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    console.log(`User found: ${user.email}, checking password...`);
    
    // Check if user has a password hash
    if (!user.password) {
      console.error('User has no password hash stored');
      return res.status(500).json({ message: 'User account error' });
    }

    let isMatch;
    try {
      isMatch = await bcrypt.compare(password, user.password);
    } catch (bcryptError) {
      console.error('Bcrypt comparison error:', bcryptError.message);
      throw new Error(`Password comparison error: ${bcryptError.message}`);
    }

    if (!isMatch) {
      console.log(`Password mismatch for user: ${email}`);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const payload = {
      user: {
        id: user.id,
        role: user.role,
        company_id: user.company_id
      }
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '24h'
    });

    console.log(`Login successful for user: ${email} (ID: ${user.id})`);
    res.json({ 
      token, 
      user: { 
        id: user.id, 
        email: user.email,
        role: user.role, 
        company_id: user.company_id 
      } 
    });
  } catch (error) {
    console.error('=== LOGIN ERROR ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Error details:', error);
    if (error.code) {
      console.error('Error code:', error.code);
    }
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

const register = async (req, res) => {
  const { email, password, role, companyId } = req.body;

  try {
    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(400).json({ message: 'Invalid company ID' });
    }

    let user = await User.findByEmail(email);

    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUserId = await User.create(email, hashedPassword, role, companyId);

    const payload = {
      user: {
        id: newUserId,
        role,
        company_id: companyId
      }
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '24h'
    });

    res.json({ token });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
};


const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({
      id: user.id,
      email: user.email,
      role: user.role,
      company_id: user.company_id,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
};

module.exports = {
  login,
  register,
  getMe
};
