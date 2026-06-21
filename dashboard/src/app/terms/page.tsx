import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Điều khoản & Điều kiện — P-Ecosystem",
  description:
    "Điều khoản & Điều kiện sử dụng hệ sinh thái P-Ecosystem (KidMentor, P-Talk, Elder Kare), theo pháp luật Việt Nam.",
};

/**
 * Public terms & conditions (no auth). Linked from the mandatory consent checkbox
 * in all P-Ecosystem apps (dashboard.ctslab.net/terms).
 *
 * Soạn theo BLDS 2015, Luật Bảo vệ quyền lợi người tiêu dùng 2023, Luật Giao dịch điện tử,
 * Luật An ninh mạng 2018, Luật Trẻ em 2016 và Nghị định 13/2023/NĐ-CP.
 * LƯU Ý: bản mẫu — cần điền thông tin pháp nhân và rà soát bởi luật sư trước khi công bố.
 */
export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12 text-gray-800 leading-relaxed">
      <h1 className="text-3xl font-bold mb-2">Điều khoản &amp; Điều kiện</h1>
      <p className="text-sm text-gray-500 mb-6">
        Có hiệu lực từ: 06/06/2026 · Cập nhật lần cuối: 06/06/2026 · Phiên bản 2.0
      </p>

      <Notice>
        Điều khoản này được xây dựng phù hợp với pháp luật Việt Nam hiện hành (Bộ luật Dân sự 2015,
        Luật Bảo vệ quyền lợi người tiêu dùng 2023, Luật An ninh mạng 2018, Luật Trẻ em 2016, Nghị
        định 13/2023/NĐ-CP).
      </Notice>

      <p className="my-6">
        Điều khoản &amp; Điều kiện này (&ldquo;<strong>Điều khoản</strong>&rdquo;) là thoả thuận giữa
        bạn và <strong>CTS LAB</strong> (&ldquo;<strong>chúng tôi</strong>&rdquo;) về
        việc sử dụng hệ sinh thái <strong>P-Ecosystem</strong> — gồm các ứng dụng{" "}
        <strong>KidMentor</strong>, <strong>P-Talk Signature</strong>, <strong>P-Connect</strong>,{" "}
        <strong>Elder Kare</strong>, Trang quản trị và thiết bị đi kèm (&ldquo;<strong>Dịch vụ</strong>&rdquo;).
      </p>

      <p className="my-6 text-sm text-gray-600">
        Điều khoản áp dụng chung cho mọi ứng dụng trong hệ sinh thái. Tính năng có thể khác nhau giữa
        các ứng dụng (ví dụ: gia sư AI ở KidMentor, nhận diện thuốc qua camera ở Elder Kare, kết nối
        thiết bị qua Bluetooth ở P-Connect); các điều khoản chỉ áp dụng với tính năng mà ứng dụng bạn
        dùng thực sự cung cấp.
      </p>

      <Section title="1. Chấp nhận Điều khoản">
        <p>
          Bằng việc tích chọn ô đồng ý, tạo tài khoản hoặc sử dụng Dịch vụ, bạn xác nhận đã đọc, hiểu
          và đồng ý chịu ràng buộc bởi Điều khoản này và{" "}
          <a href="/privacy" className="text-blue-600 underline">Chính sách Bảo mật</a>. Nếu không
          đồng ý, vui lòng ngừng sử dụng Dịch vụ.
        </p>
      </Section>

      <Section title="2. Định nghĩa">
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>&ldquo;Chủ tài khoản&rdquo; / &ldquo;Phụ huynh&rdquo;</strong>: người tạo và quản lý tài khoản, đại diện hợp pháp cho trẻ em/người được giám hộ.</li>
          <li><strong>&ldquo;Hồ sơ trẻ&rdquo;</strong>: hồ sơ của trẻ em do Phụ huynh tạo trong Dịch vụ.</li>
          <li><strong>&ldquo;Nội dung do AI tạo&rdquo;</strong>: phản hồi do trợ lý trí tuệ nhân tạo sinh ra.</li>
        </ul>
      </Section>

      <Section title="3. Điều kiện & độ tuổi sử dụng">
        <ul className="list-disc pl-6 space-y-1">
          <li>Người tạo tài khoản phải <strong>đủ năng lực hành vi dân sự</strong> theo Bộ luật Dân sự 2015 (thông thường từ đủ 18 tuổi, hoặc theo quy định pháp luật).</li>
          <li>Trẻ em sử dụng Dịch vụ <strong>phải có sự giám sát của phụ huynh/người giám hộ</strong>. Phụ huynh xác nhận có quyền đại diện hợp pháp cho trẻ và chịu trách nhiệm về việc trẻ sử dụng Dịch vụ.</li>
          <li>Chủ tài khoản chịu trách nhiệm cho mọi hồ sơ trẻ, thiết bị và tài khoản phụ thuộc do mình quản lý.</li>
        </ul>
      </Section>

      <Section title="4. Tài khoản & bảo mật">
        <ul className="list-disc pl-6 space-y-1">
          <li>Bạn có trách nhiệm cung cấp thông tin chính xác và giữ bí mật thông tin đăng nhập.</li>
          <li>Bạn chịu trách nhiệm cho mọi hoạt động diễn ra dưới tài khoản của mình.</li>
          <li>Thông báo cho chúng tôi ngay khi phát hiện truy cập trái phép hoặc lộ thông tin tài khoản.</li>
        </ul>
      </Section>

      <Section title="5. Mô tả Dịch vụ">
        <p>
          Dịch vụ cung cấp trợ lý/gia sư giọng nói ứng dụng AI (cá nhân hoá theo lớp và bộ sách của
          trẻ), tính năng nhận diện thuốc qua hình ảnh (đưa thông tin tham khảo, <strong>không thay
          thế tư vấn y tế</strong>), công cụ giám sát và kiểm duyệt nội dung cho phụ huynh, kết nối &amp;
          quản lý thiết bị và các gói sử dụng. Chúng tôi có thể bổ sung, thay đổi hoặc ngừng một phần
          tính năng; với thay đổi quan trọng sẽ thông báo phù hợp.
        </p>
      </Section>

      <Section title="6. Quy tắc sử dụng được chấp nhận">
        <ul className="list-disc pl-6 space-y-1">
          <li>Không dùng Dịch vụ cho mục đích vi phạm pháp luật, lừa đảo hoặc gây hại.</li>
          <li>Không cố gắng vượt qua các bộ lọc/kiểm duyệt an toàn nội dung.</li>
          <li>Không đăng tải hoặc tạo nội dung trái pháp luật, xâm phạm quyền của người khác, hoặc không phù hợp với trẻ em.</li>
          <li>Không can thiệp, dò quét, tấn công trái phép hệ thống, thiết bị hoặc dữ liệu của người khác.</li>
          <li>Không sử dụng Dịch vụ để xử lý dữ liệu cá nhân của bên thứ ba khi chưa có căn cứ hợp pháp.</li>
        </ul>
      </Section>

      <Section title="7. Nội dung do AI tạo — Miễn trừ">
        <p>
          Trợ lý sử dụng AI và <strong>có thể tạo ra nội dung chưa chính xác, chưa đầy đủ hoặc không
          phù hợp</strong>. Nội dung do AI tạo mang tính tham khảo, <strong>không thay thế</strong>{" "}
          giáo dục chính quy, tư vấn y tế, pháp lý hay chuyên môn. Phụ huynh cần giám sát và sử dụng
          các công cụ kiểm duyệt được cung cấp. Trong phạm vi pháp luật cho phép, chúng tôi không
          chịu trách nhiệm cho quyết định hoặc thiệt hại phát sinh từ việc dựa vào nội dung do AI tạo.
        </p>
      </Section>

      <Section title="8. Gói dịch vụ & thanh toán">
        <p>
          Một số tính năng có thể được cung cấp theo các gói (ví dụ Cơ bản/Pro/Ultra) với hạn mức và
          mức phí công bố tại thời điểm đăng ký. Chính sách giá, gia hạn, huỷ và hoàn tiền (nếu có)
          được thực hiện theo công bố và phù hợp với Luật Bảo vệ quyền lợi người tiêu dùng 2023. Nếu
          Dịch vụ hiện cung cấp miễn phí, mục này áp dụng khi có tính năng trả phí.
        </p>
      </Section>

      <Section title="9. Quyền sở hữu trí tuệ">
        <ul className="list-disc pl-6 space-y-1">
          <li>Phần mềm, giao diện, thương hiệu, tài liệu và nội dung do chúng tôi cung cấp thuộc quyền sở hữu của chúng tôi hoặc bên cấp phép, được bảo hộ theo pháp luật sở hữu trí tuệ.</li>
          <li>Bạn giữ quyền đối với nội dung do bạn cung cấp; đồng thời cấp cho chúng tôi quyền sử dụng cần thiết để vận hành, cải thiện và bảo đảm an toàn Dịch vụ.</li>
          <li>Không sao chép, phân phối, dịch ngược hoặc khai thác trái phép Dịch vụ.</li>
        </ul>
      </Section>

      <Section title="10. Dữ liệu cá nhân & quyền riêng tư">
        <p>
          Việc thu thập và xử lý dữ liệu cá nhân được mô tả tại{" "}
          <a href="/privacy" className="text-blue-600 underline">Chính sách Bảo mật</a>, đặc biệt các
          quy định về <strong>dữ liệu trẻ em</strong> và sự đồng ý của phụ huynh. Khi đồng ý Điều
          khoản này, bạn đồng thời đồng ý với Chính sách Bảo mật.
        </p>
      </Section>

      <Section title="11. Tạm ngừng & chấm dứt">
        <ul className="list-disc pl-6 space-y-1">
          <li>Chúng tôi có thể tạm ngừng hoặc chấm dứt quyền truy cập nếu bạn vi phạm Điều khoản hoặc pháp luật, sau thông báo phù hợp (trừ trường hợp khẩn cấp về an toàn/pháp lý).</li>
          <li>Bạn có thể ngừng sử dụng và yêu cầu đóng tài khoản bất kỳ lúc nào; khi đó dữ liệu được xử lý theo mục 9 của Chính sách Bảo mật.</li>
        </ul>
      </Section>

      <Section title="12. Giới hạn trách nhiệm">
        <p>
          Trong phạm vi tối đa pháp luật cho phép, chúng tôi không chịu trách nhiệm cho thiệt hại gián
          tiếp, ngẫu nhiên hoặc hậu quả phát sinh từ việc sử dụng Dịch vụ. Điều khoản này{" "}
          <strong>không loại trừ</strong> trách nhiệm mà pháp luật không cho phép loại trừ — bao gồm
          trách nhiệm do lỗi cố ý, vi phạm nghiêm trọng và các quyền bắt buộc của người tiêu dùng theo
          pháp luật Việt Nam.
        </p>
      </Section>

      <Section title="13. Bồi thường">
        <p>
          Bạn đồng ý bồi hoàn cho chúng tôi các thiệt hại, chi phí hợp lý phát sinh do bạn vi phạm
          Điều khoản hoặc pháp luật, hoặc do bạn sử dụng Dịch vụ trái phép, trong phạm vi pháp luật
          quy định.
        </p>
      </Section>

      <Section title="14. Sự kiện bất khả kháng">
        <p>
          Chúng tôi không chịu trách nhiệm cho việc chậm trễ hoặc không thực hiện do sự kiện bất khả
          kháng (thiên tai, sự cố hạ tầng/viễn thông, thay đổi pháp luật, tấn công mạng ngoài tầm kiểm
          soát hợp lý…) theo Điều 156 Bộ luật Dân sự 2015.
        </p>
      </Section>

      <Section title="15. Luật áp dụng & giải quyết tranh chấp">
        <p>
          Điều khoản này được điều chỉnh bởi <strong>pháp luật Việt Nam</strong>. Tranh chấp phát
          sinh trước hết được giải quyết bằng thương lượng, hoà giải thiện chí; nếu không đạt được,
          tranh chấp sẽ được đưa ra <strong>Toà án có thẩm quyền tại Việt Nam</strong> giải quyết.
        </p>
      </Section>

      <Section title="16. Thay đổi Điều khoản">
        <p>
          Chúng tôi có thể cập nhật Điều khoản theo thời gian, công bố tại trang này kèm ngày hiệu
          lực. Việc tiếp tục sử dụng Dịch vụ sau khi cập nhật đồng nghĩa với việc bạn chấp nhận các
          thay đổi.
        </p>
      </Section>

      <Section title="17. Liên hệ">
        <p>
          Mọi thắc mắc về Điều khoản, vui lòng liên hệ <strong>CTS LAB</strong> — email{" "}
          <a href="mailto:ctslab@ptit.vn" className="text-blue-600 underline">ctslab@ptit.vn</a>,
          điện thoại 035 735 3236, địa chỉ Học viện Công nghệ Bưu chính Viễn thông, Km10 Nguyễn Trãi, Hà Đông, Hà Nội.
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

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      {children}
    </div>
  );
}
