# Confirmed existing Tiptoe affiliate-link convention (source-code audit, 8 Nov 2026)

**Source:** `index.html` on `main` in this repository.

The live-site source uses the GetYourGuide partner identifier `MYN4RIJ` with URL parameters:

- `partner_id=MYN4RIJ`
- `utm_medium=travel_agent`
- `travel_agent=1`
- `cmp=tiptoe_destinations` (or a campaign-specific value such as `tiptoe_home`)

Example **format only** for a specific product:

`https://www.getyourguide.com/<product-path>-t<product-id>/?partner_id=MYN4RIJ&utm_medium=travel_agent&travel_agent=1&cmp=tiptoe_scout_pilot`

The code also uses `data-gyg-partner-id="MYN4RIJ"` in city widgets, but city widgets were previously less reliable for affiliate attribution. Prefer direct activity/product URLs, with `target="_blank"` and `rel="noopener noreferrer sponsored"`.

## Limits of verification

- **Confirmed:** this partner ID and parameter convention exist repeatedly in the website source.
- **Not yet confirmed:** whether the two candidate product URLs resolve to the correct products today, preserve partner attribution after redirect, and register commission in GetYourGuide affiliate reporting.
- Do not assert commissions or publish links until the incognito redirect and affiliate dashboard test passes.

## QA for each product

1. Open the activity-specific URL with parameters.
2. Check the product title, city, date/availability and any redirects.
3. Verify the final URL/affiliate tracking and, if possible, dashboard click attribution.
4. Add only after passing. Track product ID, city, link, image licence and QA status.
