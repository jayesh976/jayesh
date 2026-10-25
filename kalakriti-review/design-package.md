# Kalakriti: Design Package (Tier 1, single journey)

Status: written before generation. Every line of viewer-facing copy below ships verbatim. Band ranges are starting points, validated later by the flick test. Prices, product names, and the WhatsApp number are SAMPLE details the owner will correct.

## 1. The brand premise

Kalakriti means "a work of art." The whole site teaches one idea: **the candle burns, the art stays.** A Kalakriti candle is hand-poured into a jar made to be kept, so when the wax is gone the jar begins its second life as a planter, a brush cup, a diya stand. Most candle brands say "reuse the jar" and ship a jar nobody wants to keep. Kalakriti makes the jar the point. Every section, the interactive moment, and the closing line serve that idea.

Buyer language from research (what we answer): scent that "fades quickly," "very mild when burning," tunneling, black soot, and gifts where a pretty box hides an average candle. The reuse promise is everywhere in the market but rarely believed, because most jars are not worth keeping.

The ONE call to action: **Order on WhatsApp** (opens WhatsApp with a ready message).

## 2. The palette as CSS tokens

Direction: a soft, light shop (the owner loves AuraDecor's clean, soft look) wrapped around a warm, glowing hero. Pulled from the logo: cocoa brown, burnished gold, warm ivory, lotus pink, leaf teal. Final hero tones get re-sampled from the approved footage.

Stated deviation: ivory plus a serif is close to a stock "AI look." It stays because it is the logo's own world (the mark is cocoa and gold on ivory). The accent is lotus pink, not terracotta, and the layout is built around the pour line, not the stock template.

```css
:root{
  --canvas:#F6EFE4;        /* warm sand ivory, never pure white */
  --panel:#EFE3D1;         /* cards and raised surfaces */
  --night:#22140C;         /* the hero's cocoa dark, never pure black */
  --accent:#B0174F;        /* lotus pink: CTA, focus, rare emphasis */
  --accent-hover:#93113F;
  --accent-muted:#E7B3C4;  /* whisper-level glows and borders */
  --gold:#B8862F;          /* line work only, never body text */
  --teal:#1F6F66;          /* the interactive moment's sprout, nowhere else */
  --text-secondary:#6E5444;
  --text-primary:#3B2416;  /* cocoa ink */
}
```

## 3. The type trio

- Display: **Rozha One** 400 (from the Indian Type Foundry, high-contrast Devanagari-rooted display).
- Body: **Mukta** 400 and 600 (also Indian Type Foundry, calm and readable).
- Labels: **IBM Plex Mono** 400 (burn hours, weights, small kickers).

## 4. The hero shot (storyboard)

One continuous 6-second shot, image-to-video, 1080p. Hero height about 400vh.

- **World:** a quiet, warm studio at dusk. A softly lit plaster wall recedes into shadow. Out-of-focus warm points of light from lit candles in the far background.
- **Subject:** a ribbon of molten honey-gold soy wax pouring straight down from a small brass pouring pot at the top of frame into a hand-finished jar: matte cocoa-brown ceramic, a burnished gold rim, and a thin hand-painted gold lotus band around its middle. One cotton wick stands upright, held centered.
- **Camera:** a slow, steady descent following the pour downward (scroll down equals pour down).
- **Ending (the page's resting frame):** the jar is full, the pour has stopped, the glossy wax surface settles into calm ripples that slow to stillness, wick upright and centered, warm side light catches the gold rim and lotus band. Generous margin above and below the jar.
- **Composition:** the action lane is the right-center third (pour stream and jar). Captions live in the left half, over the soft plaster wall.
- Why the flame is not lit in the shot: lighting it would need a time jump (wax must set first), which breaks the one-shot rule. The lit candle appears in the first section below the hero instead.

### Start frame prompt (image, 16:9, 2k)

```
A thin ribbon of molten honey-gold wax pouring straight down from a small polished brass pouring pot at the top of the frame into a hand-finished candle jar, positioned in the right-center third of the frame, composed as the first moment of a motion that will follow the pour downward into the jar. The jar is matte cocoa-brown ceramic with a burnished gold rim and a thin hand-painted gold lotus band around its middle, a single cotton wick standing upright in its center, the jar only a quarter full. Warm low side light from the right, dusk mood, gentle glints on brass and gold. Palette of deep cocoa brown, burnished gold, warm ivory plaster, and honey wax. A softly lit warm ivory plaster wall fills the whole frame edge to edge and recedes into soft shadow on the left, with a few out-of-focus warm points of candlelight far in the background. Faint wisps of warm air shimmer above the pour. Cinematic, photorealistic, shallow depth of field, 16:9. No text, no logos, no lettering anywhere.
```

### Video prompt (image-to-video, 6 seconds, 1080p, no audio)

```
One continuous shot, no cuts. A ribbon of molten honey-gold wax pours straight down from a small brass pouring pot into a matte cocoa-brown ceramic jar with a gold rim and a gold lotus band, while the camera descends slowly and steadily along the pour, straight down the right-center of the frame. The wax stream stays alive throughout: it ripples, thins and thickens gently, and folds into the rising pool. The scene stays alive: soft heat shimmer above the pour, warm out-of-focus candlelight glowing in the far background, light gliding across the glossy wax. The jar fills smoothly. The shot ends at rest: the pour stops, the jar is full, the glossy wax surface settles into slow concentric ripples that fade to stillness, the cotton wick stands upright in the center, warm side light catches the gold rim and lotus band, the jar sits centered in the lower right-center with calm space above it. No text or lettering anywhere.
```

## 5. The band map

| Band | Range (starting point) | Footage moment | Copy (verbatim) | Entrance |
|---|---|---|---|---|
| 1 | 0.00 to 0.24 | The pour begins, a thin gold stream | Kicker: "Kalakriti · hand-poured in India" / Headline: "A candle you burn. A jar you keep." | Drift-down (echoes the pour), opens settled with the load ramp |
| 2 | 0.30 to 0.54 | The stream folds into the rising pool | "Poured by hand, one small batch at a time." / "Soy wax, a strong slow-blended fragrance, one cotton wick." | Word-by-word rise (echoes the wax level rising) |
| 3 | 0.60 to 0.78 | The jar nears full, light glides on the gold band | "When the wax is gone, the art stays." | Blur-to-sharp (echoes the pool calming into a clear surface) |
| 4 | 0.84 to 1.00 | The surface settles to stillness | Headline: "Burn it. Keep it. Gift it." / Subline: "Candles in jars made to stay on your shelf for years." / CTA: "Order on WhatsApp" and "See the collection" | Word-by-word rise into a staged settle |

## 6. The static-hero copy block (phones, reduced motion)

Over the ending frame:

- Kicker: "Kalakriti · hand-poured in India"
- Headline: "A candle you burn. A jar you keep."
- Subline: "Hand-poured soy candles in jars made to stay on your shelf for years."
- CTA: "Order on WhatsApp" and "See the collection"

## 7. The below-fold outline

1. **Nav:** Kalakriti mark, links: Collection, Gift sets, The jar, FAQ. Button: "Order on WhatsApp".

2. **The meaning (intro, ending frame reused):**
   - Kicker: "Kalakriti (n.) a work of art"
   - Headline: "The candle burns. The art stays."
   - Body: "Most candles leave you a sooty glass to throw away. Ours leave you a hand-finished jar worth keeping. We pour fragrant soy wax into it, you enjoy every hour of it, and then it moves to your desk, your windowsill, or your puja corner."

3. **Three lives of one jar** (three steps, three images):
   - "01 · First, a candle." "About 40 hours of slow, even light and a scent that fills the room." (image: the lit candle)
   - "02 · Then, a planter." "Wash out the last of the wax, add soil and a little money plant." (image: jar as planter)
   - "03 · Then, whatever you love." "Brushes, pens, a diya, a few marigolds. It was always made to stay." (image: jar holding brushes and marigolds)

4. **The interactive moment, "Burn it down":** a drawn jar with wax inside. Copy: "Press and hold to burn the candle." While held, the flame burns, the wax level drops, and when it reaches the bottom a small teal sprout grows from the jar. Release early and the wax eases back up. Done line: "Forty hours later, a planter." Reduced motion shows the final planter state.

5. **The collection** (four scents, same jar shape, four glazes, drawn as SVG jars so they read as one family):
   - "Mogra Raat" · jasmine and night air · cocoa glaze · 200 g · ₹899
   - "Chandan Haveli" · sandalwood and old wood · ivory glaze · 200 g · ₹949
   - "Kesar Chai" · saffron, cardamom, warm milk · lotus glaze · 200 g · ₹849
   - "Pehli Baarish" · first rain on dry earth · teal glaze · 200 g · ₹899
   - Card button: "Order on WhatsApp" (prefilled with the scent's name)
   - Note: "Every jar is finished by hand, so each one is a little different."

6. **Gift sets:**
   - Headline: "A gift they will still have next Diwali."
   - "Shubh Duo" · any two scents in a keepsake box · ₹1,699
   - "Utsav Trio" · three scents, gold ribbon, handwritten card · ₹2,499
   - "Weddings and office gifting" · your names or logo on the box, from 25 pieces · "Ask on WhatsApp"

7. **Why it burns better** (answers the real objections). Heading: "Strong scent. Even burn. Clean flame."
   - "A scent you can actually smell." "We blend generous fragrance into the wax and let each candle cure for two weeks, so the scent reaches every corner of the room."
   - "No hole down the middle." "Each wick is sized to the jar. Let the first burn melt all the way to the edge and it burns evenly to the end."
   - "No black soot." "Clean soy wax and cotton wicks. Trim the wick to half a centimetre before each light."

8. **FAQ:**
   - "Is the scent strong?" "Yes. One candle fills a bedroom or a small living room within about 20 minutes. Burn it for two to three hours at a time."
   - "How long does one candle burn?" "About 40 hours, if you trim the wick and let each burn melt the top evenly."
   - "How do I clean the jar for reuse?" "When about a centimetre of wax is left, stop burning. Put the jar in the freezer for an hour, pop out the wax, then wash it with warm soapy water."
   - "Do you deliver across India?" "Yes. Message us on WhatsApp with your pincode and we will share the delivery time and charges."
   - "Can I order for a wedding or my office?" "Yes, from 25 pieces. We can add names or your logo to the box. Ask us on WhatsApp."

9. **Final call to action:**
   - Headline: "Choose your scent. Keep the jar."
   - Body: "Send us a message on WhatsApp. We reply with photos, delivery time, and payment options."
   - Button: "Order on WhatsApp"
   - Small print: "Replies usually within a few hours."
   - Form handling: no form. The button opens WhatsApp with this ready message: "Hi Kalakriti, I would like to order a candle." Messages go to the business's WhatsApp number (SAMPLE placeholder until the owner sends theirs).

10. **Footer:** logo, "Where tradition meets trends", links, "Hand-poured in India", © Kalakriti. No fictional disclosure (real brand). No AI-image notice (owner chose to swap in real photos later).

Testimonials: not included. Kalakriti is a real business and we have no real reviews yet, so none are invented. Add real ones when the owner sends them.

## 8. The vector layer plan

- **Signature element, the pour line:** one thin gold line continues the hero's pour down the whole page, drawing itself as you scroll, curving around each section and ending inside the final CTA's drawn jar. Remove it and the page loses the thread that ties the film to the shop.
- Lotus line dividers drawn in gold that self-draw on entrance.
- Whisper-level warm ember specks drifting up in the hero ending and the CTA.
- One fixed background layer: a slow warm glow drifting across the ivory canvas, 70-second cycle.
- SVG jars for the collection and the interactive moment.
- Reduced motion: every line drawn, every jar full, the sprout grown, drives stopped.

## 9. The engineering list

Blob fetch with the loading ring and watchdog, dt-normalized lerp in a resting rAF loop, gated seeks with the error escape, delta-gated DOM writes, band pacing with the flick test, the four-layer legibility system with the worst-frame audit, the five static-hero gates kept live with change listeners, complete without the video, the motion system (nothing snaps, stagger retirement, paused off-screen and on hidden tabs), and the quality floor, all per scrub-pipeline. Plus the whole-site-animated standard.

## 10. Supporting stills (after the video gate)

All in the hero's world: same cocoa jar, same warm dusk light, same ivory plaster.

1. The jar as a planter with a money plant, on a windowsill.
2. The jar holding makeup brushes and a few marigolds, on a dresser.
3. Four jars in four glazes (cocoa, ivory, lotus pink, teal) in a row, for the collection header.
4. A keepsake gift box with two jars, gold ribbon, and a blank card.

Life 01 (the lit candle) uses a still too if the ending frame does not carry it: budget allows one extra.

## 11. Cost (to be preflighted exactly before spending)

- Start frame: about 2 credits.
- Hero video: about 10 to 55 credits, depending on the model chosen after the frame is approved.
- Four supporting stills: about 8 credits.
- Total: roughly 20 to 65 credits.

## 12. The copy gate

Every viewer-facing line above ships verbatim, and the built page must pass the Phase 9 grep gate (zero em dashes, zero stock words) plus the body-copy sweep for AI tells before anyone sees it. Deliberate brand devices in this package ("Burn it. Keep it. Gift it.", "A candle you burn. A jar you keep.") are craft and stay.
