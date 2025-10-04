const fetch = require('node-fetch');

const EXCHANGE_API_BASE = process.env.EXCHANGE_API_BASE || 'https://api.exchangerate-api.com/v4/latest';

async function convertToCompanyCurrency(amount, srcCurrency, companyCurrency) {
  if (!amount || !srcCurrency || !companyCurrency) return amount;
  if (srcCurrency === companyCurrency) return amount;
  try {
    const resp = await fetch(`${EXCHANGE_API_BASE}/${srcCurrency}`);
    const data = await resp.json();
    const rate = data.rates && data.rates[companyCurrency];
    if (!rate) throw new Error('rate not found');
    const converted = Number(amount) * rate;
    return Number(converted.toFixed(2));
  } catch (err) {
    // fallback: return original amount
    console.warn('currency convert failed', err.message);
    return amount;
  }
}

async function getAllCountries() {
  const resp = await fetch('https://restcountries.com/v3.1/all?fields=name,currencies,cca2');
  const data = await resp.json();
  return data;
}

module.exports = { convertToCompanyCurrency, getAllCountries };
