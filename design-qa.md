# Design QA — Figma 44–57 领养流程

- source visual truth path: `C:/itemGr/PawHome/docs/figma-export/frames-png/044_*.png` through `057_*.png`
- implementation route: `/pages/meMore/adoptionFlow?frame=44` through `/pages/meMore/adoptionFlow?frame=57`
- implementation screenshots: `C:/itemGr/PawHome/docs/design-audit/screenshots/pawhome/figma-44-pass3.png` through `figma-57-pass4.png`
- final comparison contact sheet: `C:/itemGr/PawHome/docs/design-audit/figma-044-057-final-contact.jpg`
- viewport: 375 CSS px wide; heights 812, 853, 872, 907, 942, or 1024 CSS px according to each Figma frame
- source and implementation density: source PNG and H5 capture both normalized to 1 CSS pixel = 1 output pixel; `deviceScaleFactor: 1`
- state: 14 states covering pending/rejected review, owner/jury review, adoption information, application content, pickup, confirmation, rejection, success, and reward progress

## Full-view comparison evidence

Every state has a same-size side-by-side image in `C:/itemGr/PawHome/docs/design-audit/comparisons/batch-044-057-final/`. The final contact sheet was opened and inspected as a group after the individual focused comparisons.

## Focused comparison evidence

- Frame 44: application copy, two source photos, pet/owner card, spacing and page gradient.
- Frame 46: yellow header/background boundary, applicant identity, application card, pet card, and two-button footer.
- Frame 48: location row, long gray instruction copy, owner contact card, typography and vertical rhythm.
- Frame 50: long owner-approved flow, section order, card heights, and final application link.
- Frames 51–53: arrival proof images/captions/copy, link rows, confirmation/review footer states.
- Frames 55–57: 72 px progress module, exact section y-coordinates, proof/pet/link cards, progress states, and reward icon.

## Required fidelity surfaces

- Fonts and typography: Source Han Sans CN is requested first with CJK/system fallbacks; Figma font sizes, line heights, regular/medium weights, wrapping, and copy were mapped from parsed node data.
- Spacing and layout rhythm: 15 px page gutters, card positions/heights, 10 px section gaps, status/nav heights, footer positions, and all long-frame heights match the exported node coordinates.
- Colors and visual tokens: cream navigation gradient, `#fcf276` review yellow, `#f5f5f5` surface background, white cards, muted paragraph color, and yellow status/action colors were sampled or read from the Figma export.
- Image quality and asset fidelity: all eight visible raster assets are the exact exported Figma image bytes under `static/figma/adoption-flow/`; no screenshot crops or placeholders are used. Source vector-only UI glyphs use the installed `uni-icons` library.
- Copy and content: status labels, application copy, address, owner message, proof captions, dates, pet names, and action labels match the source frames.

## Interaction and runtime verification

- Back control is wired to mini-program navigation.
- “领养信息” and “申请内容” rows navigate to their matching frame states; verified `frame=55 → frame=48` with title `领养信息`.
- Review/confirmation buttons are interactive; verified the frame 46 “同意” action and toast.
- Browser console: no page/component errors in final runs. A pre-existing HBuilderX/uni-modules compatibility warning remains.
- Route validation: passed with 64 registered pages and all matrix routes registered.
- WeChat mini-program production build: passed. Only existing Dart Sass deprecation warnings were emitted.

## Comparison history

1. Pass 1 found missing state rendering from a string route parameter, incorrect owner vertical position, narrow action buttons, short contact cards, and approximate background colors. The route parameter was normalized and the shared component geometry/assets were corrected.
2. Pass 2 found proof content 10 px high, condensed paragraph line heights, progress cards with incorrect height/steps, and undersized review buttons. Node-derived heights, line heights, progress positions, and footer controls were corrected.
3. Pass 3 aligned the 44–57 card blocks to their Figma y-coordinates, removed progress-page overflow, and matched paragraph/color behavior.
4. Pass 4 replaced reject/success/reward glyphs with closer installed icon-library matches and re-captured the affected states.

## Findings

No actionable P0/P1/P2 visual differences remain in frames 44–57.

P3 follow-up: browser-rendered system status icons and a few source vector glyphs differ slightly from the Figma/macOS rendering because the original vector bytes were not exported; the closest installed icon-library glyphs are used. Native WeChat chrome will also differ from H5 preview chrome by platform.

final result: passed
