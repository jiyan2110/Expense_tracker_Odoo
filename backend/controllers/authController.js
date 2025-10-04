const User = require('../models/User');
const Company = require('../models/Company');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { getAllCountries } = require('../utils/currencyService');

const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret';

// helper to create user (for admin route)
async function createUserForCompany({ name, email, password, role = 'Employee', managerId = null, companyId }) {
  const existing = await User.findOne({ email });
  if (existing) throw new Error('Email already exists');
  const passwordHash = await bcrypt.hash(password, 10);
  const user = new User({ name, email, password: passwordHash, role, managerId, companyId });
  await user.save();
  return { id: user._id, name: user.name, email: user.email, role: user.role };
}

exports.createUserForCompany = createUserForCompany;

exports.signup = async (req, res) => {
  try {
    const { name, email, password, companyName, country } = req.body;
    if (!name || !email || !password || !companyName || !country) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // check if user already exists globally
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: 'Email already exists' });

    // determine default currency from country using restcountries
    let defaultCurrency = 'USD';
    let currencySymbol = '$';
    try {
      const countries = await getAllCountries();
      const found = countries.find(c => 
        c.name.toLowerCase().includes(country.toLowerCase())
      );
      if (found) {
        defaultCurrency = found.currency;
        currencySymbol = found.currencySymbol;
      }
    } catch (e) {
      console.warn('Failed to fetch country data:', e.message);
    }

    // create company first with a temporary createdBy (we'll update it)
    const tempCompany = new Company({ 
      name: companyName, 
      country,
      defaultCurrency,
      currencySymbol,
      createdBy: new mongoose.Types.ObjectId() // temporary ID
    });
    await tempCompany.save();

    // create admin user with companyId
    const passwordHash = await bcrypt.hash(password, 10);
    const user = new User({
      name,
      email,
      password: passwordHash,
      role: 'Admin',
      companyId: tempCompany._id
    });
    await user.save();

    // update company with correct createdBy
    tempCompany.createdBy = user._id;
    await tempCompany.save();

    const token = jwt.sign({ id: user._id, companyId: tempCompany._id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ 
      token, 
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email, 
        role: user.role,
        companyId: tempCompany._id
      }, 
      company: { 
        id: tempCompany._id, 
        name: tempCompany.name,
        country: tempCompany.country,
        defaultCurrency,
        currencySymbol
      } 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).populate('companyId', 'name defaultCurrency currencySymbol country');
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });
    
    const ok = await user.comparePassword(password);
    if (!ok) return res.status(400).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id, companyId: user.companyId._id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({
      token,
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email, 
        role: user.role, 
        companyId: user.companyId._id
      },
      company: {
        id: user.companyId._id,
        name: user.companyId.name,
        defaultCurrency: user.companyId.defaultCurrency,
        currencySymbol: user.companyId.currencySymbol,
        country: user.companyId.country
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get countries for signup dropdown
exports.getCountries = async (req, res) => {
  try {
    const countries = await getAllCountries();
    res.json(countries);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
