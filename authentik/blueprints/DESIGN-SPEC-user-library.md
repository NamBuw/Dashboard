# Design Spec — Pthentik User Portal (trang `/if/user/#/library`)

> Mục tiêu: thiết kế lại trang người dùng nhìn thấy **sau khi đăng nhập** thành một
> "cổng ứng dụng P-Ecosystem" gọn, sang, có bản sắc PTIT — thay cho giao diện
> "Application Dashboard" trống trơn hiện tại. KHÔNG đụng logic SSO.

## 0. Bối cảnh đã xác minh (không đoán)

- Component: `ak-library-impl` (Shadow DOM, base `AKElement`) → `branding_custom_css` adopt vào shadow root được (giống flow login).
- DOM thật:
  - `.pf-c-page__main` > `.pf-c-page__header.pf-c-content` ( `h1.pf-c-page__title` + `<search>` ) > `main#main-content`
  - Thẻ app: `[part="card-wrapper"]` > `[part="card"].pf-c-card` > `ak-app-icon` + `[part="card-header"]`/`[part="card-title"] .clamp-wrapper` (tên) + menu `[part="card-header-actions"]`
  - Nhóm: `[part="app-group-header"]`, `[part="app-group"]`, `[part="app-list"]`
  - Trạng thái rỗng: `ak-library-application-empty-list`
- Tiêu đề `"Application Dashboard"` hard-code → đổi bằng CSS (ẩn chữ gốc, chèn `::after`).
- Mặt thẻ chỉ hiện **icon + tên**; mô tả/publisher nằm trong menu ⋮.
- App hiện khi `launchUrl` hợp lệ; metadata trống = thẻ sơ sài.

## 1. Định hướng thiết kế (design thesis)

**Chủ thể:** Hệ sinh thái sản phẩm của PTIT (KidMentor, P-Assistant, Dashboard, P-Talk…).
**Người dùng:** chủ tài khoản / phụ huynh / trẻ / người lớn tuổi (nhóm AccountOwner/Child/Elder) —
vào để **tìm & mở nhanh** đúng app của mình.
**Một việc duy nhất của trang:** chọn & mở app.

**Tinh thần:** "portal" tin cậy, ấm, sạch. Một điểm nhấn đậm duy nhất = **đỏ PTIT (#c8102e)**;
mọi thứ còn lại tiết chế. Tránh 3 "mặc định AI" (cream+serif, nền đen+xanh acid, broadsheet).

## 2. Token hệ thống

### Màu (4–6 hex có tên)
- `--p-crimson: #c8102e`   — đỏ PTIT, điểm nhấn DUY NHẤT (tiêu đề-accent, hover, viền)
- `--p-crimson-deep: #98091f` — hover/active đậm
- `--p-ink: #18181b`       — chữ chính
- `--p-slate: #6b7280`     — chữ phụ / caption
- `--p-paper: #fbfbfd`     — nền trang (gần trắng, hơi lạnh — KHÔNG dùng cream)
- `--p-mist: #fdf2f3`      — panel/thẻ tint đỏ rất nhạt; hairline `rgba(200,16,46,.14)`

### Kiểu chữ (2 vai trò, chọn có chủ đích)
- **Display (tiêu đề):** *Be Vietnam Pro* — typeface thiết kế CHO tiếng Việt → hợp một học viện
  Việt Nam, không generic. Weight 700/600, letter-spacing hơi âm.
- **Body/UI:** giữ font sẵn của authentik (Red Hat Text / system) hoặc Be Vietnam Pro 400/500.
- Nạp an toàn CSP: **self-host** file font đặt ở `media/public/`, khai `@font-face url(/media/public/…woff2)`
  (cùng origin → không bị CSP chặn như Google Fonts). Có fallback `system-ui`.

### Layout
- Giữ nguyên khung SPA. Đổi header: **lời chào + tên cổng** bên trái, ô search bên phải.
- Lưới thẻ: giữ auto-fill của authentik, **restyle tile**: vuông bo góc, nền trắng,
  vạch accent đỏ trên đỉnh, logo ở giữa, tên dưới, hover nâng + viền đỏ.
- Header nhóm (`app-group`): nhãn nhỏ chữ hoa giãn cách, gạch hairline đỏ.
- Dải chân trang mảnh: "Sản phẩm của PTIT — hệ sinh thái P-Ecosystem".
- Nền: `--p-paper` + **motif chữ ký** (xem dưới), KHÔNG dùng sketch campus (rối sau nhiều thẻ).

### Signature (thứ duy nhất để nhớ)
**Hệ "capsule P-Ecosystem":** mỗi app là một tile nhất quán (accent đỏ + logo + tên, hover nâng/ring),
neo bởi **một monogram "P" cỡ lớn, mờ ~3–4%** ở góc dưới-phải trang. Bold đúng một chỗ; còn lại tĩnh.

```
┌──────────────────────────────────────────────────────────────┐
│  Xin chào 👋                                  [ 🔍 Tìm app… ]   │   ← header: greeting (Be Vietnam Pro) + search
│  Ứng dụng của bạn · P-Ecosystem                                │
│  ────────────────────────────────────────────                 │   ← hairline đỏ mảnh
│                                                                │
│  GIÁO DỤC & TRỢ LÝ                                             │   ← group header (nếu set group)
│  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐               │
│  │▔▔▔▔▔▔▔▔│  │▔▔▔▔▔▔▔▔│  │ accent │  │        │               │   ← vạch đỏ đỉnh tile
│  │  [LOGO] │  │  [LOGO] │  │ [LOGO] │  │ [LOGO] │               │
│  │KidMentor│  │P-Assist │  │Dashboard│ │ P-Talk │               │
│  └────────┘  └────────┘  └────────┘  └────────┘               │
│                                                          ◜P◞   │   ← monogram mờ (signature)
│  ──────────────────────────────────────────────────────────   │
│        Sản phẩm của PTIT — hệ sinh thái P-Ecosystem            │   ← footer brand
└──────────────────────────────────────────────────────────────┘
```

## 3. Thay đổi cụ thể

### A. CSS (thêm vào `branding_custom_css`, scope riêng trang library — không đụng flow)
1. Nền trang `--p-paper` + monogram mờ (pseudo trên `.pf-c-page__main`).
2. Tiêu đề: ẩn chữ "Application Dashboard", chèn lời chào + dòng phụ (Be Vietnam Pro, accent đỏ).
3. Search: bo tròn, nền `--p-mist`, focus viền đỏ.
4. Tile: nền trắng, radius ~16px, shadow nhẹ, **vạch accent đỏ đỉnh**, hover nâng + ring đỏ.
5. `ak-app-icon`: canh giữa đẹp; fallback lettermark đổi sang nền đỏ nhạt/chữ đỏ (đỡ xấu khi thiếu logo).
6. Header nhóm: nhãn chữ hoa nhỏ + hairline đỏ.
7. Footer brand "Sản phẩm của PTIT…".
8. Empty-state: nếu user chưa có app → khối thông báo thân thiện (icon + câu tiếng Việt) thay vì mặc định.
9. Responsive: mobile 1 cột, padding gọn (giống cách đã xử lý cho login).

### B. Metadata app (blueprint riêng, CHỈ metadata — không đụng provider/flow)
- Set `group` (vd "Giáo dục & Trợ lý", "Quản trị") → có header nhóm.
- Set `meta_description`, `meta_publisher: "PTIT · P-Ecosystem"` → menu ⋮ có nội dung.
- Set `meta_icon` = logo từng app → mặt tile có hình (đòn bẩy hình ảnh lớn nhất).

### C. Icon
- Phương án nhanh + nhất quán: tạo **SVG monogram đỏ** cho từng app (cùng style) đặt ở `media/public/`.
- Hoặc dùng **logo sản phẩm thật** nếu có sẵn trong repo (KidMentor/Dashboard…).

## 4. An toàn (ràng buộc của bạn: không vỡ SSO)
- Chỉ sửa `authentik_brands.brand.branding_custom_css` (1 field CSS) + metadata app (icon/desc/group).
- KHÔNG đụng provider, flow, redirect_uris, scope, policy.
- CSS library dùng selector chỉ tồn tại ở `/if/user/` (`.pf-c-page__title`, `[part="card*"]`…),
  flow dùng `.pf-c-login*` → không xung đột. Áp blueprint atomic, rollback dễ.

## 5. Cần xác minh khi build
- Xem trang ở trạng thái ĐÃ đăng nhập (cần 1 tài khoản test) để chụp DOM/computed-style thật,
  xác nhận `branding_custom_css` reach `/if/user/` (kỳ vọng có, cùng cơ chế adopt như flow).
- Kiểm tra app nào thực sự hiện (theo `appHasLaunchUrl`) cho user thường.
