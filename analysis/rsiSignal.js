const axios = require('axios');

// Basit RSI hesaplayıcı
function calculateRSI(closingPrices, period = 14) {
  let gains = 0, losses = 0;

  for (let i = 1; i <= period; i++) {
    const change = closingPrices[i] - closingPrices[i - 1];
    if (change > 0) gains += change;
    else losses -= change;
  }

  const avgGain = gains / period;
  const avgLoss = losses / period;
  const rs = avgGain / avgLoss;
  const rsi = 100 - (100 / (1 + rs));
  return rsi;
}

// Binance API üzerinden son 100 kapanış fiyatını al
async function fetchClosingPrices(symbol = 'BTCUSDT') {
  const url = 'https://api.binance.com/api/v3/klines';
  const params = {
    symbol: symbol,
    interval: '1h',
    limit: 100
  };

  const response = await axios.get(url, { params });
  return response.data.map(entry => parseFloat(entry[4])); // 4 = close price
}

// Sinyal üretici
async function getSignal(symbol = 'BTCUSDT') {
  try {
    const prices = await fetchClosingPrices(symbol);
    const rsi = calculateRSI(prices.slice(-15)); // son 15 fiyatla RSI hesapla

    let signal = 'HOLD';
    if (rsi < 30) signal = 'BUY';
    else if (rsi > 70) signal = 'SELL';

    return { symbol, rsi: rsi.toFixed(2), signal };
  } catch (err) {
    console.error('Sinyal hatası:', err.message);
    throw err;
  }
}

module.exports = { getSignal };