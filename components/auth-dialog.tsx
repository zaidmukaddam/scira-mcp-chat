"use client";

import { useState } from 'react';
import { useAuth } from '@/lib/context/auth-context';
import { AuthForm } from './auth-form';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuthDialog({ open, onOpenChange }: AuthDialogProps) {
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
      onOpenChange(false);
    } catch (error) {
      // Error handling is done in the auth context
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        <AuthForm 
          onSubmit={handleSubmit}
          loading={loading}
        />
      </DialogContent>
    </Dialog>
  );
}
