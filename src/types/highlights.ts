export type HighlightMediaType = 'image' | 'video';
export type HighlightStatus = 'draft' | 'published' | 'archived';

export interface FolderImageItem {
  id: string;
  name: string;
  image_url: string;
  thumbnail_url?: string;
  direct_url?: string;
}

export interface HighlightItem {
  id: string;
  title: string;
  description: string;
  media_type: HighlightMediaType;
  drive_url: string;
  drive_file_id: string;
  is_folder?: boolean;
  folder_images?: FolderImageItem[];
  preview_url: string;
  thumbnail_url: string;
  embed_url: string;
  direct_image_url?: string;
  stream_url?: string;
  status: HighlightStatus;
  display_start_date: string;
  expiration_date: string | null;
  effective_expiration_date: string;
  display_order: number;
  is_featured: boolean;
  is_eligible: boolean;
  created_by_name: string;
  created_by_email: string;
  created_at: string;
  updated_at: string;
}

export interface HighlightPublicItem {
  id: string;
  title: string;
  description: string;
  media_type: HighlightMediaType;
  drive_url: string;
  drive_file_id: string;
  is_folder?: boolean;
  folder_images?: FolderImageItem[];
  preview_url: string;
  thumbnail_url: string;
  embed_url: string;
  direct_image_url?: string;
  stream_url?: string;
  display_order: number;
  is_featured: boolean;
  display_start_date: string;
}

export interface HighlightSettings {
  default_duration_days: number;
  carousel_interval: number;
  auto_rotate: boolean;
  max_visible: number;
  is_enabled: boolean;
}

export interface DriveValidationResult {
  valid: boolean;
  is_folder?: boolean;
  error?: string | null;
  file_id?: string | null;
  preview_url?: string | null;
  thumbnail_url?: string | null;
  embed_url?: string | null;
  direct_image_url?: string | null;
}
