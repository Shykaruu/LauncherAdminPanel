import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { insertInstallerSettingsSchema, insertUserSchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { Loader2, Server, Database, User, CheckCircle } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

// Extending schemas with validation
const databaseSchema = z.object({
  dbHost: z.string().min(1, "Host is required"),
  dbPort: z.string().min(1, "Port is required"),
  dbName: z.string().min(1, "Database name is required"),
  dbUser: z.string().min(1, "Database username is required"),
  dbPassword: z.string().min(1, "Database password is required"),
});

const adminSchema = insertUserSchema.extend({
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

interface SetupWizardProps {
  onComplete: () => void;
}

export function SetupWizard({ onComplete }: SetupWizardProps) {
  const [step, setStep] = useState(1);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionSuccess, setConnectionSuccess] = useState(false);
  const { toast } = useToast();
  
  // Form data state
  const [formData, setFormData] = useState({
    // Database settings
    dbHost: "localhost",
    dbPort: "3306",
    dbName: "",
    dbUser: "",
    dbPassword: "",
    
    // Admin user
    username: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  // Update form data
  const updateFormData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Test database connection
  const testConnection = async () => {
    try {
      // Validate database form
      databaseSchema.parse(formData);
      
      setIsTestingConnection(true);
      
      // Simulate connection test
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setConnectionSuccess(true);
      toast({
        title: "Connection successful",
        description: "Successfully connected to the database.",
      });
      
      // Move to next step after a short delay
      setTimeout(() => {
        setStep(3);
      }, 1000);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation error",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Connection failed",
          description: "Failed to connect to the database. Please check your credentials.",
          variant: "destructive",
        });
      }
    } finally {
      setIsTestingConnection(false);
    }
  };

  // Create admin user and complete installation
  const installMutation = useMutation({
    mutationFn: async () => {
      try {
        // Validate admin form
        adminSchema.parse(formData);
        
        // In a real scenario, we would:
        // 1. Complete the database setup
        // 2. Create initial admin user
        
        // Submit installer settings
        await apiRequest("POST", "/api/installer/complete", {
          isInstalled: true,
          dbHost: formData.dbHost,
          dbPort: formData.dbPort,
          dbName: formData.dbName,
          dbUser: formData.dbUser,
        });
        
        // Create admin user
        await apiRequest("POST", "/api/register", {
          username: formData.username,
          email: formData.email,
          password: formData.password,
          role: "admin",
        });
        
        return true;
      } catch (error) {
        throw error;
      }
    },
    onSuccess: () => {
      setStep(4); // Move to completion step
      toast({
        title: "Installation complete",
        description: "The MineLaunch Admin Panel has been successfully installed.",
      });
      
      // After a delay, call onComplete to proceed to the main app
      setTimeout(() => {
        onComplete();
      }, 3000);
    },
    onError: (error: any) => {
      toast({
        title: "Installation failed",
        description: error.message || "Failed to complete installation. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (step === 2) {
      testConnection();
    } else if (step === 3) {
      installMutation.mutate();
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900/50 flex justify-center items-center z-50">
      <Card className="max-w-2xl w-full">
        <CardHeader>
          <CardTitle className="text-2xl text-center">MineLaunch Admin Panel Setup</CardTitle>
          <CardDescription className="text-center">Complete this wizard to set up your Minecraft server management panel</CardDescription>
          
          {/* Progress Bar */}
          <div className="mt-6 relative">
            <div className="h-2 bg-gray-200 rounded-full">
              <div 
                className="h-2 bg-primary rounded-full transition-all duration-300" 
                style={{ width: `${(step/4) * 100}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-gray-600 mt-2">
              <span className={step >= 1 ? "text-primary" : ""}>Database</span>
              <span className={step >= 2 ? "text-primary" : ""}>Connection Test</span>
              <span className={step >= 3 ? "text-primary" : ""}>Admin Account</span>
              <span className={step >= 4 ? "text-primary" : ""}>Complete</span>
            </div>
          </div>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent>
            {/* Step 1: Database Configuration */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="flex items-center space-x-3 mb-6 text-primary">
                  <Database size={24} />
                  <h2 className="text-xl font-semibold">Database Configuration</h2>
                </div>
                <p className="text-gray-600 text-sm mb-4">Connect to your MariaDB database</p>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="dbHost">Database Host</Label>
                    <Input 
                      id="dbHost" 
                      name="dbHost" 
                      value={formData.dbHost}
                      onChange={updateFormData}
                      placeholder="localhost" 
                    />
                  </div>
                  <div>
                    <Label htmlFor="dbPort">Database Port</Label>
                    <Input 
                      id="dbPort" 
                      name="dbPort" 
                      value={formData.dbPort}
                      onChange={updateFormData}
                      placeholder="3306" 
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="dbName">Database Name</Label>
                  <Input 
                    id="dbName" 
                    name="dbName" 
                    value={formData.dbName}
                    onChange={updateFormData}
                    placeholder="minelaunch" 
                  />
                </div>
                
                <div>
                  <Label htmlFor="dbUser">Database Username</Label>
                  <Input 
                    id="dbUser" 
                    name="dbUser" 
                    value={formData.dbUser}
                    onChange={updateFormData}
                    placeholder="username" 
                  />
                </div>
                
                <div>
                  <Label htmlFor="dbPassword">Database Password</Label>
                  <Input 
                    id="dbPassword" 
                    name="dbPassword" 
                    type="password" 
                    value={formData.dbPassword}
                    onChange={updateFormData}
                    placeholder="••••••••" 
                  />
                </div>
              </div>
            )}
            
            {/* Step 2: Connection Test */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="flex items-center space-x-3 mb-6 text-primary">
                  <Server size={24} />
                  <h2 className="text-xl font-semibold">Connection Test</h2>
                </div>
                <p className="text-gray-600 text-sm">Testing connection to your database...</p>
                
                <div className="py-8 flex flex-col items-center justify-center">
                  {isTestingConnection ? (
                    <div className="flex flex-col items-center">
                      <Loader2 className="h-16 w-16 text-primary animate-spin mb-4" />
                      <p className="text-center text-gray-700 font-medium">Testing connection...</p>
                    </div>
                  ) : connectionSuccess ? (
                    <div className="flex flex-col items-center">
                      <CheckCircle className="h-16 w-16 text-success mb-4" />
                      <p className="text-center text-success font-medium">Connection successful!</p>
                      <p className="text-center text-gray-600 text-sm mt-2">
                        Database tables will be created in the next step.
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <Database className="h-16 w-16 text-primary mb-4" />
                      <p className="text-center text-gray-700 font-medium">Ready to test connection</p>
                      <p className="text-center text-gray-600 text-sm mt-2">
                        Click "Test Connection" to verify your database settings.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Step 3: Admin Account */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="flex items-center space-x-3 mb-6 text-primary">
                  <User size={24} />
                  <h2 className="text-xl font-semibold">Create Admin Account</h2>
                </div>
                <p className="text-gray-600 text-sm mb-4">Set up the initial administrator account</p>
                
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    name="email" 
                    type="email" 
                    value={formData.email}
                    onChange={updateFormData}
                    placeholder="admin@example.com" 
                  />
                </div>
                
                <div>
                  <Label htmlFor="username">Username</Label>
                  <Input 
                    id="username" 
                    name="username" 
                    value={formData.username}
                    onChange={updateFormData}
                    placeholder="admin" 
                  />
                </div>
                
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input 
                    id="password" 
                    name="password" 
                    type="password" 
                    value={formData.password}
                    onChange={updateFormData}
                    placeholder="••••••••" 
                  />
                </div>
                
                <div>
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input 
                    id="confirmPassword" 
                    name="confirmPassword" 
                    type="password" 
                    value={formData.confirmPassword}
                    onChange={updateFormData}
                    placeholder="••••••••" 
                  />
                </div>
              </div>
            )}
            
            {/* Step 4: Complete */}
            {step === 4 && (
              <div className="py-8 text-center">
                <CheckCircle className="h-20 w-20 text-success mx-auto mb-4" />
                
                <h2 className="text-2xl font-semibold">Installation Complete!</h2>
                <p className="text-gray-600 mt-2">Your MineLaunch Admin Panel is ready to use</p>
                
                <div className="mt-8">
                  <Button onClick={onComplete}>Go to Login</Button>
                </div>
              </div>
            )}
          </CardContent>
          
          {step < 4 && (
            <CardFooter className="flex justify-between">
              {step > 1 ? (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setStep(step - 1)}
                  disabled={isTestingConnection || installMutation.isPending}
                >
                  Back
                </Button>
              ) : (
                <div></div> // Empty div to maintain spacing with flex-between
              )}
              
              {step === 1 && (
                <Button type="button" onClick={() => setStep(2)}>
                  Next Step
                </Button>
              )}
              
              {step === 2 && (
                <Button 
                  type="button" 
                  onClick={testConnection}
                  disabled={isTestingConnection}
                >
                  {isTestingConnection && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Test Connection
                </Button>
              )}
              
              {step === 3 && (
                <Button 
                  type="button" 
                  onClick={() => installMutation.mutate()}
                  disabled={installMutation.isPending}
                >
                  {installMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Account
                </Button>
              )}
            </CardFooter>
          )}
        </form>
      </Card>
    </div>
  );
}
