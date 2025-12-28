const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// MongoDB 連接
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/work-hours-tracker';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ MongoDB 連接成功'))
  .catch(err => console.error('❌ MongoDB 連接失敗:', err));

// 中間件
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// 提供靜態檔案 (前端 build 後的檔案)
app.use(express.static(path.join(__dirname, '../dist')));

// ==================== MongoDB Schemas ====================
const userSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, enum: ['employee', 'manager'], default: 'employee' },
  avatar: String,
  teamId: String,
  createdAt: { type: Date, default: Date.now },
  isPremium: { type: Boolean, default: false }
});

const teamSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  managerId: { type: String, required: true },
  inviteCode: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now }
});

const jobSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  name: { type: String, required: true },
  hourlyRate: { type: Number, required: true },
  dailyLimit: Number,
  color: String,
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

const recordSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  jobId: { type: String, required: true },
  clockIn: { type: Date, required: true },
  clockInPhoto: String,
  clockOut: Date,
  clockOutPhoto: String,
  date: String,
  createdAt: { type: Date, default: Date.now }
});

const scheduleSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  jobId: { type: String, required: true },
  dayOfWeek: { type: Number, required: true },
  startTime: String,
  endTime: String,
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Team = mongoose.model('Team', teamSchema);
const Job = mongoose.model('Job', jobSchema);
const Record = mongoose.model('Record', recordSchema);
const Schedule = mongoose.model('Schedule', scheduleSchema);

// 生成 6 位邀請碼
function generateInviteCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// ==================== 管理後台首頁 ====================
app.get('/', async (req, res) => {
  try {
    const users = await User.find({});
    const teams = await Team.find({});
    const jobs = await Job.find({});
    const records = await Record.find({});
    const schedules = await Schedule.find({});
    
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
    .success { background: #dcfce7; color: #16a34a; padding: 10px; border-radius: 8px; margin-bottom: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🕐 工時計算 - 管理後台</h1>
    <p class="success">✅ MongoDB 連接成功！資料永久保存</p>
    
    <div class="stats">
      <div class="stat-card">
        <h3>總用戶數</h3>
        <div class="number">${users.length}</div>
      </div>
      <div class="stat-card">
        <h3>總團隊數</h3>
        <div class="number">${teams.length}</div>
      </div>
      <div class="stat-card">
        <h3>總工作數</h3>
        <div class="number">${jobs.length}</div>
      </div>
      <div class="stat-card">
        <h3>打卡記錄數</h3>
        <div class="number">${records.length}</div>
      </div>
    </div>

    <div class="section">
      <h2>👥 用戶列表</h2>
      <table>
        <thead>
          <tr>
            <th>姓名</th>
            <th>Email</th>
            <th>角色</th>
            <th>註冊時間</th>
          </tr>
        </thead>
        <tbody>
          ${users.map(u => `
            <tr>
              <td>${u.name}</td>
              <td>${u.email}</td>
              <td><span class="badge ${u.role === 'manager' ? 'badge-manager' : 'badge-employee'}">${u.role === 'manager' ? '主管' : '員工'}</span></td>
              <td>${new Date(u.createdAt).toLocaleString('zh-TW')}</td>
            </tr>
          `).join('')}
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
            <th>建立時間</th>
          </tr>
        </thead>
        <tbody>
          ${teams.map(t => `
            <tr>
              <td>${t.name}</td>
              <td><code>${t.inviteCode}</code></td>
              <td>${new Date(t.createdAt).toLocaleString('zh-TW')}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  </div>
</body>
</html>
    `;
    res.send(html);
  } catch (error) {
    res.status(500).json({ error: '伺服器錯誤' });
  }
});

// ==================== 認證 API ====================

// 註冊
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name, role = 'employee' } = req.body;
    
    // 檢查 email 是否已存在
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email 已被註冊' });
    }
    
    // 加密密碼
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // 建立新用戶
    const newUser = new User({
      id: uuidv4(),
      email,
      password: hashedPassword,
      name,
      role,
      avatar: null,
      teamId: null,
      isPremium: false
    });
    
    await newUser.save();
    
    // 返回用戶資料（不含密碼）
    const userResponse = {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      avatar: newUser.avatar,
      teamId: newUser.teamId,
      isPremium: newUser.isPremium
    };
    
    res.status(201).json(userResponse);
  } catch (error) {
    console.error('註冊錯誤:', error);
    res.status(500).json({ error: '伺服器錯誤' });
  }
});

// 登入
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // 查找用戶
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Email 或密碼錯誤' });
    }
    
    // 驗證密碼
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Email 或密碼錯誤' });
    }
    
    // 如果用戶有團隊，獲取團隊資訊
    let team = null;
    if (user.teamId) {
      team = await Team.findOne({ id: user.teamId });
    }
    
    // 返回用戶資料
    const userResponse = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatar: user.avatar,
      teamId: user.teamId,
      isPremium: user.isPremium
    };
    
    res.json({ user: userResponse, team });
  } catch (error) {
    console.error('登入錯誤:', error);
    res.status(500).json({ error: '伺服器錯誤' });
  }
});

// ==================== 用戶 API ====================

// 獲取用戶資訊
app.get('/api/users/:id', async (req, res) => {
  try {
    const user = await User.findOne({ id: req.params.id });
    if (!user) {
      return res.status(404).json({ error: '找不到用戶' });
    }
    
    const userResponse = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatar: user.avatar,
      teamId: user.teamId,
      isPremium: user.isPremium
    };
    
    res.json(userResponse);
  } catch (error) {
    res.status(500).json({ error: '伺服器錯誤' });
  }
});

// 更新用戶資訊
app.put('/api/users/:id', async (req, res) => {
  try {
    const user = await User.findOne({ id: req.params.id });
    if (!user) {
      return res.status(404).json({ error: '找不到用戶' });
    }
    
    const { name, avatar, teamId } = req.body;
    
    if (name !== undefined) user.name = name;
    if (avatar !== undefined) user.avatar = avatar;
    if (teamId !== undefined) user.teamId = teamId;
    
    await user.save();
    
    const userResponse = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatar: user.avatar,
      teamId: user.teamId,
      isPremium: user.isPremium
    };
    
    res.json(userResponse);
  } catch (error) {
    res.status(500).json({ error: '伺服器錯誤' });
  }
});

// ==================== 團隊 API ====================

// 建立團隊
app.post('/api/teams', async (req, res) => {
  try {
    const { name, managerId } = req.body;
    
    // 檢查用戶是否存在
    const user = await User.findOne({ id: managerId });
    if (!user) {
      return res.status(404).json({ error: '找不到用戶' });
    }
    
    // 檢查用戶是否已有團隊
    if (user.teamId) {
      return res.status(400).json({ error: '您已經是團隊成員' });
    }
    
    // 生成唯一邀請碼
    let inviteCode;
    let codeExists = true;
    while (codeExists) {
      inviteCode = generateInviteCode();
      codeExists = await Team.findOne({ inviteCode });
    }
    
    // 建立團隊
    const newTeam = new Team({
      id: uuidv4(),
      name,
      managerId,
      inviteCode
    });
    
    await newTeam.save();
    
    // 更新用戶為主管並加入團隊
    user.role = 'manager';
    user.teamId = newTeam.id;
    await user.save();
    
    res.status(201).json(newTeam);
  } catch (error) {
    console.error('建立團隊錯誤:', error);
    res.status(500).json({ error: '伺服器錯誤' });
  }
});

// 用邀請碼加入團隊
app.post('/api/teams/join', async (req, res) => {
  try {
    const { inviteCode, userId } = req.body;
    
    // 查找團隊
    const team = await Team.findOne({ inviteCode: inviteCode.toUpperCase() });
    if (!team) {
      return res.status(404).json({ error: '邀請碼無效' });
    }
    
    // 查找用戶
    const user = await User.findOne({ id: userId });
    if (!user) {
      return res.status(404).json({ error: '找不到用戶' });
    }
    
    // 檢查用戶是否已有團隊
    if (user.teamId) {
      return res.status(400).json({ error: '您已經是其他團隊的成員' });
    }
    
    // 更新用戶團隊
    user.teamId = team.id;
    await user.save();
    
    res.json({ team, user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatar: user.avatar,
      teamId: user.teamId,
      isPremium: user.isPremium
    }});
  } catch (error) {
    console.error('加入團隊錯誤:', error);
    res.status(500).json({ error: '伺服器錯誤' });
  }
});

// 獲取團隊資訊
app.get('/api/teams/:id', async (req, res) => {
  try {
    const team = await Team.findOne({ id: req.params.id });
    if (!team) {
      return res.status(404).json({ error: '找不到團隊' });
    }
    res.json(team);
  } catch (error) {
    res.status(500).json({ error: '伺服器錯誤' });
  }
});

// 獲取團隊成員
app.get('/api/teams/:id/members', async (req, res) => {
  try {
    const members = await User.find({ teamId: req.params.id });
    const membersResponse = members.map(m => ({
      id: m.id,
      email: m.email,
      name: m.name,
      role: m.role,
      avatar: m.avatar
    }));
    res.json(membersResponse);
  } catch (error) {
    res.status(500).json({ error: '伺服器錯誤' });
  }
});

// 獲取團隊員工（不含主管）
app.get('/api/teams/:id/employees', async (req, res) => {
  try {
    const team = await Team.findOne({ id: req.params.id });
    if (!team) {
      return res.status(404).json({ error: '找不到團隊' });
    }
    
    const employees = await User.find({ 
      teamId: req.params.id, 
      id: { $ne: team.managerId } 
    });
    
    const employeesResponse = employees.map(e => ({
      id: e.id,
      email: e.email,
      name: e.name,
      role: e.role,
      avatar: e.avatar
    }));
    
    res.json(employeesResponse);
  } catch (error) {
    res.status(500).json({ error: '伺服器錯誤' });
  }
});

// ==================== 工作 API ====================

// 獲取用戶的工作列表
app.get('/api/jobs', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ error: '需要提供 userId' });
    }
    
    const jobs = await Job.find({ userId, isActive: true });
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ error: '伺服器錯誤' });
  }
});

// 新增工作
app.post('/api/jobs', async (req, res) => {
  try {
    const { userId, name, hourlyRate, dailyLimit, color } = req.body;
    
    const newJob = new Job({
      id: uuidv4(),
      userId,
      name,
      hourlyRate,
      dailyLimit: dailyLimit || null,
      color: color || '#6366f1',
      isActive: true
    });
    
    await newJob.save();
    res.status(201).json(newJob);
  } catch (error) {
    res.status(500).json({ error: '伺服器錯誤' });
  }
});

// 更新工作
app.put('/api/jobs/:id', async (req, res) => {
  try {
    const job = await Job.findOne({ id: req.params.id });
    if (!job) {
      return res.status(404).json({ error: '找不到工作' });
    }
    
    const { name, hourlyRate, dailyLimit, color, isActive } = req.body;
    
    if (name !== undefined) job.name = name;
    if (hourlyRate !== undefined) job.hourlyRate = hourlyRate;
    if (dailyLimit !== undefined) job.dailyLimit = dailyLimit;
    if (color !== undefined) job.color = color;
    if (isActive !== undefined) job.isActive = isActive;
    
    await job.save();
    res.json(job);
  } catch (error) {
    res.status(500).json({ error: '伺服器錯誤' });
  }
});

// 刪除工作
app.delete('/api/jobs/:id', async (req, res) => {
  try {
    const job = await Job.findOne({ id: req.params.id });
    if (!job) {
      return res.status(404).json({ error: '找不到工作' });
    }
    
    job.isActive = false;
    await job.save();
    
    res.json({ message: '工作已刪除' });
  } catch (error) {
    res.status(500).json({ error: '伺服器錯誤' });
  }
});

// ==================== 打卡記錄 API ====================

// 獲取用戶的打卡記錄
app.get('/api/records', async (req, res) => {
  try {
    const { userId, startDate, endDate } = req.query;
    
    let query = {};
    if (userId) query.userId = userId;
    
    if (startDate || endDate) {
      query.clockIn = {};
      if (startDate) query.clockIn.$gte = new Date(startDate);
      if (endDate) query.clockIn.$lte = new Date(endDate);
    }
    
    const records = await Record.find(query).sort({ clockIn: -1 });
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: '伺服器錯誤' });
  }
});

// 獲取特定用戶的打卡記錄
app.get('/api/records/user/:userId', async (req, res) => {
  try {
    const records = await Record.find({ userId: req.params.userId }).sort({ clockIn: -1 });
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: '伺服器錯誤' });
  }
});

// 上班打卡
app.post('/api/records/clock-in', async (req, res) => {
  try {
    const { userId, jobId, clockInPhoto } = req.body;
    
    // 檢查是否有未完成的打卡
    const activeRecord = await Record.findOne({ userId, clockOut: null });
    if (activeRecord) {
      return res.status(400).json({ error: '您有未完成的打卡記錄，請先下班打卡' });
    }
    
    const now = new Date();
    const newRecord = new Record({
      id: uuidv4(),
      userId,
      jobId,
      clockIn: now,
      clockInPhoto: clockInPhoto || null,
      clockOut: null,
      clockOutPhoto: null,
      date: now.toISOString().split('T')[0]
    });
    
    await newRecord.save();
    res.status(201).json(newRecord);
  } catch (error) {
    console.error('上班打卡錯誤:', error);
    res.status(500).json({ error: '伺服器錯誤' });
  }
});

// 下班打卡
app.post('/api/records/clock-out', async (req, res) => {
  try {
    const { userId, clockOutPhoto } = req.body;
    
    // 查找未完成的打卡記錄
    const record = await Record.findOne({ userId, clockOut: null });
    if (!record) {
      return res.status(400).json({ error: '找不到進行中的打卡記錄' });
    }
    
    record.clockOut = new Date();
    record.clockOutPhoto = clockOutPhoto || null;
    
    await record.save();
    res.json(record);
  } catch (error) {
    console.error('下班打卡錯誤:', error);
    res.status(500).json({ error: '伺服器錯誤' });
  }
});

// 獲取當前打卡狀態
app.get('/api/records/current/:userId', async (req, res) => {
  try {
    const record = await Record.findOne({ userId: req.params.userId, clockOut: null });
    res.json(record || null);
  } catch (error) {
    res.status(500).json({ error: '伺服器錯誤' });
  }
});

// 刪除打卡記錄
app.delete('/api/records/:id', async (req, res) => {
  try {
    const result = await Record.deleteOne({ id: req.params.id });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: '找不到打卡記錄' });
    }
    res.json({ message: '記錄已刪除' });
  } catch (error) {
    res.status(500).json({ error: '伺服器錯誤' });
  }
});

// ==================== 班表 API ====================

// 獲取用戶班表
app.get('/api/schedules', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ error: '需要提供 userId' });
    }
    
    const schedules = await Schedule.find({ userId });
    res.json(schedules);
  } catch (error) {
    res.status(500).json({ error: '伺服器錯誤' });
  }
});

// 新增/更新班表
app.post('/api/schedules', async (req, res) => {
  try {
    const { userId, jobId, dayOfWeek, startTime, endTime } = req.body;
    
    // 檢查是否已存在
    let schedule = await Schedule.findOne({ userId, jobId, dayOfWeek });
    
    if (schedule) {
      schedule.startTime = startTime;
      schedule.endTime = endTime;
      await schedule.save();
    } else {
      schedule = new Schedule({
        id: uuidv4(),
        userId,
        jobId,
        dayOfWeek,
        startTime,
        endTime
      });
      await schedule.save();
    }
    
    res.status(201).json(schedule);
  } catch (error) {
    res.status(500).json({ error: '伺服器錯誤' });
  }
});

// 刪除班表
app.delete('/api/schedules/:id', async (req, res) => {
  try {
    const result = await Schedule.deleteOne({ id: req.params.id });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: '找不到班表' });
    }
    res.json({ message: '班表已刪除' });
  } catch (error) {
    res.status(500).json({ error: '伺服器錯誤' });
  }
});

// 所有其他路由都返回前端 index.html (SPA 支援)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// 啟動伺服器
app.listen(PORT, () => {
  console.log(`🚀 伺服器運行於 port ${PORT}`);
});
