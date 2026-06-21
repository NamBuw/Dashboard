import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Chính sách Bảo mật — P-Ecosystem",
  description:
    "Chính sách bảo vệ dữ liệu cá nhân cho hệ sinh thái P-Ecosystem (KidMentor, P-Talk, Elder Kare), tuân thủ Nghị định 13/2023/NĐ-CP và pháp luật Việt Nam.",
};

/**
 * Public privacy policy (no auth). Linked from the mandatory consent checkbox in
 * all P-Ecosystem apps (dashboard.ctslab.net/privacy).
 *
 * Soạn theo Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân và các luật liên quan.
 * LƯU Ý: đây là bản mẫu — cần điền thông tin pháp nhân và rà soát bởi luật sư trước khi công bố.
 */
export default function PrivacyPolicyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12 text-gray-800 leading-relaxed">
      <h1 className="text-3xl font-bold mb-2">Chính sách Bảo mật</h1>
      <p className="text-sm text-gray-500 mb-6">
        Có hiệu lực từ: 06/06/2026 · Cập nhật lần cuối: 06/06/2026 · Phiên bản 2.0
      </p>

      <Notice>
        Chính sách này được xây dựng phù hợp với <strong>Nghị định 13/2023/NĐ-CP</strong> về bảo vệ
        dữ liệu cá nhân và pháp luật Việt Nam hiện hành.
      </Notice>

      <p className="my-6">
        Chính sách Bảo mật này (&ldquo;<strong>Chính sách</strong>&rdquo;) mô tả cách chúng tôi thu
        thập, sử dụng, lưu trữ, chia sẻ và bảo vệ dữ liệu cá nhân khi bạn và trẻ em/người được giám
        hộ sử dụng hệ sinh thái <strong>P-Ecosystem</strong> — bao gồm các ứng dụng{" "}
        <strong>KidMentor</strong>, <strong>P-Talk Signature</strong>, <strong>P-Connect</strong>,{" "}
        <strong>Elder Kare</strong>, Trang quản trị (Dashboard) và các thiết bị trợ lý giọng nói đi
        kèm (gọi chung là &ldquo;<strong>Dịch vụ</strong>&rdquo;). Chính sách là một phần không tách
        rời của <a href="/terms" className="text-blue-600 underline">Điều khoản &amp; Điều kiện</a>.
      </p>

      <p className="mb-6 text-sm text-gray-600">
        Chính sách áp dụng chung cho toàn hệ sinh thái. Tuỳ theo ứng dụng và thiết bị bạn sử dụng,
        một số nội dung dưới đây có thể không áp dụng — mỗi ứng dụng chỉ yêu cầu quyền và thu thập dữ
        liệu cần thiết cho tính năng của chính ứng dụng đó (ví dụ: KidMentor tập trung vào dữ liệu học
        tập của trẻ; Elder Kare có tính năng nhận diện thuốc qua camera; P-Connect kết nối thiết bị
        qua Bluetooth).
      </p>

      <Section title="1. Định nghĩa">
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>&ldquo;Chúng tôi&rdquo;</strong>: CTS LAB — đơn vị Kiểm soát dữ liệu cá nhân (xem mục 3).</li>
          <li><strong>&ldquo;Chủ tài khoản&rdquo; / &ldquo;Phụ huynh&rdquo;</strong>: cá nhân đủ năng lực hành vi dân sự, tạo và quản lý tài khoản, đại diện hợp pháp cho trẻ em/người được giám hộ.</li>
          <li><strong>&ldquo;Hồ sơ trẻ&rdquo; / &ldquo;Bé&rdquo;</strong>: hồ sơ của trẻ em do Phụ huynh tạo và quản lý trong Dịch vụ.</li>
          <li><strong>&ldquo;Dữ liệu cá nhân&rdquo;</strong>, <strong>&ldquo;Dữ liệu cá nhân nhạy cảm&rdquo;</strong>, <strong>&ldquo;Chủ thể dữ liệu&rdquo;</strong>, <strong>&ldquo;xử lý dữ liệu&rdquo;</strong>: hiểu theo Điều 2 Nghị định 13/2023/NĐ-CP.</li>
        </ul>
      </Section>

      <Section title="2. Nguyên tắc bảo vệ dữ liệu">
        <p>
          Chúng tôi xử lý dữ liệu cá nhân theo nguyên tắc tại Điều 3 Nghị định 13/2023/NĐ-CP: hợp
          pháp, minh bạch; đúng mục đích đã thông báo; thu thập phù hợp và giới hạn theo mục đích;
          chính xác và cập nhật; có biện pháp bảo mật; lưu trữ trong thời hạn cần thiết; và gắn với
          trách nhiệm giải trình.
        </p>
      </Section>

      <Section title="3. Đơn vị Kiểm soát dữ liệu & thông tin liên hệ">
        <ul className="list-disc pl-6 space-y-1">
          <li>Đơn vị Kiểm soát / Kiểm soát và xử lý dữ liệu: <strong>CTS LAB</strong></li>
          <li>Địa chỉ: Học viện Công nghệ Bưu chính Viễn thông, Km10 Nguyễn Trãi, Hà Đông, Hà Nội</li>
          <li>Email: <a href="mailto:ctslab@ptit.vn" className="text-blue-600 underline">ctslab@ptit.vn</a> · Điện thoại: 035 735 3236</li>
        </ul>
        <p className="mt-2 text-sm text-gray-600">
          Sản phẩm được phát triển bởi Lab CTS — Học viện Công nghệ Bưu chính Viễn thông (PTIT).
        </p>
      </Section>

      <Section title="4. Dữ liệu cá nhân chúng tôi thu thập">
        <p className="mb-2"><strong>4.1. Dữ liệu tài khoản &amp; phụ huynh:</strong></p>
        <ul className="list-disc pl-6 space-y-1 mb-3">
          <li>Tên đăng nhập, họ và tên, email, số điện thoại, vai trò; thông tin định danh qua đăng nhập một lần (SSO/Authentik).</li>
          <li>Mật khẩu được lưu dưới dạng <strong>băm (hash)</strong>, không lưu mật khẩu gốc.</li>
        </ul>
        <p className="mb-2"><strong>4.2. Dữ liệu hồ sơ trẻ em (do Phụ huynh cung cấp):</strong></p>
        <ul className="list-disc pl-6 space-y-1 mb-3">
          <li>Họ và tên, lớp, ngày sinh, quê quán, bộ sách/chương trình học, quan hệ với phụ huynh.</li>
          <li>Dùng để cá nhân hoá nội dung học tập theo đúng lớp và bộ sách của trẻ.</li>
        </ul>
        <p className="mb-2"><strong>4.3. Nội dung tương tác:</strong></p>
        <ul className="list-disc pl-6 space-y-1 mb-3">
          <li>Nội dung hội thoại giọng nói giữa người dùng và trợ lý, được chuyển thành văn bản (transcript) để xử lý, kiểm duyệt và hiển thị lịch sử cho phụ huynh; chỉ số cảm xúc/đánh giá nội dung.</li>
          <li>Cấu hình kiểm duyệt (từ ngữ, chủ đề bị cấm) do phụ huynh thiết lập.</li>
        </ul>
        <p className="mb-2"><strong>4.4. Dữ liệu thiết bị &amp; kỹ thuật:</strong></p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Mã thiết bị, địa chỉ MAC, phiên bản phần mềm, trạng thái, thời điểm hoạt động.</li>
          <li>Nhật ký sử dụng, hạn mức (quota), dữ liệu kỹ thuật và cookie cần thiết để vận hành Trang quản trị (xem mục 12).</li>
        </ul>
        <p className="mb-2 mt-3"><strong>4.5. Hình ảnh do bạn cung cấp:</strong></p>
        <ul className="list-disc pl-6 space-y-1 mb-3">
          <li>Ảnh chụp qua camera khi bạn dùng tính năng nhận diện thuốc (Elder Kare / P-Talk Signature):
            ảnh vỉ/lọ thuốc được gửi tới hệ thống AI của chúng tôi (máy chủ tại Việt Nam) để nhận diện và
            đưa ra thông tin tham khảo; ảnh chỉ dùng cho mục đích này.</li>
          <li>Thông tin về thuốc/sức khoẻ suy ra từ ảnh là <strong>dữ liệu cá nhân nhạy cảm</strong>, chỉ
            được xử lý khi bạn chủ động sử dụng tính năng và đã đồng ý.</li>
        </ul>
        <p className="mb-2 mt-3"><strong>4.6. Quyền truy cập thiết bị:</strong></p>
        <p className="mb-1 text-sm text-gray-700">
          Tuỳ ứng dụng, chúng tôi yêu cầu các quyền sau và chỉ dùng đúng mục đích nêu kèm; bạn có thể
          thu hồi bất kỳ lúc nào trong cài đặt hệ điều hành:
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>Micro</strong>: ghi nhận giọng nói để trò chuyện với trợ lý (mọi ứng dụng giọng nói).</li>
          <li><strong>Camera</strong>: chụp ảnh thuốc cho tính năng nhận diện (Elder Kare / P-Talk Signature).</li>
          <li><strong>Bluetooth</strong>: dò tìm và kết nối thiết bị trợ lý đi kèm (P-Connect).</li>
          <li><strong>Vị trí</strong>: trên một số phiên bản Android, quyền vị trí là điều kiện kỹ thuật để
            quét/kết nối thiết bị Bluetooth lân cận. Chúng tôi <strong>không</strong> dùng quyền này để theo
            dõi hoặc lưu vị trí của bạn, trừ khi được nêu rõ và bạn đồng ý.</li>
        </ul>
        <p className="mt-3 text-sm text-gray-600">
          Dữ liệu giọng nói và dữ liệu của trẻ em được chúng tôi xử lý với mức bảo vệ cao và chỉ
          trong phạm vi mục đích tại mục 5.
        </p>
      </Section>

      <Section title="5. Mục đích & căn cứ xử lý">
        <p className="mb-2">Chúng tôi xử lý dữ liệu nhằm:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Cung cấp, vận hành và cá nhân hoá Dịch vụ (gia sư AI theo lớp/bộ sách, trợ lý giọng nói).</li>
          <li>Bảo đảm an toàn nội dung cho trẻ em và người cao tuổi (kiểm duyệt từ ngữ/chủ đề).</li>
          <li>Hiển thị lịch sử trò chuyện và công cụ giám sát cho phụ huynh/người giám hộ.</li>
          <li>Cung cấp tính năng nhận diện thuốc qua hình ảnh (đưa thông tin tham khảo, không thay thế tư vấn y tế).</li>
          <li>Quản lý tài khoản, hạn mức, gói dịch vụ; bảo mật, phát hiện và ngăn chặn lạm dụng.</li>
          <li>Cải thiện chất lượng Dịch vụ; thực hiện nghĩa vụ pháp lý và giải quyết tranh chấp.</li>
        </ul>
        <p className="mt-2">
          <strong>Căn cứ xử lý:</strong> sự đồng ý của chủ thể dữ liệu / người đại diện hợp pháp
          (Điều 11); thực hiện hợp đồng cung cấp dịch vụ; tuân thủ nghĩa vụ pháp lý; và các trường
          hợp khác được phép theo Điều 17 Nghị định 13/2023/NĐ-CP. Chúng tôi{" "}
          <strong>không bán</strong> dữ liệu cá nhân và <strong>không</strong> dùng dữ liệu của trẻ
          cho mục đích quảng cáo hướng đối tượng.
        </p>
      </Section>

      <Section title="6. Xử lý dữ liệu của trẻ em (đặc biệt quan trọng)">
        <p>
          Theo Điều 20 Nghị định 13/2023/NĐ-CP và Luật Trẻ em 2016, việc xử lý dữ liệu của trẻ em
          (người dưới 16 tuổi) tuân thủ:
        </p>
        <ul className="list-disc pl-6 space-y-1 mt-2">
          <li>Phải có sự đồng ý của <strong>trẻ em từ đủ 7 tuổi trở lên</strong> và của{" "}
            <strong>cha, mẹ hoặc người giám hộ</strong>; với trẻ dưới 7 tuổi, do cha/mẹ/người giám
            hộ quyết định.</li>
          <li>Hồ sơ trẻ do Phụ huynh tạo và kiểm soát; Phụ huynh xác nhận có quyền đại diện hợp pháp
            cho trẻ khi cung cấp dữ liệu.</li>
          <li>Chúng tôi áp dụng biện pháp xác minh độ tuổi phù hợp và bảo vệ trẻ trên môi trường mạng.</li>
          <li>Khi phát hiện xử lý dữ liệu trẻ em không đúng quy định, hoặc khi sự đồng ý bị rút lại,
            chúng tôi sẽ <strong>ngừng xử lý và xoá</strong> dữ liệu liên quan.</li>
        </ul>
      </Section>

      <Section title="7. Chia sẻ & tiết lộ dữ liệu">
        <p className="mb-2">Chúng tôi chỉ chia sẻ dữ liệu trong các trường hợp:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>Bên xử lý dữ liệu</strong> hỗ trợ vận hành (hạ tầng máy chủ, dịch vụ xác thực
            đăng nhập, nhà cung cấp mô hình AI xử lý hội thoại) — theo hợp đồng ràng buộc về bảo mật,
            chỉ xử lý theo chỉ dẫn của chúng tôi.</li>
          <li>Phụ huynh/người giám hộ được xem dữ liệu của trẻ thuộc quyền quản lý của mình.</li>
          <li>Cơ quan nhà nước có thẩm quyền khi pháp luật yêu cầu.</li>
        </ul>
        <p className="mt-2">Chúng tôi không chia sẻ dữ liệu cho bên thứ ba vì mục đích thương mại.</p>
      </Section>

      <Section title="8. Chuyển dữ liệu cá nhân ra nước ngoài">
        <p>
          Trường hợp một số thành phần xử lý (ví dụ dịch vụ mô hình AI hoặc hạ tầng) đặt tại nước
          ngoài, việc chuyển dữ liệu ra nước ngoài được thực hiện theo Điều 25 Nghị định
          13/2023/NĐ-CP: lập <strong>Hồ sơ đánh giá tác động chuyển dữ liệu ra nước ngoài</strong>,
          thực hiện thông báo theo quy định và áp dụng biện pháp bảo vệ tương xứng. Nếu Dịch vụ chỉ
          xử lý dữ liệu trong lãnh thổ Việt Nam, mục này không áp dụng.
        </p>
      </Section>

      <Section title="9. Thời hạn lưu trữ">
        <p>
          Dữ liệu được lưu trong thời gian cần thiết để cung cấp Dịch vụ và theo thời hạn luật định.
          Lịch sử trò chuyện được lưu theo cấu hình và có thể bị xoá theo yêu cầu của phụ huynh. Khi
          bạn đóng tài khoản hoặc rút lại sự đồng ý, chúng tôi sẽ xoá hoặc ẩn danh dữ liệu cá nhân
          trong thời hạn hợp lý, trừ phần phải lưu giữ theo nghĩa vụ pháp lý. Khi xoá một hồ sơ trẻ,
          dữ liệu liên quan (gồm lịch sử trò chuyện của trẻ) cũng được xoá.
        </p>
      </Section>

      <Section title="10. Bảo mật dữ liệu">
        <ul className="list-disc pl-6 space-y-1">
          <li>Mã hoá đường truyền (TLS/HTTPS); mật khẩu lưu dạng băm; token đăng nhập lưu an toàn (mã hoá) trên thiết bị.</li>
          <li>Phân quyền truy cập (RBAC): mỗi tài khoản chỉ truy cập dữ liệu của mình và của hồ sơ/thiết bị thuộc quyền quản lý.</li>
          <li>Các biện pháp kỹ thuật và quản lý hợp lý nhằm chống truy cập, thay đổi, tiết lộ trái phép.</li>
          <li>Trường hợp xảy ra vi phạm dữ liệu cá nhân, chúng tôi thông báo cho cơ quan có thẩm quyền và chủ thể dữ liệu theo Điều 23 Nghị định 13/2023/NĐ-CP.</li>
        </ul>
      </Section>

      <Section title="11. Quyền của Chủ thể dữ liệu">
        <p className="mb-2">
          Theo Điều 9 Nghị định 13/2023/NĐ-CP, bạn (và trẻ thông qua người đại diện) có các quyền:
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Quyền được biết về việc xử lý dữ liệu của mình.</li>
          <li>Quyền đồng ý / không đồng ý.</li>
          <li>Quyền truy cập, xem, chỉnh sửa dữ liệu.</li>
          <li>Quyền rút lại sự đồng ý.</li>
          <li>Quyền xoá dữ liệu.</li>
          <li>Quyền hạn chế / phản đối việc xử lý.</li>
          <li>Quyền yêu cầu cung cấp dữ liệu.</li>
          <li>Quyền khiếu nại, tố cáo, khởi kiện.</li>
          <li>Quyền yêu cầu bồi thường thiệt hại.</li>
          <li>Quyền tự bảo vệ.</li>
        </ul>
        <p className="mt-2">
          Để thực hiện quyền, vui lòng liên hệ theo mục 3. Chúng tôi phản hồi trong thời hạn{" "}
          <strong>72 giờ</strong> kể từ khi nhận yêu cầu hợp lệ, trừ trường hợp pháp luật quy định khác.
        </p>
      </Section>

      <Section title="12. Cookie & công nghệ tương tự">
        <p>
          Trang quản trị web sử dụng cookie/lưu trữ cục bộ cần thiết cho việc đăng nhập, duy trì
          phiên và ghi nhớ tuỳ chọn (ví dụ giao diện sáng/tối). Chúng tôi không dùng cookie cho mục
          đích quảng cáo theo dõi hành vi.
        </p>
      </Section>

      <Section title="13. Thay đổi Chính sách">
        <p>
          Chúng tôi có thể cập nhật Chính sách theo thời gian. Bản cập nhật được công bố tại trang
          này kèm ngày hiệu lực; với thay đổi quan trọng, chúng tôi sẽ thông báo phù hợp. Việc tiếp
          tục sử dụng Dịch vụ sau khi cập nhật đồng nghĩa với việc bạn đã đọc và đồng ý.
        </p>
      </Section>

      <Section title="14. Liên hệ & khiếu nại">
        <p>
          Mọi yêu cầu, thắc mắc hoặc khiếu nại về dữ liệu cá nhân, vui lòng liên hệ đầu mối tại mục 3
          (email <a href="mailto:ctslab@ptit.vn" className="text-blue-600 underline">ctslab@ptit.vn</a>).
          Bạn cũng có quyền khiếu nại/tố cáo tới cơ quan nhà nước có thẩm quyền — Cục An ninh mạng và
          phòng, chống tội phạm sử dụng công nghệ cao (A05), Bộ Công an.
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

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      {children}
    </div>
  );
}
