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
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showEmailPopup, setShowEmailPopup] = useState(false);
  const [popupDismissed, setPopupDismissed] = useState(false);
  const [email, setEmail] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

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

      setScrollProgress(progress);

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
        <div style={styles.loadingScreen}>
          <div style={styles.loadingDot} />
          <p>Discovering your digital footprint...</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} style={styles.container}>
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
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes particle {
          0% { opacity: 0; transform: translateY(0) scale(0); }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { opacity: 0; transform: translateY(-100px) scale(1); }
        }
        .fadeIn { animation: fadeIn 0.8s ease-out; }
        .slideUp { animation: slideUp 0.6s ease-out; }
        .pulse { animation: pulse 2s ease-in-out infinite; }
        .floating { animation: float 3s ease-in-out infinite; }
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 20px rgba(0, 200, 255, 0.3); }
          50% { box-shadow: 0 0 40px rgba(0, 200, 255, 0.6); }
        }
        .glow { animation: glow 3s ease-in-out infinite; }
      `}</style>

      {/* Animated Background */}
      <div style={styles.backgroundWrapper}>
        <svg style={styles.backgroundSVG} viewBox="0 0 1000 1000" preserveAspectRatio="none">
          <defs>
            <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0a0e27" />
              <stop offset="50%" stopColor="#1a1a3e" />
              <stop offset="100%" stopColor="#0f1a2e" />
            </linearGradient>
            <filter id="blur">
              <feGaussianBlur in="SourceGraphic" stdDeviation="3" />
            </filter>
          </defs>
          <rect width="1000" height="1000" fill="url(#grad1)" />
          <circle cx="100" cy="100" r="200" fill="#0099ff" opacity="0.05" filter="url(#blur)" />
          <circle cx="800" cy="800" r="300" fill="#ff006e" opacity="0.05" filter="url(#blur)" />
          <circle cx="500" cy="500" r="250" fill="#00d9ff" opacity="0.03" filter="url(#blur)" />
        </svg>
        <div style={styles.parallaxOverlay} />
      </div>

      {/* Hero Section */}
      <section style={styles.hero}>
        <h1 style={styles.greeting} className="fadeIn">
          {greeting}
        </h1>
        <p style={styles.subheading}>
          Your privacy is being exploited right now. See exactly how.
        </p>
      </section>

      {/* Spacing */}
      <section style={styles.spacer} />

      {/* IP Location Section */}
      <section style={styles.section} className="slideUp">
        <div style={styles.sectionContent}>
          <div style={styles.sectionLabel}>EXPOSED DATA #1</div>
          <h2 style={styles.sectionTitle}>Your Location is Tracked</h2>
          <p style={styles.sectionDescription}>
            Every website knows exactly where you are. Your ISP broadcasts it. Your device confirms it.
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
            ⚠️ Your ISP knows every website you visit. Even a VPN can't hide this through WebRTC leaks.
          </div>
        </div>
      </section>

      {/* Spacing */}
      <section style={styles.spacer} />

      {/* Browser Fingerprint Section */}
      <section style={styles.section} className="slideUp">
        <div style={styles.sectionContent}>
          <div style={styles.sectionLabel}>EXPOSED DATA #2</div>
          <h2 style={styles.sectionTitle}>You're Uniquely Identifiable</h2>
          <p style={styles.sectionDescription}>
            This combination of traits is almost unique to you across the entire internet.
          </p>
          
          <div style={styles.card}>
            <div style={styles.dataPoint}>
              <span style={styles.label}>Browser Signature</span>
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
              <span style={styles.label}>Installed System Fonts</span>
              <span style={styles.value}>{data?.fingerprint.fonts} fonts</span>
            </div>
          </div>

          <div style={styles.warning}>
            ⚠️ 1 in 10 million browsers have your exact fingerprint combination. You're permanently tracked.
          </div>
        </div>
      </section>

      {/* Spacing */}
      <section style={styles.spacer} />

      {/* Stored Data Section */}
      <section style={styles.section} className="slideUp">
        <div style={styles.sectionContent}>
          <div style={styles.sectionLabel}>EXPOSED DATA #3</div>
          <h2 style={styles.sectionTitle}>Your Data is Being Harvested</h2>
          <p style={styles.sectionDescription}>
            Websites store persistent tracking tokens on your device. They use these to build your profile.
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
            ⚠️ These tracking IDs follow you across the entire internet. They build a complete profile of your behavior.
          </div>
        </div>
      </section>

      {/* Spacing */}
      <section style={styles.spacer} />

      {/* The Real Problem */}
      <section style={styles.section} className="slideUp">
        <div style={styles.sectionContent}>
          <div style={styles.sectionLabel}>THE REALITY</div>
          <h2 style={styles.sectionTitle}>What This Means For You</h2>
          
          <div style={styles.problemGrid}>
            <div style={styles.problemCard}>
              <div style={styles.problemIcon}>📊</div>
              <div style={styles.problemTitle}>Your Profile is Sold</div>
              <p>Data brokers sell your information to advertisers, landlords, employers, and strangers.</p>
            </div>
            
            <div style={styles.problemCard}>
              <div style={styles.problemIcon}>👁️</div>
              <div style={styles.problemTitle}>Constant Surveillance</div>
              <p>Ad networks track you across 10,000+ websites simultaneously, building a complete profile.</p>
            </div>
            
            <div style={styles.problemCard}>
              <div style={styles.problemIcon}>🔓</div>
              <div style={styles.problemTitle}>VPN Doesn't Help</div>
              <p>Browser fingerprinting and WebRTC leaks expose your real IP even behind a VPN.</p>
            </div>
            
            <div style={styles.problemCard}>
              <div style={styles.problemIcon}>⚡</div>
              <div style={styles.problemTitle}>No Privacy Laws</div>
              <p>Most countries don't protect you. Companies can collect and sell your data legally.</p>
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
              See exactly what's exposed about you and get a personalized action plan.
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
          <h2 style={styles.ctaTitle}>We Can Fix This</h2>
          <p style={styles.ctaText}>
            Real solutions to take back control of your privacy, secure your data, and stop being tracked.
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
    background: "#0a0e27",
    minHeight: "100vh",
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
    color: "#e0e0e0",
    overflow: "hidden",
    position: "relative" as const,
  } as React.CSSProperties,

  backgroundWrapper: {
    position: "fixed" as const,
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    zIndex: 0,
    pointerEvents: "none",
  } as React.CSSProperties,

  backgroundSVG: {
    width: "100%",
    height: "100%",
  } as React.CSSProperties,

  parallaxOverlay: {
    position: "absolute" as const,
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    background:
      "radial-gradient(circle at 20% 50%, rgba(0, 200, 255, 0.1) 0%, transparent 50%)",
  } as React.CSSProperties,

  loadingScreen: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    gap: "20px",
    position: "relative" as const,
    zIndex: 1,
  } as React.CSSProperties,

  loadingDot: {
    width: "12px",
    height: "12px",
    borderRadius: "50%",
    backgroundColor: "#00d9ff",
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
    background: "linear-gradient(45deg, #00d9ff, #0099ff)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  } as React.CSSProperties,

  subheading: {
    fontSize: "24px",
    color: "#aaa",
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
  } as React.CSSProperties,

  sectionContent: {
    maxWidth: "700px",
  } as React.CSSProperties,

  sectionLabel: {
    fontSize: "12px",
    color: "#00d9ff",
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
    background: "rgba(255, 255, 255, 0.03)",
    border: "1px solid rgba(0, 217, 255, 0.2)",
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
    borderBottom: "1px solid rgba(0, 217, 255, 0.1)",
  } as React.CSSProperties,

  label: {
    fontSize: "14px",
    color: "#888",
    fontWeight: "500",
  } as React.CSSProperties,

  value: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#00d9ff",
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
    background: "rgba(255, 255, 255, 0.03)",
    border: "1px solid rgba(0, 217, 255, 0.15)",
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
    background: "rgba(0, 0, 0, 0.7)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10000,
  } as React.CSSProperties,

  popup: {
    background: "#1a1a2e",
    borderRadius: "16px",
    padding: "40px",
    maxWidth: "420px",
    width: "90%",
    boxShadow: "0 20px 60px rgba(0, 217, 255, 0.2)",
    position: "relative" as const,
    border: "1px solid rgba(0, 217, 255, 0.2)",
  } as React.CSSProperties,

  popupTitle: {
    fontSize: "28px",
    fontWeight: "700",
    margin: "0 0 12px",
    color: "#ffffff",
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
    border: "1px solid rgba(0, 217, 255, 0.3)",
    fontSize: "14px",
    fontFamily: "inherit",
    background: "rgba(255, 255, 255, 0.05)",
    color: "#ffffff",
  } as React.CSSProperties,

  submitButton: {
    padding: "14px 20px",
    background: "linear-gradient(45deg, #00d9ff, #0099ff)",
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
  } as React.CSSProperties,

  ctaContent: {
    maxWidth: "700px",
    margin: "0 auto",
  } as React.CSSProperties,

  ctaTitle: {
    fontSize: "56px",
    fontWeight: "700",
    margin: "0 0 20px",
    background: "linear-gradient(45deg, #00d9ff, #00ff88)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  } as React.CSSProperties,

  ctaText: {
    fontSize: "20px",
    margin: "0 0 40px",
    color: "#aaa",
    lineHeight: "1.6",
  } as React.CSSProperties,

  ctaButton: {
    padding: "18px 48px",
    background: "linear-gradient(45deg, #00d9ff, #0099ff)",
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
    borderTop: "1px solid rgba(0, 217, 255, 0.1)",
  } as React.CSSProperties,
};
