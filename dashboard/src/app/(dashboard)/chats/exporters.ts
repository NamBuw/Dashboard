export interface ExportLog {
  id: string;
  sender: string;
  message: string;
  sentiment: string;
  created_at: string;
}

export interface ExportUser {
  id: string;
  username: string;
  displayName: string | null;
  email: string;
  userType: string;
}

function download(name: string, dataUri: string) {
  const a = document.createElement("a");
  a.setAttribute("href", dataUri);
  a.setAttribute("download", name);
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export function exportJson(user: ExportUser, logs: ExportLog[]) {
  if (logs.length === 0) return;
  const data = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(logs, null, 2));
  download(`chat_history_${user.username}_${Date.now()}.json`, data);
}

export function exportCsv(user: ExportUser, logs: ExportLog[]) {
  if (logs.length === 0) return;
  const headers = ["ID", "Sender", "Message", "Sentiment", "Created At"];
  const rows = logs.map((log) => [
    log.id,
    log.sender === "user" ? "User/Bé" : "Robot/PTalk",
    `"${log.message.replace(/"/g, '""')}"`,
    log.sentiment,
    new Date(log.created_at).toLocaleString("vi-VN"),
  ]);
  const csv = "data:text/csv;charset=utf-8,﻿" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  download(`chat_history_${user.username}_${Date.now()}.csv`, encodeURI(csv));
}

export function exportTxt(user: ExportUser, logs: ExportLog[]) {
  if (logs.length === 0) return;
  let txt = `==================================================\n`;
  txt += `NHẬT KÝ HỘI THOẠI ROBOT PTALK ASSISTANT\n`;
  txt += `Tài khoản: ${user.displayName || user.username}\n`;
  txt += `Email: ${user.email}\n`;
  txt += `Ngày xuất báo cáo: ${new Date().toLocaleString("vi-VN")}\n`;
  txt += `==================================================\n\n`;

  for (const log of logs) {
    const time = new Date(log.created_at).toLocaleString("vi-VN");
    const sender = log.sender === "user" ? "BÉ / USER" : "ROBOT PTALK";
    const sentiment =
      log.sentiment === "positive" ? "Tích cực" :
      log.sentiment === "negative" ? "Tiêu cực" : "Trung lập";
    txt += `[${time}] ${sender} (${sentiment}):\n${log.message}\n\n`;
  }

  download(`chat_history_${user.username}_${Date.now()}.txt`, "data:text/plain;charset=utf-8," + encodeURIComponent(txt));
}

export function exportHtml(user: ExportUser, logs: ExportLog[]) {
  if (logs.length === 0) return;
  const name = user.displayName || user.username;
  const body = logs.map((log) => {
    const isUser = log.sender === "user";
    const time = new Date(log.created_at).toLocaleString("vi-VN");
    const badge =
      log.sentiment === "positive" ? ["badge-positive", "Tích cực"] :
      log.sentiment === "negative" ? ["badge-negative", "Tiêu cực"] : ["badge-neutral", "Trung lập"];
    return `<div class="message-row ${isUser ? "user" : "robot"}">
        <div class="bubble">
          <div class="sender-name">${isUser ? "BÉ / USER" : "ROBOT PTALK"}</div>
          <div>${log.message}</div>
          <div class="message-footer">
            <span>${time}</span>
            <span class="sentiment-badge ${badge[0]}">${badge[1]}</span>
          </div>
        </div>
      </div>`;
  }).join("\n");

  const html = `<!DOCTYPE html><html lang="vi"><head><meta charset="UTF-8"><title>Báo cáo Hội thoại - ${name}</title>
<style>
body{background:#f7f8fa;color:#14161c;font-family:-apple-system,BlinkMacSystemFont,sans-serif;margin:0;padding:40px 20px;display:flex;justify-content:center}
.container{max-width:750px;width:100%;background:#fff;border:1px solid #edeef1;border-radius:24px;padding:30px;box-shadow:0 12px 32px rgba(20,22,28,.08)}
h1{font-size:24px;margin-top:0;color:#14161c;border-bottom:1px solid #edeef1;padding-bottom:15px}
.meta-grid{display:grid;grid-template-columns:1fr 1fr;gap:15px;margin-bottom:30px;background:#f7f8fa;padding:15px;border-radius:12px;font-size:13px}
.meta-item{color:#878d9a}.meta-item strong{color:#14161c}
.chat-container{display:flex;flex-direction:column;gap:16px;margin-bottom:20px}
.message-row{display:flex;width:100%}.message-row.user{justify-content:flex-end}.message-row.robot{justify-content:flex-start}
.bubble{max-width:70%;padding:14px 18px;border-radius:18px;font-size:14px;line-height:1.5}
.user .bubble{background:#3b6fe0;color:#fff;border-bottom-right-radius:4px}
.robot .bubble{background:#f7f8fa;color:#14161c;border:1px solid #edeef1;border-bottom-left-radius:4px}
.sender-name{font-size:11px;font-weight:bold;margin-bottom:6px;text-transform:uppercase;letter-spacing:.5px}
.user .sender-name{color:rgba(255,255,255,.7);text-align:right}.robot .sender-name{color:#878d9a}
.message-footer{display:flex;justify-content:space-between;align-items:center;margin-top:8px;font-size:10px;opacity:.8}
.sentiment-badge{display:inline-flex;align-items:center;gap:4px;padding:2px 6px;border-radius:9999px;font-weight:bold}
.badge-positive{background:rgba(63,191,142,.18);color:#3fbf8e}
.badge-neutral{background:rgba(154,163,178,.18);color:#878d9a}
.badge-negative{background:rgba(232,103,95,.18);color:#e8675f}
</style></head><body>
<div class="container">
<h1>Nhật ký hội thoại với PTalk Assistant</h1>
<div class="meta-grid">
<div class="meta-item">Người dùng: <strong>${name}</strong></div>
<div class="meta-item">Mạng kết nối: <strong>PTalk Ecosystem</strong></div>
<div class="meta-item">Loại tài khoản: <strong style="text-transform:capitalize">${user.userType}</strong></div>
<div class="meta-item">Ngày xuất: <strong>${new Date().toLocaleString("vi-VN")}</strong></div>
</div>
<div class="chat-container">${body}</div>
</div></body></html>`;
  download(`chat_history_${user.username}_${Date.now()}.html`, "data:text/html;charset=utf-8," + encodeURIComponent(html));
}
