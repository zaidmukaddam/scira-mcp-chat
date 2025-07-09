"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AuthDialog } from './auth-dialog';
import { toast } from 'sonner';

export function AuthDemo() {
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAuthSubmit = async (data: { 
    email: string; 
    password: string; 
    displayName?: string; 
    isSignUp: boolean 
  }) => {
    setLoading(true);
    
    // Simulate API call
    try {
      console.log('Auth attempt:', data);
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (data.isSignUp) {
        toast.success(`Account created for ${data.email}!`);
      } else {
        toast.success(`Welcome back, ${data.email}!`);
      }
      
      setAuthDialogOpen(false);
    } catch (error) {
      toast.error('Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    
    try {
      console.log('Google sign in attempt');
      
      // Simulate Google OAuth flow
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast.success('Successfully signed in with Google!');
      setAuthDialogOpen(false);
    } catch (error) {
      toast.error('Google sign in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Authentication Demo</h1>
      <Button onClick={() => setAuthDialogOpen(true)}>
        Open Auth Dialog
      </Button>
      
      <AuthDialog 
        open={authDialogOpen}
        onOpenChange={setAuthDialogOpen}
        onSubmit={handleAuthSubmit}
        onGoogleSignIn={handleGoogleSignIn}
        loading={loading}
      />
    </div>
  );
}
