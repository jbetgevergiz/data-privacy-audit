import { useEffect, useState } from "react";

interface BrowserData {
  cookies: string[];
  localStorage: Record<string, string>;
  sessionStorage: Record<string, string>;
  fingerprint: Record<string, string>;
  permissions: Record<string, string>;
  trackers: string[];
}

export default function Home() {
  const [data, setData] = useState<BrowserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Collect all browser data
    const browserData: BrowserData = {
      cookies: [],
      localStorage: {},
      sessionStorage: {},
      fingerprint: {},
      permissions: {},
      trackers: [],
    };

    // 1. Cookies
    const cookies = document.cookie.split("; ");
    browserData.cookies = cookies.filter((c) => c.length > 0);

    // 2. localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        browserData.localStorage[key] = localStorage.getItem(key) || "";
      }
    }

    // 3. sessionStorage
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key) {
        browserData.sessionStorage[key] = sessionStorage.getItem(key) || "";
      }
    }

    // 4. Browser Fingerprinting
    browserData.fingerprint = {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      screenResolution: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      colorDepth: `${screen.colorDepth}-bit`,
      plugins: Array.from(navigator.plugins)
        .map((p) => p.name)
        .join(", ") || "None",
      hardwareConcurrency: navigator.hardwareConcurrency?.toString() || "Unknown",
      deviceMemory:
        (navigator.deviceMemory?.toString() || "Unknown") + " GB",
      canvasFingerprint: getCanvasFingerprint(),
      doNotTrack: navigator.doNotTrack || "Not set",
    };

    // 5. Permissions
    const permissionsToCheck: PermissionName[] = [
      "geolocation",
      "camera",
      "microphone",
      "notifications",
    ];

    Promise.all(
      permissionsToCheck.map(async (perm) => {
        try {
          const result = await navigator.permissions.query({ name: perm as any });
          browserData.permissions[perm] = result.state;
        } catch (e) {
          browserData.permissions[perm] = "Unknown";
        }
      })
    ).then(() => {
      setData(browserData);
      setLoading(false);
    });
  }, []);

  const getCanvasFingerprint = () => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return "Unable to generate";
    ctx.textBaseline = "top";
    ctx.font = '14px "Arial"';
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "#f60";
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = "#069";
    ctx.fillText("Browser fingerprint 🔒", 2, 15);
    return canvas.toDataURL().substring(0, 50) + "...";
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <h1>Loading your data...</h1>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1>🔍 Your Digital Privacy Audit</h1>
        <p>
          See everything your browser is storing and revealing about you right
          now.
        </p>
      </header>

      <main style={styles.main}>
        {/* Cookies */}
        <Section
          title="🍪 Cookies"
          count={data?.cookies.length || 0}
          items={data?.cookies || []}
          description="Websites can track you across sessions with cookies."
        />

        {/* localStorage */}
        <Section
          title="💾 Local Storage"
          count={Object.keys(data?.localStorage || {}).length}
          items={Object.entries(data?.localStorage || {}).map(
            ([k, v]) => `${k}: ${v.substring(0, 50)}${v.length > 50 ? "..." : ""}`
          )}
          description="Long-term data stored by websites on your machine."
        />

        {/* sessionStorage */}
        <Section
          title="📋 Session Storage"
          count={Object.keys(data?.sessionStorage || {}).length}
          items={Object.entries(data?.sessionStorage || {}).map(
            ([k, v]) => `${k}: ${v.substring(0, 50)}${v.length > 50 ? "..." : ""}`
          )}
          description="Temporary data stored while you're on a website."
        />

        {/* Browser Fingerprint */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>
            👤 Browser Fingerprint (Unique ID)
          </h2>
          <p style={styles.description}>
            Websites can identify you uniquely using this combination of data,
            even without cookies.
          </p>
          <div style={styles.items}>
            {Object.entries(data?.fingerprint || {}).map(([key, value]) => (
              <div key={key} style={styles.item}>
                <strong>{key}:</strong> {value}
              </div>
            ))}
          </div>
        </div>

        {/* Permissions */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>
            🔐 Permissions Granted to Websites
          </h2>
          <p style={styles.description}>
            These are sensitive capabilities websites have asked for.
          </p>
          <div style={styles.items}>
            {Object.entries(data?.permissions || {}).map(([perm, status]) => (
              <div key={perm} style={styles.item}>
                <strong>{perm}:</strong>{" "}
                <span
                  style={{
                    color:
                      status === "granted"
                        ? "red"
                        : status === "denied"
                          ? "green"
                          : "gray",
                  }}
                >
                  {status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer style={styles.footer}>
        <p>
          <strong>What does this mean?</strong> Websites can see far more about
          you than you realize. Even without direct permission, they can track
          you, profile you, and sell that data.
        </p>
        <p>
          <strong>What can you do?</strong> Use privacy-focused browsers, block
          cookies, use VPNs, and check your browser privacy settings.
        </p>
      </footer>
    </div>
  );
}

interface SectionProps {
  title: string;
  count: number;
  items: string[];
  description: string;
}

function Section({ title, count, items, description }: SectionProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={styles.section}>
      <h2 style={styles.sectionTitle}>
        {title} <span style={styles.count}>({count})</span>
      </h2>
      <p style={styles.description}>{description}</p>
      {items.length > 0 ? (
        <>
          <button
            onClick={() => setExpanded(!expanded)}
            style={styles.button}
          >
            {expanded ? "Hide" : "Show"} Details
          </button>
          {expanded && (
            <div style={styles.items}>
              {items.map((item, idx) => (
                <div key={idx} style={styles.item}>
                  {item}
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <p style={{ color: "#888" }}>None found (this site is clean!)</p>
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "900px",
    margin: "0 auto",
    padding: "20px",
    fontFamily: "system-ui, -apple-system, sans-serif",
    backgroundColor: "#0a0e27",
    color: "#fff",
    minHeight: "100vh",
  } as React.CSSProperties,
  header: {
    textAlign: "center" as const,
    marginBottom: "40px",
    paddingBottom: "20px",
    borderBottom: "2px solid #ff6b6b",
  },
  main: {
    marginBottom: "40px",
  },
  section: {
    backgroundColor: "#1a1f3a",
    padding: "20px",
    marginBottom: "20px",
    borderRadius: "8px",
    border: "1px solid #2a3050",
  } as React.CSSProperties,
  sectionTitle: {
    margin: "0 0 10px 0",
    fontSize: "18px",
    color: "#ff6b6b",
  } as React.CSSProperties,
  count: {
    fontSize: "14px",
    color: "#888",
    marginLeft: "10px",
  } as React.CSSProperties,
  description: {
    margin: "0 0 15px 0",
    color: "#aaa",
    fontSize: "14px",
  } as React.CSSProperties,
  button: {
    backgroundColor: "#ff6b6b",
    color: "#000",
    border: "none",
    padding: "8px 16px",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "bold",
    marginBottom: "15px",
  } as React.CSSProperties,
  items: {
    backgroundColor: "#0a0e27",
    padding: "12px",
    borderRadius: "4px",
    maxHeight: "400px",
    overflowY: "auto" as const,
  } as React.CSSProperties,
  item: {
    padding: "8px",
    borderBottom: "1px solid #2a3050",
    fontSize: "13px",
    fontFamily: "monospace",
    wordBreak: "break-all" as const,
  } as React.CSSProperties,
  footer: {
    backgroundColor: "#1a1f3a",
    padding: "20px",
    borderRadius: "8px",
    border: "1px solid #2a3050",
    color: "#aaa",
    fontSize: "14px",
  } as React.CSSProperties,
};
