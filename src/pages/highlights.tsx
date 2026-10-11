import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/router';
import {
  Images,
  Film,
  FolderOpen,
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  CheckCircle2,
  XCircle,
  Archive,
  ArrowUpDown,
  Settings as SettingsIcon,
  Sparkles,
  ExternalLink,
  AlertCircle,
  Calendar,
  Clock,
  Layers,
  ChevronUp,
  ChevronDown,
  RefreshCw,
  Check,
  ShieldAlert,
} from 'lucide-react';
import PageLayout from '../components/PageLayout';
import Modal from '../components/Modal';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { HighlightItem, HighlightMediaType, HighlightStatus, HighlightSettings } from '../types/highlights';
import { extractDriveFileId, validateDriveUrlLocal } from '../utils/driveUtils';

export default function HighlightsManagementPage() {
  const router = useRouter();
  const { user } = useApp();

  const [activeTab, setActiveTab] = useState<'management' | 'settings'>('management');
  const [highlights, setHighlights] = useState<HighlightItem[]>([]);
  const [settings, setSettings] = useState<HighlightSettings>({
    default_duration_days: 7,
    carousel_interval: 5,
    auto_rotate: true,
    max_visible: 10,
    is_enabled: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | HighlightStatus>('all');
  const [mediaTypeFilter, setMediaTypeFilter] = useState<'all' | HighlightMediaType>('all');

  // Create / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHighlight, setEditingHighlight] = useState<HighlightItem | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formMediaType, setFormMediaType] = useState<HighlightMediaType>('image');
  const [formDriveUrl, setFormDriveUrl] = useState('');
  const [formStatus, setFormStatus] = useState<HighlightStatus>('draft');
  const [formStartDate, setFormStartDate] = useState('');
  const [formExpirationDate, setFormExpirationDate] = useState('');
  const [formOrder, setFormOrder] = useState<number>(0);
  const [formIsFeatured, setFormIsFeatured] = useState<boolean>(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Full Preview Modal State
  const [previewItem, setPreviewItem] = useState<HighlightItem | null>(null);

  // Delete & Archive Confirmation
  const [deletingItem, setDeletingItem] = useState<HighlightItem | null>(null);
  const [archivingItem, setArchivingItem] = useState<HighlightItem | null>(null);

  // Settings form state
  const [settingsForm, setSettingsForm] = useState<HighlightSettings>({
    default_duration_days: 7,
    carousel_interval: 5,
    auto_rotate: true,
    max_visible: 10,
    is_enabled: true,
  });

  // Check permissions
  const canManage = Boolean(
    user?.is_staff ||
      user?.is_superuser ||
      user?.can_manage_highlights ||
      user?.permissions_list?.includes('can_view_highlights_mgmt')
  );

  const canPublish = Boolean(
    user?.is_staff ||
      user?.is_superuser ||
      user?.permissions_list?.includes('can_publish_highlight')
  );

  const canDelete = Boolean(
    user?.is_staff ||
      user?.is_superuser ||
      user?.permissions_list?.includes('can_delete_highlight')
  );

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  const loadData = useCallback(async () => {
    if (!canManage) return;
    try {
      setIsLoading(true);
      const [highlightsData, settingsData] = await Promise.all([
        api.getMediaHighlights(),
        api.getHighlightSettings(),
      ]);

      const list = Array.isArray(highlightsData) ? highlightsData : [];
      setHighlights(list);

      if (settingsData) {
        setSettings(settingsData);
        setSettingsForm(settingsData);
      }
    } catch (err: any) {
      showNotification('error', err?.message || 'Failed to load highlights data.');
    } finally {
      setIsLoading(false);
    }
  }, [canManage]);

  useEffect(() => {
    if (user && canManage) {
      loadData();
    }
  }, [user, canManage, loadData]);

  // Handle URL change & live validation
  const driveValidation = useMemo(() => {
    return validateDriveUrlLocal(formDriveUrl, formMediaType);
  }, [formDriveUrl, formMediaType]);

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingHighlight(null);
    setFormTitle('');
    setFormDescription('');
    setFormMediaType('image');
    setFormDriveUrl('');
    setFormStatus('published');
    const nowLocal = new Date().toISOString().slice(0, 16);
    setFormStartDate(nowLocal);
    setFormExpirationDate('');
    setFormOrder(0);
    setFormIsFeatured(false);
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (item: HighlightItem) => {
    setEditingHighlight(item);
    setFormTitle(item.title);
    setFormDescription(item.description || '');
    setFormMediaType(item.media_type);
    setFormDriveUrl(item.drive_url);
    setFormStatus(item.status);
    setFormStartDate(item.display_start_date ? new Date(item.display_start_date).toISOString().slice(0, 16) : '');
    setFormExpirationDate(item.expiration_date ? new Date(item.expiration_date).toISOString().slice(0, 16) : '');
    setFormOrder(item.display_order || 0);
    setFormIsFeatured(item.is_featured || false);
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Save / Update Highlight
  const handleSaveHighlight = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!formTitle.trim()) {
      errors.title = 'Title is required.';
    }

    if (!formDriveUrl.trim()) {
      errors.drive_url = 'Google Drive URL is required.';
    } else if (!driveValidation.valid) {
      errors.drive_url = driveValidation.error || 'Invalid Google Drive link.';
    }

    if (formExpirationDate && formStartDate && new Date(formExpirationDate) < new Date(formStartDate)) {
      errors.expiration_date = 'Expiration date cannot be earlier than start date.';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      setIsSaving(true);
      const payload: any = {
        title: formTitle.trim(),
        description: formDescription.trim(),
        media_type: formMediaType,
        drive_url: formDriveUrl.trim(),
        status: formStatus,
        display_start_date: formStartDate ? new Date(formStartDate).toISOString() : null,
        expiration_date: formExpirationDate ? new Date(formExpirationDate).toISOString() : null,
        clear_expiration_date: !formExpirationDate,
        display_order: Number(formOrder) || 0,
        is_featured: formIsFeatured,
      };

      if (editingHighlight) {
        await api.updateMediaHighlight(editingHighlight.id, payload);
        showNotification('success', 'Highlight updated successfully.');
      } else {
        await api.createMediaHighlight(payload);
        showNotification('success', 'Highlight created successfully.');
      }

      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      showNotification('error', err?.message || 'Failed to save highlight.');
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle publish
  const handleTogglePublish = async (item: HighlightItem) => {
    try {
      const willPublish = item.status !== 'published';
      await api.publishMediaHighlight(item.id, willPublish);
      showNotification('success', willPublish ? 'Highlight published.' : 'Highlight unpublished (set to draft).');
      loadData();
    } catch (err: any) {
      showNotification('error', err?.message || 'Failed to update publication status.');
    }
  };

  // Archive highlight
  const handleConfirmArchive = async () => {
    if (!archivingItem) return;
    try {
      await api.archiveMediaHighlight(archivingItem.id);
      showNotification('success', 'Highlight archived.');
      setArchivingItem(null);
      loadData();
    } catch (err: any) {
      showNotification('error', err?.message || 'Failed to archive highlight.');
    }
  };

  // Delete highlight
  const handleConfirmDelete = async () => {
    if (!deletingItem) return;
    try {
      await api.deleteMediaHighlight(deletingItem.id);
      showNotification('success', 'Highlight deleted permanently.');
      setDeletingItem(null);
      loadData();
    } catch (err: any) {
      showNotification('error', err?.message || 'Failed to delete highlight.');
    }
  };

  // Quick reorder up/down
  const handleShiftOrder = async (item: HighlightItem, direction: 'up' | 'down') => {
    const currentIndex = highlights.findIndex((h) => h.id === item.id);
    if (currentIndex === -1) return;

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= highlights.length) return;

    const currentOrder = item.display_order;
    const targetItem = highlights[targetIndex];
    const targetOrder = targetItem.display_order;

    const newOrders = [
      { id: item.id, display_order: targetOrder === currentOrder ? (direction === 'up' ? currentOrder - 1 : currentOrder + 1) : targetOrder },
      { id: targetItem.id, display_order: currentOrder },
    ];

    try {
      await api.reorderMediaHighlights(newOrders);
      loadData();
    } catch (err: any) {
      showNotification('error', err?.message || 'Failed to update display order.');
    }
  };

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      const updated = await api.updateHighlightSettings({
        default_duration_days: Number(settingsForm.default_duration_days),
        carousel_interval: Number(settingsForm.carousel_interval),
        auto_rotate: Boolean(settingsForm.auto_rotate),
        max_visible: Number(settingsForm.max_visible),
        is_enabled: Boolean(settingsForm.is_enabled),
      });
      setSettings(updated);
      setSettingsForm(updated);
      showNotification('success', 'Highlights settings saved successfully.');
    } catch (err: any) {
      showNotification('error', err?.message || 'Failed to save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  // Filtered highlights list
  const filteredHighlights = useMemo(() => {
    return highlights.filter((h) => {
      if (statusFilter !== 'all' && h.status !== statusFilter) return false;
      if (mediaTypeFilter !== 'all' && h.media_type !== mediaTypeFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = h.title?.toLowerCase().includes(q);
        const matchDesc = h.description?.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc) return false;
      }
      return true;
    });
  }, [highlights, statusFilter, mediaTypeFilter, searchQuery]);

  // Access check state
  if (!user || !canManage) {
    return (
      <>
        <PageLayout title="Highlights" items={[{ label: 'Highlights' }]} />
        <div className="max-w-md mx-auto my-16 p-8 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">Access Restricted</h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed font-serif">
            You do not have administrative permissions to view or manage Highlights. Please contact an administrator if you require access.
          </p>
          <button
            type="button"
            onClick={() => router.push('/')}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 transition-colors"
          >
            Return to Home
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <PageLayout
        title="Highlights"
        items={[{ label: 'Highlights' }]}
        actions={
          activeTab === 'management' ? (
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 text-stone-950 hover:bg-amber-400 transition-all flex items-center gap-1.5 shadow-sm shadow-amber-500/20 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Create Highlight</span>
            </button>
          ) : null
        }
      />
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-6 space-y-6">
        {/* Toast Notification */}
        {notification && (
          <div
            className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2 border transition-all shadow-md ${
              notification.type === 'success'
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
                : 'bg-red-500/15 border-red-500/30 text-red-800 dark:text-red-300'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            )}
            <span>{notification.message}</span>
          </div>
        )}

        {/* Top Header & Tab Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 dark:border-stone-800 pb-4">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-stone-900 dark:text-stone-100 flex items-center gap-2.5">
              <Images className="w-6 h-6 text-amber-500" />
              <span>Highlights Module</span>
            </h1>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 font-serif">
              Manage Google Drive media presentations and configure the Home page carousel.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-stone-100 dark:bg-stone-900 p-1.5 rounded-2xl border border-stone-200/80 dark:border-stone-800 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('management')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                activeTab === 'management'
                  ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 shadow-xs'
                  : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-amber-500" />
              <span>Highlights</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300">
                {highlights.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                activeTab === 'settings'
                  ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 shadow-xs'
                  : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
              }`}
            >
              <SettingsIcon className="w-3.5 h-3.5 text-amber-500" />
              <span>Carousel Settings</span>
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* TAB 1: HIGHLIGHTS MANAGEMENT                              */}
        {/* ========================================================= */}
        {activeTab === 'management' && (
          <div className="space-y-4">
            {/* Search & Filters Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-xs">
              <div className="relative md:w-80">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search highlights by title..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl text-xs border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-stone-800 dark:text-stone-200"
                />
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="px-3 py-1.5 rounded-xl text-xs border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 text-stone-700 dark:text-stone-300"
                >
                  <option value="all">All Statuses</option>
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                  <option value="archived">Archived</option>
                </select>

                {/* Media Type Filter */}
                <select
                  value={mediaTypeFilter}
                  onChange={(e) => setMediaTypeFilter(e.target.value as any)}
                  className="px-3 py-1.5 rounded-xl text-xs border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 text-stone-700 dark:text-stone-300"
                >
                  <option value="all">All Media Types</option>
                  <option value="image">Images</option>
                  <option value="video">Videos</option>
                </select>

                <button
                  type="button"
                  onClick={loadData}
                  className="p-1.5 rounded-xl text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-950"
                  title="Refresh list"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Highlights Content Table */}
            {isLoading ? (
              <div className="py-20 text-center text-stone-400 text-xs flex flex-col items-center justify-center gap-2">
                <RefreshCw className="w-5 h-5 animate-spin text-amber-500" />
                <span>Loading highlights...</span>
              </div>
            ) : filteredHighlights.length > 0 ? (
              <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-stone-100 dark:border-stone-800 text-stone-400 uppercase tracking-wider text-[10px] bg-stone-50/60 dark:bg-stone-950/60">
                      <tr>
                        <th className="py-3 px-4 font-bold w-16">Preview</th>
                        <th className="py-3 px-4 font-bold">Title & Description</th>
                        <th className="py-3 px-4 font-bold">Media</th>
                        <th className="py-3 px-4 font-bold">Status</th>
                        <th className="py-3 px-4 font-bold">Display Schedule</th>
                        <th className="py-3 px-4 font-bold text-center">Order</th>
                        <th className="py-3 px-4 font-bold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 dark:divide-stone-800/80">
                      {filteredHighlights.map((item) => {
                        const isExpired = !item.is_eligible && item.status === 'published';

                        return (
                          <tr
                            key={item.id}
                            className="hover:bg-stone-50/50 dark:hover:bg-stone-800/30 transition-colors"
                          >
                            {/* Thumbnail */}
                            <td className="py-3 px-4">
                              <button
                                type="button"
                                onClick={() => setPreviewItem(item)}
                                className="relative w-14 h-10 rounded-lg overflow-hidden bg-stone-800 border border-stone-200 dark:border-stone-700 flex items-center justify-center group cursor-pointer"
                                title="Click to view full preview"
                              >
                                {item.is_folder ? (
                                  <div className="w-full h-full bg-stone-900 flex flex-col items-center justify-center text-amber-400">
                                    <FolderOpen className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                  </div>
                                ) : (
                                  <img
                                    src={item.thumbnail_url}
                                    alt={item.title}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                                    onError={(e) => {
                                      (e.target as any).style.display = 'none';
                                    }}
                                  />
                                )}
                                {item.media_type === 'video' && (
                                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                    <Film className="w-3.5 h-3.5 text-white" />
                                  </div>
                                )}
                              </button>
                            </td>

                            {/* Title & Caption */}
                            <td className="py-3 px-4 max-w-xs">
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-stone-900 dark:text-stone-100 truncate">
                                    {item.title}
                                  </span>
                                  {item.is_featured && (
                                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400">
                                      Pinned
                                    </span>
                                  )}
                                </div>
                                {item.description && (
                                  <p className="text-[11px] text-stone-500 dark:text-stone-400 line-clamp-1 font-serif">
                                    {item.description}
                                  </p>
                                )}
                                <div className="text-[10px] text-stone-400 flex items-center gap-2">
                                  <span>By {item.created_by_name}</span>
                                  <span>•</span>
                                  <a
                                    href={item.drive_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-amber-600 dark:text-amber-400 hover:underline inline-flex items-center gap-0.5"
                                  >
                                    Drive <ExternalLink className="w-2.5 h-2.5" />
                                  </a>
                                </div>
                              </div>
                            </td>

                            {/* Media Type */}
                            <td className="py-3 px-4">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                                  item.media_type === 'video'
                                    ? 'bg-purple-500/15 text-purple-700 dark:text-purple-400'
                                    : item.is_folder
                                    ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400'
                                    : 'bg-blue-500/15 text-blue-700 dark:text-blue-400'
                                }`}
                              >
                                {item.media_type === 'video' ? (
                                  <>
                                    <Film className="w-2.5 h-2.5" /> Video
                                  </>
                                ) : item.is_folder ? (
                                  <>
                                    <FolderOpen className="w-2.5 h-2.5" /> Photo Directory
                                  </>
                                ) : (
                                  <>
                                    <Images className="w-2.5 h-2.5" /> Image
                                  </>
                                )}
                              </span>
                            </td>

                            {/* Status */}
                            <td className="py-3 px-4">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                  item.status === 'published'
                                    ? isExpired
                                      ? 'bg-red-500/15 text-red-700 dark:text-red-400'
                                      : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                                    : item.status === 'draft'
                                    ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400'
                                    : 'bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
                                }`}
                              >
                                {item.status === 'published' ? (
                                  isExpired ? (
                                    <>
                                      <Clock className="w-3 h-3" /> Expired
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle2 className="w-3 h-3" /> Published
                                    </>
                                  )
                                ) : item.status === 'draft' ? (
                                  <>Draft</>
                                ) : (
                                  <>
                                    <Archive className="w-3 h-3" /> Archived
                                  </>
                                )}
                              </span>
                            </td>

                            {/* Schedule & Expiration */}
                            <td className="py-3 px-4 text-[11px] text-stone-600 dark:text-stone-300">
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-1 text-[10px] text-stone-400">
                                  <Calendar className="w-3 h-3" />
                                  <span>
                                    {new Date(item.display_start_date).toLocaleDateString()}
                                  </span>
                                </div>
                                <div className="text-[10px] text-stone-500">
                                  {item.expiration_date ? (
                                    <span>
                                      Exp: {new Date(item.expiration_date).toLocaleDateString()}
                                    </span>
                                  ) : (
                                    <span className="italic text-stone-400">
                                      Default duration ({settings.default_duration_days}d)
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* Order */}
                            <td className="py-3 px-4 text-center">
                              <div className="inline-flex items-center gap-1 bg-stone-100 dark:bg-stone-800 px-2 py-1 rounded-lg">
                                <span className="font-bold text-[11px]">{item.display_order}</span>
                                <div className="flex flex-col">
                                  <button
                                    type="button"
                                    onClick={() => handleShiftOrder(item, 'up')}
                                    className="text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 -mb-1"
                                    title="Move up"
                                  >
                                    <ChevronUp className="w-3 h-3" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleShiftOrder(item, 'down')}
                                    className="text-stone-400 hover:text-stone-800 dark:hover:text-stone-200"
                                    title="Move down"
                                  >
                                    <ChevronDown className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            </td>

                            {/* Actions */}
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  type="button"
                                  onClick={() => setPreviewItem(item)}
                                  className="p-1.5 rounded-lg text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                                  title="Preview"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleOpenEditModal(item)}
                                  className="p-1.5 rounded-lg text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                                  title="Edit"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>

                                {canPublish && (
                                  <button
                                    type="button"
                                    onClick={() => handleTogglePublish(item)}
                                    className={`p-1.5 rounded-lg transition-colors ${
                                      item.status === 'published'
                                        ? 'text-amber-600 hover:bg-amber-500/10'
                                        : 'text-emerald-600 hover:bg-emerald-500/10'
                                    }`}
                                    title={item.status === 'published' ? 'Unpublish' : 'Publish'}
                                  >
                                    {item.status === 'published' ? (
                                      <XCircle className="w-3.5 h-3.5" />
                                    ) : (
                                      <Check className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                )}

                                {item.status !== 'archived' && (
                                  <button
                                    type="button"
                                    onClick={() => setArchivingItem(item)}
                                    className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                                    title="Archive"
                                  >
                                    <Archive className="w-3.5 h-3.5" />
                                  </button>
                                )}

                                {canDelete && (
                                  <button
                                    type="button"
                                    onClick={() => setDeletingItem(item)}
                                    className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-500/10 transition-colors"
                                    title="Delete"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="py-16 text-center rounded-3xl bg-white dark:bg-stone-900 border border-dashed border-stone-200 dark:border-stone-800 space-y-3">
                <Images className="w-8 h-8 mx-auto text-stone-300 dark:text-stone-600" />
                <h3 className="text-sm font-bold text-stone-700 dark:text-stone-300">No Highlights Found</h3>
                <p className="text-xs text-stone-400 max-w-sm mx-auto font-serif">
                  {searchQuery || statusFilter !== 'all' || mediaTypeFilter !== 'all'
                    ? 'No highlights match your current search or filter parameters.'
                    : 'Get started by creating your first featured image or video highlight.'}
                </p>
                <button
                  type="button"
                  onClick={handleOpenCreateModal}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 text-stone-950 hover:bg-amber-400 transition-all shadow-xs"
                >
                  Create First Highlight
                </button>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: HIGHLIGHTS SETTINGS                                */}
        {/* ========================================================= */}
        {activeTab === 'settings' && (
          <div className="max-w-2xl bg-white dark:bg-stone-900 p-6 sm:p-8 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-6">
            <div>
              <h2 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <SettingsIcon className="w-4 h-4 text-amber-500" />
                <span>Carousel & Display Duration Settings</span>
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 font-serif">
                Configure default slideshow progression, visibility rules, and rotation behavior.
              </p>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-5">
              {/* Feature Enabled Toggle */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-stone-50 dark:bg-stone-950 border border-stone-200/80 dark:border-stone-800">
                <div>
                  <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100">
                    Enable Highlights on Home Page
                  </h4>
                  <p className="text-[11px] text-stone-500 font-serif">
                    When disabled, the carousel is completely hidden on the Home page.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settingsForm.is_enabled}
                  onChange={(e) => setSettingsForm({ ...settingsForm, is_enabled: e.target.checked })}
                  className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 cursor-pointer"
                />
              </div>

              {/* Automatic Rotation Toggle */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-stone-50 dark:bg-stone-950 border border-stone-200/80 dark:border-stone-800">
                <div>
                  <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100">
                    Automatic Slideshow Rotation
                  </h4>
                  <p className="text-[11px] text-stone-500 font-serif">
                    Automatically advance to the next highlight after the configured interval.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settingsForm.auto_rotate}
                  onChange={(e) => setSettingsForm({ ...settingsForm, auto_rotate: e.target.checked })}
                  className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 cursor-pointer"
                />
              </div>

              {/* Default Display Duration */}
              <div>
                <label className="text-[11px] font-bold text-stone-700 dark:text-stone-300 block mb-1">
                  Default Display Duration (Days)
                </label>
                <p className="text-[10px] text-stone-400 mb-2 font-serif">
                  Highlights published without an explicit expiration date remain active for this number of days (1–365).
                </p>
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={settingsForm.default_duration_days}
                  onChange={(e) =>
                    setSettingsForm({ ...settingsForm, default_duration_days: parseInt(e.target.value) || 7 })
                  }
                  className="w-full px-3.5 py-2 rounded-xl text-xs border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 text-stone-800 dark:text-stone-200"
                />
              </div>

              {/* Carousel Interval */}
              <div>
                <label className="text-[11px] font-bold text-stone-700 dark:text-stone-300 block mb-1">
                  Carousel Interval (Seconds)
                </label>
                <p className="text-[10px] text-stone-400 mb-2 font-serif">
                  Duration each slide stays visible before rotating to the next highlight (1–60 seconds).
                </p>
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={settingsForm.carousel_interval}
                  onChange={(e) =>
                    setSettingsForm({ ...settingsForm, carousel_interval: parseInt(e.target.value) || 5 })
                  }
                  className="w-full px-3.5 py-2 rounded-xl text-xs border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 text-stone-800 dark:text-stone-200"
                />
              </div>

              {/* Maximum Visible Highlights */}
              <div>
                <label className="text-[11px] font-bold text-stone-700 dark:text-stone-300 block mb-1">
                  Maximum Visible Highlights
                </label>
                <p className="text-[10px] text-stone-400 mb-2 font-serif">
                  Maximum number of active slides displayed in the Home page carousel (1–50).
                </p>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={settingsForm.max_visible}
                  onChange={(e) =>
                    setSettingsForm({ ...settingsForm, max_visible: parseInt(e.target.value) || 10 })
                  }
                  className="w-full px-3.5 py-2 rounded-xl text-xs border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 text-stone-800 dark:text-stone-200"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-stone-100 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setSettingsForm(settings)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 text-stone-950 hover:bg-amber-400 transition-all shadow-xs disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* MODAL 1: CREATE / EDIT HIGHLIGHT                          */}
      {/* ========================================================= */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingHighlight ? 'Edit Highlight' : 'Create New Highlight'}
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSaveHighlight} className="space-y-4">
          {/* Title */}
          <div>
            <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Feast of Tabernacles Celebration"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              className={`w-full px-3.5 py-2 rounded-xl text-xs border bg-stone-50 dark:bg-stone-950 text-stone-800 dark:text-stone-200 ${
                formErrors.title
                  ? 'border-red-500 focus:ring-red-400'
                  : 'border-stone-200 dark:border-stone-700 focus:ring-amber-400'
              }`}
            />
            {formErrors.title && <span className="text-[10px] text-red-500 mt-1 block">{formErrors.title}</span>}
          </div>

          {/* Caption / Description */}
          <div>
            <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-1">
              Caption / Description (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="Short description or scripture quote displayed on the carousel..."
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl text-xs border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 text-stone-800 dark:text-stone-200 font-serif"
            />
          </div>

          {/* Media Type Selector */}
          <div>
            <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-1">
              Media Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFormMediaType('image')}
                className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  formMediaType === 'image'
                    ? 'border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-400'
                    : 'border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400'
                }`}
              >
                <Images className="w-4 h-4" />
                <span>Image</span>
              </button>
              <button
                type="button"
                onClick={() => setFormMediaType('video')}
                className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  formMediaType === 'video'
                    ? 'border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-400'
                    : 'border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400'
                }`}
              >
                <Film className="w-4 h-4" />
                <span>Video</span>
              </button>
            </div>
          </div>

          {/* Google Drive URL */}
          <div>
            <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-1">
              Google Drive URL <span className="text-red-500">*</span>
            </label>
            <input
              type="url"
              placeholder={
                formMediaType === 'image'
                  ? 'https://drive.google.com/drive/folders/FOLDER_ID or /file/d/FILE_ID/view'
                  : 'https://drive.google.com/file/d/FILE_ID/view?usp=sharing'
              }
              value={formDriveUrl}
              onChange={(e) => setFormDriveUrl(e.target.value)}
              className={`w-full px-3.5 py-2 rounded-xl text-xs border bg-stone-50 dark:bg-stone-950 text-stone-800 dark:text-stone-200 ${
                formErrors.drive_url
                  ? 'border-red-500 focus:ring-red-400'
                  : 'border-stone-200 dark:border-stone-700 focus:ring-amber-400'
              }`}
            />
            {formErrors.drive_url && (
              <span className="text-[10px] text-red-500 mt-1 block">{formErrors.drive_url}</span>
            )}

            <p className="text-[10px] text-stone-400 mt-1.5 leading-normal">
              {formMediaType === 'image'
                ? 'For images, paste a Google Drive shared folder link (containing photos) or single image link. Ensure sharing is set to Anyone with the link can view.'
                : 'Ensure Google Drive sharing is set to Anyone with the link can view. No file uploads required.'}
            </p>

            {/* Live Drive Preview Box */}
            {formDriveUrl && (
              <div className="mt-3 p-3 rounded-2xl bg-stone-100 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                    {driveValidation.valid ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        <span>
                          {driveValidation.is_folder
                            ? 'Valid Google Drive Photo Directory (Folder)'
                            : 'Valid Google Drive Link'}
                        </span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3.5 h-3.5 text-red-500" />
                        <span>Invalid Link</span>
                      </>
                    )}
                  </span>
                  {driveValidation.file_id && (
                    <span className="text-[10px] font-mono text-stone-400">
                      ID: {driveValidation.file_id.slice(0, 10)}...
                    </span>
                  )}
                </div>

                {driveValidation.valid && (
                  <div className="relative w-full h-48 rounded-xl overflow-hidden bg-black flex items-center justify-center border border-stone-200 dark:border-stone-800">
                    {formMediaType === 'video' || driveValidation.is_folder ? (
                      <iframe
                        src={driveValidation.embed_url || ''}
                        title={driveValidation.is_folder ? 'Live Photo Directory Preview' : 'Live Video Preview'}
                        className="w-full h-full border-0"
                      />
                    ) : (
                      <img
                        src={driveValidation.preview_url || ''}
                        alt="Drive Preview"
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          (e.target as any).src = driveValidation.thumbnail_url || '';
                        }}
                      />
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Dates: Display Start & Expiration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-1">
                Display Start Date
              </label>
              <input
                type="datetime-local"
                value={formStartDate}
                onChange={(e) => setFormStartDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 text-stone-800 dark:text-stone-200"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-1">
                Expiration Date (Optional)
              </label>
              <input
                type="datetime-local"
                value={formExpirationDate}
                onChange={(e) => setFormExpirationDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 text-stone-800 dark:text-stone-200"
              />
              <span className="text-[9px] text-stone-400 block mt-0.5">
                Leave blank to use default ({settings.default_duration_days} days).
              </span>
            </div>
          </div>

          {/* Order & Pin Setting */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-1">
                Display Order
              </label>
              <input
                type="number"
                value={formOrder}
                onChange={(e) => setFormOrder(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl text-xs border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 text-stone-800 dark:text-stone-200"
              />
            </div>

            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formIsFeatured}
                  onChange={(e) => setFormIsFeatured(e.target.checked)}
                  className="rounded text-amber-500 focus:ring-amber-400"
                />
                <span className="text-xs font-semibold text-stone-800 dark:text-stone-200">
                  Pin to Front of Carousel
                </span>
              </label>
            </div>
          </div>

          {/* Publication Status */}
          {canPublish && (
            <div className="pt-1">
              <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-1">
                Publication Status
              </label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-1.5 cursor-pointer text-xs">
                  <input
                    type="radio"
                    name="pub_status"
                    checked={formStatus === 'published'}
                    onChange={() => setFormStatus('published')}
                    className="text-amber-500 focus:ring-amber-400"
                  />
                  <span>Published</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer text-xs">
                  <input
                    type="radio"
                    name="pub_status"
                    checked={formStatus === 'draft'}
                    onChange={() => setFormStatus('draft')}
                    className="text-amber-500 focus:ring-amber-400"
                  />
                  <span>Draft</span>
                </label>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-stone-100 dark:border-stone-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 text-stone-950 hover:bg-amber-400 transition-all shadow-xs disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : editingHighlight ? 'Update Highlight' : 'Create Highlight'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ========================================================= */}
      {/* MODAL 2: FULL PREVIEW MODAL                               */}
      {/* ========================================================= */}
      <Modal
        isOpen={Boolean(previewItem)}
        onClose={() => setPreviewItem(null)}
        title={previewItem?.title || 'Highlight Preview'}
        maxWidth="max-w-3xl"
      >
        {previewItem && (
          <div className="space-y-4">
            <div className="w-full h-80 sm:h-96 rounded-2xl overflow-hidden bg-black flex items-center justify-center border border-stone-800">
              {previewItem.media_type === 'video' || previewItem.is_folder ? (
                <iframe
                  src={
                    previewItem.is_folder
                      ? previewItem.embed_url || `https://drive.google.com/embeddedfolderview?id=${previewItem.drive_file_id}#grid`
                      : `https://drive.google.com/file/d/${previewItem.drive_file_id}/preview`
                  }
                  title={previewItem.title}
                  className="w-full h-full border-0"
                  allowFullScreen
                />
              ) : (
                <img
                  src={
                    previewItem.direct_image_url ||
                    previewItem.preview_url ||
                    `https://drive.google.com/thumbnail?id=${previewItem.drive_file_id}&sz=w1600`
                  }
                  alt={previewItem.title}
                  className="w-full h-full object-contain"
                />
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    previewItem.status === 'published'
                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                      : 'bg-amber-500/15 text-amber-700 dark:text-amber-400'
                  }`}
                >
                  {previewItem.status.toUpperCase()}
                </span>
                <a
                  href={previewItem.drive_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
                >
                  Open in Google Drive <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {previewItem.description && (
                <p className="text-xs text-stone-600 dark:text-stone-300 font-serif leading-relaxed">
                  {previewItem.description}
                </p>
              )}

              <div className="grid grid-cols-2 gap-2 text-[11px] text-stone-400 pt-2 border-t border-stone-100 dark:border-stone-800">
                <div>
                  Start: {new Date(previewItem.display_start_date).toLocaleString()}
                </div>
                <div>
                  Expiration:{' '}
                  {previewItem.expiration_date
                    ? new Date(previewItem.expiration_date).toLocaleString()
                    : `Effective: ${new Date(previewItem.effective_expiration_date).toLocaleString()}`}
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* ========================================================= */}
      {/* MODAL 3: DELETE CONFIRMATION                              */}
      {/* ========================================================= */}
      <Modal
        isOpen={Boolean(deletingItem)}
        onClose={() => setDeletingItem(null)}
        title="Delete Highlight"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-xs text-stone-600 dark:text-stone-400 font-serif leading-relaxed">
            Are you sure you want to permanently delete <b>"{deletingItem?.title}"</b>? This action cannot be undone.
          </p>
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setDeletingItem(null)}
              className="px-4 py-2 rounded-xl text-xs font-semibold border border-stone-200 dark:border-stone-700"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmDelete}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 text-white hover:bg-red-500 transition-colors"
            >
              Confirm Delete
            </button>
          </div>
        </div>
      </Modal>

      {/* ========================================================= */}
      {/* MODAL 4: ARCHIVE CONFIRMATION                             */}
      {/* ========================================================= */}
      <Modal
        isOpen={Boolean(archivingItem)}
        onClose={() => setArchivingItem(null)}
        title="Archive Highlight"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-xs text-stone-600 dark:text-stone-400 font-serif leading-relaxed">
            Are you sure you want to archive <b>"{archivingItem?.title}"</b>? It will no longer appear on the Home page slideshow.
          </p>
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setArchivingItem(null)}
              className="px-4 py-2 rounded-xl text-xs font-semibold border border-stone-200 dark:border-stone-700"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmArchive}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 text-white hover:bg-amber-500 transition-colors"
            >
              Confirm Archive
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
