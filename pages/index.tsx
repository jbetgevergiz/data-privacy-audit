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

      if (progress > 0.5 && !showEmailPopup) {
        setShowEmailPopup(true);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [showEmailPopup]);

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Email captured: ${email}`);
    setShowEmailPopup(false);
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
          Your privacy is being exposed right now. Here's how.
        </p>
      </section>

      {/* IP Location Section */}
      <section style={styles.section} className="slideUp">
        <h2 style={styles.sectionTitle}>Your Location is Exposed</h2>
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
            <span style={styles.label}>Coordinates</span>
            <span style={styles.value}>
              {data?.geolocation?.latitude.toFixed(4)},
              {data?.geolocation?.longitude.toFixed(4)}
            </span>
          </div>
          <div style={styles.dataPoint}>
            <span style={styles.label}>Internet Provider</span>
            <span style={styles.value}>{data?.geolocation?.isp}</span>
          </div>
        </div>
        <p style={styles.explanation}>
          Your ISP knows every site you visit. Websites know your exact location
          from your IP. Even a VPN can leak this data through WebRTC.
        </p>
      </section>

      {/* Browser Fingerprint Section */}
      <section style={styles.section} className="slideUp">
        <h2 style={styles.sectionTitle}>You're Uniquely Identifiable</h2>
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
            <span style={styles.label}>Installed Fonts</span>
            <span style={styles.value}>{data?.fingerprint.fonts}</span>
          </div>
        </div>
        <p style={styles.explanation}>
          This combination makes you 1 in millions of users. Websites use this
          to track you across the internet without cookies.
        </p>
      </section>

      {/* Stored Data Section */}
      <section style={styles.section} className="slideUp">
        <h2 style={styles.sectionTitle}>Your Data is Being Stored</h2>
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
        <p style={styles.explanation}>
          Websites store persistent IDs on your device. These tracking tokens
          build a complete profile of your behavior across the internet.
        </p>
      </section>

      {/* The Problem Section */}
      <section style={styles.section} className="slideUp">
        <h2 style={styles.sectionTitle}>The Problem</h2>
        <ul style={styles.list}>
          <li>Your ISP is selling your browsing data</li>
          <li>Ad networks track you across 1000s of websites</li>
          <li>Data brokers are selling your profile to strangers</li>
          <li>Your real IP is exposed even behind a VPN</li>
          <li>Browser fingerprinting works without cookies</li>
          <li>No privacy laws protect you in most countries</li>
        </ul>
      </section>

      {/* Email Popup */}
      {showEmailPopup && (
        <div style={styles.popupOverlay}>
          <div style={styles.popup} className="slideUp">
            <h3 style={styles.popupTitle}>Protect Your Privacy</h3>
            <p style={styles.popupText}>
              Get your full privacy report and see exactly what's exposed about
              you.
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
                Get Full Report
              </button>
            </form>
            <button
              onClick={() => setShowEmailPopup(false)}
              style={styles.closeButton}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* CTA Section */}
      <section style={styles.ctaSection} className="slideUp">
        <h2 style={styles.ctaTitle}>We Can Fix This</h2>
        <p style={styles.ctaText}>
          Real solutions to protect your privacy, secure your data, and take
          back control.
        </p>
        <button style={styles.ctaButton}>See How We Fix This</button>
      </section>

      {/* Footer */}
      <footer style={styles.footer}>
        <p>Your privacy matters. Let's protect it together.</p>
      </footer>
    </div>
  );
}

const styles = {
  container: {
    background: "#ffffff",
    minHeight: "100vh",
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
    color: "#1a1a1a",
    overflow: "hidden",
  } as React.CSSProperties,

  loadingScreen: {
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
    backgroundColor: "#0066ff",
    animation: "pulse 2s ease-in-out infinite",
  } as React.CSSProperties,

  hero: {
    height: "100vh",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center" as const,
    padding: "40px 20px",
    background: "linear-gradient(135deg, #f5f5f5 0%, #ffffff 100%)",
  } as React.CSSProperties,

  greeting: {
    fontSize: "64px",
    fontWeight: "700",
    margin: "0 0 20px",
    maxWidth: "800px",
    lineHeight: "1.2",
  } as React.CSSProperties,

  subheading: {
    fontSize: "20px",
    color: "#666",
    margin: "0",
    maxWidth: "600px",
    fontWeight: "400",
  } as React.CSSProperties,

  section: {
    padding: "100px 40px",
    maxWidth: "900px",
    margin: "0 auto",
  } as React.CSSProperties,

  sectionTitle: {
    fontSize: "42px",
    fontWeight: "700",
    margin: "0 0 40px",
    color: "#1a1a1a",
  } as React.CSSProperties,

  card: {
    background: "#f8f8f8",
    borderRadius: "12px",
    padding: "32px",
    marginBottom: "24px",
  } as React.CSSProperties,

  dataPoint: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 0",
    borderBottom: "1px solid #eee",
  } as React.CSSProperties,

  label: {
    fontSize: "14px",
    color: "#666",
    fontWeight: "500",
  } as React.CSSProperties,

  value: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#0066ff",
    fontFamily: "monospace",
  } as React.CSSProperties,

  explanation: {
    fontSize: "16px",
    color: "#666",
    lineHeight: "1.6",
    margin: "0",
    maxWidth: "600px",
  } as React.CSSProperties,

  list: {
    fontSize: "18px",
    color: "#1a1a1a",
    lineHeight: "2",
    paddingLeft: "20px",
    maxWidth: "600px",
  } as React.CSSProperties,

  popupOverlay: {
    position: "fixed" as const,
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    background: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  } as React.CSSProperties,

  popup: {
    background: "#ffffff",
    borderRadius: "16px",
    padding: "40px",
    maxWidth: "400px",
    width: "90%",
    boxShadow: "0 20px 60px rgba(0, 0, 0, 0.2)",
    position: "relative" as const,
  } as React.CSSProperties,

  popupTitle: {
    fontSize: "28px",
    fontWeight: "700",
    margin: "0 0 12px",
  } as React.CSSProperties,

  popupText: {
    fontSize: "16px",
    color: "#666",
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
    border: "1px solid #ddd",
    fontSize: "14px",
    fontFamily: "inherit",
  } as React.CSSProperties,

  submitButton: {
    padding: "14px 20px",
    background: "#0066ff",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "background 0.2s",
  } as React.CSSProperties,

  closeButton: {
    position: "absolute" as const,
    top: "16px",
    right: "16px",
    background: "none",
    border: "none",
    fontSize: "24px",
    cursor: "pointer",
    color: "#999",
  } as React.CSSProperties,

  ctaSection: {
    padding: "100px 40px",
    textAlign: "center" as const,
    background: "#0066ff",
    color: "#ffffff",
  } as React.CSSProperties,

  ctaTitle: {
    fontSize: "48px",
    fontWeight: "700",
    margin: "0 0 20px",
  } as React.CSSProperties,

  ctaText: {
    fontSize: "20px",
    margin: "0 0 40px",
    maxWidth: "600px",
    marginLeft: "auto",
    marginRight: "auto",
    opacity: 0.9,
  } as React.CSSProperties,

  ctaButton: {
    padding: "16px 48px",
    background: "#ffffff",
    color: "#0066ff",
    border: "none",
    borderRadius: "8px",
    fontSize: "18px",
    fontWeight: "700",
    cursor: "pointer",
    transition: "transform 0.2s",
  } as React.CSSProperties,

  footer: {
    padding: "40px",
    textAlign: "center" as const,
    fontSize: "14px",
    color: "#999",
    borderTop: "1px solid #eee",
  } as React.CSSProperties,
};
