const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// 中間件
app.use(cors());
app.use(express.json({ limit: '10mb' })); // 支援較大的 base64 圖片

// 提供靜態檔案 (前端 build 後的檔案)
app.use(express.static(path.join(__dirname, '../dist')));

// 資料檔案路徑
const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const TEAMS_FILE = path.join(DATA_DIR, 'teams.json');
const JOBS_FILE = path.join(DATA_DIR, 'jobs.json');
const RECORDS_FILE = path.join(DATA_DIR, 'records.json');
const SCHEDULES_FILE = path.join(DATA_DIR, 'schedules.json');

// 確保資料目錄存在
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// 讀取資料
function readData(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
    return [];
  }
}

// 寫入資料
function writeData(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error(`Error writing ${filePath}:`, error);
    return false;
  }
}

// 生成 6 位邀請碼
function generateInviteCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// ==================== 管理後台首頁 ====================
app.get('/', (req, res) => {
  const users = readData(USERS_FILE);
  const teams = readData(TEAMS_FILE);
  const jobs = readData(JOBS_FILE);
  const records = readData(RECORDS_FILE);
  const schedules = readData(SCHEDULES_FILE);
  
  const html = `
<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>工時計算 - 管理後台</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; padding: 20px; }
    .container { max-width: 1200px; margin: 0 auto; }
    h1 { color: #333; margin-bottom: 20px; }
    .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 30px; }
    .stat-card { background: white; padding: 20px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .stat-card h3 { color: #666; font-size: 14px; margin-bottom: 8px; }
    .stat-card .number { font-size: 32px; font-weight: bold; color: #6366f1; }
    .section { background: white; border-radius: 12px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .section h2 { color: #333; margin-bottom: 16px; border-bottom: 2px solid #6366f1; padding-bottom: 8px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #eee; }
    th { background: #f9fafb; font-weight: 600; color: #666; }
    tr:hover { background: #f9fafb; }
    .badge { padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; }
    .badge-manager { background: #fef3c7; color: #d97706; }
    .badge-employee { background: #dbeafe; color: #2563eb; }
    .badge-premium { background: #dcfce7; color: #16a34a; }
    .btn { padding: 8px 16px; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; }
    .btn-primary { background: #6366f1; color: white; }
    .btn-success { background: #22c55e; color: white; }
    .btn-danger { background: #ef4444; color: white; }
    .btn:hover { opacity: 0.9; }
    .actions { display: flex; gap: 8px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🕐 工時計算 - 管理後台</h1>
    
    <div class="stats">
      <div class="stat-card">
        <h3>👥 總用戶數</h3>
        <div class="number">${users.length}</div>
      </div>
      <div class="stat-card">
        <h3>🏢 團隊數量</h3>
        <div class="number">${teams.length}</div>
      </div>
      <div class="stat-card">
        <h3>💼 工作數量</h3>
        <div class="number">${jobs.length}</div>
      </div>
      <div class="stat-card">
        <h3>📋 打卡記錄</h3>
        <div class="number">${records.length}</div>
      </div>
    </div>
    
    <div class="section">
      <h2>👥 用戶列表</h2>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>名稱</th>
            <th>Email</th>
            <th>角色</th>
            <th>會員狀態</th>
            <th>團隊</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          ${users.map(u => {
            const team = teams.find(t => t.id === u.teamId);
            const displayName = (u.name || u.email || '').replace(/"/g, '&quot;');
            return `
            <tr>
              <td><code>${u.id.substring(0, 8)}...</code></td>
              <td>${u.name || u.username || '-'}</td>
              <td>${u.email}</td>
              <td><span class="badge badge-${u.role}">${u.role === 'manager' ? '主管' : '員工'}</span></td>
              <td>${u.isPremium ? '<span class="badge badge-premium">Premium</span>' : '免費版'}</td>
              <td>${team ? team.name : '-'}</td>
              <td class="actions">
                <button class="btn btn-success" onclick="togglePremium('${u.id}', ${!u.isPremium})">
                  ${u.isPremium ? '取消 Premium' : '升級 Premium'}
                </button>
                <button class="btn btn-danger" onclick="deleteUser('${u.id}', &quot;${displayName}&quot;)">
                  刪除
                </button>
              </td>
            </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
    
    <div class="section">
      <h2>🏢 團隊列表</h2>
      <table>
        <thead>
          <tr>
            <th>團隊名稱</th>
            <th>邀請碼</th>
            <th>管理者</th>
            <th>成員數</th>
            <th>建立時間</th>
          </tr>
        </thead>
        <tbody>
          ${teams.map(t => {
            const manager = users.find(u => u.id === t.managerId);
            const memberCount = users.filter(u => u.teamId === t.id).length;
            return `
            <tr>
              <td><strong>${t.name}</strong></td>
              <td><code style="background:#f3f4f6;padding:4px 8px;border-radius:4px;font-size:16px;letter-spacing:2px;">${t.inviteCode}</code></td>
              <td>${manager ? (manager.name || manager.email) : '-'}</td>
              <td>${memberCount} 人</td>
              <td>${new Date(t.createdAt).toLocaleDateString('zh-TW')}</td>
            </tr>
            `;
          }).join('')}
          ${teams.length === 0 ? '<tr><td colspan="5" style="text-align:center;color:#999;">尚無團隊</td></tr>' : ''}
        </tbody>
      </table>
    </div>
  </div>
  
  <script>
    async function togglePremium(userId, isPremium) {
      try {
        const res = await fetch('/api/users/' + userId, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isPremium })
        });
        if (res.ok) {
          location.reload();
        } else {
          alert('操作失敗');
        }
      } catch (e) {
        alert('操作失敗: ' + e.message);
      }
    }
    
    async function deleteUser(userId, userName) {
      if (!confirm('確定要刪除用戶「' + userName + '」嗎？\n\n此操作無法復原！')) {
        return;
      }
      try {
        const res = await fetch('/api/users/' + userId, {
          method: 'DELETE'
        });
        if (res.ok) {
          location.reload();
        } else {
          const data = await res.json();
          alert('刪除失敗: ' + (data.error || '未知錯誤'));
        }
      } catch (e) {
        alert('刪除失敗: ' + e.message);
      }
    }
  </script>
</body>
</html>
  `;
  
  res.send(html);
});

// ==================== 用戶 API ====================

// 註冊
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name, role } = req.body;
    
    if (!email || !password || !name) {
      return res.status(400).json({ error: '請填寫所有必要欄位' });
    }
    
    const users = readData(USERS_FILE);
    
    // 檢查 email 是否已存在
    if (users.find(u => u.email === email)) {
      return res.status(400).json({ error: '此 Email 已被註冊' });
    }
    
    // 加密密碼
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const newUser = {
      id: uuidv4(),
      email,
      password: hashedPassword,
      name,
      role: role || 'employee',
      avatar: null,
      teamId: null,
      createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    writeData(USERS_FILE, users);
    
    // 回傳不含密碼的用戶資料
    const { password: _, ...userWithoutPassword } = newUser;
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: '註冊失敗' });
  }
});

// 登入
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const users = readData(USERS_FILE);
    const user = users.find(u => u.email === email);
    
    if (!user) {
      return res.status(401).json({ error: 'Email 或密碼錯誤' });
    }
    
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Email 或密碼錯誤' });
    }
    
    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: '登入失敗' });
  }
});

// 更新用戶資料
app.put('/api/users/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const users = readData(USERS_FILE);
    const index = users.findIndex(u => u.id === id);
    
    if (index === -1) {
      return res.status(404).json({ error: '找不到用戶' });
    }
    
    // 不允許更新密碼和 id
    delete updates.password;
    delete updates.id;
    
    users[index] = { ...users[index], ...updates };
    writeData(USERS_FILE, users);
    
    const { password: _, ...userWithoutPassword } = users[index];
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: '更新失敗' });
  }
});

// 獲取用戶資料
app.get('/api/users/:id', (req, res) => {
  try {
    const { id } = req.params;
    const users = readData(USERS_FILE);
    const user = users.find(u => u.id === id);
    
    if (!user) {
      return res.status(404).json({ error: '找不到用戶' });
    }
    
    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: '獲取用戶失敗' });
  }
});

// 刪除用戶
app.delete('/api/users/:id', (req, res) => {
  try {
    const { id } = req.params;
    const users = readData(USERS_FILE);
    const userIndex = users.findIndex(u => u.id === id);
    
    if (userIndex === -1) {
      return res.status(404).json({ error: '找不到用戶' });
    }
    
    const deletedUser = users[userIndex];
    
    // 刪除用戶
    users.splice(userIndex, 1);
    writeData(USERS_FILE, users);
    
    // 同時刪除該用戶的相關資料
    // 刪除工作
    const jobs = readData(JOBS_FILE);
    const filteredJobs = jobs.filter(j => j.userId !== id);
    writeData(JOBS_FILE, filteredJobs);
    
    // 刪除打卡記錄
    const records = readData(RECORDS_FILE);
    const filteredRecords = records.filter(r => r.userId !== id);
    writeData(RECORDS_FILE, filteredRecords);
    
    // 刪除排班
    const schedules = readData(SCHEDULES_FILE);
    const filteredSchedules = schedules.filter(s => s.userId !== id);
    writeData(SCHEDULES_FILE, filteredSchedules);
    
    // 如果是主管，刪除其團隊
    if (deletedUser.role === 'manager') {
      const teams = readData(TEAMS_FILE);
      const filteredTeams = teams.filter(t => t.managerId !== id);
      writeData(TEAMS_FILE, filteredTeams);
    }
    
    console.log(`用戶 ${deletedUser.email} 已被刪除`);
    res.json({ success: true, message: '用戶已刪除' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: '刪除用戶失敗' });
  }
});

// ==================== 團隊 API ====================

// 創建團隊
app.post('/api/teams', (req, res) => {
  try {
    const { name, managerId } = req.body;
    
    if (!name || !managerId) {
      return res.status(400).json({ error: '請提供團隊名稱和管理者 ID' });
    }
    
    const teams = readData(TEAMS_FILE);
    const inviteCode = generateInviteCode();
    
    const newTeam = {
      id: uuidv4(),
      name,
      managerId,
      inviteCode,
      createdAt: new Date().toISOString()
    };
    
    teams.push(newTeam);
    writeData(TEAMS_FILE, teams);
    
    // 更新管理者的 teamId
    const users = readData(USERS_FILE);
    const managerIndex = users.findIndex(u => u.id === managerId);
    if (managerIndex !== -1) {
      users[managerIndex].teamId = newTeam.id;
      writeData(USERS_FILE, users);
    }
    
    res.status(201).json(newTeam);
  } catch (error) {
    console.error('Create team error:', error);
    res.status(500).json({ error: '創建團隊失敗' });
  }
});

// 用邀請碼加入團隊
app.post('/api/teams/join', (req, res) => {
  try {
    const { inviteCode, userId } = req.body;
    
    if (!inviteCode || !userId) {
      return res.status(400).json({ error: '請提供邀請碼和用戶 ID' });
    }
    
    const teams = readData(TEAMS_FILE);
    const team = teams.find(t => t.inviteCode === inviteCode.toUpperCase());
    
    if (!team) {
      return res.status(404).json({ error: '邀請碼無效' });
    }
    
    // 更新用戶的 teamId
    const users = readData(USERS_FILE);
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
      return res.status(404).json({ error: '找不到用戶' });
    }
    
    users[userIndex].teamId = team.id;
    writeData(USERS_FILE, users);
    
    const { password: _, ...userWithoutPassword } = users[userIndex];
    res.json({ team, user: userWithoutPassword });
  } catch (error) {
    console.error('Join team error:', error);
    res.status(500).json({ error: '加入團隊失敗' });
  }
});

// 獲取團隊資訊
app.get('/api/teams/:id', (req, res) => {
  try {
    const { id } = req.params;
    const teams = readData(TEAMS_FILE);
    const team = teams.find(t => t.id === id);
    
    if (!team) {
      return res.status(404).json({ error: '找不到團隊' });
    }
    
    res.json(team);
  } catch (error) {
    console.error('Get team error:', error);
    res.status(500).json({ error: '獲取團隊失敗' });
  }
});

// 獲取團隊所有成員（包含主管和員工）
app.get('/api/teams/:id/members', (req, res) => {
  try {
    const { id } = req.params;
    const users = readData(USERS_FILE);
    
    const members = users
      .filter(u => u.teamId === id)
      .map(({ password, ...user }) => user);
    
    console.log(`Team ${id} members:`, members.length);
    res.json(members);
  } catch (error) {
    console.error('Get members error:', error);
    res.status(500).json({ error: '獲取成員列表失敗' });
  }
});

// 獲取團隊成員（員工）
app.get('/api/teams/:id/employees', (req, res) => {
  try {
    const { id } = req.params;
    const users = readData(USERS_FILE);
    
    const employees = users
      .filter(u => u.teamId === id && u.role === 'employee')
      .map(({ password, ...user }) => user);
    
    console.log(`Team ${id} employees:`, employees.length);
    res.json(employees);
  } catch (error) {
    console.error('Get employees error:', error);
    res.status(500).json({ error: '獲取員工列表失敗' });
  }
});

// ==================== 工作 API ====================

// 獲取用戶的工作列表
app.get('/api/jobs/user/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const jobs = readData(JOBS_FILE);
    const userJobs = jobs.filter(j => j.userId === userId);
    res.json(userJobs);
  } catch (error) {
    console.error('Get jobs error:', error);
    res.status(500).json({ error: '獲取工作列表失敗' });
  }
});

// 新增工作
app.post('/api/jobs', (req, res) => {
  try {
    const { userId, name, hourlyRate, maxHoursPerDay } = req.body;
    
    if (!userId || !name || !hourlyRate) {
      return res.status(400).json({ error: '請填寫所有必要欄位' });
    }
    
    const jobs = readData(JOBS_FILE);
    
    const newJob = {
      id: uuidv4(),
      userId,
      name,
      hourlyRate,
      maxHoursPerDay: maxHoursPerDay || 8,
      createdAt: new Date().toISOString()
    };
    
    jobs.push(newJob);
    writeData(JOBS_FILE, jobs);
    
    res.status(201).json(newJob);
  } catch (error) {
    console.error('Create job error:', error);
    res.status(500).json({ error: '新增工作失敗' });
  }
});

// 更新工作
app.put('/api/jobs/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const jobs = readData(JOBS_FILE);
    const index = jobs.findIndex(j => j.id === id);
    
    if (index === -1) {
      return res.status(404).json({ error: '找不到工作' });
    }
    
    delete updates.id;
    jobs[index] = { ...jobs[index], ...updates };
    writeData(JOBS_FILE, jobs);
    
    res.json(jobs[index]);
  } catch (error) {
    console.error('Update job error:', error);
    res.status(500).json({ error: '更新工作失敗' });
  }
});

// 刪除工作
app.delete('/api/jobs/:id', (req, res) => {
  try {
    const { id } = req.params;
    const jobs = readData(JOBS_FILE);
    const filteredJobs = jobs.filter(j => j.id !== id);
    
    if (filteredJobs.length === jobs.length) {
      return res.status(404).json({ error: '找不到工作' });
    }
    
    writeData(JOBS_FILE, filteredJobs);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete job error:', error);
    res.status(500).json({ error: '刪除工作失敗' });
  }
});

// ==================== 打卡記錄 API ====================

// 獲取用戶的打卡記錄
app.get('/api/records/user/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const records = readData(RECORDS_FILE);
    const userRecords = records.filter(r => r.userId === userId);
    res.json(userRecords);
  } catch (error) {
    console.error('Get records error:', error);
    res.status(500).json({ error: '獲取打卡記錄失敗' });
  }
});

// 新增打卡記錄（上班打卡）
app.post('/api/records', (req, res) => {
  try {
    const { userId, jobId, clockIn, clockInPhoto } = req.body;
    
    if (!userId || !jobId || !clockIn) {
      return res.status(400).json({ error: '請填寫所有必要欄位' });
    }
    
    const records = readData(RECORDS_FILE);
    
    const newRecord = {
      id: uuidv4(),
      userId,
      jobId,
      clockIn,
      clockInPhoto: clockInPhoto || null,
      clockOut: null,
      clockOutPhoto: null,
      date: clockIn.split('T')[0],
      createdAt: new Date().toISOString()
    };
    
    records.push(newRecord);
    writeData(RECORDS_FILE, records);
    
    res.status(201).json(newRecord);
  } catch (error) {
    console.error('Create record error:', error);
    res.status(500).json({ error: '打卡失敗' });
  }
});

// 更新打卡記錄（下班打卡）
app.put('/api/records/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const records = readData(RECORDS_FILE);
    const index = records.findIndex(r => r.id === id);
    
    if (index === -1) {
      return res.status(404).json({ error: '找不到打卡記錄' });
    }
    
    delete updates.id;
    records[index] = { ...records[index], ...updates };
    writeData(RECORDS_FILE, records);
    
    res.json(records[index]);
  } catch (error) {
    console.error('Update record error:', error);
    res.status(500).json({ error: '更新打卡記錄失敗' });
  }
});

// ==================== 排班 API ====================

// 獲取用戶的排班
app.get('/api/schedules/user/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const schedules = readData(SCHEDULES_FILE);
    const userSchedules = schedules.filter(s => s.userId === userId);
    res.json(userSchedules);
  } catch (error) {
    console.error('Get schedules error:', error);
    res.status(500).json({ error: '獲取排班失敗' });
  }
});

// 獲取團隊的所有排班
app.get('/api/schedules/team/:teamId', (req, res) => {
  try {
    const { teamId } = req.params;
    const schedules = readData(SCHEDULES_FILE);
    const users = readData(USERS_FILE);
    
    // 獲取團隊成員 ID
    const teamUserIds = users
      .filter(u => u.teamId === teamId)
      .map(u => u.id);
    
    const teamSchedules = schedules.filter(s => teamUserIds.includes(s.userId));
    res.json(teamSchedules);
  } catch (error) {
    console.error('Get team schedules error:', error);
    res.status(500).json({ error: '獲取團隊排班失敗' });
  }
});

// 新增排班
app.post('/api/schedules', (req, res) => {
  try {
    const { userId, date, startTime, endTime, note, createdBy } = req.body;
    
    if (!userId || !date || !startTime || !endTime) {
      return res.status(400).json({ error: '請填寫所有必要欄位' });
    }
    
    const schedules = readData(SCHEDULES_FILE);
    
    const newSchedule = {
      id: uuidv4(),
      userId,
      date,
      startTime,
      endTime,
      note: note || '',
      createdBy: createdBy || userId,
      createdAt: new Date().toISOString()
    };
    
    schedules.push(newSchedule);
    writeData(SCHEDULES_FILE, schedules);
    
    res.status(201).json(newSchedule);
  } catch (error) {
    console.error('Create schedule error:', error);
    res.status(500).json({ error: '新增排班失敗' });
  }
});

// 更新排班
app.put('/api/schedules/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const schedules = readData(SCHEDULES_FILE);
    const index = schedules.findIndex(s => s.id === id);
    
    if (index === -1) {
      return res.status(404).json({ error: '找不到排班' });
    }
    
    delete updates.id;
    schedules[index] = { ...schedules[index], ...updates };
    writeData(SCHEDULES_FILE, schedules);
    
    res.json(schedules[index]);
  } catch (error) {
    console.error('Update schedule error:', error);
    res.status(500).json({ error: '更新排班失敗' });
  }
});

// 刪除排班
app.delete('/api/schedules/:id', (req, res) => {
  try {
    const { id } = req.params;
    const schedules = readData(SCHEDULES_FILE);
    const filteredSchedules = schedules.filter(s => s.id !== id);
    
    if (filteredSchedules.length === schedules.length) {
      return res.status(404).json({ error: '找不到排班' });
    }
    
    writeData(SCHEDULES_FILE, filteredSchedules);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete schedule error:', error);
    res.status(500).json({ error: '刪除排班失敗' });
  }
});

// 所有其他路由都返回前端 index.html (SPA 支援)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// 啟動伺服器
app.listen(PORT, () => {
  console.log(`🚀 伺服器運行於 port ${PORT}`);
  console.log('📁 資料儲存於 ./data 目錄');
});
