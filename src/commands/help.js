import { c } from "../cli.js";

const USAGE = `
${c.bold("EdgeWell")} - private on-device health & finance coach (powered by QVAC)

${c.bold("Usage:")}
  edgewell <command> [options]

${c.bold("Commands:")}
  ${c.cyan("serve")}                      Start a P2P server hosting the delegate model
  ${c.cyan("chat")}                       Interactive REPL chat (routes to specialists)
  ${c.cyan("ask")} "<question>"           One-shot question, streamed
  ${c.cyan("journal add")} <text>         Append a journal entry
  ${c.cyan("journal list")}               List recent journal entries
  ${c.cyan("expense add")} <amt> <cat>    Append an expense
  ${c.cyan("expense list")}               List recent expenses
  ${c.cyan("rag ingest <file>")}          Index a text file into the local RAG store
  ${c.cyan("rag search")} "<query>"       Search the RAG index
  ${c.cyan("plan health")} "<goal>"       Generate a 7-day health plan
  ${c.cyan("plan finance")} [--income N]  Generate a monthly finance plan
  ${c.cyan("profile show|set|init")}      View or update the user profile
  ${c.cyan("profile-reset")}               Clear the on-disk user profile (v3.0.0)
  ${c.cyan("profiles list|show|apply")}   Manage form-factor profiles (v3.0.0)
  ${c.cyan("companion --port N")}         Start the v3.0.0 mobile companion server
  ${c.cyan("multimodal <file>")}          Ingest image/audio/text into RAG (v3.0.0)
  ${c.cyan("sensors ingest|summarise")}   Process wearable JSONL streams (v3.0.0)
  ${c.cyan("vector search|stats|clear")}  Inspect the vector RAG index (v3.0.0)
  ${c.cyan("hybrid \"<query>\"")}          Lexical + vector fused search (v3.0.0)
  ${c.cyan("export <file>")}              Write a portable JSON dump (v3.0.0)
  ${c.cyan("import <file>")}              Merge a JSON dump into the stores (v3.0.0)
  ${c.cyan("compare <a> <b>")}            Diff two export files (v3.0.0)
  ${c.cyan("agents")}                     List the v3.0.0 agent bundle
  ${c.cyan("metrics")}                    Print in-process counters and histograms
  ${c.cyan("info")}                       One-screen overview of EdgeWell
  ${c.cyan("size")}                       On-disk size of the data files
  ${c.cyan("where")}                      Resolved on-disk file paths
  ${c.cyan("deps")}                       Runtime and dev dependencies
  ${c.cyan("seed <N>")}                   Append N synthetic journal+expense rows
  ${c.cyan("demo-data")}                  Load the bundled sample data
  ${c.cyan("today")}                      Today's journal and expenses
  ${c.cyan("yesterday")}                  Yesterday's journal and expenses
  ${c.cyan("tail [N]")}                   Last N journal entries (default 10)
  ${c.cyan("grep <pattern>")}             Substring search of the journal
  ${c.cyan("word-count")}                 Journal word and character counts
  ${c.cyan("journal-stats")}              Journal length, range, top tags
  ${c.cyan("expenses-stats")}             Expense totals, range, per-category
  ${c.cyan("tag-stats")}                  Per-tag first/last/count
  ${c.cyan("tag-cloud")}                  ASCII tag cloud
  ${c.cyan("tags-add <id> <tag>")}        Append a tag to a journal entry
  ${c.cyan("lint")}                       Data integrity check
  ${c.cyan("token [subject]")}            Mint a companion bearer token
  ${c.cyan("self-test")}                  Run the project test suite
  ${c.cyan("ci")}                         Local GitHub Actions checks
  ${c.cyan("version-history [N]")}        Last N CHANGELOG.md commits
  ${c.cyan("summary week|month")}         Roll up journal + expenses (v2.0.0+)
  ${c.cyan("tags")}                       Show top journal tags (v2.0.0+)
  ${c.cyan("eval <expr>")}                Calculator tool one-shot (v2.0.0+)
  ${c.cyan("bench")}                      LLM throughput benchmark (v2.0.0+)
  ${c.cyan("snapshot")}                   Dump profile + journal + expenses as JSON
  ${c.cyan("models list|describe")}       Browse the QVAC model registry
  ${c.cyan("plugins list|run")}           Manage local plugins (EDGEWELL_PLUGINS)
  ${c.cyan("status")}                     Show config, peer status, RAG size
  ${c.cyan("doctor")}                     Run self-checks
  ${c.cyan("config")}                     Print the resolved config
  ${c.cyan("version")}                    Print version
  ${c.cyan("help")}                       This help

${c.bold("Environment:")}
  EDGEWELL_MODEL            Local model id (default: LLAMA_3_2_1B_INST_Q4_0)
  EDGEWELL_DELEGATE_MODEL   Peer model id
  EDGEWELL_P2P_HOST         Peer host (default: 127.0.0.1)
  EDGEWELL_P2P_PORT         Peer port (default: 8787)
  EDGEWELL_P2P_ENABLED=1    Enable delegation to peer with local fallback
  EDGEWELL_LOG              Log level: debug | info | warn | error
  EDGEWELL_PLUGINS          Plugin directory (default: ./plugins)
  EDGEWELL_RAG_ENCRYPTED=1  Use the encrypted RAG store

${c.bold("Examples:")}
  edgewell ask "How can I sleep better this week?"
  edgewell expense add 250 food
  edgewell rag ingest ~/notes/labs.txt
  edgewell serve --port 8787
  edgewell doctor
  edgewell plugins run
`.trim();

export async function helpCommand() {
  console.log(USAGE);
}
