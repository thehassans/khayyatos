import React, { useEffect } from 'react';
import {
  LayoutDashboard,
  Search,
  Clock,
  CheckCircle,
  Users,
  Wallet
} from 'lucide-react';

const DashboardPreview = () => {
  useEffect(() => {
    document.documentElement.classList.remove('dark');
  }, []);

  return (
    <div className="min-h-screen bg-white text-slate-950">
      <div className="border-b border-slate-200 bg-white/85 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-5 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <img src="/khayatoslogo.webp" alt="KhayyatOS" className="h-8 w-auto object-contain" />
            <div className="min-w-0">
              <div className="text-sm font-semibold tracking-[0.22em] truncate">DASHBOARD</div>
              <div className="text-xs text-slate-500 truncate">Preview</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <div className="w-[220px] rounded-2xl border border-slate-200 bg-white px-10 py-2 text-sm text-slate-400">
                Search orders…
              </div>
            </div>
            <div className="h-9 px-4 rounded-2xl bg-[#D5B25B] text-black text-sm font-medium flex items-center">
              Live
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-5 py-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Orders', value: '128', icon: LayoutDashboard },
            { label: 'Due Today', value: '7', icon: Clock },
            { label: 'Customers', value: '1,240', icon: Users },
            { label: 'Pending', value: '42', icon: Wallet }
          ].map((kpi) => {
            const Icon = kpi.icon;
            return (
              <div key={kpi.label} className="rounded-3xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[11px] text-slate-500 tracking-widest uppercase">{kpi.label}</div>
                    <div className="mt-1 text-2xl font-semibold text-slate-900">{kpi.value}</div>
                  </div>
                  <div className="w-10 h-10 rounded-2xl bg-[#D5B25B]/10 border border-[#D5B25B]/20 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-[#7E6426]" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 rounded-3xl border border-slate-200 bg-white overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-4">
            <div className="text-sm font-semibold tracking-widest text-slate-900">RECENT ACTIVITY</div>
            <div className="text-xs text-slate-500">Updated live</div>
          </div>

          <div className="divide-y divide-slate-200">
            {[
              { title: 'Order #1048', sub: 'Assigned to Worker A', status: 'In Progress', icon: Clock },
              { title: 'Order #1046', sub: 'Customer: Ahmed', status: 'Ready', icon: CheckCircle },
              { title: 'Laundry: 18 pcs', sub: 'Payment updated', status: 'Paid', icon: Wallet }
            ].map((row) => {
              const Icon = row.icon;
              return (
                <div key={row.title} className="px-5 py-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-slate-600" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-slate-900 truncate">{row.title}</div>
                      <div className="text-xs text-slate-500 truncate">{row.sub}</div>
                    </div>
                  </div>

                  <div className="text-[11px] px-2.5 py-1 rounded-full bg-[#D5B25B]/10 text-[#7E6426] border border-[#D5B25B]/20 whitespace-nowrap">
                    {row.status}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPreview;
