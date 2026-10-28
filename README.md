# IDICorp Frontend Challenge · Technical Documentation & Project Guide

This project is a rewritten and optimized implementation of the **IDICorp Enterprise Frontend Challenge**, thoroughly reviewed and implemented with a focus on architecture, security, React 19 coding standards, performance, and user experience (UX).

---

## 1. Requirements Overview & Key Challenges

1. **XSS-Resistant Authentication Security:** Authentication tokens must never be stored in vulnerable client-side storage mechanisms such as `localStorage` or `sessionStorage`. This prevents malicious scripts from directly retrieving tokens from these storage locations in the event of an XSS vulnerability.

2. **Authentication Token Forwarding in WebSocket Headers:**

   According to the project requirements, the received authentication token must be included in the WebSocket connection headers:

   ```javascript
   headers: {
     Authorization: `Bearer ${token}`
   }
   ```

3. **Complete Coverage of All Services Documented in `ASSIGNMENT.md`:**
   - Dual authentication using cookies and Bearer tokens, with a dynamic mathematical CAPTCHA.
   - Task management (CRUD) with real-time search and filtering.
   - Calculator WebSocket (`/ws/calculator`) with token transmission in the initial frame and real-time result handling.
   - Echo WebSocket (`/ws/echo`) with handshake authentication.
   - Streaming service (`/api/echo/stream`) using `ReadableStream` and cancellation through `AbortController`.

4. **Code Quality and Reliability:**
   - Pass `npm run lint` without errors, following React 19 ESLint rules.
   - Build successfully with `npm run build`.
   - Maintain clean state management without memory leaks and provide meaningful error messages in Persian.

---

## 2. Authentication Architecture & XSS Protection

### Why Are `localStorage` and `sessionStorage` Insecure?

Any script executing within the page's context—including malicious browser extensions, compromised third-party packages, or malicious scripts injected through XSS vulnerabilities—can access `window.localStorage` and `window.sessionStorage` directly and synchronously.

Storing authentication tokens in these locations gives an attacker direct access to the stored credentials.

### Implemented Solution: In-Memory Module Closure

- The access token (`accessToken`) is stored exclusively in a local variable within the module scope of [`src/lib/api.js`](src/lib/api.js):

  ```javascript
  let inMemoryAccessToken = null;

  export function setAccessToken(token) {
    inMemoryAccessToken = token || null;
    notifyAuthChange(isAuthenticated());
  }

  export function getAccessToken() {
    return inMemoryAccessToken;
  }
  ```

- The `inMemoryAccessToken` variable cannot be accessed directly from outside the module. It can only be read or updated through the exported interface functions.

- In addition to the in-memory Bearer token, the server sets a secure session cookie using `HttpOnly; Secure; SameSite=Lax`. Consequently, `withCredentials: true` is enabled for Axios requests, and credentials are included in `fetch` requests to support dual authentication.

- When the user logs out or an Axios interceptor receives a `401 Unauthorized` response, the in-memory token is immediately cleared and the user session is terminated.

---

## 3. WebSocket Authentication & Header Forwarding Architecture

### Browser Protocol Limitations

According to the browser WebSocket API, the standard `new WebSocket(url, protocols)` constructor does not support passing arbitrary custom HTTP headers, such as the `Authorization` header, directly from browser JavaScript.

```javascript
// Unsupported by the standard browser WebSocket API:
new WebSocket(url, {
  headers: { ... }
}); // TypeError in browsers
```

### Implemented Architectural Solution

#### 1. Frontend Client (`src/lib/socket.js`)

A custom abstraction named `createWebSocket(endpoint, options)` has been implemented. It accepts a `headers` parameter containing the required authorization information:

```javascript
import { createWebSocket } from "../lib/socket";

const socket = createWebSocket("/ws/echo", {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
```

#### 2. Vite Development and Preview Proxy (`vite.config.js`)

A custom plugin named `websocketAuthProxyPlugin` has been implemented using the standard `ws` library and integrated into the Vite development and preview servers.

When the browser initiates a WebSocket connection, the plugin extracts the authentication token and attaches the following headers during the HTTP Upgrade handshake to the upstream server at `wss://ts.idicorp.ir`:

```javascript
const upstream = new WebSocket(targetUrl, {
  headers: {
    Authorization: `Bearer ${token}`,
    Cookie: clientReq.headers.cookie || "",
  },
});
```

#### 3. Production Deployment Configuration (Nginx Reverse Proxy)

In production environments, a reverse proxy such as Nginx or Envoy can perform the same header-forwarding operation:

```nginx
location /ws/ {
    proxy_pass https://ts.idicorp.ir/ws/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host ts.idicorp.ir;
    proxy_set_header Authorization $http_authorization;
    proxy_read_timeout 86400;
}
```

---

## 4. Code Review: Junior Implementation vs. Senior-Level Improvements

| # | Previous Issue (Junior Implementation) | Applied Improvement (Senior-Level Solution) |
|---|---|---|
| 1 | Authentication tokens stored in `sessionStorage`, exposing them to potential XSS attacks. | Replaced token storage with an in-memory module closure in `src/lib/api.js`. |
| 2 | Missing `Authorization` header in the Echo WebSocket connection, resulting in HTTP 403 errors. | Introduced the `createWebSocket` module and a Vite proxy bridge for forwarding Bearer authentication headers. |
| 3 | Calculator WebSocket token not being sent promptly during the first second after connection. | Added an immediate `readyState === WebSocket.OPEN` check and reliable handling of the initial authentication message. |
| 4 | React 19 ESLint warnings, including `set-state-in-effect` and `purity` violations. | Moved CAPTCHA generation outside the component and implemented state management without synchronous side effects. |
| 5 | Memory leaks in Echo Streaming when navigating away from the page. | Integrated `AbortController` and request cancellation in the `useEffect` cleanup function. |
| 6 | Blocking `window.confirm` dialogs used for task deletion. | Implemented a visually polished, accessible confirmation modal consistent with the design system. |
| 7 | Network errors displayed without translation, causing user confusion. | Introduced a centralized `getErrorMessage` function that maps API responses to clear, meaningful Persian messages. |
| 8 | Raw or incomplete Gregorian date displays. | Implemented full Persian (Jalali) date formatting using `Intl.DateTimeFormat`. |

---

## 5. Installation, Execution & Testing Guide

### Prerequisites

- **Node.js:** Version 18 or later.
- **npm:** Version 9 or later.

### Available Commands

```bash
# Install dependencies
npm install

# Start the development server with WebSocket header proxy support
npm run dev

# Run ESLint to check code quality
npm run lint

# Build the production bundle
npm run build

# Preview the production build locally
npm run preview
```

### Default Test Account

- **Username:** `admin`
- **Password:** `admin`
- **CAPTCHA:** Enter the result of the mathematical expression displayed in the CAPTCHA.

---

*This documentation describes the intended architecture and implementation of the IDICorp Frontend Challenge. Production behavior depends on the actual deployment configuration and the availability of the upstream API services.*
