import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
  Order_ID: { type: String, required: false },
  MerchantRequestID: String,
  CheckoutRequestID: String,
  ResultCode: Number,
  ResultDesc: String,
  MpesaReceiptNumber: String,
  TransactionDate: String,
  PhoneNumber: String,
  Amount: String,
  status: {
    type: String,
    enum: ["pending", "confirmed", "failed"],
    default: "pending",
  },
}, { timestamps: true });

const Transaction = mongoose.model("Transaction", transactionSchema);
export default Transaction;
