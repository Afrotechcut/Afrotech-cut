'use client';
import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Image from 'next/image';
import { formatTime, formatDate } from '@/lib/slots';
import { buildStorageUrl } from '@/lib/utils';
import { format, addDays } from 'date-fns';
import type { Service, Barber } from '@/types';

const STEPS = ['Service', 'Date & Time', 'Your Details', 'Confirm'];

export default function BookingPage({ params }: { params: { barberId: string } }) {
  const { barberId } = params;
  const searchParams = useSearchParams();
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [barber, setBarber] = useState<Barber | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState('');
  const [slots, setSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsClosed, setSlotsClosed] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(true);

  // Pre-select service from query param
  const preServiceId = searchParams.get('serviceId');

  useEffect(() => {
    fetch(`/api/barbers/${barberId}`)
      .then((r) => r.json())
      .then((data) => {
        setBarber(data.barber);
        setServices(data.services || []);
        if (preServiceId) {
          const found = (data.services || []).find((s: Service) => s.id === preServiceId);
          if (found) { setSelectedService(found); setStep(1); }
        }
      })
      .finally(() => setInitLoading(false));
  }, [barberId, preServiceId]);

  // Load slots when date + service are selected
  useEffect(() => {
    if (!selectedDate || !selectedService) return;
    setSlotsLoading(true);
    setSlots([]);
    setSelectedTime('');
    fetch(`/api/barbers/${barberId}/slots?date=${selectedDate}&serviceId=${selectedService.id}`)
      .then((r) => r.json())
      .then((d) => {
        setSlots(d.slots || []);
        setSlotsClosed(d.closed || false);
      })
      .finally(() => setSlotsLoading(false));
  }, [selectedDate, selectedService, barberId]);

  const handleBook = async () => {
    if (!selectedService || !selectedDate || !selectedTime || !guestEmail) return;
    setLoading(true);
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          barber_id: barberId,
          service_id: selectedService.id,
          guest_name: guestName,
          guest_email: guestEmail,
          guest_phone: guestPhone,
          appointment_date: selectedDate,
          appointment_time: selectedTime,
          notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error || 'Booking failed'); return; }
      router.push(`/booking/success?bookingId=${data.booking.id}`);
    } finally {
      setLoading(false);
    }
  };

  // Generate next 14 days for date picker
  const availableDates = Array.from({ length: 14 }, (_, i) => {
    const d = addDays(new Date(), i === 0 ? 1 : i);
    return format(d, 'yyyy-MM-dd');
  });

  if (initLoading) {
    return (
      <>
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <svg className="w-8 h-8 animate-spin text-gray-300" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
        </div>
      </>
    );
  }

  if (!barber) return <><Navbar /><div className="p-8 text-center text-gray-400">Barber not found.</div></>;

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 py-10">
        <div className="max-w-2xl mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <p className="text-sm text-gray-500 mb-1">Booking at</p>
            <h1 className="text-2xl font-bold text-gray-900">{barber.shop_name}</h1>
          </div>

          {/* Step indicator */}
          <div className="flex items-center mb-8">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center">
                <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold transition-colors ${
                  i < step ? 'bg-gray-900 text-white' : i === step ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  {i < step ? <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg> : i + 1}
                </div>
                <span className={`mx-2 text-xs font-medium ${i === step ? 'text-gray-900' : 'text-gray-400'}`}>{s}</span>
                {i < STEPS.length - 1 && <div className="flex-1 h-px bg-gray-200 mr-2" />}
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            {/* STEP 0: Service */}
            {step === 0 && (
              <div>
                <h2 className="font-semibold text-gray-900 mb-4">Choose a service</h2>
                <div className="space-y-2">
                  {services.map((svc) => {
                    const imgSrc = svc.image_url
                      ? svc.image_url.startsWith('http') ? svc.image_url : buildStorageUrl('assets', svc.image_url)
                      : null;
                    return (
                      <button
                        key={svc.id}
                        onClick={() => { setSelectedService(svc); setStep(1); }}
                        className="w-full text-left p-3 border rounded-xl hover:border-gray-900 transition-colors flex items-center gap-3"
                      >
                        <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                          {imgSrc ? (
                            <Image src={imgSrc} alt={svc.name} width={56} height={56} className="object-cover w-full h-full" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0 flex justify-between items-center gap-2">
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 truncate">{svc.name}</p>
                            {svc.description && <p className="text-xs text-gray-500 mt-0.5 truncate">{svc.description}</p>}
                            <p className="text-xs text-gray-400 mt-0.5">{svc.duration_minutes} min</p>
                          </div>
                          <p className="font-semibold text-gray-900 flex-shrink-0">£{svc.price.toFixed(2)}</p>
                        </div>
                      </button>
                    );
                  })}
                  {services.length === 0 && <p className="text-sm text-gray-400">No services available.</p>}
                </div>
              </div>
            )}

            {/* STEP 1: Date + Time */}
            {step === 1 && (
              <div>
                <h2 className="font-semibold text-gray-900 mb-4">Pick a date and time</h2>
                <div className="mb-4">
                  <p className="text-xs font-medium text-gray-500 mb-2">Date</p>
                  <div className="grid grid-cols-7 gap-1">
                    {availableDates.map((d) => {
                      const day = new Date(d + 'T12:00:00');
                      return (
                        <button
                          key={d}
                          onClick={() => setSelectedDate(d)}
                          className={`flex flex-col items-center py-2 rounded-lg text-xs font-medium transition-colors ${
                            selectedDate === d ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <span className="text-[10px]">{format(day, 'EEE')}</span>
                          <span className="font-bold">{format(day, 'd')}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {selectedDate && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-2">Available times</p>
                    {slotsLoading ? (
                      <div className="flex items-center gap-2 text-sm text-gray-400 py-4">
                        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
                        Loading availability...
                      </div>
                    ) : slotsClosed ? (
                      <p className="text-sm text-gray-400">The shop is closed on this day.</p>
                    ) : slots.length === 0 ? (
                      <p className="text-sm text-gray-400">No slots available on this day. Try another date.</p>
                    ) : (
                      <div className="grid grid-cols-4 gap-2">
                        {slots.map((slot) => (
                          <button
                            key={slot}
                            onClick={() => setSelectedTime(slot)}
                            className={`py-2 text-xs font-semibold rounded-lg border transition-colors ${
                              selectedTime === slot ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 text-gray-700 hover:border-gray-400'
                            }`}
                          >
                            {formatTime(slot)}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-3 mt-6">
                  <Button variant="outline" onClick={() => setStep(0)}>Back</Button>
                  <Button onClick={() => setStep(2)} disabled={!selectedDate || !selectedTime} className="flex-1">
                    Continue
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 2: Details */}
            {step === 2 && (
              <div>
                <h2 className="font-semibold text-gray-900 mb-4">Your contact details</h2>
                <div className="space-y-4">
                  <Input label="Full name" value={guestName} onChange={(e) => setGuestName(e.target.value)} placeholder="John Smith" required />
                  <Input label="Email address" type="email" value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} placeholder="you@example.com" required hint="Your confirmation will be sent here" />
                  <Input label="Phone number" type="tel" value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)} placeholder="+44 7700 000000" />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes for the barber (optional)</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      placeholder="Any specific requests or notes..."
                      className="block w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
                    />
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
                  <Button onClick={() => setStep(3)} disabled={!guestName || !guestEmail} className="flex-1">
                    Review booking
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 3: Confirm */}
            {step === 3 && selectedService && (
              <div>
                <h2 className="font-semibold text-gray-900 mb-5">Review and confirm</h2>
                <div className="bg-gray-50 rounded-xl p-5 mb-6 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Barber</span>
                    <span className="font-medium text-gray-900">{barber.shop_name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Service</span>
                    <span className="font-medium text-gray-900">{selectedService.name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Date</span>
                    <span className="font-medium text-gray-900">{selectedDate ? formatDate(selectedDate) : '—'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Time</span>
                    <span className="font-medium text-gray-900">{selectedTime ? formatTime(selectedTime) : '—'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Duration</span>
                    <span className="font-medium text-gray-900">{selectedService.duration_minutes} min</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Name</span>
                    <span className="font-medium text-gray-900">{guestName}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Email</span>
                    <span className="font-medium text-gray-900">{guestEmail}</span>
                  </div>
                  {guestPhone && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Phone</span>
                      <span className="font-medium text-gray-900">{guestPhone}</span>
                    </div>
                  )}
                  <div className="pt-3 border-t border-gray-200 flex justify-between">
                    <span className="font-semibold text-gray-900">Total</span>
                    <span className="font-bold text-brand-600 text-lg">£{selectedService.price.toFixed(2)}</span>
                  </div>
                </div>

                <p className="text-xs text-gray-400 mb-5">
                  No payment is taken online. Payment is made in person at the barber's shop. A confirmation email will be sent to {guestEmail}.
                </p>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
                  <Button onClick={handleBook} loading={loading} className="flex-1" size="lg">
                    Confirm booking — £{selectedService.price.toFixed(2)}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
