// Thumbnail display sizing.
//
// Screenshots are shown at a FIXED WIDTH with their natural height (aspect
// ratio preserved, never cropped), so a tall page simply makes a taller card.
// Capture your desktop screenshots at a single consistent width and they'll
// all line up; RECOMMENDED_SOURCE_WIDTH is the width to export them at.
export const THUMB = {
  card: 240, // editor funnel — shared step
  cardSmall: 200, // editor funnel — step inside a lane
  board: 340, // present overview — shared step
  boardSmall: 280, // present overview — step inside a lane
};

// Suggested width (px) to capture/export desktop screenshots at.
export const RECOMMENDED_SOURCE_WIDTH = 1280;

// Aspect ratio used for the placeholder shown when a step has no screenshot.
export const PLACEHOLDER_ASPECT = "16 / 10";
