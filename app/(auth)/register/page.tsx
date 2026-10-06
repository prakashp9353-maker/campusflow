import type { Metadata } from 'next'
import Link from 'next/link'
import { AuthFrame } from '@/components/auth/auth-frame'
import { RegisterForm } from '@/components/auth/register-form'

export const metadata: Metadata = { title: 'Create account' }

export default function RegisterPage() {
  return (
    <AuthFrame
      title="Create your account"
      subtitle="Student accounts get access to campus services and request tracking."
      footer={<>Already registered? <Link href="/login" className="font-medium text-blue hover:text-cyan">Sign in</Link></>}
    >
      <RegisterForm />
    </AuthFrame>
  )
}
