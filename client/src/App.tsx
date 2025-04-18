import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import DashboardPage from "@/pages/dashboard-page";
import ServersPage from "@/pages/servers-page";
import ModsPage from "@/pages/mods-page";
import FilesPage from "@/pages/files-page";
import ApiPage from "@/pages/api-page";
import UsersPage from "@/pages/users-page";
import SettingsPage from "@/pages/settings-page";
import { ProtectedRoute } from "./lib/protected-route";
import { AuthProvider } from "./hooks/use-auth";
import { SetupWizard } from "./components/installer/setup-wizard";
import { useState, useEffect } from "react";
import { apiRequest } from "./lib/queryClient";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/" component={DashboardPage} />
      <ProtectedRoute path="/servers" component={ServersPage} />
      <ProtectedRoute path="/mods" component={ModsPage} />
      <ProtectedRoute path="/files" component={FilesPage} />
      <ProtectedRoute path="/api" component={ApiPage} />
      <ProtectedRoute path="/users" component={UsersPage} />
      <ProtectedRoute path="/settings" component={SettingsPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function InstallerCheck({ children }: { children: React.ReactNode }) {
  const [isCheckingInstall, setIsCheckingInstall] = useState(true);
  const [isInstalled, setIsInstalled] = useState(true);

  useEffect(() => {
    const checkInstallStatus = async () => {
      try {
        const response = await fetch("/api/installer/status", {
          credentials: "include"
        });
        const data = await response.json();
        setIsInstalled(data.installed);
        setIsCheckingInstall(false);
      } catch (error) {
        console.error("Failed to check installation status:", error);
        // If there's an error, we'll assume the app needs to be installed
        setIsInstalled(false);
        setIsCheckingInstall(false);
      }
    };

    checkInstallStatus();
  }, []);

  if (isCheckingInstall) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 rounded-full bg-primary/20 mb-4"></div>
          <div className="h-4 w-32 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (!isInstalled) {
    return <SetupWizard onComplete={() => setIsInstalled(true)} />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider 
        attribute="class" 
        defaultTheme="system" 
        enableSystem={true}
        storageKey="minelaunch-theme"
      >
        <TooltipProvider>
          <Toaster />
          <InstallerCheck>
            <AuthProvider>
              <Router />
            </AuthProvider>
          </InstallerCheck>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
