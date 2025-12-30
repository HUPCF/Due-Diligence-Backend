const bcrypt = require('bcryptjs');
const User = require('../models/userModel');
const Company = require('../models/companyModel');
const { sendEmail } = require('../services/emailService');

// Admin-created user with an explicit password (never returned or logged)
const createUser = async (req, res) => {
  const { email, role, companyId, password } = req.body;

  if (!password || password.length < 8) {
    return res
      .status(400)
      .json({ message: 'Password is required and must be at least 8 characters long.' });
  }

  try {
    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(400).json({ message: 'Invalid company ID' });
    }

    let existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUserId = await User.create(email, hashedPassword, role, companyId);

    // Optional: notify user that an account has been created (without including the password)
    const subject = 'Your New Account';
    const text = `Hello,\n\nAn account has been created for you.\n\nLogin URL: [Your Login Page URL]\nEmail: ${email}\n\nIf you did not expect this account, please contact your administrator.\n\nThank you.`;
    try {
      await sendEmail(email, subject, text);
    } catch (emailError) {
      console.error('Failed to send account creation email:', emailError.message);
      // Do not fail user creation just because email failed
    }

    res
      .status(201)
      .json({ message: 'User created successfully.', userId: newUserId });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll();
    res.json(users);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
};

// Admin reset of a user's password – sets a new password provided by admin
const resetPassword = async (req, res) => {
  const { id } = req.params;
  const { password } = req.body;

  if (!password || password.length < 8) {
    return res
      .status(400)
      .json({ message: 'Password is required and must be at least 8 characters long.' });
  }

  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await User.updatePassword(id, hashedPassword);

    res.status(200).json({ message: 'Password reset successfully.' });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
};

// Send credentials email to user
const sendCredentialsEmail = async (req, res) => {
  console.log('=== sendCredentialsEmail called ===');
  console.log('Request params:', req.params);
  console.log('Request body:', req.body);
  
  const { id } = req.params;
  const { password } = req.body; // Password to send (from admin)

  try {
    console.log(`Sending credentials email for user ID: ${id}`);
    
    // Validate password
    if (!password) {
      console.error('Password validation failed: password is missing');
      return res.status(400).json({ message: 'Password is required to send credentials email.' });
    }

    // Find user
    const user = await User.findById(id);
    if (!user) {
      console.error(`User not found with ID: ${id}`);
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.email) {
      console.error(`User ${id} has no email address`);
      return res.status(400).json({ message: 'User has no email address.' });
    }

    console.log(`Preparing to send credentials email to: ${user.email}`);

    // Get login URL from environment or use default
    const loginUrl = process.env.LOGIN_URL || 'https://dd.cp.hupcfl.com/';
    
    const subject = 'Your Account Credentials';
    const text = `Hello,\n\nYour account credentials are:\n\nEmail: ${user.email}\nPassword: ${password}\n\nLogin URL: ${loginUrl}\n\nIf you did not request this information, please contact your administrator immediately.\n\nThank you.`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4F46E5;">Your Account Credentials</h2>
        <p>Hello,</p>
        <p>Your account credentials are:</p>
        <div style="background-color: #F3F4F6; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Email:</strong> ${user.email}</p>
          <p style="margin: 5px 0;"><strong>Password:</strong> ${password}</p>
        </div>
        <p><a href="${loginUrl}" style="background-color: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Login Here</a></p>
        <p style="color: #EF4444; font-size: 12px;">If you did not request this information, please contact your administrator immediately.</p>
        <p>Thank you.</p>
      </div>
    `;

    try {
      await sendEmail(user.email, subject, text, html);
      console.log(`Credentials email sent successfully to ${user.email}`);
      res.status(200).json({ message: 'Credentials email sent successfully.' });
    } catch (emailError) {
      console.error('Failed to send credentials email:', emailError);
      console.error('Email error details:', {
        message: emailError.message,
        stack: emailError.stack,
        code: emailError.code
      });
      res.status(500).json({ 
        message: 'Failed to send email.', 
        error: emailError.message || 'Unknown email error'
      });
    }
  } catch (error) {
    console.error('Error in sendCredentialsEmail:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code
    });
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message || 'Unknown error'
    });
  }
};

const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
};

const deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    await User.delete(id);
    res.status(200).json({ message: 'User deleted successfully.' });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
};

module.exports = {
  createUser,
  getAllUsers,
  resetPassword,
  getUserById,
  sendCredentialsEmail,
  deleteUser,
};
