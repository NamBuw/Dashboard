# AGENT.md

## Project Information
- **Project Name:** PTalk Ecosystem (PTalk Assistant, Kid Mentor, Elder Kare, Product Dashboard)
- **Architecture:** 
  - Microservices/Separate applications with a **Unified Identity** managed by Authentik.
  - Apps: Kid Mentor, Elder Kare, PTalk Assistant (Mobile app + Robot), Dashboard.
- **Centralized Auth Service:** Authentik (via OIDC/OAuth2).

## Rules (QUY TẮC CẤM MẮC PHẢI)
1. **Tuyệt đối không lưu secret (API keys, passwords, .env) lên Git.**
2. Đảm bảo backward compatibility khi migration user cũ lên Unified Identity.
3. Mỗi user thực tế CHỈ CÓ 1 USER ID duy nhất xuyên suốt tất cả các hệ thống (Kid Mentor, Elder Kare, P Assistant).
4. Các nhánh (branch) phải được đặt tên rõ ràng, chia nhỏ commit theo từng session, viết commit message giải thích rõ context.
5. Luôn làm việc trên branch riêng, không đẩy code trực tiếp lên `master`.

## Naming Conventions (Thiết kế User & Naming)
- **Username / ID Format:** 
  - Đối với trẻ em: `child_<id>` hoặc theo rule của hệ thống như `U-<id>` (type: child)
  - Đối với người cao tuổi: `elder_<id>` hoặc `U-<id>` (type: elder)
  - Đối với chủ tài khoản (Account Owner): `owner_<id>` hoặc `U-<id>` (type: owner)
- **User Groups (Role Groups) trong Authentik:**
  - *End Users:* `AccountOwner`, `Child`, `Elder`
  - *Dashboard/Ops Users:* `SuperAdmin`, `ProductAdmin`, `Support`, `Viewer`

## Common Commands
- **Khởi động Authentik (Backend + Auth):**
  ```bash
  cd authentik
  docker-compose up -d
  ```
- **Blueprint import (Auto-setup):** Authentik sẽ tự động quét thư mục `authentik/blueprints` khi khởi động và áp dụng các rule (Groups, OIDC Providers) được định nghĩa.
