# SaltMarket — Test Plan

Danh sách test case cho SaltMarket, chia theo module (map 1-1 với file spec trong `tests/`).

**Priority:** P0 = smoke/critical (phải pass mới release) · P1 = functional/negative quan trọng · P2 = edge case

Cột **Tên test case** dùng làm tên hàm `test(...)` trong code, theo format `"<ID>: <tên>"` — ví dụ `test('AUTH-01: login with valid seeded user shows logged-in header', ...)`.

## 1. `auth.spec.js`

| ID | P | Tên test case | Case |
|---|---|---|---|
| AUTH-01 | P0 | login with valid seeded user shows logged-in header | Login đúng tài khoản seed → header chuyển sang trạng thái đã login, hiện `account-name` |
| AUTH-02 | P1 | login with invalid credentials shows error message | Login sai password hoặc email không tồn tại → cùng `login-error` "Invalid email or password" (không lộ user enumeration) |
| AUTH-03 | P0 | register new user redirects to shop as logged in | Register user mới hợp lệ → tự động login, redirect vào shop |
| AUTH-04 | P1 | register with duplicate email shows error | Register email đã tồn tại (kể cả khác hoa/thường, `lower(email)`) → lỗi "account already exists" |
| AUTH-05 | P1 | register with invalid email format shows error | Register email sai định dạng → lỗi "valid email address" |
| AUTH-06 | P1 | register with short password shows error | Register password < 6 ký tự → lỗi "at least 6 characters" |
| AUTH-07 | P2 | register with missing required field shows error | Register thiếu field bắt buộc (name/email/password) → lỗi |
| AUTH-08 | P0 | logout clears session and redirects to login | Logout → session clear, vào lại trang shop bị đá về login |
| AUTH-09 | P2 | auth me returns null when logged out | `GET /api/auth/me` khi chưa login → trả `null` |

## 2. `access-control.spec.js`

| ID | P | Tên test case | Case |
|---|---|---|---|
| GUARD-01 | P0 | visiting cart while logged out redirects to login with redirect param | Vào `/cart.html` khi chưa login → redirect `/login.html?redirect=/cart.html` |
| GUARD-02 | P0 | login from redirect returns to originally requested page | Login xong từ redirect → quay lại đúng trang ban đầu (`/cart.html`) |
| GUARD-03 | P1 | shop pages redirect to login when logged out | Lặp lại GUARD-01 cho `/checkout.html`, `/index.html`, `/product.html?id=` |
| GUARD-04 | P1 | shop API endpoints respond without a session | Gọi thẳng API (`GET /api/products`, `/api/cart`) khi không có session → vẫn trả data (login wall chỉ ở client) — test API-level riêng |
| GUARD-05 | P0 | non-admin visiting admin page sees access denied | User thường (non-admin) vào `/admin.html` → hiện `admin-denied`, không render bảng sản phẩm |
| GUARD-06 | P1 | non-admin calling admin API gets 403 | User thường gọi thẳng `POST/GET /api/admin/products` → `403` |
| GUARD-07 | P0 | admin can load admin page and sees admin link | Admin login → `/admin.html` load được bảng sản phẩm, thấy `admin-link` ở header |

## 3. `catalog.spec.js`

| ID | P | Tên test case | Case |
|---|---|---|---|
| CAT-01 | P0 | home page renders seeded product grid | Trang chủ load → `product-grid` hiện đủ sản phẩm seed |
| CAT-02 | P1 | filtering by category shows only matching products | Filter theo category → chỉ hiện đúng sản phẩm thuộc category, `results-info` cập nhật |
| CAT-03 | P1 | searching by product name returns matches | Search theo tên khớp |
| CAT-04 | P2 | searching by description keyword returns matches | Search theo từ khoá trong `description` |
| CAT-05 | P2 | search with no matches shows empty state | Search không match gì → hiện `empty-state` |
| CAT-06 | P1 | sorting by price ascending orders products correctly | Sort price ascending → đúng thứ tự |
| CAT-07 | P1 | sorting by price descending orders products correctly | Sort price descending → đúng thứ tự |
| CAT-08 | P2 | sorting by name ascending orders products correctly | Sort name ascending → đúng thứ tự |
| CAT-09 | P1 | pagination next/prev navigates pages correctly | Pagination next/prev → `page-indicator` đổi đúng, data đổi |
| CAT-10 | P2 | pagination buttons disable at first/last page | Nút prev disable ở trang đầu, next disable ở trang cuối |
| CAT-11 | P2 | combining filter, search, and sort returns correct results | Kết hợp filter + search + sort cùng lúc |
| CAT-12 | P0 | out-of-stock product has disabled add-to-cart button | Sản phẩm hết hàng (Maldon Sea Salt) → `add-to-cart-btn` disabled, `stock-badge` báo out of stock |
| CAT-13 | P2 | low-stock product shows low-stock badge | Sản phẩm sắp hết hàng (Black Truffle Salt) → `stock-badge` báo low stock |
| CAT-14 | P0 | adding product from catalog updates cart badge | Add to cart từ catalog card → `cart-badge` tăng đúng số |

## 4. `product-detail.spec.js`

| ID | P | Tên test case | Case |
|---|---|---|---|
| PDP-01 | P0 | product detail page shows correct product info | Click sản phẩm → detail page đúng name/price/description |
| PDP-02 | P1 | adding valid quantity to cart shows success message | Add to cart với qty hợp lệ → `add-success`, badge cập nhật |
| PDP-03 | P0 | adding quantity over stock shows error | Add to cart với qty > stock → `add-error`, cart không đổi |
| PDP-04 | P2 | zero or negative quantity is blocked | Nhập qty 0 hoặc âm → bị chặn / disable submit |
| PDP-05 | P2 | invalid product id shows error state | Truy cập `product.html?id=` với id không tồn tại → xử lý lỗi (404/empty state) |

## 5. `cart.spec.js`

| ID | P | Tên test case | Case |
|---|---|---|---|
| CART-01 | P0 | cart totals calculate correctly with items | Xem cart có item → line total, subtotal, tax, shipping, total đúng công thức |
| CART-02 | P1 | updating quantity recalculates totals | Sửa qty trong cart → totals tính lại đúng |
| CART-03 | P0 | updating quantity above stock shows error | Sửa qty vượt tồn kho → lỗi, qty không đổi |
| CART-04 | P1 | removing item updates cart and badge | Remove item → item biến mất, totals + badge cập nhật |
| CART-05 | P0 | applying SALT10 coupon applies 10% discount | Apply coupon `SALT10` → giảm đúng 10%, `discount-row` hiện |
| CART-06 | P1 | applying WELCOME15 coupon applies 15% discount | Apply coupon `WELCOME15` → giảm đúng 15% |
| CART-07 | P0 | applying invalid coupon shows error | Apply coupon sai → `coupon-error`, không có discount |
| CART-08 | P2 | coupon code is case-insensitive | Nhập coupon thường (`salt10`) → server tự uppercase, vẫn áp dụng |
| CART-09 | P1 | removing coupon clears discount | Remove coupon đã áp → discount mất, totals tính lại |
| CART-10 | P0 | discounted subtotal over $50 gets free shipping | Subtotal sau discount ≥ $50 → `shipping` = $0 |
| CART-11 | P1 | discounted subtotal under $50 charges shipping fee | Subtotal sau discount < $50 → `shipping` = $5.99 |
| CART-12 | P2 | empty cart shows empty state and blocks checkout | Cart rỗng → `empty-cart-message`, không cho checkout |

## 6. `checkout.spec.js`

| ID | P | Tên test case | Case |
|---|---|---|---|
| CHK-01 | P0 | completing checkout places order and redirects to confirmation | Checkout hợp lệ đầy đủ → đặt hàng thành công, redirect confirmation đúng order id/total |
| CHK-02 | P1 | missing required shipping field shows error | Thiếu field shipping bắt buộc (fullName/address/city/postalCode/country/email) → `checkout-error` đúng field |
| CHK-03 | P1 | invalid shipping email shows error | Email shipping sai định dạng → lỗi |
| CHK-04 | P0 | invalid card number shows error | Số thẻ không đủ/không đúng 16 số → lỗi "Card number must be 16 digits" |
| CHK-05 | P2 | card number with spaces is accepted | Số thẻ có khoảng trắng (`4111 1111 1111 1111`) → vẫn hợp lệ (server strip space) |
| CHK-06 | P1 | invalid expiry format shows error | Expiry sai format (không phải `MM/YY`) → lỗi |
| CHK-07 | P1 | invalid CVC shows error | CVC sai (không phải 3–4 số) → lỗi |
| CHK-08 | P2 | checkout with empty cart shows error | Checkout khi cart rỗng (gọi thẳng API hoặc vào thẳng URL) → lỗi "cart is empty" |
| CHK-09 | P1 | checkout fails when stock changes mid-flight | Stock đổi giữa chừng (sản phẩm hết hàng trước khi submit) → lỗi "no longer has enough stock" |
| CHK-10 | P1 | successful checkout decrements product stock | Sau khi đặt hàng thành công → stock bị trừ đúng số lượng |
| CHK-11 | P1 | successful checkout clears cart and coupon | Sau khi đặt hàng → cart và coupon bị clear |

## 7. `order-confirmation.spec.js`

| ID | P | Tên test case | Case |
|---|---|---|---|
| CONF-01 | P0 | confirmation page shows correct order id and total | Trang confirmation hiện đúng `order-id`, `order-total` |
| CONF-02 | P2 | invalid order id shows error state | Vào `/confirmation.html?orderId=` với id không tồn tại → xử lý lỗi |
| CONF-03 | P2 | continue shopping link returns to catalog | Link "Continue shopping" → quay về catalog |

## 8. `admin-products.spec.js`

| ID | P | Tên test case | Case |
|---|---|---|---|
| ADM-01 | P0 | adding a valid product appears in admin table and storefront | Add sản phẩm mới hợp lệ → xuất hiện trong bảng admin và catalog storefront |
| ADM-02 | P1 | adding product with missing field shows error | Add thiếu field bắt buộc → `admin-add-error` |
| ADM-03 | P1 | adding product with negative price shows error | Add với `price` âm → lỗi "Price must be zero or positive" |
| ADM-04 | P1 | adding product with negative stock shows error | Add với `stock` âm → lỗi "Stock must be zero or positive" |
| ADM-05 | P0 | editing product price/stock updates table and storefront | Edit price/stock sản phẩm có sẵn → cập nhật đúng ở bảng + storefront |
| ADM-06 | P2 | cancelling edit discards changes | Bấm Cancel khi đang edit → không lưu thay đổi |
| ADM-07 | P0 | deleting an unordered product removes it everywhere | Delete sản phẩm chưa từng nằm trong order nào → biến mất khỏi bảng + catalog |
| ADM-08 | P1 | deleting a product referenced by an order is blocked | Delete sản phẩm đã nằm trong 1 order (đặt hàng xong rồi mới xoá) → lỗi "Cannot delete a product that appears in existing orders", sản phẩm không bị xoá |
