const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { getIsConnected } = require('../config/db');
const { auth, JWT_SECRET, normalizeRole } = require('../middleware/auth');

const router = express.Router();

const allowedRoles = new Set(['candidate', 'recruiter', 'admin']);
const demoLogin = {
  name: 'Alex Johnson',
  email: 'jobseeker@demo.com',
  password: 'demo123',
  role: 'candidate',
};

function getUserSource() {
  if (getIsConnected()) {
    return { type: 'mongo', model: require('../models/user') };
  }
  return { type: 'memory', store: require('../store/memoryStore').UserStore };
}

function normalizeRequestedRole(role) {
  const normalized = normalizeRole(role || 'candidate');
  return allowedRoles.has(normalized) ? normalized : 'candidate';
}

function isDemoLogin(email, password) {
  return String(email || '').toLowerCase().trim() === demoLogin.email
    && password === demoLogin.password;
}

async function ensureDemoUser(source) {
  if (source.type === 'mongo') {
    let user = await source.model.findOne({ email: demoLogin.email });
    if (!user) {
      return source.model.create(demoLogin);
    }

    const hasDemoPassword = typeof user.comparePassword === 'function'
      ? await user.comparePassword(demoLogin.password)
      : await bcrypt.compare(demoLogin.password, user.password);

    if (!hasDemoPassword || normalizeRole(user.role) !== demoLogin.role) {
      user.name = user.name || demoLogin.name;
      user.password = demoLogin.password;
      user.role = demoLogin.role;
      await user.save();
    }

    return user;
  }

  const existing = await source.store.findByEmail(demoLogin.email);
  return existing || source.store.create(demoLogin);
}

function signToken(user) {
  const role = normalizeRole(user.role);
  return jwt.sign(
    { id: String(user._id), email: user.email, role },
    JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' },
  );
}

function safeUser(user) {
  const raw = typeof user.toObject === 'function' ? user.toObject() : user;
  const { password, ...safe } = raw;
  return {
    ...safe,
    id: String(raw._id),
    role: normalizeRole(raw.role),
  };
}

async function register(req, res) {
  try {
    const { name, email, password } = req.body;
    const role = normalizeRequestedRole(req.body.role);

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const source = getUserSource();
    const existing = source.type === 'mongo'
      ? await source.model.findOne({ email: email.toLowerCase() })
      : await source.store.findByEmail(email.toLowerCase());

    if (existing) {
      return res.status(409).json({ error: 'Email already registered.' });
    }

    const payload = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role,
    };

    const user = source.type === 'mongo'
      ? await source.model.create(payload)
      : await source.store.create(payload);

    return res.status(201).json({
      token: signToken(user),
      user: safeUser(user),
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ error: 'Registration failed.' });
  }
}

router.post('/register', register);
router.post('/signup', register);

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const source = getUserSource();
    let user = source.type === 'mongo'
      ? await source.model.findOne({ email: email.toLowerCase() })
      : await source.store.findByEmail(email.toLowerCase());

    if (isDemoLogin(email, password)) {
      user = await ensureDemoUser(source);
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isValid = typeof user.comparePassword === 'function'
      ? await user.comparePassword(password)
      : await bcrypt.compare(password, user.password);

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    return res.json({
      token: signToken(user),
      user: safeUser(user),
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Login failed.' });
  }
});

router.get('/me', auth, async (req, res) => {
  try {
    const source = getUserSource();
    const user = source.type === 'mongo'
      ? await source.model.findById(req.user.id).select('-password')
      : await source.store.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    return res.json(safeUser(user));
  } catch (error) {
    console.error('Profile error:', error);
    return res.status(500).json({ error: 'Failed to fetch profile.' });
  }
});

router.put('/profile', auth, async (req, res) => {
  try {
    const updates = {};
    if (req.body.name) updates.name = req.body.name;
    if (req.body.profile) updates.profile = req.body.profile;

    const source = getUserSource();
    const user = source.type === 'mongo'
      ? await source.model.findByIdAndUpdate(req.user.id, updates, { new: true }).select('-password')
      : await source.store.updateById(req.user.id, updates);

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    return res.json(safeUser(user));
  } catch (error) {
    console.error('Profile update error:', error);
    return res.status(500).json({ error: 'Failed to update profile.' });
  }
});

module.exports = router;
