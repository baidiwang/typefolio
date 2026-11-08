# NYC object assets — built-in image_gen

Generated with the built-in image_gen tool, not the API/CLI fallback. The user's two uploaded references provide physical form/composition; the existing scene supplies the illustration style. The outputs are original artwork for the comparison prototypes.

## Storefront wording

Edit target: `art/after-hours/city-postoffice.png`. Generated output: `art/after-hours/storefront-resume-usps.png`. Selected awning patches were composited into the original to form `art/after-hours/city-resume-usps.png`, delivered as `public/scene/city-resume-usps.webp`.

Exact prompt:

> Use case: text-localization / precise-object-edit. Edit target is the supplied fixed-coordinate 1536×1024 snowy NYC portfolio illustration. Change ONLY the lettering on TWO existing ground-floor awnings: left bookshop awning currently 'BOOKS & RÉSUMÉ' must say exactly 'RESUME' (R E S U M E), centered in the same cream painted serif style; right striped postal awning currently 'POST OFFICE' must say exactly 'USPS' (U S P S), same cream painted serif style, centered. Keep both awnings' shapes, stripes, snow, ink texture, widths, supports, shops, furniture and lights exactly in place. Preserve EVERY other pixel/position of the two apartment wings, all six empty room interiors and furnishings, balcony rails, tree, sky, road, both sidewalks, crossing, mailbox and hydrant. No added logos, no residents, no vehicles, no crop, no zoom, no shifted geometry. Output the full SAME 1536×1024 composition.

## Canvas tote

References: user-supplied `New Yorker.jpeg` for form; `art/after-hours/city-postoffice.png` for style. Original: `art/after-hours/canvas-tote.png`, delivered as `public/studies/canvas-tote.webp`. Transparent alpha, 1024×1536 original, 800×1200 web derivative. No publication logo is added to the bag.

Exact prompt:

> Use case: product-mockup / illustration-story. Create an original single cream canvas NYC-style bookstore tote bag cutout for an interactive illustrated portfolio. Image 1 is reference ONLY for the tote's physical proportions: long two fabric handles, broad soft flat canvas body, rounded folded lower corners, real seams and gentle irregular canvas folds. Image 2 is the style authority: match its matte storybook watercolor/pencil texture, fine uneven dark ink contours, warm cream and muted indigo shadows. Draw the WHOLE bag upright FRONT ON, no perspective, no tilt, handles fully visible, body centered, taking about 82% of width and90% of height on a portrait2:3 canvas. Place the bag body approximately x12..88%, y35..95%, handles y5..42%. Leave the FRONT PANEL entirely BLANK with a wide quiet light cream surface; typography will be HTML. No logos or text, no bed/photo backdrop, no books, hands, characters or props. True transparent background including handle holes; no cast ground shadow, no photographic realism, no thick cartoon outline, no glossy3D. This is an actual illustration asset to sit in the snowy New York website, not a screenshot of a website.

## Subway doors

References: user-supplied `_.jpeg` for composition; `art/after-hours/city-postoffice.png` for style. Original: `art/after-hours/subway-doors.png`, delivered as `public/studies/subway-doors.webp`. 1024×1536 original, 800×1200 web derivative.

Exact prompt:

> Use case: illustration-story. Create original illustrated front-on paired NYC subway train doors for an interactive website. Image1 references the composition and deep green palette only; image2 is style authority, use its matte watercolor/pencil paper texture, fine irregular ink contours and cozy storybook residents. Portrait2:3 image, exact bilateral pair of closed dark forest green metal sliding doors, central vertical seam at exactly50% width from top to bottom. Two tall rounded rectangular glass windows at equal positions on left/right upper halves, bottom of windows at about50% of image height. Through left window see one original bundled-up dark-haired subway passenger in charcoal coat and rust scarf, through right one original dark-haired passenger in ochre coat quietly reading, seen waist up, muted warm carriage light. Window frames, simple cream thin keylines, green painted lower panels with subtle wear; unmistakable New York subway character. No perspective, no surrounding platform, no outer scenery, no floor. Both doors entirely fill the image edge to edge. Lower half of each door is quiet uninterrupted dark green for later HTML project lettering. NO text, logos, labels, subway numbers or signage anywhere. No glossy3D, no vector-flat poster finish, no replication of reference faces or clothes. The panel must be cleanly splittable at the exact center into left/right doors that slide apart.
