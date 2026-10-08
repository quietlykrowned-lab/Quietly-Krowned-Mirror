
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(503).json({
      error: "Anthropic API key is not configured in Vercel."
    });
  }

  try {
    const {
      system,
      messages,
      max_tokens = 1000
    } = req.body || {};

    if (!Array.isArray(messages) || !messages.length) {
      return res.status(400).json({
        error: "Messages required"
      });
    }

    const upstream = await fetch(
      "https://api.anthropic.com/v1/messages",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": process.env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify({
          model:
            process.env.ANTHROPIC_MODEL ||
            "claude-sonnet-4-20250514",
          max_tokens,
          ...(system ? { system } : {}),
          messages
        })
      }
    );

    const data = await upstream.json();

    if (!upstream.ok) {
      const safeTypes = [
        "authentication_error",
        "permission_error",
        "not_found_error",
        "invalid_request_error",
        "rate_limit_error",
        "overloaded_error",
        "api_error"
      ];

      const type = data?.error?.type;
      const safeType = safeTypes.includes(type)
        ? type
        : "provider_error";

      return res.status(upstream.status).json({
        error: "AI provider request failed",
        providerStatus: upstream.status,
        providerErrorType: safeType
      });
    }
    return res.status(200).json(data);
 
  } catch (error) {
    console.error("Mirror diagnostic:", {
      name: error?.name,
      message: error?.message,
      causeCode: error?.cause?.code,
      causeMessage: error?.cause?.message
    });

    return res.status(500).json({
      error: "Mirror server request failed",
      errorType: "server_exception"
    });
  }
}
