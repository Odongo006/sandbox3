import request from "request";
import 'dotenv/config';

export const accessToken = (req, res, next) => {
    const url = "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials";
    const auth = Buffer.from(`${process.env.SAFARICOM_CONSUMER_KEY}:${process.env.SAFARICOM_CONSUMER_SECRET}`).toString('base64');

    request(
        {
            url,
            headers: {
                "Authorization": `Basic ${auth}`,
            },
        },
        (error, response, body) => {
            if (error) {
                console.error("Token request failed:", error);
                return res.status(500).json({
                    message: "Failed to request token",
                    error: error.message,
                });
            }

            if (!body) {
                console.error("Empty token response body");
                return res.status(500).json({
                    message: "Empty token response from Safaricom",
                });
            }

            try {
                const data = JSON.parse(body);
                if (!data.access_token) {
                    console.error("No access token found in response:", data);
                    return res.status(500).json({
                        message: "No access token in Safaricom response",
                    });
                }

                req.safaricom_access_token = data.access_token;
                next();
            } catch (err) {
                console.error("Error parsing Safaricom response:", body);
                return res.status(500).json({
                    message: "Error parsing JSON from Safaricom",
                    error: err.message,
                });
            }
        }
    );
};
