# Design tokens — MAOUAJ combination theme (Figma file `XZMIlXmLFBkPZRjLyMgvb0`)

Extracted from `get_design_context` of all 10 frames (all 1440px wide desktop; the file has **no tablet/mobile frames**, so
smaller breakpoints are a faithful adaptation). The Figma file defines **no variables/styles** (variable defs were unavailable),
so tokens below are the literal values used in the frames. They are implemented in `client/tailwind.config.ts`.

## Typography — Manrope (400/500/600/700/800)

| Use                              | Size / line-height / tracking             | Weight      |
| -------------------------------- | ----------------------------------------- | ----------- |
| Home hero H1                     | see home hero                             | 800         |
| Page hero H1 (Vision/About/Team) | 64 / 84 / -1.92px                         | 700         |
| Page hero H1 (Projects/Terms…)   | 52 / 1.1                                  | 800         |
| Section H2                       | 56 / 62 / -1.68px                         | 800         |
| Section subtitle                 | 20 / normal                               | 700         |
| Section description              | 17 / 27                                   | 400         |
| Card title L / M                 | 32 / 38 / -0.32px · 24 / 30 / -0.24px     | 800         |
| Body                             | 15 / 23 (card) · 17 / 27 · 20 / 30 (lead) | 400/500     |
| Eyebrow                          | 12 / normal / +1.92px uppercase           | 600         |
| Nav                              | 13.5 / normal                             | 500         |
| Footer heading / link / legal    | 11.5 +1.38px / 14 / 12.5                  | 600/500/400 |
| Button                           | 15                                        | 700         |
| Chip                             | 12                                        | 600         |

## Colours

Navy: `950 #050a18` `900 #0a1640` `800 #0e2c56` `700 #0a1e39` · Ink `#0a1330` / `700 #3a4670` / `500 #5a6791` ·
Surface `#fff` `#f4f7ff` `#eaf0ff` · Line `#d3ddf3` `#c9d6f5` ·
Brand `#2456ff` (press `#2c57f6`), sky `#6fb1ff`, cyan `#69c5ff`, ice `#81c1ff`, mist `#68a7f2`, pale `#9bd2ff`, bright `#3a8cff`, deep `#143c74`,
steel `#144a8d`, navy `#0a1e86`, indigo `#1d4ed8`, violet `#6d28d9`, teal `#0e7490`, light `#60a5fa`, electric `#2f4bff` ·
Text on dark `#eaf0ff`, muted `#9fb0d6`, soft `#c9dbff`, cta `#dde8ff` · Policy borders `#3267a5` `#263e65` `#2c5d96`.

## Gradients

hero `#050a18→#0a1640` (180°) · keyline `#3a8cff→#143c74` · logo `135° #60a5fa→#2f4bff` · icon tile `135° #0a1e86→#2456ff` ·
CTA card `148.64° #1d4ed8, #6d28d9, #0e7490` · vision card `132°` · purpose card `153°` · sidebar `#0e2c56→#0a1e39`.

## Radii / shadows / spacing / breakpoints

Radii 9 (logo) · 12 · 16 · 18 · 20 (images) · 24 · 28 (cards) · 36 · 44 (hero cards) · 100 (pills).
Shadows: card `0 10px 30px rgba(10,31,102,.08)`, policy `0 10px 15px rgba(10,31,102,.08)`.
Layout: page width 1440, side gutter 72, content width 1296, section padding 110/72, section gap 56.
Breakpoints: sm 640, md 768, lg 1024, xl 1280 (desktop nav), 2xl 1440 (Figma frame).
