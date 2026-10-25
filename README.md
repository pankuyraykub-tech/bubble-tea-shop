# Bubble Tea ordering site

## Run locally
1. Install Node.js 18+.
2. In this folder run `npm install`.
3. Start with `npm start`.
4. Open http://localhost:3000 for the customer storefront.
5. Open http://localhost:3000/admin for the order dashboard.

Default admin key for local demo: `bubble-admin-1234`

For deployment, set `ADMIN_KEY` to a long unique secret and `PORT` if needed. This starter persists orders to `orders.json`. Use a persistent disk when hosting; ephemeral server storage can lose orders. It is a real server-backed order submission flow, but it does not include payment processing, SMS notifications, delivery tracking, or a hosted database. Add those integrations before commercial production. Set your real shop address, delivery fee, operating hours, and payment options before publishing.
