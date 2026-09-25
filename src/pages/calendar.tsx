import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  Clock,
  MapPin,
  Tag,
  Bell,
  CheckCircle,
  AlertCircle,
  Link as LinkIcon,
  Video,
  Edit2,
  Trash2,
  X,
  Layers,
  List,
  Filter,
  Eye,
  CalendarDays,
  Sparkles,
} from 'lucide-react';
import PageLayout from '../components/PageLayout';
import Modal from '../components/Modal';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';

type CalendarViewMode = 'day' | 'week' | 'month' | 'year' | 'list';

interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  event_type: 'event' | 'reminder';
  date: string;
  end_date?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  is_all_day: boolean;
  color: string;
  location: string;
  url?: string | null;
  priority: 'none' | 'low' | 'medium' | 'high' | 'urgent';
  repeat: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  early_reminder: string;
  reminder_date?: string | null;
  reminder_time?: string | null;
  is_published: boolean;
  created_by?: string | null;
  created_by_name?: string;
  created_at?: string;
}

const COLOR_PALETTE = [
  { label: 'Magenta', value: '#d946ef', bg: 'bg-fuchsia-500', text: 'text-fuchsia-700' },
  { label: 'Purple', value: '#a855f7', bg: 'bg-purple-500', text: 'text-purple-700' },
  { label: 'Indigo', value: '#6366f1', bg: 'bg-indigo-500', text: 'text-indigo-700' },
  { label: 'Blue', value: '#3b82f6', bg: 'bg-blue-500', text: 'text-blue-700' },
  { label: 'Emerald', value: '#10b981', bg: 'bg-emerald-500', text: 'text-emerald-700' },
  { label: 'Amber', value: '#f59e0b', bg: 'bg-amber-500', text: 'text-amber-700' },
  { label: 'Rose', value: '#f43f5e', bg: 'bg-rose-500', text: 'text-rose-700' },
];

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function CalendarPage() {
  const router = useRouter();
  const { user } = useApp();

  // Role check: Calendar managers or Admins have full access to interactive Google/Apple Calendar views
  const canManage = Boolean(user?.is_staff || user?.can_manage_calendar);

  // View mode
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedListTab, setSelectedListTab] = useState<'all' | 'upcoming' | 'month' | 'reminders'>('all');

  // Event modal state (Add / Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<'event' | 'reminder'>('event');
  const [editingEventId, setEditingEventId] = useState<string | null>(null);

  // Modal form fields
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formEndDate, setFormEndDate] = useState('');
  const [formStartTime, setFormStartTime] = useState('09:00');
  const [formEndTime, setFormEndTime] = useState('10:00');
  const [formIsAllDay, setFormIsAllDay] = useState(false);
  const [formColor, setFormColor] = useState('#d946ef');
  const [formLocation, setFormLocation] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [formPriority, setFormPriority] = useState<'none' | 'low' | 'medium' | 'high' | 'urgent'>('none');
  const [formRepeat, setFormRepeat] = useState<'none' | 'daily' | 'weekly' | 'monthly' | 'yearly'>('none');
  const [formEarlyReminder, setFormEarlyReminder] = useState('none');
  const [formReminderDate, setFormReminderDate] = useState('');
  const [formReminderTime, setFormReminderTime] = useState('09:00');
  const [formIsPublished, setFormIsPublished] = useState(true);
  const [formHasReminderSwitch, setFormHasReminderSwitch] = useState(false);
  const [formHasDateSwitch, setFormHasDateSwitch] = useState(true);
  const [formHasTimeSwitch, setFormHasTimeSwitch] = useState(true);

  // Read-only Event Detail Modal (for normal users and quick inspection)
  const [detailEvent, setDetailEvent] = useState<CalendarEvent | null>(null);

  // Load events
  const loadEvents = async () => {
    setIsLoading(true);
    try {
      if (canManage) {
        const data = await api.getAdminEvents();
        setEvents(Array.isArray(data) ? data : []);
      } else {
        const data = await api.getEvents();
        setEvents(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to load events:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, [user, canManage]);

  // If user cannot manage calendar, force view mode to 'list'
  useEffect(() => {
    if (!canManage && viewMode !== 'list') {
      setViewMode('list');
    }
  }, [canManage, viewMode]);

  // Date navigation helpers
  const handlePrev = () => {
    const d = new Date(currentDate);
    if (viewMode === 'day') {
      d.setDate(d.getDate() - 1);
    } else if (viewMode === 'week') {
      d.setDate(d.getDate() - 7);
    } else if (viewMode === 'month' || viewMode === 'list') {
      d.setMonth(d.getMonth() - 1);
    } else if (viewMode === 'year') {
      d.setFullYear(d.getFullYear() - 1);
    }
    setCurrentDate(d);
  };

  const handleNext = () => {
    const d = new Date(currentDate);
    if (viewMode === 'day') {
      d.setDate(d.getDate() + 1);
    } else if (viewMode === 'week') {
      d.setDate(d.getDate() + 7);
    } else if (viewMode === 'month' || viewMode === 'list') {
      d.setMonth(d.getMonth() + 1);
    } else if (viewMode === 'year') {
      d.setFullYear(d.getFullYear() + 1);
    }
    setCurrentDate(d);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Format date helper: YYYY-MM-DD
  const formatDateISO = (d: Date): string => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Open Create Modal
  const handleOpenCreateModal = (presetDate?: string, presetTime?: string, type: 'event' | 'reminder' = 'event') => {
    if (!canManage) return;
    const defaultDateStr = presetDate || formatDateISO(currentDate);
    setEditingEventId(null);
    setModalTab(type);
    setFormTitle('');
    setFormDescription('');
    setFormDate(defaultDateStr);
    setFormEndDate(defaultDateStr);
    setFormStartTime(presetTime || '09:00');
    setFormEndTime(presetTime ? `${parseInt(presetTime.split(':')[0], 10) + 1}:00` : '10:00');
    setFormIsAllDay(false);
    setFormColor('#d946ef');
    setFormLocation('');
    setFormUrl('');
    setFormPriority('none');
    setFormRepeat('none');
    setFormEarlyReminder('none');
    setFormReminderDate(defaultDateStr);
    setFormReminderTime('09:00');
    setFormIsPublished(true);
    setFormHasDateSwitch(true);
    setFormHasTimeSwitch(true);
    setFormHasReminderSwitch(false);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (evt: CalendarEvent) => {
    if (!canManage) {
      setDetailEvent(evt);
      return;
    }
    setEditingEventId(evt.id);
    setModalTab(evt.event_type || 'event');
    setFormTitle(evt.title);
    setFormDescription(evt.description || '');
    setFormDate(evt.date);
    setFormEndDate(evt.end_date || evt.date);
    setFormStartTime(evt.start_time ? evt.start_time.slice(0, 5) : '09:00');
    setFormEndTime(evt.end_time ? evt.end_time.slice(0, 5) : '10:00');
    setFormIsAllDay(Boolean(evt.is_all_day));
    setFormColor(evt.color || '#d946ef');
    setFormLocation(evt.location || '');
    setFormUrl(evt.url || '');
    setFormPriority(evt.priority || 'none');
    setFormRepeat(evt.repeat || 'none');
    setFormEarlyReminder(evt.early_reminder || 'none');
    setFormReminderDate(evt.reminder_date || evt.date);
    setFormReminderTime(evt.reminder_time ? evt.reminder_time.slice(0, 5) : '09:00');
    setFormIsPublished(evt.is_published !== false);
    setFormHasDateSwitch(Boolean(evt.date));
    setFormHasTimeSwitch(Boolean(evt.start_time));
    setFormHasReminderSwitch(evt.early_reminder !== 'none');
    setIsModalOpen(true);
  };

  // Save Event / Reminder
  const handleSaveEvent = async () => {
    if (!formTitle.trim()) {
      alert('Please enter a title');
      return;
    }
    if (!formDate) {
      alert('Please select a date');
      return;
    }

    try {
      const payload: any = {
        title: formTitle.trim(),
        description: formDescription,
        event_type: modalTab,
        date: formDate,
        end_date: formEndDate || formDate,
        start_time: formIsAllDay ? null : formStartTime || null,
        end_time: formIsAllDay ? null : formEndTime || null,
        is_all_day: formIsAllDay,
        color: formColor,
        location: formLocation,
        url: formUrl || null,
        priority: formPriority,
        repeat: formRepeat,
        early_reminder: formEarlyReminder,
        reminder_date: formEarlyReminder === 'custom' ? formReminderDate : null,
        reminder_time: formEarlyReminder === 'custom' ? formReminderTime : null,
        is_published: formIsPublished,
      };

      if (editingEventId) {
        await api.updateEvent(editingEventId, payload);
      } else {
        await api.createEvent(payload);
      }

      setIsModalOpen(false);
      loadEvents();
    } catch (err: any) {
      alert(`Error saving event: ${err.message || 'Unknown error'}`);
    }
  };

  // Delete Event
  const handleDeleteEvent = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
      await api.deleteEvent(id);
      setIsModalOpen(false);
      loadEvents();
    } catch (err: any) {
      alert(`Error deleting event: ${err.message || 'Unknown error'}`);
    }
  };

  // Filtered events
  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchTitle = e.title.toLowerCase().includes(query);
        const matchDesc = (e.description || '').toLowerCase().includes(query);
        const matchLoc = (e.location || '').toLowerCase().includes(query);
        if (!matchTitle && !matchDesc && !matchLoc) return false;
      }
      return true;
    });
  }, [events, searchQuery]);

  // Month grid generation
  const monthGridDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sun
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthTotalDays = new Date(year, month, 0).getDate();

    const days: Array<{
      date: Date;
      dateString: string;
      isCurrentMonth: boolean;
      isToday: boolean;
      dayNumber: number;
    }> = [];

    const todayStr = formatDateISO(new Date());

    // Previous month padding
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthTotalDays - i);
      const str = formatDateISO(d);
      days.push({
        date: d,
        dateString: str,
        isCurrentMonth: false,
        isToday: str === todayStr,
        dayNumber: prevMonthTotalDays - i,
      });
    }

    // Current month days
    for (let i = 1; i <= totalDaysInMonth; i++) {
      const d = new Date(year, month, i);
      const str = formatDateISO(d);
      days.push({
        date: d,
        dateString: str,
        isCurrentMonth: true,
        isToday: str === todayStr,
        dayNumber: i,
      });
    }

    // Next month padding to fill complete weeks (35 or 42 cells)
    const remainingCells = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remainingCells; i++) {
      const d = new Date(year, month + 1, i);
      const str = formatDateISO(d);
      days.push({
        date: d,
        dateString: str,
        isCurrentMonth: false,
        isToday: str === todayStr,
        dayNumber: i,
      });
    }

    return days;
  }, [currentDate]);

  // Events on specific day string (YYYY-MM-DD)
  const getEventsForDate = (dateStr: string) => {
    return filteredEvents.filter((e) => {
      if (e.date === dateStr) return true;
      if (e.end_date && e.date <= dateStr && e.end_date >= dateStr) return true;
      return false;
    });
  };

  // Week View Days
  const weekDays = useMemo(() => {
    const d = new Date(currentDate);
    const dayOfWeek = d.getDay();
    const startOfWeek = new Date(d);
    startOfWeek.setDate(d.getDate() - dayOfWeek);

    const todayStr = formatDateISO(new Date());
    const days: Array<{ date: Date; dateString: string; isToday: boolean; dayName: string; dayNumber: number }> = [];

    for (let i = 0; i < 7; i++) {
      const current = new Date(startOfWeek);
      current.setDate(startOfWeek.getDate() + i);
      const str = formatDateISO(current);
      days.push({
        date: current,
        dateString: str,
        isToday: str === todayStr,
        dayName: WEEKDAYS[i],
        dayNumber: current.getDate(),
      });
    }
    return days;
  }, [currentDate]);

  // Month title formatter
  const formattedMonthYear = `${MONTH_NAMES[currentDate.getMonth()]} ${currentDate.getFullYear()}`;

  // Time format helper (e.g. "09:00:00" -> "9 am" or "9:30 am")
  const formatDisplayTime = (timeStr?: string | null) => {
    if (!timeStr) return '';
    const parts = timeStr.split(':');
    const hour = parseInt(parts[0], 10);
    const minute = parseInt(parts[1], 10);
    const ampm = hour >= 12 ? 'pm' : 'am';
    const displayHour = hour % 12 === 0 ? 12 : hour % 12;
    return minute === 0 ? `${displayHour} ${ampm}` : `${displayHour}:${parts[1]} ${ampm}`;
  };

  return (
    <>
      <PageLayout
        title="Calendar"
        items={[{ label: 'Calendar' }]}
        actions={
          canManage && (
            <button
              onClick={() => handleOpenCreateModal(undefined, undefined, 'event')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold shadow-sm transition-all md:w-fit"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Event</span>
            </button>
          )
        }
      />

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Top Bar / macOS-style Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-stone-900 p-4 sm:p-5 rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-sm">
          {/* Left: Month Year Display & Today Navigation */}
          <div className="flex items-center space-x-3">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <span className="font-extrabold">{MONTH_NAMES[currentDate.getMonth()]}</span>
              <span className="font-light text-stone-500 dark:text-stone-400">{currentDate.getFullYear()}</span>
            </h2>

            {/* Navigation arrows & Today */}
            <div className="flex items-center space-x-1 pl-2">
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Previous"
                className="p-1.5 rounded-lg border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleToday}
                className="px-3 py-1 rounded-lg text-xs font-semibold border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              >
                Today
              </button>
              <button
                type="button"
                onClick={handleNext}
                aria-label="Next"
                className="p-1.5 rounded-lg border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Center / Right: View Selector (Day | Week | Month | Year) - Only for managers */}
          <div className="flex flex-wrap items-center gap-3">
            {canManage && (
              <div className="inline-flex rounded-xl bg-stone-100 dark:bg-stone-800 p-1 border border-stone-200 dark:border-stone-700/80">
                {(['day', 'week', 'month', 'year', 'list'] as CalendarViewMode[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setViewMode(mode)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all ${
                      viewMode === mode
                        ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-sm'
                        : 'text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            )}

            {/* Search Bar left-aligned md:w-96 as per rule */}
            <div className="relative flex-1 md:w-64">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search events, notes, locations..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl text-xs border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-stone-800 dark:text-stone-200 placeholder:text-stone-400"
              />
            </div>
          </div>
        </div>

        {/* CALENDAR BODY */}
        {isLoading ? (
          <div className="py-24 text-center text-sm text-stone-400 space-y-2">
            <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p>Loading calendar events...</p>
          </div>
        ) : !canManage || viewMode === 'list' ? (
          /* ========================================================= */
          /* NORMAL USER / LIST VIEW (Read-only list of events)        */
          /* ========================================================= */
          <div className="space-y-6">
            {/* Filter Tabs for List View */}
            <div className="flex items-center space-x-2 border-b border-stone-200 dark:border-stone-800 pb-3">
              {[
                { key: 'all', label: 'All Events' },
                { key: 'upcoming', label: 'Upcoming' },
                { key: 'month', label: 'This Month' },
                { key: 'reminders', label: 'Reminders' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setSelectedListTab(tab.key as any)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    selectedListTab === tab.key
                      ? 'bg-amber-500 text-white shadow-sm'
                      : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* List of events */}
            <div className="space-y-3">
              {filteredEvents.length > 0 ? (
                filteredEvents
                  .filter((e) => {
                    const todayStr = formatDateISO(new Date());
                    if (selectedListTab === 'upcoming') {
                      return (e.end_date || e.date) >= todayStr;
                    }
                    if (selectedListTab === 'month') {
                      const curYear = currentDate.getFullYear();
                      const curMonth = currentDate.getMonth() + 1;
                      const evtMonth = parseInt(e.date.split('-')[1], 10);
                      const evtYear = parseInt(e.date.split('-')[0], 10);
                      return evtYear === curYear && evtMonth === curMonth;
                    }
                    if (selectedListTab === 'reminders') {
                      return e.event_type === 'reminder';
                    }
                    return true;
                  })
                  .map((evt) => (
                    <div
                      key={evt.id}
                      onClick={() => setDetailEvent(evt)}
                      className="group p-4 sm:p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 hover:border-amber-500/50 dark:hover:border-amber-500/40 shadow-sm transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-start gap-4">
                        {/* Color indicator stripe */}
                        <div
                          className="w-2.5 h-12 rounded-full shrink-0"
                          style={{ backgroundColor: evt.color || '#ec4899' }}
                        />
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-bold text-sm sm:text-base text-stone-900 dark:text-stone-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                              {evt.title}
                            </h4>
                            {evt.event_type === 'reminder' && (
                              <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[10px] font-bold">
                                Reminder
                              </span>
                            )}
                            {evt.priority === 'urgent' && (
                              <span className="px-2 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-bold animate-pulse">
                                Urgent
                              </span>
                            )}
                          </div>

                          {evt.description && (
                            <p className="text-xs text-stone-500 dark:text-stone-400 font-serif line-clamp-2">
                              {evt.description}
                            </p>
                          )}

                          <div className="flex items-center gap-4 text-xs text-stone-400 pt-1 flex-wrap">
                            <span className="flex items-center gap-1.5 font-medium text-stone-600 dark:text-stone-300">
                              <CalendarIcon className="w-3.5 h-3.5 text-amber-500" />
                              {evt.date} {evt.end_date && evt.end_date !== evt.date ? `– ${evt.end_date}` : ''}
                            </span>
                            {evt.start_time && (
                              <span className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5" />
                                {formatDisplayTime(evt.start_time)}
                                {evt.end_time ? ` – ${formatDisplayTime(evt.end_time)}` : ''}
                              </span>
                            )}
                            {evt.location && (
                              <span className="flex items-center gap-1.5 truncate max-w-xs">
                                <MapPin className="w-3.5 h-3.5 text-rose-500" />
                                {evt.location}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDetailEvent(evt);
                          }}
                          className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 flex items-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Details</span>
                        </button>
                      </div>
                    </div>
                  ))
              ) : (
                <div className="p-12 text-center rounded-2xl bg-white dark:bg-stone-900 border border-dashed border-stone-200 dark:border-stone-800 text-stone-400 space-y-2">
                  <CalendarDays className="w-8 h-8 mx-auto text-stone-300 dark:text-stone-600 mb-2" />
                  <p className="text-sm font-semibold">No calendar events found</p>
                  <p className="text-xs text-stone-400">There are no upcoming scheduled events matching your criteria.</p>
                </div>
              )}
            </div>
          </div>
        ) : viewMode === 'month' ? (
          /* ========================================================= */
          /* GOOGLE / APPLE CALENDAR: MONTH VIEW                      */
          /* ========================================================= */
          <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-sm overflow-hidden select-none">
            {/* Weekday Header */}
            <div className="grid grid-cols-7 border-b border-stone-200 dark:border-stone-800 text-center text-xs font-bold text-stone-500 dark:text-stone-400 py-2.5 bg-stone-50/70 dark:bg-stone-950/40">
              {WEEKDAYS.map((day) => (
                <div key={day} className="tracking-wide uppercase text-[11px]">
                  {day}
                </div>
              ))}
            </div>

            {/* Days Grid (7 columns) */}
            <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-stone-200/70 dark:divide-stone-800/70 border-b border-stone-200 dark:border-stone-800">
              {monthGridDays.map((dayObj, index) => {
                const dayEvents = getEventsForDate(dayObj.dateString);
                const isFirstDayOfMonth = dayObj.dayNumber === 1;

                return (
                  <div
                    key={dayObj.dateString + index}
                    onClick={() => handleOpenCreateModal(dayObj.dateString, '09:00', 'event')}
                    className={`min-h-[110px] sm:min-h-[135px] p-1.5 sm:p-2 flex flex-col justify-between group transition-colors hover:bg-amber-50/30 dark:hover:bg-amber-950/10 cursor-pointer ${
                      !dayObj.isCurrentMonth ? 'bg-stone-50/40 dark:bg-stone-950/20 text-stone-300 dark:text-stone-600' : ''
                    }`}
                  >
                    {/* Day Number Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        {dayObj.isToday ? (
                          <span className="w-6 h-6 rounded-full bg-rose-500 text-white font-bold text-xs flex items-center justify-center shadow-sm">
                            {dayObj.dayNumber}
                          </span>
                        ) : (
                          <span
                            className={`text-xs font-medium px-1 ${
                              dayObj.isCurrentMonth
                                ? 'text-stone-800 dark:text-stone-200'
                                : 'text-stone-400 dark:text-stone-600'
                            }`}
                          >
                            {isFirstDayOfMonth
                              ? `${dayObj.dayNumber} ${MONTH_NAMES[dayObj.date.getMonth()].slice(0, 3)}`
                              : dayObj.dayNumber}
                          </span>
                        )}
                      </div>

                      {/* Hover plus indicator for managers */}
                      {canManage && (
                        <span className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-500 transition-opacity">
                          <Plus className="w-3 h-3" />
                        </span>
                      )}
                    </div>

                    {/* Events List in Cell */}
                    <div className="flex-1 overflow-y-auto space-y-1 my-1">
                      {dayEvents.slice(0, 3).map((evt) => (
                        <div
                          key={evt.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEditModal(evt);
                          }}
                          style={{
                            backgroundColor: `${evt.color}20`,
                            borderLeftColor: evt.color || '#ec4899',
                          }}
                          className="px-2 py-0.5 rounded-md text-[11px] font-medium text-stone-900 dark:text-stone-100 border-l-2 truncate flex items-center gap-1 shadow-2xs hover:scale-[1.02] transition-transform"
                        >
                          {evt.start_time && !evt.is_all_day && (
                            <span className="text-[10px] text-stone-500 dark:text-stone-400 shrink-0">
                              {formatDisplayTime(evt.start_time)}
                            </span>
                          )}
                          <span className="truncate">{evt.title}</span>
                        </div>
                      ))}

                      {dayEvents.length > 3 && (
                        <div className="text-[10px] text-stone-400 font-semibold px-1">
                          +{dayEvents.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : viewMode === 'week' ? (
          /* ========================================================= */
          /* GOOGLE / APPLE CALENDAR: WEEK VIEW                       */
          /* ========================================================= */
          <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-sm overflow-x-auto select-none">
            <div className="min-w-[700px]">
              {/* Header Days of Week */}
              <div className="grid grid-cols-8 border-b border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-950/40 text-center py-3">
                <div className="text-[11px] font-bold text-stone-400">Time</div>
                {weekDays.map((d) => (
                  <div key={d.dateString} className="flex flex-col items-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">{d.dayName}</span>
                    <span
                      className={`text-sm font-extrabold mt-0.5 ${
                        d.isToday
                          ? 'w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center'
                          : 'text-stone-800 dark:text-stone-200'
                      }`}
                    >
                      {d.dayNumber}
                    </span>
                  </div>
                ))}
              </div>

              {/* Hourly Grid Rows (7 AM - 10 PM) */}
              <div className="divide-y divide-stone-100 dark:divide-stone-800/60 max-h-[600px] overflow-y-auto">
                {Array.from({ length: 16 }, (_, i) => i + 7).map((hour) => {
                  const hourStr = `${hour.toString().padStart(2, '0')}:00`;
                  const displayLabel = hour > 12 ? `${hour - 12} PM` : hour === 12 ? '12 PM' : `${hour} AM`;

                  return (
                    <div key={hour} className="grid grid-cols-8 min-h-[52px]">
                      {/* Hour label */}
                      <div className="p-2 text-right text-[11px] text-stone-400 font-medium pr-3 border-r border-stone-100 dark:border-stone-800/60">
                        {displayLabel}
                      </div>

                      {/* Day Cells for this hour */}
                      {weekDays.map((d) => {
                        const cellEvents = filteredEvents.filter((e) => {
                          if (e.date !== d.dateString) return false;
                          if (!e.start_time) return false;
                          const evtHour = parseInt(e.start_time.split(':')[0], 10);
                          return evtHour === hour;
                        });

                        return (
                          <div
                            key={d.dateString}
                            onClick={() => handleOpenCreateModal(d.dateString, hourStr, 'event')}
                            className="p-1 border-r border-stone-100 dark:border-stone-800/60 hover:bg-amber-50/40 dark:hover:bg-amber-950/20 transition-colors relative cursor-pointer group"
                          >
                            {cellEvents.map((evt) => (
                              <div
                                key={evt.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenEditModal(evt);
                                }}
                                style={{
                                  backgroundColor: `${evt.color}25`,
                                  borderLeftColor: evt.color || '#ec4899',
                                }}
                                className="p-1 rounded text-[11px] font-semibold text-stone-900 dark:text-stone-100 border-l-2 truncate shadow-xs mb-1 hover:scale-[1.02] transition-transform"
                              >
                                <span className="truncate block">{evt.title}</span>
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : viewMode === 'day' ? (
          /* ========================================================= */
          /* GOOGLE / APPLE CALENDAR: DAY VIEW                         */
          /* ========================================================= */
          <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-sm p-5 space-y-4 select-none">
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
              <div>
                <h3 className="text-xl font-bold text-stone-900 dark:text-stone-100">
                  {WEEKDAYS[currentDate.getDay()]}, {MONTH_NAMES[currentDate.getMonth()]} {currentDate.getDate()}
                </h3>
                <p className="text-xs text-stone-400">Scheduled agenda & timeline</p>
              </div>
              <button
                onClick={() => handleOpenCreateModal(formatDateISO(currentDate), '09:00', 'event')}
                className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add to this day</span>
              </button>
            </div>

            {/* Hourly schedule */}
            <div className="divide-y divide-stone-100 dark:divide-stone-800/60 max-h-[600px] overflow-y-auto">
              {Array.from({ length: 16 }, (_, i) => i + 7).map((hour) => {
                const hourStr = `${hour.toString().padStart(2, '0')}:00`;
                const displayLabel = hour > 12 ? `${hour - 12} PM` : hour === 12 ? '12 PM' : `${hour} AM`;
                const dateStr = formatDateISO(currentDate);

                const hourEvents = filteredEvents.filter((e) => {
                  if (e.date !== dateStr) return false;
                  if (!e.start_time) return false;
                  const evtHour = parseInt(e.start_time.split(':')[0], 10);
                  return evtHour === hour;
                });

                return (
                  <div
                    key={hour}
                    onClick={() => handleOpenCreateModal(dateStr, hourStr, 'event')}
                    className="flex items-start gap-4 py-3 px-2 hover:bg-amber-50/30 dark:hover:bg-amber-950/20 transition-colors cursor-pointer group rounded-xl"
                  >
                    <div className="w-16 text-right text-xs font-bold text-stone-400 pt-0.5">
                      {displayLabel}
                    </div>
                    <div className="flex-1 min-h-[36px] space-y-2">
                      {hourEvents.length > 0 ? (
                        hourEvents.map((evt) => (
                          <div
                            key={evt.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEditModal(evt);
                            }}
                            style={{
                              backgroundColor: `${evt.color}15`,
                              borderLeftColor: evt.color || '#ec4899',
                            }}
                            className="p-3 rounded-xl border-l-4 shadow-sm flex items-center justify-between"
                          >
                            <div>
                              <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100">{evt.title}</h4>
                              {evt.description && (
                                <p className="text-xs text-stone-500 dark:text-stone-400 font-serif mt-0.5">
                                  {evt.description}
                                </p>
                              )}
                              <div className="flex items-center gap-3 text-[11px] text-stone-400 mt-1.5">
                                <span>
                                  {formatDisplayTime(evt.start_time)} – {formatDisplayTime(evt.end_time)}
                                </span>
                                {evt.location && <span>• {evt.location}</span>}
                              </div>
                            </div>
                            <Edit2 className="w-4 h-4 text-stone-400 group-hover:text-amber-500 transition-colors" />
                          </div>
                        ))
                      ) : (
                        <div className="text-xs text-stone-300 dark:text-stone-700 opacity-0 group-hover:opacity-100 transition-opacity">
                          + Click to add event at {displayLabel}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* ========================================================= */
          /* GOOGLE / APPLE CALENDAR: YEAR VIEW                        */
          /* ========================================================= */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 select-none">
            {MONTH_NAMES.map((mName, mIdx) => {
              const year = currentDate.getFullYear();
              const firstDay = new Date(year, mIdx, 1).getDay();
              const daysInMonth = new Date(year, mIdx + 1, 0).getDate();

              return (
                <div
                  key={mName}
                  onClick={() => {
                    const next = new Date(currentDate);
                    next.setMonth(mIdx);
                    setCurrentDate(next);
                    setViewMode('month');
                  }}
                  className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm hover:border-amber-500/50 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                      {mName}
                    </h4>
                    <span className="text-[10px] text-stone-400 font-semibold">{year}</span>
                  </div>

                  {/* Mini Weekday labels */}
                  <div className="grid grid-cols-7 text-center text-[9px] font-bold text-stone-400 mb-1">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((ch, i) => (
                      <span key={i}>{ch}</span>
                    ))}
                  </div>

                  {/* Mini days grid */}
                  <div className="grid grid-cols-7 text-center text-[10px] gap-y-1">
                    {Array.from({ length: firstDay }).map((_, i) => (
                      <span key={`empty-${i}`} />
                    ))}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                      const dayNum = i + 1;
                      const dateStr = `${year}-${String(mIdx + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                      const hasEvents = events.some((e) => e.date === dateStr || (e.end_date && e.date <= dateStr && e.end_date >= dateStr));

                      return (
                        <div key={dayNum} className="flex flex-col items-center justify-center py-0.5">
                          <span
                            className={`w-5 h-5 flex items-center justify-center rounded-full ${
                              hasEvents
                                ? 'bg-amber-500/20 text-amber-700 dark:text-amber-400 font-bold'
                                : 'text-stone-600 dark:text-stone-300'
                            }`}
                          >
                            {dayNum}
                          </span>
                          {hasEvents && <span className="w-1 h-1 rounded-full bg-amber-500 -mt-0.5" />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* APPLE / GOOGLE CALENDAR MODAL (Create & Edit)             */}
      {/* ========================================================= */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingEventId ? 'Edit Calendar Entry' : 'New Calendar Entry'}
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          {/* Top Pill Switch: [Event] / [Reminder] (Matching Screenshot 1 & 2) */}
          <div className="flex items-center justify-center p-1 rounded-xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
            <button
              type="button"
              onClick={() => setModalTab('event')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                modalTab === 'event'
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
              }`}
            >
              Event
            </button>
            <button
              type="button"
              onClick={() => setModalTab('reminder')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                modalTab === 'reminder'
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
              }`}
            >
              Reminder
            </button>
          </div>

          {/* Title input */}
          <div className="space-y-1">
            <input
              type="text"
              placeholder={modalTab === 'event' ? 'New Event...' : 'Title...'}
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl text-base font-bold border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-stone-900 dark:text-stone-100"
            />
          </div>

          {/* Color palette selector */}
          <div className="flex items-center justify-between p-2 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
            <span className="text-xs font-semibold text-stone-500">Color Tag</span>
            <div className="flex items-center space-x-1.5">
              {COLOR_PALETTE.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setFormColor(c.value)}
                  style={{ backgroundColor: c.value }}
                  className={`w-5 h-5 rounded-full transition-transform ${
                    formColor === c.value ? 'scale-125 ring-2 ring-stone-900 dark:ring-white' : 'opacity-80 hover:opacity-100'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Location / Video call link */}
          <div className="relative">
            <Video className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Add Location or Video Call link..."
              value={formLocation}
              onChange={(e) => setFormLocation(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl text-xs border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-stone-800 dark:text-stone-200 placeholder:text-stone-400"
            />
          </div>

          {/* Date & Time controls */}
          <div className="space-y-2 p-3 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-xs">
            <div className="flex items-center justify-between pb-1">
              <span className="font-semibold text-stone-700 dark:text-stone-300">Start & End Dates</span>
              <label className="flex items-center gap-1.5 cursor-pointer text-stone-500">
                <input
                  type="checkbox"
                  checked={formIsAllDay}
                  onChange={(e) => setFormIsAllDay(e.target.checked)}
                  className="rounded text-amber-500 focus:ring-amber-400"
                />
                <span>All day</span>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-stone-400 block mb-0.5">Start Date</label>
                <input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-950 text-xs text-stone-800 dark:text-stone-200"
                />
              </div>
              <div>
                <label className="text-[10px] text-stone-400 block mb-0.5">End Date</label>
                <input
                  type="date"
                  value={formEndDate}
                  onChange={(e) => setFormEndDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-950 text-xs text-stone-800 dark:text-stone-200"
                />
              </div>
            </div>

            {!formIsAllDay && (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <label className="text-[10px] text-stone-400 block mb-0.5">Start Time</label>
                  <input
                    type="time"
                    value={formStartTime}
                    onChange={(e) => setFormStartTime(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-950 text-xs text-stone-800 dark:text-stone-200"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-stone-400 block mb-0.5">End Time</label>
                  <input
                    type="time"
                    value={formEndTime}
                    onChange={(e) => setFormEndTime(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-950 text-xs text-stone-800 dark:text-stone-200"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Early Reminder / Alert dropdown */}
          <div className="space-y-2 p-3 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5 text-amber-500" />
                <span>Early Reminder (Notify Users)</span>
              </span>
            </div>

            <select
              value={formEarlyReminder}
              onChange={(e) => setFormEarlyReminder(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-950 text-xs text-stone-800 dark:text-stone-200"
            >
              <option value="none">None</option>
              <option value="at_time">At time of event</option>
              <option value="5m">5 minutes before</option>
              <option value="10m">10 minutes before</option>
              <option value="15m">15 minutes before</option>
              <option value="30m">30 minutes before</option>
              <option value="1h">1 hour before</option>
              <option value="2h">2 hours before</option>
              <option value="1d">1 day before</option>
              <option value="2d">2 days before</option>
              <option value="1w">1 week before</option>
              <option value="custom">Custom Date & Hour...</option>
            </select>

            {formEarlyReminder === 'custom' && (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <label className="text-[10px] text-stone-400 block mb-0.5">Reminder Date</label>
                  <input
                    type="date"
                    value={formReminderDate}
                    onChange={(e) => setFormReminderDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-950 text-xs text-stone-800 dark:text-stone-200"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-stone-400 block mb-0.5">Reminder Time</label>
                  <input
                    type="time"
                    value={formReminderTime}
                    onChange={(e) => setFormReminderTime(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-950 text-xs text-stone-800 dark:text-stone-200"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Repeat & Priority */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <label className="text-[10px] text-stone-400 block mb-0.5">Repeat</label>
              <select
                value={formRepeat}
                onChange={(e) => setFormRepeat(e.target.value as any)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-xs text-stone-800 dark:text-stone-200"
              >
                <option value="none">Never</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] text-stone-400 block mb-0.5">Priority</label>
              <select
                value={formPriority}
                onChange={(e) => setFormPriority(e.target.value as any)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-xs text-stone-800 dark:text-stone-200"
              >
                <option value="none">None</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          {/* Notes / Description */}
          <textarea
            rows={3}
            placeholder="Add Notes, URL or details..."
            value={formDescription}
            onChange={(e) => setFormDescription(e.target.value)}
            className="w-full p-3 rounded-xl text-xs border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 font-serif text-stone-800 dark:text-stone-200 placeholder:text-stone-400"
          />

          {/* Published toggle */}
          <div className="flex items-center justify-between px-1">
            <span className="text-xs text-stone-500">Published to community</span>
            <input
              type="checkbox"
              checked={formIsPublished}
              onChange={(e) => setFormIsPublished(e.target.checked)}
              className="rounded text-amber-500 focus:ring-amber-400"
            />
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-between pt-3 border-t border-stone-100 dark:border-stone-800">
            {editingEventId ? (
              <button
                type="button"
                onClick={() => handleDeleteEvent(editingEventId)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
              >
                Delete
              </button>
            ) : (
              <span />
            )}

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEvent}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white transition-colors shadow-sm"
              >
                Save {modalTab === 'event' ? 'Event' : 'Reminder'}
              </button>
            </div>
          </div>
        </div>
      </Modal>
      {/* ========================================================= */}
      {/* READ-ONLY EVENT DETAIL MODAL (For Normal Users)           */}
      {/* ========================================================= */}
      <Modal
        isOpen={Boolean(detailEvent)}
        onClose={() => setDetailEvent(null)}
        title={detailEvent?.title || 'Event Details'}
        maxWidth="max-w-md"
      >
        {detailEvent && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span
                className="w-3.5 h-3.5 rounded-full shrink-0"
                style={{ backgroundColor: detailEvent.color || '#ec4899' }}
              />
              <span className="font-bold text-base text-stone-900 dark:text-stone-100">
                {detailEvent.title}
              </span>
              {detailEvent.event_type === 'reminder' && (
                <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[10px] font-bold">
                  Reminder
                </span>
              )}
            </div>

            <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 space-y-2.5 text-xs text-stone-600 dark:text-stone-300">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-amber-500 shrink-0" />
                <span>
                  {detailEvent.date}
                  {detailEvent.end_date && detailEvent.end_date !== detailEvent.date
                    ? ` to ${detailEvent.end_date}`
                    : ''}
                </span>
              </div>

              {detailEvent.start_time && (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>
                    {formatDisplayTime(detailEvent.start_time)}
                    {detailEvent.end_time ? ` – ${formatDisplayTime(detailEvent.end_time)}` : ''}
                  </span>
                </div>
              )}

              {detailEvent.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>{detailEvent.location}</span>
                </div>
              )}

              {detailEvent.early_reminder && detailEvent.early_reminder !== 'none' && (
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-blue-500 shrink-0" />
                  <span>Notification reminder scheduled</span>
                </div>
              )}
            </div>

            {detailEvent.description && (
              <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800">
                <span className="text-[10px] uppercase font-bold text-stone-400 block mb-1">Description / Notes</span>
                <p className="text-xs text-stone-700 dark:text-stone-300 font-serif leading-relaxed whitespace-pre-wrap">
                  {detailEvent.description}
                </p>
              </div>
            )}

            {detailEvent.url && (
              <a
                href={detailEvent.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline"
              >
                <LinkIcon className="w-3.5 h-3.5" />
                <span>Open event link</span>
              </a>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setDetailEvent(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
