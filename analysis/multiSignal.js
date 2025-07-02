const axios = require('axios');

// EMA hesapla
function calculateEMA(data, period) {
  const k = 2 / (period + 1);
  let emaArray = [];
  let ema = data.slice(0, period).reduce((a, b) => a + b) / period;
  emaArray[period - 1] = ema;

  for (let i = period; i < data.length; i++) {
    ema = data[i] * k + ema * (1 - k);
    emaArray[i] = ema;
  }

  return emaArray;
}

// MACD hesapla
function calculateMACD(prices) {
  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);
  let macdLine = [];
  let signalLine = [];

  for (let i = 0; i < prices.length; i++) {
    if (ema12[i] !== undefined && ema26[i] !== undefined) {
      macdLine[i] = ema12[i] - ema26[i];
    }
  }

  signalLine = calculateEMA(macdLine.filter(x => x !== undefined), 9);
  return { macd: macdLine, signal: signalLine };
}

// RSI hesapla (önceden vardı)
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

// Binance'ten fiyat çek
async function fetchPrices(symbol = 'BTCUSDT') {
  const url = 'https://api.binance.com/api/v3/klines';
  const params = { symbol: symbol, interval: '1h', limit: 100 };
  const response = await axios.get(url, { params });
  return response.data.map(entry => parseFloat(entry[4]));
}

// Çoklu analiz sinyali üret
async function getMultiSignal(symbol = 'BTCUSDT') {
  const prices = await fetchPrices(symbol);
  const rsi = calculateRSI(prices.slice(-15));
  const ema12 = calculateEMA(prices, 12).pop();
  const ema26 = calculateEMA(prices, 26).pop();
  const macdData = calculateMACD(prices);
  const macd = macdData.macd.pop();
  const macdSignal = macdData.signal.pop();

  let signal = 'HOLD';
  if (rsi < 30 && ema12 > ema26 && macd > macdSignal) signal = 'BUY';
  else if (rsi > 70 && ema12 < ema26 && macd < macdSignal) signal = 'SELL';

  return {
    symbol,
    rsi: rsi.toFixed(2),
    ema12: ema12.toFixed(2),
    ema26: ema26.toFixed(2),
    macd: macd.toFixed(2),
    macdSignal: macdSignal.toFixed(2),
    signal
  };
}

module.exports = { getMultiSignal };