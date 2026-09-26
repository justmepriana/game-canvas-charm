# Threadline backend

A small Express + TypeScript API for the Threadline fashion-store security game. It uses a process-local SQLite database and an in-memory player session; restarting the server resets both. No patch accepts or evaluates player-supplied code. Patches are narrow boolean configuration choices saved per session.

## Run it

Requires Node.js 20 or newer.

```sh
npm install
npm run dev
```

The API listens at `http://localhost:3000`. Set `PORT` to change the port. Set `FRONTEND_ORIGIN` to the exact frontend origin (for example `http://localhost:5173`) in a deployed setup. When unset, development CORS reflects the requesting origin and allows credentials. Sessions use an HttpOnly `threadline_session` cookie; clients may instead send the same session identifier as `x-session-id`. Use `credentials: 'include'` in browser fetch calls when using cookies. `/api/session` reports the current session ID and signed-in user ID. `/api/state` returns reputation and sales, each starting at 100 and never falling below zero.

All request and response bodies are JSON. Level checks return individual attack results, a pass status, OWASP category, explanation, and brand cost. Failed level checks apply that level's penalty. Level 5 applies its per-missed-message penalty on each check.

## Levels

### Level 1 — Login brute force

`POST /api/level-1/login` accepts `{ "email": "ava@threadline.test", "password": "password123" }`. Four fake accounts have weak demonstration passwords. Before patching, login has no throttling and compares the demo plaintext password; after patching, `POST /api/level-1/patch` with `{ "rateLimit": true, "bcrypt": true }` enables a five-attempt-per-minute limit and bcrypt hash comparison. The 20-attempt simulation checks both controls. Intended OWASP category: **A07:2021 – Identification and Authentication Failures**. Failed check penalty: **15 reputation, 10 sales**.

### Level 2 — Product search injection

`GET /api/level-2/search?q=...` searches seeded product names and descriptions. The vulnerable path concatenates the input into SQL; the patch `{ "useParameterizedQuery": true }` binds it as data. The check simulates boolean bypass, stacked statement, and UNION extraction attempts. Intended OWASP category: **A03:2021 – Injection**. Failed check penalty: **20 reputation, 15 sales**.

### Level 3 — Order access and price tampering

`POST /api/level-3/checkout` accepts `{ "orderId": 101, "price": 0.01 }`. Sign in through Level 1 to establish the session owner. The vulnerable path trusts the submitted price and order ID. Apply `{ "ownerCheck": true, "serverPrice": true }` to verify ownership and calculate the total from SQLite. Intended OWASP category: **A01:2021 – Broken Access Control**. Failed check penalty: **25 reputation, 20 sales**; this level represents unreleased design and payment exposure.

### Level 4 — Stored product reviews

`POST /api/level-4/reviews` stores review text and `GET /api/level-4/reviews?productId=2` returns it. Before patching, HTML is returned as submitted. Apply `{ "escapeOutput": true }` to HTML-escape at storage time; script and image event-handler markup become inert text. Intended OWASP category: **A03:2021 – Injection (stored XSS)**. Failed check penalty: **15 reputation, 5 sales**.

### Level 5 — Phishing inbox

`GET /api/level-5/inbox` returns six fictional brand emails. Submit suspected phishing IDs with `POST /api/level-5/flag`, `{ "emailIds": [2, 4, 6] }`, then call `POST /api/level-5/check`. IDs 2, 4, and 6 are the ground-truth phishing messages. The score is correct flags minus false positives; each missed real message costs **10 reputation and 5 sales**. This is a social-engineering judgment exercise, outside the OWASP Top 10 proper.

### Level 6 — Customer data minimization

`GET /api/level-6/orders/:id` models order lookup. Before patching it includes full customer data. Apply `{ "minimizePII": true }` to return limited fulfillment fields to unrelated sessions; a session signed in as the order owner may still access full detail. Intended category: **A01:2021 – Broken Access Control / privacy-by-design failure**. Failed check penalty: **20 reputation, 5 sales**, reflecting trust and privacy impact.

## Demo account

`ava@threadline.test` / `password123` (also see other seeded weak credentials in `src/db.ts`). Product and customer data are fictional and intended only for local gameplay.
