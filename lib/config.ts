import yaml from "js-yaml";
import micromatch from "micromatch";

export interface VaimoBranchConfig {
  name: string;
  passphrase: string;
  comments?: {
    enabled?: boolean;
  };
}

export interface VaimoConfig {
  site: {
    title: string;
    description?: string;
  };
  auth?: {
    sessionDurationDays?: number;
  };
  branches: VaimoBranchConfig[];
  features?: {
    images?: boolean;
  };
  include: string[];
  exclude?: string[];
}

export interface ParsedBranch {
  name: string;
  passphrase: string;
  comments: { enabled: boolean };
}

export interface ParsedConfig {
  site: { title: string; description: string };
  auth: { sessionDurationDays: number };
  branches: ParsedBranch[];
  features: { images: boolean };
  include: string[];
  exclude: string[];
}

const DEFAULT_SESSION_DAYS = 7;

export function parseConfig(raw: string): ParsedConfig {
  const parsed = yaml.load(raw) as VaimoConfig;

  if (!parsed?.site?.title) throw new Error("projectpages.config: site.title is required");
  if (!parsed?.include?.length) throw new Error("projectpages.config: include list must not be empty");
  if (!parsed?.branches?.length) throw new Error("projectpages.config: branches list must not be empty");

  return {
    site: {
      title: parsed.site.title,
      description: parsed.site.description ?? "",
    },
    auth: {
      sessionDurationDays: parsed.auth?.sessionDurationDays ?? DEFAULT_SESSION_DAYS,
    },
    branches: parsed.branches.map((b) => ({
      name: b.name,
      passphrase: b.passphrase,
      comments: {
        enabled: b.comments?.enabled ?? false,
      },
    })),
    features: {
      images: parsed.features?.images !== false,
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
