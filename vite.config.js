import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { WebSocket, WebSocketServer } from "ws";

/**
 * Custom Vite plugin to proxy authenticated WebSocket connections.
 * In browser environments, native WebSocket cannot send custom headers during handshake.
 * This proxy bridges the browser connection and attaches the required
 * `Authorization: Bearer <token>` header to the upstream connection to `ts.idicorp.ir`.
 */
function websocketAuthProxyPlugin() {
  function setupWsProxy(httpServer) {
    if (!httpServer) return;

    const wss = new WebSocketServer({ noServer: true });

    httpServer.on("upgrade", (req, socket, head) => {
      let url;
      try {
        url = new URL(req.url || "", "http://localhost");
      } catch {
        return;
      }

      if (url.pathname.startsWith("/ws")) {
        wss.handleUpgrade(req, socket, head, (clientWs) => {
          const token = url.searchParams.get("token");
          const upstreamHeaders = {};

          if (token) {
            upstreamHeaders["Authorization"] = `Bearer ${token}`;
          }

          if (req.headers.cookie) {
            upstreamHeaders["Cookie"] = req.headers.cookie;
          }

          const targetUrl = `wss://ts.idicorp.ir${url.pathname}`;
          const upstream = new WebSocket(targetUrl, {
            headers: upstreamHeaders,
          });

          const pendingMessages = [];

          upstream.on("open", () => {
            while (pendingMessages.length > 0) {
              const item = pendingMessages.shift();
              upstream.send(item.data, { binary: item.isBinary });
            }
          });

          clientWs.on("message", (data, isBinary) => {
            if (upstream.readyState === WebSocket.OPEN) {
              upstream.send(data, { binary: isBinary });
            } else {
              pendingMessages.push({ data, isBinary });
            }
          });

          upstream.on("message", (data, isBinary) => {
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(data, { binary: isBinary });
            }
          });

          const safeClose = (targetWs, code, reason) => {
            if (targetWs.readyState === WebSocket.OPEN || targetWs.readyState === WebSocket.CONNECTING) {
              try {
                if (typeof code === "number" && code >= 1000 && code <= 4999 && code !== 1005 && code !== 1006) {
                  targetWs.close(code, reason);
                } else {
                  targetWs.close();
                }
              } catch {
                // Ignore close error
              }
            }
          };

          upstream.on("close", (code, reason) => {
            safeClose(clientWs, code, reason);
          });

          clientWs.on("close", (code, reason) => {
            safeClose(upstream, code, reason);
          });

          upstream.on("error", () => {
            safeClose(clientWs, 1011, "Upstream error");
          });

          clientWs.on("error", () => {
            safeClose(upstream, 1011, "Client error");
          });
        });
      }
    });
  }

  return {
    name: "vite-plugin-websocket-auth-proxy",
    configureServer(server) {
      setupWsProxy(server.httpServer);
    },
    configurePreviewServer(server) {
      setupWsProxy(server.httpServer);
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), websocketAuthProxyPlugin()],
  server: {
    proxy: {
      "/api": {
        target: "https://ts.idicorp.ir",
        changeOrigin: true,
        secure: true,
        cookieDomainRewrite: "",
      },
    },
  },
  preview: {
    proxy: {
      "/api": {
        target: "https://ts.idicorp.ir",
        changeOrigin: true,
        secure: true,
        cookieDomainRewrite: "",
      },
    },
  },
});
