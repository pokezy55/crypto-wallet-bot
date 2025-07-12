# Crypto Wallet Bot - Telegram WebApp

Aplikasi Telegram bot crypto wallet builder dengan dukungan EVM (Ethereum Virtual Machine) yang memungkinkan pengguna membuat, mengimpor, dan mengelola wallet crypto mereka melalui Telegram WebApp.

## 🚀 Fitur Utama

### 🔐 Wallet Management
- **Create Wallet**: Buat wallet EVM baru dengan seed phrase
- **Import Wallet**: Impor wallet existing menggunakan seed phrase
- **Receive Crypto**: Tampilkan QR code dan address untuk menerima crypto
- **Send Crypto**: Kirim crypto ke address lain
- **Swap Tokens**: Integrasi dengan Uniswap untuk swap token

### 📋 Task & Rewards
- **Swap Task**: Complete swap senilai $10 untuk reward $5 USDT
- **Automatic Reward**: Reward diklaim otomatis setelah task selesai
- **One-time Claim**: Satu user hanya bisa klaim sekali

### 🎯 Referral System
- **Referral Link**: Generate link referral otomatis
- **Referral Tracking**: Track jumlah user yang direferensikan
- **Referral Reward**: $0.5 USDT per referral valid

### ⚙️ Security Features
- **PIN Protection**: PIN untuk akses seed phrase dan private key
- **Secure Storage**: Seed phrase dan private key tidak disimpan di frontend
- **Backup Options**: Download dan copy seed phrase

## 🛠️ Teknologi

### Frontend
- **Next.js 14**: React framework dengan App Router
- **TypeScript**: Type safety dan developer experience
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library
- **React Hot Toast**: Notifikasi toast
- **QRCode.react**: Generate QR code

### Backend (Planned)
- **Node.js/Express**: API server
- **Ethers.js**: Ethereum wallet operations
- **Uniswap SDK**: Token swapping
- **Database**: PostgreSQL/MongoDB untuk user data

### Telegram Integration
- **Telegram WebApp**: In-app browser experience
- **Telegram Login**: User authentication
- **Telegram Bot API**: Bot functionality

## 📱 UI/UX Features

### Design System
- **Dark Theme**: Crypto-focused dark interface
- **Responsive**: Full mobile responsive design
- **Modern UI**: Clean, modern crypto dApp aesthetic
- **Smooth Animations**: Transitions dan micro-interactions

### Navigation
- **Bottom Navigation**: 4 tab utama (Wallet, Task, Referral, Menu)
- **Modal System**: Create/Import wallet modals
- **Breadcrumb Navigation**: Untuk sub-sections

## 🔧 Setup & Installation

### Prerequisites
- Node.js 18+ 
- npm atau yarn
- Telegram Bot Token

### Installation

1. **Clone repository**
```bash
git clone <repository-url>
cd telegram-crypto-wallet-bot
```

2. **Install dependencies**
```bash
npm install
```

3. **Setup environment variables**
```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_BOT_USERNAME=your_bot_username
ADMIN_USERNAME=admin_username
```

4. **Run development server**
```bash
npm run dev
```

5. **Build for production**
```bash
npm run build
npm start
```

## 📁 Struktur Proyek

```
├── app/
│   ├── globals.css          # Global styles
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Main page
├── components/
│   ├── TelegramLogin.tsx    # Telegram authentication
│   ├── WalletTab.tsx        # Wallet management
│   ├── TaskTab.tsx          # Task & rewards
│   ├── ReferralTab.tsx      # Referral system
│   ├── MenuTab.tsx          # Settings & profile
│   ├── CreateWalletModal.tsx # Create wallet modal
│   └── ImportWalletModal.tsx # Import wallet modal
├── types/
│   └── telegram.d.ts        # Telegram WebApp types
├── public/                  # Static assets
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── README.md
```

## 🔐 Security Considerations

### Frontend Security
- Seed phrase dan private key tidak disimpan di localStorage
- PIN validation untuk akses sensitive data
- Secure clipboard operations
- Input validation dan sanitization

### Backend Security (Planned)
- Encrypted database storage
- API rate limiting
- JWT authentication
- Input validation
- CORS configuration

## 🚀 Deployment

### Vercel (Recommended)
1. Connect repository ke Vercel
2. Set environment variables
3. Deploy automatically

### Other Platforms
- Netlify
- Railway
- Heroku
- DigitalOcean App Platform

## 📱 Telegram Bot Setup

1. **Create Bot**
   - Message @BotFather di Telegram
   - Use `/newbot` command
   - Set bot name dan username

2. **Configure WebApp**
   - Use `/setmenubutton` untuk set menu button
   - Use `/setcommands` untuk set bot commands

3. **WebApp URL**
   - Set WebApp URL ke deployed app URL
   - Test di Telegram

## 🔄 API Integration (Planned)

### Wallet Operations
```typescript
// Create wallet
POST /api/wallet/create
{
  userId: number,
  seedPhrase: string
}

// Import wallet
POST /api/wallet/import
{
  userId: number,
  seedPhrase: string
}

// Get balance
GET /api/wallet/balance/:address
```

### Task System
```typescript
// Complete task
POST /api/task/complete
{
  userId: number,
  taskId: string
}

// Claim reward
POST /api/task/claim
{
  userId: number,
  taskId: string
}
```

### Referral System
```typescript
// Get referral stats
GET /api/referral/stats/:userId

// Add referral
POST /api/referral/add
{
  referrerId: number,
  referredId: number
}
```

## 🎨 Customization

### Theme Colors
Edit `tailwind.config.js`:
```javascript
theme: {
  extend: {
    colors: {
      primary: {
        // Custom primary colors
      },
      crypto: {
        // Custom crypto theme colors
      }
    }
  }
}
```

### Components
- Modify components di `components/` directory
- Update types di `types/` directory
- Customize styles di `app/globals.css`

## 🤝 Contributing

1. Fork repository
2. Create feature branch
3. Make changes
4. Test thoroughly
5. Submit pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

- **Documentation**: Check README dan comments
- **Issues**: Create GitHub issue
- **Telegram**: Contact @AdminUsername

## 🔮 Roadmap

### Phase 1 (Current)
- ✅ Basic wallet creation
- ✅ Import wallet functionality
- ✅ UI/UX implementation
- ✅ Telegram integration

### Phase 2 (Next)
- 🔄 Backend API development
- 🔄 Real blockchain integration
- 🔄 Uniswap integration
- 🔄 Database implementation

### Phase 3 (Future)
- 📋 Advanced security features
- 📋 Multi-chain support
- 📋 DeFi integrations
- 📋 Mobile app development

---

**Note**: Ini adalah aplikasi demo. Untuk production use, implementasikan semua security measures dan backend functionality yang diperlukan. 