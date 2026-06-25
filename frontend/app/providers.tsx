"use client";

import { Toaster } from "@/components/ui/Toaster";
import { AuthProvider } from "@/lib/auth/AuthContext";
import { ThemeProvider } from "@/lib/theme/ThemeContext";
import { ToastProvider } from "@/lib/toast/ToastContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
