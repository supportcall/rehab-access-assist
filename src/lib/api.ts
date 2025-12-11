/**
 * PHP Backend API Service Layer
 * Replaces Supabase client calls for production on cPanel VPS
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

// Token storage keys
const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_KEY = 'auth_user';

// Types
export interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  system_id?: string;
  roles: string[];
}

export interface AuthSession {
  user: User;
  access_token: string;
  refresh_token: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Auth state change listeners
type AuthListener = (event: string, session: AuthSession | null) => void;
const authListeners: AuthListener[] = [];

// ============= Token Management =============

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setTokens(accessToken: string, refreshToken: string): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function clearTokens(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getStoredUser(): User | null {
  const stored = localStorage.getItem(USER_KEY);
  return stored ? JSON.parse(stored) : null;
}

export function setStoredUser(user: User): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

// ============= API Request Helper =============

async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = getAccessToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    // Handle token expired - try refresh
    if (response.status === 401 && getRefreshToken()) {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        // Retry the original request with new token
        (headers as Record<string, string>)['Authorization'] = `Bearer ${getAccessToken()}`;
        const retryResponse = await fetch(`${API_BASE_URL}${endpoint}`, {
          ...options,
          headers,
        });
        return await retryResponse.json();
      } else {
        // Refresh failed, clear auth
        clearTokens();
        notifyAuthListeners('SIGNED_OUT', null);
      }
    }

    return data;
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Network error',
    };
  }
}

async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    const data = await response.json();

    if (data.success && data.data?.access_token) {
      setTokens(data.data.access_token, data.data.refresh_token);
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

// ============= Auth Listeners =============

function notifyAuthListeners(event: string, session: AuthSession | null): void {
  authListeners.forEach(listener => listener(event, session));
}

// ============= Auth API =============

export const auth = {
  async signUp(email: string, password: string, metadata?: { first_name?: string; last_name?: string }) {
    const response = await apiRequest<AuthSession>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, ...metadata }),
    });

    if (response.success && response.data) {
      setTokens(response.data.access_token, response.data.refresh_token);
      setStoredUser(response.data.user);
      notifyAuthListeners('SIGNED_IN', response.data);
    }

    return response;
  },

  async signIn(email: string, password: string) {
    const response = await apiRequest<AuthSession>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (response.success && response.data) {
      setTokens(response.data.access_token, response.data.refresh_token);
      setStoredUser(response.data.user);
      notifyAuthListeners('SIGNED_IN', response.data);
    }

    return response;
  },

  async signOut() {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      await apiRequest('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
    }
    clearTokens();
    notifyAuthListeners('SIGNED_OUT', null);
    return { success: true };
  },

  async getSession(): Promise<{ data: { session: AuthSession | null } }> {
    const token = getAccessToken();
    const user = getStoredUser();
    
    if (!token || !user) {
      return { data: { session: null } };
    }

    // Validate token with backend
    const response = await apiRequest<User>('/auth/me');
    
    if (response.success && response.data) {
      setStoredUser(response.data);
      return {
        data: {
          session: {
            user: response.data,
            access_token: token,
            refresh_token: getRefreshToken() || '',
          },
        },
      };
    }

    // Token invalid
    clearTokens();
    return { data: { session: null } };
  },

  async getUser(): Promise<{ data: { user: User | null } }> {
    const response = await apiRequest<User>('/auth/me');
    
    if (response.success && response.data) {
      setStoredUser(response.data);
      return { data: { user: response.data } };
    }

    return { data: { user: null } };
  },

  onAuthStateChange(callback: AuthListener): { data: { subscription: { unsubscribe: () => void } } } {
    authListeners.push(callback);
    
    // Check current session and notify
    const user = getStoredUser();
    const token = getAccessToken();
    if (user && token) {
      callback('INITIAL_SESSION', {
        user,
        access_token: token,
        refresh_token: getRefreshToken() || '',
      });
    }

    return {
      data: {
        subscription: {
          unsubscribe: () => {
            const index = authListeners.indexOf(callback);
            if (index > -1) {
              authListeners.splice(index, 1);
            }
          },
        },
      },
    };
  },
};

// ============= Database API =============

type QueryBuilder<T = any> = {
  select: (columns?: string) => QueryBuilder<T>;
  insert: (data: Partial<T> | Partial<T>[]) => QueryBuilder<T>;
  update: (data: Partial<T>) => QueryBuilder<T>;
  delete: () => QueryBuilder<T>;
  eq: (column: string, value: any) => QueryBuilder<T>;
  neq: (column: string, value: any) => QueryBuilder<T>;
  order: (column: string, options?: { ascending?: boolean }) => QueryBuilder<T>;
  limit: (count: number) => QueryBuilder<T>;
  single: () => Promise<{ data: T | null; error: any; count?: number }>;
  maybeSingle: () => Promise<{ data: T | null; error: any; count?: number }>;
  then: (resolve: (result: { data: T[] | null; error: any; count?: number }) => void) => void;
};

function createQueryBuilder<T = any>(table: string): QueryBuilder<T> {
  let operation: 'select' | 'insert' | 'update' | 'delete' = 'select';
  let columns = '*';
  let filters: Record<string, any> = {};
  let insertData: any = null;
  let updateData: any = null;
  let orderBy: { column: string; ascending: boolean } | null = null;
  let limitCount: number | null = null;
  let countMode = false;
  let headMode = false;

  const execute = async (): Promise<{ data: any; error: any; count?: number }> => {
    let endpoint = '';
    let method = 'GET';
    let body: any = null;

    // Build endpoint based on table
    const tableEndpoints: Record<string, string> = {
      profiles: '/profiles/me',
      clients: '/clients',
      assessments: '/assessments',
      user_roles: '/auth/me', // Roles come from auth
      referrals: '/referrals',
      ot_signup_requests: '/admin/signup-requests',
      system_settings: '/admin/settings',
      environmental_areas: '/assessments/environmental-areas',
      clinical_assessment: '/assessments/clinical',
      pre_visit_details: '/assessments/pre-visit',
      stakeholders: '/assessments/stakeholders',
      funding_pathway: '/assessments/funding',
      at_audit: '/assessments/at-audit',
      site_survey: '/assessments/site-survey',
      structural_reconnaissance: '/assessments/structural',
      measurements: '/assessments/measurements',
      risks_controls: '/assessments/risks',
      options_analysis: '/assessments/options',
      compliance_checklist: '/assessments/compliance',
      builder_collaboration: '/assessments/builder',
      deliverables: '/assessments/deliverables',
      technical_drawings: '/assessments/technical-drawings',
    };

    endpoint = tableEndpoints[table] || `/${table}`;

    // Handle operations
    switch (operation) {
      case 'select':
        method = 'GET';
        // Add filters as query params
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          params.append(key, String(value));
        });
        if (columns !== '*') params.append('select', columns);
        if (orderBy) {
          params.append('order_by', orderBy.column);
          params.append('order_dir', orderBy.ascending ? 'asc' : 'desc');
        }
        if (limitCount) params.append('limit', String(limitCount));
        if (countMode) params.append('count', 'true');
        if (headMode) params.append('head', 'true');
        
        const queryString = params.toString();
        if (queryString) endpoint += `?${queryString}`;
        break;

      case 'insert':
        method = 'POST';
        body = JSON.stringify(insertData);
        break;

      case 'update':
        method = 'PUT';
        if (filters.id) {
          endpoint += `/${filters.id}`;
        } else if (filters.assessment_id) {
          endpoint += `?assessment_id=${filters.assessment_id}`;
        }
        body = JSON.stringify(updateData);
        break;

      case 'delete':
        method = 'DELETE';
        if (filters.id) {
          endpoint += `/${filters.id}`;
        }
        break;
    }

    const response = await apiRequest(endpoint, { method, body });

    if (response.success) {
      return { 
        data: response.data, 
        error: null, 
        count: response.data?.count ?? (Array.isArray(response.data) ? response.data.length : undefined)
      };
    }

    return { data: null, error: { message: response.error || response.message } };
  };

  const builder: QueryBuilder<T> = {
    select(cols = '*') {
      operation = 'select';
      columns = cols;
      // Check for count mode
      if (cols.includes('count')) {
        countMode = true;
      }
      if (cols.includes('head: true')) {
        headMode = true;
      }
      return builder;
    },
    insert(data) {
      operation = 'insert';
      insertData = data;
      return builder;
    },
    update(data) {
      operation = 'update';
      updateData = data;
      return builder;
    },
    delete() {
      operation = 'delete';
      return builder;
    },
    eq(column, value) {
      filters[column] = value;
      return builder;
    },
    neq(column, value) {
      filters[`${column}_neq`] = value;
      return builder;
    },
    order(column, options = { ascending: true }) {
      orderBy = { column, ascending: options.ascending ?? true };
      return builder;
    },
    limit(count) {
      limitCount = count;
      return builder;
    },
    async single() {
      const result = await execute();
      if (Array.isArray(result.data)) {
        result.data = result.data[0] || null;
      }
      return result;
    },
    async maybeSingle() {
      const result = await execute();
      if (Array.isArray(result.data)) {
        result.data = result.data[0] || null;
      }
      return result;
    },
    then(resolve) {
      execute().then(resolve);
    },
  };

  return builder;
}

export function from<T = any>(table: string): QueryBuilder<T> {
  return createQueryBuilder<T>(table);
}

// ============= RPC Functions =============

export async function rpc(
  functionName: string,
  params?: Record<string, any>
): Promise<{ data: any; error: any }> {
  let endpoint = '';
  let method = 'POST';
  let body: any = null;

  switch (functionName) {
    case 'approve_ot_signup':
      endpoint = `/admin/signup-requests/${params?.request_id}/approve`;
      break;
    case 'reject_ot_signup':
      endpoint = `/admin/signup-requests/${params?.request_id}/reject`;
      body = JSON.stringify({ reason: params?.reason });
      break;
    case 'lookup_ot_by_system_id':
      endpoint = `/profiles/lookup?system_id=${encodeURIComponent(params?.p_system_id || '')}`;
      method = 'GET';
      break;
    default:
      return { data: null, error: { message: `Unknown function: ${functionName}` } };
  }

  const response = await apiRequest(endpoint, { method, body });

  if (response.success) {
    return { data: response.data, error: null };
  }

  return { data: null, error: { message: response.error || response.message } };
}

// ============= Storage API =============

export const storage = {
  from(bucket: string) {
    return {
      async upload(path: string, file: File): Promise<{ data: { path: string } | null; error: any }> {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('bucket', bucket);
        formData.append('path', path);

        try {
          const token = getAccessToken();
          const response = await fetch(`${API_BASE_URL}/uploads`, {
            method: 'POST',
            headers: token ? { 'Authorization': `Bearer ${token}` } : {},
            body: formData,
          });

          const data = await response.json();

          if (data.success) {
            return { data: { path: data.data.path }, error: null };
          }

          return { data: null, error: { message: data.error || data.message } };
        } catch (error: any) {
          return { data: null, error: { message: error.message } };
        }
      },

      getPublicUrl(path: string): { data: { publicUrl: string } } {
        const baseUrl = import.meta.env.VITE_STORAGE_URL || window.location.origin;
        return {
          data: {
            publicUrl: `${baseUrl}/uploads/${bucket}/${path}`,
          },
        };
      },
    };
  },
};

// ============= Combined API Export (Supabase-compatible interface) =============

export const api = {
  auth,
  from,
  rpc,
  storage,
};

export default api;
