import { loadAssetUrl } from '@aedifex/core'

export const ASSETS_CDN_URL = process.env.NEXT_PUBLIC_ASSETS_CDN_URL || ''

/**
 * Resolves an asset URL to the appropriate format:
 * - If URL starts with http:// or https://, return as-is (external URL)
 * - If URL starts with asset://, resolve from IndexedDB storage
 * - If URL starts with /, use as same-origin path (no CDN prefix)
 * - Otherwise, prepend / for same-origin path
 */
export async function resolveAssetUrl(url: string | undefined | null): Promise<string | null> {
  if (!url) return null

  // External URL - use as-is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }

  // IndexedDB asset - resolve from storage
  if (url.startsWith('asset://')) {
    return loadAssetUrl(url)
  }

  // Absolute path - use same-origin if no CDN configured
  const normalizedPath = url.startsWith('/') ? url : `/${url}`
  
  // If CDN URL is empty or not configured, return same-origin path
  if (!ASSETS_CDN_URL || ASSETS_CDN_URL === '') {
    return normalizedPath
  }
  
  return `${ASSETS_CDN_URL}${normalizedPath}`
}

/**
 * Synchronous version for URLs that don't need IndexedDB resolution
 * Only use this if you're sure the URL is not an asset:// URL
 */
export function resolveCdnUrl(url: string | undefined | null): string | null {
  if (!url) return null

  // External URL - use as-is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }

  // Don't use this for asset:// URLs - use resolveAssetUrl instead
  if (url.startsWith('asset://')) {
    console.warn('Use resolveAssetUrl() for asset:// URLs, not resolveCdnUrl()')
    return null
  }

  // Absolute path - use same-origin if no CDN configured
  const normalizedPath = url.startsWith('/') ? url : `/${url}`
  
  // If CDN URL is empty or not configured, return same-origin path
  if (!ASSETS_CDN_URL || ASSETS_CDN_URL === '') {
    return normalizedPath
  }
  
  return `${ASSETS_CDN_URL}${normalizedPath}`
}
