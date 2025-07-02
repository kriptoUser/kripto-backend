require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const mongoose = require('mongoose');
const authRoutes = require('./routes/authRoutes');

const app = express();
app.use(cors());
app.use(express.json());

// 🔧 Bu satır DÜZELTİLDİ:
app.use('/api/users', authRoutes);

app.get('/api/price/:coinId', async (req, res) => {
  const { coinId } = req.params;
  try {
    const response = await axios.get(
      'https://api.coingecko.com/api/v3/simple/price',
      {
        params: {
          ids: coinId,
          vs_currencies: 'usd,try,eur',
        },
      }
    );
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Fiyat çekilemedi' });
  }
});

const { getSignal } = require('./analysis/rsiSignal');
const { getMultiSignal } = require('./analysis/multiSignal');

app.get('/api/signal/:symbol', async (req, res) => {
  const { symbol } = req.params;
  try {
    const signalData = await getSignal(symbol.toUpperCase());
    res.json(signalData);
  } catch (err) {
    res.status(500).json({ error: 'Sinyal üretilemedi' });
  }
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('🟢 MongoDB bağlantısı başarılı'))
  .catch((err) => {
    console.error('🔴 MongoDB bağlantı hatası:', err.message);
  });

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ Backend çalışıyor: http://localhost:${PORT}`);
});

const verifyToken = require('./middleware/auth');
const Signal = require('./models/Signal');
const sendEmail = require('./utils/mail');
const sendTelegramMessage = require('./utils/telegram');

// JWT korumalı: sinyali üret ve kaydet
app.post('/api/signal/:symbol', verifyToken, async (req, res) => {
  const { symbol } = req.params;
  try {
    const signalData = await getSignal(symbol.toUpperCase());
    const newSignal = new Signal({
      userId: req.user.id,
      symbol: signalData.symbol,
      rsi: signalData.rsi,
      signal: signalData.signal
    });
    await newSignal.save();
    res.json(newSignal);
  } catch (err) {
    res.status(500).json({ error: 'Sinyal kaydedilemedi' });
  }
});

// JWT korumalı: geçmiş sinyalleri getir
app.get('/api/signals', verifyToken, async (req, res) => {
  try {
    const signals = await Signal.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(signals);
  } catch (err) {
    res.status(500).json({ error: 'Sinyaller alınamadı' });
  }
});

// Çoklu analiz (RSI + EMA + MACD) endpoint
app.get('/api/signal/multi/:symbol', async (req, res) => {
  const { symbol } = req.params;
  try {
    const signalData = await getMultiSignal(symbol.toUpperCase());
    res.json(signalData);
  } catch (err) {
    res.status(500).json({ error: 'Çoklu sinyal üretilemedi' });
  }
});

// Kullanıcı ayarlarını getir
app.get('/api/settings', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json(user.settings);
  } catch (err) {
    res.status(500).json({ error: 'Ayarlar alınamadı' });
  }
});

// Kullanıcı ayarlarını güncelle
app.put('/api/settings', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.settings = { ...user.settings, ...req.body };
    await user.save();
    res.json({ message: 'Ayarlar güncellendi', settings: user.settings });
  } catch (err) {
    res.status(500).json({ error: 'Ayarlar güncellenemedi' });
  }
});