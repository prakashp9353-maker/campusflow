'use client'

import {
  ArrowRight,
  BookOpen,
  Building2,
  FileText,
  GraduationCap,
  IdCard,
  Laptop,
  Library,
  Wrench,
} from 'lucide-react'
import Link from 'next/link'

type Service = {
  id: string
  name: string
  description: string
  expected_resolution_hours: number
  requirements: string | null
  department: { name: string } | { name: string }[] | null
}

const icons = [
  Laptop,
  Wrench,
  Building2,
  GraduationCap,
  FileText,
  Library,
  IdCard,
  BookOpen,
]

export function ServiceCatalogue({ services }: { services: Service[] }) {
  if (services.length === 0) {
    return (
      <div className="panel px-6 py-16 text-center">
        <div className="mx-auto grid size-12 place-items-center rounded-xl bg-blue/10 text-blue">
          <Building2 className="size-6" />
        </div>
        <h2 className="mt-5 text-lg font-semibold">No services available</h2>
        <p className="mt-2 text-muted">
          Campus services will appear here when they are published.
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {services.map((service, index) => {
        const Icon = icons[index % icons.length]
        const department = Array.isArray(service.department)
          ? service.department[0]?.name
          : service.department?.name

        return (
          <article
            key={service.id}
            className="group panel flex flex-col p-6 transition-all duration-200 hover:-translate-y-1 hover:border-blue/40"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-blue/10 text-blue">
                <Icon className="size-5" />
              </div>

              <span className="rounded-full border border-line bg-surface px-2.5 py-1 text-xs text-muted">
                ~{service.expected_resolution_hours}h
              </span>
            </div>

            <h2 className="mt-5 text-lg font-semibold">{service.name}</h2>

            <p className="mt-2 flex-1 text-sm leading-6 text-muted">
              {service.description}
            </p>

            {department && (
              <p className="mt-4 text-xs text-faint">
                Department · {department}
              </p>
            )}

            {service.requirements && (
              <p className="mt-2 text-xs text-faint">
                Requirement · {service.requirements}
              </p>
            )}

            <Link
              href={`/student/requests/new?service=${service.id}`}
              className="mt-6 inline-flex h-10 items-center justify-center gap-2 rounded-control bg-blue px-4 text-sm font-medium text-ink transition-colors hover:bg-cyan"
            >
              Start Request
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </article>
        )
      })}
    </div>
  )
}