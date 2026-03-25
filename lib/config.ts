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
  comments?: {
    enabled?: boolean;
  };
  features?: {
    images?: boolean;
  };
  include: string[];
  exclude?: string[];
}

export interface ParsedConfig {
  site: { title: string; description: string };
  source: { repo: string; branch: string };
  auth: { sessionDurationDays: number };
  comments: { enabled: boolean };
  features: { images: boolean };
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
    comments: {
      enabled: parsed.comments?.enabled !== false, // default true
    },
    features: {
      images: parsed.features?.images !== false, // default true
    },
    include: parsed.include,
    exclude: parsed.exclude ?? [],
  };
}

const IMAGE_EXTENSIONS = new Set(["png", "jpg", "jpeg", "gif", "webp", "svg"]);
const SUBTITLE_EXTENSIONS = new Set(["vtt", "srt"]);

export { IMAGE_EXTENSIONS, SUBTITLE_EXTENSIONS };

/**
 * Given a list of all file paths in the repo, returns only those
 * that match the include patterns and do not match any exclude pattern.
 * When features.images is enabled, image files are automatically included.
 */
export function filterPaths(allPaths: string[], config: ParsedConfig): string[] {
  const included = new Set(micromatch(allPaths, config.include));

  if (config.features.images) {
    allPaths.forEach((p) => {
      const ext = p.split(".").pop()?.toLowerCase() ?? "";
      if (IMAGE_EXTENSIONS.has(ext)) included.add(p);
    });
  }

  // Always include subtitle files (.vtt, .srt) so they appear in the nav
  allPaths.forEach((p) => {
    const ext = p.split(".").pop()?.toLowerCase() ?? "";
    if (SUBTITLE_EXTENSIONS.has(ext)) included.add(p);
  });

  const includedArr = Array.from(included);
  if (!config.exclude.length) return includedArr;
  return micromatch.not(includedArr, config.exclude);
}
