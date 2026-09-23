import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Shield, Calendar, Sparkles, Plus, Trash2, Edit2, Check, AlertCircle } from 'lucide-react';
import PageLayout from '../components/PageLayout';
import { Modal } from '../components/Modal';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';

export default function AdminPortal() {
  const router = useRouter();
  const { user } = useApp();

  const [activeTab, setActiveTab] = useState<'events' | 'votd'>('events');
  const [events, setEvents] = useState<any[]>([]);
  const [votds, setVotds] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Event modal state
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventStartTime, setEventStartTime] = useState('');
  const [eventEndTime, setEventEndTime] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [eventDescription, setEventDescription] = useState('');

  // VOTD modal state
  const [isVotdModalOpen, setIsVotdModalOpen] = useState(false);
  const [votdDate, setVotdDate] = useState('');
  const [votdBook, setVotdBook] = useState('John');
  const [votdChapter, setVotdChapter] = useState(1);
  const [votdVerseStart, setVotdVerseStart] = useState(1);
  const [votdVerseEnd, setVotdVerseEnd] = useState(1);
  const [votdVersion, setVotdVersion] = useState('KJV');
  const [votdText, setVotdText] = useState('');
  const [votdMessage, setVotdMessage] = useState('');

  const fetchData = async () => {
    if (!user || !user.is_staff) return;
    setIsLoading(true);
    try {
      const [eventsData, votdsData] = await Promise.all([
        api.getAdminEvents(),
        api.getAdminVOTD(),
      ]);
      setEvents(eventsData);
      setVotds(votdsData);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user && !user.is_staff) {
      router.push('/');
    } else if (user && user.is_staff) {
      fetchData();
    }
  }, [user]);

  // Event handlers
  const handleOpenNewEvent = () => {
    setEditingEventId(null);
    setEventTitle('');
    setEventDate(new Date().toISOString().split('T')[0]);
    setEventStartTime('18:00');
    setEventEndTime('20:00');
    setEventLocation('');
    setEventDescription('');
    setIsEventModalOpen(true);
  };

  const handleOpenEditEvent = (evt: any) => {
    setEditingEventId(evt.id);
    setEventTitle(evt.title);
    setEventDate(evt.date);
    setEventStartTime(evt.start_time ? evt.start_time.slice(0, 5) : '');
    setEventEndTime(evt.end_time ? evt.end_time.slice(0, 5) : '');
    setEventLocation(evt.location || '');
    setEventDescription(evt.description || '');
    setIsEventModalOpen(true);
  };

  const handleSaveEvent = async () => {
    if (!eventTitle.trim() || !eventDate) return;
    try {
      const payload = {
        title: eventTitle,
        date: eventDate,
        start_time: eventStartTime || null,
        end_time: eventEndTime || null,
        location: eventLocation,
        description: eventDescription,
      };

      if (editingEventId) {
        await api.updateEvent(editingEventId, payload);
      } else {
        await api.createEvent(payload);
      }
      setIsEventModalOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!confirm('Delete this event?')) return;
    try {
      await api.deleteEvent(id);
      setEvents(events.filter((e) => e.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  // VOTD handlers
  const handleOpenNewVotd = () => {
    setVotdDate(new Date().toISOString().split('T')[0]);
    setVotdBook('John');
    setVotdChapter(1);
    setVotdVerseStart(1);
    setVotdVerseEnd(1);
    setVotdVersion('KJV');
    setVotdText('');
    setVotdMessage('');
    setIsVotdModalOpen(true);
  };

  const handleSaveVotd = async () => {
    if (!votdDate || !votdBook) return;
    try {
      await api.createVOTD({
        date: votdDate,
        book: votdBook,
        chapter: votdChapter,
        verse_start: votdVerseStart,
        verse_end: votdVerseEnd,
        bible_version: votdVersion,
        verse_text: votdText,
        message: votdMessage,
      });
      setIsVotdModalOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteVotd = async (id: string) => {
    if (!confirm('Delete this Verse of the Day entry?')) return;
    try {
      await api.deleteVOTD(id);
      setVotds(votds.filter((v) => v.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  if (!user || !user.is_staff) {
    return (
      <div className="max-w-md mx-auto py-24 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold">Admin Privileges Required</h2>
        <p className="text-xs text-stone-500">You must be logged in as an administrator to view this page.</p>
        <button
          onClick={() => router.push('/profile')}
          className="px-4 py-2 bg-amber-500 text-white rounded-xl text-xs font-semibold"
        >
          Sign in as Admin
        </button>
      </div>
    );
  }

  return (
    <>
      <PageLayout
        title="Admin Portal"
        items={[{ label: 'Admin' }]}
        actions={
          activeTab === 'events' ? (
            <button
              onClick={handleOpenNewEvent}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Event</span>
            </button>
          ) : (
            <button
              onClick={handleOpenNewVotd}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Schedule Verse</span>
            </button>
          )
        }
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-8 py-8 space-y-6">
        {/* Tab switchers */}
        <div className="flex items-center space-x-2 border-b border-stone-200 dark:border-stone-800 pb-3">
          <button
            type="button"
            onClick={() => setActiveTab('events')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'events'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Manage Events ({events.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('votd')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'votd'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Verse of the Day ({votds.length})</span>
          </button>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="py-20 text-center text-sm text-stone-400">Loading admin data...</div>
        ) : activeTab === 'events' ? (
          <div className="space-y-4">
            {events.map((evt) => (
              <div
                key={evt.id}
                className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 flex items-center justify-between"
              >
                <div>
                  <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100">{evt.title}</h4>
                  <div className="flex items-center gap-3 text-xs text-stone-400 mt-1">
                    <span>{evt.date}</span>
                    {evt.location && <span>• {evt.location}</span>}
                  </div>
                </div>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => handleOpenEditEvent(evt)}
                    className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteEvent(evt.id)}
                    className="p-1.5 rounded-lg text-stone-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {votds.map((v) => (
              <div
                key={v.id}
                className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 flex items-center justify-between"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-stone-900 dark:text-stone-100">{v.reference}</span>
                    <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/30">
                      {v.date}
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 line-clamp-1 italic font-serif">“{v.verse_text}”</p>
                </div>

                <button
                  onClick={() => handleDeleteVotd(v.id)}
                  className="p-1.5 rounded-lg text-stone-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Event Modal */}
      <Modal
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
        title={editingEventId ? 'Edit Event' : 'Add New Event'}
      >
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Event Title..."
            value={eventTitle}
            onChange={(e) => setEventTitle(e.target.value)}
            className="w-full px-3 py-2 rounded-xl text-sm border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900"
          />
          <div className="grid grid-cols-3 gap-2">
            <input
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-xs border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900"
            />
            <input
              type="time"
              value={eventStartTime}
              onChange={(e) => setEventStartTime(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-xs border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900"
            />
            <input
              type="time"
              value={eventEndTime}
              onChange={(e) => setEventEndTime(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-xs border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900"
            />
          </div>
          <input
            type="text"
            placeholder="Location / Meeting link..."
            value={eventLocation}
            onChange={(e) => setEventLocation(e.target.value)}
            className="w-full px-3 py-2 rounded-xl text-sm border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900"
          />
          <textarea
            rows={3}
            placeholder="Event description..."
            value={eventDescription}
            onChange={(e) => setEventDescription(e.target.value)}
            className="w-full p-3 rounded-xl text-sm border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 font-serif"
          />
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setIsEventModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold border border-stone-200 dark:border-stone-700"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveEvent}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white"
            >
              Save Event
            </button>
          </div>
        </div>
      </Modal>

      {/* VOTD Modal */}
      <Modal isOpen={isVotdModalOpen} onClose={() => setIsVotdModalOpen(false)} title="Schedule Verse of the Day">
        <div className="space-y-4">
          <input
            type="date"
            value={votdDate}
            onChange={(e) => setVotdDate(e.target.value)}
            className="w-full px-3 py-2 rounded-xl text-xs border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900"
          />
          <div className="grid grid-cols-4 gap-2">
            <input
              type="text"
              placeholder="Book"
              value={votdBook}
              onChange={(e) => setVotdBook(e.target.value)}
              className="px-3 py-2 rounded-xl text-xs border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900"
            />
            <input
              type="number"
              min={1}
              placeholder="Ch."
              value={votdChapter}
              onChange={(e) => setVotdChapter(parseInt(e.target.value || '1', 10))}
              className="px-3 py-2 rounded-xl text-xs border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900"
            />
            <input
              type="number"
              min={1}
              placeholder="Start"
              value={votdVerseStart}
              onChange={(e) => setVotdVerseStart(parseInt(e.target.value || '1', 10))}
              className="px-3 py-2 rounded-xl text-xs border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900"
            />
            <input
              type="number"
              min={1}
              placeholder="End"
              value={votdVerseEnd}
              onChange={(e) => setVotdVerseEnd(parseInt(e.target.value || '1', 10))}
              className="px-3 py-2 rounded-xl text-xs border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900"
            />
          </div>
          <textarea
            rows={3}
            placeholder="Exact verse text..."
            value={votdText}
            onChange={(e) => setVotdText(e.target.value)}
            className="w-full p-3 rounded-xl text-xs border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 font-serif"
          />
          <textarea
            rows={2}
            placeholder="Inspirational message..."
            value={votdMessage}
            onChange={(e) => setVotdMessage(e.target.value)}
            className="w-full p-3 rounded-xl text-xs border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900"
          />
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setIsVotdModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold border border-stone-200 dark:border-stone-700"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveVotd}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white"
            >
              Save Verse
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
