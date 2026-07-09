export const LEGACY_DEFAULT_REPORT_PHOTO_URL =
  'https://www.espreso.co.rs/data/images/2019/01/30/13/504387_rupa-na-putu-01-news1-marina-lopicic_ls.jpg'

export const DEFAULT_REPORT_PHOTO_URL = '/default-report-photo.jpg'

export function getReportPhotoUrl(photoUrl?: string | null) {
  if (!photoUrl || photoUrl === LEGACY_DEFAULT_REPORT_PHOTO_URL) {
    return DEFAULT_REPORT_PHOTO_URL
  }

  return photoUrl
}