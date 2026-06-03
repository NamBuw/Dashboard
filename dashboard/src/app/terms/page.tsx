import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Điều khoản & Điều kiện — P-Ecosystem",
  description: "Điều khoản sử dụng cho các ứng dụng P-Connect, P-Talk Signature, KidMentor.",
};

/**
 * Public terms & conditions page (no auth — not matched by middleware).
 * Linked from the mandatory consent checkbox in all P-Ecosystem apps.
 */
export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12 text-gray-800 leading-relaxed">
      <h1 className="text-3xl font-bold mb-2">Điều khoản &amp; Điều kiện</h1>
      <p className="text-sm text-gray-500 mb-8">Cập nhật lần cuối: 03/06/2026</p>

      <p className="mb-6">
        Bằng việc tích chọn ô đồng ý và sử dụng các ứng dụng <strong>P-Connect</strong>,{" "}
        <strong>P-Talk Signature</strong>, <strong>KidMentor</strong> cùng thiết bị đi kèm, bạn đồng ý
        với các điều khoản dưới đây.
      </p>

      <Section title="1. Đối tượng sử dụng">
        <p>
          Dịch vụ dành cho trẻ em (có sự giám sát của phụ huynh/người giám hộ) và người cao tuổi.
          Người tạo tài khoản phải đủ tuổi theo pháp luật và chịu trách nhiệm cho các thiết bị, tài
          khoản phụ thuộc mà mình quản lý.
        </p>
      </Section>

      <Section title="2. Sử dụng hợp lệ">
        <ul className="list-disc pl-6 space-y-1">
          <li>Không dùng dịch vụ cho mục đích phi pháp hoặc gây hại.</li>
          <li>Không cố gắng vượt qua các bộ lọc an toàn nội dung.</li>
          <li>Không can thiệp trái phép vào hệ thống, thiết bị hoặc dữ liệu của người khác.</li>
        </ul>
      </Section>

      <Section title="3. Nội dung do AI tạo">
        <p>
          Trợ lý giọng nói sử dụng AI và có thể tạo ra nội dung chưa chính xác tuyệt đối. Phụ huynh
          nên giám sát và sử dụng các công cụ kiểm duyệt (từ ngữ, chủ đề bị cấm) được cung cấp. Chúng
          tôi không chịu trách nhiệm cho quyết định dựa trên nội dung do AI tạo ra.
        </p>
      </Section>

      <Section title="4. Quyền riêng tư">
        <p>
          Việc thu thập và xử lý dữ liệu được mô tả trong{" "}
          <a href="/privacy" className="text-blue-600 underline">Chính sách Bảo mật</a>. Bằng việc
          đồng ý các điều khoản này, bạn cũng đồng ý với Chính sách Bảo mật.
        </p>
      </Section>

      <Section title="5. Thay đổi điều khoản">
        <p>
          Chúng tôi có thể cập nhật điều khoản theo thời gian. Việc tiếp tục sử dụng dịch vụ sau khi
          cập nhật đồng nghĩa với việc bạn chấp nhận các thay đổi.
        </p>
      </Section>

      <p className="mt-10 text-sm text-gray-500">
        Xem thêm <a href="/privacy" className="text-blue-600 underline">Chính sách Bảo mật</a>.
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
