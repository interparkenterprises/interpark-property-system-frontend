'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, CalendarClock, CalendarDays, Clock3, LogOut, MapPin, RefreshCw, UserRound } from 'lucide-react';
import { usePersonnelAuth } from '@/context/PersonnelAuthContext';
import type { PersonnelPortalAssignment } from '@/types/personnelPortal';

const categoryLabel = (value: string) => value.split('_').map(word => word[0] + word.slice(1).toLowerCase()).join(' ');
const dateLabel = (value: string) => new Date(value).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' });

function AssignmentCard({ assignment, upcoming = false }: { assignment: PersonnelPortalAssignment; upcoming?: boolean }) {
  return <article className={`rounded-2xl border p-5 ${upcoming ? 'border-sky-800 bg-sky-950/30' : 'border-slate-800 bg-slate-900'}`}>
    <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wider text-cyan-300">{categoryLabel(assignment.serviceCategory)}</p><h3 className="mt-1 text-lg font-bold text-white">{assignment.property.name}</h3><p className="mt-1 flex items-start gap-1.5 text-sm text-slate-400"><MapPin className="mt-0.5 h-4 w-4 shrink-0" />{assignment.property.address}</p></div><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${upcoming ? 'bg-sky-900 text-sky-200' : 'bg-emerald-950 text-emerald-300'}`}>{upcoming ? 'Upcoming' : 'Current'}</span></div>
    <div className="mt-4 border-t border-slate-800 pt-4"><p className="font-medium text-slate-200">{assignment.jobRole}</p><p className="mt-1 text-xs text-slate-500">{upcoming ? 'Starts' : 'Assigned from'} {dateLabel(assignment.startDate)}</p>{assignment.notes ? <p className="mt-2 text-sm text-slate-400">{assignment.notes}</p> : null}</div>
    <div className="mt-4 space-y-2">{assignment.schedules.length === 0 ? <div className="rounded-lg bg-slate-950 p-3 text-sm text-slate-500">{upcoming ? 'No planned work schedule for this assignment.' : 'No current work schedule for this assignment.'}</div> : assignment.schedules.map(schedule => <div key={schedule.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-950 px-3 py-2.5 text-sm"><span className="font-semibold text-slate-200">{categoryLabel(schedule.dayOfWeek)}</span><span className="flex items-center gap-1.5 text-slate-400"><Clock3 className="h-4 w-4" />{categoryLabel(schedule.shiftType)} · {schedule.startTime || '—'}–{schedule.endTime || '—'}</span></div>)}</div>
  </article>;
}

export default function PersonnelPortalPage() {
  const router = useRouter();
  const { profile, isLoading, sessionError, logout, refreshProfile } = usePersonnelAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !profile) router.replace('/personnel/login');
  }, [isLoading, profile, router]);

  const schedules = useMemo(() => profile?.assignments.flatMap(assignment =>
    assignment.schedules.map(schedule => ({ schedule, assignment }))) || [], [profile]);
  const upcomingAssignments = profile?.upcomingAssignments || [];

  if (isLoading) return <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white"><div className="text-center"><div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-cyan-300 border-t-transparent" /><p className="mt-4 text-sm text-slate-300">Loading your portal…</p></div></main>;
  if (!profile) return <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-center text-sm text-slate-300">{sessionError || 'Redirecting to personnel sign in…'}</main>;

  const refresh = async () => { setRefreshing(true); await refreshProfile(); setRefreshing(false); };
  const signOut = async () => {
    setLogoutError(null);
    try { await logout(); } catch (error) { setLogoutError(error instanceof Error ? error.message : 'Unable to sign out cleanly.'); }
  };

  return <main className="min-h-screen bg-slate-950 text-slate-100">
    <header className="border-b border-slate-800 bg-slate-900/95 px-4 py-4 sm:px-6">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3"><Image src="/interparklogo.png" alt="Interpark" width={42} height={42} className="rounded-lg bg-white p-1" /><div className="min-w-0"><p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-300">Interpark personnel</p><p className="truncate font-semibold text-white">{profile.name}</p></div></div>
        <div className="flex gap-2"><button onClick={() => void refresh()} disabled={refreshing} aria-label="Refresh portal" className="rounded-lg border border-slate-700 p-2.5 text-slate-200 hover:bg-slate-800 disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} /></button><button onClick={() => void signOut()} className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-500"><LogOut className="h-4 w-4" /><span className="hidden sm:inline">Logout</span></button></div>
      </div>
    </header>
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
      {logoutError ? <div role="alert" className="rounded-xl border border-red-800 bg-red-950/50 p-4 text-sm text-red-200">{logoutError}</div> : null}
      <section className="overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-[#005478] to-slate-900 p-6 shadow-xl sm:p-8">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center"><div><p className="text-sm font-semibold text-cyan-200">Welcome back</p><h1 className="mt-1 text-3xl font-bold text-white">{profile.name}</h1><p className="mt-2 text-slate-300">{profile.jobRole} · {categoryLabel(profile.personnelType)} personnel</p></div><div className="rounded-xl border border-white/15 bg-white/10 px-5 py-4"><p className="text-xs uppercase tracking-wider text-cyan-200">Active assignments</p><p className="mt-1 text-3xl font-bold text-white">{profile.assignments.length}</p></div></div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5"><UserRound className="h-5 w-5 text-cyan-300" /><p className="mt-3 text-xs uppercase tracking-wider text-slate-400">Personnel type</p><p className="mt-1 font-semibold">{categoryLabel(profile.personnelType)}</p></div>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5"><Building2 className="h-5 w-5 text-cyan-300" /><p className="mt-3 text-xs uppercase tracking-wider text-slate-400">Properties</p><p className="mt-1 font-semibold">{new Set(profile.assignments.map(item => item.property.id)).size}</p></div>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 sm:col-span-2 lg:col-span-1"><CalendarDays className="h-5 w-5 text-cyan-300" /><p className="mt-3 text-xs uppercase tracking-wider text-slate-400">Current shifts</p><p className="mt-1 font-semibold">{schedules.length}</p></div>
        <div className="rounded-xl border border-sky-800/70 bg-sky-950/40 p-5"><CalendarClock className="h-5 w-5 text-sky-300" /><p className="mt-3 text-xs uppercase tracking-wider text-sky-300">Upcoming assignments</p><p className="mt-1 font-semibold">{upcomingAssignments.length}</p></div>
      </section>

      <section><div className="mb-4"><h2 className="text-xl font-bold text-white">Current assignments</h2><p className="mt-1 text-sm text-slate-400">Active assignments whose start date has arrived are shown here.</p></div>
        {profile.assignments.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/60 p-10 text-center"><Building2 className="mx-auto h-9 w-9 text-slate-500" /><p className="mt-3 font-semibold text-white">No current property assignments</p><p className="mt-1 text-sm text-slate-400">Upcoming work is listed separately below.</p></div> : <div className="grid gap-4 lg:grid-cols-2">{profile.assignments.map(assignment => <AssignmentCard key={assignment.id} assignment={assignment} />)}</div>}
      </section>

      {upcomingAssignments.length > 0 ? <section><div className="mb-4"><h2 className="text-xl font-bold text-white">Upcoming assignments</h2><p className="mt-1 text-sm text-slate-400">These assignments are active in the system but become current on their start date.</p></div><div className="grid gap-4 lg:grid-cols-2">{upcomingAssignments.map(assignment => <AssignmentCard key={assignment.id} assignment={assignment} upcoming />)}</div>
      </section>
      : null}
    </div>
  </main>;
}
