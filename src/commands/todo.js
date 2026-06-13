// `edgewell todo` lists the user's todos. Todos are stored in
// `profile.todos`, an array of `{ text, done }` items. v3.0.0
// keeps the todo state in the profile so it travels with the
// user when the profile is exported.

import { c, header } from "../cli.js";

export async function todoCommand(_args, ew) {
  const profile = await ew.profile.load();
  const todos = profile.todos ?? [];
  header("Todos");
  if (todos.length === 0) {
    console.log(c.dim("(no todos — set profile.todos = [...] in your profile.json)"));
    return;
  }
  for (const t of todos) {
    const box = t.done ? c.green("[x]") : "[ ]";
    console.log(`  ${box} ${t.text ?? t}`);
  }
}
