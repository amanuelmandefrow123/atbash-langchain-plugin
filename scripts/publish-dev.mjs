import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const PKG_PATH = new URL("../package.json", import.meta.url).pathname;
const pkg = JSON.parse(readFileSync(PKG_PATH, "utf8"));
const originalVersion = pkg.version;
const originalSdkPeer = pkg.peerDependencies["@atbash/sdk"];

// Use a pre-release version so prod and dev can coexist on npm
pkg.version = `${originalVersion}-dev.0`;
pkg.peerDependencies["@atbash/sdk"] = "*";
writeFileSync(PKG_PATH, JSON.stringify(pkg, null, 2) + "\n");

try {
  execSync("npm publish --tag dev --access public", { stdio: "inherit" });
} finally {
  pkg.version = originalVersion;
  pkg.peerDependencies["@atbash/sdk"] = originalSdkPeer;
  writeFileSync(PKG_PATH, JSON.stringify(pkg, null, 2) + "\n");
}
