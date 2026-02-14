import React from 'react';

export default function AccountPage({ user }) {
  return (
    <div className="p-4 lg:p-8" data-testid="account-page">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl p-6 border mb-6" style={{ borderColor: 'rgba(15, 61, 46, 0.08)' }}>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-20 h-20 rounded-full bg-[#0F3D2E] flex items-center justify-center text-white text-2xl font-semibold">
              {user?.name?.charAt(0) || 'S'}
            </div>
            <div>
              <h2 className="text-xl font-semibold" style={{ color: '#1D1D1F' }}>{user?.name}</h2>
              <p className="text-gray-500">{user?.email}</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-500 mb-1">Full Name</label>
              <input type="text" defaultValue={user?.name} className="w-full h-12 px-4 rounded-xl border bg-gray-50" style={{ borderColor: 'rgba(15, 61, 46, 0.15)' }} data-testid="account-name-input" />
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">Email</label>
              <input type="email" defaultValue={user?.email} disabled className="w-full h-12 px-4 rounded-xl border bg-gray-100 text-gray-500" style={{ borderColor: 'rgba(15, 61, 46, 0.15)' }} data-testid="account-email-input" />
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">Phone</label>
              <input type="tel" defaultValue={user?.phone || ''} className="w-full h-12 px-4 rounded-xl border bg-gray-50" style={{ borderColor: 'rgba(15, 61, 46, 0.15)' }} data-testid="account-phone-input" />
            </div>
          </div>
          <button className="w-full mt-6 h-12 rounded-xl bg-[#0F3D2E] text-white font-medium hover:opacity-90 transition-all" data-testid="save-account-btn">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
