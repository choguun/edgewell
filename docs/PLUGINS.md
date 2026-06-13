# EdgeWell Plugin Author Guide

> Applies to EdgeWell v2.0.0+ and v3.0.0.

A plugin is a single JavaScript file that exports a default object
with a `name`, a `version`, and one or more **hooks**. EdgeWell
loads every `*.plugin.js` file in the directory pointed to by the
`EDGEWELL_PLUGINS` environment variable (default `./plugins`).

## Minimal plugin

```js
// plugins/hello.plugin.js
export default {
  name: "hello",
  version: "0.1.0",
  hooks: {
    onLoad({ ew, log }) {
      log.info("hello plugin loaded");
    },
  },
};
```

Run it with `edgewell plugins run`. The `onLoad` hook fires once at
start-up. The `log` argument is the structured logger; use it
instead of `console.log` so messages land in the log file when one
is configured.

## v2.0.0 hooks

- `onLoad({ ew, log })` — fired at start-up.
- `onCommand({ ew, log, command, args })` — fired before a CLI
  command runs. The hook may mutate `args` in place.
- `onPrompt({ ew, log, prompt })` — fired before a chat prompt is
  sent to the LLM. Return a new prompt string to override.
- `onReply({ ew, log, reply })` — fired after the LLM streams a
  reply. Return a new reply string to override.
- `onJournalAppend({ ew, log, entry })` — fired after a journal
  entry is appended. Return a new entry to override.

## v3.0.0 hooks (new)

- `registerEmbedder({ register })` — register a custom embedding
  function. `register({ name, dim, embed })` makes the embedder
  available to `makeEmbedder({ kind: name })`.
- `registerAgent({ register })` — register a custom agent.
  `register({ name, agent })` adds the agent to the orchestrator.
- `registerRoute({ register })` — register a custom HTTP route on
  the companion server. `register({ method, pattern, handler })`.

## Security

The plugin loader is **explicit**: only files matching
`*.plugin.js` in the configured directory are loaded. Subdirectories
are not recursed. There is no `require` — only ES module `import`.
Plugins run with the same Node.js permissions as the CLI, so do not
load plugins from untrusted sources.

## Example plugins

EdgeWell ships a small example plugin (`examples/plugins/sleep.plugin.js`)
that demonstrates the `onLoad` and `onJournalAppend` hooks. v3.0.0
adds `examples/plugins/nutrition-plugin.js` and
`examples/plugins/companion-token-plugin.js` for the new hooks.
