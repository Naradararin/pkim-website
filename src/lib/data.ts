import type { ImageMetadata } from "astro";
import portfolio from "../data/portfolio.json";
import site from "../data/site.json";

export { site };

export type PhotoRef = { job: string; n: number };
export type Job = (typeof portfolio.jobs)[number] & {
  title: string;
  subtitle: string;
  dateText: string;
  year: string;
  photos: ImageMetadata[];
  coverImg: ImageMetadata;
};

const files = import.meta.glob<{ default: ImageMetadata }>("../assets/portfolio/*/*.{jpg,jpeg,png,webp}", { eager: true });

export function photosOf(id: string): ImageMetadata[] {
  return Object.entries(files)
    .filter(([k]) => k.split("/").at(-2) === id)
    .sort(([a], [b]) => a.localeCompare(b, "en", { numeric: true }))
    .map(([, m]) => m.default);
}

const MONTHS = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

export const JOB_TYPES: string[] = portfolio.jobTypeOptions;
export const CURTAIN_TYPES: string[] = portfolio.curtainTypeOptions;

export const jobs: Job[] = portfolio.jobs
  .map((j) => {
    const photos = photosOf(j.id);
    if (!photos.length) throw new Error(`No photos for job ${j.id}. Run: npm run photos -- <folder>`);
    const [y, m] = j.date.split("-").map(Number);
    const area = `${j.housing} ${j.province}`;
    return {
      ...j,
      // Jobs without a place name show as "<housing type> <province>".
      title: j.place ?? area,
      subtitle: j.place ? area : "",
      dateText: `${MONTHS[m - 1]} ${y + 543}`,
      year: String(y + 543),
      photos,
      coverImg: photos[Math.min(Math.max((j.cover ?? 1) - 1, 0), photos.length - 1)],
    };
  })
  .sort((a, b) => b.date.localeCompare(a.date));

export const featured = jobs.filter((j) => j.featured).sort((a, b) => (a.featured ?? 0) - (b.featured ?? 0));

export function photo(ref: PhotoRef): ImageMetadata {
  const list = photosOf(ref.job);
  const img = list[ref.n - 1];
  if (!img) throw new Error(`Photo ${ref.job} #${ref.n} not found`);
  return img;
}

/** Link inside the site, respecting the deploy base path. */
export function url(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return base + path;
}

/** Text in [square brackets] is a placeholder still waiting for real content. */
export const isTodo = (s: unknown) => typeof s === "string" && s.trim().startsWith("[");

/** Display label for a curtain type, e.g. "ลอน" -> "ม่านลอน". */
export const curtainLabel = (c: string) => (c.startsWith("มู่ลี่") ? c : "ม่าน" + c);
