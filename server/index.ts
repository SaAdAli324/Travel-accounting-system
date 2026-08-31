import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import cookieParser from 'cookie-parser';

import { COA } from './models/COA.js';
import { User } from './models/User.js';
import bcrypt from 'bcryptjs';

// Routes
import authRoutes from './routes/auth.js';
import coaRoutes from './routes/coa.js';
import settingsRoutes from './routes/settings.js';
import partyRoutes from './routes/parties.js';
import journalRoutes from './routes/journals.js';
import ledgerRoutes from './routes/ledger.js';
import invoiceRoutes from './routes/invoices.js';
import paymentRoutes from './routes/payments.js';

import { authenticateToken } from './middleware/auth.js';

dotenv.config();

const app = express();
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("MONGODB_URI is not defined in .env file.");
  process.exit(1);
}

if (!process.env.JWT_SECRET) {
  console.error("JWT_SECRET is not defined in .env file.");
  process.exit(1);
}

const seedSystemAccounts = async () => {
  const systemAccounts = [
    { account_code: '1200', account_name: 'Accounts Receivable', account_type: 'asset', is_system: true },
    { account_code: '1010', account_name: 'Cash / Bank', account_type: 'asset', is_system: true },
    { account_code: '4010', account_name: 'Ticket Sales Revenue', account_type: 'revenue', is_system: true },
    { account_code: '4020', account_name: 'Hotel Sales Revenue', account_type: 'revenue', is_system: true },
    { account_code: '4030', account_name: 'Visa Sales Revenue', account_type: 'revenue', is_system: true },
    { account_code: '4090', account_name: 'Other Revenue', account_type: 'revenue', is_system: true },
  ];

  for (const acc of systemAccounts) {
    const exists = await COA.findOne({ account_code: acc.account_code });
    if (!exists) {
      await new COA(acc).save();
      console.log(`Seeded System Account: ${acc.account_name}`);
    }
  }
};

const seedAdminUser = async () => {
  let admin = await User.findOne({ username: 'admin' });
  const hashedPassword = await bcrypt.hash('admin123', 10);
  if (!admin) {
    admin = new User({
      username: 'admin',
      password: hashedPassword,
      role: 'admin'
    });
    await admin.save();
    console.log('Seeded default admin user (admin / admin123)');
  } else {
    admin.password = hashedPassword;
    admin.role = 'admin';
    await admin.save();
    console.log('Reset admin password to admin123 and ensured admin role');
  }
};

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB Atlas');
    seedSystemAccounts();
    seedAdminUser();
  })
  .catch(err => console.error('MongoDB connection error:', err));

// API Routes
app.use('/api/auth', authRoutes);

// Protect all other routes
app.use('/api', authenticateToken);

app.use('/api/coa', coaRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/parties', partyRoutes);
app.use('/api/journals', journalRoutes);
app.use('/api/ledger', ledgerRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/payments', paymentRoutes);

if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

export default app;
