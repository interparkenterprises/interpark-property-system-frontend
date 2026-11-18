import Image from 'next/image';
import Link from 'next/link';

export function PersonnelShell({ children, title, description }: {
  children: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#0b6688,_#071525_55%)] px-4 py-10 text-slate-900 sm:px-6">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-6 text-center">
          <Image src="/interparklogo.png" alt="Interpark" width={58} height={58} className="mx-auto rounded-xl bg-white/95 p-1" priority />
          <p className="mt-3 text-xs font-bold uppercase tracking-[0.3em] text-cyan-200">Interpark</p>
          <h1 className="mt-2 text-3xl font-bold text-white">{title}</h1>
          <p className="mt-2 text-sm text-slate-300">{description}</p>
        </div>
        <section className="rounded-2xl border border-white/15 bg-white p-6 shadow-2xl sm:p-8">{children}</section>
        <p className="mt-5 text-center text-xs text-slate-400">
          Restricted service personnel access · <Link href="/login" className="text-cyan-200 hover:text-white">ERP login</Link>
        </p>
      </div>
    </main>
  );
}
