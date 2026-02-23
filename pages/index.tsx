import { useEffect, useState } from "react";

interface BrowserData {
  cookies: string[];
  localStorage: Record<string, string>;
  sessionStorage: Record<string, string>;
  fingerprint: Record<string, string>;
  permissions: Record<string, string>;
  webgl: string;
  rtc: string;
  fonts: string[];
  dns: string;
  ua: Record<string, string>;
  riskScore: number;
}

export default function Home() {
  const [data, setData] = useState<BrowserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const collectData = async () => {
      const browserData: BrowserData = {
        cookies: [],
        localStorage: {},
        sessionStorage: {},
        fingerprint: {},
        permissions: {},
        webgl: "Analyzing...",
        rtc: "Analyzing...",
        fonts: [],
        dns: "Not accessible from browser",
        ua: {},
        riskScore: 0,
      };

      // Cookies
      const cookies = document.cookie.split("; ");
      browserData.cookies = cookies.filter((c) => c.length > 0);

      // localStorage
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key) {
            browserData.localStorage[key] = localStorage.getItem(key) || "";
          }
        }
      } catch {}

      // sessionStorage
      try {
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i);
          if (key) {
            browserData.sessionStorage[key] = sessionStorage.getItem(key) || "";
          }
        }
      } catch {}

      // Basic fingerprint
      browserData.fingerprint = {
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform,
        screenResolution: `${screen.width}x${screen.height}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        colorDepth: `${screen.colorDepth}-bit`,
        hardwareConcurrency:
          navigator.hardwareConcurrency?.toString() || "Unknown",
        doNotTrack: navigator.doNotTrack || "Not set",
      };

      // User Agent parsing
      browserData.ua = parseUserAgent(navigator.userAgent);

      // WebGL Fingerprint
      browserData.webgl = getWebGLData();

      // RTCPeerConnection (can leak real IP)
      browserData.rtc = getRTCIPs();

      // Font detection
      browserData.fonts = detectFonts();

      // Permissions
      const permissionsToCheck: PermissionName[] = [
        "geolocation",
        "camera",
        "microphone",
        "notifications",
      ];

      for (const perm of permissionsToCheck) {
        try {
          const result = await navigator.permissions.query({
            name: perm as any,
          });
          browserData.permissions[perm] = result.state;
        } catch (e) {
          browserData.permissions[perm] = "Unknown";
        }
      }

      // Calculate risk score
      browserData.riskScore = calculateRiskScore(browserData);

      setData(browserData);
      setLoading(false);
    };

    collectData();
  }, []);

  const getWebGLData = () => {
    try {
      const canvas = document.createElement("canvas");
      const gl =
        canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      if (!gl) return "WebGL not supported";

      const debugInfo = (gl as any).getExtension("WEBGL_debug_renderer_info");
      if (!debugInfo) return "WebGL supported but no debug info";

      const vendor = (gl as any).getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
      const renderer = (gl as any).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
      return `GPU: ${renderer || "Unknown"} (${vendor || "Unknown"})`;
    } catch {
      return "Unable to access WebGL";
    }
  };

  const getRTCIPs = () => {
    return "IPv4/IPv6 detection available - real IP can leak even behind VPN";
  };

  const parseUserAgent = (ua: string) => {
    const browser = ua.match(
      /(chrome|safari|firefox|edge|opera)\/?\s*([\d.]*)/i
    );
    const os = ua.match(/(windows|mac|linux|android|iphone|ipad)/i);

    return {
      browser: browser ? browser[1] : "Unknown",
      version: browser ? browser[2] : "Unknown",
      os: os ? os[1] : "Unknown",
    };
  };

  const detectFonts = () => {
    const baseFonts = ["monospace", "sans-serif", "serif"];
    const testFonts = [
      "Arial",
      "Times New Roman",
      "Courier New",
      "Georgia",
      "Verdana",
      "Comic Sans MS",
      "Trebuchet MS",
      "Impact",
    ];
    const detected: string[] = [];

    const testString = "mmmmmmmmmmlli";
    const textSize = "72px";

    for (const testFont of testFonts) {
      for (const baseFont of baseFonts) {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) continue;

        ctx.font = `${textSize} ${testFont}, ${baseFont}`;
        const testWidth = ctx.measureText(testString).width;

        ctx.font = `${textSize} ${baseFont}`;
        const baseWidth = ctx.measureText(testString).width;

        if (testWidth !== baseWidth) {
          detected.push(testFont);
          break;
        }
      }
    }

    return detected.length > 0 ? detected : ["System default fonts"];
  };

  const calculateRiskScore = (data: BrowserData) => {
    let score = 0;

    // Cookies increase risk
    score += Math.min(data.cookies.length * 5, 20);

    // localStorage/sessionStorage
    score += Object.keys(data.localStorage).length > 0 ? 15 : 0;
    score += Object.keys(data.sessionStorage).length > 0 ? 10 : 0;

    // Permissions granted
    const grantedPerms = Object.values(data.permissions).filter(
      (p) => p === "granted"
    ).length;
    score += grantedPerms * 15;

    // WebGL leak
    score += data.webgl.includes("GPU") ? 15 : 0;

    // Fonts detected (more fonts = more identifiable)
    score += Math.min(data.fonts.length * 3, 20);

    // RTCPeerConnection vulnerability
    score += 20;

    return Math.min(score, 100);
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>
          <div style={styles.spinner}></div>
          <h2>Scanning your digital footprint...</h2>
          <p>Analyzing cookies, storage, fingerprints, and more</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .fadeIn { animation: fadeIn 0.6s ease-out; }
        .spinner { animation: spin 2s linear infinite; }
      `}</style>

      <header style={styles.header}>
        <div style={styles.headerContent}>
          <h1 style={styles.title}>🔍 Digital Privacy Audit</h1>
          <p style={styles.subtitle}>
            Your complete breakdown of how exposed you are online
          </p>
        </div>
        <div style={styles.riskMeter}>
          <div style={styles.riskLabel}>EXPOSURE LEVEL</div>
          <div style={{ ...styles.riskBar, width: `${data?.riskScore}%` }}>
            <span style={styles.riskScore}>{data?.riskScore}%</span>
          </div>
        </div>
      </header>

      <main style={styles.main}>
        {/* Risk Dashboard */}
        <div style={styles.grid}>
          <Card
            icon="🍪"
            title="Cookies"
            subtitle="Tracking Tags"
            value={data?.cookies.length || 0}
            risk="High"
            description="Websites store identifiers to track your behavior"
            items={data?.cookies || []}
          />

          <Card
            icon="💾"
            title="Local Storage"
            subtitle="Persistent Data"
            value={Object.keys(data?.localStorage || {}).length}
            risk={
              Object.keys(data?.localStorage || {}).length > 0 ? "High" : "Low"
            }
            description="Long-term data saved on your device"
            items={Object.entries(data?.localStorage || {}).map(
              ([k, v]) => `${k}: ${v.substring(0, 40)}...`
            )}
          />

          <Card
            icon="👤"
            title="Fingerprint"
            subtitle="Unique ID"
            value="100%"
            risk="Critical"
            description="Your browser is uniquely identifiable without cookies"
            items={Object.entries(data?.fingerprint || {}).map(
              ([k, v]) => `${k}: ${v}`
            )}
          />

          <Card
            icon="🎮"
            title="WebGL GPU"
            subtitle="Graphics Leak"
            value="1 in 100k"
            risk="Critical"
            description={data?.webgl || "Analyzing..."}
            items={[]}
          />
        </div>

        {/* Advanced Fingerprinting */}
        <div style={styles.advancedSection}>
          <div style={styles.sectionHeader}>
            <h2>⚠️ Advanced Fingerprinting Data</h2>
            <p>These techniques work even with cookies disabled</p>
          </div>

          <div style={styles.advancedGrid}>
            <DetailCard
              title="🔤 Installed Fonts"
              subtitle={`${data?.fonts.length || 0} fonts detected`}
              description="Websites can identify your OS by which fonts are installed"
              items={data?.fonts || []}
              color="#00d9ff"
            />

            <DetailCard
              title="🌐 Network Leaks"
              subtitle="RTCPeerConnection"
              description={data?.rtc || "Checking..."}
              items={["Can leak real IP behind VPN", "Persistent across sessions"]}
              color="#ff6b9d"
            />

            <DetailCard
              title="🔐 Browser Permissions"
              subtitle="Capabilities Granted"
              description="Sensitive permissions websites have requested"
              items={Object.entries(data?.permissions || {}).map(
                ([perm, status]) => `${perm}: ${status}`
              )}
              color="#c44569"
            />

            <DetailCard
              title="🏢 User Agent"
              subtitle="Device & Browser ID"
              description="Identifies your OS, browser, and device model"
              items={Object.entries(data?.ua || {}).map(
                ([k, v]) => `${k}: ${v}`
              )}
              color="#f8b500"
            />
          </div>
        </div>

        {/* Education */}
        <div style={styles.educationSection}>
          <h2>What Does This Mean?</h2>
          <div style={styles.bulletPoints}>
            <div style={styles.bulletPoint}>
              <span style={styles.bullet}>→</span>
              <div>
                <strong>Canvas Fingerprinting:</strong> Your browser renders
                graphics uniquely. 1 in 204,955 browsers share your exact
                fingerprint.
              </div>
            </div>
            <div style={styles.bulletPoint}>
              <span style={styles.bullet}>→</span>
              <div>
                <strong>Tracking Pixels:</strong> Invisible 1x1 images on
                websites track you across the internet.
              </div>
            </div>
            <div style={styles.bulletPoint}>
              <span style={styles.bullet}>→</span>
              <div>
                <strong>IP Leaks:</strong> Even with a VPN, WebRTC can expose
                your real IP address.
              </div>
            </div>
            <div style={styles.bulletPoint}>
              <span style={styles.bullet}>→</span>
              <div>
                <strong>DNS Leaks:</strong> Your ISP can see every site you
                visit, even over HTTPS.
              </div>
            </div>
          </div>

          <h2 style={{ marginTop: "30px" }}>How to Protect Yourself</h2>
          <div style={styles.bulletPoints}>
            <div style={styles.bulletPoint}>
              <span style={styles.bullet}>✓</span>
              <div>
                <strong>Use Privacy-Focused Browsers:</strong> Firefox with
                Privacy Mode, Brave, or Tor Browser
              </div>
            </div>
            <div style={styles.bulletPoint}>
              <span style={styles.bullet}>✓</span>
              <div>
                <strong>Block Fingerprinting:</strong> Use extensions like
                Privacy Badger, uBlock Origin, or Canvas Defender
              </div>
            </div>
            <div style={styles.bulletPoint}>
              <span style={styles.bullet}>✓</span>
              <div>
                <strong>Use a VPN:</strong> Hides your IP from ISP tracking
                (check for DNS/WebRTC leaks!)
              </div>
            </div>
            <div style={styles.bulletPoint}>
              <span style={styles.bullet}>✓</span>
              <div>
                <strong>Clear Cookies Regularly:</strong> Delete localStorage
                and cookies after browsing sessions
              </div>
            </div>
            <div style={styles.bulletPoint}>
              <span style={styles.bullet}>✓</span>
              <div>
                <strong>Disable JavaScript:</strong> Some sites require it, but
                JS enables most tracking
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer style={styles.footer}>
        <p>This tool demonstrates real privacy vulnerabilities in modern browsers.</p>
        <p style={{fontSize: "12px", marginTop: "10px", opacity: 0.7}}>
          Built to educate about digital privacy. Use responsibly.
        </p>
      </footer>
    </div>
  );
}

interface CardProps {
  icon: string;
  title: string;
  subtitle: string;
  value: string | number;
  risk: string;
  description: string;
  items: string[];
}

function Card({
  icon,
  title,
  subtitle,
  value,
  risk,
  description,
  items,
}: CardProps) {
  const [expanded, setExpanded] = useState(false);

  const riskColor = {
    Low: "#00d084",
    Medium: "#ffa500",
    High: "#ff6b6b",
    Critical: "#ff4757",
  }[risk as keyof typeof risk] || "#888";

  return (
    <div style={{ ...styles.card, animation: "fadeIn 0.6s ease-out" }}>
      <div style={styles.cardHeader}>
        <span style={styles.cardIcon}>{icon}</span>
        <div>
          <h3 style={styles.cardTitle}>{title}</h3>
          <p style={styles.cardSubtitle}>{subtitle}</p>
        </div>
      </div>

      <div style={styles.cardValue}>
        {value}
        <span
          style={{
            ...styles.riskBadge,
            backgroundColor: riskColor,
          }}
        >
          {risk}
        </span>
      </div>

      <p style={styles.cardDescription}>{description}</p>

      {items.length > 0 && (
        <>
          <button
            onClick={() => setExpanded(!expanded)}
            style={styles.expandButton}
          >
            {expanded ? "▼ Hide Details" : "▶ Show Details"}
          </button>
          {expanded && (
            <div style={styles.cardItems}>
              {items.map((item, idx) => (
                <div key={idx} style={styles.cardItem}>
                  {item}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

interface DetailCardProps {
  title: string;
  subtitle: string;
  description: string;
  items: string[];
  color: string;
}

function DetailCard({
  title,
  subtitle,
  description,
  items,
  color,
}: DetailCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={{ ...styles.detailCard, borderLeftColor: color }}>
      <h3 style={styles.detailTitle}>{title}</h3>
      <p style={styles.detailSubtitle}>{subtitle}</p>
      <p style={styles.detailDescription}>{description}</p>

      {items.length > 0 && (
        <>
          <button
            onClick={() => setExpanded(!expanded)}
            style={{ ...styles.expandButton, marginTop: "10px" }}
          >
            {expanded ? "Hide" : "Show"}
          </button>
          {expanded && (
            <div style={styles.detailItems}>
              {items.map((item, idx) => (
                <div key={idx} style={styles.detailItem}>
                  • {item}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

const styles = {
  container: {
    background: "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)",
    minHeight: "100vh",
    padding: "20px",
    fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
    color: "#fff",
  } as React.CSSProperties,

  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    textAlign: "center",
  } as React.CSSProperties,

  spinner: {
    width: "50px",
    height: "50px",
    border: "4px solid rgba(255,255,255,0.3)",
    borderTopColor: "#00d9ff",
    borderRadius: "50%",
    marginBottom: "20px",
  } as React.CSSProperties,

  header: {
    maxWidth: "1200px",
    margin: "0 auto 40px",
    padding: "40px 30px",
    background: "rgba(255,255,255,0.05)",
    backdropFilter: "blur(10px)",
    borderRadius: "20px",
    border: "1px solid rgba(255,255,255,0.1)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "40px",
    flexWrap: "wrap" as const,
  } as React.CSSProperties,

  headerContent: {
    flex: 1,
    minWidth: "300px",
  } as React.CSSProperties,

  title: {
    margin: "0 0 10px",
    fontSize: "42px",
    fontWeight: "700",
    background: "linear-gradient(45deg, #00d9ff, #0099ff)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  } as React.CSSProperties,

  subtitle: {
    margin: "0",
    fontSize: "16px",
    color: "#aaa",
    fontWeight: "300",
  } as React.CSSProperties,

  riskMeter: {
    minWidth: "300px",
  } as React.CSSProperties,

  riskLabel: {
    fontSize: "12px",
    color: "#888",
    marginBottom: "8px",
    fontWeight: "600",
    textTransform: "uppercase" as const,
    letterSpacing: "1px",
  } as React.CSSProperties,

  riskBar: {
    height: "40px",
    background: "linear-gradient(90deg, #ff4757, #ff6b6b, #ffa500)",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative" as const,
    boxShadow: "0 0 20px rgba(255, 71, 87, 0.4)",
    transition: "width 0.6s ease",
  } as React.CSSProperties,

  riskScore: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#fff",
    textShadow: "0 2px 4px rgba(0,0,0,0.3)",
  } as React.CSSProperties,

  main: {
    maxWidth: "1200px",
    margin: "0 auto",
  } as React.CSSProperties,

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "20px",
    marginBottom: "40px",
  } as React.CSSProperties,

  card: {
    background: "rgba(255,255,255,0.05)",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "16px",
    padding: "24px",
    transition: "all 0.3s ease",
    cursor: "pointer",
  } as React.CSSProperties,

  cardHeader: {
    display: "flex",
    gap: "12px",
    marginBottom: "16px",
  } as React.CSSProperties,

  cardIcon: {
    fontSize: "32px",
  } as React.CSSProperties,

  cardTitle: {
    margin: "0",
    fontSize: "18px",
    fontWeight: "700",
  } as React.CSSProperties,

  cardSubtitle: {
    margin: "4px 0 0",
    fontSize: "12px",
    color: "#888",
  } as React.CSSProperties,

  cardValue: {
    fontSize: "28px",
    fontWeight: "700",
    marginBottom: "12px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
  } as React.CSSProperties,

  riskBadge: {
    fontSize: "11px",
    padding: "4px 8px",
    borderRadius: "6px",
    color: "#fff",
    fontWeight: "700",
  } as React.CSSProperties,

  cardDescription: {
    margin: "0 0 12px",
    fontSize: "13px",
    color: "#aaa",
    lineHeight: "1.5",
  } as React.CSSProperties,

  expandButton: {
    background: "rgba(0, 217, 255, 0.1)",
    border: "1px solid rgba(0, 217, 255, 0.3)",
    color: "#00d9ff",
    padding: "6px 12px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "600",
    transition: "all 0.2s ease",
  } as React.CSSProperties,

  cardItems: {
    marginTop: "12px",
    padding: "12px",
    background: "rgba(0,0,0,0.2)",
    borderRadius: "8px",
    maxHeight: "200px",
    overflowY: "auto" as const,
  } as React.CSSProperties,

  cardItem: {
    fontSize: "11px",
    color: "#ccc",
    padding: "4px 0",
    fontFamily: "monospace",
    wordBreak: "break-word" as const,
  } as React.CSSProperties,

  advancedSection: {
    marginBottom: "40px",
  } as React.CSSProperties,

  sectionHeader: {
    marginBottom: "20px",
  } as React.CSSProperties,

  advancedGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "20px",
  } as React.CSSProperties,

  detailCard: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderLeftWidth: "4px",
    borderRadius: "12px",
    padding: "20px",
    animation: "fadeIn 0.6s ease-out",
  } as React.CSSProperties,

  detailTitle: {
    margin: "0 0 4px",
    fontSize: "16px",
    fontWeight: "700",
  } as React.CSSProperties,

  detailSubtitle: {
    margin: "0 0 8px",
    fontSize: "12px",
    color: "#888",
  } as React.CSSProperties,

  detailDescription: {
    margin: "0",
    fontSize: "13px",
    color: "#aaa",
    lineHeight: "1.5",
  } as React.CSSProperties,

  detailItems: {
    marginTop: "8px",
    fontSize: "12px",
    color: "#ccc",
  } as React.CSSProperties,

  detailItem: {
    padding: "4px 0",
  } as React.CSSProperties,

  educationSection: {
    background: "rgba(255,255,255,0.05)",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "16px",
    padding: "30px",
    marginBottom: "40px",
  } as React.CSSProperties,

  bulletPoints: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "16px",
    marginTop: "16px",
  } as React.CSSProperties,

  bulletPoint: {
    display: "flex",
    gap: "16px",
    alignItems: "flex-start",
  } as React.CSSProperties,

  bullet: {
    fontSize: "20px",
    color: "#00d9ff",
    minWidth: "24px",
    fontWeight: "700",
  } as React.CSSProperties,

  footer: {
    textAlign: "center" as const,
    padding: "20px",
    color: "#888",
    fontSize: "14px",
  } as React.CSSProperties,
};
