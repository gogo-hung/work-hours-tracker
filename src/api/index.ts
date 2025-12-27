// API 服務 - 連接後端伺服器
// 在生產環境使用相對路徑，開發環境使用 localhost
const API_BASE = import.meta.env.PROD ? '/api' : 'http://localhost:3001/api';

// 通用請求函數
async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: '請求失敗' }));
    throw new Error(error.error || '請求失敗');
  }

  return response.json();
}

// ==================== 認證 API ====================
export const authAPI = {
  register: (data: {
    email: string;
    password: string;
    name: string;
    role?: 'manager' | 'employee';
  }) => request('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  login: (data: { email: string; password: string }) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// ==================== 用戶 API ====================
export const userAPI = {
  get: (id: string) => request(`/users/${id}`),

  update: (id: string, data: Partial<{
    name: string;
    avatar: string | null;
    teamId: string | null;
  }>) => request(`/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
};

// ==================== 團隊 API ====================
export const teamAPI = {
  create: (data: { name: string; managerId: string }) =>
    request('/teams', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  get: (id: string) => request(`/teams/${id}`),

  join: (data: { inviteCode: string; userId: string }) =>
    request('/teams/join', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getEmployees: (teamId: string) => request(`/teams/${teamId}/employees`),
};

// ==================== 工作 API ====================
export const jobAPI = {
  getByUser: (userId: string) => request(`/jobs/user/${userId}`),

  create: (data: {
    userId: string;
    name: string;
    hourlyRate: number;
    maxHoursPerDay?: number;
  }) => request('/jobs', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  update: (id: string, data: Partial<{
    name: string;
    hourlyRate: number;
    maxHoursPerDay: number;
  }>) => request(`/jobs/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  delete: (id: string) => request(`/jobs/${id}`, { method: 'DELETE' }),
};

// ==================== 打卡記錄 API ====================
export const recordAPI = {
  getByUser: (userId: string) => request(`/records/user/${userId}`),

  clockIn: (data: {
    userId: string;
    jobId: string;
    clockIn: string;
    clockInPhoto?: string | null;
  }) => request('/records', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  clockOut: (id: string, data: {
    clockOut: string;
    clockOutPhoto?: string | null;
  }) => request(`/records/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
};

// ==================== 排班 API ====================
export const scheduleAPI = {
  getByUser: (userId: string) => request(`/schedules/user/${userId}`),

  getByTeam: (teamId: string) => request(`/schedules/team/${teamId}`),

  create: (data: {
    userId: string;
    date: string;
    startTime: string;
    endTime: string;
    note?: string;
    createdBy?: string;
  }) => request('/schedules', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  update: (id: string, data: Partial<{
    startTime: string;
    endTime: string;
    note: string;
  }>) => request(`/schedules/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  delete: (id: string) => request(`/schedules/${id}`, { method: 'DELETE' }),
};

export default {
  auth: authAPI,
  user: userAPI,
  team: teamAPI,
  job: jobAPI,
  record: recordAPI,
  schedule: scheduleAPI,
};
