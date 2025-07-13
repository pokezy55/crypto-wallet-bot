# 🚀 Crypto Price APIs untuk Wallet Dashboard

## 📊 **API yang Tersedia:**

### 1. **CoinGecko API** (Rekomendasi Utama)
- ✅ **Gratis** tanpa API key
- ✅ **Rate limit**: 50 calls/minute
- ✅ **Data lengkap**: harga, perubahan 24h, volume, market cap
- ✅ **Reliable** dan populer

**File**: `lib/crypto-prices.js`

### 2. **Binance API** (Alternatif)
- ✅ **Gratis** tanpa API key
- ✅ **Real-time** data
- ✅ **WebSocket** support untuk live updates
- ✅ **Rate limit**: 1200 requests/minute

**File**: `lib/binance-prices.js`

## 🔧 **Cara Penggunaan:**

### CoinGecko API (Sudah diimplementasi):
```javascript
import { getCachedTokenPrices, fetchTokenPrices } from '@/lib/crypto-prices';

// Get cached prices (auto-refresh setiap 30 detik)
const prices = await getCachedTokenPrices();

// Get fresh prices
const freshPrices = await fetchTokenPrices(['ETH', 'USDT', 'BNB', 'POL']);
```

### Binance API (Alternatif):
```javascript
import { fetchBinancePrices } from '@/lib/binance-prices';

// Get Binance prices
const binancePrices = await fetchBinancePrices(['ETH', 'USDT', 'BNB', 'POL']);
```

## 📈 **Data yang Diterima:**

```javascript
{
  ETH: {
    price: 1850.45,
    change24h: 2.5,
    lastUpdated: 1703123456789
  },
  USDT: {
    price: 1.001,
    change24h: 0.1,
    lastUpdated: 1703123456789
  }
  // ... dst
}
```

## ⚡ **Fitur Real-time:**

### Auto-refresh setiap 30 detik
```javascript
useEffect(() => {
  const fetchPrices = async () => {
    const prices = await getCachedTokenPrices();
    setTokenPrices(prices);
  };

  fetchPrices();
  const interval = setInterval(fetchPrices, 30000);
  
  return () => clearInterval(interval);
}, []);
```

### Manual refresh dengan button
```javascript
const refreshWallet = async () => {
  const prices = await getCachedTokenPrices();
  setTokenPrices(prices);
  toast.success('Prices updated!');
};
```

## 🔄 **Cara Ganti API:**

### Dari CoinGecko ke Binance:
1. Import Binance API:
```javascript
import { fetchBinancePrices } from '@/lib/binance-prices';
```

2. Ganti fungsi fetch:
```javascript
const prices = await fetchBinancePrices(['ETH', 'USDT', 'BNB', 'POL']);
```

## 📱 **Implementasi di WalletTab:**

Harga real-time sudah diimplementasi di `components/WalletTab.tsx`:

- ✅ Auto-fetch setiap 30 detik
- ✅ Manual refresh dengan button
- ✅ Fallback prices jika API down
- ✅ Loading states
- ✅ Error handling
- ✅ Cache untuk performance

## 🎯 **Keuntungan Setup Ini:**

1. **Real-time**: Harga update otomatis
2. **Reliable**: Fallback jika API down
3. **Fast**: Caching untuk performance
4. **Flexible**: Mudah ganti API provider
5. **Free**: Tidak perlu API key

## 🚨 **Rate Limits:**

- **CoinGecko**: 50 calls/minute
- **Binance**: 1200 requests/minute

Cache 30 detik sudah cukup untuk menghindari rate limit.

## 🔧 **Customization:**

Untuk menambah token baru:
1. Update `TOKEN_IDS` di `crypto-prices.js`
2. Update `BINANCE_SYMBOLS` di `binance-prices.js`
3. Tambah ke token list di `WalletTab.tsx` 