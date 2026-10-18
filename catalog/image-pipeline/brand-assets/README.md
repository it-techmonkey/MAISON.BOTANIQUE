# Brand packaging reference images

Put one clean, front-facing photo per branded item here (PNG or JPG, plain background, logo fully visible), named
`<file_stem>.png` / `.jpg` from `brands.json`, e.g. `ferrero.png`, `lindt.png`, `loreal.png`, `pistache.png`.

Why: AI image models draw brand logos from memory and often garble the lettering. When a product's contents mention
one of these brands and the file exists, `build_jobs.py` attaches it as an extra reference image and tells the model
to reproduce the packaging exactly. Without a file, the model still tries, but accuracy is lower.

Use photos of the products Maison will actually stock (your own photo, or one supplied by the distributor).
