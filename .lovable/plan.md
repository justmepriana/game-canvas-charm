# Threadline Web Game UI

## Goal
Turn the reference image into a polished, playable security-challenge dashboard for the web, using the selected competitive visual direction.

## Experience
- Build the main game screen at `/` with a dominant featured mission and a compact player-progress rail.
- Add navigation, challenge selection, XP progress, badges, activity, shop promotion, and learning resources from the reference.
- Make challenge cards interactive: choosing a mission updates the active mission; difficulty filters narrow the list; the primary action opens a playable challenge briefing.
- Ensure keyboard access, clear focus states, reduced-motion support, and layouts that adapt cleanly from desktop to mobile.

## Visual Direction
- Palette: black foundations, deep purple, polished silver, icy light blue, and soft light-purple highlights.
- Typography: Bebas Neue for commanding display text; Barlow for readable interface copy.
- Composition: asymmetric arena—large mission area on the left, compact progress/activity rail on the right.
- Style: sharp competitive-game interface, subtle luminous borders, restrained scan-line texture, and focused motion rather than decorative effects.

## Technical Details
- Define all visual values as semantic tokens in the global design system.
- Build focused React components for navigation, mission cards, progress, activity, and the challenge briefing overlay.
- Use the uploaded image only as a design reference, not as an embedded screenshot.
- Add page-specific title, description, Open Graph, and Twitter metadata.
- Verify the result in the browser at desktop and mobile sizes and resolve any layout or runtime issues.
