# 🧂 SaltMarket

A mock e-commerce store selling gourmet and culinary salt — built as a **target app for practicing Playwright test automation**, not a real store.

It's a small but realistic online shop: product catalog with search/filter/sort, cart, coupon codes, checkout with validation, order confirmation, login/register, and an admin dashboard for managing products — all backed by a real PostgreSQL database.

## Tech stack

- **Backend:** Node.js + Express
- **Database:** PostgreSQL, run via Docker Compose
- **Frontend:** plain HTML/CSS/JS (no build step, no framework)

## Getting started

Requires [Docker](https://www.docker.com/) (for Postgres) and Node.js.

```bash
npm install
npm run db:up      # starts Postgres in Docker
npm start           # migrates the schema, seeds data, and serves the app
```

Then open **http://localhost:3000**.

When you're done:

```bash
npm run db:down     # stop the Postgres container
```

### npm scripts

| Script | What it does |
| --- | --- |
| `npm start` | Runs the Express server (auto-migrates + seeds on first boot) |
| `npm run db:up` | Starts the Postgres container |
| `npm run db:down` | Stops the Postgres container |
| `npm run db:logs` | Tails the Postgres container logs |

## Pages

| Page | Path |
| --- | --- |
| Home / catalog | `/index.html` |
| Product detail | `/product.html?id=<id>` |
| Cart | `/cart.html` |
| Checkout | `/checkout.html` |
| Order confirmation | `/confirmation.html?orderId=<id>` |
| Login | `/login.html` |
| Register | `/register.html` |
| Admin dashboard | `/admin.html` (admin account only) |

## Test data

- **Seeded login:** `test@saltmarket.com` / `password123`
- **Seeded admin login:** `admin@saltmarket.com` / `admin123`
- **Coupon codes:** `SALT10` (10% off), `WELCOME15` (15% off)
- **Free shipping** kicks in once the discounted subtotal reaches $50
- A couple of products are seeded **out of stock** (Maldon Sea Salt, Eucalyptus Bath Salt) and a couple are **low stock** (Black Truffle Salt, Himalayan Salt Block) — useful for edge-case tests

## Resetting state for tests

```
POST /api/reset
```

Wipes the database (cart, orders, registered users, product stock) and re-seeds it from scratch. Call this in your test setup (e.g. a Playwright `beforeEach` or global setup) to start every test from a clean, known state.

## API reference

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/categories` | List distinct product categories |
| GET | `/api/products` | List products (`search`, `category`, `sort`, `page`, `pageSize` query params) |
| GET | `/api/products/:id` | Get one product |
| GET | `/api/cart` | Get the current cart (items + totals) |
| POST | `/api/cart` | Add `{ productId, quantity }` to the cart |
| PATCH | `/api/cart/:productId` | Set `{ quantity }` for a cart line |
| DELETE | `/api/cart/:productId` | Remove an item from the cart |
| POST | `/api/cart/coupon` | Apply `{ code }` |
| DELETE | `/api/cart/coupon` | Remove the applied coupon |
| POST | `/api/checkout` | Place an order: `{ shipping, payment }` |
| GET | `/api/orders/:id` | Get a placed order |
| POST | `/api/auth/register` | Register `{ name, email, password }` |
| POST | `/api/auth/login` | Login `{ email, password }` |
| POST | `/api/auth/logout` | Log out |
| GET | `/api/auth/me` | Get the current logged-in user (or `null`) |
| POST | `/api/reset` | Reset the database to seed data |
| GET | `/api/admin/products` | *(admin only)* List all products |
| POST | `/api/admin/products` | *(admin only)* Create a product |
| PATCH | `/api/admin/products/:id` | *(admin only)* Update a product |
| DELETE | `/api/admin/products/:id` | *(admin only)* Delete a product (fails with 400 if it appears in existing orders) |

The cart is tracked per-browser via an `sid` cookie, so it works without logging in (guest checkout). Admin routes are gated server-side by the logged-in user's `is_admin` flag — a non-admin gets a `403`.

## `data-testid` reference

Every interactive element carries a `data-testid` so Playwright locators don't depend on CSS classes or text content.

| Area | Testids |
| --- | --- |
| Header | `search-input`, `cart-link`, `cart-badge`, `login-link`, `account-name`, `logout-btn` |
| Catalog | `category-filters`, `category-btn`, `sort-select`, `results-info`, `product-grid`, `product-card`, `product-name`, `product-price`, `stock-badge`, `add-to-cart-btn`, `empty-state`, `pagination-prev`, `pagination-next`, `page-indicator` |
| Product detail | `product-detail-name`, `product-detail-price`, `product-detail-description`, `qty-input`, `add-to-cart-btn`, `add-error`, `add-success`, `back-to-shop-link` |
| Cart | `cart-table`, `cart-item`, `cart-item-name`, `cart-item-price`, `qty-input`, `cart-item-line-total`, `remove-btn`, `coupon-input`, `apply-coupon-btn`, `coupon-error`, `coupon-applied`, `subtotal`, `discount-row`, `shipping`, `tax`, `cart-total`, `checkout-btn`, `empty-cart-message` |
| Checkout | `shipping-fullName`, `shipping-email`, `shipping-address`, `shipping-city`, `shipping-postalCode`, `shipping-country`, `payment-cardNumber`, `payment-expiry`, `payment-cvc`, `checkout-error`, `place-order-btn`, `order-summary` |
| Confirmation | `confirmation-title`, `order-id`, `order-total`, `continue-shopping-link` |
| Login | `login-email`, `login-password`, `login-submit`, `login-error`, `go-to-register` |
| Register | `register-name`, `register-email`, `register-password`, `register-confirm`, `register-submit`, `register-error`, `go-to-login` |
| Admin | `admin-link` (header), `admin-denied`, `admin-add-form`, `admin-add-name`, `admin-add-category`, `admin-add-price`, `admin-add-stock`, `admin-add-unit`, `admin-add-emoji`, `admin-add-description`, `admin-add-submit`, `admin-add-error`, `admin-add-success`, `admin-product-table`, `admin-product-row`, `admin-product-name`, `admin-product-price`, `admin-product-stock`, `admin-edit-btn`, `admin-edit-name`, `admin-edit-category`, `admin-edit-price`, `admin-edit-stock`, `admin-edit-unit`, `admin-save-btn`, `admin-cancel-btn`, `admin-delete-btn`, `admin-table-error` |

## Suggested first tests

- Browse → filter by category → sort by price → add an item to cart
- Add an out-of-stock item (button should be disabled)
- Apply a valid coupon (`SALT10`) vs. an invalid one
- Checkout with invalid card number/expiry/CVC and confirm the error message
- Complete a full checkout and land on the confirmation page with the right order number
- Register with a duplicate email and confirm the error
- Login with the seeded account, confirm the header switches to the logged-in state, then log out
- Visit `/admin.html` while logged out or as a non-admin, confirm access is denied
- Login as the admin, add a new product, edit its price/stock, then delete it and confirm it disappears from the catalog

---

*This is a demo project for learning/practicing test automation. It is not a real store — don't enter real payment details.*
