import { Logo } from '@/components/brand/logo'

export function AuthFrame({
  title, subtitle, children, footer,
}: { title: string; subtitle: string; children: React.ReactNode; footer: React.ReactNode }) {
  return (
    <main className="ambient relative grid min-h-screen place-items-center px-5 py-10">
      <div className="panel relative z-10 w-full max-w-[460px] p-8 sm:p-10">
        <Logo />
        <h1 className="mt-10 text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-2 text-muted">{subtitle}</p>
        <div className="mt-8">{children}</div>
        <p className="mt-8 text-center text-sm text-muted">{footer}</p>
      </div>
    </main>
  )
}
