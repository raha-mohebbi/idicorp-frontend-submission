# IDICorp Frontend Challenge · مستندات فنی و راهنمای پروژه

این پروژه نسخه بازنویسی‌شده و بهینه‌سازی‌شده از چالش فرانت‌اند سازمانی **IDICorp** است که توسط یک مهندس ارشد فرانت‌اند (Senior Frontend Engineer) از نظر معماری، امنیت، استاندارد کدنویسی React 19، کارایی و تجربه کاربری (UX) به صورت کامل بازبینی و پیاده‌سازی شده است.

---

## ۱. مرور نیازمندی‌ها و چالش‌های کلیدی

1. **امنیت احراز هویت در برابر حملات XSS**: توکن احراز هویت تحت هیچ شرایطی نباید در حافظه‌های ذخیره‌سازی آسیب‌پذیر سمت کاربر (`localStorage` یا `sessionStorage`) نگه‌داری شود تا در صورت بروز هرگونه رخنه XSS، توکن توسط اسکریپت‌های مخرب قابل سرقت نباشد.
2. **ارسال توکن احراز هویت در هدر وب‌سوکت**:
   بر اساس دستورالعمل نیازمندی‌ها، توکن ورود دریافت شده باید در ارتباط وب‌سوکت در هدر ارسال گردد:
   ```javascript
   headers: {
     Authorization: `Bearer ${token}`
   }
   ```
3. **پوشش تمامی سرویس‌های مستند شده در ASSIGNMENT.md**:
   - احراز هویت دوگانه (Cookie + Bearer Token) با کپچای ریاضی پویا
   - سیستم مدیریت وظایف (Tasks CRUD) همراه با جست‌وجو و فیلتر برخط
   - وب‌سوکت ماشین‌حساب (`/ws/calculator`) با ارسال توکن در اولین فریم و دریافت نتیجه بلادرنگ
   - وب‌سوکت Echo (`/ws/echo`) با احراز هویت Handshake
   - سرویس پخش جریانی (`/api/echo/stream`) با `ReadableStream` و کنترل انصراف (`AbortController`)
4. **کیفیت کد و خطاناپذیری**:
   - پاس شدن کامل و بدون خطای `npm run lint` (ESLint React 19 rules)
   - ساخت بدون خطا با `npm run build`
   - مدیریت استیت تمیز بدون Memory Leak و بازگشت خطاهای فارسی معنادار

---

## ۲. معماری امنیت و مقابله با XSS (Authentication Architecture)

### چرا `localStorage` و `sessionStorage` ناامن هستند؟
هر اسکریپتی که در کانتکست صفحه اجرا شود (از جمله افزونه‌های مخرب مرورگر، پکیج‌های شخص ثالث آلوده، یا حملات XSS ناشی از ورودی‌های ناامن)، به شیء `window.localStorage` و `window.sessionStorage` دسترسی کامل و سنکرون دارد. ذخیره توکن در این فضاها دسترسی دائم و بی‌واسطه را به مهاجم می‌دهد.

### راهکار پیاده‌سازی شده: حافظه بسته ماژول (In-Memory Module Closure)
- توکن دسترسی (`accessToken`) تنها در یک متغیر محلی در اسکوپ بسته فایل [`src/lib/api.js`](src/lib/api.js) ذخیره می‌شود:
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
- متغیر `inMemoryAccessToken` مستقیماً از بیرون ماژول قابل دسترسی نیست و فقط از طریق اینترفیس‌های معتبر خوانده و نوشته می‌شود.
- در کنار توکن Bearer درون حافظه، سرور کوکی امن سشن (`HttpOnly; Secure; SameSite=Lax`) تنظیم می‌کند؛ بنابراین در درخواست‌های Axios و `fetch` مقدار `withCredentials: true` فعال است تا احراز هویت دوگانه به درستی انجام گیرد.
- هنگام خروج از حساب (`logout`) یا دریافت خطای `401 Unauthorized` در Axios interceptor، توکن به صورت آنی صفر شده و سشن کاربر خاتمه می‌یابد.

---

## ۳. معماری ارسال هدر در وب‌سوکت (WebSocket Authentication)

### محدودیت پروتکل در مرورگرها
بر اساس استاندارد W3C برای API شیء `new WebSocket(url, [protocols])` در مرورگرهای وب، امکان پاس دادن مستقیم آبجکت هدرهای سفارشی HTTP (نظیر هدر `Authorization`) وجود ندارد:
```javascript
// غیراستاندارد و توسط مرورگر پشتیبانی نمی‌شود:
new WebSocket(url, { headers: { ... } }); // TypeError در مروگر
```

### راهکار حل معماری در این پروژه:
۱. **کلاینت فرانت‌اند (`src/lib/socket.js`)**:
یک ابزار سفارشی و انتزاعی به نام `createWebSocket(endpoint, options)` طراحی شده که پارامتر `headers: { Authorization: \`Bearer ${token}\` }` را دقیقاً طبق نیازمندی پروژه دریافت می‌کند:
```javascript
import { createWebSocket } from "../lib/socket";

const socket = createWebSocket("/ws/echo", {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
```

۲. **پروکسی توسعه و پیش‌نمایش در Vite (`vite.config.js`)**:
پلاگین اختصاصی `websocketAuthProxyPlugin` با استفاده از کتابخانه استاندارد `ws` بر روی سرور توسعه و پیش‌نمایش Vite قرار داده شده است. هنگام برقراری اتصال وب‌سوکت از سمت مرورگر، پلاگین توکن احراز هویت را شناسایی کرده و در فرآیند ارتقای پروتکل (HTTP Upgrade Handshake) هدر زیر را به سرور بالادستی (`wss://ts.idicorp.ir`) الصاق می‌کند:
```javascript
const upstream = new WebSocket(targetUrl, {
  headers: {
    Authorization: `Bearer ${token}`,
    Cookie: clientReq.headers.cookie || "",
  },
});
```

۳. **تنظیمات محیط استقرار در سرورهای Production (Nginx Reverse Proxy)**:
برای محیط‌های عملیاتی نیز، وب‌سرور/پروکسی معکوس (مانند Nginx یا Envoy) همین وظیفه را بر عهده می‌گیرد:
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

## ۴. بازبینی کدهای برنامه نویس جونیور و اصلاحات انجام‌شده

| شماره | مشکل کد قبلی (Junior Code) | اصلاح اعمال‌شده (Senior Solution) |
|---|---|---|
| ۱ | ذخیره توکن در `sessionStorage` (آسیب‌پذیر به XSS) | بازنویسی کامل به مدل In-Memory Closure در `src/lib/api.js` |
| ۲ | عدم ارسال هدر Authorization در اتصال Echo WS و دریافت ۴۰۳ | ایجاد ماژول `createWebSocket` و پل ارتباطی Vite proxy با هدر Bearer |
| ۳ | خطای عدم ارسال به موقع توکن ماشین‌حساب (۱ ثانیه اول) | بررسی `readyState === WebSocket.OPEN` فوری و اتصال امن پیام آغازین |
| ۴ | خطاهای هشداری React 19 در ESLint (`set-state-in-effect`, `purity`) | انتقال فراخوانی کپچا به بیرون کامپوننت و مدیریت بدون side-effect سنکرون |
| ۵ | نشتی حافظه در Echo Streaming هنگام خروج از صفحه | استفاده از `AbortController` و لغو درخواست در `useEffect cleanup` |
| ۶ | استفاده از `window.confirm` مسدودکننده در حذف تسک | ساخت مدال تأییدیه زیبا، دسترس‌پذیر (A11y) و هماهنگ با دیزاین سیستم |
| ۷ | خطاهای شبکه بدون ترجمه و سردرگمی کاربر | تابع متمرکز `getErrorMessage` با پیام‌های شفاف فارسی بر اساس پاسخ API |
| ۸ | نمایش تاریخ‌های میلادی خام یا ناقص | فرمت‌دهی کامل تاریخ‌های شمسی با استفاده از `Intl.DateTimeFormat` |

---

## ۵. راهنمای نصب، اجرا و تست

### پیش‌نیازها
- **Node.js**: نسخه ۱۸ به بالا
- **npm**: نسخه ۹ به بالا

### دستورات اجرایی

```bash
# نصب وابستگی‌ها
npm install

# اجرای سرور توسعه با پشتیبانی از وب‌سوکت پروکسی هدرها
npm run dev

# بررسی کیفیت کد و استاندارد ESLint (بدون خطا یا هشدار)
npm run lint

# بیلد نهایی پروژه
npm run build

# اجرای پیش‌نمایش نسخه بیلد شده
npm run preview
```

### اطلاعات حساب تست پیش‌فرض
- **نام کاربری**: `admin`
- **رمز عبور**: `admin`
- **کپچا**: پاسخ محاسبه ریاضی نمایش داده شده در تصویر
