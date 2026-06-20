// @ts-nocheck
// Tests for web/markdown.js — the minimal safe markdown
// renderer used by the web UI to format assistant replies.

import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const { renderMarkdown, escapeHtml, safeHref } = createRequire(
  import.meta.url,
)(resolve(here, "../web/markdown.js"));

test("renders a simple paragraph", () => {
  const out = renderMarkdown("Hello, world.");
  assert.equal(out, '<p class="md-p">Hello, world.</p>');
});

test("renders h1..h6 headings", () => {
  assert.match(renderMarkdown("# Title"), /<h1 class="md-h md-h1">Title<\/h1>/);
  assert.match(renderMarkdown("### Sub"), /<h3 class="md-h md-h3">Sub<\/h3>/);
  assert.match(renderMarkdown("###### Deep"), /<h6 class="md-h md-h6">Deep<\/h6>/);
});

test("renders bold with ** and __", () => {
  assert.match(renderMarkdown("a **b** c"), /<strong>b<\/strong>/);
  assert.match(renderMarkdown("a __b__ c"), /<strong>b<\/strong>/);
});

test("renders italic with * and _", () => {
  assert.match(renderMarkdown("a *b* c"), /<em>b<\/em>/);
  assert.match(renderMarkdown("a _b_ c"), /<em>b<\/em>/);
});

test("renders inline code", () => {
  assert.match(
    renderMarkdown("use `npm install` here"),
    /<code class="md-code-inline">npm install<\/code>/,
  );
});

test("renders fenced code blocks with language tag", () => {
  const out = renderMarkdown("```js\nconst x = 1;\n```");
  assert.match(out, /<pre class="md-pre">/);
  assert.match(out, /<code class="md-code" data-lang="js">/);
  assert.match(out, /const x = 1;/);
});

test("renders unordered lists", () => {
  const out = renderMarkdown("- one\n- two\n- three");
  assert.match(out, /<ul class="md-ul">/);
  assert.match(out, /<li class="md-li">one<\/li>/);
  assert.match(out, /<li class="md-li">two<\/li>/);
  assert.match(out, /<li class="md-li">three<\/li>/);
  assert.match(out, /<\/ul>/);
});

test("renders ordered lists", () => {
  const out = renderMarkdown("1. one\n2. two");
  assert.match(out, /<ol class="md-ol">/);
  assert.match(out, /<li class="md-li">one<\/li>/);
  assert.match(out, /<li class="md-li">two<\/li>/);
});

test("renders blockquotes", () => {
  const out = renderMarkdown("> a thoughtful point");
  assert.match(out, /<blockquote class="md-quote">/);
  assert.match(out, /a thoughtful point/);
});

test("renders horizontal rules", () => {
  assert.match(renderMarkdown("---"), /<hr class="md-hr">/);
  assert.match(renderMarkdown("***"), /<hr class="md-hr">/);
});

test("renders links with safe hrefs", () => {
  const out = renderMarkdown("[EdgeWell](https://edgewell.dev)");
  assert.match(
    out,
    /<a href="https:\/\/edgewell\.dev" class="md-link" target="_blank" rel="noopener noreferrer">EdgeWell<\/a>/,
  );
});

test("neutralizes javascript: URLs in links", () => {
  // XSS guard: javascript: URLs should fall back to '#'.
  const out = renderMarkdown("[click](javascript:alert(1))");
  assert.match(out, /<a href="#"/);
  assert.doesNotMatch(out, /javascript:/);
});

test("neutralizes data: URLs in links", () => {
  const out = renderMarkdown("[click](data:text/html,<script>alert(1)</script>)");
  assert.match(out, /<a href="#"/);
  assert.doesNotMatch(out, /data:text\/html/);
});

test("neutralizes file: and vbscript: URLs in links", () => {
  // Defense in depth: any scheme we don't whitelist falls
  // back to '#'. file: and vbscript: are real-world attack
  // vectors we want to neutralize too.
  assert.match(renderMarkdown("[x](file:///etc/passwd)"), /<a href="#"/);
  assert.match(renderMarkdown("[x](vbscript:msgbox)"), /<a href="#"/);
  assert.doesNotMatch(renderMarkdown("[x](file:///etc/passwd)"), /file:/);
  assert.doesNotMatch(renderMarkdown("[x](vbscript:msgbox)"), /vbscript:/);
});

test("escapes raw HTML in the source (XSS)", () => {
  // The renderer's contract: raw HTML in the source is
  // escaped, not rendered. This is the property that keeps
  // RAG text + LLM output safe to assign via innerHTML.
  const out = renderMarkdown('<script>alert(1)</script>');
  assert.doesNotMatch(out, /<script>/);
  assert.match(out, /&lt;script&gt;/);
});

test("escapes ampersands and quotes", () => {
  assert.equal(escapeHtml("a & b"), "a &amp; b");
  assert.equal(escapeHtml('"x"'), "&quot;x&quot;");
});

test("renders the real Llama 3.2 1B output cleanly", () => {
  // The shape of the model output we observed in v3.0.2
  // E2E tests: a paragraph, a heading, a horizontal rule,
  // and a bulleted list with bold spans.
  const out = renderMarkdown(
    "I cannot provide medical advice. " +
      "If you are concerned, consult a professional.\n\n" +
      "# Sleep Tips\n----------------\n\n" +
      "* **Establish a routine**: go to bed at the same time.\n" +
      "* **Wind down**: avoid screens 30 minutes before bed.",
  );
  assert.match(out, /<p class="md-p">I cannot provide medical advice/);
  assert.match(out, /<h1 class="md-h md-h1">Sleep Tips<\/h1>/);
  assert.match(out, /<hr class="md-hr">/);
  assert.match(out, /<ul class="md-ul">/);
  assert.match(out, /<li class="md-li"><strong>Establish a routine<\/strong>: go to bed/);
  assert.match(out, /<li class="md-li"><strong>Wind down<\/strong>: avoid screens/);
});

test("safeHref whitelists known schemes", () => {
  assert.equal(safeHref("https://x.dev"), "https://x.dev");
  assert.equal(safeHref("http://x.dev"), "http://x.dev");
  assert.equal(safeHref("mailto:a@b.com"), "mailto:a@b.com");
  assert.equal(safeHref("/path"), "/path");
  assert.equal(safeHref("#anchor"), "#anchor");
  // Reject unknown schemes
  assert.equal(safeHref("javascript:alert(1)"), "#");
  assert.equal(safeHref("data:text/html,X"), "#");
  assert.equal(safeHref("file:///etc/passwd"), "#");
  assert.equal(safeHref("vbscript:msgbox"), "#");
});
