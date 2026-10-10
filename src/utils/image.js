/**
 * Utility to optimize image URLs, specifically targeting Cloudinary assets.
 * Adds dynamic formatting, automatic quality, and responsive width limits.
 */
export function getOptimizedImageUrl(url, width = 800) {
  if (!url || typeof url !== 'string') {
    return '/sunspot-skyline.svg' // default fallback
  }

  // Only optimize Cloudinary URLs
  if (!url.includes('cloudinary.com')) {
    return url
  }

  // If already optimized, don't double-optimize
  if (url.includes('f_auto') || url.includes('q_auto')) {
    return url
  }

  const parts = url.split('/image/upload/')
  if (parts.length !== 2) {
    return url
  }

  const baseUrl = parts[0]
  const rest = parts[1]

  // Add f_auto (format auto), q_auto (quality auto), and resize limit
  const optimizationParams = `f_auto,q_auto${width ? `,w_${width},c_limit` : ''}`

  return `${baseUrl}/image/upload/${optimizationParams}/${rest}`
}
