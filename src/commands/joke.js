// `edgewell joke` prints a small joke. v3.0.0 keeps this as a
// tiny demo of the CLI's structure; real humour is out of
// scope for the project.

const JOKES = [
  "Why did the developer go broke? Because he used up all his cache.",
  "How do you organize a space party? You planet.",
  "Why don't scientists trust atoms? Because they make up everything.",
  "What do you call fake spaghetti? An impasta.",
  "Why did the scarecrow win an award? Because he was outstanding in his field.",
];

export async function jokeCommand(_args) {
  const j = JOKES[Math.floor(Math.random() * JOKES.length)];
  console.log(j);
}
