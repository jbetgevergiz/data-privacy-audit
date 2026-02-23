import type { AppProps } from "next/app";
import { useEffect } from "react";

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Set some tracking pixels to demonstrate
    const img = new Image();
    img.src = "https://example.com/pixel.gif?id=" + Math.random();
  }, []);

  return <Component {...pageProps} />;
}
