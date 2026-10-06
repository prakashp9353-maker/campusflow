export function PageHeader({
  title, description, action,
}: { title: string; description?: string; action?: React.ReactNode }) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="mt-2 max-w-xl text-muted">{description}</p>}
      </div>
      {action}
    </header>
  )
}
