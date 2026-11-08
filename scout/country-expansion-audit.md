# Scout country expansion — initial code audit (8 November 2026)

Status: **draft; not deployed**. Production is unchanged.

## Important correction
The five initially proposed countries — Canada, Mexico, France, Italy and Thailand — **already have `view-*` sections** in `index.html` on `main`. They must not be treated as missing-country builds. Some sections contain generic copy, so they may need content enrichment, but existence alone does not prove full functionality or affiliate QA.

The current file has 86 `view-*` sections including continents, experiences, city views and many country views. Country selection must compare **actual functioning country views and city content**, not merely country cards or links.

## Next five-country pilot selection rule
1. Extract all country links from continent grids and compare with `view-*` routes.
2. Exclude existing complete country views; rank missing or incomplete countries by traveller demand and GetYourGuide activity coverage.
3. For five selected countries, create draft country views and principal city cards using the existing style; verify factual text, image URLs and affiliate links.
4. Test navigation, desktop four-across grid, mobile layout, links and image availability. Hold unverified activities or images.
5. Seek approval before merging or publishing. Only after the five-country pilot passes QA should the next 15 be built.

## Repository
`Muttanbal/tiptoe-the-world`, draft branch `scout-five-country-pilot-2026-11`.
