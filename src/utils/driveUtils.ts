import { DriveValidationResult, HighlightMediaType } from '../types/highlights';

export const ALLOWED_DRIVE_DOMAINS = [
  'drive.google.com',
  'docs.google.com',
];

/**
 * Parses a Google Drive URL and extracts the file/folder ID and whether it is a folder directory.
 * Supports:
 * - https://drive.google.com/drive/folders/FOLDER_ID
 * - https://drive.google.com/drive/u/0/folders/FOLDER_ID
 * - https://drive.google.com/embeddedfolderview?id=FOLDER_ID
 * - https://drive.google.com/file/d/FILE_ID/view?usp=sharing
 * - https://drive.google.com/open?id=FILE_ID
 * - https://drive.google.com/uc?id=FILE_ID
 * - https://docs.google.com/file/d/FILE_ID/...
 */
export function extractDriveResource(url: string): { fileId: string | null; isFolder: boolean } {
  if (!url || typeof url !== 'string') return { fileId: null, isFolder: false };
  const cleaned = url.trim();

  try {
    const parsed = new URL(cleaned);
    if (!['http:', 'https:'].includes(parsed.protocol)) return { fileId: null, isFolder: false };

    const hostname = parsed.hostname.toLowerCase();
    const isAllowedHost =
      ALLOWED_DRIVE_DOMAINS.includes(hostname) || hostname.endsWith('.drive.google.com');

    if (!isAllowedHost) return { fileId: null, isFolder: false };

    // Folder Pattern 1: /drive/folders/<id> or /folders/<id>
    const folderMatch = parsed.pathname.match(/\/folders\/([a-zA-Z0-9_-]{20,})/);
    if (folderMatch && folderMatch[1]) {
      return { fileId: folderMatch[1], isFolder: true };
    }

    // File Pattern 1: /file/d/<id> or /d/<id>
    const pathMatch = parsed.pathname.match(/\/(?:file\/)?d\/([a-zA-Z0-9_-]{20,})/);
    if (pathMatch && pathMatch[1]) {
      return { fileId: pathMatch[1], isFolder: false };
    }

    // Pattern 2: ?id=<id>
    const idParam = parsed.searchParams.get('id');
    if (idParam && /^[a-zA-Z0-9_-]{20,}$/.test(idParam)) {
      const isFolder =
        parsed.pathname.includes('embeddedfolderview') || parsed.pathname.includes('folders');
      return { fileId: idParam, isFolder };
    }
  } catch {
    return { fileId: null, isFolder: false };
  }

  return { fileId: null, isFolder: false };
}

/**
 * Backward-compatible helper extracting ID.
 */
export function extractDriveFileId(url: string): string | null {
  return extractDriveResource(url).fileId;
}

/**
 * Generates media preview, thumbnail, and embed URLs for a Google Drive file or folder ID.
 */
export function generateDriveMediaUrls(
  fileId: string,
  mediaType: HighlightMediaType = 'image',
  isFolder: boolean = false
) {
  if (!fileId) {
    return {
      previewUrl: '',
      thumbnailUrl: '',
      embedUrl: '',
      directImageUrl: '',
      isFolder: false,
    };
  }

  if (isFolder) {
    const embedUrl = `https://drive.google.com/embeddedfolderview?id=${fileId}#grid`;
    return {
      previewUrl: embedUrl,
      thumbnailUrl: embedUrl,
      embedUrl,
      directImageUrl: '',
      isFolder: true,
    };
  }

  const embedUrl = `https://drive.google.com/file/d/${fileId}/preview`;
  const thumbnailUrl = `https://drive.google.com/thumbnail?id=${fileId}&sz=w800`;
  const previewUrl =
    mediaType === 'video'
      ? embedUrl
      : `https://drive.google.com/thumbnail?id=${fileId}&sz=w1600`;
  const directImageUrl = `https://lh3.googleusercontent.com/d/${fileId}`;

  return {
    previewUrl,
    thumbnailUrl,
    embedUrl,
    directImageUrl,
    isFolder: false,
  };
}

/**
 * Validates a Google Drive URL on client side and returns preview details.
 */
export function validateDriveUrlLocal(
  url: string,
  mediaType: HighlightMediaType = 'image'
): DriveValidationResult {
  const { fileId, isFolder } = extractDriveResource(url);
  if (!fileId) {
    return {
      valid: false,
      is_folder: false,
      error:
        'Please enter a valid Google Drive file or shared folder link (e.g., https://drive.google.com/file/d/FILE_ID/view or https://drive.google.com/drive/folders/FOLDER_ID)',
      file_id: null,
      preview_url: null,
      thumbnail_url: null,
      embed_url: null,
    };
  }

  const urls = generateDriveMediaUrls(fileId, mediaType, isFolder);
  return {
    valid: true,
    is_folder: isFolder,
    error: null,
    file_id: fileId,
    preview_url: urls.previewUrl,
    thumbnail_url: urls.thumbnailUrl,
    embed_url: urls.embedUrl,
    direct_image_url: urls.directImageUrl,
  };
}
