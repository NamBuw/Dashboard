import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Chính sách Bảo mật — P-Ecosystem",
  description: "Chính sách bảo mật cho các ứng dụng P-Connect, P-Talk Signature, KidMentor.",
};

/**
 * Public privacy policy page (no auth — not matched by middleware).
 * Linked from the mandatory consent checkbox in all P-Ecosystem apps.
 */
export default function PrivacyPolicyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12 text-gray-800 leading-relaxed">
      <h1 className="text-3xl font-bold mb-2">Chính sách Bảo mật</h1>
      <p className="text-sm text-gray-500 mb-8">Cập nhật lần cuối: 03/06/2026</p>

      <p className="mb-6">
        Chính sách này áp dụng cho hệ sinh thái P-Ecosystem, bao gồm các ứng dụng{" "}
        <strong>P-Connect</strong>, <strong>P-Talk Signature</strong>, <strong>KidMentor</strong> và
        các thiết bị trợ lý giọng nói đi kèm. Chúng tôi cam kết bảo vệ dữ liệu của bạn và của trẻ em
        sử dụng dịch vụ.
      </p>

      <Section title="1. Dữ liệu chúng tôi thu thập">
        <ul className="list-disc pl-6 space-y-1">
          <li>Thông tin tài khoản qua đăng nhập SSO (Authentik): tên, email, vai trò.</li>
          <li>Thông tin thiết bị được liên kết với tài khoản (mã thiết bị, trạng thái).</li>
          <li>
            Nội dung hội thoại giọng nói giữa người dùng và trợ lý (được chuyển thành văn bản để xử
            lý và hiển thị lịch sử cho phụ huynh/người giám hộ).
          </li>
          <li>Cấu hình kiểm duyệt nội dung (từ ngữ, chủ đề bị cấm) do người dùng thiết lập.</li>
        </ul>
      </Section>

      <Section title="2. Mục đích sử dụng">
        <p>
          Dữ liệu được dùng để cung cấp dịch vụ trợ lý giọng nói, kiểm duyệt nội dung an toàn cho trẻ
          em và người cao tuổi, hiển thị lịch sử trò chuyện cho người giám hộ, và cải thiện chất lượng
          dịch vụ. Chúng tôi <strong>không</strong> bán dữ liệu cá nhân cho bên thứ ba.
        </p>
      </Section>

      <Section title="3. Quyền của phụ huynh / người giám hộ">
        <p>
          Phụ huynh có thể xem và xoá lịch sử trò chuyện của thiết bị liên kết, thiết lập từ ngữ và
          chủ đề bị cấm, cũng như yêu cầu xoá toàn bộ dữ liệu của trẻ bất kỳ lúc nào.
        </p>
      </Section>

      <Section title="4. Lưu trữ & bảo mật">
        <p>
          Dữ liệu được lưu trên hạ tầng của chúng tôi với mã hoá khi truyền tải. Token đăng nhập được
          lưu an toàn trên thiết bị. Chúng tôi áp dụng các biện pháp kỹ thuật hợp lý để chống truy cập
          trái phép.
        </p>
      </Section>

      <Section title="5. Liên hệ">
        <p>
          Mọi thắc mắc về quyền riêng tư, vui lòng liên hệ qua kênh hỗ trợ trong ứng dụng hoặc email
          hỗ trợ của P-Ecosystem.
        </p>
      </Section>

      <p className="mt-10 text-sm text-gray-500">
        Xem thêm <a href="/terms" className="text-blue-600 underline">Điều khoản &amp; Điều kiện</a>.
      </p>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6">
      <h2 className="text-xl font-semibold mb-2">{title}</h2>
      <div className="text-gray-700">{children}</div>
    </section>
  );
}
