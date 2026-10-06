import type { Metadata } from 'next'
import Link from 'next/link'
import { AuthFrame } from '@/components/auth/auth-frame'
import { LoginForm } from '@/components/auth/login-form'

export const metadata: Metadata = { title: 'Sign in' }

export default async function LoginPage({
  searchParams,
}: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams
  return (
    <AuthFrame
      title="Welcome back"
      subtitle="Sign in to continue to your workspace."
      footer={<>New student? <Link href="/register" className="font-medium text-blue hover:text-cyan">Create an account</Link></>}
    >
      {error === 'confirmation' && (
        <p role="alert" className="mb-5 rounded-control border border-danger/30 bg-danger/10 px-3.5 py-3 text-sm text-danger">
          That confirmation link is invalid or has expired. Register again or sign in if you already confirmed.
        </p>
      )}
      {error === 'role' && (
        <p role="alert" className="mb-5 rounded-control border border-danger/30 bg-danger/10 px-3.5 py-3 text-sm text-danger">
          This account does not have access to a current CampusFlow workspace. Contact your campus administrator.
        </p>
      )}
      <LoginForm />
    </AuthFrame>
  )
}
