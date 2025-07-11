"use client";

import { useState } from 'react';
import { useAuth } from '@/lib/context/auth-context';
import { AuthForm } from './auth-form';

export function AuthPage() {
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();

  const handleSubmit = async (data: { 
    email: string; 
    password: string; 
    displayName?: string; 
    isSignUp: boolean 
  }) => {
    setLoading(true);
    
    try {
      if (data.isSignUp) {
        await signUp(data.email, data.password, data.displayName);
      } else {
        await signIn(data.email, data.password);
      }
    } catch (error) {
      // Error handling is done in the auth context
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <div className="w-full max-w-md">
        <AuthForm 
          onSubmit={handleSubmit}
          loading={loading}
        />
      </div>
    </div>
  );
}
