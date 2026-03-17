import React from 'react';
import { Student, AttendanceRecord } from '../types';
import { format } from 'date-fns';
import { Users, CheckCircle, Clock, Calendar } from 'lucide-react';

interface Props {
  students: Student[];
  attendance: AttendanceRecord[];
}

export default function AttendanceDashboard({ students, attendance }: Props) {
  const today = format(new Date(), 'yyyy-MM-dd');
  const todayAttendance = attendance.filter(a => a.date === today);
  const presentCount = new Set(todayAttendance.map(a => a.studentId)).size;

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-end border-b border-stone-900 pb-6">
        <div>
          <h2 className="font-serif italic text-3xl text-stone-900">System Overview</h2>
          <p className="text-stone-500 font-mono text-xs uppercase tracking-widest mt-1">Real-time attendance metrics</p>
        </div>
        <div className="text-right font-mono text-xs text-stone-400">
          {format(new Date(), 'EEEE, MMMM do, yyyy')}
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          icon={<Users className="text-stone-900" size={20} />}
          label="Total Enrolled"
          value={students.length}
          subtext="Registered students"
        />
        <StatCard 
          icon={<CheckCircle className="text-stone-900" size={20} />}
          label="Present Today"
          value={presentCount}
          subtext={`${((presentCount / (students.length || 1)) * 100).toFixed(1)}% attendance`}
        />
        <StatCard 
          icon={<Calendar className="text-stone-900" size={20} />}
          label="Total Logs"
          value={attendance.length}
          subtext="Historical records"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="font-serif italic text-xl">Recent Activity</h3>
          <div className="bg-white border border-stone-900 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] overflow-hidden">
            {attendance.slice(0, 8).map((record, i) => (
              <div 
                key={record.id} 
                className={`p-4 flex items-center gap-4 ${i !== 0 ? 'border-t border-stone-100' : ''}`}
              >
                <div className={`w-2 h-2 rounded-full ${record.status === 'Present' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                <div className="flex-1">
                  <p className="text-sm font-medium">{record.name}</p>
                  <p className="text-[10px] text-stone-400 font-mono uppercase">
                    {format(record.timestamp?.toDate() || new Date(), 'HH:mm:ss')} • {record.status}
                  </p>
                </div>
              </div>
            ))}
            {attendance.length === 0 && (
              <div className="p-8 text-center text-stone-400 font-mono text-xs italic">
                No activity recorded yet.
              </div>
            )}
          </div>
        </div>

        {/* Data Grid */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="font-serif italic text-xl">Attendance Log</h3>
          <div className="bg-white border border-stone-900 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] overflow-hidden">
            <div className="grid grid-cols-4 p-4 bg-stone-50 border-b border-stone-900 font-mono text-[10px] uppercase tracking-wider text-stone-500">
              <div>Student</div>
              <div>ID</div>
              <div>Time</div>
              <div>Status</div>
            </div>
            <div className="max-h-[500px] overflow-y-auto">
              {attendance.map((record) => (
                <div key={record.id} className="grid grid-cols-4 p-4 border-b border-stone-100 hover:bg-stone-50 transition-colors">
                  <div className="text-sm font-medium">{record.name}</div>
                  <div className="text-xs font-mono text-stone-500">{record.studentId}</div>
                  <div className="text-xs font-mono text-stone-500">
                    {format(record.timestamp?.toDate() || new Date(), 'MMM dd, HH:mm')}
                  </div>
                  <div>
                    <span className={`text-[10px] font-mono px-2 py-1 rounded-sm uppercase ${
                      record.status === 'Present' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {record.status}
                    </span>
                  </div>
                </div>
              ))}
              {attendance.length === 0 && (
                <div className="p-20 text-center text-stone-400 font-mono text-xs italic">
                  Waiting for data...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, subtext }: { icon: React.ReactNode, label: string, value: string | number, subtext: string }) {
  return (
    <div className="bg-white border border-stone-900 p-6 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
        {icon}
      </div>
      <p className="text-stone-500 font-mono text-[10px] uppercase tracking-widest mb-1">{label}</p>
      <p className="text-4xl font-serif italic text-stone-900 mb-2">{value}</p>
      <p className="text-stone-400 text-[10px] font-mono uppercase">{subtext}</p>
    </div>
  );
}
