import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import 'dotenv/config';

// initialize express
const app = express();

// middlewares
app.use(express.json());
app.use(cors());

// MongoDB connection using Mongoose
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ MongoDB connected via Mongoose"))
.catch(err => console.error("❌ MongoDB connection error:", err));

// import routes
import lipaNaMpesaRoutes from "./routes/routes.lipanampesa.js";
app.use('/api', lipaNaMpesaRoutes);

// ✅ Import the Transaction model
import Transaction from "./models/Transaction.js"; // adjust path if different

// ✅ Add a GET endpoint to check transaction status
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

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`🚀 App listening on port ${port}`);
});
