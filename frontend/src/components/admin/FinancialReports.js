import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, Download, Calendar, Users, CreditCard } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import Button from '../Button';
import Select from '../Select';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const COLORS = ['#0F3D2E', '#C8A951', '#2EB6A0', '#E76F51'];

export default function FinancialReports() {
  const [revenueData, setRevenueData] = useState(null);
  const [payrollData, setPayrollData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchRevenueData();
    fetchPayrollData();
  }, [selectedMonth, selectedYear]);

  const fetchRevenueData = async () => {
    try {
      const response = await fetch(`${API}/admin/finance/revenue`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setRevenueData(data);
      }
    } catch (error) {
      console.error('Error fetching revenue:', error);
    }
  };

  const fetchPayrollData = async () => {
    try {
      const response = await fetch(`${API}/admin/finance/payroll?month=${selectedMonth}&year=${selectedYear}`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setPayrollData(data);
      }
    } catch (error) {
      console.error('Error fetching payroll:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportRevenue = () => {
    toast.success('Revenue report exported');
  };

  const handleExportPayroll = () => {
    toast.success('Payroll report exported');
  };

  const monthOptions = [
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' }
  ];

  const yearOptions = [
    { value: '2024', label: '2024' },
    { value: '2025', label: '2025' },
    { value: '2026', label: '2026' }
  ];

  // Mock data for charts
  const monthlyRevenueData = [
    { month: 'Jan', revenue: 3200, subscriptions: 12 },
    { month: 'Feb', revenue: 3800, subscriptions: 14 },
    { month: 'Mar', revenue: 4100, subscriptions: 16 },
    { month: 'Apr', revenue: 4600, subscriptions: 18 },
    { month: 'May', revenue: 5200, subscriptions: 20 },
    { month: 'Jun', revenue: 5800, subscriptions: 22 }
  ];

  const revenueBreakdown = [
    { name: 'Subscriptions', value: 4200 },
    { name: 'Trial Conversions', value: 800 },
    { name: 'One-time Classes', value: 800 }
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0F3D2E]"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-semibold" style={{ color: '#1D1D1F' }}>Financial Reports</h2>
          <p className="text-sm mt-1 text-gray-500">
            Revenue tracking and teacher payroll
          </p>
        </div>
        <div className="flex gap-3">
          <Select
            value={selectedMonth.toString()}
            onChange={(val) => setSelectedMonth(parseInt(val))}
            options={monthOptions}
          />
          <Select
            value={selectedYear.toString()}
            onChange={(val) => setSelectedYear(parseInt(val))}
            options={yearOptions}
          />
        </div>
      </div>

      {/* Revenue Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="apple-card p-6" >
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="w-5 h-5" style={{ color: '#0F3D2E' }} />
            <p className="text-sm font-medium text-gray-400">Total Revenue</p>
          </div>
          <p className="text-3xl font-semibold" style={{ color: '#1D1D1F' }}>
            RM {revenueData?.total_revenue?.toLocaleString() || 0}
          </p>
        </div>

        <div className="apple-card p-6" >
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-5 h-5" style={{ color: '#2EB6A0' }} />
            <p className="text-sm font-medium text-gray-400">MRR</p>
          </div>
          <p className="text-3xl font-semibold" style={{ color: '#1D1D1F' }}>
            RM {revenueData?.mrr?.toLocaleString() || 0}
          </p>
        </div>

        <div className="apple-card p-6" >
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-5 h-5" style={{ color: '#C8A951' }} />
            <p className="text-sm font-medium text-gray-400">Active Subs</p>
          </div>
          <p className="text-3xl font-semibold" style={{ color: '#1D1D1F' }}>
            {revenueData?.active_subscriptions || 0}
          </p>
        </div>

        <div className="apple-card p-6" >
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="w-5 h-5" style={{ color: '#E76F51' }} />
            <p className="text-sm font-medium text-gray-400">Paid Classes</p>
          </div>
          <p className="text-3xl font-semibold" style={{ color: '#1D1D1F' }}>
            {revenueData?.paid_classes || 0}
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="apple-card p-6" >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold" style={{ color: '#1D1D1F' }}>Monthly Revenue Trend</h3>
            <Button variant="ghost" size="sm" onClick={handleExportRevenue}>
              <Download className="w-4 h-4" />
            </Button>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyRevenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" stroke="#9CA3AF" style={{ fontSize: '12px' }} />
              <YAxis stroke="#9CA3AF" style={{ fontSize: '12px' }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#0F3D2E" strokeWidth={2} name="Revenue (RM)" />
              <Line type="monotone" dataKey="subscriptions" stroke="#C8A951" strokeWidth={2} name="Subscriptions" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="apple-card p-6" >
          <h3 className="text-lg font-semibold mb-4" style={{ color: '#1D1D1F' }}>Revenue Breakdown</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={revenueBreakdown}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {revenueBreakdown.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Payroll Section */}
      <div className="apple-card p-6" >
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-semibold" style={{ color: '#1D1D1F' }}>Teacher Payroll</h3>
            <p className="text-sm mt-1 text-gray-500">
              {monthOptions.find(m => m.value === selectedMonth.toString())?.label} {selectedYear}
            </p>
          </div>
          <Button variant="secondary" onClick={handleExportPayroll}>
            <Download className="w-4 h-4 mr-2 inline" />
            Export Payroll
          </Button>
        </div>

        <div className="mb-6 p-4 rounded-xl bg-[#FBFBFD]">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm mb-1 text-gray-400">Total Payroll</p>
              <p className="text-2xl font-semibold" style={{ color: '#0F3D2E' }}>
                RM {payrollData?.total_payroll?.toLocaleString() || 0}
              </p>
            </div>
            <div>
              <p className="text-sm mb-1 text-gray-400">Teachers</p>
              <p className="text-2xl font-semibold" style={{ color: '#0F3D2E' }}>
                {payrollData?.teacher_count || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#FBFBFD]">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: '#1D1D1F' }}>Teacher</th>
                <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: '#1D1D1F' }}>Tier</th>
                <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: '#1D1D1F' }}>Classes</th>
                <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: '#1D1D1F' }}>Payment Due</th>
              </tr>
            </thead>
            <tbody>
              {payrollData?.payroll_details?.map((teacher, idx) => (
                <tr key={idx} className="border-t hover:bg-gray-50 transition-colors" style={{ borderColor: 'rgba(15, 61, 46, 0.05)' }}>
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium" style={{ color: '#1D1D1F' }}>{teacher.teacher_name}</p>
                      <p className="text-xs text-gray-400">{teacher.email}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 rounded-full text-xs font-medium capitalize" style={{
                      backgroundColor: teacher.commission_tier === 'elite' ? 'rgba(15, 61, 46, 0.1)' : teacher.commission_tier === 'rated' ? 'rgba(212, 175, 55, 0.1)' : 'rgba(156, 163, 175, 0.1)',
                      color: teacher.commission_tier === 'elite' ? '#0F3D2E' : teacher.commission_tier === 'rated' ? '#D4AF37' : '#6B7280',
                      
                    }}>
                      {teacher.commission_tier || 'new'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-gray-500">{teacher.completed_classes}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold" style={{ color: '#0F3D2E' }}>
                      RM {teacher.payment_due?.toLocaleString()}
                    </p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
