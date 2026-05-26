# Tài liệu Nghiệp vụ — Dashboard Quản lý Hệ sinh thái Sản phẩm

> **Phiên bản:** 1.0
> **Ngày:** 14/05/2026
> **Đơn vị:** YIRLODT Laboratory — PTIT

---

## 1. Bối cảnh & Mục tiêu

### 1.1 Hiện trạng

Hệ sinh thái hiện có 3 sản phẩm phục vụ hai nhóm đối tượng chính (trẻ em & người cao tuổi):

| Sản phẩm                | Thành phần                | Mô tả                                                                                                                                                      | Đối tượng                                                               |
| ------------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------- |
| **PTalk Assistant** | Robot PTalk + App quản lý | Robot assistant giao tiếp với người già & trẻ em. App cho phép account owner quản lý & cấu hình nhiều robot, mỗi robot gán cho**1 user** | Account owner (gia đình) + 1 user/robot (trẻ em hoặc người cao tuổi) |
| **Kid Mentor**      | App mobile                  | App gia sư học tập                                                                                                                                        | Trẻ em (trực tiếp, không có role phụ huynh)                           |
| **Elder Kare**      | App mobile                  | App chăm sóc người cao tuổi                                                                                                                             | Người cao tuổi (trực tiếp, không có role người thân)              |

### 1.2 Vấn đề User hiện tại

Mỗi sản phẩm quản lý user riêng. Cụ thể, cấu trúc user hiện tại như sau:

```
PTalk Assistant
├── Account Owner (người mua/quản lý)     ← user chính, đăng nhập app
│   ├── Robot A → gán cho: Bé An          ← 1 robot = 1 user
│   ├── Robot B → gán cho: Ông Bình       ← 1 robot = 1 user
│   └── Robot C → gán cho: Bé Chi
│
Kid Mentor                                 ← KHÔNG có role phụ huynh
├── User: Bé An                            ← CÙNG người nhưng KHÁC user ID
├── User: Bé Chi
│
Elder Kare                                 ← KHÔNG có role người thân
├── User: Ông Bình                         ← CÙNG người nhưng KHÁC user ID
```

**Vấn đề cốt lõi:** User được gán cho robot trong PTalk Assistant chính là người cũng sử dụng Kid Mentor (trẻ em) hoặc Elder Kare (người cao tuổi). Nhưng hiện tại đây là **các user ID hoàn toàn tách biệt** giữa 3 hệ thống, không liên kết được với nhau. Hệ quả:

- Không biết "Bé An trên robot" và "Bé An trên Kid Mentor" là cùng một người
- Không theo dõi được hành trình sử dụng xuyên sản phẩm
- Khi cập nhật thông tin ở một nơi, các nơi khác không đồng bộ
- Không thể phân tích tổng thể: trẻ dùng robot bao nhiêu + học trên app bao nhiêu

### 1.3 Mục tiêu

Xây dựng một **Dashboard quản lý tập trung** với hệ thống tài khoản thống nhất, trong đó:

- Mỗi con người thật chỉ có **một user ID duy nhất** dùng xuyên suốt PTalk Assistant, Kid Mentor, Elder Kare
- Đội ngũ vận hành theo dõi toàn bộ sản phẩm, user, thiết bị và hiệu suất từ một nơi duy nhất
- Đặt nền tảng để scale khi thêm sản phẩm mới trong tương lai

---

## 2. Kiến trúc Tài khoản — Unified Identity

### 2.1 Lựa chọn & Lý do

**Chọn: Centralized Auth Service** — Tất cả sản phẩm xác thực qua một hệ thống tài khoản duy nhất.

Lý do lựa chọn cho định hướng dài hạn và scale lớn:

- **Giải quyết triệt để bài toán đồng bộ.** "Bé An" trên PTalk Robot, trên Kid Mentor, và trên bất kỳ sản phẩm nào trong tương lai đều là cùng 1 user ID. Không cần mapping, không cần sync chéo.
- **Một tài khoản, toàn hệ sinh thái.** Khi thêm sản phẩm mới, chỉ cần tích hợp vào auth service có sẵn — không xây user system từ đầu.
- **Dữ liệu user tập trung.** Dashboard query trực tiếp, xây dựng hồ sơ 360° (robot usage + learning progress + health tracking) mà không cần đồng bộ chéo.
- **Scale theo sản phẩm, không scale theo user system.** 10, 20 sản phẩm vẫn chỉ 1 user system duy nhất.

### 2.2 Mô hình User thống nhất

Sau khi áp dụng Unified Identity, cấu trúc user sẽ là:

```
Central User Pool
│
├── User: Bé An (ID: U-001, type: child)
│   ├── PTalk Assistant → được gán vào Robot A (của Owner X)
│   └── Kid Mentor → user trực tiếp
│
├── User: Ông Bình (ID: U-002, type: elder)
│   ├── PTalk Assistant → được gán vào Robot B (của Owner X)
│   └── Elder Kare → user trực tiếp
│
├── User: Account Owner X (ID: U-003, type: owner)
│   └── PTalk Assistant → sở hữu Robot A, Robot B, Robot C
│
└── ... (mỗi người thật = 1 user ID duy nhất)
```

### 2.3 Các loại Role

Hệ thống phân biệt hai tầng user: **user cuối** (người dùng sản phẩm) và **user vận hành** (đội ngũ quản lý trên dashboard).

**User cuối (End Users):**

| Role          | Mô tả                                                                                     | Sản phẩm liên quan                                       |
| ------------- | ------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| Account Owner | Người mua/quản lý, đăng nhập app PTalk Assistant, sở hữu & cấu hình nhiều robot | PTalk Assistant                                             |
| Child         | Trẻ em, được gán vào robot (1 robot = 1 user), đồng thời dùng app học            | PTalk Assistant (robot user), Kid Mentor (user trực tiếp) |
| Elder         | Người cao tuổi, được gán vào robot, đồng thời dùng app chăm sóc               | PTalk Assistant (robot user), Elder Kare (user trực tiếp) |

> **Lưu ý:** Kid Mentor và Elder Kare hiện **chưa có** role cấp cao hơn (phụ huynh, người thân). User đăng nhập và sử dụng trực tiếp. Việc bổ sung role quản lý (parent, caregiver) trên các app này là hướng mở rộng trong tương lai — kiến trúc Unified Identity đã sẵn sàng hỗ trợ khi cần.

**User vận hành (Dashboard Users):**

| Role          | Phạm vi                                                           |
| ------------- | ------------------------------------------------------------------ |
| Super Admin   | Toàn quyền trên toàn hệ thống                                |
| Product Admin | Quản lý user, thiết bị, dữ liệu của sản phẩm được gán |
| Support       | Xem & chỉnh sửa thông tin user, xử lý yêu cầu hỗ trợ      |
| Viewer        | Chỉ xem dashboard & báo cáo                                     |

### 2.4 Quan hệ giữa các User

Hiện tại quan hệ duy nhất là **Account Owner ↔ Robot User** trong PTalk Assistant:

- Một Account Owner sở hữu nhiều robot, mỗi robot gán cho 1 user (child hoặc elder)
- Account Owner quản lý cấu hình robot, xem lịch sử tương tác của user trên robot đó

Khi Kid Mentor / Elder Kare bổ sung role quản lý trong tương lai, hệ thống sẵn sàng mở rộng thêm quan hệ Parent↔Child, Caregiver↔Elder.

### 2.5 User ↔ Sản phẩm ↔ Thiết bị

- Một user có thể **enroll vào nhiều sản phẩm** — enrollment quyết định user xuất hiện trên sản phẩm nào
- Trong PTalk Assistant: Account Owner **sở hữu** nhiều robot, mỗi robot được gán **đúng 1 user** (child/elder) thông qua server
- User được gán vào robot trong PTalk = cùng user ID với user trên Kid Mentor / Elder Kare

---

## 3. Yêu cầu Chức năng

### 3.1 Xác thực & Phân quyền

| ID      | Yêu cầu              | Mô tả                                                                             |
| ------- | ---------------------- | ----------------------------------------------------------------------------------- |
| AUTH-01 | Đăng ký tài khoản | Đăng ký bằng email hoặc số điện thoại, xác thực OTP                      |
| AUTH-02 | Đăng nhập           | Email/SĐT + mật khẩu, hỗ trợ đăng nhập bằng Google/Facebook                |
| AUTH-03 | Single Sign-On         | Đăng nhập một lần, truy cập mọi sản phẩm trong hệ sinh thái              |
| AUTH-04 | Phân quyền theo role | Hiển thị menu, chức năng, dữ liệu tương ứng với role của user vận hành |
| AUTH-05 | Quản lý phiên       | Token refresh, tự động đăng xuất sau thời gian không hoạt động           |
| AUTH-06 | Đặt lại mật khẩu  | Qua email hoặc OTP điện thoại                                                   |

### 3.2 Tổng quan Hệ thống (Overview)

| ID     | Yêu cầu                      | Mô tả                                                                                                            |
| ------ | ------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| OVR-01 | Thống kê user tổng          | Tổng user, user active (24h/7d/30d), user mới (hôm nay/tuần/tháng) — toàn hệ thống                        |
| OVR-02 | Phân bổ user theo sản phẩm | Biểu đồ thể hiện số lượng user của từng sản phẩm, tỷ lệ user dùng nhiều sản phẩm                 |
| OVR-03 | Trạng thái thiết bị        | Tổng số PTalk robot: online / offline / lỗi — real-time                                                        |
| OVR-04 | Engagement hôm nay            | Tổng số phiên tương tác, thời lượng trung bình, sản phẩm được dùng nhiều nhất                    |
| OVR-05 | Cảnh báo nổi bật           | Danh sách cảnh báo đang active: thiết bị mất kết nối, user không hoạt động > N ngày, lỗi hệ thống |

### 3.3 Quản lý User

| ID     | Yêu cầu               | Mô tả                                                                                                                                                                  |
| ------ | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| USR-01 | Danh sách user         | Bảng hiển thị toàn bộ user, hỗ trợ tìm kiếm theo tên/email/SĐT, lọc theo sản phẩm, role, trạng thái. Phân trang                                         |
| USR-02 | Hồ sơ user 360°      | Trang chi tiết user gồm: thông tin cá nhân, danh sách sản phẩm đang dùng, thiết bị được gán, quan hệ với user khác, lịch sử hoạt động gần nhất |
| USR-03 | Tạo & chỉnh sửa user | Tạo user mới, cập nhật thông tin, kích hoạt/vô hiệu hóa tài khoản                                                                                            |
| USR-04 | Quản lý quan hệ      | Tạo/xóa liên kết Account Owner ↔ Robot User (owner sở hữu robot, robot gán cho user). Hiển thị sơ đồ quan hệ                                               |
| USR-05 | Gán sản phẩm         | Enroll / unenroll user vào từng sản phẩm                                                                                                                             |
| USR-06 | Import/Export           | Import danh sách user từ CSV, export danh sách user ra CSV                                                                                                            |
| USR-07 | Lịch sử hoạt động  | Timeline các hành động của user xuyên sản phẩm: đăng nhập, sử dụng tính năng, tương tác với robot                                                     |

### 3.4 Quản lý Thiết bị (PTalk Assistant — Robot)

| ID     | Yêu cầu               | Mô tả                                                                                                                                             |
| ------ | ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| DEV-01 | Danh sách thiết bị   | Bảng hiển thị toàn bộ robot: serial number, firmware version, trạng thái online/offline, account owner, user được gán. Tìm kiếm & lọc |
| DEV-02 | Chi tiết thiết bị    | Thông tin phần cứng, firmware hiện tại, thời gian uptime, account owner, user được gán (child/elder), log lỗi gần nhất                 |
| DEV-03 | Gán user cho robot     | Gán / thay đổi user (child/elder) cho robot (1 robot = 1 user). User này dùng chung user ID với Kid Mentor / Elder Kare                       |
| DEV-04 | Trạng thái real-time  | Hiển thị online/offline/error với cập nhật real-time (WebSocket/MQTT), thời gian last seen                                                    |
| DEV-05 | Cập nhật firmware OTA | Chọn thiết bị → chọn firmware version → trigger OTA. Hiển thị tiến độ cập nhật                                                         |
| DEV-06 | Lịch sử hội thoại   | Xem log hội thoại giữa robot và user được gán: nội dung, thời gian, thời lượng                                                         |
| DEV-07 | Cấu hình từ xa       | Xem & thay đổi cài đặt robot (giọng nói, ngôn ngữ, chế độ hoạt động) qua dashboard                                                   |

### 3.5 Quản lý theo Sản phẩm

Mỗi sản phẩm có một trang riêng với dữ liệu nghiệp vụ đặc thù:

**PTalk Assistant:**

| ID    | Yêu cầu                      | Mô tả                                                                                            |
| ----- | ------------------------------ | -------------------------------------------------------------------------------------------------- |
| PA-01 | Danh sách Account Owner       | User sở hữu robot, số robot đang quản lý, danh sách robot kèm user được gán            |
| PA-02 | Mapping Owner ↔ Robot ↔ User | Sơ đồ gán: owner nào sở hữu robot nào, mỗi robot đang phục vụ user nào (1:1)          |
| PA-03 | Lịch sử cấu hình           | Log các thay đổi config robot: giọng nói, personality, schedule — ai đổi, lúc nào        |
| PA-04 | Lịch sử hội thoại          | Log hội thoại giữa robot và user được gán: nội dung, thời gian, thời lượng, sentiment |

**Kid Mentor:**

| ID    | Yêu cầu            | Mô tả                                                                         |
| ----- | -------------------- | ------------------------------------------------------------------------------- |
| KM-01 | Danh sách học sinh | Tên, lớp/tuổi, trạng thái tài khoản, robot được gán (nếu có)       |
| KM-02 | Tiến độ học tập | Số bài đã học, điểm trung bình, môn mạnh/yếu — theo từng học sinh |
| KM-03 | Nội dung phổ biến | Bài học / chủ đề được truy cập nhiều nhất, tỷ lệ hoàn thành      |
| KM-04 | Thời gian sử dụng | Thống kê thời lượng học theo ngày/tuần, so sánh giữa các học sinh   |

**Elder Kare:**

| ID    | Yêu cầu                  | Mô tả                                                                                                    |
| ----- | -------------------------- | ---------------------------------------------------------------------------------------------------------- |
| EK-01 | Danh sách người dùng   | Tên, tuổi, trạng thái tài khoản, robot được gán (nếu có)                                       |
| EK-02 | Lịch nhắc thuốc & khám | Danh sách lịch nhắc đang active, lịch sử nhắc (đã uống/bỏ lỡ)                                  |
| EK-03 | Tần suất tương tác    | Số lần mở app / tương tác với robot theo ngày, cảnh báo nếu không hoạt động > N ngày       |
| EK-04 | Cảnh báo sức khỏe      | Các sự kiện bất thường nếu tích hợp sensor: ngã, nhịp tim bất thường (tính năng mở rộng) |

### 3.6 Phân tích & Báo cáo

| ID     | Yêu cầu              | Mô tả                                                                                       |
| ------ | ---------------------- | --------------------------------------------------------------------------------------------- |
| ANL-01 | Tăng trưởng user    | Biểu đồ số user mới theo ngày/tuần/tháng, lọc theo sản phẩm                        |
| ANL-02 | Active users           | DAU, WAU, MAU — toàn hệ thống và theo từng sản phẩm                                   |
| ANL-03 | Retention              | Tỷ lệ user quay lại sau 1/7/30 ngày (cohort), lọc theo sản phẩm                        |
| ANL-04 | Engagement             | Thời lượng sử dụng trung bình, số phiên/ngày, tính năng được dùng nhiều nhất |
| ANL-05 | Cross-product adoption | Tỷ lệ user dùng 1 sản phẩm → đăng ký thêm sản phẩm khác                          |
| ANL-06 | Device analytics       | Phân bổ firmware version, tỷ lệ online, thời gian uptime trung bình                     |
| ANL-07 | Export báo cáo       | Xuất báo cáo tổng hợp ra PDF, xuất raw data ra CSV                                      |

### 3.7 Cảnh báo & Thông báo

| ID     | Yêu cầu             | Mô tả                                                                           |
| ------ | --------------------- | --------------------------------------------------------------------------------- |
| ALR-01 | Cảnh báo thiết bị | Thiết bị offline > N phút, lỗi phần cứng, OTA thất bại                    |
| ALR-02 | Cảnh báo user       | User không hoạt động > N ngày, Elder bỏ lỡ nhắc thuốc liên tiếp        |
| ALR-03 | Cảnh báo hệ thống | Service down, API error rate tăng đột biến, database connection pool cạn     |
| ALR-04 | Cấu hình rule       | Cho phép tạo/chỉnh sửa điều kiện trigger cảnh báo (ngưỡng, thời gian) |
| ALR-05 | Kênh thông báo     | Gửi cảnh báo qua email, Telegram, hoặc hiển thị trên dashboard             |

### 3.8 Giám sát Hệ thống

| ID     | Yêu cầu      | Mô tả                                                                                 |
| ------ | -------------- | --------------------------------------------------------------------------------------- |
| SYS-01 | Health check   | Trạng thái các service backend: auth, từng product service, database, MQTT broker   |
| SYS-02 | API monitoring | Latency trung bình, error rate, top endpoint chậm nhất — theo từng product service |
| SYS-03 | Audit log      | Ghi lại mọi thao tác của user vận hành trên dashboard: ai làm gì, lúc nào    |

---

## 4. Yêu cầu Phi chức năng

| Hạng mục                     | Yêu cầu                                                                                            |
| ------------------------------ | ---------------------------------------------------------------------------------------------------- |
| **Hiệu năng**          | Dashboard overview load < 3 giây, danh sách user/device < 2 giây (1000 records)                   |
| **Khả năng mở rộng** | Kiến trúc cho phép thêm sản phẩm mới mà chỉ cần thêm module, không sửa core             |
| **Bảo mật**            | HTTPS bắt buộc, token-based auth, mã hóa mật khẩu, RBAC nghiêm ngặt, audit log               |
| **Tính sẵn sàng**     | Auth service cần chạy HA (tối thiểu 2 instance), single point of failure phải được loại bỏ |
| **Responsive**           | Dashboard hoạt động trên desktop (ưu tiên) và tablet                                          |
| **Quốc tế hóa**       | Hỗ trợ tiếng Việt (mặc định) và tiếng Anh                                                   |

---

## 5. Lộ trình Triển khai (Gợi ý)

| Phase                                 | Nội dung                                                                               | Ước lượng |
| ------------------------------------- | --------------------------------------------------------------------------------------- | ------------- |
| **Phase 1 — Core**             | Auth service (AUTH-01→06), User CRUD (USR-01→03), Overview cơ bản (OVR-01→03)      | 4–5 tuần    |
| **Phase 2 — Device & Product** | Device management (DEV-01→07), Product pages (PA, KM, EK), User relationships (USR-04) | 4–5 tuần    |
| **Phase 3 — Analytics**        | Tất cả ANL-*, Cross-product adoption, Export                                          | 3–4 tuần    |
| **Phase 4 — Ops**              | Cảnh báo (ALR-*), System monitoring (SYS-*), Audit log                              | 3 tuần       |

---

## 6. Rủi ro chính

| Rủi ro                                                                                                                                                | Giải pháp                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Migration & merge user từ 3 hệ thống hiện tại (PTalk Assistant, Kid Mentor, Elder Kare) — cùng một người có thể có 2-3 user ID khác nhau | Xây công cụ migration: match user theo phone/email → merge thành 1 unified ID. Chạy song song giai đoạn chuyển tiếp, hỗ trợ login bằng cả ID cũ |
| Robot user list trong PTalk hiện là local data, chưa có API để dashboard pull                                                                    | Định nghĩa API contract sớm, PTalk team expose endpoint đồng bộ robot user list                                                                         |
| Product backend chưa có API phù hợp cho dashboard                                                                                                  | Định nghĩa API contract tối thiểu cho mỗi sản phẩm, các team triển khai song song                                                                    |
| Scope mở rộng không kiểm soát                                                                                                                     | Mỗi phase có deliverable rõ ràng, review trước khi sang phase tiếp                                                                                      |
