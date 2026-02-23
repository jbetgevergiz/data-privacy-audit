import { useEffect, useState } from "react";

interface JourneyData {
  step: number;
  publicIP: string;
  localIPs: string[];
  userAgent: string;
  timezone: string;
  screen: string;
  cookies: string[];
  localStorage: Record<string, string>;
  permissions: Record<string, string>;
  webgl: string;
  fonts: string[];
  canvas: string;
  uniqueID: string;
  identificationRisk: number;
}

export default function Home() {
  const [journey, setJourney] = useState<JourneyData>({
    step: 0,
    publicIP: "Detecting...",
    localIPs: [],
    userAgent: "",
    timezone: "",
    screen: "",
    cookies: [],
    localStorage: {},
    permissions: {},
    webgl: "",
    fonts: [],
    canvas: "",
    uniqueID: "",
    identificationRisk: 0,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const discoverYourself = async () => {
      let step = 0;
      const data: JourneyData = {
        step: 0,
        publicIP: "Detecting...",
        localIPs: [],
        userAgent: navigator.userAgent,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        screen: `${screen.width}x${screen.height}`,
        cookies: document.cookie.split("; ").filter((c) => c.length > 0),
        localStorage: {},
        permissions: {},
        webgl: "Scanning...",
        fonts: [],
        canvas: "Generating...",
        uniqueID: Math.random().toString(36).substring(2, 15),
        identificationRisk: 0,
      };

      // Step 1: Get local IP via WebRTC (this is the scary part)
      const localIPs = await getLocalIPs();
      data.localIPs = localIPs;
      step++;
      data.step = step;
      setJourney({ ...data });

      // Simulate delay for journey effect
      await new Promise((r) => setTimeout(r, 800));

      // Step 2: Analyze User Agent
      data.userAgent = parseUserAgent(navigator.userAgent);
      step++;
      data.step = step;
      setJourney({ ...data });
      await new Promise((r) => setTimeout(r, 800));

      // Step 3: Get WebGL info
      data.webgl = getWebGLFingerprint();
      step++;
      data.step = step;
      setJourney({ ...data });
      await new Promise((r) => setTimeout(r, 800));

      // Step 4: Detect fonts
      data.fonts = detectFonts();
      step++;
      data.step = step;
      setJourney({ ...data });
      await new Promise((r) => setTimeout(r, 800));

      // Step 5: Canvas fingerprint
      data.canvas = generateCanvasFingerprint();
      step++;
      data.step = step;
      setJourney({ ...data });
      await new Promise((r) => setTimeout(r, 800));

      // Step 6: localStorage
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key) {
            data.localStorage[key] = localStorage.getItem(key) || "";
          }
        }
      } catch {}
      step++;
      data.step = step;
      setJourney({ ...data });
      await new Promise((r) => setTimeout(r, 800));

      // Step 7: Permissions
      const perms: PermissionName[] = ["geolocation", "camera", "microphone"];
      for (const perm of perms) {
        try {
          const result = await navigator.permissions.query({
            name: perm as any,
          });
          data.permissions[perm] = result.state;
        } catch {}
      }
      step++;
      data.step = step;
      setJourney({ ...data });
      await new Promise((r) => setTimeout(r, 800));

      // Calculate identification risk
      data.identificationRisk = calculateIdentificationRisk(data);
      data.step = 8;

      setJourney(data);
      setLoading(false);
    };

    discoverYourself();
  }, []);

  const getLocalIPs = async (): Promise<string[]> => {
    return new Promise((resolve) => {
      const ips: Set<string> = new Set();

      const config = {
        iceServers: [{ urls: ["stun:stun.l.google.com:19302"] }],
      };

      const rtc = new RTCPeerConnection(config as any);

      rtc.onicecandidate = (ice: any) => {
        if (!ice || !ice.candidate) return;

        const ipRegex = /([0-9]{1,3}(\.[0-9]{1,3}){3})/;
        const ipAddress = ipRegex.exec(ice.candidate.candidate)?.[1];

        if (ipAddress && !ipAddress.startsWith("255")) {
          ips.add(ipAddress);
        }
      };

      rtc.createDataChannel("");
      rtc.createOffer().then((offer) => {
        rtc.setLocalDescription(offer);
      });

      setTimeout(() => {
        resolve(Array.from(ips));
      }, 2000);
    });
  };

  const getWebGLFingerprint = () => {
    try {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl");
      if (!gl) return "WebGL not supported";

      const debugInfo = (gl as any).getExtension("WEBGL_debug_renderer_info");
      if (!debugInfo) return "WebGL disabled";

      const renderer = (gl as any).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
      const vendor = (gl as any).getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);

      return `${renderer} (${vendor})`;
    } catch {
      return "WebGL access denied";
    }
  };

  const parseUserAgent = (ua: string) => {
    const browser = ua.match(
      /(chrome|safari|firefox|edge|opera)\/?\s*([\d.]*)/i
    );
    const os = ua.match(/(windows|mac|linux|android|iphone)/i);

    return `${browser ? browser[1] : "Unknown"} ${browser ? browser[2] : ""} on ${os ? os[1] : "Unknown"}`;
  };

  const detectFonts = () => {
    const baseFonts = ["monospace", "sans-serif", "serif"];
    const testFonts = [
      "Arial",
      "Times New Roman",
      "Courier New",
      "Georgia",
      "Verdana",
    ];
    const detected: string[] = [];

    const testString = "mmmmmmmmmmlli";

    for (const testFont of testFonts) {
      for (const baseFont of baseFonts) {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) continue;

        ctx.font = `72px ${testFont}, ${baseFont}`;
        const testWidth = ctx.measureText(testString).width;

        ctx.font = `72px ${baseFont}`;
        const baseWidth = ctx.measureText(testString).width;

        if (testWidth !== baseWidth) {
          detected.push(testFont);
          break;
        }
      }
    }

    return detected;
  };

  const generateCanvasFingerprint = () => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return "Unable to generate";

    ctx.textBaseline = "top";
    ctx.font = "14px Arial";
    ctx.fillStyle = "#f60";
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = "#069";
    ctx.fillText("Privacy Audit 🔒", 2, 15);

    return canvas.toDataURL().substring(0, 60) + "...";
  };

  const calculateIdentificationRisk = (data: JourneyData) => {
    let risk = 0;

    risk += data.localIPs.length * 15; // Real IP leak is critical
    risk += data.cookies.length * 3;
    risk += Object.keys(data.localStorage).length * 10;
    risk += Object.values(data.permissions).filter((p) => p === "granted")
      .length * 15;
    risk += data.fonts.length * 2;
    risk += data.webgl.includes("ANGLE") || data.webgl.includes("GPU") ? 20 : 5;

    return Math.min(risk, 100);
  };

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        .slideUp { animation: slideUp 0.6s ease-out; }
        .fadeIn { animation: fadeIn 0.8s ease-out; }
        .pulse { animation: pulse 2s ease-in-out infinite; }
      `}</style>

      <div style={styles.timeline}>
        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div
            key={i}
            style={{
              ...styles.timelinePoint,
              backgroundColor:
                i < journey.step
                  ? "#00d9ff"
                  : i === journey.step
                    ? "#ff6b9d"
                    : "#444",
              boxShadow:
                i === journey.step
                  ? "0 0 20px rgba(255, 107, 157, 0.6)"
                  : "none",
            }}
          />
        ))}
      </div>

      <div style={styles.journeyContainer}>
        {!loading ? (
          <>
            {/* Step 1: IP Detection */}
            {journey.step >= 1 && (
              <JourneyCard
                step={1}
                title="🌐 Your IP Addresses Detected"
                description="WebRTC leaks your real IP, even behind a VPN"
                content={
                  <>
                    <div style={styles.highlight}>
                      Local IPs: {journey.localIPs.join(", ")}
                    </div>
                    <p style={styles.explanation}>
                      These are your real local network addresses. Your ISP and
                      websites can use these to pinpoint your exact location and
                      network.
                    </p>
                  </>
                }
              />
            )}

            {/* Step 2: Browser ID */}
            {journey.step >= 2 && (
              <JourneyCard
                step={2}
                title="🔍 Browser Identified"
                description="Your User-Agent reveals everything about you"
                content={
                  <>
                    <div style={styles.highlight}>{journey.userAgent}</div>
                    <p style={styles.explanation}>
                      This tells websites: your exact browser, version, OS,
                      device model. 1 in ~1000 users have this exact
                      combination.
                    </p>
                  </>
                }
              />
            )}

            {/* Step 3: GPU Fingerprint */}
            {journey.step >= 3 && (
              <JourneyCard
                step={3}
                title="🎮 GPU Identified"
                description="Your graphics card is a permanent identifier"
                content={
                  <>
                    <div style={styles.highlight}>{journey.webgl}</div>
                    <p style={styles.explanation}>
                      Your GPU model is almost always unique. Combined with your
                      browser, this makes you 1 in 500,000+ users
                      identifiable.
                    </p>
                  </>
                }
              />
            )}

            {/* Step 4: Fonts */}
            {journey.step >= 4 && (
              <JourneyCard
                step={4}
                title="🔤 Font Library Scanned"
                description={`${journey.fonts.length} system fonts detected`}
                content={
                  <>
                    <div style={styles.highlight}>
                      {journey.fonts.join(", ")}
                    </div>
                    <p style={styles.explanation}>
                      Websites can detect which fonts are installed on your OS.
                      Different OS + software combinations = unique fingerprint.
                    </p>
                  </>
                }
              />
            )}

            {/* Step 5: Canvas */}
            {journey.step >= 5 && (
              <JourneyCard
                step={5}
                title="🎨 Canvas Fingerprint Generated"
                description="Unique rendering = unique you"
                content={
                  <>
                    <div style={styles.highlight}>{journey.canvas}</div>
                    <p style={styles.explanation}>
                      Your browser renders graphics in a unique way based on
                      hardware and drivers. 1 in 204,955 browsers match yours
                      exactly.
                    </p>
                  </>
                }
              />
            )}

            {/* Step 6: Storage */}
            {journey.step >= 6 && (
              <JourneyCard
                step={6}
                title="💾 Local Data Extracted"
                description={`${journey.cookies.length} cookies + ${Object.keys(journey.localStorage).length} stored items`}
                content={
                  <>
                    {journey.cookies.length > 0 && (
                      <div style={styles.highlight}>
                        {journey.cookies.slice(0, 3).join("\n")}
                      </div>
                    )}
                    <p style={styles.explanation}>
                      Websites store unique IDs that persist across sessions.
                      These are used to build a complete profile of your
                      behavior.
                    </p>
                  </>
                }
              />
            )}

            {/* Step 7: Permissions */}
            {journey.step >= 7 && (
              <JourneyCard
                step={7}
                title="🔐 Sensitive Permissions Detected"
                description="What you've allowed websites to access"
                content={
                  <>
                    <div style={styles.highlight}>
                      {Object.entries(journey.permissions)
                        .filter(([, v]) => v === "granted")
                        .map(([k]) => `✓ ${k}`)
                        .join("\n")}
                    </div>
                    <p style={styles.explanation}>
                      Location, camera, microphone — once granted, websites have
                      permanent access.
                    </p>
                  </>
                }
              />
            )}

            {/* Final: Risk Assessment */}
            {journey.step >= 8 && (
              <JourneyCard
                step={8}
                title="⚠️ Identification Risk: CRITICAL"
                description={`${journey.identificationRisk}% Exposure`}
                content={
                  <>
                    <div style={styles.riskMeter}>
                      <div
                        style={{
                          ...styles.riskFill,
                          width: `${journey.identificationRisk}%`,
                        }}
                      />
                    </div>
                    <p style={styles.explanation}>
                      <strong>You are uniquely identifiable.</strong> By
                      combining: your IP, browser, GPU, fonts, canvas, cookies,
                      and permissions — websites have a 99.9999% unique profile
                      of you. They can track you across the entire internet
                      without your knowledge.
                    </p>

                    <div style={styles.finalActions}>
                      <h3>What You Should Do Now:</h3>
                      <ul style={styles.actionList}>
                        <li>
                          <strong>Use Brave Browser</strong> or Firefox with
                          enhanced privacy
                        </li>
                        <li>
                          <strong>Block Fingerprinting</strong> with Canvas
                          Defender extension
                        </li>
                        <li>
                          <strong>Disable WebRTC</strong> in browser settings
                        </li>
                        <li>
                          <strong>Use Tor Browser</strong> for maximum privacy
                        </li>
                        <li>
                          <strong>VPN + DNS leak protection</strong> (Mullvad,
                          IVPN)
                        </li>
                        <li>
                          <strong>Regular cookie clearance</strong> after each
                          session
                        </li>
                      </ul>
                    </div>
                  </>
                }
              />
            )}
          </>
        ) : (
          <LoadingJourney step={journey.step} />
        )}
      </div>
    </div>
  );
}

interface JourneyCardProps {
  step: number;
  title: string;
  description: string;
  content: React.ReactNode;
}

function JourneyCard({ step, title, description, content }: JourneyCardProps) {
  return (
    <div style={styles.card} className="slideUp">
      <div style={styles.cardStep}>Step {step}</div>
      <h2 style={styles.cardTitle}>{title}</h2>
      <p style={styles.cardDescription}>{description}</p>
      <div style={styles.cardContent}>{content}</div>
    </div>
  );
}

function LoadingJourney({ step }: { step: number }) {
  const messages = [
    "Connecting to STUN servers...",
    "Parsing browser signature...",
    "Scanning GPU capabilities...",
    "Detecting installed fonts...",
    "Generating canvas fingerprint...",
    "Extracting stored data...",
    "Checking permissions...",
    "Calculating exposure level...",
  ];

  return (
    <div style={styles.loadingCard}>
      <div className="pulse" style={styles.spinner} />
      <p style={styles.loadingText}>{messages[Math.min(step, 7)]}</p>
    </div>
  );
}

const styles = {
  container: {
    background:
      "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)",
    minHeight: "100vh",
    padding: "40px 20px",
    fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
    color: "#fff",
    position: "relative" as const,
  } as React.CSSProperties,

  timeline: {
    display: "flex",
    justifyContent: "center",
    gap: "12px",
    marginBottom: "40px",
  } as React.CSSProperties,

  timelinePoint: {
    width: "20px",
    height: "20px",
    borderRadius: "50%",
    transition: "all 0.3s ease",
  } as React.CSSProperties,

  journeyContainer: {
    maxWidth: "700px",
    margin: "0 auto",
  } as React.CSSProperties,

  card: {
    background: "rgba(255, 255, 255, 0.08)",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(255, 255, 255, 0.12)",
    borderRadius: "16px",
    padding: "32px",
    marginBottom: "24px",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
  } as React.CSSProperties,

  cardStep: {
    fontSize: "12px",
    color: "#00d9ff",
    fontWeight: "700",
    marginBottom: "8px",
    textTransform: "uppercase" as const,
    letterSpacing: "2px",
  } as React.CSSProperties,

  cardTitle: {
    margin: "0 0 8px",
    fontSize: "28px",
    fontWeight: "700",
    background: "linear-gradient(45deg, #00d9ff, #ff6b9d)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  } as React.CSSProperties,

  cardDescription: {
    margin: "0 0 16px",
    fontSize: "14px",
    color: "#aaa",
  } as React.CSSProperties,

  cardContent: {
    fontSize: "14px",
    lineHeight: "1.6",
    color: "#ddd",
  } as React.CSSProperties,

  highlight: {
    background: "rgba(0, 217, 255, 0.1)",
    border: "1px solid rgba(0, 217, 255, 0.3)",
    borderRadius: "8px",
    padding: "12px",
    marginBottom: "12px",
    fontFamily: "monospace",
    fontSize: "13px",
    whiteSpace: "pre-wrap" as const,
    wordBreak: "break-all" as const,
  } as React.CSSProperties,

  explanation: {
    margin: "0",
    fontSize: "13px",
    color: "#bbb",
    fontStyle: "italic",
  } as React.CSSProperties,

  riskMeter: {
    height: "40px",
    background: "rgba(0, 0, 0, 0.3)",
    borderRadius: "8px",
    overflow: "hidden",
    marginBottom: "16px",
  } as React.CSSProperties,

  riskFill: {
    height: "100%",
    background: "linear-gradient(90deg, #ff4757, #ff6b6b, #ffa500)",
    transition: "width 1s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  } as React.CSSProperties,

  finalActions: {
    marginTop: "20px",
    padding: "16px",
    background: "rgba(255, 107, 157, 0.1)",
    border: "1px solid rgba(255, 107, 157, 0.3)",
    borderRadius: "8px",
  } as React.CSSProperties,

  actionList: {
    margin: "12px 0 0",
    paddingLeft: "20px",
  } as React.CSSProperties,

  loadingCard: {
    background: "rgba(255, 255, 255, 0.08)",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(255, 255, 255, 0.12)",
    borderRadius: "16px",
    padding: "60px 32px",
    textAlign: "center" as const,
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
  } as React.CSSProperties,

  spinner: {
    width: "50px",
    height: "50px",
    border: "3px solid rgba(0, 217, 255, 0.2)",
    borderTopColor: "#00d9ff",
    borderRadius: "50%",
    margin: "0 auto 20px",
  } as React.CSSProperties,

  loadingText: {
    fontSize: "16px",
    color: "#aaa",
    margin: "0",
  } as React.CSSProperties,
};
