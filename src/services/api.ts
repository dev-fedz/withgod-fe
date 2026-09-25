const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

class ApiClient {
  private getTokens(): { access: string | null; refresh: string | null } {
    if (typeof window === 'undefined') return { access: null, refresh: null };
    return {
      access: localStorage.getItem('withgod_access_token'),
      refresh: localStorage.getItem('withgod_refresh_token'),
    };
  }

  public setTokens(access: string, refresh: string) {
    if (typeof window === 'undefined') return;
    localStorage.setItem('withgod_access_token', access);
    localStorage.setItem('withgod_refresh_token', refresh);
  }

  public clearTokens() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('withgod_access_token');
    localStorage.removeItem('withgod_refresh_token');
  }

  public getAccessToken(): string | null {
    return this.getTokens().access;
  }

  public async request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const { access } = this.getTokens();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (access) {
      headers['Authorization'] = `Bearer ${access}`;
    }

    const url = `${API_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

    let response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status === 401 && access) {
      // Attempt refresh
      const refreshed = await this.refreshToken();
      if (refreshed) {
        const newTokens = this.getTokens();
        if (newTokens.access) {
          headers['Authorization'] = `Bearer ${newTokens.access}`;
          response = await fetch(url, { ...options, headers });
        }
      } else {
        this.clearTokens();
      }
    }

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      let errorMsg = errorBody.error?.detail || errorBody.detail || errorBody.error;
      if (!errorMsg && typeof errorBody === 'object' && errorBody !== null) {
        const messages = Object.entries(errorBody)
          .map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(', ') : val}`)
          .join(' | ');
        if (messages) errorMsg = messages;
      }
      errorMsg = errorMsg || response.statusText || 'An error occurred';
      throw new Error(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg));
    }

    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  private async refreshToken(): Promise<boolean> {
    const { refresh } = this.getTokens();
    if (!refresh) return false;

    try {
      const res = await fetch(`${API_URL}/auth/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.access) {
          localStorage.setItem('withgod_access_token', data.access);
          if (data.refresh) localStorage.setItem('withgod_refresh_token', data.refresh);
          return true;
        }
      }
    } catch {
      return false;
    }
    return false;
  }

  // Auth APIs
  login(data: { email: string; password: string }) {
    return this.request('/auth/login/', { method: 'POST', body: JSON.stringify(data) });
  }

  register(data: { email: string; password: string; first_name?: string; last_name?: string }) {
    return this.request('/auth/register/', { method: 'POST', body: JSON.stringify(data) });
  }

  getMe() {
    return this.request('/users/me/');
  }

  updateProfile(data: any) {
    return this.request('/users/me/', { method: 'PATCH', body: JSON.stringify(data) });
  }

  getPreferences() {
    return this.request('/users/preferences/');
  }

  updatePreferences(data: any) {
    return this.request('/users/preferences/', { method: 'PATCH', body: JSON.stringify(data) });
  }

  // User Management APIs
  getUserAccounts(params?: { search?: string; role_id?: string; is_active?: boolean }) {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.append('search', params.search);
    if (params?.role_id) searchParams.append('role_id', params.role_id);
    if (params?.is_active !== undefined) searchParams.append('is_active', String(params.is_active));
    const qs = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return this.request(`/users/accounts/${qs}`);
  }

  getUserAccount(userId: string) {
    return this.request(`/users/accounts/${userId}/`);
  }

  createUserAccount(data: any) {
    return this.request('/users/accounts/', { method: 'POST', body: JSON.stringify(data) });
  }

  updateUserAccount(userId: string, data: any) {
    return this.request(`/users/accounts/${userId}/`, { method: 'PATCH', body: JSON.stringify(data) });
  }

  deleteUserAccount(userId: string) {
    return this.request(`/users/accounts/${userId}/`, { method: 'DELETE' });
  }

  getUserRoles(params?: { search?: string }) {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.append('search', params.search);
    const qs = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return this.request(`/users/roles/${qs}`);
  }

  getUserRole(roleId: string) {
    return this.request(`/users/roles/${roleId}/`);
  }

  createUserRole(data: any) {
    return this.request('/users/roles/', { method: 'POST', body: JSON.stringify(data) });
  }

  updateUserRole(roleId: string, data: any) {
    return this.request(`/users/roles/${roleId}/`, { method: 'PATCH', body: JSON.stringify(data) });
  }

  deleteUserRole(roleId: string) {
    return this.request(`/users/roles/${roleId}/`, { method: 'DELETE' });
  }

  getModules() {
    return this.request('/users/modules/');
  }

  // Bible APIs
  getBibleVersions() {
    return this.request('/bible/versions/');
  }

  getAvailableBibleVersions() {
    return this.request('/bible/versions/available/');
  }

  installBibleVersion(versionId: string) {
    return this.request(`/bible/versions/${versionId}/install/`, {
      method: 'POST',
    });
  }

  getBibleBooks(versionId: string) {
    return this.request(`/bible/${versionId}/books/`);
  }

  getBibleChapter(versionId: string, bookName: string, chapterNumber: number) {
    return this.request(`/bible/${versionId}/${encodeURIComponent(bookName)}/${chapterNumber}/`);
  }

  downloadBibleChapter(versionId: string, bookName: string, chapterNumber: number) {
    return this.request(`/bible/${versionId}/${encodeURIComponent(bookName)}/${chapterNumber}/download/`, {
      method: 'POST'
    });
  }

  compareVerses(versions: string[], book: string, chapter: number, verse: number | number[]) {
    const versionsParam = versions.join(',');
    const versesParam = Array.isArray(verse) ? verse.join(',') : verse;
    return this.request(`/bible/compare/?versions=${versionsParam}&book=${encodeURIComponent(book)}&chapter=${chapter}&verses=${versesParam}`);
  }

  getHighlights(book?: string, chapter?: number) {
    const params = new URLSearchParams();
    if (book) params.append('book', book);
    if (chapter) params.append('chapter', chapter.toString());
    return this.request(`/bible/highlights/?${params.toString()}`);
  }

  createHighlight(data: { version_id: string; book_name: string; chapter: number; verse_start: number; verse_end: number; color: string }) {
    return this.request('/bible/highlights/', { method: 'POST', body: JSON.stringify(data) });
  }

  deleteHighlight(id: string) {
    return this.request(`/bible/highlights/${id}/`, { method: 'DELETE' });
  }

  // User Insights (Personal study insights & reflections for verses)
  getUserInsights(book?: string, chapter?: number) {
    const params = new URLSearchParams();
    if (book) params.append('book', book);
    if (chapter) params.append('chapter', chapter.toString());
    return this.request(`/bible/insights/?${params.toString()}`);
  }

  createUserInsight(data: { version_id: string; book_name: string; chapter: number; verse_start: number; verse_end: number; title?: string; content: string }) {
    return this.request('/bible/insights/', { method: 'POST', body: JSON.stringify(data) });
  }

  updateUserInsight(id: string, data: { title?: string; content?: string; is_private?: boolean }) {
    return this.request(`/bible/insights/${id}/`, { method: 'PATCH', body: JSON.stringify(data) });
  }

  deleteUserInsight(id: string) {
    return this.request(`/bible/insights/${id}/`, { method: 'DELETE' });
  }

  // Aliases for backwards compatibility
  getNotes(book?: string, chapter?: number) {
    return this.getUserInsights(book, chapter);
  }

  createNote(data: any) {
    return this.createUserInsight(data);
  }

  updateNote(id: string, data: any) {
    return this.updateUserInsight(id, data);
  }

  deleteNote(id: string) {
    return this.deleteUserInsight(id);
  }

  getReadingProgress() {
    return this.request('/bible/progress/');
  }

  updateReadingProgress(data: { version_id: string; book_name: string; chapter: number; verse?: number }) {
    return this.request('/bible/progress/', { method: 'POST', body: JSON.stringify(data) });
  }

  // Devotions APIs
  getDevotions(search?: string, status?: string) {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (status) params.append('status', status);
    return this.request(`/devotions/?${params.toString()}`);
  }

  getDevotion(id: string) {
    return this.request(`/devotions/${id}/`);
  }

  createDevotion(data: any) {
    return this.request('/devotions/', { method: 'POST', body: JSON.stringify(data) });
  }

  updateDevotion(id: string, data: any) {
    return this.request(`/devotions/${id}/`, { method: 'PATCH', body: JSON.stringify(data) });
  }

  deleteDevotion(id: string) {
    return this.request(`/devotions/${id}/`, { method: 'DELETE' });
  }

  // Events APIs
  getEvents(params?: { start_date?: string; end_date?: string; year?: number; month?: number; search?: string }) {
    const searchParams = new URLSearchParams();
    if (params?.start_date) searchParams.append('start_date', params.start_date);
    if (params?.end_date) searchParams.append('end_date', params.end_date);
    if (params?.year) searchParams.append('year', params.year.toString());
    if (params?.month) searchParams.append('month', params.month.toString());
    if (params?.search) searchParams.append('search', params.search);
    const qs = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return this.request(`/events/${qs}`);
  }

  getEvent(id: string) {
    return this.request(`/events/${id}/`);
  }

  getUpcomingEvents() {
    return this.request('/events/upcoming/');
  }

  getAdminEvents() {
    return this.request('/events/admin/');
  }

  createEvent(data: any) {
    return this.request('/events/admin/', { method: 'POST', body: JSON.stringify(data) });
  }

  updateEvent(id: string, data: any) {
    return this.request(`/events/admin/${id}/`, { method: 'PATCH', body: JSON.stringify(data) });
  }

  deleteEvent(id: string) {
    return this.request(`/events/admin/${id}/`, { method: 'DELETE' });
  }

  getEventNotifications() {
    return this.request('/events/notifications/');
  }

  markNotificationRead(notificationId: string) {
    return this.request(`/events/notifications/${notificationId}/read/`, { method: 'POST' });
  }

  markAllNotificationsRead() {
    return this.request('/events/notifications/read-all/', { method: 'POST' });
  }

  // Verse of the Day APIs
  getTodayVOTD() {
    return this.request('/verse-of-day/today/');
  }

  getAdminVOTD() {
    return this.request('/verse-of-day/admin/');
  }

  createVOTD(data: any) {
    return this.request('/verse-of-day/admin/', { method: 'POST', body: JSON.stringify(data) });
  }

  deleteVOTD(id: string) {
    return this.request(`/verse-of-day/admin/${id}/`, { method: 'DELETE' });
  }

  // Insights APIs
  getInsights(book: string, chapter: number, verse?: number) {
    const params = new URLSearchParams({ book, chapter: chapter.toString() });
    if (verse) params.append('verse', verse.toString());
    return this.request(`/insights/?${params.toString()}`);
  }

  getAdminInsights() {
    return this.request('/insights/admin/');
  }

  createInsight(data: any) {
    return this.request('/insights/admin/', { method: 'POST', body: JSON.stringify(data) });
  }

  deleteInsight(id: string) {
    return this.request(`/insights/admin/${id}/`, { method: 'DELETE' });
  }

  // Hebrew Learning APIs
  getHebrewAlphabet() {
    return this.request('/hebrew/alphabet/');
  }

  getHebrewWords(category?: string, search?: string) {
    const params = new URLSearchParams();
    if (category && category !== 'all') params.append('category', category);
    if (search) params.append('search', search);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return this.request(`/hebrew/words/${qs}`);
  }

  getHebrewLessons() {
    return this.request('/hebrew/lessons/');
  }

  getHebrewLessonDetail(slug: string) {
    return this.request(`/hebrew/lessons/${slug}/`);
  }

  getHebrewSentences() {
    return this.request('/hebrew/sentences/');
  }

  getHebrewProgress() {
    return this.request('/hebrew/progress/');
  }

  updateHebrewProgress(data: { lesson_slug?: string; word_id?: string; quiz_score?: number }) {
    return this.request('/hebrew/progress/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Torah APIs
  getTorahThisWeek() {
    return this.request('/torah/this-week/');
  }

  getTorahPortions(book?: string) {
    const qs = book ? `?book=${encodeURIComponent(book)}` : '';
    return this.request(`/torah/portions/${qs}`);
  }

  getTorahPortion(portionId: string) {
    return this.request(`/torah/portions/${encodeURIComponent(portionId)}/`);
  }

  getTorahReadings(portionId: string, versionId: string = 'KJV') {
    return this.request(`/torah/portions/${encodeURIComponent(portionId)}/read/?version=${encodeURIComponent(versionId)}`);
  }
}

export const api = new ApiClient();
