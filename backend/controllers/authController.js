const User = require('../models/User');
const Company = require('../models/Company');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fetch = require('node-fetch');

const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret';

// helper to create user (for admin route)
async function createUserForCompany({ name, email, password, role = 'Employee', managerId = null, companyId }) {
  const existing = await User.findOne({ email });
  if (existing) throw new Error('Email already');
  const passwordHash = await bcrypt.hash(password, 10);
  const user = new User({ name, email, passwordHash, role, managerId, companyId });
  await user.save();
  return { id: user._id, name: user.name, email: user.email, role: user.role };
}

exports.createUserForCompany = createUserForCompany;

exports.signup = async (req, res) => {
  try {
    const { name, email, password, companyName, countryCode } = req.body;
    if (!name || !email || !password || !companyName) return res.status(400).json({ error: 'missing fields' });

    // check if user already exists globally
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: 'email exists' });

    // determine default currency from countryCode using restcountries
    let defaultCurrency = 'USD';
    try {
      if (countryCode) {
        const resp = await fetch('https://restcountries.com/v3.1/all?fields=name,currencies');
        const list = await resp.json();
        const found = list.find(c => {
          // find by name or cca2 - flexible; fallback to first
          return (c.name && c.name.common && c.name.common.toLowerCase().includes(countryCode.toLowerCase()));
        });
        if (found && found.currencies) {
          const codes = Object.keys(found.currencies);
          if (codes.length) defaultCurrency = codes[0];
        }
      }
    } catch (e) {
      /* ignore - fallback USD */
    }

    // create company + admin user
    const company = new Company({ name: companyName, defaultCurrency });
    await company.save();

    const passwordHash = await bcrypt.hash(password, 10);
    const user = new User({
      name,
      email,
      passwordHash,
      role: 'Admin',
      companyId: company._id,
      isManagerApprover: true
    });
    await user.save();

    company.createdBy = user._id;
    await company.save();

    const token = jwt.sign({ id: user._id, companyId: company._id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role }, company: { id: company._id, defaultCurrency } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).populate('companyId', 'defaultCurrency');
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(400).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id, companyId: user.companyId._id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, companyId: user.companyId._id, defaultCurrency: user.companyId.defaultCurrency }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
