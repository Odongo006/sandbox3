import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
  Order_ID: { type: String, required: true },
  MerchantRequestID: String,
  CheckoutRequestID: String,
  ResultCode: Number,
  ResultDesc: String,
  MpesaReceiptNumber: String,
  TransactionDate: String,
  PhoneNumber: String,
  Amount: String,
}, { timestamps: true });

const Transaction = mongoose.model("Transaction", transactionSchema);

// ✅ This line is critical for ES Modules
export default Transaction;
