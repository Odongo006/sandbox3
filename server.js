import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import 'dotenv/config';

import lipaNaMpesaRoutes from "./routes/routes.lipanampesa.js";
import Transaction from "./models/Transaction.js";

// Initialize express
const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected via Mongoose"))
  .catch(err => console.error("❌ MongoDB connection error:", err));

// Routes
app.use('/api', lipaNaMpesaRoutes);

// Check transaction status
app.get('/api/transactions/checkout/:checkoutId', async (req, res) => {
  try {
    const txn = await Transaction.findOne({
      CheckoutRequestID: req.params.checkoutId,
    });

    if (!txn) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    res.json({ success: true, transaction: txn });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Dynamic port for production/deployment
const port = process.env.PORT || 8000;

app.listen(port, () => {
  console.log(`🚀 App listening on port ${port}`);
});
