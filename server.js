// server.js
import mongoose from "mongoose";
import "dotenv/config";
import app from "./app.js";
import Transaction from "./models/Transaction.js";
import { v2 as cloudinary } from "cloudinary";
// ✅ Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLIENT_NAME,
  api_key: process.env.CLOUDINARY_CLIENT_API,
  api_secret: process.env.CLOUDINARY_CLIENT_SECRET,
});


// ✅ MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB connected via Mongoose"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

// ✅ Optional Standalone Transaction Status Route
app.get("/api/transactions/checkout/:checkoutId", async (req, res) => {
  try {
    const txn = await Transaction.findOne({
      CheckoutRequestID: req.params.checkoutId,
    });

    if (!txn) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    res.json({ success: true, transaction: txn });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// ✅ Start Server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`🚀 App is running on http://localhost:${PORT}`);
});
