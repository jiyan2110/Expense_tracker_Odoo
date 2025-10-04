const axios = require('axios');

const EXCHANGE_API_BASE = process.env.EXCHANGE_API_BASE || 'https://api.exchangerate-api.com/v4/latest';
const COUNTRIES_API = 'https://restcountries.com/v3.1/all?fields=name,currencies';

// Cache for exchange rates (expires after 1 hour)
let exchangeRateCache = {};
let countriesCache = null;
let cacheExpiry = null;

async function getAllCountries() {
  if (countriesCache && cacheExpiry && Date.now() < cacheExpiry) {
    return countriesCache;
  }

  try {
    console.log('Fetching countries from API...');
    const response = await axios.get(COUNTRIES_API);
    console.log('API Response status:', response.status);
    console.log('API Response data type:', typeof response.data);
    console.log('API Response data length:', response.data?.length);
    
    if (!response.data || !Array.isArray(response.data)) {
      throw new Error('Invalid response format from countries API');
    }

    countriesCache = response.data.map(country => {
      try {
        return {
          name: country.name?.common || 'Unknown Country',
          currency: country.currencies ? Object.keys(country.currencies)[0] : 'USD',
          currencySymbol: country.currencies ? Object.values(country.currencies)[0]?.symbol || '$' : '$'
        };
      } catch (err) {
        console.warn('Error processing country:', country, err.message);
        return {
          name: 'Unknown Country',
          currency: 'USD',
          currencySymbol: '$'
        };
      }
    }).filter(country => country.name !== 'Unknown Country');
    
    cacheExpiry = Date.now() + (60 * 60 * 1000); // 1 hour cache
    console.log('Successfully fetched', countriesCache.length, 'countries');
    return countriesCache;
  } catch (error) {
    console.error('Error fetching countries from API:', error.message);
    console.log('Using fallback countries...');
    
    // Fallback countries if API fails
    countriesCache = [
      { name: 'United States', currency: 'USD', currencySymbol: '$' },
      { name: 'India', currency: 'INR', currencySymbol: '₹' },
      { name: 'United Kingdom', currency: 'GBP', currencySymbol: '£' },
      { name: 'Canada', currency: 'CAD', currencySymbol: 'C$' },
      { name: 'Australia', currency: 'AUD', currencySymbol: 'A$' },
      { name: 'Germany', currency: 'EUR', currencySymbol: '€' },
      { name: 'France', currency: 'EUR', currencySymbol: '€' },
      { name: 'Japan', currency: 'JPY', currencySymbol: '¥' },
      { name: 'China', currency: 'CNY', currencySymbol: '¥' },
      { name: 'Brazil', currency: 'BRL', currencySymbol: 'R$' },
      { name: 'Mexico', currency: 'MXN', currencySymbol: '$' },
      { name: 'South Korea', currency: 'KRW', currencySymbol: '₩' },
      { name: 'Singapore', currency: 'SGD', currencySymbol: 'S$' },
      { name: 'Switzerland', currency: 'CHF', currencySymbol: 'CHF' },
      { name: 'Netherlands', currency: 'EUR', currencySymbol: '€' }
    ];
    
    cacheExpiry = Date.now() + (60 * 60 * 1000); // 1 hour cache
    return countriesCache;
  }
}

async function getExchangeRate(fromCurrency, toCurrency) {
  const cacheKey = `${fromCurrency}_${toCurrency}`;
  
  // Check cache first
  if (exchangeRateCache[cacheKey] && exchangeRateCache[cacheKey].expiry > Date.now()) {
    return exchangeRateCache[cacheKey].rate;
  }

  try {
    const response = await axios.get(`${EXCHANGE_API_BASE}/${fromCurrency}`);
    const rate = response.data.rates[toCurrency] || 1;
    
    // Cache the rate for 1 hour
    exchangeRateCache[cacheKey] = {
      rate,
      expiry: Date.now() + (60 * 60 * 1000)
    };
    
    return rate;
  } catch (error) {
    console.error('Error fetching exchange rate:', error);
    return 1;
  }
}

async function convertToCompanyCurrency(amount, srcCurrency, companyCurrency) {
  if (!amount || !srcCurrency || !companyCurrency) return amount;
  if (srcCurrency === companyCurrency) return amount;
  
  try {
    const rate = await getExchangeRate(srcCurrency, companyCurrency);
    const converted = Number(amount) * rate;
    return Number(converted.toFixed(2));
  } catch (err) {
    console.warn('currency convert failed', err.message);
    return amount;
  }
}

async function convertCurrency(amount, fromCurrency, toCurrency) {
  const rate = await getExchangeRate(fromCurrency, toCurrency);
  return {
    convertedAmount: Math.round(amount * rate * 100) / 100,
    exchangeRate: rate,
    fromCurrency,
    toCurrency,
    conversionDate: new Date()
  };
}

module.exports = { 
  getAllCountries, 
  convertToCompanyCurrency, 
  getExchangeRate,
  convertCurrency 
};
