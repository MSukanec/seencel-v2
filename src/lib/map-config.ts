// ============================================================================
// MAP CONFIGURATION — Centralized map styling for all Google Maps instances
// ============================================================================
// All maps in Seencel use satellite (buildings + terrain, NO labels) with
// a CSS filter applied to the tile layer in globals.css.
//
// Google Maps DOM structure:
//   .gm-style > div:first-child (wrapper)
//     ├─ div:first-child [z:1]  ← Tiles — filtered via CSS
//     └─ div [z:3+]             ← Overlays / Markers — untouched
//
// Usage:
//   import { MAP_TYPE_ID, getMapContainerClass } from "@/lib/map-config";
//   <div className={getMapContainerClass(isDark)}>
//     <GoogleMap options={{ mapTypeId: MAP_TYPE_ID }} ... >
//       <OverlayView ... /> ← NOT filtered
//     </GoogleMap>
//   </div>
// ============================================================================

/** Map type — satellite shows buildings/terrain without Google labels */
export const MAP_TYPE_ID = "satellite" as const;

/**
 * Returns the CSS class for the map container that applies the
 * desaturation filter ONLY to the tile layer (not markers/overlays).
 * Classes defined in globals.css.
 */
export function getMapContainerClass(isDark: boolean): string {
    return isDark ? "seencel-map-dark" : "seencel-map-light";
}
