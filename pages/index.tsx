import { useEffect, useState, useRef } from "react";

interface PrivacyData {
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
  fingerprint: {
    browser: string;
    os: string;
    screen: string;
    timezone: string;
    fonts: number;
  };
  cookies: number;
  localStorage: number;
}

export default function Home() {
  const [data, setData] = useState<PrivacyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState("Scanning...");
  const [showEmailPopup, setShowEmailPopup] = useState(false);
  const [popupDismissed, setPopupDismissed] = useState(false);
  const [email, setEmail] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/lookup");
        const result: PrivacyData = await response.json();

        // Get browser fingerprint
        const browser = navigator.userAgent.match(
          /(chrome|safari|firefox|edge)\/?\s*([\d.]*)/i
        );
        const os = navigator.userAgent.match(
          /(windows|mac|linux|android|iphone)/i
        );

        const testFonts = [
          "Arial",
          "Times New Roman",
          "Courier New",
          "Georgia",
          "Verdana",
        ];
        let fontCount = 0;

        for (const font of testFonts) {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          if (!ctx) continue;

          ctx.font = `72px ${font}, sans-serif`;
          const testWidth = ctx.measureText("mmmmmmmmmmlli").width;

          ctx.font = "72px sans-serif";
          const baseWidth = ctx.measureText("mmmmmmmmmmlli").width;

          if (testWidth !== baseWidth) fontCount++;
        }

        result.fingerprint = {
          browser: browser ? `${browser[1]} ${browser[2]}` : "Unknown",
          os: os ? os[1] : "Unknown",
          screen: `${screen.width}x${screen.height}`,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          fonts: fontCount,
        };

        result.cookies = document.cookie.split(";").length;
        try {
          result.localStorage = localStorage.length;
        } catch {
          result.localStorage = 0;
        }

        setData(result);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Draw animated map background
  useEffect(() => {
    if (!canvasRef.current || !data?.geolocation) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let animationFrame: number;
    let time = 0;

    const toCanvasCoords = (lat: number, lng: number) => {
      const x = ((lng + 180) / 360) * canvas.width;
      const y =
        ((90 - lat) / 180) *
        canvas.height;
      return { x, y };
    };

    const drawMap = () => {
      // Dark background
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw simplified world map coastlines
      ctx.strokeStyle = "rgba(0, 150, 100, 0.4)";
      ctx.lineWidth = 1;
      
      // Major continents/coastlines (simplified)
      const coastlines = [
        // North America
        { lat: 49, lng: -95 },
        { lat: 45, lng: -75 },
        { lat: 40, lng: -75 },
        { lat: 35, lng: -81 },
        { lat: 30, lng: -85 },
        { lat: 25, lng: -80 },
        { lat: 25, lng: -97 },
        { lat: 30, lng: -97 },
        { lat: 35, lng: -100 },
        { lat: 40, lng: -105 },
        { lat: 45, lng: -110 },
        { lat: 49, lng: -125 },
        
        // South America
        { lat: 12, lng: -75 },
        { lat: 5, lng: -60 },
        { lat: 0, lng: -55 },
        { lat: -10, lng: -50 },
        { lat: -25, lng: -50 },
        { lat: -35, lng: -57 },
        
        // Europe
        { lat: 60, lng: 25 },
        { lat: 55, lng: 35 },
        { lat: 50, lng: 30 },
        { lat: 48, lng: 5 },
        { lat: 43, lng: 0 },
        { lat: 40, lng: 10 },
        
        // Africa
        { lat: 35, lng: 10 },
        { lat: 30, lng: 35 },
        { lat: 20, lng: 40 },
        { lat: 0, lng: 35 },
        { lat: -10, lng: 35 },
        { lat: -25, lng: 30 },
        { lat: -35, lng: 20 },
        
        // Asia
        { lat: 55, lng: 60 },
        { lat: 50, lng: 90 },
        { lat: 45, lng: 120 },
        { lat: 35, lng: 140 },
        { lat: 25, lng: 120 },
        { lat: 15, lng: 100 },
        { lat: 5, lng: 95 },
        
        // Australia
        { lat: -12, lng: 130 },
        { lat: -25, lng: 135 },
        { lat: -35, lng: 150 },
      ];

      for (let i = 0; i < coastlines.length; i++) {
        const current = coastlines[i];
        const pos = toCanvasCoords(current.lat, current.lng);
        
        if (i === 0) {
          ctx.beginPath();
          ctx.moveTo(pos.x, pos.y);
        } else {
          ctx.lineTo(pos.x, pos.y);
        }
      }
      ctx.stroke();

      // Draw country borders (latitude/longitude lines that form rough borders)
      ctx.strokeStyle = "rgba(0, 100, 80, 0.25)";
      ctx.lineWidth = 0.5;
      
      // Horizontal latitude lines
      for (let lat = -90; lat <= 90; lat += 30) {
        ctx.beginPath();
        const startPos = toCanvasCoords(lat, -180);
        const endPos = toCanvasCoords(lat, 180);
        ctx.moveTo(startPos.x, startPos.y);
        ctx.lineTo(endPos.x, endPos.y);
        ctx.stroke();
      }
      
      // Vertical longitude lines
      for (let lng = -180; lng <= 180; lng += 30) {
        ctx.beginPath();
        const startPos = toCanvasCoords(90, lng);
        const endPos = toCanvasCoords(-90, lng);
        ctx.moveTo(startPos.x, startPos.y);
        ctx.lineTo(endPos.x, endPos.y);
        ctx.stroke();
      }

      // Grid overlay
      ctx.strokeStyle = "rgba(0, 200, 100, 0.03)";
      ctx.lineWidth = 1;
      for (let i = 0; i < canvas.width; i += 50) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
      }
      for (let i = 0; i < canvas.height; i += 50) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(canvas.width, i);
        ctx.stroke();
      }

      // Animated network lines
      ctx.strokeStyle = "rgba(0, 255, 150, 0.15)";
      ctx.lineWidth = 1;
      for (let i = 0; i < 5; i++) {
        const offset = (time * 0.3 + i * 80) % canvas.width;
        ctx.beginPath();
        ctx.moveTo(offset - 100, 0);
        ctx.quadraticCurveTo(
          offset,
          canvas.height / 2,
          offset - 100,
          canvas.height
        );
        ctx.stroke();
      }

      const userPos = toCanvasCoords(
        data.geolocation!.latitude,
        data.geolocation!.longitude
      );

      // Add light pollution effect around user
      const gradient = ctx.createRadialGradient(
        userPos.x,
        userPos.y,
        0,
        userPos.x,
        userPos.y,
        200
      );
      gradient.addColorStop(0, "rgba(0, 255, 150, 0.4)");
      gradient.addColorStop(0.5, "rgba(0, 200, 100, 0.15)");
      gradient.addColorStop(1, "rgba(0, 0, 0, 0)");

      ctx.fillStyle = gradient;
      ctx.fillRect(userPos.x - 200, userPos.y - 200, 400, 400);

      // Add some random city lights around the map
      ctx.fillStyle = "rgba(255, 150, 0, 0.6)";
      const cities = [
        { lat: 40.7128, lng: -74.006, size: 8 },
        { lat: 51.5074, lng: -0.1278, size: 7 },
        { lat: 35.6762, lng: 139.6503, size: 8 },
        { lat: 48.8566, lng: 2.3522, size: 6 },
        { lat: -33.8688, lng: 151.2093, size: 6 },
      ];

      for (const city of cities) {
        const pos = toCanvasCoords(city.lat, city.lng);
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, city.size, 0, Math.PI * 2);
        ctx.fill();

        // Glow effect
        const cityGradient = ctx.createRadialGradient(
          pos.x,
          pos.y,
          0,
          pos.x,
          pos.y,
          city.size * 3
        );
        cityGradient.addColorStop(0, "rgba(255, 150, 0, 0.4)");
        cityGradient.addColorStop(1, "rgba(255, 150, 0, 0)");
        ctx.fillStyle = cityGradient;
        ctx.fillRect(pos.x - city.size * 3, pos.y - city.size * 3, city.size * 6, city.size * 6);
      }

      // User pin with pulsing glow
      const pulseSize = 4 + Math.sin(time * 0.02) * 2;
      ctx.fillStyle = "rgba(0, 255, 150, 1)";
      ctx.beginPath();
      ctx.arc(userPos.x, userPos.y, pulseSize, 0, Math.PI * 2);
      ctx.fill();

      // Outer glow
      ctx.strokeStyle = "rgba(0, 255, 150, 0.8)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(userPos.x, userPos.y, pulseSize + 8, 0, Math.PI * 2);
      ctx.stroke();

      // Scan lines effect
      ctx.strokeStyle = "rgba(0, 255, 150, 0.1)";
      ctx.lineWidth = 1;
      const scanOffset = (time * 2) % canvas.height;
      ctx.beginPath();
      ctx.moveTo(0, scanOffset);
      ctx.lineTo(canvas.width, scanOffset);
      ctx.stroke();

      time++;
      animationFrame = requestAnimationFrame(drawMap);
    };

    drawMap();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);
    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", handleResize);
    };
  }, [data]);

  // Cycle greeting
  useEffect(() => {
    if (!data) return;

    const greetings = [
      `Hello, ${data.geolocation?.city || "there"}`,
      `We found you in ${data.geolocation?.country}`,
      `Your ISP is ${data.geolocation?.isp || "unknown"}`,
      `Your IP: ${data.ip}`,
    ];

    let index = 0;
    setGreeting(greetings[0]);

    const interval = setInterval(() => {
      index = (index + 1) % greetings.length;
      setGreeting(greetings[index]);
    }, 3000);

    return () => clearInterval(interval);
  }, [data]);

  // Scroll tracking for email popup
  useEffect(() => {
    const handleScroll = () => {
      const container = containerRef.current;
      if (!container) return;

      const scrollHeight =
        container.scrollHeight - window.innerHeight;
      const scrolled = window.scrollY;
      const progress = scrollHeight > 0 ? scrolled / scrollHeight : 0;

      if (progress > 0.5 && !showEmailPopup && !popupDismissed) {
        setShowEmailPopup(true);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [showEmailPopup, popupDismissed]);

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Email captured: ${email}`);
    setShowEmailPopup(false);
    setPopupDismissed(true);
  };

  const handleClosePopup = () => {
    setShowEmailPopup(false);
    setPopupDismissed(true);
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <canvas ref={canvasRef} style={styles.canvas} />
        <div style={styles.loadingScreen}>
          <div style={styles.loadingDot} />
          <p>Discovering your digital footprint...</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} style={styles.container}>
      <canvas ref={canvasRef} style={styles.canvas} />

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        .fadeIn { animation: fadeIn 0.8s ease-out; }
        .slideUp { animation: slideUp 0.6s ease-out; }
        .pulse { animation: pulse 2s ease-in-out infinite; }
      `}</style>

      {/* Hero Section */}
      <section style={styles.hero}>
        <h1 style={styles.greeting} className="fadeIn">
          {greeting}
        </h1>
        <p style={styles.subheading}>
          Your position is marked. Your privacy is exposed.
        </p>
      </section>

      {/* Spacing */}
      <section style={styles.spacer} />

      {/* IP Location Section */}
      <section style={styles.section} className="slideUp">
        <div style={styles.sectionContent}>
          <div style={styles.sectionLabel}>EXPOSURE #1</div>
          <h2 style={styles.sectionTitle}>You're Geolocated</h2>
          <p style={styles.sectionDescription}>
            Your coordinates are broadcast to every website you visit.
          </p>
          
          <div style={styles.card}>
            <div style={styles.dataPoint}>
              <span style={styles.label}>IP Address</span>
              <span style={styles.value}>{data?.ip}</span>
            </div>
            <div style={styles.dataPoint}>
              <span style={styles.label}>Location</span>
              <span style={styles.value}>
                {data?.geolocation?.city}, {data?.geolocation?.country}
              </span>
            </div>
            <div style={styles.dataPoint}>
              <span style={styles.label}>Exact Coordinates</span>
              <span style={styles.value}>
                {data?.geolocation?.latitude.toFixed(4)}, {data?.geolocation?.longitude.toFixed(4)}
              </span>
            </div>
            <div style={styles.dataPoint}>
              <span style={styles.label}>Internet Provider</span>
              <span style={styles.value}>{data?.geolocation?.isp}</span>
            </div>
            <div style={styles.dataPoint}>
              <span style={styles.label}>Organization</span>
              <span style={styles.value}>{data?.geolocation?.org || "Unknown"}</span>
            </div>
          </div>

          <div style={styles.warning}>
            ⚠️ Your ISP tracks every site you visit. WebRTC leaks your real IP even behind a VPN.
          </div>
        </div>
      </section>

      {/* Spacing */}
      <section style={styles.spacer} />

      {/* Browser Fingerprint Section */}
      <section style={styles.section} className="slideUp">
        <div style={styles.sectionContent}>
          <div style={styles.sectionLabel}>EXPOSURE #2</div>
          <h2 style={styles.sectionTitle}>You're Uniquely Identifiable</h2>
          <p style={styles.sectionDescription}>
            This combination of traits is 1 in millions across the internet.
          </p>
          
          <div style={styles.card}>
            <div style={styles.dataPoint}>
              <span style={styles.label}>Browser</span>
              <span style={styles.value}>{data?.fingerprint.browser}</span>
            </div>
            <div style={styles.dataPoint}>
              <span style={styles.label}>Operating System</span>
              <span style={styles.value}>{data?.fingerprint.os}</span>
            </div>
            <div style={styles.dataPoint}>
              <span style={styles.label}>Screen Resolution</span>
              <span style={styles.value}>{data?.fingerprint.screen}</span>
            </div>
            <div style={styles.dataPoint}>
              <span style={styles.label}>Timezone</span>
              <span style={styles.value}>{data?.fingerprint.timezone}</span>
            </div>
            <div style={styles.dataPoint}>
              <span style={styles.label}>System Fonts</span>
              <span style={styles.value}>{data?.fingerprint.fonts} fonts detected</span>
            </div>
          </div>

          <div style={styles.warning}>
            ⚠️ 1 in 10 million browsers match your fingerprint. You're permanently tracked.
          </div>
        </div>
      </section>

      {/* Spacing */}
      <section style={styles.spacer} />

      {/* Stored Data Section */}
      <section style={styles.section} className="slideUp">
        <div style={styles.sectionContent}>
          <div style={styles.sectionLabel}>EXPOSURE #3</div>
          <h2 style={styles.sectionTitle}>Your Data is Harvested</h2>
          <p style={styles.sectionDescription}>
            Websites store persistent tracking tokens. You can't delete them.
          </p>
          
          <div style={styles.card}>
            <div style={styles.dataPoint}>
              <span style={styles.label}>Cookies Stored</span>
              <span style={styles.value}>{data?.cookies}</span>
            </div>
            <div style={styles.dataPoint}>
              <span style={styles.label}>Local Storage Items</span>
              <span style={styles.value}>{data?.localStorage}</span>
            </div>
          </div>

          <div style={styles.warning}>
            ⚠️ These tracking IDs follow you everywhere. They build a complete behavioral profile.
          </div>
        </div>
      </section>

      {/* Spacing */}
      <section style={styles.spacer} />

      {/* The Real Problem */}
      <section style={styles.section} className="slideUp">
        <div style={styles.sectionContent}>
          <div style={styles.sectionLabel}>THE THREAT</div>
          <h2 style={styles.sectionTitle}>What Happens to Your Data</h2>
          
          <div style={styles.problemGrid}>
            <div style={styles.problemCard}>
              <div style={styles.problemIcon}>📊</div>
              <div style={styles.problemTitle}>Sold to Brokers</div>
              <p>Your profile is worth money. Data brokers sell it to anyone with cash.</p>
            </div>
            
            <div style={styles.problemCard}>
              <div style={styles.problemIcon}>👁️</div>
              <div style={styles.problemTitle}>Constant Tracking</div>
              <p>Ad networks track you across 10,000+ sites simultaneously.</p>
            </div>
            
            <div style={styles.problemCard}>
              <div style={styles.problemIcon}>🚨</div>
              <div style={styles.problemTitle}>Real IP Exposed</div>
              <p>VPN doesn't help. WebRTC leaks your actual location.</p>
            </div>
            
            <div style={styles.problemCard}>
              <div style={styles.problemIcon}>⚡</div>
              <div style={styles.problemTitle}>No Legal Protection</div>
              <p>Most countries don't protect you. It's legal to collect and sell your data.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Spacing */}
      <section style={styles.spacer} />

      {/* Email Popup */}
      {showEmailPopup && (
        <div style={styles.popupOverlay}>
          <div style={styles.popup} className="slideUp">
            <h3 style={styles.popupTitle}>Get Your Full Privacy Report</h3>
            <p style={styles.popupText}>
              See exactly what's exposed and get a personalized action plan.
            </p>
            <form onSubmit={handleEmailSubmit} style={styles.form}>
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={styles.input}
              />
              <button type="submit" style={styles.submitButton}>
                Get Report →
              </button>
            </form>
            <button
              onClick={handleClosePopup}
              style={styles.closeButton}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Spacing */}
      <section style={styles.spacer} />

      {/* CTA Section */}
      <section style={styles.ctaSection} className="slideUp">
        <div style={styles.ctaContent}>
          <h2 style={styles.ctaTitle}>Reclaim Your Privacy</h2>
          <p style={styles.ctaText}>
            Real solutions to take back control. Stop being tracked. Stop being sold.
          </p>
          <button style={styles.ctaButton}>See How We Fix This →</button>
        </div>
      </section>

      {/* Footer */}
      <footer style={styles.footer}>
        <p>Your privacy is a right. Let's protect it together.</p>
      </footer>
    </div>
  );
}

const styles = {
  container: {
    background: "#000000",
    minHeight: "100vh",
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
    color: "#e0e0e0",
    overflow: "hidden",
    position: "relative" as const,
  } as React.CSSProperties,

  canvas: {
    position: "fixed" as const,
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    zIndex: 0,
  } as React.CSSProperties,

  loadingScreen: {
    position: "relative" as const,
    zIndex: 1,
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    gap: "20px",
  } as React.CSSProperties,

  loadingDot: {
    width: "12px",
    height: "12px",
    borderRadius: "50%",
    backgroundColor: "#00ff96",
    animation: "pulse 2s ease-in-out infinite",
  } as React.CSSProperties,

  hero: {
    position: "relative" as const,
    zIndex: 1,
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center" as const,
    padding: "40px 20px",
  } as React.CSSProperties,

  greeting: {
    fontSize: "72px",
    fontWeight: "700",
    margin: "0 0 20px",
    maxWidth: "900px",
    lineHeight: "1.1",
    color: "#00ff96",
    textShadow: "0 0 20px rgba(0, 255, 150, 0.5)",
  } as React.CSSProperties,

  subheading: {
    fontSize: "24px",
    color: "#888",
    margin: "0",
    maxWidth: "700px",
    fontWeight: "400",
    lineHeight: "1.4",
  } as React.CSSProperties,

  spacer: {
    position: "relative" as const,
    zIndex: 1,
    height: "80px",
  } as React.CSSProperties,

  section: {
    position: "relative" as const,
    zIndex: 1,
    padding: "120px 40px",
    maxWidth: "1000px",
    margin: "0 auto",
    background: "rgba(0, 0, 0, 0.4)",
    backdropFilter: "blur(5px)",
  } as React.CSSProperties,

  sectionContent: {
    maxWidth: "700px",
  } as React.CSSProperties,

  sectionLabel: {
    fontSize: "12px",
    color: "#00ff96",
    fontWeight: "700",
    marginBottom: "12px",
    textTransform: "uppercase" as const,
    letterSpacing: "2px",
  } as React.CSSProperties,

  sectionTitle: {
    fontSize: "52px",
    fontWeight: "700",
    margin: "0 0 16px",
    color: "#ffffff",
    lineHeight: "1.1",
  } as React.CSSProperties,

  sectionDescription: {
    fontSize: "18px",
    color: "#aaa",
    lineHeight: "1.6",
    margin: "0 0 32px",
  } as React.CSSProperties,

  card: {
    background: "rgba(0, 255, 150, 0.05)",
    border: "1px solid rgba(0, 255, 150, 0.25)",
    borderRadius: "12px",
    padding: "32px",
    marginBottom: "24px",
    backdropFilter: "blur(10px)",
  } as React.CSSProperties,

  dataPoint: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 0",
    borderBottom: "1px solid rgba(0, 255, 150, 0.1)",
  } as React.CSSProperties,

  label: {
    fontSize: "14px",
    color: "#888",
    fontWeight: "500",
  } as React.CSSProperties,

  value: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#00ff96",
    fontFamily: "monospace",
    textAlign: "right" as const,
  } as React.CSSProperties,

  warning: {
    background: "rgba(255, 100, 100, 0.1)",
    border: "1px solid rgba(255, 100, 100, 0.3)",
    borderRadius: "8px",
    padding: "16px",
    fontSize: "14px",
    color: "#ff9999",
    lineHeight: "1.6",
  } as React.CSSProperties,

  problemGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "20px",
    marginTop: "40px",
  } as React.CSSProperties,

  problemCard: {
    background: "rgba(0, 255, 150, 0.05)",
    border: "1px solid rgba(0, 255, 150, 0.2)",
    borderRadius: "12px",
    padding: "24px",
    backdropFilter: "blur(10px)",
  } as React.CSSProperties,

  problemIcon: {
    fontSize: "32px",
    marginBottom: "12px",
  } as React.CSSProperties,

  problemTitle: {
    fontSize: "16px",
    fontWeight: "700",
    margin: "0 0 8px",
    color: "#ffffff",
  } as React.CSSProperties,

  popupOverlay: {
    position: "fixed" as const,
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    background: "rgba(0, 0, 0, 0.8)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10000,
  } as React.CSSProperties,

  popup: {
    background: "#0a0a15",
    borderRadius: "16px",
    padding: "40px",
    maxWidth: "420px",
    width: "90%",
    boxShadow: "0 0 40px rgba(0, 255, 150, 0.3)",
    position: "relative" as const,
    border: "1px solid rgba(0, 255, 150, 0.3)",
  } as React.CSSProperties,

  popupTitle: {
    fontSize: "28px",
    fontWeight: "700",
    margin: "0 0 12px",
    color: "#00ff96",
  } as React.CSSProperties,

  popupText: {
    fontSize: "16px",
    color: "#aaa",
    margin: "0 0 24px",
    lineHeight: "1.5",
  } as React.CSSProperties,

  form: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "12px",
  } as React.CSSProperties,

  input: {
    padding: "12px 16px",
    borderRadius: "8px",
    border: "1px solid rgba(0, 255, 150, 0.4)",
    fontSize: "14px",
    fontFamily: "inherit",
    background: "rgba(0, 255, 150, 0.03)",
    color: "#ffffff",
  } as React.CSSProperties,

  submitButton: {
    padding: "14px 20px",
    background: "linear-gradient(45deg, #00ff96, #00cc77)",
    color: "#000",
    border: "none",
    borderRadius: "8px",
    fontSize: "16px",
    fontWeight: "700",
    cursor: "pointer",
    transition: "transform 0.2s",
  } as React.CSSProperties,

  closeButton: {
    position: "absolute" as const,
    top: "16px",
    right: "16px",
    background: "none",
    border: "none",
    fontSize: "24px",
    cursor: "pointer",
    color: "#666",
  } as React.CSSProperties,

  ctaSection: {
    position: "relative" as const,
    zIndex: 1,
    padding: "120px 40px",
    textAlign: "center" as const,
    background: "rgba(0, 0, 0, 0.4)",
    backdropFilter: "blur(5px)",
  } as React.CSSProperties,

  ctaContent: {
    maxWidth: "700px",
    margin: "0 auto",
  } as React.CSSProperties,

  ctaTitle: {
    fontSize: "56px",
    fontWeight: "700",
    margin: "0 0 20px",
    color: "#00ff96",
  } as React.CSSProperties,

  ctaText: {
    fontSize: "20px",
    margin: "0 0 40px",
    color: "#aaa",
    lineHeight: "1.6",
  } as React.CSSProperties,

  ctaButton: {
    padding: "18px 48px",
    background: "linear-gradient(45deg, #00ff96, #00cc77)",
    color: "#000",
    border: "none",
    borderRadius: "8px",
    fontSize: "18px",
    fontWeight: "700",
    cursor: "pointer",
    transition: "transform 0.2s",
  } as React.CSSProperties,

  footer: {
    position: "relative" as const,
    zIndex: 1,
    padding: "40px",
    textAlign: "center" as const,
    fontSize: "14px",
    color: "#666",
    borderTop: "1px solid rgba(0, 255, 150, 0.1)",
  } as React.CSSProperties,
};
