import React from 'react';
import Card from '../Card';

export default function AccountPage({ user }) {
  const inputCls = 'h-12 w-full rounded-md border border-ink-faint/40 bg-surface-card px-4 text-body placeholder:text-ink-tertiary focus:outline-none focus:ring-2 focus:ring-brand/15 focus:border-brand/40 transition-all';

  return (
    <div className="p-4 lg:p-8" data-testid="account-page">
      <div className="max-w-2xl mx-auto">
        <Card className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-brand to-brand-light flex items-center justify-center text-white text-2xl font-semibold">{user?.name?.charAt(0) || 'S'}</div>
            <div>
              <h2 className="text-h2 text-ink">{user?.name}</h2>
              <p className="text-ink-secondary text-body">{user?.email}</p>
            </div>
          </div>
          <div className="space-y-4">
            <div><label className="block text-small font-medium text-ink-secondary mb-2">Full Name</label><input type="text" defaultValue={user?.name} className={inputCls} data-testid="account-name-input" /></div>
            <div><label className="block text-small font-medium text-ink-secondary mb-2">Email</label><input type="email" defaultValue={user?.email} disabled className={`${inputCls} bg-surface-subtle text-ink-tertiary`} data-testid="account-email-input" /></div>
            <div><label className="block text-small font-medium text-ink-secondary mb-2">Phone</label><input type="tel" defaultValue={user?.phone || ''} className={inputCls} data-testid="account-phone-input" /></div>
          </div>
          <button className="w-full mt-6 h-12 rounded-md bg-brand text-white font-medium hover:bg-brand-light transition-all active:scale-[0.97]" data-testid="save-account-btn">Save Changes</button>
        </Card>
      </div>
    </div>
  );
}
