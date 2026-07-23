'use client';
import { useEffect, useState } from 'react';
import { format, startOfWeek, addDays, isToday } from 'date-fns';
import { formatTime } from '@/lib/slots';

interface Booking {
  id: string;
  guest_name: string;
  appointment_date: string;
  appointment_time: string;
  duration_minutes: number;
  services: { name: string };
  status: string;
}

const HOURS = Array.from({ length: 11 }, (_, i) => i + 8); // 8am to 6pm

export default function CalendarPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  useEffect(() => {
    const from = format(weekStart, 'yyyy-MM-dd');
    const to = format(addDays(weekStart, 6), 'yyyy-MM-dd');
    fetch(`/api/dashboard/bookings?from=${from}&to=${to}`)
      .then((r) => r.json())
      .then((d) => setBookings(d.bookings || []));
  }, [weekStart]);

  const getBookingsForDayAndHour = (day: Date, hour: number) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    return bookings.filter((b) => {
      if (b.appointment_date !== dateStr) return false;
      const h = parseInt(b.appointment_time?.split(':')[0] || '0');
      return h === hour;
    });
  };

  return (
    <div className="p-6 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Calendar</h1>
          <p className="text-sm text-gray-500">Week of {format(weekStart, 'd MMM yyyy')}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setWeekStart((w) => addDays(w, -7))} className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Previous</button>
          <button onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))} className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Today</button>
          <button onClick={() => setWeekStart((w) => addDays(w, 7))} className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Next</button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <div className="min-w-[700px]">
          {/* Header */}
          <div className="grid grid-cols-8 border-b border-gray-200">
            <div className="p-3" />
            {days.map((d) => (
              <div key={d.toISOString()} className={`p-3 text-center border-l border-gray-100 ${isToday(d) ? 'bg-gray-50' : ''}`}>
                <p className="text-xs text-gray-400">{format(d, 'EEE')}</p>
                <p className={`text-sm font-semibold mt-0.5 ${isToday(d) ? 'text-brand-600' : 'text-gray-900'}`}>{format(d, 'd')}</p>
              </div>
            ))}
          </div>

          {/* Time grid */}
          {HOURS.map((hour) => (
            <div key={hour} className="grid grid-cols-8 border-b border-gray-100 last:border-0">
              <div className="p-2 text-right pr-3">
                <span className="text-xs text-gray-400">{format(new Date().setHours(hour, 0), 'h a')}</span>
              </div>
              {days.map((d) => {
                const dayBookings = getBookingsForDayAndHour(d, hour);
                return (
                  <div key={d.toISOString()} className={`min-h-[48px] p-1 border-l border-gray-100 ${isToday(d) ? 'bg-gray-50/50' : ''}`}>
                    {dayBookings.map((b) => (
                      <div
                        key={b.id}
                        className={`rounded px-1.5 py-1 mb-0.5 text-xs ${
                          b.status === 'confirmed' ? 'bg-gray-900 text-white' :
                          b.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                          'bg-gray-100 text-gray-500'
                        }`}
                      >
                        <p className="font-semibold truncate">{b.guest_name}</p>
                        <p className="opacity-75">{formatTime(b.appointment_time?.slice(0, 5))}</p>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
