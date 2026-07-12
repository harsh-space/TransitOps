const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const { authenticate, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// Hardcoded credentials (static user)
const STATIC_USER = {
  email: "manager@transitops.in",
  password: "manager123",   // plain text for demo
  role: "FleetManager"
};

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password || !role) {
    return res.status(400).json({ success: false, error: 'Email, password, and role are required.' });
  }

  try {
    // 🔹 First check static user
    if (email === STATIC_USER.email && password === STATIC_USER.password && role === STATIC_USER.role) {
      const token = jwt.sign(
        { email: STATIC_USER.email, role: STATIC_USER.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      return res.json({
        success: true,
        data: {
          token,
          user: {
            email: STATIC_USER.email,
            role: STATIC_USER.role
          }
        }
      });
    }

    // 🔹 Otherwise check MongoDB user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ success: false, error: 'Invalid credentials.' });
    }

    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const minutesLeft = Math.ceil((user.lockedUntil - new Date()) / 60000);
      return res.status(423).json({
        success: false,
        error: `Account is locked due to multiple failed login attempts. Try again in ${minutesLeft} minutes.`
      });
    }

    // Verify password and role
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

    // Successful DB login
    user.failedLoginAttempts = 0;
    user.lockedUntil = null;
    await user.save();

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
