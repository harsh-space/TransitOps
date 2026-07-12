const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const { authenticate, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password || !role) {
    return res.status(400).json({ success: false, error: 'Email, password, and role are required.' });
  }

  try {
    if (global.useMock) {
      const mockStore = require('../mockStore');
      const user = mockStore.users.find(u => u.email === email.toLowerCase().trim());
      if (!user || user.passwordHash !== password || user.role !== role) {
        return res.status(400).json({ success: false, error: 'Invalid credentials.' });
      }

      // Successful login for mock mode
      const token = jwt.sign(
        { id: user._id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      return res.json({
        success: true,
        data: {
          token,
          user: {
            id: user._id,
            email: user.email,
            role: user.role
          }
        }
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      // Don't leak details but return standard bad credentials
      return res.status(400).json({ success: false, error: 'Invalid credentials.' });
    }

    // Check if account is currently locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const minutesLeft = Math.ceil((user.lockedUntil - new Date()) / 60000);
      return res.status(423).json({
        success: false,
        error: `Account is locked due to multiple failed login attempts. Try again in ${minutesLeft} minutes.`
      });
    }

    // Check password and role match
    const isPasswordValid = await user.comparePassword(password);
    const isRoleValid = (user.role === role);

    if (!isPasswordValid || !isRoleValid) {
      user.failedLoginAttempts += 1;

      if (user.failedLoginAttempts >= 5) {
        user.lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 mins lockout
        await user.save();
        return res.status(423).json({
          success: false,
          error: 'Account locked after 5 failed attempts. Please try again in 15 minutes.'
        });
      }

      await user.save();
      
      const attemptsRemaining = 5 - user.failedLoginAttempts;
      return res.status(400).json({
        success: false,
        error: `Invalid credentials. Account will be locked after ${attemptsRemaining} more failed attempt(s).`
      });
    }

    // Successful login
    user.failedLoginAttempts = 0;
    user.lockedUntil = null;
    await user.save();

    // Issue JWT
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.json({
      success: true,
      data: {
        token,
        user: {
          id: user._id,
          email: user.email,
          role: user.role
        }
      }
    });

  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req, res) => {
  return res.json({
    success: true,
    data: {
      user: {
        id: req.user._id,
        email: req.user.email,
        role: req.user.role
      }
    }
  });
});

module.exports = router;
