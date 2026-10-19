# Three-way image pilot

The same 5 products, made three ways. The cheapest option that matches on quality makes all 295 remaining images.

| Option | How | Settings in the comparison sheet | Cost basis |
|---|---|---|---|
| 1. OpenAI API | `pilot.py` | `chatgpt-medium-text` (the ChatGPT model, text only) and `flare-medium` (GPT Image 2.5 Flare, supplier photo as guidance) | Measured from each response's token usage |
| 2. Gemini API | `pilot.py` | `nb21-1k-text` (text only) and `nb21-1k` (supplier photo as guidance) | Published per-image price |
| 3. ChatGPT app (your subscription) | `chat_pilot.py`, by hand | `chat-a` (and `chat-b` for the second account) | Your time, plus the subscription you already pay |

The 5 products are Pastel Rose Symphony (bouquet), Pink Lilies in a Glass Vase, Flowers & Chocolate in Box (Ferrero), Bloom & Teddy Delight and Dry Fruit Luxe Hamper.

"Supplier photo as guidance" means the model is told to copy flower types, colours, fullness and container from the photo, then make a **new** photograph with its own angle, background and props, without any of the seller's marks. It is never an edit of the seller's photo.

## Steps

1. **API keys** (each is used only in that terminal and never saved):
   ```bash
   export OPENAI_API_KEY=sk-...
   export GEMINI_API_KEY=...
   ```
   OpenAI image models need a verified organization (platform.openai.com > Settings > Organization > Verify).
2. **API pilot: 20 images, about $1, hard stop at $5.**
   ```bash
   python3 pilot.py --products 5 --max-spend 5 --yes
   ```
3. **ChatGPT app pilot.** Time it honestly: the clock runs from "prompt copied" until you press Enter.
   ```bash
   python3 chat_pilot.py --account a
   ```
   Optionally repeat with `--account b` on the second account.
4. **Compare.** Rebuild the sheet with every option side by side, then read the report:
   ```bash
   python3 qa.py --compare jobs/pilot.jsonl && python3 chat_pilot.py --report
   ```
   Open `qa/compare-pilot.jpg` (one row per product, one column per option) and `qa/pilot-report.md`.

## How to decide

Score each column on the 5 products. One point each for: right flowers and colours, nothing extra, right container, gift items present, MAISON BOTANIQUE spelled correctly, no other logos, looks real.

- **If the scores are within about one point**, take the cheapest. For 295 images the cash costs are roughly: Gemini Batch about $5–7, OpenAI Batch about $10–15, ChatGPT app $0 plus the hours `chat_pilot.py --report` projects.
- **If the ChatGPT app wins on quality** but projects many hours, use it only for the products the API gets wrong.
- **If "with supplier photo" beats "text only"** on accuracy for the same provider, use that variant for the full run.

Then run the full batch with the winning setting. Batch costs half and returns within 24 hours.
