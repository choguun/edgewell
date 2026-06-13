// `edgewell journal-rag-top` is a thin alias around `rag-top`
// that exists for symmetry with the other `*-top` commands.
// v3.0.0 keeps the alias short.

export async function journalRagTopCommand(args, ew) {
  const { ragTopCommand } = await import("./rag-top.js");
  return ragTopCommand(args, ew);
}
