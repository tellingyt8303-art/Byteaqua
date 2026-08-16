# byteAqua — Water Delivery PWA

*Powered by Byteforge Information Technology*

Mobile-first, installable Progressive Web App for the water delivery platform. Pure HTML/CSS/JS — no build step required.

## Run locally

```bash
# from this folder
python3 -m http.server 8080
# or
npx serve .
```

Open `http://localhost:8080` on your phone (same network) or in Chrome DevTools mobile view.

## Connect to your backend

By default the app calls `http://localhost:5000/api` (the `water-delivery-backend` project). To point it elsewhere, set this before `js/api.js` loads, e.g. in `index.html`:

```html
<script>window.API_BASE_URL = 'https://your-api-domain.com/api';</script>
<script src="js/api.js"></script>
```

## What's included

- **Home**: hero, active-plan status card, product grid (with a droplet stock indicator — green/amber/red fill shows stock level), subscription plan teaser
- **Cart**: bottom-sheet drawer, quantity steppers, persists in localStorage
- **Auth**: login, signup (captures name/phone/email/password + delivery address & pincode), forgot password, change password — wired to the backend's JWT auth endpoints
- **Checkout**: address + pincode, COD or online payment selection, order summary, places order via `/api/orders`
- **Plans**: daily/weekly/monthly subscription selection per product
- **Account**: order history, active subscriptions, logout

## PWA features

- `manifest.json` — installable, standalone display, themed splash
- `sw.js` — caches the app shell for offline use; API calls always go to network (never cached, so stock/orders stay live)
- Icons generated as a droplet mark (regular + maskable variants) in `icons/`

## Notes

- If the backend is unreachable, the product grid falls back to sample data (`FALLBACK_PRODUCTS` in `js/app.js`) so the UI is still browsable.
- Online payment currently creates the Razorpay order server-side; add `Checkout.js` script + `Razorpay` handler in `Checkout.placeOrder()` to open the actual payment sheet.
- To test "Add to Home Screen" on mobile, the site must be served over HTTPS (or localhost) — deploy to Vercel/Netlify/any static host for a real device test.
