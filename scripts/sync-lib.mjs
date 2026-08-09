#!/usr/bin/env node
// sync-lib.mjs — keep the demos site linked against a local clone of the
// stellar-appkit library so we always pick up the latest source, without
// waiting for an npm publish.
//
// Workflow:
//   preinstall  (--clone-only) : clone the library repo if missing (only step
//                                needed before `npm install` can resolve the
//                                `file:` paths in package.json).
//   postinstall / predev / prebuild
//                              : idempotent — clone if missing, install deps
//                                if missing, build if any dist/ is missing.
//                                Fast no-op on the happy path.
//   --pull                      : `git pull` the library + force rebuild.
//   --build                     : force rebuild (no pull).
//
// The library is cloned at ../stellar-appkit (sibling of this demos repo),
// matching the `file:../stellar-appkit/packages/<pkg>` paths in package.json.
//
// Requires: node >= 18, git, npm. Does NOT require bun — we use
// `npm install` + `npm run build --workspaces` at the library root, which
// works on any CI environment that has node + npm.

import { execSync } from "node:child_process";
import {
  existsSync,
  lstatSync,
  readlinkSync,
  readFileSync,
} from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = resolve(__filename, "..");
const DEMOS_ROOT = resolve(__dirname, "..");
const LIB_ROOT = resolve(DEMOS_ROOT, "../stellar-appkit");

const LIB_REPO_URL = "https://github.com/SagantaHQ/stellar-appkit.git";

// The three published packages, in workspace-build order. The `distFile` is
// the canonical build artifact we use to decide whether a package needs
// rebuilding.
const PACKAGES = [
  {
    name: "@saganta/stellar-appkit",
    dir: "packages/core",
    distFile: "dist/index.js",
  },
  {
    name: "@saganta/stellar-appkit-ui-web",
    dir: "packages/ui-web",
    distFile: "dist/ui-web/index.js",
  },
  {
    name: "@saganta/stellar-appkit-siws-verify",
    dir: "packages/siws-verify",
    distFile: "dist/index.js",
  },
];

const log = (msg) => console.log(`\n[sync-lib] ${msg}`);
const run = (cmd, opts = {}) => {
  console.log(`$ ${cmd}`);
  execSync(cmd, { stdio: "inherit", ...opts });
};

function readPkgVersion(pkgDir) {
  try {
    const pkg = JSON.parse(
      readFileSync(join(LIB_ROOT, pkgDir, "package.json"), "utf8"),
    );
    return pkg.version ?? "?";
  } catch {
    return "?";
  }
}

function isLibCloned() {
  return existsSync(join(LIB_ROOT, ".git"));
}

function ensureCloned() {
  if (isLibCloned()) return;
  log(`library not found at ${LIB_ROOT}`);
  log(`cloning ${LIB_REPO_URL} (depth=1)...`);
  run(`git clone --depth 1 ${LIB_REPO_URL} ${LIB_ROOT}`);
}

function pullLatest() {
  if (!isLibCloned()) {
    ensureCloned();
    return;
  }
  log(`pulling latest on main...`);
  run(`git fetch --quiet origin main`, { cwd: LIB_ROOT });
  // Only fast-forward; never create a merge commit (avoids surprising the
  // user if they have local library changes).
  run(`git pull --ff-only origin main`, { cwd: LIB_ROOT });
}

function depsInstalled() {
  return existsSync(join(LIB_ROOT, "node_modules"));
}

function installDeps() {
  if (depsInstalled()) {
    log("library deps already installed");
    return;
  }
  log("installing library deps (npm install at library root)...");
  // `npm install` at the library root resolves the workspace layout
  // (workspaces: ["packages/*"]) and hoists everything into LIB_ROOT/node_modules.
  // We deliberately do NOT use --production so devDependencies needed for the
  // build (typescript) are available.
  run(`npm install --no-audit --no-fund`, { cwd: LIB_ROOT });
}

function allPackagesBuilt() {
  return PACKAGES.every((p) =>
    existsSync(join(LIB_ROOT, p.dir, p.distFile)),
  );
}

function buildPackages({ force = false } = {}) {
  if (!force && allPackagesBuilt()) {
    log("all packages already built — skipping (use --build to force)");
    return;
  }
  log("building all packages (npm run build --workspaces)...");
  // `npm run build --workspaces` runs each workspace's own `build` script
  // (which is `tsc -p tsconfig.json`) with the CWD set to that workspace.
  // No bun required.
  run(`npm run build --workspaces`, { cwd: LIB_ROOT });
}

function printVersions() {
  log("linked package versions:");
  for (const p of PACKAGES) {
    const v = readPkgVersion(p.dir);
    const linkPath = join(DEMOS_ROOT, "node_modules", p.name);
    let target = "n/a (run npm install)";
    try {
      // lstatSync (not statSync) — statSync follows the symlink and reports
      // the *target's* type, which is always a directory here, so it would
      // never report isSymbolicLink() === true.
      if (existsSync(linkPath) && lstatSync(linkPath).isSymbolicLink()) {
        target = readlinkSync(linkPath);
      } else if (existsSync(linkPath)) {
        target = "(not a symlink — stale copy)";
      }
    } catch {
      target = "(error reading link)";
    }
    console.log(`  ${p.name}@${v}  →  ${target}`);
  }
}

// ---- CLI entry -----------------------------------------------------------

const arg = process.argv[2] ?? "";

if (arg === "--clone-only") {
  // preinstall hook — at this point node_modules is empty / stale and
  // `file:` paths in package.json can't be resolved until the library
  // exists. We ONLY clone here; npm install will then create the symlinks,
  // and postinstall will install+build the library.
  ensureCloned();
  log("clone ready — npm install can now resolve @saganta/* symlinks");
} else if (arg === "--pull") {
  ensureCloned();
  pullLatest();
  installDeps();
  buildPackages({ force: true });
  printVersions();
} else if (arg === "--build") {
  ensureCloned();
  installDeps();
  buildPackages({ force: true });
  printVersions();
} else {
  // default: idempotent — used by postinstall / predev / prebuild
  ensureCloned();
  installDeps();
  buildPackages({ force: false });
  printVersions();
}
