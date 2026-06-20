// v3.0.2: minimal safe markdown renderer for the EdgeWell web
// UI. Extracted from app.js so it can be unit-tested in Node
// without a DOM. Loaded as a separate <script> in
// index.html so it stays in the global scope (the rest of
// the app is vanilla JS without a build step).
//
// Design: escape the source first, then emit a small set
// of HTML tags from explicit substitutions. The link
// `href` is whitelisted to http(s):, mailto:, and relative
// URLs to neutralize `javascript:` and `data:` schemes.

(function (global) {
  function escapeHtml(s) {
    return String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function safeHref(url) {
    const t = String(url).trim();
    if (/^(https?:|mailto:|\/|#)/i.test(t)) return t;
    return "#";
  }

  function renderInline(escaped) {
    let out = escaped;
    out = out.replace(/`([^`\n]+)`/g, (_, code) =>
      `<code class="md-code-inline">${code}</code>`,
    );
    out = out.replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>");
    out = out.replace(/__([^_\n]+)__/g, "<strong>$1</strong>");
    out = out.replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, "<em>$1</em>");
    out = out.replace(/(?<!_)_([^_\n]+)_(?!_)/g, "<em>$1</em>");
    out = out.replace(
      /\[([^\]]+)\]\(([^)\s]+)\)/g,
      (_, label, url) =>
        `<a href="${safeHref(url)}" class="md-link" target="_blank" rel="noopener noreferrer">${label}</a>`,
    );
    out = out.replace(/\n/g, "<br>");
    return out;
  }

  function renderMarkdown(src) {
    const text = String(src ?? "").replace(/\r\n/g, "\n");
    const lines = text.split("\n");
    const out = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i] ?? "";

      if (/^```/.test(line)) {
        const lang = line.replace(/^```/, "").trim();
        const codeLines = [];
        i++;
        while (i < lines.length && !/^```\s*$/.test(lines[i] ?? "")) {
          codeLines.push(lines[i]);
          i++;
        }
        if (i < lines.length) i++;
        const langAttr = lang
          ? ` data-lang="${escapeHtml(lang)}"`
          : "";
        out.push(
          `<pre class="md-pre"><code class="md-code"${langAttr}>${escapeHtml(
            codeLines.join("\n"),
          )}</code></pre>`,
        );
        continue;
      }

      const heading = line.match(/^(#{1,6})\s+(.+)$/);
      if (heading) {
        const level = heading[1].length;
        out.push(
          `<h${level} class="md-h md-h${level}">${renderInline(
            escapeHtml(heading[2]),
          )}</h${level}>`,
        );
        i++;
        continue;
      }

      if (/^---+\s*$/.test(line) || /^\*\*\*+\s*$/.test(line)) {
        out.push('<hr class="md-hr">');
        i++;
        continue;
      }

      if (/^>\s?/.test(line)) {
        const quoteLines = [];
        while (i < lines.length && /^>\s?/.test(lines[i] ?? "")) {
          quoteLines.push((lines[i] ?? "").replace(/^>\s?/, ""));
          i++;
        }
        out.push(
          `<blockquote class="md-quote">${renderInline(
            escapeHtml(quoteLines.join(" ")),
          )}</blockquote>`,
        );
        continue;
      }

      if (/^[-*]\s+/.test(line)) {
        const items = [];
        while (i < lines.length && /^[-*]\s+/.test(lines[i] ?? "")) {
          items.push((lines[i] ?? "").replace(/^[-*]\s+/, ""));
          i++;
        }
        out.push(
          '<ul class="md-ul">' +
            items
              .map(
                (it) =>
                  `<li class="md-li">${renderInline(escapeHtml(it))}</li>`,
              )
              .join("") +
            "</ul>",
        );
        continue;
      }

      if (/^\d+\.\s+/.test(line)) {
        const items = [];
        while (i < lines.length && /^\d+\.\s+/.test(lines[i] ?? "")) {
          items.push((lines[i] ?? "").replace(/^\d+\.\s+/, ""));
          i++;
        }
        out.push(
          '<ol class="md-ol">' +
            items
              .map(
                (it) =>
                  `<li class="md-li">${renderInline(escapeHtml(it))}</li>`,
              )
              .join("") +
            "</ol>",
        );
        continue;
      }

      if (/^\s*$/.test(line)) {
        i++;
        continue;
      }

      const paraLines = [line];
      i++;
      while (i < lines.length) {
        const next = lines[i] ?? "";
        if (
          !next ||
          /^(#{1,6}\s|>\s?|[-*]\s|\d+\.\s|```|---+|\*\*\*+)/.test(next)
        ) {
          break;
        }
        paraLines.push(next);
        i++;
      }
      out.push(
        `<p class="md-p">${renderInline(escapeHtml(paraLines.join("\n")))}</p>`,
      );
    }

    return out.join("\n");
  }

  // Expose for browser (global) and Node (module.exports)
  // so the same file can be loaded by index.html's <script>
  // tag AND required by a unit test in test/markdown.test.ts.
  global.EdgeWellMarkdown = { renderMarkdown, escapeHtml, safeHref };
  if (typeof module !== "undefined" && module.exports) {
    module.exports = { renderMarkdown, escapeHtml, safeHref };
  }
})(typeof window !== "undefined" ? window : globalThis);
