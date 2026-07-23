'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { DAY_NAMES, buildStorageUrl } from '@/lib/utils';
import type { Service, Hairstyle } from '@/types';

function serviceImageSrc(image_url?: string) {
  if (!image_url) return null;
  return image_url.startsWith('http') ? image_url : buildStorageUrl('assets', image_url);
}

interface AvailSlot { barber_id?: string; day_of_week: number; is_open: boolean; open_time?: string; close_time?: string; }

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [barber, setBarber] = useState<any>({});
  const [availability, setAvailability] = useState<AvailSlot[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [allHairstyles, setAllHairstyles] = useState<Hairstyle[]>([]);
  const [selectedHairstyleIds, setSelectedHairstyleIds] = useState<string[]>([]);
  const [newService, setNewService] = useState({ name: '', price: '', duration_minutes: 30, description: '' });
  const [addingService, setAddingService] = useState(false);
  const [newServiceImageFile, setNewServiceImageFile] = useState<File | null>(null);
  const [newServiceImagePreview, setNewServiceImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch('/api/dashboard/settings').then((r) => r.json()),
      fetch('/api/hairstyles').then((r) => r.json()),
    ]).then(([settings, styles]) => {
      setBarber(settings.barber || {});
      setAvailability(settings.availability || []);
      setServices(settings.services || []);
      setSelectedHairstyleIds(settings.hairstyleIds || []);
      setAllHairstyles(styles.hairstyles || []);
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    await fetch('/api/dashboard/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        shop_name: barber.shop_name,
        bio: barber.bio,
        address: barber.address,
        city: barber.city,
        postcode: barber.postcode,
        phone: barber.phone,
        website: barber.website,
        availability,
        hairstyleIds: selectedHairstyleIds,
      }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleAddService = async () => {
    if (!newService.name || !newService.price) return;

    let image_url: string | undefined;
    if (newServiceImageFile) {
      setUploadingImage(true);
      try {
        const form = new FormData();
        form.append('file', newServiceImageFile);
        form.append('folder', 'services');
        const res = await fetch('/api/dashboard/upload', { method: 'POST', body: form });
        const data = await res.json();
        if (res.ok) image_url = data.path;
      } finally {
        setUploadingImage(false);
      }
    }

    await fetch('/api/dashboard/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        services: [{ name: newService.name, price: parseFloat(newService.price), duration_minutes: newService.duration_minutes, description: newService.description, image_url }],
      }),
    });
    setNewService({ name: '', price: '', duration_minutes: 30, description: '' });
    setNewServiceImageFile(null);
    setNewServiceImagePreview(null);
    setAddingService(false);
    // Reload services
    const d = await fetch('/api/dashboard/settings').then((r) => r.json());
    setServices(d.services || []);
  };

  const handleServiceImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setNewServiceImageFile(f);
    setNewServiceImagePreview(URL.createObjectURL(f));
  };

  const toggleHairstyle = (id: string) => {
    setSelectedHairstyleIds((prev) =>
      prev.includes(id) ? prev.filter((h) => h !== id) : [...prev, id],
    );
  };

  const updateAvailSlot = (day: number, field: string, value: any) => {
    setAvailability((prev) =>
      prev.map((s) => s.day_of_week === day ? { ...s, [field]: value } : s),
    );
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center py-32">
        <svg className="w-6 h-6 animate-spin text-gray-300" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-500">Manage your shop profile and schedule</p>
        </div>
        <div className="flex items-center gap-3">
          {saved && <span className="text-sm text-emerald-600 font-medium">Saved</span>}
          <Button onClick={handleSave} loading={saving} size="sm">Save changes</Button>
        </div>
      </div>

      {/* Shop info */}
      <section className="bg-white rounded-xl border border-gray-200 p-6 mb-5 space-y-4">
        <h2 className="font-semibold text-gray-900">Shop details</h2>
        <Input label="Shop name" value={barber.shop_name || ''} onChange={(e) => setBarber({ ...barber, shop_name: e.target.value })} />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Bio</label>
          <textarea
            rows={3}
            value={barber.bio || ''}
            onChange={(e) => setBarber({ ...barber, bio: e.target.value })}
            className="block w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
            placeholder="Tell customers about your shop..."
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input label="Address" value={barber.address || ''} onChange={(e) => setBarber({ ...barber, address: e.target.value })} />
          <Input label="City" value={barber.city || ''} onChange={(e) => setBarber({ ...barber, city: e.target.value })} />
          <Input label="Postcode" value={barber.postcode || ''} onChange={(e) => setBarber({ ...barber, postcode: e.target.value })} />
          <Input label="Phone" value={barber.phone || ''} onChange={(e) => setBarber({ ...barber, phone: e.target.value })} />
        </div>
        <Input label="Website (optional)" value={barber.website || ''} onChange={(e) => setBarber({ ...barber, website: e.target.value })} placeholder="https://..." />
      </section>

      {/* Availability */}
      <section className="bg-white rounded-xl border border-gray-200 p-6 mb-5">
        <h2 className="font-semibold text-gray-900 mb-4">Opening hours</h2>
        <div className="space-y-2">
          {[0,1,2,3,4,5,6].map((day) => {
            const slot = availability.find((s) => s.day_of_week === day) || { day_of_week: day, is_open: false };
            return (
              <div key={day} className="flex items-center gap-3 flex-wrap">
                <div className="w-24 flex-shrink-0">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <div
                      onClick={() => updateAvailSlot(day, 'is_open', !slot.is_open)}
                      className={`w-10 h-5 rounded-full transition-colors flex-shrink-0 ${slot.is_open ? 'bg-gray-900' : 'bg-gray-200'}`}
                    >
                      <div className={`w-4 h-4 mt-0.5 ml-0.5 rounded-full bg-white transition-transform ${slot.is_open ? 'translate-x-5' : ''}`} />
                    </div>
                    <span className="text-sm text-gray-700">{DAY_NAMES[day].slice(0, 3)}</span>
                  </label>
                </div>
                {slot.is_open ? (
                  <div className="flex items-center gap-2 text-sm flex-wrap">
                    <input type="time" value={slot.open_time || '09:00'} onChange={(e) => updateAvailSlot(day, 'open_time', e.target.value)} className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900" />
                    <span className="text-gray-400">to</span>
                    <input type="time" value={slot.close_time || '18:00'} onChange={(e) => updateAvailSlot(day, 'close_time', e.target.value)} className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900" />
                  </div>
                ) : (
                  <span className="text-sm text-gray-400">Closed</span>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Services */}
      <section className="bg-white rounded-xl border border-gray-200 p-6 mb-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Services</h2>
          <Button size="sm" variant="outline" onClick={() => setAddingService(true)}>Add service</Button>
        </div>
        <div className="space-y-2">
          {services.map((svc) => {
            const imgSrc = serviceImageSrc(svc.image_url);
            return (
              <div key={svc.id} className="flex items-center gap-3 py-2.5 border-b border-gray-100 last:border-0">
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                  {imgSrc ? (
                    <Image src={imgSrc} alt={svc.name} width={48} height={48} className="object-cover w-full h-full" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-gray-900">{svc.name}</p>
                  {svc.description && <p className="text-xs text-gray-400 truncate">{svc.description}</p>}
                  <p className="text-xs text-gray-400">{svc.duration_minutes} min</p>
                </div>
                <p className="font-semibold text-gray-900 flex-shrink-0">£{svc.price.toFixed(2)}</p>
              </div>
            );
          })}
          {services.length === 0 && <p className="text-sm text-gray-400">No services added yet.</p>}
        </div>

        {addingService && (
          <div className="mt-4 p-4 bg-gray-50 rounded-xl space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Photo of the cut</label>
              <label className="flex items-center gap-3 cursor-pointer">
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-white border border-gray-200 flex-shrink-0 flex items-center justify-center">
                  {newServiceImagePreview ? (
                    <Image src={newServiceImagePreview} alt="Preview" width={64} height={64} className="object-cover w-full h-full" />
                  ) : (
                    <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  )}
                </div>
                <span className="text-sm text-gray-600 hover:text-gray-900">{newServiceImagePreview ? 'Change photo' : 'Upload a photo of this cut'}</span>
                <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleServiceImageChange} />
              </label>
              <p className="mt-1 text-xs text-gray-400">Customers browse your services like a lookbook — a good photo sells the cut.</p>
            </div>
            <Input label="Service name" value={newService.name} onChange={(e) => setNewService({ ...newService, name: e.target.value })} placeholder="e.g. Skin Fade" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input label="Price (£)" type="number" step="0.01" min="0" value={newService.price} onChange={(e) => setNewService({ ...newService, price: e.target.value })} />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Duration</label>
                <select value={newService.duration_minutes} onChange={(e) => setNewService({ ...newService, duration_minutes: parseInt(e.target.value) })} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900">
                  {[30, 60, 90, 120].map((m) => <option key={m} value={m}>{m} min</option>)}
                </select>
              </div>
            </div>
            <Input label="Description (optional)" value={newService.description} onChange={(e) => setNewService({ ...newService, description: e.target.value })} placeholder="Short description..." />
            <div className="flex gap-2 flex-wrap">
              <Button size="sm" onClick={handleAddService} loading={uploadingImage}>Add service</Button>
              <Button size="sm" variant="ghost" onClick={() => { setAddingService(false); setNewServiceImageFile(null); setNewServiceImagePreview(null); }}>Cancel</Button>
            </div>
          </div>
        )}
      </section>

      {/* Hairstyle specialisms */}
      <section className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-1">Hairstyle specialisms</h2>
        <p className="text-xs text-gray-500 mb-4">Select the styles you can execute. These show on your profile and help customers find you via AI match.</p>
        <div className="flex flex-wrap gap-2">
          {allHairstyles.map((h) => {
            const selected = selectedHairstyleIds.includes(h.id);
            return (
              <button
                key={h.id}
                onClick={() => toggleHairstyle(h.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                  selected ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                }`}
              >
                {h.name}
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
