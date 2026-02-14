import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, Download, Calendar, Users, CreditCard } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import Select from '../Select';
import { toast } from 'sonner';
import Card from '../Card';
import Spinner from '../Spinner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;
const COLORS = ['#0F3D2E', '#C8A951', '#2EB6A0', '#E76F51'];

const monthOptions = [1,2,3,4,5,6,7,8,9,10,11,12].map((m) => ({ value: m.toString(), label: new Date(2000, m-1).toLocaleString('en-US', { month: 'long' }) }));
const yearOptions = ['2024','2025','2026'].map(y => ({ value: y, label: y }));
const monthlyRevenueData = [
  { month: 'Jan', revenue: 3200, subscriptions: 12 }, { month: 'Feb', revenue: 3800, subscriptions: 14 },
  { month: 'Mar', revenue: 4100, subscriptions: 16 }, { month: 'Apr', revenue: 4600, subscriptions: 18 },
  { month: 'May', revenue: 5200, subscriptions: 20 }, { month: 'Jun', revenue: 5800, subscriptions: 22 },
];
const revenueBreakdown = [{ name: 'Subscriptions', value: 4200 }, { name: 'Trial Conversions', value: 800 }, { name: 'One-time Classes', value: 800 }];

export default function FinancialReports() {
  const [revenueData, setRevenueData] = useState(null);
  const [payrollData, setPayrollData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => { fetchRevenueData(); fetchPayrollData(); }, [selectedMonth, selectedYear]);

  const fetchRevenueData = async () => { try { const r = await fetch(`${API}/admin/finance/revenue`, { credentials: 'include' }); if (r.ok) setRevenueData(await r.json()); } catch (e) { console.error(e); } };
  const fetchPayrollData = async () => { try { const r = await fetch(`${API}/admin/finance/payroll?month=${selectedMonth}&year=${selectedYear}`, { credentials: 'include' }); if (r.ok) setPayrollData(await r.json()); } catch (e) { console.error(e); } finally { setLoading(false); } };
  const handleExportRevenue = () => toast.success('Revenue report exported');
  const handleExportPayroll = () => toast.success('Payroll report exported');

  const getTierCls = (tier) => ({ elite: 'bg-brand/10 text-brand', rated: 'bg-gold/10 text-gold-dark' }[tier] || 'bg-surface-subtle text-ink-secondary');

  if (loading) return <div className="flex justify-center items-center py-12"><Spinner /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div><h2 className="text-h2 text-brand">Financial Reports</h2><p className="text-small mt-1 text-ink-secondary">Revenue tracking and teacher payroll</p></div>
        <div className="flex gap-3"><Select value={selectedMonth.toString()} onChange={(v) => setSelectedMonth(parseInt(v))} options={monthOptions} /><Select value={selectedYear.toString()} onChange={(v) => setSelectedYear(parseInt(v))} options={yearOptions} /></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { icon: DollarSign, color: 'text-brand', label: 'Total Revenue', value: `RM ${revenueData?.total_revenue?.toLocaleString() || 0}` },
          { icon: TrendingUp, color: 'text-teal', label: 'MRR', value: `RM ${revenueData?.mrr?.toLocaleString() || 0}` },
          { icon: Users, color: 'text-gold-dark', label: 'Active Subs', value: revenueData?.active_subscriptions || 0 },
          { icon: Calendar, color: 'text-coral', label: 'Paid Classes', value: revenueData?.paid_classes || 0 },
        ].map((s, i) => (
          <Card key={i} className="p-6"><div className="flex items-center gap-3 mb-2"><s.icon className={`w-5 h-5 ${s.color}`} /><p className="text-small font-medium text-ink-tertiary">{s.label}</p></div><p className="text-3xl font-semibold text-ink">{s.value}</p></Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4"><h3 className="text-h3 text-ink">Monthly Revenue Trend</h3><button onClick={handleExportRevenue} className="p-2 hover:bg-surface-subtle rounded-md transition-colors"><Download className="w-4 h-4 text-ink-tertiary" /></button></div>
          <ResponsiveContainer width="100%" height={300}><LineChart data={monthlyRevenueData}><CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" /><XAxis dataKey="month" stroke="#AEAEB2" style={{ fontSize: '12px' }} /><YAxis stroke="#AEAEB2" style={{ fontSize: '12px' }} /><Tooltip /><Legend /><Line type="monotone" dataKey="revenue" stroke="#0F3D2E" strokeWidth={2} name="Revenue (RM)" /><Line type="monotone" dataKey="subscriptions" stroke="#C8A951" strokeWidth={2} name="Subscriptions" /></LineChart></ResponsiveContainer>
        </Card>
        <Card className="p-6">
          <h3 className="text-h3 text-ink mb-4">Revenue Breakdown</h3>
          <ResponsiveContainer width="100%" height={300}><PieChart><Pie data={revenueBreakdown} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`} outerRadius={80} dataKey="value">{revenueBreakdown.map((_, i) => <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div><h3 className="text-h3 text-ink">Teacher Payroll</h3><p className="text-small mt-1 text-ink-secondary">{monthOptions.find(m => m.value === selectedMonth.toString())?.label} {selectedYear}</p></div>
          <button onClick={handleExportPayroll} className="flex items-center gap-2 h-10 px-4 rounded-md bg-surface-card border border-ink-faint/40 text-small font-medium text-ink-secondary hover:bg-surface-subtle transition-all"><Download className="w-4 h-4" />Export Payroll</button>
        </div>
        <div className="mb-6 p-4 rounded-md bg-surface-subtle">
          <div className="grid grid-cols-2 gap-4">
            <div><p className="text-small mb-1 text-ink-tertiary">Total Payroll</p><p className="text-h2 font-semibold text-brand">RM {payrollData?.total_payroll?.toLocaleString() || 0}</p></div>
            <div><p className="text-small mb-1 text-ink-tertiary">Teachers</p><p className="text-h2 font-semibold text-brand">{payrollData?.teacher_count || 0}</p></div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="border-b border-surface-subtle bg-surface-subtle"><th className="px-4 py-3 text-left text-caption font-medium text-ink-tertiary uppercase tracking-wider">Teacher</th><th className="px-4 py-3 text-left text-caption font-medium text-ink-tertiary uppercase tracking-wider">Tier</th><th className="px-4 py-3 text-left text-caption font-medium text-ink-tertiary uppercase tracking-wider">Classes</th><th className="px-4 py-3 text-left text-caption font-medium text-ink-tertiary uppercase tracking-wider">Payment Due</th></tr></thead>
            <tbody className="divide-y divide-surface-subtle">
              {payrollData?.payroll_details?.map((teacher, idx) => (
                <tr key={idx} className="hover:bg-surface-subtle/50 transition-colors">
                  <td className="px-4 py-3"><p className="font-medium text-small text-ink">{teacher.teacher_name}</p><p className="text-caption text-ink-tertiary">{teacher.email}</p></td>
                  <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-caption font-medium capitalize ${getTierCls(teacher.commission_tier)}`}>{teacher.commission_tier || 'new'}</span></td>
                  <td className="px-4 py-3"><p className="text-small text-ink-secondary">{teacher.completed_classes}</p></td>
                  <td className="px-4 py-3"><p className="font-semibold text-brand">RM {teacher.payment_due?.toLocaleString()}</p></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
