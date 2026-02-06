'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Loader2, Store, Mail, Lock, KeyRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { authAPI } from '@/lib/api'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1) // 1: Email, 2: OTP, 3: New Password
  const [email, setEmail] = useState('')
  
  const { register: registerEmail, handleSubmit: handleSubmitEmail, formState: { errors: emailErrors } } = useForm()
  const { register: registerOTP, handleSubmit: handleSubmitOTP, formState: { errors: otpErrors } } = useForm()
  const { register: registerPassword, handleSubmit: handleSubmitPassword, watch, formState: { errors: passwordErrors } } = useForm()

  const newPassword = watch('newPassword')

  // Step 1: Request OTP
  const onRequestOTP = async (data) => {
    setLoading(true)
    
    try {
      await authAPI.requestPasswordReset(data.email)
      setEmail(data.email)
      setStep(2)
      
      toast.success('OTP sent!', {
        description: 'Check your email for the 6-digit code',
      })
    } catch (error) {
      toast.error('Failed to send OTP', {
        description: error.response?.data?.message || 'Please try again',
      })
    } finally {
      setLoading(false)
    }
  }

  // Step 2: Verify OTP
  const onVerifyOTP = async (data) => {
    setLoading(true)
    
    try {
      await authAPI.verifyOTP(email, data.otp)
      setStep(3)
      
      toast.success('OTP verified!', {
        description: 'Now set your new password',
      })
    } catch (error) {
      toast.error('Invalid OTP', {
        description: error.response?.data?.message || 'Please check and try again',
      })
    } finally {
      setLoading(false)
    }
  }

  // Step 3: Reset Password
  const onResetPassword = async (data) => {
    setLoading(true)
    
    try {
      await authAPI.resetPassword({
        email,
        otp: data.otp,
        newPassword: data.newPassword
      })
      
      toast.success('Password reset successful!', {
        description: 'You can now login with your new password',
      })

      router.push('/login')
    } catch (error) {
      toast.error('Failed to reset password', {
        description: error.response?.data?.message || 'Please try again',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-green-50 dark:from-gray-950 dark:via-gray-900 dark:to-emerald-950 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary text-white mb-4 shadow-lg"
          >
            <Store className="w-8 h-8" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-3xl font-bold text-gray-900 dark:text-white"
          >
            Olawale Store
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-muted-foreground mt-2"
          >
            Inventory Management System
          </motion.p>
        </div>

        <Card className="border-2 shadow-xl">
          <CardHeader>
            <CardTitle>Reset Password</CardTitle>
            <CardDescription>
              {step === 1 && 'Enter your email to receive an OTP'}
              {step === 2 && 'Enter the 6-digit code sent to your email'}
              {step === 3 && 'Create a new password'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Step 1: Email */}
            {step === 1 && (
              <form onSubmit={handleSubmitEmail(onRequestOTP)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="john@example.com"
                      className="pl-10"
                      {...registerEmail('email', {
                        required: 'Email is required',
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Invalid email address',
                        },
                      })}
                    />
                  </div>
                  {emailErrors.email && (
                    <p className="text-sm text-destructive">{emailErrors.email.message}</p>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending OTP...
                    </>
                  ) : (
                    'Send OTP'
                  )}
                </Button>
              </form>
            )}

            {/* Step 2: OTP */}
            {step === 2 && (
              <form onSubmit={handleSubmitOTP(onVerifyOTP)} className="space-y-4">
                <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg mb-4">
                  <p className="text-sm">
                    We sent a 6-digit code to <strong>{email}</strong>
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="otp">6-Digit OTP</Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="otp"
                      placeholder="000000"
                      maxLength={6}
                      className="pl-10 text-center text-2xl tracking-widest"
                      {...registerOTP('otp', {
                        required: 'OTP is required',
                        pattern: {
                          value: /^\d{6}$/,
                          message: 'OTP must be 6 digits',
                        },
                      })}
                    />
                  </div>
                  {otpErrors.otp && (
                    <p className="text-sm text-destructive">{otpErrors.otp.message}</p>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    'Verify OTP'
                  )}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => setStep(1)}
                >
                  Use different email
                </Button>
              </form>
            )}

            {/* Step 3: New Password */}
            {step === 3 && (
              <form onSubmit={handleSubmitPassword(onResetPassword)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="otp">OTP</Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="otp"
                      placeholder="000000"
                      maxLength={6}
                      className="pl-10"
                      {...registerPassword('otp', {
                        required: 'OTP is required',
                        pattern: {
                          value: /^\d{6}$/,
                          message: 'OTP must be 6 digits',
                        },
                      })}
                    />
                  </div>
                  {passwordErrors.otp && (
                    <p className="text-sm text-destructive">{passwordErrors.otp.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="newPassword"
                      type="password"
                      placeholder="••••••••"
                      className="pl-10"
                      {...registerPassword('newPassword', {
                        required: 'Password is required',
                        minLength: {
                          value: 8,
                          message: 'Password must be at least 8 characters',
                        },
                      })}
                    />
                  </div>
                  {passwordErrors.newPassword && (
                    <p className="text-sm text-destructive">{passwordErrors.newPassword.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      className="pl-10"
                      {...registerPassword('confirmPassword', {
                        required: 'Please confirm your password',
                        validate: value =>
                          value === newPassword || 'Passwords do not match'
                      })}
                    />
                  </div>
                  {passwordErrors.confirmPassword && (
                    <p className="text-sm text-destructive">{passwordErrors.confirmPassword.message}</p>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Resetting password...
                    </>
                  ) : (
                    'Reset Password'
                  )}
                </Button>
              </form>
            )}

            <div className="mt-6 text-center text-sm">
              <Link href="/login" className="text-primary font-medium hover:underline">
                ← Back to login
              </Link>
            </div>
          </CardContent>
        </Card>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center text-sm text-muted-foreground mt-6"
        >
          © {new Date().getFullYear()} Olawale Store. All rights reserved.
        </motion.p>
      </motion.div>
    </div>
  )
}