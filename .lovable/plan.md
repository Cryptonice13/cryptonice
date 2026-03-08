

## Home Page World-Class UI/UX Redesign

The current Home page has issues: repetitive price tickers (shown twice in hero + trending bar), flat visual hierarchy, generic card layouts, cramped spacing, and the Analyst section feels disconnected. This redesign elevates every section to a premium, polished experience.

---

### Changes to `src/pages/Home.tsx` (full rewrite)

**Hero Section**
- Remove the duplicate price ticker from inside the hero (keep only the trending bar below)
- Add a floating animated glow orb behind the headline for depth
- Larger spacing, bigger headline with a gradient word highlight
- Add a "trusted by" logo row beneath CTAs (placeholder brand logos using subtle text)
- Staggered entrance animations with longer delays for cinematic feel

**Trending Ticker**
- Convert to an infinite auto-scrolling marquee using CSS animation (duplicated content for seamless loop)
- Add a subtle gradient fade on left/right edges

**Feature Cards**
- Redesign as full-bleed gradient-border cards with large icon areas
- Add a number/step indicator (01, 02, 03) for visual rhythm
- Hover effect: card border lights up with the feature's gradient color
- Each card gets a subtle background pattern/mesh

**Analyst Agent Section**
- Wrap in a visually distinct section with a darker inset background and border glow
- Add animated "live" indicator dot next to the title
- Better section framing with decorative corner elements

**Market Snapshot**
- Redesign cards with larger sparklines taking full card width at bottom
- Add rank numbers (#1, #2, etc.)
- Hover reveals a "View Details →" overlay
- Better grid: 3 columns on desktop, 2 on mobile with consistent card height

**Stats Section**
- Convert from 2x2 grid to a horizontal 4-column strip with dividers between stats
- Animated count-up with easing (not linear increments)
- Each stat gets a colored top-border accent

**Testimonials**
- Redesign as a card carousel with smooth crossfade instead of instant swap
- Add company/platform badges
- Larger avatar with gradient ring

**CTA Section**
- Full-width gradient background instead of a card
- Animated particles or floating dots in background
- Bigger, bolder typography

**Footer**
- Add social media icon links (Twitter/X, Discord, Telegram)
- Organize into columns on desktop: Product, Resources, Company, Legal

---

### Files

| File | Action |
|------|--------|
| `src/pages/Home.tsx` | Full rewrite with all sections redesigned |
| `src/index.css` | Add marquee animation keyframes and any new utility classes |

No new dependencies needed. Uses existing framer-motion, lucide-react, and Tailwind.

