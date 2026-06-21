"use client";

// Lightweight, dependency-free Markdown renderer for chat bubbles.
// Safe by construction: the raw text is HTML-escaped FIRST, then only a known set
// of safe tags (strong/em/code/ul/ol/li/a/div) is introduced, and links are
// restricted to http(s). No raw user HTML can reach the DOM.

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Inline formatting applied to an already-escaped line.
function inline(s: string): string {
  // links [text](http(s)://url)
  s = s.replace(
    /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
    (_m, t, u) =>
      `<a href="${u}" target="_blank" rel="noopener noreferrer" style="color:var(--blue);text-decoration:underline">${t}</a>`,
  );
  // bold: **text** / __text__
  s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/__([^_]+)__/g, "<strong>$1</strong>");
  // italic: *text* / _text_ (won't touch the bold markers handled above)
  s = s.replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>");
  s = s.replace(/(^|[^_])_([^_\n]+)_/g, "$1<em>$2</em>");
  // inline code: `code`
  s = s.replace(
    /`([^`]+)`/g,
    '<code style="background:rgba(127,127,127,.18);padding:1px 5px;border-radius:5px;font-size:.92em">$1</code>',
  );
  return s;
}

function renderMarkdown(raw: string): string {
  const lines = escapeHtml(raw ?? "").split(/\r?\n/);
  const out: string[] = [];

  let listType: "ul" | "ol" | null = null;
  const closeList = () => {
    if (listType) {
      out.push(`</${listType}>`);
      listType = null;
    }
  };

  // Fenced code blocks ( ``` ... ``` ) — collected verbatim, no inline formatting.
  let inCode = false;
  let codeBuf: string[] = [];
  const flushCode = () => {
    out.push(
      '<pre style="background:rgba(127,127,127,.16);padding:10px 12px;border-radius:10px;overflow:auto;margin:6px 0">' +
        `<code style="font-size:.9em;white-space:pre;background:none;padding:0">${codeBuf.join("\n")}</code></pre>`,
    );
    codeBuf = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();

    // toggle fenced code block on a ``` line (language after the fence is ignored)
    if (trimmed.startsWith("```")) {
      if (inCode) {
        inCode = false;
        flushCode();
      } else {
        closeList();
        inCode = true;
      }
      continue;
    }
    if (inCode) {
      codeBuf.push(line);
      continue;
    }

    const ol = trimmed.match(/^(\d+)[.)]\s+(.*)$/);
    const ul = trimmed.match(/^[-*+•]\s+(.*)$/);
    const h = trimmed.match(/^(#{1,3})\s+(.*)$/);

    if (ol) {
      if (listType !== "ol") {
        closeList();
        // list-style is set inline so Tailwind's preflight reset doesn't hide markers
        out.push('<ol style="margin:4px 0;padding-left:22px;list-style:decimal outside">');
        listType = "ol";
      }
      out.push(`<li style="margin:2px 0">${inline(ol[2])}</li>`);
    } else if (ul) {
      if (listType !== "ul") {
        closeList();
        out.push('<ul style="margin:4px 0;padding-left:22px;list-style:disc outside">');
        listType = "ul";
      }
      out.push(`<li style="margin:2px 0">${inline(ul[1])}</li>`);
    } else if (h) {
      closeList();
      out.push(`<div style="font-weight:700;margin:6px 0 2px">${inline(h[2])}</div>`);
    } else if (trimmed === "") {
      closeList();
      out.push('<div style="height:5px"></div>');
    } else {
      closeList();
      out.push(`<div>${inline(line)}</div>`);
    }
  }

  if (inCode) flushCode(); // unclosed fence — render what we have
  closeList();
  return out.join("");
}

export default function ChatMarkdown({ text }: { text: string }) {
  return (
    <div
      style={{ whiteSpace: "normal", wordBreak: "break-word" }}
      dangerouslySetInnerHTML={{ __html: renderMarkdown(text) }}
    />
  );
}
