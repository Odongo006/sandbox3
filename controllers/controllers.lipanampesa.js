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

        const callback_url = `${process.env.NGROK_URL}/api/stkPushCallback/${Order_ID}`;
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
            (err, response, body) => {
                if (err) {
                    console.error("STK Push Error:", err);
                    return res.status(503).json({ message: "Error with the STK Push", error: err.message });
                }

                if (body.errorCode || body.ResponseCode !== "0") {
                    console.warn("Safaricom STK Push Failure:", body);
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
export const stkPushCallback = async (req, res) => {
  try {
    const { Order_ID } = req.params;
    const callback = req.body?.Body?.stkCallback;

    if (!callback) {
      console.error("Invalid callback payload received:", req.body);
      return res.status(400).json({ message: "Malformed callback payload" });
    }

    const {
      MerchantRequestID,
      CheckoutRequestID,
      ResultCode,
      ResultDesc,
      CallbackMetadata,
    } = callback;

    let PhoneNumber = 'N/A';
    let Amount = 'N/A';
    let MpesaReceiptNumber = 'N/A';
    let TransactionDate = 'N/A';

    if (CallbackMetadata?.Item) {
      const meta = Object.values(CallbackMetadata.Item);
      PhoneNumber = meta.find((o) => o.Name === 'PhoneNumber')?.Value?.toString() || 'N/A';
      Amount = meta.find((o) => o.Name === 'Amount')?.Value?.toString() || 'N/A';
      MpesaReceiptNumber = meta.find((o) => o.Name === 'MpesaReceiptNumber')?.Value?.toString() || 'N/A';
      TransactionDate = meta.find((o) => o.Name === 'TransactionDate')?.Value?.toString() || 'N/A';
    }

    // Map ResultCode into status
    const status = ResultCode === 0 ? "confirmed" : "failed";

    const transactionData = {
      Order_ID,
      MerchantRequestID,
      CheckoutRequestID,
      ResultCode,
      ResultDesc,
      PhoneNumber,
      Amount,
      MpesaReceiptNumber,
      TransactionDate,
      status,  // 👈 NEW FIELD
    };

    console.log("-".repeat(20), " CALLBACK OUTPUT ", "-".repeat(20));
    console.log(transactionData);

    // Save/update MongoDB transaction
    await Transaction.findOneAndUpdate(
      { CheckoutRequestID },
      transactionData,
      { upsert: true, new: true }
    );

    res.json({ success: true });
  } catch (err) {
    console.error("Callback Handling Error:", err);
    res.status(500).json({ message: "Failed to process callback", error: err.message });
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