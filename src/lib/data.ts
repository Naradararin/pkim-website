import type { ImageMetadata } from "astro";
import portfolio from "../data/portfolio.json";
import site from "../data/site.json";
import ui from "../i18n/ui.json";

export { site };

export type Lang = "th" | "en";
export const LANGS: Lang[] = ["th", "en"];
export type Text = string | { th: string; en?: string };
export type PhotoRef = { job: string; n: number };
type RawJob = (typeof portfolio.jobs)[number];
export type Job = RawJob & { photos: ImageMetadata[]; coverImg: ImageMetadata };

/** Pick the right language from a { th, en } value (falls back to Thai). */
export function L(v: unknown, lang: Lang): string {
  if (v && typeof v === "object") return ((v as any)[lang] ?? (v as any).th ?? "") as string;
  return (v ?? "") as string;
}

/** UI string from src/i18n/ui.json. */
export function t(lang: Lang, key: string, vars: Record<string, string | number> = {}): string {
  const s = ((ui as any)[lang][key] ?? (ui as any).th[key] ?? key) as string;
  return s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ""));
}

/** Translate a data term (job type, province, ...). Unknown terms stay as written. */
export const term = (s: string, lang: Lang) => ((ui.terms as any)[s]?.[lang] ?? s) as string;

/** Link inside the site, respecting the deploy base path and language. */
export function url(path: string, lang: Lang = "th"): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return base + (lang === "en" ? "/en" : "") + path;
}

/** Text in [square brackets] is a placeholder still waiting for real content. */
export const isTodo = (s: unknown) => typeof s === "string" && s.trim().startsWith("[");

const files = import.meta.glob<{ default: ImageMetadata }>("../assets/portfolio/*/*.{jpg,jpeg,png,webp}", { eager: true });

export function photosOf(id: string): ImageMetadata[] {
  return Object.entries(files)
    .filter(([k]) => k.split("/").at(-2) === id)
    .sort(([a], [b]) => a.localeCompare(b, "en", { numeric: true }))
    .map(([, m]) => m.default);
}

export function photo(ref: PhotoRef): ImageMetadata {
  const img = photosOf(ref.job)[ref.n - 1];
  if (!img) throw new Error(`Photo ${ref.job} #${ref.n} not found`);
  return img;
}

export const JOB_TYPES: string[] = portfolio.jobTypeOptions;
export const CURTAIN_TYPES: string[] = portfolio.curtainTypeOptions;

export const jobs: Job[] = portfolio.jobs
  .map((j) => {
    const photos = photosOf(j.id);
    if (!photos.length) throw new Error(`No photos for job ${j.id}. Run: npm run photos -- <folder>`);
    return { ...j, photos, coverImg: photos[Math.min(Math.max((j.cover ?? 1) - 1, 0), photos.length - 1)] };
  })
  .sort((a, b) => b.date.localeCompare(a.date));

export const featured = jobs.filter((j) => j.featured).sort((a, b) => (a.featured ?? 0) - (b.featured ?? 0));

/** Everything about a job that is shown as text, in one language. */
export function view(j: Job, lang: Lang) {
  const [y, m] = j.date.split("-").map(Number);
  const housing = term(j.housing, lang);
  const province = term(j.province, lang);
  const area = lang === "en" ? `${housing}, ${province}` : `${housing} ${province}`;
  return {
    // Jobs without a place name show as "<housing type> <province>".
    title: j.place ?? area,
    subtitle: j.place ? area : "",
    area,
    housing,
    province,
    dateText: `${(ui as any)[lang].months[m - 1]} ${lang === "th" ? y + 543 : y}`,
    jobTypes: j.jobTypes.map((x) => term(x, lang)),
    curtainTypes: j.curtainTypes.map((x) => term(x, lang)),
    level: term(j.level, lang),
    summary: j.summary ? L(j.summary, lang) : "",
    story: j.story ? L(j.story, lang) : "",
  };
}

export const brandName = (lang: Lang) => L(site.business.name, lang);
export const lineHref = (lang: Lang) => site.contact.lineUrl || url("/#contact", lang);
export const telHref = (p: string) => `tel:${p.replace(/[^\d+]/g, "")}`;
