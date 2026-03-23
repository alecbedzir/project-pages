import yaml from "js-yaml";
import micromatch from "micromatch";

export interface VaimoConfig {
  site: {
    title: string;
    description?: string;
  };
  source: {
    repo: string;
    branch?: string;
  };
  auth?: {
    sessionDurationDays?: number;
  };
  include: string[];
  exclude?: string[];
}

export interface ParsedConfig {
  site: { title: string; description: string };
  source: { repo: string; branch: string };
  auth: { sessionDurationDays: number };
  include: string[];
  exclude: string[];
}

const DEFAULT_SESSION_DAYS = 7;
const DEFAULT_BRANCH = "main";

export function parseConfig(raw: string): ParsedConfig {
  const parsed = yaml.load(raw) as VaimoConfig;

  if (!parsed?.site?.title) throw new Error("vaimopages.config: site.title is required");
  if (!parsed?.source?.repo) throw new Error("vaimopages.config: source.repo is required");
  if (!parsed?.include?.length) throw new Error("vaimopages.config: include list must not be empty");

  return {
    site: {
      title: parsed.site.title,
      description: parsed.site.description ?? "",
    },
    source: {
      repo: parsed.source.repo,
      branch: parsed.source.branch ?? DEFAULT_BRANCH,
    },
    auth: {
      sessionDurationDays: parsed.auth?.sessionDurationDays ?? DEFAULT_SESSION_DAYS,
    },
    include: parsed.include,
    exclude: parsed.exclude ?? [],
  };
}

/**
 * Given a list of all file paths in the repo, returns only those
 * that match the include patterns and do not match any exclude pattern.
 */
export function filterPaths(allPaths: string[], config: ParsedConfig): string[] {
  const included = micromatch(allPaths, config.include);
  if (!config.exclude.length) return included;
  return micromatch.not(included, config.exclude);
}
