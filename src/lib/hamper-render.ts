// Server-side photo of the customer's own hamper: the partner's product photos go to the image model as references,
// the prompt names exactly the chosen products. Used only by /api/hamper-image; needs OPENAI_API_KEY (the route answers 503 without it).
import { HAMPER_ITEMS, hamperCodes, hamperProblems, type HamperSelection } from './hamper';

const byCode = new Map(HAMPER_ITEMS.map((item) => [item.code, item]));
export const RENDER_MODEL = { model: 'gpt-image-2.5-flare', quality: 'medium', size: '1024x1024' } as const;

const STYLE = ' Setting: a smooth warm off-white plaster wall (#F5F2EB) with soft morning window light from the left, on a pale limestone surface. '
  + 'Calm warm off-white background: no plants, no green, pink or dark walls. Palette: ivory and warm paper (#EBE6DC); colour comes only from the products themselves. '
  + 'Photorealistic premium editorial product photograph of ONE finished gift hamper, three-quarter view slightly from above, shallow depth of field, square 1:1, '
  + 'the whole hamper centred with breathing room. Do not add any text, signs, logos or watermarks beyond what is printed on the products themselves. No people.';

/** A valid selection made only of catalogue codes, or null. */
export function parseRenderRequest(body: unknown): HamperSelection | null {
  if (!body || typeof body !== 'object') return null;
  const { basket, picks, treats } = body as Record<string, unknown>;
  const list = (value: unknown, max: number) => (Array.isArray(value) && value.length <= max && value.every((code) => typeof code === 'string' && byCode.has(code)) ? (value as string[]) : null);
  const p = list(picks, 5), t = list(treats, 3);
  if (typeof basket !== 'string' || !byCode.has(basket) || !p || !t) return null;
  const selection = { basket, picks: p, treats: t };
  const all = [basket, ...p, ...t];
  return hamperProblems(selection).length || new Set(all).size !== all.length ? null : selection;
}

export function hamperRenderPrompt(selection: HamperSelection) {
  const codes = hamperCodes(selection);
  const [container, ...contents] = codes.map((code) => byCode.get(code)!);
  const names = contents.map((item) => `${item.en} (${item.noteEn})`);
  return 'The attached photographs are the partner’s own catalogue photos of each product. Keep every product exactly as shown in its photo (shape, colour, pattern, size relationship, printed label). '
    + `Create a new photograph of a finished Diwali gift hamper: the container is the ${container.en} (${container.noteEn}). Inside and around it, arranged neatly and fully visible, are exactly these ${contents.length} products and nothing else: `
    + `${names.join('; ')}. Taller items stand at the back, the treat box sits in front, the whole hamper looks complete and generously filled, tied with a simple cream ribbon. `
    + `Exactly one of each product, no duplicates and no second copy of any box or item (the hamper holds ${contents.length} products in total). Do not invent extra products, flowers, fruit or decorations.${STYLE}`;
}

/** Calls the image model; returns a data URL. Throws on any API failure. */
export async function renderHamper(selection: HamperSelection, origin: string, apiKey: string) {
  const form = new FormData();
  form.set('model', RENDER_MODEL.model); form.set('quality', RENDER_MODEL.quality); form.set('size', RENDER_MODEL.size);
  form.set('output_format', 'jpeg'); form.set('output_compression', '82');
  form.set('prompt', hamperRenderPrompt(selection));
  for (const code of hamperCodes(selection)) {
    const photo = await fetch(new URL(`/hamper/${code.toLowerCase()}.jpg`, origin), { signal: AbortSignal.timeout(10_000) });
    if (!photo.ok) throw new Error(`reference ${code} missing`);
    form.append('image[]', new Blob([await photo.arrayBuffer()], { type: 'image/jpeg' }), `${code.toLowerCase()}.jpg`);
  }
  const response = await fetch('https://api.openai.com/v1/images/edits', { method: 'POST', headers: { Authorization: `Bearer ${apiKey}` }, body: form, signal: AbortSignal.timeout(55_000) });
  if (!response.ok) throw new Error(`image api ${response.status}`);
  const json = (await response.json()) as { data?: Array<{ b64_json?: string }> };
  const image = json.data?.[0]?.b64_json;
  if (!image) throw new Error('no image');
  return `data:image/jpeg;base64,${image}`;
}
