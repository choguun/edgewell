// Example plugin: route-version. Adds a /version route to the
// companion server that returns the EdgeWell package version.

import { readFile } from "node:fs/promises";

export default {
  name: "route-version-example",
  version: "0.1.0",
  hooks: {
    registerRoute({ register }) {
      register({
        method: "GET",
        pattern: /^\/version$/,
        handler: async ({ res }) => {
          const pkg = JSON.parse(await readFile("./package.json", "utf8"));
          res.statusCode = 200;
          res.setHeader("content-type", "application/json");
          res.end(JSON.stringify({ name: pkg.name, version: pkg.version }));
        },
      });
    },
  },
};
