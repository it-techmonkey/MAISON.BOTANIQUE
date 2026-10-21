# Protecting main: owner steps

These need a repository **admin** (the owner). The coding account has write access only, so none of this
has been done for you. Do the steps in order. Each takes a minute or two.

Do them **after** the pull request that adds `.github/workflows/e2e-preview.yml` and `live-check.yml` has
run its checks at least once. GitHub only offers a check name in the list once it has seen it run.

## 1. Connect previews to Shopify and WhatsApp (Vercel)

Today Vercel previews have no Shopify or WhatsApp settings. So on a pull request the checkout handoff and
WhatsApp tests report "not exercised" instead of really testing. Production is fine.

1. Open vercel.com → team **techmonkeys-projects** → project **maison-botanique** → **Settings** → **Environment Variables**.
2. For each of these, open the existing Production entry, click **Edit**, tick **Preview** as well, and save:
   - `NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN`
   - `NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN`
   - `NEXT_PUBLIC_WHATSAPP_NUMBER`

   All three are public by design: they are already visible in the live site's code. Do **not** add the
   Admin tokens (`SHOPIFY_*_ADMIN_TOKEN`) or offer secrets to Preview.
3. Redeploy the latest preview, or push any commit to the pull request, and wait for the **e2e** check.
   It should now pass without "not exercised" notes.

## 2. Ruleset on main (GitHub)

1. Open github.com/it-techmonkey/MAISON.BOTANIQUE → **Settings** → **Rules** → **Rulesets** → **New ruleset** → **New branch ruleset**.
2. **Ruleset name:** `Protect main`. **Enforcement status:** `Active`.
3. **Bypass list:** leave it empty, so the rules apply to admins too. If you want an emergency override,
   add only **Repository admin**, set to "For pull requests only".
4. **Target branches** → **Add target** → **Include default branch** (this is `main`).
5. Under **Branch rules**, tick:
   - **Restrict deletions**
   - **Block force pushes**
   - **Require a pull request before merging**. Set **Required approvals** to `0`, because you are the only
     reviewer and GitHub does not let authors approve their own pull request. Tick
     **Dismiss stale pull request approvals when new commits are pushed**.
   - **Require status checks to pass**. Tick **Require branches to be up to date before merging**. Click
     **Add checks** and add:
     - `verify`: the existing Storefront checks (tests, typecheck, build)
     - `e2e`: the buying-flow tests on the Vercel preview
     
     If a name doesn't appear, type it exactly as above. It appears once that check has run on a pull request.
6. Click **Create**.

To check it worked, open any pull request. The merge button should say that **verify** and **e2e** are
required, and a direct `git push origin main` should be refused.

Note: `e2e` runs when Vercel finishes the preview. A failed preview build fails `e2e`. If Vercel makes
no preview at all (for example a paused project), the check stays "Expected — waiting" and the pull
request can't merge. Fix the preview, or use the admin bypass from step 3 if you set one.

## 3. Secret scanning and push protection (GitHub)

1. **Settings** → **Advanced Security** (on some accounts: **Code security**).
2. Under **Secret Protection**, click **Enable**. This is secret scanning.
3. Under it, enable **Push protection**. Pushes that contain a token or key are then blocked before they
   reach the public repo.
4. Optional, but worth it: enable **Dependabot alerts**.

Both are free for public repositories.

## 4. Make sure failure emails reach you

The hourly **Live checkout check** emails the person who last changed its schedule line when it fails.
That is whoever merges the pull request that adds it. It also opens or updates a GitHub issue titled
**"Live checkout check failing"**.

1. github.com → your avatar → **Settings** → **Notifications** → **System** → **Actions**: choose
   **Email**, and tick **Only notify for failed workflows**.
2. On the repository page, click **Watch** → **Custom** → tick **Issues**, so the failure issue emails you too.
3. After merging, open **Actions** → **Live checkout check** → **Run workflow** once. That confirms it passes
   on production. A scheduled workflow only runs once its file is on `main`.

GitHub pauses scheduled workflows in public repositories after 60 days with no commits. If that happens,
the Actions tab shows a banner with an **Enable workflow** button.
