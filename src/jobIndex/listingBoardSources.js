export const ADDITIONAL_LISTING_SOURCE_NAMES = [
  "Greenhouse",
  "Lever",
  "Ashby",
  "GitHub hiring discovery",
  "JobSpy-style general boards",
  "Generic niche job boards"
];

export function isAdditionalListingSourceAdapter(adapter) {
  return ADDITIONAL_LISTING_SOURCE_NAMES.includes(adapter?.name);
}
