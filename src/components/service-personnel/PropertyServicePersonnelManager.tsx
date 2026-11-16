'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarClock, Plus, RefreshCw, ShieldCheck, UserRoundCog, UsersRound, X } from 'lucide-react';
import { servicePersonnelAPI } from '@/lib/api';
import { useGlobalPermissions } from '@/app/providers/PermissionsProvider';
import type {
  CreateServicePersonnelRequest,
  PersonnelType,
  PropertyServiceAssignment,
  ServiceCategory,
  ServicePersonnel,
  ServicePersonnelOptions,
  ServiceShiftType,
  WeekDay
} from '@/types';

const CATEGORY_LABELS: Record<ServiceCategory, string> = {
  CLEANING: 'Cleaning',
  SECURITY: 'Security',
  CARETAKING: 'Caretaking',
  LANDSCAPING: 'Landscaping',
  PLUMBING: 'Plumbing',
  ELECTRICAL: 'Electrical',
  MAINTENANCE: 'Maintenance',
  WASTE_MANAGEMENT: 'Waste management',
  OTHER: 'Other'
};

const WEEK_DAYS: WeekDay[] = [
  'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'
];

const today = () => new Date().toISOString().slice(0, 10);

const initialForm = (propertyId: string) => ({
  mode: 'NEW' as 'NEW' | 'EXISTING',
  existingPersonnelId: '',
  personnelType: 'INTERNAL' as PersonnelType,
  employeeId: '',
  serviceProviderId: '',
  name: '',
  phoneNumber: '',
  email: '',
  jobRole: '',
  propertyId,
  serviceCategory: 'CLEANING' as ServiceCategory,
  startDate: today(),
  notes: ''
});

interface Props {
  propertyId: string;
  propertyName: string;
}

export default function PropertyServicePersonnelManager({ propertyId, propertyName }: Props) {
  const { canViewServiceProviders, canCreateServiceProvider, canEditServiceProvider } = useGlobalPermissions();
  const [personnel, setPersonnel] = useState<ServicePersonnel[]>([]);
  const [options, setOptions] = useState<ServicePersonnelOptions | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(() => initialForm(propertyId));
  const [categoryFilter, setCategoryFilter] = useState<ServiceCategory | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [scheduleAssignment, setScheduleAssignment] = useState<PropertyServiceAssignment | null>(null);
  const [schedule, setSchedule] = useState({
    dayOfWeek: 'MONDAY' as WeekDay,
    shiftType: 'DAY' as ServiceShiftType,
    startTime: '06:00',
    endTime: '18:00',
    notes: ''
  });

  const loadData = useCallback(async () => {
    if (!canViewServiceProviders) return;
    setLoading(true);
    setError(null);
    try {
      const [records, availableOptions] = await Promise.all([
        servicePersonnelAPI.getByProperty(propertyId),
        servicePersonnelAPI.getOptions(propertyId)
      ]);
      setPersonnel(records);
      setOptions(availableOptions);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to load property personnel.');
    } finally {
      setLoading(false);
    }
  }, [canViewServiceProviders, propertyId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const filteredPersonnel = useMemo(() => personnel.filter(person => person.assignments.some(assignment => {
    const categoryMatches = categoryFilter === 'ALL' || assignment.serviceCategory === categoryFilter;
    const statusMatches = statusFilter === 'ALL' || assignment.status === statusFilter;
    return categoryMatches && statusMatches;
  })), [categoryFilter, personnel, statusFilter]);

  const summary = useMemo(() => {
    const assignments = personnel.flatMap(person => person.assignments);
    return {
      people: personnel.length,
      active: assignments.filter(item => item.status === 'ACTIVE').length,
      internal: personnel.filter(item => item.personnelType === 'INTERNAL').length,
      external: personnel.filter(item => item.personnelType === 'EXTERNAL').length
    };
  }, [personnel]);

  const summaryCards = [
    { label: 'Personnel', value: summary.people, Icon: UsersRound },
    { label: 'Active assignments', value: summary.active, Icon: ShieldCheck },
    { label: 'Internal', value: summary.internal, Icon: UserRoundCog },
    { label: 'External', value: summary.external, Icon: CalendarClock }
  ];

  const updateShift = (shiftType: ServiceShiftType) => {
    setSchedule(current => ({
      ...current,
      shiftType,
      startTime: shiftType === 'NIGHT' ? '18:00' : shiftType === 'DAY' ? '06:00' : current.startTime,
      endTime: shiftType === 'NIGHT' ? '06:00' : shiftType === 'DAY' ? '18:00' : current.endTime
    }));
  };

  const submitPersonnel = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const assignment = {
        propertyId,
        serviceCategory: form.serviceCategory,
        jobRole: form.jobRole,
        startDate: form.startDate,
        notes: form.notes || undefined
      };

      if (form.mode === 'EXISTING') {
        if (!form.existingPersonnelId) throw new Error('Select an existing person to assign.');
        await servicePersonnelAPI.createAssignment(form.existingPersonnelId, assignment);
      } else {
        const request: CreateServicePersonnelRequest = {
          personnelType: form.personnelType,
          employeeId: form.personnelType === 'INTERNAL' ? form.employeeId : undefined,
          serviceProviderId: form.personnelType === 'EXTERNAL' ? form.serviceProviderId : undefined,
          name: form.personnelType === 'EXTERNAL' ? form.name : undefined,
          phoneNumber: form.personnelType === 'EXTERNAL' ? form.phoneNumber : undefined,
          email: form.personnelType === 'EXTERNAL' ? form.email : undefined,
          jobRole: form.jobRole,
          assignment
        };
        await servicePersonnelAPI.create(request);
      }

      setForm(initialForm(propertyId));
      setShowForm(false);
      await loadData();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to save service personnel.');
    } finally {
      setSaving(false);
    }
  };

  const submitSchedule = async (event: FormEvent) => {
    event.preventDefault();
    if (!scheduleAssignment) return;
    setSaving(true);
    setError(null);
    try {
      await servicePersonnelAPI.createSchedule(scheduleAssignment.id, schedule);
      setScheduleAssignment(null);
      setSchedule({ dayOfWeek: 'MONDAY', shiftType: 'DAY', startTime: '06:00', endTime: '18:00', notes: '' });
      await loadData();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to save schedule.');
    } finally {
      setSaving(false);
    }
  };

  const deactivateAssignment = async (assignmentId: string) => {
    setSaving(true);
    setError(null);
    try {
      await servicePersonnelAPI.updateAssignment(assignmentId, { status: 'INACTIVE' });
      await loadData();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to close assignment.');
    } finally {
      setSaving(false);
    }
  };

  const togglePersonnelStatus = async (person: ServicePersonnel) => {
    setSaving(true);
    setError(null);
    try {
      await servicePersonnelAPI.update(person.id, { status: person.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' });
      await loadData();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to update personnel status.');
    } finally {
      setSaving(false);
    }
  };

  if (!canViewServiceProviders) {
    return <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">You do not have permission to view service personnel for this property.</div>;
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-600">Property services</p>
          <h1 className="mt-1 text-2xl font-bold text-gray-900">Personnel at {propertyName}</h1>
          <p className="mt-1 max-w-2xl text-sm text-gray-600">Manage internal employees, external provider personnel, property assignments, and shift schedules.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => void loadData()} className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
          {canCreateServiceProvider ? (
            <button type="button" onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 rounded-lg bg-[#005478] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0078a3]">
              <Plus className="h-4 w-4" /> Add personnel
            </button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map(({ label, value, Icon }) => (
          <div key={label} className="min-w-0 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3"><p className="text-sm font-medium text-gray-500">{label}</p><Icon className="h-5 w-5 text-[#005478]" /></div>
            <p className="mt-3 text-3xl font-bold text-gray-900">{value}</p>
          </div>
        ))}
      </div>

      {error ? <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

      {showForm ? (
        <form onSubmit={submitPersonnel} className="rounded-2xl border border-sky-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between"><div><h2 className="text-lg font-bold text-gray-900">Add property personnel</h2><p className="text-sm text-gray-500">Create a profile or reuse one for a multi-property assignment.</p></div><button type="button" onClick={() => setShowForm(false)} aria-label="Close personnel form" className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"><X className="h-5 w-5" /></button></div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <label className="text-sm font-medium text-gray-700">Assignment source<select value={form.mode} onChange={event => setForm(current => ({ ...current, mode: event.target.value as 'NEW' | 'EXISTING' }))} className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2"><option value="NEW">New personnel profile</option><option value="EXISTING">Existing personnel profile</option></select></label>
            {form.mode === 'EXISTING' ? (
              <label className="text-sm font-medium text-gray-700 md:col-span-2">Existing person<select required value={form.existingPersonnelId} onChange={event => setForm(current => ({ ...current, existingPersonnelId: event.target.value, jobRole: options?.existingPersonnel.find(item => item.id === event.target.value)?.jobRole || current.jobRole }))} className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2"><option value="">Select personnel</option>{options?.existingPersonnel.map(item => <option key={item.id} value={item.id}>{item.name} — {item.jobRole} ({item.personnelType.toLowerCase()})</option>)}</select></label>
            ) : (
              <>
                <label className="text-sm font-medium text-gray-700">Personnel type<select value={form.personnelType} onChange={event => setForm(current => ({ ...current, personnelType: event.target.value as PersonnelType }))} className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2"><option value="INTERNAL">Internal employee</option><option value="EXTERNAL">External provider personnel</option></select></label>
                {form.personnelType === 'INTERNAL' ? <label className="text-sm font-medium text-gray-700">Employee<select required value={form.employeeId} onChange={event => { const employee = options?.employees.find(item => item.id === event.target.value); setForm(current => ({ ...current, employeeId: event.target.value, jobRole: employee?.jobTitle || current.jobRole })); }} className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2"><option value="">Select employee</option>{options?.employees.map(item => <option key={item.id} value={item.id}>{item.name} — {item.jobTitle}</option>)}</select></label> : <><label className="text-sm font-medium text-gray-700">Service provider<select required value={form.serviceProviderId} onChange={event => setForm(current => ({ ...current, serviceProviderId: event.target.value }))} className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2"><option value="">Select provider</option>{options?.serviceProviders.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label className="text-sm font-medium text-gray-700">Full name<input required value={form.name} onChange={event => setForm(current => ({ ...current, name: event.target.value }))} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2" /></label><label className="text-sm font-medium text-gray-700">Phone<input value={form.phoneNumber} onChange={event => setForm(current => ({ ...current, phoneNumber: event.target.value }))} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2" /></label><label className="text-sm font-medium text-gray-700">Email<input type="email" value={form.email} onChange={event => setForm(current => ({ ...current, email: event.target.value }))} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2" /></label></>}
              </>
            )}
            <label className="text-sm font-medium text-gray-700">Service category<select value={form.serviceCategory} onChange={event => setForm(current => ({ ...current, serviceCategory: event.target.value as ServiceCategory }))} className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2">{Object.entries(CATEGORY_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            <label className="text-sm font-medium text-gray-700">Job role<input required value={form.jobRole} onChange={event => setForm(current => ({ ...current, jobRole: event.target.value }))} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2" placeholder="e.g. Night guard" /></label>
            <label className="text-sm font-medium text-gray-700">Assignment start<input required type="date" value={form.startDate} onChange={event => setForm(current => ({ ...current, startDate: event.target.value }))} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2" /></label>
            <label className="text-sm font-medium text-gray-700 md:col-span-2 xl:col-span-3">Assignment notes<textarea value={form.notes} onChange={event => setForm(current => ({ ...current, notes: event.target.value }))} className="mt-1 min-h-20 w-full rounded-lg border border-gray-300 px-3 py-2" /></label>
          </div>
          <div className="mt-5 flex justify-end gap-3"><button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700">Cancel</button><button disabled={saving} className="rounded-lg bg-[#005478] px-5 py-2 text-sm font-semibold text-white disabled:opacity-60">{saving ? 'Saving…' : 'Save personnel'}</button></div>
        </form>
      ) : null}

      {scheduleAssignment ? (
        <form onSubmit={submitSchedule} className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-6">
          <div className="mb-4 flex items-center justify-between"><div><h2 className="font-bold text-gray-900">Add work schedule</h2><p className="text-sm text-gray-600">{scheduleAssignment.jobRole} · {CATEGORY_LABELS[scheduleAssignment.serviceCategory]}</p></div><button type="button" onClick={() => setScheduleAssignment(null)} aria-label="Close schedule form"><X className="h-5 w-5" /></button></div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5"><label className="text-sm font-medium">Day<select value={schedule.dayOfWeek} onChange={event => setSchedule(current => ({ ...current, dayOfWeek: event.target.value as WeekDay }))} className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2">{WEEK_DAYS.map(day => <option key={day} value={day}>{day[0] + day.slice(1).toLowerCase()}</option>)}</select></label><label className="text-sm font-medium">Shift<select value={schedule.shiftType} onChange={event => updateShift(event.target.value as ServiceShiftType)} className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2"><option value="DAY">Day</option><option value="NIGHT">Night</option><option value="CUSTOM">Custom</option></select></label><label className="text-sm font-medium">Start<input type="time" required value={schedule.startTime} onChange={event => setSchedule(current => ({ ...current, startTime: event.target.value }))} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2" /></label><label className="text-sm font-medium">End<input type="time" required value={schedule.endTime} onChange={event => setSchedule(current => ({ ...current, endTime: event.target.value }))} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2" /></label><div className="flex items-end"><button disabled={saving} className="w-full rounded-lg bg-indigo-700 px-4 py-2 font-semibold text-white disabled:opacity-60">Add schedule</button></div></div>
        </form>
      ) : null}

      <div className="flex flex-wrap gap-3 rounded-xl border border-gray-200 bg-white p-4"><label className="text-sm font-medium text-gray-700">Category<select value={categoryFilter} onChange={event => setCategoryFilter(event.target.value as ServiceCategory | 'ALL')} className="ml-2 rounded-lg border border-gray-300 bg-white px-3 py-2"><option value="ALL">All</option>{Object.entries(CATEGORY_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label className="text-sm font-medium text-gray-700">Assignment status<select value={statusFilter} onChange={event => setStatusFilter(event.target.value as 'ALL' | 'ACTIVE' | 'INACTIVE')} className="ml-2 rounded-lg border border-gray-300 bg-white px-3 py-2"><option value="ALL">All</option><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></select></label></div>

      {loading ? <div className="rounded-xl border border-gray-200 bg-white p-12 text-center text-gray-500">Loading service personnel…</div> : filteredPersonnel.length === 0 ? <div className="rounded-xl border-2 border-dashed border-gray-300 bg-white p-12 text-center"><UsersRound className="mx-auto h-10 w-10 text-gray-400" /><h2 className="mt-3 font-bold text-gray-900">No personnel matched</h2><p className="mt-1 text-sm text-gray-500">Add personnel or adjust the selected filters.</p></div> : <div className="space-y-4">{filteredPersonnel.map(person => <article key={person.id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-4"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="text-lg font-bold text-gray-900">{person.name}</h2><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${person.personnelType === 'INTERNAL' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>{person.personnelType === 'INTERNAL' ? 'Internal employee' : 'External personnel'}</span><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${person.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-700'}`}>{person.status.toLowerCase()}</span></div><p className="mt-1 text-sm text-gray-600">{person.jobRole}{person.serviceProvider ? ` · ${person.serviceProvider.name}` : ''}</p><p className="mt-1 text-sm text-gray-500">{person.phoneNumber || person.email || 'No contact details'}</p></div>{canEditServiceProvider ? <button disabled={saving} onClick={() => void togglePersonnelStatus(person)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60">Mark {person.status === 'ACTIVE' ? 'inactive' : 'active'}</button> : null}</div><div className="mt-5 space-y-3">{person.assignments.map(assignment => <div key={assignment.id} className="rounded-xl border border-gray-200 bg-gray-50 p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex flex-wrap items-center gap-2"><span className="font-semibold text-gray-900">{CATEGORY_LABELS[assignment.serviceCategory]}</span><span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${assignment.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-600'}`}>{assignment.status.toLowerCase()}</span></div><p className="mt-1 text-sm text-gray-600">{assignment.jobRole} · from {new Date(assignment.startDate).toLocaleDateString('en-KE')}{assignment.endDate ? ` to ${new Date(assignment.endDate).toLocaleDateString('en-KE')}` : ''}</p>{assignment.notes ? <p className="mt-1 text-sm text-gray-500">{assignment.notes}</p> : null}</div>{canEditServiceProvider && assignment.status === 'ACTIVE' ? <div className="flex gap-2"><button onClick={() => setScheduleAssignment(assignment)} className="rounded-lg bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-100">Add shift</button><button disabled={saving} onClick={() => void deactivateAssignment(assignment.id)} className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60">End assignment</button></div> : null}</div><div className="mt-3 flex flex-wrap gap-2">{assignment.schedules.length ? assignment.schedules.map(item => <span key={item.id} className={`rounded-lg border px-3 py-1.5 text-xs ${item.isActive ? 'border-sky-200 bg-sky-50 text-sky-800' : 'border-gray-200 bg-gray-100 text-gray-500'}`}>{item.dayOfWeek.slice(0, 3)} · {item.shiftType.toLowerCase()} · {item.startTime}–{item.endTime}</span>) : <span className="text-xs text-gray-500">No schedule recorded</span>}</div></div>)}</div></article>)}</div>}
    </section>
  );
}
