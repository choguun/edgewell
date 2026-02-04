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
