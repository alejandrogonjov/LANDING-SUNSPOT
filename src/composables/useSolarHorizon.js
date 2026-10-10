import {
  fetchBuildings,
  computeHorizonProfile,
  fallbackProfile,
} from '@/utils/solarHorizon'

/** Compute a fresh { profile, source } for a raw location — the ONLY Overpass path.
 *  Called exclusively from SpotManager on save. Old spots are backfilled by
 *  re-saving them one by one; nothing else hits Overpass. */
async function computeForLocation(lat, lng) {
  const buildings = await fetchBuildings(lat, lng)
  if (!buildings) return { profile: fallbackProfile(), source: 'fallback' }
  return { profile: computeHorizonProfile({ lat, lng, buildings }), source: 'osm' }
}

export function useSolarHorizon() {
  /**
   * Resolve a spot's horizon profile without any network call:
   *   1. stored `spot.horizon_profile` (computed once on save)
   *   2. flat Valencia fallback for spots not yet backfilled
   *
   * Live Overpass computation happens only in SpotManager (compute-on-save),
   * so viewing a spot never triggers a request.
   */
  function getProfileForSpot(spot) {
    if (Array.isArray(spot?.horizon_profile) && spot.horizon_profile.length === 360) {
      return { profile: spot.horizon_profile, source: spot.horizon_source || 'osm' }
    }
    return { profile: fallbackProfile(), source: 'fallback' }
  }

  return { getProfileForSpot, computeForLocation }
}
