import { Octokit } from "@octokit/rest";
import { cache } from "react";
import { parseConfig, filterPaths, type ParsedConfig } from "./config";

let _octokit: Octokit | null = null;

function octokit(): Octokit {
  if (!_octokit) {
    _octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
  }
  return _octokit;
}

/** Splits "owner/repo" into { owner, repo }. */
function splitRepo(repo: string): { owner: string; repo: string } {
  const [owner, name] = repo.split("/");
  if (!owner || !name) throw new Error(`Invalid repo format: "${repo}". Expected "owner/repo".`);
  return { owner, repo: name };
}

// ── Config ────────────────────────────────────────────────────────────────

let _configCache: { config: ParsedConfig; fetchedAt: number } | null = null;
const CONFIG_TTL_MS = 60_000; // 1 minute soft-cache between webhook-triggered rebuilds

export async function getConfig(): Promise<ParsedConfig> {
  const now = Date.now();
  if (_configCache && now - _configCache.fetchedAt < CONFIG_TTL_MS) {
    return _configCache.config;
  }

  const docsRepo = process.env.DOCS_REPO;
  if (!docsRepo) throw new Error("DOCS_REPO environment variable is not set");

  const { owner, repo } = splitRepo(docsRepo);

  const { data } = await octokit().repos.getContent({
    owner,
    repo,
    path: "vaimopages.config",
  });

  if (Array.isArray(data) || data.type !== "file") {
    throw new Error("vaimopages.config not found or is not a file");
  }

  const raw = Buffer.from(data.content, "base64").toString("utf-8");
  const config = parseConfig(raw);

  _configCache = { config, fetchedAt: now };
  return config;
}

/** Invalidate the in-memory config cache (called by the webhook handler). */
export function invalidateConfigCache(): void {
  _configCache = null;
}

// ── File tree ─────────────────────────────────────────────────────────────

export interface TreeEntry {
  path: string;
  type: "blob" | "tree";
  size?: number;
  sha: string;
}

export const getFilteredTree = cache(async (branch: string): Promise<{ entries: TreeEntry[]; config: ParsedConfig }> => {
  const config = await getConfig();
  const { owner, repo } = splitRepo(config.source.repo);

  const { data } = await octokit().git.getTree({
    owner,
    repo,
    tree_sha: branch,
    recursive: "1",
  });

  const allPaths = (data.tree as TreeEntry[])
    .filter((e) => e.type === "blob")
    .map((e) => e.path);

  const allowed = new Set(filterPaths(allPaths, config));

  const entries = (data.tree as TreeEntry[]).filter(
    (e) => e.type === "blob" && allowed.has(e.path)
  );

  return { entries, config };
});

// ── File content ──────────────────────────────────────────────────────────

export interface FileContent {
  path: string;
  content: string;       // base64-encoded
  encoding: "base64";
  size: number;
  sha: string;
  lastCommit: {
    message: string;
    date: string;
    author: string;
  } | null;
}

export async function getFileContent(filePath: string, branch: string): Promise<FileContent> {
  const config = await getConfig();
  const { owner, repo } = splitRepo(config.source.repo);

  const { data } = await octokit().repos.getContent({
    owner,
    repo,
    path: filePath,
    ref: branch,
  });

  if (Array.isArray(data) || data.type !== "file") {
    throw new Error(`${filePath} is not a file`);
  }

  // Fetch the most recent commit that touched this file
  let lastCommit: FileContent["lastCommit"] = null;
  try {
    const commits = await octokit().repos.listCommits({
      owner,
      repo,
      path: filePath,
      sha: branch,
      per_page: 1,
    });
    if (commits.data.length > 0) {
      const c = commits.data[0];
      lastCommit = {
        message: c.commit.message.split("\n")[0], // first line only
        date: c.commit.author?.date ?? "",
        author: c.commit.author?.name ?? "",
      };
    }
  } catch {
    // non-fatal
  }

  return {
    path: data.path,
    content: data.content,
    encoding: "base64",
    size: data.size,
    sha: data.sha,
    lastCommit,
  };
}

/** Returns raw binary Buffer for a file — used for downloads. */
export async function getRawFileBuffer(filePath: string, branch: string): Promise<{ buffer: Buffer; name: string }> {
  const file = await getFileContent(filePath, branch);
  const buffer = Buffer.from(file.content, "base64");
  const name = filePath.split("/").pop() ?? filePath;
  return { buffer, name };
}
