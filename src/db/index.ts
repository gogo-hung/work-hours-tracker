import Dexie, { type Table } from 'dexie'
import type { User, Job, TimeRecord, Schedule, Team } from '@/types'

export class WorkHoursDB extends Dexie {
  users!: Table<User>
  jobs!: Table<Job>
  timeRecords!: Table<TimeRecord>
  schedules!: Table<Schedule>
  teams!: Table<Team>

  constructor() {
    super('WorkHoursDB')
    this.version(1).stores({
      users: 'id, username, email',
      jobs: 'id, userId, name, isActive',
      timeRecords: 'id, userId, jobId, clockIn, clockOut, [userId+jobId]'
    })
    this.version(2).stores({
      users: 'id, username, email',
      jobs: 'id, userId, name, isActive',
      timeRecords: 'id, userId, jobId, clockIn, clockOut, [userId+jobId]',
      schedules: 'id, userId, jobId, date, [userId+date]'
    })
    this.version(3).stores({
      users: 'id, username, email, teamId',
      jobs: 'id, userId, name, isActive',
      timeRecords: 'id, userId, jobId, clockIn, clockOut, [userId+jobId]',
      schedules: 'id, userId, jobId, date, [userId+date]',
      teams: 'id, inviteCode, managerId'
    })
  }
}

export const db = new WorkHoursDB()

// 使用者相關操作
export const userDB = {
  async create(user: User): Promise<string> {
    return await db.users.add(user)
  },

  async getById(id: string): Promise<User | undefined> {
    return await db.users.get(id)
  },

  async getByUsername(username: string): Promise<User | undefined> {
    return await db.users.where('username').equals(username).first()
  },

  async getByEmail(email: string): Promise<User | undefined> {
    return await db.users.where('email').equals(email).first()
  },

  async update(id: string, data: Partial<User>): Promise<number> {
    return await db.users.update(id, data)
  },

  async delete(id: string): Promise<void> {
    await db.users.delete(id)
  },

  // 取得所有員工（給主管用）
  async getAllEmployees(): Promise<User[]> {
    return await db.users.filter(user => user.role === 'employee').toArray()
  },

  // 取得群組內的員工
  async getEmployeesByTeamId(teamId: string): Promise<User[]> {
    const allUsers = await db.users.toArray()
    console.log('所有用戶:', allUsers)
    console.log('查詢的 teamId:', teamId)
    const filtered = allUsers.filter(user => {
      console.log(`用戶 ${user.username}: role=${user.role}, teamId=${user.teamId}`)
      return user.role === 'employee' && user.teamId === teamId
    })
    console.log('篩選後的員工:', filtered)
    return filtered
  },

  // 取得所有用戶
  async getAll(): Promise<User[]> {
    return await db.users.toArray()
  }
}

// 群組相關操作
export const teamDB = {
  async create(team: Team): Promise<string> {
    return await db.teams.add(team)
  },

  async getById(id: string): Promise<Team | undefined> {
    return await db.teams.get(id)
  },

  async getByInviteCode(inviteCode: string): Promise<Team | undefined> {
    return await db.teams.where('inviteCode').equals(inviteCode).first()
  },

  async getByManagerId(managerId: string): Promise<Team | undefined> {
    return await db.teams.where('managerId').equals(managerId).first()
  },

  async update(id: string, data: Partial<Team>): Promise<number> {
    return await db.teams.update(id, { ...data, updatedAt: new Date() })
  },

  async delete(id: string): Promise<void> {
    await db.teams.delete(id)
  }
}

// 工作相關操作
export const jobDB = {
  async create(job: Job): Promise<string> {
    return await db.jobs.add(job)
  },

  async getById(id: string): Promise<Job | undefined> {
    return await db.jobs.get(id)
  },

  async getByUserId(userId: string): Promise<Job[]> {
    return await db.jobs.where('userId').equals(userId).toArray()
  },

  async getActiveByUserId(userId: string): Promise<Job[]> {
    return await db.jobs
      .where('userId')
      .equals(userId)
      .filter(job => job.isActive)
      .toArray()
  },

  async update(id: string, data: Partial<Job>): Promise<number> {
    return await db.jobs.update(id, { ...data, updatedAt: new Date() })
  },

  async delete(id: string): Promise<void> {
    await db.jobs.delete(id)
  }
}

// 打卡紀錄相關操作
export const timeRecordDB = {
  async create(record: TimeRecord): Promise<string> {
    return await db.timeRecords.add(record)
  },

  async getById(id: string): Promise<TimeRecord | undefined> {
    return await db.timeRecords.get(id)
  },

  async getByUserId(userId: string): Promise<TimeRecord[]> {
    return await db.timeRecords.where('userId').equals(userId).toArray()
  },

  async getByUserAndJob(userId: string, jobId: string): Promise<TimeRecord[]> {
    return await db.timeRecords
      .where('[userId+jobId]')
      .equals([userId, jobId])
      .toArray()
  },

  async getByDateRange(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<TimeRecord[]> {
    return await db.timeRecords
      .where('userId')
      .equals(userId)
      .filter(record => {
        const clockIn = new Date(record.clockIn)
        return clockIn >= startDate && clockIn <= endDate
      })
      .toArray()
  },

  async getActiveRecord(userId: string): Promise<TimeRecord | undefined> {
    return await db.timeRecords
      .where('userId')
      .equals(userId)
      .filter(record => !record.clockOut)
      .first()
  },

  async update(id: string, data: Partial<TimeRecord>): Promise<number> {
    return await db.timeRecords.update(id, { ...data, updatedAt: new Date() })
  },

  async delete(id: string): Promise<void> {
    await db.timeRecords.delete(id)
  },

  async deleteByUserId(userId: string): Promise<number> {
    return await db.timeRecords.where('userId').equals(userId).delete()
  }
}

// 排班相關操作
export const scheduleDB = {
  async create(schedule: Schedule): Promise<string> {
    return await db.schedules.add(schedule)
  },

  async getById(id: string): Promise<Schedule | undefined> {
    return await db.schedules.get(id)
  },

  async getByUserId(userId: string): Promise<Schedule[]> {
    return await db.schedules.where('userId').equals(userId).toArray()
  },

  async getByUserAndDate(userId: string, date: string): Promise<Schedule[]> {
    return await db.schedules
      .where('[userId+date]')
      .equals([userId, date])
      .toArray()
  },

  async getByUserAndMonth(userId: string, year: number, month: number): Promise<Schedule[]> {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`
    const endDate = `${year}-${String(month).padStart(2, '0')}-31`
    return await db.schedules
      .where('userId')
      .equals(userId)
      .filter(s => s.date >= startDate && s.date <= endDate)
      .toArray()
  },

  async update(id: string, data: Partial<Schedule>): Promise<number> {
    return await db.schedules.update(id, { ...data, updatedAt: new Date() })
  },

  async delete(id: string): Promise<void> {
    await db.schedules.delete(id)
  }
}
