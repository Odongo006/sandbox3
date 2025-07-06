import request from "request";
import 'dotenv/config';
import { getTimestamp } from "../Utils/utils.timestamp.js";
import ngrok from 'ngrok';

// @desc initiate stk push
// @method POST
// @route /stkPush
// @access public
export const initiateSTKPush = async (req, res) => {
    try {
        const { amount, phone, Order_ID } = req.body;
        const url = "https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest";
        const auth = "Bearer " + req.safaricom_access_token;

        const timestamp = getTimestamp();
        const password = Buffer.from(
            process.env.BUSINESS_SHORT_CODE + process.env.PASS_KEY + timestamp
        ).toString('base64');

        // Create callback URL using env NGROK_URL (recommended over ngrok.connect each time)
        const callback_url = ${process.env.NGROK_URL}/api/stkPushCallback/${Order_ID};

        console.log("Callback URL:", callback_url);

        request(
            {
                url: url,
                method: "POST",
                headers: {
                    Authorization: auth,
                },
                json: {
                    BusinessShortCode: process.env.BUSINESS_SHORT_CODE,
                    Password: password,
                    Timestamp: timestamp,
                    TransactionType: "CustomerBuyGoodsOnline",
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
                    console.error("STK Push Error:", err);
                    return res.status(503).json({
                        message: "Error with the STK Push",
                        error: err.message,
                    });
                }
                res.status(200).json(body);
            }
        );
    } catch (err) {
        console.error("Unhandled STK Push Error:", err);
        res.status(500).json({
            message: "Server error during STK Push",
            error: err.message,
        });
    }
};

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

        res.json({ success: true });
    } catch (err) {
        console.error("Callback Handling Error:", err);
        res.status(500).json({
            message: "Failed to process callback",
            error: err.message,
        });
    }
};

export const confirmPayment = async (req, res) => {
    try {
        const url = " https://api.safaricom.co.ke/mpesa/stkpushquery/v1/query";
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
                    CheckoutRequestID: req.params.CheckoutRequestID,
                },
            },
            (err, response, body) => {
                if (err) {
                    console.error("Confirm Payment Error:", err);
                    return res.status(503).json({
                        message: "Error confirming payment",
                        error: err.message,
                    });
                }
                res.status(200).json(body);
            }
        );
    } catch (err) {
        console.error("Unhandled Confirm Payment Error:", err);
        res.status(500).json({
            message: "Server error during payment confirmation",
            error: err.message,
        });
    }
};
