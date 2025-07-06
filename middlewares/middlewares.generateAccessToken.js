import request from "request";
import 'dotenv/config';

export const accessToken = (req, res, next) => {
    const url = "https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials";
    const auth = Buffer.from(
        `${process.env.SAFARICOM_CONSUMER_KEY.trim()}:${process.env.SAFARICOM_CONSUMER_SECRET.trim()}`
    ).toString('base64');

    console.log("Requesting Access Token from Safaricom...");

    request(
        {
            url,
            method: "GET",
            headers: {
                "Authorization": `Basic ${auth}`,
            },
        },
        (error, response, body) => {
            if (error) {
                console.error("🔴 Token request failed:", error);
                return res.status(500).json({
                    message: "Failed to request token",
                    error: error.message,
                });
            }

            // Handle non-200 responses from Safaricom
            if (response.statusCode !== 200) {
                console.error("🔴 Invalid response from Safaricom:", response.statusCode, body);
                return res.status(response.statusCode).json({
                    message: "Safaricom token endpoint returned non-200",
                    response: body,
                });
            }

            try {
                const data = typeof body === 'string' ? JSON.parse(body) : body;

                if (!data.access_token) {
                    console.error("🔴 No access token found in response:", data);
                    return res.status(500).json({
                        message: "No access token in Safaricom response",
                    });
                }

                req.safaricom_access_token = data.access_token;
                console.log("🟢 Access Token received:", data.access_token);
                next();
            } catch (err) {
                console.error("🔴 Failed to parse Safaricom response:", body);
                return res.status(500).json({
                    message: "Error parsing Safaricom JSON response",
                    error: err.message,
                });
            }
        }
    );
};
