import request from "request";
import 'dotenv/config';
import { getTimestamp } from "../Utils/utils.timestamp.js";

// @desc Initiate STK Push
// @method POST
// @route /stkPush
// @access Public
export const initiateSTKPush = async (req, res) => {
    try {
        const { amount, phone, Order_ID } = req.body;

        if (!amount || !phone || !Order_ID) {
            return res.status(400).json({
                message: "Missing required fields: amount, phone, or Order_ID",
            });
        }

        const url = "https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest";
        const auth = "Bearer " + req.safaricom_access_token;
        const timestamp = getTimestamp();

        const password = Buffer.from(
            process.env.BUSINESS_SHORT_CODE + process.env.PASS_KEY + timestamp
        ).toString('base64');

        const callback_url = `${process.env.KOYEB_URL}/api/stkPushCallback/${Order_ID}`;
        console.log("🚀 Callback URL:", callback_url);
        console.log("🔑 Access Token:", req.safaricom_access_token);

        request(
            {
                url,
                method: "POST",
                headers: {
                    Authorization: auth,
                },
                json: {
                    BusinessShortCode: process.env.BUSINESS_SHORT_CODE,
                    Password: password,
                    Timestamp: timestamp,
                    TransactionType: "CustomerPayBillOnline", // recommended
                    Amount: amount,
                    PartyA: phone,
                    PartyB: process.env.TILL_NUMBER,
                    PhoneNumber: phone,
                    CallBackURL: callback_url,
                    AccountReference: "Scenius Solutions",
                    TransactionDesc: "Paid online",
                },
            },
            (err, response, body) => {
                if (err) {
                    console.error("❌ STK Push Error:", err);
                    return res.status(503).json({
                        message: "STK Push failed",
                        error: err.message,
                    });
                }

                console.log("✅ Safaricom STK Response Code:", response?.statusCode);
                console.log("📦 Safaricom STK Body:", body);
                res.status(response?.statusCode || 200).json(body);
            }
        );
    } catch (err) {
        console.error("🔥 STK Push Exception:", err);
        res.status(500).json({
            message: "Unhandled server error during STK Push",
            error: err.message,
        });
    }
};

// @desc STK Push Callback
// @method POST
// @route /stkPushCallback/:Order_ID
export const stkPushCallback = async (req, res) => {
    try {
        const { Order_ID } = req.params;
        const {
            MerchantRequestID,
            CheckoutRequestID,
            ResultCode,
            ResultDesc,
            CallbackMetadata,
        } = req.body.Body.stkCallback;

        const meta = Object.values(CallbackMetadata.Item);
        const PhoneNumber = meta.find((o) => o.Name === 'PhoneNumber')?.Value?.toString();
        const Amount = meta.find((o) => o.Name === 'Amount')?.Value?.toString();
        const MpesaReceiptNumber = meta.find((o) => o.Name === 'MpesaReceiptNumber')?.Value?.toString();
        const TransactionDate = meta.find((o) => o.Name === 'TransactionDate')?.Value?.toString();

        console.log("-".repeat(20), " CALLBACK OUTPUT ", "-".repeat(20));
        console.log({
            Order_ID,
            MerchantRequestID,
            CheckoutRequestID,
            ResultCode,
            ResultDesc,
            PhoneNumber,
            Amount,
            MpesaReceiptNumber,
            TransactionDate,
        });

        // Here you might want to save to DB or trigger notification

        res.status(200).json({ success: true });
    } catch (err) {
        console.error("❌ Callback Error:", err);
        res.status(500).json({
            message: "Failed to process callback",
            error: err.message,
        });
    }
};

// @desc Confirm STK Payment
// @method POST
// @route /confirmPayment/:CheckoutRequestID
export const confirmPayment = async (req, res) => {
    try {
        const { CheckoutRequestID } = req.params;

        if (!CheckoutRequestID) {
            return res.status(400).json({ message: "Missing CheckoutRequestID" });
        }

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
                headers: {
                    Authorization: auth,
                },
                json: {
                    BusinessShortCode: process.env.BUSINESS_SHORT_CODE,
                    Password: password,
                    Timestamp: timestamp,
                    CheckoutRequestID,
                },
            },
            (err, response, body) => {
                if (err) {
                    console.error("❌ Payment Confirmation Error:", err);
                    return res.status(503).json({
                        message: "Error confirming payment",
                        error: err.message,
                    });
                }

                console.log("📩 Payment Confirmation Response:", body);
                res.status(response?.statusCode || 200).json(body);
            }
        );
    } catch (err) {
        console.error("🔥 Confirm Payment Exception:", err);
        res.status(500).json({
            message: "Server error during payment confirmation",
            error: err.message,
        });
    }
};
