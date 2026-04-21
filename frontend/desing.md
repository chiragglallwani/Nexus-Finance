# Design System Documentation: The Precision Vault

## 1. Overview & Creative North Star

This design system is engineered for a high-fidelity FinTech environment where institutional authority meets the velocity of quantum computing. We are moving away from the "SaaS-standard" look of flat cards and heavy borders.

**Creative North Star: "The Precision Vault"**

The aesthetic is defined by architectural transparency and editorial weight. We treat the UI not as a flat screen, but as a multi-layered physical environment of frosted glass and light. By utilizing intentional asymmetry within a Bento Box grid and dramatic typography scales, we create an experience that feels curated, not templated. We break the rigidity of traditional finance with "breathing" layouts that prioritize data clarity through depth rather than lines.

---

### 2. Colors & Surface Philosophy

The palette is divided into two regimes: **Quantum Light** (High-clarity, airy) and **Obsidian Dark** (Deep, immersive).

#### The "No-Line" Rule

Sectioning must never be achieved with 1px solid structural borders. Boundaries are defined strictly through:

1.  **Background Shifts:** Placing a `surface-container-low` element against a `surface` background.

2.  **Tonal Transitions:** Using subtle value shifts to imply edge logic.

3.  **Glass Frontiers:** Using translucent layers to define containment.

#### Surface Hierarchy & Nesting

Use the `surface-container` tiers to create a physical "stack."

- **Base Layer:** `surface` (The floor of the application).

- **Structural Sections:** `surface-container-low` (Large Bento areas).

- **Interactive Cards:** `surface-container-high` (Nested data modules).

- **Floating Elements:** `surface-bright` (Overlays and tooltips).

#### The "Glass & Gradient" Rule

To escape the "flat" look, main CTAs and hero data visualizations should utilize linear gradients (e.g., `primary` to `primary-container`). Floating modules must employ Glassmorphism:

- **Fill:** `surface` at 60–80% opacity.

- **Effect:** `backdrop-filter: blur(16px)`.

- **Edge:** A 1px "Frosted" border using `outline-variant` at 20% opacity.

---

### 3. Typography

We utilize **Inter Variable** to bridge the gap between technical precision and editorial elegance.

| Role | Font | Size | Weight | Tracking | Case |

| :--- | :--- | :--- | :--- | :--- | :--- |

| **Display-lg** | Inter | 3.5rem | 700 (Bold) | -0.04em | Sentence |

| **Headline-md**| Inter | 1.75rem | 600 (Semi) | -0.02em | Sentence |

| **Title-sm** | Inter | 1.0rem | 600 (Semi) | 0 | Sentence |

| **Body-md** | Inter | 0.875rem | 400 (Reg) | 0 | Sentence |

| **Label-md** | Inter | 0.75rem | 500 (Med) | +0.02em | All Caps |

**Editorial Intent:** Use `Display-lg` for portfolio totals and key metrics. The high contrast between the bold headers and the refined `Label-md` creates an authoritative, institutional feel.

---

### 4. Elevation & Depth

Depth in this system is a result of **Tonal Layering**, not structural shadows.

- **The Layering Principle:** Stack `surface-container-lowest` on top of `surface-container-low` to create "recessed" areas for secondary data.

- **Ambient Shadows:** For floating elements (Modals/Dropdowns), use a wide-spread, low-intensity shadow: `box-shadow: 0 20px 40px rgba(12, 19, 36, 0.12)`. The shadow color must match the `on-surface` hue to appear as natural ambient occlusion.

- **The Ghost Border:** If a container requires an edge for accessibility, use a "Ghost Border": `1px solid` using the `outline-variant` token at **10-15% opacity**. Never use 100% opaque borders.

- **Bento Radiuses:** All containers strictly use the **8px (lg)** radius scale to maintain a modern, "hand-held" feel that isn't overly bubbly.

---

### 5. Components

#### Buttons

- **Primary:** Gradient fill (`primary` to `primary-container`). 8px radius. White text for high contrast. No border.

- **Secondary:** Glass background (`surface` @ 20%). "Frosted" ghost border (20% opacity).

- **Tertiary:** Text-only with `primary` color. High-emphasis hover state using a subtle `surface-container-highest` background.

#### Input Fields

- **Container:** Use `surface-container-lowest`.

- **State:** 1px "Frosted" border on focus using the `primary` token at 40% opacity.

- **Typography:** Labels use `label-md` positioned above the field, never inside.

#### Bento Cards

- **Construction:** Use `surface-container-low` as the base.

- **Padding:** 24px (1.5rem) internal padding.

- **Separation:** Strictly forbid divider lines. Use vertical whitespace or a nested `surface-container-high` for sub-sections.

#### Chips & Badges

- **Visual:** Pill-shaped (`full` radius).

- **Tonal:** Backgrounds use `secondary-container` at 30% opacity to ensure the text remains the focal point.

---

### 6. Do’s and Don’ts

#### Do

- **Do** embrace negative space. High-fidelity finance requires room for the user to breathe during complex data analysis.

- **Do** use asymmetrical layouts within the Bento grid (e.g., a 2/3 width main chart next to a 1/3 width activity feed).

- **Do** use `primary` (Electric/Cyan Blue) sparingly for "Success" or "Action" states to maintain its visual impact.

#### Don’t

- **Don’t** use pure black (#000) or pure grey. Always use the provided `Obsidian Dark` tokens which are tinted with deep navy/slate for a premium feel.

- **Don’t** use standard 1px dividers to separate list items. Use 8px or 12px of vertical spacing instead.

- **Don’t** apply glassmorphism to every element. If everything is glass, nothing is glass. Reserve it for floating navigation, top bars, and foreground modals.

---

### 7. Token Summary (Reference)

- **Corner Radius:** `lg: 0.5rem (8px)` (Standard for all containers).

- **Glass Blur:** `12px` to `20px` (Environment dependent).

- **Base Light:** `#FFFFFF` | **Base Dark:** `#020617` (Obsidian).

- **Accent:** `#3B82F6` (Electric) | `#60A5FA` (Cyan).
