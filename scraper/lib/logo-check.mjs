import Anthropic from "@anthropic-ai/sdk";
import { readJson, writeFile } from "./util.mjs";

const MODEL = process.env.LOGO_MODEL || "claude-opus-5-5";
// Server-side refusal fallback is only offered on these models.
const FALLBACK_MODELS = new Set(["claude-opus-5-5", "claude-opus-5", "claude-fable-5-1", "claude-sonnet-5-5"]);
const MEDIA_TYPES = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const PROMPT = `This is a product photo from a flower and gift shop.
Does it show any brand logo or brand name/wordmark? Look carefully at packaging, boxes, vases, ribbons, cards, tags, bags and watermarks; logos are often small, curved or repeated.
Count it even if it is small or partially visible. Do not count generic text with no brand, such as "Happy Birthday" or "I love you".
- brands: the brand names you can read (empty if none, or if a logo is present but unreadable).
- placement: briefly where the logo appears, e.g. "printed on gift boxes" ("" if none).`;

const SCHEMA = {
  type: "object",
  properties: {
    has_logo: { type: "boolean" },
    brands: { type: "array", items: { type: "string" } },
    placement: { type: "string" },
    confidence: { type: "string", enum: ["high", "medium", "low"] },
  },
  required: ["has_logo", "brands", "placement", "confidence"],
  additionalProperties: false,
};

function mediaTypeFor(url, contentType) {
  const type = contentType?.split(";")[0].trim().toLowerCase();
  if (MEDIA_TYPES.has(type)) return type;
  const ext = url.split("?")[0].split(".").pop().toLowerCase();
  return { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", gif: "image/gif", webp: "image/webp" }[ext] ?? null;
}

/**
 * Returns a checker that asks Claude whether an image contains a brand logo,
 * caching results by image URL so re-runs only check new images.
 * Returns null when no API credentials are configured.
 */
export async function createLogoChecker({ cachePath, http }) {
  if (!process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN) return null;

  const client = new Anthropic({ maxRetries: 5 });
  const cache = await readJson(cachePath, {});
  let unsaved = 0;

  async function save() {
    await writeFile(cachePath, JSON.stringify(cache, null, 2));
    unsaved = 0;
  }

  async function classify(url) {
    const { buffer, contentType } = await http.request(url, { as: "buffer" });
    const mediaType = mediaTypeFor(url, contentType);
    if (!mediaType) return { has_logo: null, error: `unsupported image type ${contentType}` };
    if (buffer.length > MAX_IMAGE_BYTES) return { has_logo: null, error: "image larger than 5 MB" };

    const response = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 4000,
      ...(FALLBACK_MODELS.has(MODEL) && { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" }),
      output_config: { effort: "low", format: { type: "json_schema", schema: SCHEMA } },
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: mediaType, data: buffer.toString("base64") } },
            { type: "text", text: PROMPT },
          ],
        },
      ],
    });

    if (response.stop_reason === "refusal") return { has_logo: null, error: "model declined to answer" };
    if (response.stop_reason === "max_tokens") return { has_logo: null, error: "response truncated" };
    const text = response.content.find((block) => block.type === "text")?.text;
    return JSON.parse(text);
  }

  async function check(url) {
    if (cache[url]) return cache[url];
    let result;
    try {
      result = await classify(url);
    } catch (err) {
      return { has_logo: null, error: err.message };
    }
    // Only cache real answers, so failures are retried on the next run.
    if (result.has_logo != null) {
      cache[url] = result;
      if (++unsaved >= 25) await save();
    }
    return result;
  }

  return { model: MODEL, isCached: (url) => Boolean(cache[url]), check, save };
}
