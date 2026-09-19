import express, { Request, Response } from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { 
  Employee, 
  Transaction, 
  AppSettings, 
  NotificationItem, 
  ActivityItem, 
  SyncQueueItem, 
  ConflictRecord,
  ActiveRole
} from "./src/types";
import { 
  INITIAL_EMPLOYEES, 
  INITIAL_TRANSACTIONS, 
  INITIAL_SETTINGS, 
  INITIAL_NOTIFICATIONS, 
  INITIAL_ACTIVITIES 
} from "./src/data/initialData";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Persistent server store file
const DB_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DB_DIR, "server-db.json");
const USERS_FILE = path.join(DB_DIR, "users.json");

interface ServerState {
  version: number;
  employees: Employee[];
  transactions: Transaction[];
  settings: AppSettings;
  notifications: NotificationItem[];
  activities: ActivityItem[];
  conflicts: ConflictRecord[];
}

function loadServerState(): ServerState {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (err) {
    console.warn("Could not load existing server-db.json, using seed defaults:", err);
  }

  const defaultState: ServerState = {
    version: 1,
    employees: INITIAL_EMPLOYEES,
    transactions: INITIAL_TRANSACTIONS,
    settings: INITIAL_SETTINGS,
    notifications: INITIAL_NOTIFICATIONS,
    activities: INITIAL_ACTIVITIES,
    conflicts: [],
  };
  saveServerState(defaultState);
  return defaultState;
}

function saveServerState(state: ServerState) {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to persist server-db.json:", err);
  }
}

let serverState: ServerState = loadServerState();

// -------------------------------------------------------------
// USER ACCOUNTS & SECURE AUTHENTICATION (Multi-User Isolation)
// -------------------------------------------------------------
interface UserAccount {
  userId: string;
  username: string;
  password: string;
  name: string;
  role: ActiveRole;
  employeeId: string | null;
  phone?: string;
  email?: string;
  createdAt?: string;
}

const DEFAULT_USERS: UserAccount[] = [
  {
    userId: "USR-001",
    username: "manager",
    password: "admin123",
    name: "المدير العام",
    role: "manager",
    employeeId: null,
    phone: "0570936035",
    email: "manager@hisabi.com",
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    userId: "USR-002",
    username: "ali",
    password: "1234",
    name: "علي",
    role: "employee",
    employeeId: "emp-1",
    phone: "0501234567",
    email: "ali@hisabi.com",
    createdAt: "2026-01-01T00:00:00.000Z",
  },
];

function loadUsers(): UserAccount[] {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    if (fs.existsSync(USERS_FILE)) {
      const data = fs.readFileSync(USERS_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (err) {
    console.warn("Could not load existing users.json, using defaults:", err);
  }

  saveUsers(DEFAULT_USERS);
  return [...DEFAULT_USERS];
}

function saveUsers(users: UserAccount[]) {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to persist users.json:", err);
  }
}

let systemUsers: UserAccount[] = loadUsers();

interface UserSession {
  token: string;
  userId: string;
  username: string;
  name: string;
  role: ActiveRole;
  employeeId: string | null;
  createdAt: string;
}

const activeSessions = new Map<string, UserSession>();

// Seed default dev sessions
activeSessions.set("dev-manager-token", {
  token: "dev-manager-token",
  userId: "USR-001",
  username: "manager",
  name: "المدير العام",
  role: "manager",
  employeeId: null,
  createdAt: new Date().toISOString(),
});
activeSessions.set("dev-ahmed-token", {
  token: "dev-ahmed-token",
  userId: "USR-002",
  username: "ahmed",
  name: "أحمد المحمد",
  role: "employee",
  employeeId: "emp-1",
  createdAt: new Date().toISOString(),
});

function getAuthenticatedUser(req: Request): UserSession | null {
  const authHeader = req.headers["authorization"];
  let token = "";
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.substring(7).trim();
  } else if (req.query.token) {
    token = String(req.query.token).trim();
  }

  if (token && activeSessions.has(token)) {
    return activeSessions.get(token)!;
  }

  return null;
}

// -------------------------------------------------------------
// SSE (Server-Sent Events) clients registry for real-time broadcasts
// -------------------------------------------------------------
interface SSEClient {
  id: string;
  userId: string;
  role: ActiveRole;
  employeeId: string | null;
  name: string;
  res: Response;
}
let sseClients: SSEClient[] = [];

function broadcastSSE(event: string, data: any) {
  sseClients.forEach((client) => {
    try {
      if (client.role === "manager") {
        // Manager receives authoritative updates for the whole team
        client.res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
      } else {
        // Strict Data Isolation: Employee ONLY receives their own delta!
        if (event === "sync_update") {
          const filteredTransactions = data.updatedTransactions?.filter(
            (tx: Transaction) => tx.employeeId === client.employeeId
          );
          // Strictly isolate notifications: employees only receive notifications targeted to their employeeId
          const filteredNotifications = data.newNotifications?.filter(
            (n: NotificationItem) => n.targetUser === client.employeeId
          );
          // Strictly isolate activities: employees only receive activities where they are the employee
          const filteredActivities = data.newActivities?.filter(
            (a: ActivityItem) => (a.employeeId && a.employeeId === client.employeeId) || a.employeeName === client.name
          );

          client.res.write(
            `event: ${event}\ndata: ${JSON.stringify({
              serverVersion: data.serverVersion,
              updatedTransactions: filteredTransactions,
              newNotifications: filteredNotifications,
              newActivities: filteredActivities,
            })}\n\n`
          );
        } else if (event === "settings_update") {
          client.res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
        }
        // employees_update is NEVER sent to an employee
      }
    } catch {
      // client connection dropped, will be removed
    }
  });
}

// Clean up disconnected SSE clients
setInterval(() => {
  sseClients = sseClients.filter((c) => !c.res.writableEnded && !c.res.destroyed);
}, 15000);

// Initialize Gemini lazily if key is available
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// -------------------------------------------------------------
// AUTHENTICATION ENDPOINTS
// -------------------------------------------------------------

// List available demo user profiles for the UI login switcher
app.get("/api/auth/demo-accounts", (req, res) => {
  res.json({
    accounts: systemUsers.map((u) => ({
      userId: u.userId,
      username: u.username,
      name: u.name,
      role: u.role,
      employeeId: u.employeeId,
      phone: u.phone,
      email: u.email,
    })),
  });
});

app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "اسم المستخدم وكلمة المرور مطلوبة" });
  }

  const user = systemUsers.find(
    (u) =>
      u.username.toLowerCase() === username.trim().toLowerCase() &&
      u.password === password.trim()
  );

  if (!user) {
    return res.status(401).json({ error: "بيانات تسجيل الدخول غير صحيحة" });
  }

  const token = `tok_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
  const session: UserSession = {
    token,
    userId: user.userId,
    username: user.username,
    name: user.name,
    role: user.role,
    employeeId: user.employeeId,
    createdAt: new Date().toISOString(),
  };

  activeSessions.set(token, session);

  res.json({
    success: true,
    token,
    user: {
      userId: user.userId,
      username: user.username,
      name: user.name,
      role: user.role,
      employeeId: user.employeeId,
      phone: user.phone,
      email: user.email,
    },
  });
});

// Admin User Accounts Management (Strictly Manager Only)
app.get("/api/admin/users", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user || user.role !== "manager") {
    return res.status(403).json({ error: "الوصول لقائمة الحسابات متاح للمدير العام فقط" });
  }

  res.json({ success: true, users: systemUsers });
});

app.post("/api/admin/users", (req, res) => {
  const adminUser = getAuthenticatedUser(req);
  if (!adminUser || adminUser.role !== "manager") {
    return res.status(403).json({ error: "إنشاء حسابات المستخدمين متاح للمدير العام فقط" });
  }

  const { username, password, name, role = "employee", employeeId, phone, email, basicSalary, jobTitle } = req.body;

  if (!username || !password || !name) {
    return res.status(400).json({ error: "اسم المستخدم وكلمة المرور والاسم بالكامل مطلوبة" });
  }

  const exists = systemUsers.some(
    (u) => u.username.toLowerCase() === username.trim().toLowerCase()
  );
  if (exists) {
    return res.status(400).json({ error: "اسم المستخدم هذا مسجل مسبقاً، يرجى اختيار اسم مستخدم آخر" });
  }

  let finalEmployeeId = employeeId || null;

  // If role is employee and no employeeId was provided, auto-create the employee record
  if (role === "employee" && !finalEmployeeId) {
    const newEmpId = `emp-${Date.now().toString(36)}`;
    const newEmployee: Employee = {
      id: newEmpId,
      name: name.trim(),
      role: jobTitle || "موظف مبيعات وتطوير أعمال",
      basicSalary: typeof basicSalary === "number" ? basicSalary : (parseFloat(basicSalary) || 3000),
      phone: phone || "",
      email: email || "",
      joinDate: new Date().toISOString().split("T")[0],
      status: "active",
      notes: "تم إنشاء الحساب بواسطة المدير العام",
      version: 1,
      updatedAt: new Date().toISOString(),
    };

    serverState.employees.push(newEmployee);
    serverState.version += 1;
    saveServerState(serverState);
    broadcastSSE("employees_update", serverState.employees);
    finalEmployeeId = newEmpId;
  }

  const newUser: UserAccount = {
    userId: `USR-${Date.now().toString().slice(-4)}`,
    username: username.trim(),
    password: password.trim(),
    name: name.trim(),
    role: role === "manager" ? "manager" : "employee",
    employeeId: finalEmployeeId,
    phone: phone || "",
    email: email || "",
    createdAt: new Date().toISOString(),
  };

  systemUsers.push(newUser);
  saveUsers(systemUsers);

  res.json({ success: true, user: newUser });
});

app.put("/api/admin/users/:userId", (req, res) => {
  const adminUser = getAuthenticatedUser(req);
  if (!adminUser || adminUser.role !== "manager") {
    return res.status(403).json({ error: "تعديل حسابات المستخدمين متاح للمدير العام فقط" });
  }

  const targetUserId = req.params.userId;
  const userIdx = systemUsers.findIndex((u) => u.userId === targetUserId);
  if (userIdx === -1) {
    return res.status(404).json({ error: "الحساب غير موجود" });
  }

  const { username, password, name, phone, email, basicSalary, jobTitle } = req.body;

  if (username && username.trim().toLowerCase() !== systemUsers[userIdx].username.toLowerCase()) {
    const conflict = systemUsers.some(
      (u) => u.userId !== targetUserId && u.username.toLowerCase() === username.trim().toLowerCase()
    );
    if (conflict) {
      return res.status(400).json({ error: "اسم المستخدم الجديد مستخدم بالفعل من قبل حساب آخر" });
    }
  }

  systemUsers[userIdx] = {
    ...systemUsers[userIdx],
    username: username ? username.trim() : systemUsers[userIdx].username,
    password: password ? password.trim() : systemUsers[userIdx].password,
    name: name ? name.trim() : systemUsers[userIdx].name,
    phone: phone !== undefined ? phone : systemUsers[userIdx].phone,
    email: email !== undefined ? email : systemUsers[userIdx].email,
  };

  // If this user has an employeeId, keep the employee profile synced
  if (systemUsers[userIdx].employeeId) {
    const empIdx = serverState.employees.findIndex((e) => e.id === systemUsers[userIdx].employeeId);
    if (empIdx !== -1) {
      serverState.employees[empIdx] = {
        ...serverState.employees[empIdx],
        name: systemUsers[userIdx].name,
        phone: systemUsers[userIdx].phone || serverState.employees[empIdx].phone,
        email: systemUsers[userIdx].email || serverState.employees[empIdx].email,
        basicSalary: basicSalary !== undefined ? (Number(basicSalary) || serverState.employees[empIdx].basicSalary) : serverState.employees[empIdx].basicSalary,
        role: jobTitle || serverState.employees[empIdx].role,
        updatedAt: new Date().toISOString(),
      };
      serverState.version += 1;
      saveServerState(serverState);
      broadcastSSE("employees_update", serverState.employees);
    }
  }

  saveUsers(systemUsers);
  res.json({ success: true, user: systemUsers[userIdx] });
});

app.delete("/api/admin/users/:userId", (req, res) => {
  const adminUser = getAuthenticatedUser(req);
  if (!adminUser || adminUser.role !== "manager") {
    return res.status(403).json({ error: "حذف الحسابات متاح للمدير العام فقط" });
  }

  const targetUserId = req.params.userId;
  if (targetUserId === "USR-001") {
    return res.status(400).json({ error: "لا يمكن حذف الحساب الإداري الرئيسي للمدير العام" });
  }

  const userIdx = systemUsers.findIndex((u) => u.userId === targetUserId);
  if (userIdx === -1) {
    return res.status(404).json({ error: "الحساب غير موجود" });
  }

  systemUsers.splice(userIdx, 1);
  saveUsers(systemUsers);

  res.json({ success: true, message: "تم حذف الحساب بنجاح" });
});


app.get("/api/auth/me", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: "جلسة منتهية أو غير صالحة" });
  }

  res.json({
    userId: user.userId,
    username: user.username,
    name: user.name,
    role: user.role,
    employeeId: user.employeeId,
  });
});

app.post("/api/auth/logout", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (user) {
    activeSessions.delete(user.token);
  }
  res.json({ success: true });
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    app: "hisabi",
    serverVersion: serverState.version,
    clientsConnected: sseClients.length,
    totalTransactions: serverState.transactions.length,
  });
});

// -------------------------------------------------------------
// REAL-TIME SSE STREAM (Token Authenticated)
// -------------------------------------------------------------
app.get("/api/sync/stream", (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    res.status(401).json({ error: "غير مصرح - مطلوب تسجيل الدخول" });
    return;
  }

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  const clientId = `client-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const client: SSEClient = { 
    id: clientId, 
    userId: user.userId, 
    role: user.role, 
    employeeId: user.employeeId, 
    name: user.name,
    res 
  };
  sseClients.push(client);

  // Send initial handshake
  res.write(`event: connected\ndata: ${JSON.stringify({ clientId, serverVersion: serverState.version, role: user.role })}\n\n`);

  req.on("close", () => {
    sseClients = sseClients.filter((c) => c.id !== clientId);
  });
});

// -------------------------------------------------------------
// AUTHORITATIVE SYNC STATE (Strict Multi-User Isolation)
// -------------------------------------------------------------
app.get("/api/sync/state", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: "غير مصرح - يرجى تسجيل الدخول" });
  }

  if (user.role === "manager") {
    // Manager has complete visibility into all employees and transactions
    return res.json({
      serverVersion: serverState.version,
      employees: serverState.employees,
      transactions: serverState.transactions,
      settings: serverState.settings,
      notifications: serverState.notifications,
      activities: serverState.activities,
      conflicts: serverState.conflicts.filter((c) => !c.resolved),
    });
  } else {
    // STRICT MULTI-USER ISOLATION:
    // Employee ONLY sees their own employee record, their own transactions, and their own notifications/activities
    const myTransactions = serverState.transactions.filter(
      (tx) => tx.employeeId === user.employeeId
    );
    const myEmployeeRecord = serverState.employees.filter(
      (emp) => emp.id === user.employeeId
    );
    const myNotifications = serverState.notifications.filter(
      (n) => n.targetUser === user.employeeId
    );
    const myActivities = serverState.activities.filter(
      (a) => (a.employeeId && a.employeeId === user.employeeId) || a.employeeName === user.name
    );

    return res.json({
      serverVersion: serverState.version,
      employees: myEmployeeRecord,
      transactions: myTransactions,
      settings: {
        currency: serverState.settings.currency,
        companyName: serverState.settings.companyName,
        managerBypassConfirmation: false,
        enablePushNotifications: serverState.settings.enablePushNotifications,
      },
      notifications: myNotifications,
      activities: myActivities,
      conflicts: [],
    });
  }
});

// -------------------------------------------------------------
// PUSH OPERATIONS FROM CLIENT SYNC QUEUE (Strict Validation)
// -------------------------------------------------------------
app.post("/api/sync/push", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: "غير مصرح - يرجى تسجيل الدخول" });
  }

  const { operations } = req.body as { operations: SyncQueueItem[] };

  if (!Array.isArray(operations) || operations.length === 0) {
    return res.status(400).json({ error: "No operations provided" });
  }

  const processedIds: string[] = [];
  const conflictsCreated: ConflictRecord[] = [];
  const newActivities: ActivityItem[] = [];
  const newNotifications: NotificationItem[] = [];

  for (const op of operations) {
    const tx = op.data;

    // Strict Security Check: Employee can ONLY manipulate transactions for their own employeeId!
    if (user.role !== "manager" && tx.employeeId !== user.employeeId) {
      console.warn(`BLOCKED MUTATION: user ${user.username} (${user.employeeId}) attempted modifying tx for ${tx.employeeId}`);
      continue;
    }

    if (op.operation === "create") {
      const existing = serverState.transactions.find((t) => t.id === tx.id);
      if (!existing) {
        const newTx: Transaction = {
          ...tx,
          employeeId: user.role === "manager" ? tx.employeeId : user.employeeId!,
          employeeName: user.role === "manager" ? tx.employeeName : user.name,
          recordedBy: user.role === "manager" ? "المدير العام" : user.name,
          createdBy: user.role === "manager" ? "المدير العام" : user.name,
          updatedBy: user.role === "manager" ? "المدير العام" : user.name,
          version: 1,
          syncStatus: "synced",
          updatedAt: new Date().toISOString(),
          createdAt: tx.createdAt || new Date().toISOString(),
        };
        serverState.transactions.unshift(newTx);

        // Activity log strictly scoped with employeeId
        const act: ActivityItem = {
          id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          actorName: user.role === "manager" ? "المدير العام" : user.name,
          actorRole: user.role,
          action: "create",
          transactionType: tx.type,
          amount: tx.amount,
          employeeName: newTx.employeeName,
          employeeId: newTx.employeeId,
          details: `${newTx.recordedBy} سجّل ${tx.type === "commission" ? "عمولة" : tx.type === "withdrawal" ? "سحبة" : tx.type === "expense" ? "مصروف" : "راتب"} بقيمة ${tx.amount} ريال (${tx.description})`,
          timestamp: new Date().toISOString(),
        };
        newActivities.push(act);
        serverState.activities.unshift(act);

        // Notification for the affected employee (Strictly isolated!)
        const notifEmp: NotificationItem = {
          id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          title: `تسجيل ${tx.type === "commission" ? "عمولة جديدة" : tx.type === "withdrawal" ? "سحبة نقدية" : tx.type === "expense" ? "مصروف" : "راتب"}`,
          message: `${newTx.recordedBy} قام بتسجيل ${tx.amount} ريال لصالح ${newTx.employeeName} (${tx.description})`,
          timestamp: new Date().toISOString(),
          type: tx.type,
          targetUser: newTx.employeeId,
          read: false,
          linkId: tx.id,
        };
        newNotifications.push(notifEmp);
        serverState.notifications.unshift(notifEmp);

        // If employee created it, notify manager (Admin overview)
        if (user.role !== "manager") {
          const notifMgr: NotificationItem = {
            id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            title: `عملية جديدة: ${newTx.employeeName}`,
            message: `${newTx.employeeName} سجّل ${tx.type === "commission" ? "عمولة" : tx.type === "withdrawal" ? "سحبة" : tx.type === "expense" ? "مصروف" : "راتب"} بقيمة ${tx.amount} ريال (${tx.description})`,
            timestamp: new Date().toISOString(),
            type: tx.type,
            targetUser: "manager",
            read: false,
            linkId: tx.id,
          };
          newNotifications.push(notifMgr);
          serverState.notifications.unshift(notifMgr);
        }

        processedIds.push(op.id);
      } else {
        processedIds.push(op.id);
      }
    } else if (op.operation === "update") {
      const idx = serverState.transactions.findIndex((t) => t.id === tx.id);
      if (idx !== -1) {
        const existing = serverState.transactions[idx];
        if (user.role !== "manager" && existing.employeeId !== user.employeeId) {
          console.warn(`BLOCKED UPDATE: user ${user.username} tried updating tx ${tx.id} for ${existing.employeeId}`);
          continue;
        }

        // Conflict check: if version mismatch and updatedAt differs
        if (existing.version > (tx.version || 1) && existing.deviceId !== tx.deviceId) {
          const conflict: ConflictRecord = {
            id: `conf-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            transactionId: tx.id,
            localVersion: tx,
            remoteVersion: existing,
            conflictTime: new Date().toISOString(),
            resolved: false,
          };
          serverState.conflicts.unshift(conflict);
          conflictsCreated.push(conflict);

          const conflictNotif: NotificationItem = {
            id: `notif-${Date.now()}`,
            title: "تنبيه تعارض في بيانات عملية مالية",
            message: `حدث تعارض بين جهازين عند تعديل العملية (${tx.id} - ${tx.description}). يرجى مراجعتها من لوحة الإدارة.`,
            timestamp: new Date().toISOString(),
            type: "conflict",
            targetUser: "manager",
            read: false,
            linkId: tx.id,
          };
          serverState.notifications.unshift(conflictNotif);
          newNotifications.push(conflictNotif);
        } else {
          serverState.transactions[idx] = {
            ...tx,
            version: (existing.version || 1) + 1,
            updatedAt: new Date().toISOString(),
            updatedBy: user.name,
            syncStatus: "synced",
          };

          const act: ActivityItem = {
            id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            actorName: user.name,
            actorRole: user.role,
            action: "update",
            transactionType: tx.type,
            amount: tx.amount,
            employeeName: tx.employeeName,
            employeeId: tx.employeeId,
            details: `تم تعديل بيانات العملية ${tx.id} (${tx.description})`,
            timestamp: new Date().toISOString(),
          };
          serverState.activities.unshift(act);
          newActivities.push(act);

          // Notification to the employee
          const updateNotifEmp: NotificationItem = {
            id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            title: "تحديث عملية مالية",
            message: `تم تعديل بيانات العملية (${tx.description}) بقيمة ${tx.amount} ريال`,
            timestamp: new Date().toISOString(),
            type: tx.type,
            targetUser: tx.employeeId,
            read: false,
            linkId: tx.id,
          };
          serverState.notifications.unshift(updateNotifEmp);
          newNotifications.push(updateNotifEmp);

          if (user.role !== "manager") {
            const updateNotifMgr: NotificationItem = {
              id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              title: `تعديل عملية: ${tx.employeeName}`,
              message: `${user.name} قام بتعديل العملية (${tx.description}) إلى ${tx.amount} ريال`,
              timestamp: new Date().toISOString(),
              type: tx.type,
              targetUser: "manager",
              read: false,
              linkId: tx.id,
            };
            serverState.notifications.unshift(updateNotifMgr);
            newNotifications.push(updateNotifMgr);
          }
        }
        processedIds.push(op.id);
      }
    } else if (op.operation === "cancel") {
      // Cancellation allowed for manager OR employee for their own transaction
      if (user.role !== "manager" && tx.employeeId !== user.employeeId) {
        console.warn(`BLOCKED CANCELLATION: user ${user.username} tried cancelling tx ${tx.id} for other employee ${tx.employeeId}`);
        continue;
      }
      const idx = serverState.transactions.findIndex((t) => t.id === tx.id);
      if (idx !== -1) {
        const targetTx = serverState.transactions[idx];
        const actorName = user.role === "manager" ? "المدير العام" : user.name;
        targetTx.status = "cancelled";
        targetTx.cancelledAt = new Date().toISOString();
        targetTx.cancelledBy = actorName;
        targetTx.version = (targetTx.version || 1) + 1;
        targetTx.syncStatus = "synced";

        const act: ActivityItem = {
          id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          actorName,
          actorRole: user.role,
          action: "cancel",
          transactionType: targetTx.type,
          amount: targetTx.amount,
          employeeName: targetTx.employeeName,
          employeeId: targetTx.employeeId,
          details: `تم إلغاء العملية ${targetTx.id} (${targetTx.description}) بواسطة ${actorName}`,
          timestamp: new Date().toISOString(),
        };
        serverState.activities.unshift(act);
        newActivities.push(act);

        // Notification for the employee whose transaction was cancelled
        const cancelNotif: NotificationItem = {
          id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          title: "إلغاء عملية مالية",
          message: `تم إلغاء العملية (${targetTx.description}) بقيمة ${targetTx.amount} ريال بواسطة ${actorName}`,
          timestamp: new Date().toISOString(),
          type: targetTx.type,
          targetUser: targetTx.employeeId,
          read: false,
          linkId: targetTx.id,
        };
        serverState.notifications.unshift(cancelNotif);
        newNotifications.push(cancelNotif);

        // If employee cancelled, also inform manager
        if (user.role !== "manager") {
          const cancelNotifMgr: NotificationItem = {
            id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            title: `إلغاء عملية: ${targetTx.employeeName}`,
            message: `قام الموظف ${user.name} بإلغاء العملية (${targetTx.description}) بقيمة ${targetTx.amount} ريال`,
            timestamp: new Date().toISOString(),
            type: targetTx.type,
            targetUser: "manager",
            read: false,
            linkId: targetTx.id,
          };
          serverState.notifications.unshift(cancelNotifMgr);
          newNotifications.push(cancelNotifMgr);
        }

        processedIds.push(op.id);
      }
    }
  }

  serverState.version += 1;
  saveServerState(serverState);

  broadcastSSE("sync_update", {
    serverVersion: serverState.version,
    updatedTransactions: serverState.transactions,
    newActivities,
    newNotifications,
  });

  res.json({
    success: true,
    processedIds,
    serverVersion: serverState.version,
    conflicts: conflictsCreated,
  });
});

// Conflict Resolution
app.post("/api/sync/resolve-conflict", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: "غير مصرح" });

  const { conflictId, resolution } = req.body;
  const conflict = serverState.conflicts.find((c) => c.id === conflictId);
  if (!conflict) {
    return res.status(404).json({ error: "Conflict record not found" });
  }

  // If employee, can only resolve conflict for their own transactions
  if (user.role !== "manager" && conflict.localVersion.employeeId !== user.employeeId) {
    return res.status(403).json({ error: "غير مصرح لك بحل تعارض يخص موظفاً آخر" });
  }

  conflict.resolved = true;
  conflict.resolvedAt = new Date().toISOString();
  conflict.resolution = resolution;

  if (resolution === "keep_local") {
    const idx = serverState.transactions.findIndex((t) => t.id === conflict.transactionId);
    if (idx !== -1) {
      serverState.transactions[idx] = {
        ...conflict.localVersion,
        version: serverState.transactions[idx].version + 1,
        updatedAt: new Date().toISOString(),
      };
    }
  }

  serverState.version += 1;
  saveServerState(serverState);

  broadcastSSE("sync_update", {
    serverVersion: serverState.version,
    updatedTransactions: serverState.transactions,
  });

  res.json({ success: true, conflict });
});

// Mark all notifications as read (Isolated per user)
app.post("/api/notifications/mark-all-read", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: "غير مصرح" });

  serverState.notifications = serverState.notifications.map((n) => {
    if (user.role === "manager") {
      return { ...n, read: true };
    }
    if (n.targetUser === user.employeeId) {
      return { ...n, read: true };
    }
    return n;
  });
  saveServerState(serverState);
  res.json({ success: true });
});

// Update settings (Manager only)
app.post("/api/settings", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user || user.role !== "manager") {
    return res.status(403).json({ error: "تعديل الإعدادات متاح للمدير العام فقط" });
  }

  serverState.settings = {
    ...serverState.settings,
    ...req.body,
  };
  serverState.version += 1;
  saveServerState(serverState);
  broadcastSSE("settings_update", serverState.settings);
  res.json({ success: true, settings: serverState.settings });
});

// Employee Management (Strictly Manager Only)
app.get("/api/employees/:id", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: "غير مصرح" });

  if (user.role !== "manager" && user.employeeId !== req.params.id) {
    return res.status(403).json({ error: "Permission Denied: غير مصرح لك بالوصول لبيانات هذا الموظف" });
  }

  const emp = serverState.employees.find((e) => e.id === req.params.id);
  if (!emp) return res.status(404).json({ error: "الموظف غير موجود" });
  return res.json(emp);
});

app.post("/api/employees", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user || user.role !== "manager") {
    return res.status(403).json({ error: "إضافة وتعديل الموظفين مقتصر على المدير العام فقط" });
  }

  const emp = req.body;
  serverState.employees.push(emp);
  serverState.version += 1;
  saveServerState(serverState);
  broadcastSSE("employees_update", serverState.employees);
  res.json({ success: true, employee: emp });
});

app.put("/api/employees/:id", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user || user.role !== "manager") {
    return res.status(403).json({ error: "تعديل بيانات الموظفين مقتصر على المدير العام فقط" });
  }

  const idx = serverState.employees.findIndex((e) => e.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: "الموظف غير موجود" });
  }

  serverState.employees[idx] = {
    ...serverState.employees[idx],
    ...req.body,
    updatedAt: new Date().toISOString(),
  };
  serverState.version += 1;
  saveServerState(serverState);
  broadcastSSE("employees_update", serverState.employees);
  res.json({ success: true, employee: serverState.employees[idx] });
});

// Reset server state to defaults (Manager only)
app.post("/api/admin/reset-demo", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user || user.role !== "manager") {
    return res.status(403).json({ error: "إعادة ضبط النظام متاحة للمدير فقط" });
  }

  serverState = {
    version: 1,
    employees: INITIAL_EMPLOYEES,
    transactions: INITIAL_TRANSACTIONS,
    settings: INITIAL_SETTINGS,
    notifications: INITIAL_NOTIFICATIONS,
    activities: INITIAL_ACTIVITIES,
    conflicts: [],
  };
  saveServerState(serverState);
  systemUsers = [...DEFAULT_USERS];
  saveUsers(systemUsers);
  broadcastSSE("sync_update", {
    serverVersion: serverState.version,
    updatedTransactions: serverState.transactions,
    employees: serverState.employees,
  });
  res.json({ success: true });
});

// Natural Language transaction parser endpoint using Gemini
app.post("/api/parse-transaction", async (req, res) => {
  const { text } = req.body;
  if (!text || typeof text !== "string") {
    return res.status(400).json({ error: "Text is required" });
  }

  const ai = getGeminiClient();
  if (!ai) {
    return res.status(503).json({
      error: "Gemini API key not configured on server",
      fallbackToLocal: true,
    });
  }

  try {
    const todayStr = new Date().toISOString().split("T")[0];
    const systemPrompt = `أنت مساعد مالي ذكي لتطبيق "حسابي". مهمتك تحليل النص العربي المدخل واستخراج تفاصيل العملية المالية بدقة بالغة.
التاريخ الحالي اليوم هو: ${todayStr}.
أنواع العمليات المتاحة 4 فقط:
1. "commission" (عمولة) - مثل: عمولة، بونص، حافز، لي عمولة، حصلت على عمولة، أضف لي عمولة.
2. "withdrawal" (سحبة) - مثل: سحبت، أخذت من الراتب، سلفة، دفعة، لي سحب.
3. "expense" (مصروف) - مثل: صرفت، دفعت، بنزين، قهوة، غداء، مطعم، فاتورة، مصروف، شراء أغراض عمل.
4. "salary" (راتب) - تعديل أو تسجيل راتب أساسي.

إذا لم يذكر المبلغ بوضوح أو كان مجهولاً، اجعل amount = null و clarificationNeeded = true مع كتابة clarificationQuestion تسأل المستخدم بلباقة عن المبلغ.
حدد أيضاً التصنيف والوصف وتاريخ العملية (إذا ذكر اليوم أو أمس أو تاريخ محدد، حوله لصيغة YYYY-MM-DD، وإذا لم يذكر فاجعله ${todayStr}).`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: `قم بتحليل هذه العملية المالية المدخلة باللغة العربية: "${text}"`,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            type: {
              type: Type.STRING,
              description: "نوع العملية: commission أو withdrawal أو expense أو salary",
            },
            amount: {
              type: Type.NUMBER,
              description: "المبلغ بالأرقام، أو null إن لم يحدد بدقة",
            },
            category: {
              type: Type.STRING,
              description: "التصنيف المناسب باللغة العربية (مثل: عمولة مبيعات، سلفة، وقود ومواصلات، ضيافة، طعام، مستلزمات)",
            },
            description: {
              type: Type.STRING,
              description: "وصف موجز وواضح للعملية باللغة العربية",
            },
            date: {
              type: Type.STRING,
              description: "تاريخ العملية بصيغة YYYY-MM-DD",
            },
            clarificationNeeded: {
              type: Type.BOOLEAN,
              description: "هل المبلغ غير واضح ويحتاج توضيح من المستخدم؟",
            },
            clarificationQuestion: {
              type: Type.STRING,
              description: "سؤال التوضيح للمستخدم إن كان المبلغ غير واضح",
            },
            confidence: {
              type: Type.NUMBER,
              description: "درجة الثقة من 0 إلى 1",
            },
          },
          required: ["type", "category", "description", "clarificationNeeded"],
        },
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    return res.json(parsed);
  } catch (error: any) {
    console.error("Gemini NLP parsing error:", error);
    return res.status(500).json({
      error: error?.message || "Failed to parse natural language",
      fallbackToLocal: true,
    });
  }
});

// Setup Vite or static serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`حسابي - Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
