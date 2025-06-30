import request from "request";
import 'dotenv/config';

export const accessToken = (req, res, next) => {
    const url = "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials";
    const auth = Buffer.from(`${process.env.SAFARICOM_CONSUMER_KEY}:${process.env.SAFARICOM_CONSUMER_SECRET}`).toString('base64');

    request(
        {
            url: url,
            headers: {
                "Authorization": "Basic " + auth
            }
        },
        (error, response, body) => {
            if (error) {
                console.error("Access token request error:", error);
                return res.status(500).json({
                    message: "Something went wrong when trying to process your payment",
                    error: error.message
                });
            }

            try {
                if (!body) {
                    throw new Error("Empty response body from Safaricom OAuth");
                }

                const data = JSON.parse(body);

                if (!data.access_token) {
                    throw new Error("Access token not found in response");
                }

                req.safaricom_access_token = data.access_token;
                next();
            } catch (parseError) {
                console.error("Access token parsing error:", body);
                return res.status(500).json({
                    message: "Failed to parse access token response",
                    error: parseError.message
                });
            }
        }
    );
};
