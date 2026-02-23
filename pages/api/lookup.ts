import type { NextApiRequest, NextApiResponse } from "next";

interface LookupResponse {
  ip: string;
  geolocation?: {
    city: string;
    country: string;
    latitude: number;
    longitude: number;
    timezone: string;
    isp: string;
    org: string;
  };
  whois?: {
    registrar: string;
    registrant: string;
  };
  error?: string;
}

// Simple in-memory rate limiting
const ipRequests = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const requests = ipRequests.get(ip) || [];
  const recentRequests = requests.filter((t) => now - t < 60000); // Last 60 seconds

  if (recentRequests.length >= 5) {
    return true;
  }

  recentRequests.push(now);
  ipRequests.set(ip, recentRequests);
  return false;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<LookupResponse>
) {
  // Get client IP
  const clientIP =
    (req.headers["x-forwarded-for"] as string)?.split(",")[0].trim() ||
    (req.headers["x-real-ip"] as string) ||
    req.socket.remoteAddress ||
    "unknown";

  if (isRateLimited(clientIP)) {
    return res.status(429).json({
      ip: clientIP,
      error: "Rate limited. Please try again later.",
    });
  }

  try {
    // Free geolocation API: ip-api.com
    const geoResponse = await fetch(`http://ip-api.com/json/${clientIP}?fields=status,country,city,lat,lon,timezone,isp,org`, {
      headers: { "User-Agent": "Privacy-Audit" },
    });

    let geoData = undefined;

    if (geoResponse.ok) {
      const data: any = await geoResponse.json();
      if (data.status === "success") {
        geoData = {
          city: data.city || "Unknown",
          country: data.country || "Unknown",
          latitude: data.lat || 0,
          longitude: data.lon || 0,
          timezone: data.timezone || "Unknown",
          isp: data.isp || "Unknown",
          org: data.org || "Unknown",
        };
      }
    }

    // WHOIS lookup using free service
    let whoisData = undefined;
    try {
      const whoisResponse = await fetch(
        `https://www.whois.com/api/json/${clientIP}`,
        { headers: { "User-Agent": "Privacy-Audit" } }
      );

      if (whoisResponse.ok) {
        const data: any = await whoisResponse.json();
        whoisData = {
          registrar: data.registrar || "Unknown",
          registrant: data.registrant || "Unknown",
        };
      }
    } catch {
      // WHOIS lookup failed, continue without it
    }

    res.status(200).json({
      ip: clientIP,
      geolocation: geoData,
      whois: whoisData,
    });
  } catch (error) {
    console.error("Lookup error:", error);
    res.status(500).json({
      ip: clientIP,
      error: "Failed to lookup IP information",
    });
  }
}
