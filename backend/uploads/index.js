import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/Auth.js';
import screensRoutes from './routes/screens.js';

// app.use('/screens', screensRoutes);




dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use('/auth', authRoutes);
app.use('/screens', screensRoutes);

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error(err));

  app.get('/test', (req, res) => {
  res.send('✅ Routing is working!');
});


app.listen(5000, () => console.log("API running on port 5000"));
