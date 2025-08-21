import request from "request";
import 'dotenv/config';
import { getTimestamp } from "../Utils/utils.timestamp.js";
import Transaction from "../models/Transaction.js";


// @desc initiate stk push
// @method POST
// @route /stkPush
// @access public
export const initiateSTKPush = async (req, res) => {
    try {
        const { amount, phone, Order_ID } = req.body;

        const normalizedPhone = phone.startsWith("0")
            ? "254" + phone.slice(1)
            : phone.startsWith("+254")
            ? phone.slice(1)
            : phone;

        const url = "https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest";
        const auth = "Bearer " + req.safaricom_access_token;
        const timestamp = getTimestamp();
        const password = Buffer.from(
            process.env.BUSINESS_SHORT_CODE + process.env.PASS_KEY + timestamp
        ).toString('base64');

        const callback_url = `${process.env.NGROK_URL}/api/stkPushCallback`;
        console.log("Callback URL:", callback_url);

        const payload = {
            BusinessShortCode: process.env.BUSINESS_SHORT_CODE,
            Password: password,
            Timestamp: timestamp,
            TransactionType: "CustomerBuyGoodsOnline",
            Amount: amount,
            PartyA: normalizedPhone,
            PartyB: process.env.TILL_NUMBER,
            PhoneNumber: normalizedPhone,
            CallBackURL: callback_url,
            AccountReference: "Scenius",
            TransactionDesc: "Paid online",
        };

request(
  {
    url,
    method: "POST",
    headers: { Authorization: auth },
    json: payload,
  },
  async (err, response, body) => {
    if (err) {
      console.error("STK Push Error:", err);
      return res.status(503).json({ message: "Error with the STK Push", error: err.message });
    }

    if (body.errorCode || body.ResponseCode !== "0") {
      console.warn("Safaricom STK Push Failure:", body);
    }

    // ✅ Save transaction immediately
    if (body.CheckoutRequestID) {
      await Transaction.create({
        Order_ID,
        MerchantRequestID: body.MerchantRequestID,
        CheckoutRequestID: body.CheckoutRequestID,
        Amount: amount,
        PhoneNumber: normalizedPhone
      });
    }

    res.status(200).json(body);
  }
);

    } catch (err) {
        console.error("Unhandled STK Push Error:", err);
        res.status(500).json({ message: "Server error during STK Push", error: err.message });
    }
};


// @desc handle stk callback
// @method POST
// @route /stkPushCallback/:Order_ID
// @access public
// controllers.lipanampesa.js
export const stkPushCallback = async (req, res) => {
  console.log("📩 STK Callback received!");
  console.log("Raw Callback Body:", JSON.stringify(req.body, null, 2));

  try {
    const callback = req.body.Body.stkCallback;
    console.log("✅ Parsed Callback:", callback);

    const {
      MerchantRequestID,
      CheckoutRequestID,
      ResultCode,
      ResultDesc,
      CallbackMetadata,
    } = callback;

    console.log("🔹 ResultCode:", ResultCode, " | ResultDesc:", ResultDesc);

    let MpesaReceiptNumber, TransactionDate, PhoneNumber, Amount;

    if (CallbackMetadata) {
      CallbackMetadata.Item.forEach((item) => {
        console.log("➡️ Metadata:", item);
        if (item.Name === "MpesaReceiptNumber") MpesaReceiptNumber = item.Value;
        if (item.Name === "TransactionDate") TransactionDate = item.Value;
        if (item.Name === "PhoneNumber") PhoneNumber = item.Value;
        if (item.Name === "Amount") Amount = item.Value;
      });
    }

    // Save or update in DB
    const Transaction = (await import("../models/Transaction.js")).default;

await Transaction.findOneAndUpdate(
  { CheckoutRequestID },
  {
    MerchantRequestID,
    CheckoutRequestID,
    ResultCode,
    ResultDesc,
    MpesaReceiptNumber,
    TransactionDate,
    PhoneNumber,
    Amount,
    status: ResultCode === 0 ? "confirmed" : "failed",   // ✅ status logic
  },
  { upsert: true, new: true }
);

    console.log("💾 Transaction saved/updated successfully!");

    res.json({ message: "Callback received successfully" });
  } catch (error) {
    console.error("❌ Error handling STK Callback:", error);
    res.status(500).json({ error: "Server error in stkPushCallback" });
  }
};



// @desc confirm payment status (query Safaricom directly)
// @method POST
// @route /confirmPayment/:CheckoutRequestID
// @access public
export const confirmPayment = async (req, res) => {
    try {
        const url = "https://api.safaricom.co.ke/mpesa/stkpushquery/v1/query";
        const auth = "Bearer " + req.safaricom_access_token;
        const timestamp = getTimestamp();
        const password = Buffer.from(
            process.env.BUSINESS_SHORT_CODE + process.env.PASS_KEY + timestamp
        ).toString('base64');

        request(
            {
                url,
                method: "POST",
                headers: { Authorization: auth },
                json: {
                    BusinessShortCode: process.env.BUSINESS_SHORT_CODE,
                    Password: password,
                    Timestamp: timestamp,
                    CheckoutRequestID: req.params.CheckoutRequestID,
                },
            },
            (err, response, body) => {
                if (err) {
                    console.error("Confirm Payment Error:", err);
                    return res.status(503).json({ message: "Error confirming payment", error: err.message });
                }

                res.status(200).json(body);
            }
        );
    } catch (err) {
        console.error("Unhandled Confirm Payment Error:", err);
        res.status(500).json({ message: "Server error during payment confirmation", error: err.message });
    }
};


// @desc get payment status from DB (for frontend polling)
// @method GET
// @route /payment-status/:CheckoutRequestID
// @access public
export const getPaymentStatus = async (req, res) => {
  try {
    const { CheckoutRequestID } = req.params;
    const tx = await Transaction.findOne({ CheckoutRequestID });

    if (!tx) {
      return res.json({ status: "pending" });
    }

    return res.json({
      status: tx.status,           // confirmed | failed | pending
      amount: tx.Amount,
      phone: tx.PhoneNumber,
      checkoutRequestID: tx.CheckoutRequestID,
    });
  } catch (err) {
    console.error("Payment status error:", err);
    res.status(500).json({ status: "error", error: err.message });
  }
};