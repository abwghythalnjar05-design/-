import React, { useState, useEffect } from 'react';
import { AppSettings, Employee, UserAccount } from '../types';
import { 
  SlidersHorizontal, 
  X, 
  Save, 
  RotateCcw, 
  ShieldAlert, 
  Check, 
  Phone, 
  MessageCircle, 
  Users, 
  KeyRound, 
  Eye, 
  EyeOff, 
  Copy, 
  UserPlus, 
  Edit3, 
  Trash2, 
  Share2, 
  CheckCircle2, 
  AlertCircle,
  Briefcase,
  DollarSign,
  Lock,
  RefreshCw,
  Smartphone,
  Download,
  WifiOff
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSaveSettings: (newSettings: AppSettings) => void;
  onResetDemo: () => void;
  isManager: boolean;
  authToken?: string | null;
  employees?: Employee[];
  onEmployeesChange?: (employees: Employee[]) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  onResetDemo,
  isManager,
  authToken,
  employees = [],
  onEmployeesChange,
}) => {
  if (!isOpen) return null;

  // Active Tab: 'accounts' | 'general' | 'android'
  const [activeTab, setActiveTab] = useState<'accounts' | 'general' | 'android'>('accounts');

  // General Settings Form State
  const [currency, setCurrency] = useState(settings.currency);
  const [companyName, setCompanyName] = useState(settings.companyName);
  const [managerBypassConfirmation, setManagerBypassConfirmation] = useState(
    settings.managerBypassConfirmation
  );
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Accounts Management State
  const [accounts, setAccounts] = useState<UserAccount[]>([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);
  const [accountsError, setAccountsError] = useState<string | null>(null);
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [copiedUserId, setCopiedUserId] = useState<string | null>(null);

  // New Account / Edit Modal state
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);

  // Form fields for Add / Edit
  const [formName, setFormName] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState<'manager' | 'employee'>('employee');
  const [formJobTitle, setFormJobTitle] = useState('');
  const [formSalary, setFormSalary] = useState<number | string>(3000);
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmittingUser, setIsSubmittingUser] = useState(false);

  // Load user accounts from server
  const fetchAccounts = async () => {
    if (!isManager) return;
    setIsLoadingAccounts(true);
    setAccountsError(null);

    try {
      const res = await fetch('/api/admin/users', {
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
      });

      if (!res.ok) {
        throw new Error('فشل جلب قائمة الحسابات');
      }

      const data = await res.json();
      if (data.users) {
        setAccounts(data.users);
      }
    } catch (err: any) {
      console.warn('Using local accounts fallback:', err);
      // Fallback initial accounts
      setAccounts([
        {
          userId: 'USR-001',
          username: 'manager',
          password: 'admin123',
          name: 'المدير العام',
          role: 'manager',
          employeeId: null,
          phone: '0570936035',
          email: 'manager@hisabi.com',
        },
        {
          userId: 'USR-002',
          username: 'ali',
          password: '1234',
          name: 'علي',
          role: 'employee',
          employeeId: 'emp-1',
          phone: '0501234567',
          email: 'ali@hisabi.com',
        },
      ]);
    } finally {
      setIsLoadingAccounts(false);
    }
  };

  useEffect(() => {
    if (isOpen && isManager) {
      fetchAccounts();
    }
  }, [isOpen, isManager]);

  // Handle General Settings Submit
  const handleGeneralSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isManager) return;

    onSaveSettings({
      currency,
      companyName,
      managerBypassConfirmation,
    });
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  // Toggle password visibility
  const togglePasswordVisibility = (userId: string) => {
    setVisiblePasswords((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  // Generate a friendly 4-6 digit or alpha password
  const generateRandomPassword = () => {
    const num = Math.floor(1000 + Math.random() * 9000);
    setFormPassword(num.toString());
  };

  // Copy credentials formatted for WhatsApp / SMS
  const handleCopyCredentials = (acc: UserAccount) => {
    const text = `بيانات الدخول إلى نظام "حسابي" المالي:
الاسم: ${acc.name}
الدور: ${acc.role === 'manager' ? 'المدير العام' : 'موظف'}
اسم المستخدم: ${acc.username}
كلمة المرور: ${acc.password || '••••'}
تطبيق حسابي المطور بواسطة أبو غيث النجار 2026`;

    navigator.clipboard.writeText(text);
    setCopiedUserId(acc.userId);
    setTimeout(() => setCopiedUserId(null), 3000);
  };

  // Open Edit User Modal
  const handleOpenEdit = (acc: UserAccount) => {
    setEditingUser(acc);
    setFormName(acc.name);
    setFormUsername(acc.username);
    setFormPassword(acc.password || '');
    setFormRole(acc.role);
    setFormPhone(acc.phone || '');
    setFormEmail(acc.email || '');

    const linkedEmp = employees.find((e) => e.id === acc.employeeId);
    if (linkedEmp) {
      setFormJobTitle(linkedEmp.role);
      setFormSalary(linkedEmp.basicSalary);
    } else {
      setFormJobTitle('موظف مبيعات');
      setFormSalary(3000);
    }

    setFormError(null);
    setIsAddingUser(true);
  };

  // Open Add New User Modal
  const handleOpenAdd = () => {
    setEditingUser(null);
    setFormName('');
    setFormUsername('');
    setFormPassword(Math.floor(1000 + Math.random() * 9000).toString());
    setFormRole('employee');
    setFormJobTitle('موظف مبيعات وتطوير أعمال');
    setFormSalary(3000);
    setFormPhone('');
    setFormEmail('');
    setFormError(null);
    setIsAddingUser(true);
  };

  // Submit Add or Edit User
  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formUsername.trim() || !formPassword.trim()) {
      setFormError('يرجى ملء جميع الحقول الإلزامية (الاسم، اسم المستخدم، كلمة المرور)');
      return;
    }

    setIsSubmittingUser(true);
    setFormError(null);

    try {
      const payload = {
        name: formName.trim(),
        username: formUsername.trim(),
        password: formPassword.trim(),
        role: formRole,
        phone: formPhone.trim(),
        email: formEmail.trim(),
        jobTitle: formJobTitle.trim(),
        basicSalary: Number(formSalary) || 3000,
      };

      if (editingUser) {
        // PUT update
        const res = await fetch(`/api/admin/users/${editingUser.userId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
          },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'فشل تحديث الحساب');

        setAccounts((prev) =>
          prev.map((u) => (u.userId === editingUser.userId ? data.user : u))
        );

        // Also update local employee list if synced
        if (data.user.employeeId && onEmployeesChange) {
          onEmployeesChange(
            employees.map((e) =>
              e.id === data.user.employeeId
                ? {
                    ...e,
                    name: data.user.name,
                    phone: data.user.phone,
                    email: data.user.email,
                    role: formJobTitle || e.role,
                    basicSalary: Number(formSalary) || e.basicSalary,
                  }
                : e
            )
          );
        }
      } else {
        // POST create
        const res = await fetch('/api/admin/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
          },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'فشل إنشاء الحساب');

        setAccounts((prev) => [...prev, data.user]);

        // If new employee was created on server, refresh employees
        if (onEmployeesChange && data.user.employeeId) {
          const newEmp: Employee = {
            id: data.user.employeeId,
            name: data.user.name,
            role: formJobTitle || 'موظف مبيعات',
            basicSalary: Number(formSalary) || 3000,
            phone: data.user.phone,
            email: data.user.email,
            joinDate: new Date().toISOString().split('T')[0],
            status: 'active',
          };
          onEmployeesChange([...employees, newEmp]);
        }
      }

      setIsAddingUser(false);
      setEditingUser(null);
    } catch (err: any) {
      setFormError(err.message || 'حدث خطأ أثناء حفظ الحساب');
    } finally {
      setIsSubmittingUser(false);
    }
  };

  // Delete User Account
  const handleDeleteUser = async (userId: string) => {
    if (userId === 'USR-001') {
      alert('لا يمكن حذف حساب المدير العام الرئيسي');
      return;
    }

    if (!confirm('هل أنت متأكد من حذف هذا الحساب نهائياً؟')) return;

    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'فشل حذف الحساب');
      }

      setAccounts((prev) => prev.filter((u) => u.userId !== userId));
    } catch (err: any) {
      alert(err.message || 'حدث خطأ أثناء الحذف');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        id="app-settings-modal"
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden text-right max-h-[90vh] flex flex-col"
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center font-bold">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">إدارة النظام وإعدادات الحسابات</h3>
              <p className="text-xs text-slate-500">لوحة المدير العام الحصرية لإدارة صلاحيات الموظفين والنظام</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Security Lock for Non-Managers */}
        {!isManager ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
              <Lock className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h4 className="text-lg font-bold text-slate-900">غير مصرح بالوصول إلى إعدادات النظام</h4>
              <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                وفقاً لسياسات الأمان والعزل المالي، لا يمتلك الموظف أي صلاحية للاطلاع على إعدادات الحسابات أو تعديل قواعد النظام. هذه الميزة متاحة للمدير العام فقط.
              </p>
            </div>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl"
            >
              إغلاق النافذة
            </button>
          </div>
        ) : (
          <>
            {/* Tab Navigation */}
            <div className="flex border-b border-slate-200 bg-slate-100/60 p-1.5 gap-1.5 shrink-0">
              <button
                type="button"
                id="settings-tab-accounts"
                onClick={() => {
                  setActiveTab('accounts');
                  setIsAddingUser(false);
                }}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'accounts'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <Users className="w-4 h-4 text-emerald-600" />
                <span>إدارة الحسابات وكلمات المرور</span>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0.2 rounded-full">
                  {accounts.length}
                </span>
              </button>

              <button
                type="button"
                id="settings-tab-general"
                onClick={() => {
                  setActiveTab('general');
                  setIsAddingUser(false);
                }}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'general'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <SlidersHorizontal className="w-4 h-4 text-slate-600" />
                <span>إعدادات النظام المالي</span>
              </button>

              <button
                type="button"
                id="settings-tab-android"
                onClick={() => {
                  setActiveTab('android');
                  setIsAddingUser(false);
                }}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'android'
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <Smartphone className="w-4 h-4 text-emerald-600" />
                <span>تطبيق أندرويد (PWA)</span>
              </button>
            </div>

            {/* Modal Body with Scroll */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* TAB 1: ACCOUNTS & CREDENTIALS */}
              {activeTab === 'accounts' && (
                <div className="space-y-4">
                  {/* Top Bar: Explainer & Add User Button */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl text-xs">
                    <div>
                      <div className="font-bold text-amber-950 flex items-center gap-1.5">
                        <KeyRound className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>مشاركة كلمات المرور للموظفين:</span>
                      </div>
                      <p className="text-amber-800 text-[11px] mt-0.5 leading-relaxed">
                        يتم إنشاء اسم المستخدم وكلمة المرور من هنا حصراً، ومشاركتها يدوياً مع الموظف الجديد للبدء بالعمل دون منحه صلاحية تغيير الإعدادات.
                      </p>
                    </div>

                    <button
                      type="button"
                      id="add-new-user-btn"
                      onClick={handleOpenAdd}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shrink-0 shadow-xs cursor-pointer"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>إضافة حساب موظف جديد</span>
                    </button>
                  </div>

                  {/* Add / Edit Form Modal Inline */}
                  {isAddingUser && (
                    <form onSubmit={handleSaveUser} className="p-4 bg-slate-50 border-2 border-emerald-500 rounded-2xl space-y-3 animate-in fade-in duration-150">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                        <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                          {editingUser ? <Edit3 className="w-4 h-4 text-emerald-600" /> : <UserPlus className="w-4 h-4 text-emerald-600" />}
                          {editingUser ? `تعديل ملف الحساب: ${editingUser.name}` : 'إنشاء حساب موظف جديد'}
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsAddingUser(false)}
                          className="text-slate-400 hover:text-slate-600 p-1"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {formError && (
                        <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-1.5">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span>{formError}</span>
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="space-y-1">
                          <label className="font-bold text-slate-700 block">الاسم بالكامل *</label>
                          <input
                            type="text"
                            required
                            placeholder="مثال: أحمد منصور"
                            value={formName}
                            onChange={(e) => setFormName(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-hidden focus:border-emerald-500"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="font-bold text-slate-700 block">اسم المستخدم للدخول (Username) *</label>
                          <input
                            type="text"
                            required
                            placeholder="مثال: ahmed"
                            value={formUsername}
                            onChange={(e) => setFormUsername(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono focus:outline-hidden focus:border-emerald-500"
                            dir="ltr"
                          />
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <label className="font-bold text-slate-700 block">كلمة المرور *</label>
                            <button
                              type="button"
                              onClick={generateRandomPassword}
                              className="text-[10px] text-emerald-600 font-bold hover:underline"
                            >
                              توليد عشوائي
                            </button>
                          </div>
                          <input
                            type="text"
                            required
                            placeholder="كلمة المرور"
                            value={formPassword}
                            onChange={(e) => setFormPassword(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono focus:outline-hidden focus:border-emerald-500"
                            dir="ltr"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="font-bold text-slate-700 block">المسمى الوظيفي</label>
                          <input
                            type="text"
                            placeholder="مثال: موظف مبيعات وتطوير أعمال"
                            value={formJobTitle}
                            onChange={(e) => setFormJobTitle(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-hidden focus:border-emerald-500"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="font-bold text-slate-700 block">الراتب الأساسي الشهري ({currency})</label>
                          <input
                            type="number"
                            min="0"
                            step="100"
                            value={formSalary}
                            onChange={(e) => setFormSalary(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono focus:outline-hidden focus:border-emerald-500"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="font-bold text-slate-700 block">رقم الجوال (للمشاركة عبر واتساب)</label>
                          <input
                            type="tel"
                            placeholder="05xxxxxxxx"
                            value={formPhone}
                            onChange={(e) => setFormPhone(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono focus:outline-hidden focus:border-emerald-500"
                            dir="ltr"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                        <button
                          type="button"
                          onClick={() => setIsAddingUser(false)}
                          className="px-3.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold"
                        >
                          إلغاء
                        </button>
                        <button
                          type="submit"
                          disabled={isSubmittingUser}
                          className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>{editingUser ? 'حفظ التعديلات' : 'إنشاء الحساب فوراً'}</span>
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Accounts List Cards */}
                  <div className="space-y-2.5">
                    {isLoadingAccounts ? (
                      <div className="p-8 text-center text-slate-400 text-xs">
                        جاري تحميل قائمة الحسابات...
                      </div>
                    ) : accounts.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 text-xs">
                        لا توجد حسابات مسجلة بعد. اضغط على "إضافة حساب موظف جديد" للبدء.
                      </div>
                    ) : (
                      accounts.map((acc) => {
                        const isVisible = !!visiblePasswords[acc.userId];
                        const isCopied = copiedUserId === acc.userId;
                        const linkedEmp = employees.find((e) => e.id === acc.employeeId);

                        return (
                          <div
                            key={acc.userId}
                            className="p-3.5 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-xs transition-all space-y-2.5 shadow-2xs"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-start gap-2.5">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 ${
                                  acc.role === 'manager' 
                                    ? 'bg-slate-900 text-amber-400' 
                                    : 'bg-emerald-100 text-emerald-800'
                                }`}>
                                  {acc.name.charAt(0)}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-slate-900 text-sm">{acc.name}</span>
                                    <span
                                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                        acc.role === 'manager'
                                          ? 'bg-purple-100 text-purple-700 border border-purple-200'
                                          : 'bg-blue-100 text-blue-700 border border-blue-200'
                                      }`}
                                    >
                                      {acc.role === 'manager' ? 'المدير العام' : 'موظف'}
                                    </span>
                                  </div>
                                  <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                                    {linkedEmp && (
                                      <span>{linkedEmp.role} • راتب: {linkedEmp.basicSalary} {currency}</span>
                                    )}
                                    {acc.phone && (
                                      <span dir="ltr" className="font-mono text-slate-600">{acc.phone}</span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEdit(acc)}
                                  className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                                  title="تعديل الحساب وكلمة المرور"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>

                                {acc.userId !== 'USR-001' && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteUser(acc.userId)}
                                    className="p-1.5 text-slate-400 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                    title="حذف الحساب"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Credentials Strip */}
                            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                              <div className="flex items-center gap-4">
                                <div>
                                  <span className="text-slate-400 block text-[10px]">اسم المستخدم:</span>
                                  <span className="font-mono font-bold text-slate-800" dir="ltr">
                                    {acc.username}
                                  </span>
                                </div>
                                <div className="border-r border-slate-200 pr-3">
                                  <span className="text-slate-400 block text-[10px]">كلمة المرور:</span>
                                  <div className="flex items-center gap-1">
                                    <span className="font-mono font-bold text-slate-900" dir="ltr">
                                      {isVisible ? acc.password : '••••••••'}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => togglePasswordVisibility(acc.userId)}
                                      className="text-slate-400 hover:text-slate-600 p-0.5"
                                    >
                                      {isVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                    </button>
                                  </div>
                                </div>
                              </div>

                              {/* Action Buttons for sharing */}
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleCopyCredentials(acc)}
                                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                                    isCopied
                                      ? 'bg-emerald-600 text-white'
                                      : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                                  }`}
                                  title="نسخ بيانات الدخول لمشاركتها يدوياً"
                                >
                                  {isCopied ? (
                                    <>
                                      <CheckCircle2 className="w-3 h-3" />
                                      <span>تم النسخ!</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3 h-3 text-slate-500" />
                                      <span>نسخ البيانات</span>
                                    </>
                                  )}
                                </button>

                                {acc.phone && (
                                  <a
                                    href={`https://wa.me/966${acc.phone.replace(/^0+/, '')}?text=${encodeURIComponent(
                                      `مرحباً ${acc.name}، إليك بيانات الدخول إلى تطبيق حسابي:\nاسم المستخدم: ${acc.username}\nكلمة المرور: ${acc.password || ''}`
                                    )}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold flex items-center gap-1 transition-colors"
                                  >
                                    <MessageCircle className="w-3 h-3 text-emerald-600" />
                                    <span>واتساب</span>
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: GENERAL FINANCIAL SETTINGS */}
              {activeTab === 'general' && (
                <form onSubmit={handleGeneralSubmit} className="space-y-4 text-xs">
                  {/* Company Name */}
                  <div className="space-y-1">
                    <label htmlFor="settings-company-name" className="font-bold text-slate-700">
                      اسم الشركة / المؤسسة
                    </label>
                    <input
                      id="settings-company-name"
                      type="text"
                      disabled={!isManager}
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-hidden focus:border-emerald-500 disabled:bg-slate-50 disabled:text-slate-500"
                    />
                  </div>

                  {/* Currency */}
                  <div className="space-y-1">
                    <label htmlFor="settings-currency-select" className="font-bold text-slate-700">
                      رمز العملة الافتراضية
                    </label>
                    <select
                      id="settings-currency-select"
                      disabled={!isManager}
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-hidden focus:border-emerald-500 disabled:bg-slate-50"
                    >
                      <option value="ريال">ريال سعودي (ريال / SAR)</option>
                      <option value="SAR">SAR</option>
                      <option value="ر.س">ر.س</option>
                      <option value="درهم">درهم إماراتي (AED)</option>
                      <option value="د.ك">دينار كويتي (KWD)</option>
                      <option value="ج.م">جنيه مصري (EGP)</option>
                      <option value="$">دولار أمريكي ($)</option>
                    </select>
                  </div>

                  {/* Manager Bypass Confirmation Toggle */}
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-900 block text-xs">
                          تعطيل التأكيد للعمليات المسجلة بواسطة المدير
                        </span>
                        <p className="text-[11px] text-slate-500">
                          عند التفعيل، تُحفظ العمليات التي يدخلها المدير فوراً دون إظهار نافذة التأكيد
                        </p>
                      </div>
                      <input
                        id="manager-bypass-confirm-checkbox"
                        type="checkbox"
                        disabled={!isManager}
                        checked={managerBypassConfirmation}
                        onChange={(e) => setManagerBypassConfirmation(e.target.checked)}
                        className="w-5 h-5 rounded-md border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>

                  {/* Developer Branding & Contact Card */}
                  <div className="p-3.5 rounded-xl bg-slate-900 border border-amber-500/30 text-white">
                    <div className="flex items-center gap-3 mb-2.5">
                      <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/30 p-1 flex items-center justify-center shrink-0">
                        <img
                          src="/app-logo.png"
                          alt="شعار النظام"
                          className="w-full h-full object-contain"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-amber-400 font-['Tajawal']">
                          المطور: أبو غيث النجار 2026
                        </div>
                        <div className="text-[11px] text-slate-400">
                          للمشاريع الداخلية والأتمتة والأنظمة المالية
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-800 text-xs">
                      <a
                        href="tel:0570936035"
                        className="flex-1 py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 font-mono font-bold flex items-center justify-center gap-1.5 border border-slate-700"
                      >
                        <Phone className="w-3.5 h-3.5 text-amber-400" />
                        <span dir="ltr">0570936035</span>
                      </a>
                      <a
                        href="https://wa.me/966570936035"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center justify-center gap-1"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>واتساب المطور</span>
                      </a>
                    </div>
                  </div>

                  {/* Reset Demo Data */}
                  <div className="pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm('هل تريد إعادة تعيين كافة البيانات إلى الحالة الافتراضية النظيفة؟')) {
                          onResetDemo();
                          onClose();
                        }
                      }}
                      className="w-full py-2 px-3 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-600 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>استعادة البيانات الافتراضية الأولية النظيفة</span>
                    </button>
                  </div>

                  {/* Submit Button for General tab */}
                  <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                    <button
                      type="submit"
                      disabled={!isManager}
                      className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {savedSuccess ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span>تم الحفظ بنجاح!</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          <span>حفظ إعدادات النظام</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={onClose}
                      className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                    >
                      إلغاء
                    </button>
                  </div>
                </form>
              )}

              {/* TAB 3: ANDROID & PWA APP STATUS */}
              {activeTab === 'android' && (
                <div className="space-y-4 font-['Tajawal']">
                  {/* Status Banner */}
                  <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-900 to-slate-900 text-white border border-emerald-500/30 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shrink-0">
                        <Smartphone className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-white">تطبيق أندرويد جاهز ومتوافق 100%</h4>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300 text-[10px] font-bold border border-emerald-400/40">
                            WebAPK / PWA
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 mt-1">
                          النظام مهيأ بتقنية Progressive Web App للعمل كتطبيق أصلي (Native App) على جميع هواتف وأجهزة أندرويد.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Share with Employees Card */}
                  <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <Share2 className="w-4 h-4 text-emerald-600" />
                        <span>رابط تثبيت التطبيق للموظفين</span>
                      </span>
                      <span className="text-[11px] text-slate-500">شارك الرابط مع فريقك لتثبيت التطبيق فوراً</span>
                    </div>

                    <div className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg">
                      <input
                        type="text"
                        readOnly
                        value={window.location.origin}
                        className="flex-1 bg-transparent text-xs text-slate-700 font-mono outline-none text-left"
                        dir="ltr"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(window.location.origin);
                          alert('تم نسخ رابط التطبيق بنجاح! أرسله للموظفين لتثبيته على هواتفهم.');
                        }}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-bold flex items-center gap-1 transition shrink-0"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>نسخ الرابط</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <a
                        href={`https://wa.me/?text=${encodeURIComponent(`مرحباً، تفضل رابط تثبيت تطبيق "حسابي" لإدارة الرواتب والعمليات المالية على هاتفك الأندرويد:\n${window.location.origin}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-2 transition"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>إرسال الرابط عبر واتساب للموظفين</span>
                      </a>
                    </div>
                  </div>

                  {/* Features Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="flex items-center gap-2 font-bold text-slate-900 mb-1">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>شاشة كاملة بدون متصفح</span>
                      </div>
                      <p className="text-slate-600 text-[11px] leading-relaxed">
                        يعمل التطبيق في وضع Standalone بدون شريط عنوان أو قوائم المتصفح لتجربة هاتف أصلية وسريعة.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="flex items-center gap-2 font-bold text-slate-900 mb-1">
                        <WifiOff className="w-4 h-4 text-emerald-600" />
                        <span>العمل بدون إنترنت (Offline)</span>
                      </div>
                      <p className="text-slate-600 text-[11px] leading-relaxed">
                        يخزن النظام البيانات في ذاكرة الهاتف (IndexedDB) لمواصلة تسجيل العمليات في حال انقطاع الشبكة مع المزامنة التلقائية.
                      </p>
                    </div>
                  </div>

                  {/* Device Compatibility */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                    <p className="font-bold text-slate-900">الأجهزة والأنظمة المدعومة:</p>
                    <div className="flex flex-wrap gap-2">
                      {['Samsung Galaxy', 'Xiaomi / Redmi', 'Huawei / Honor', 'Oppo / Realme', 'Vivo', 'Google Pixel', 'أجهزة التابلت والأجهزة اللوحية'].map((dev) => (
                        <span key={dev} className="px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-700 text-[11px] font-medium">
                          {dev}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
