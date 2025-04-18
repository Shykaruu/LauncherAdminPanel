import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertServerSchema, Server } from "@shared/schema";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { v4 as uuidv4 } from 'uuid';

// Extend schema with additional validation
const serverFormSchema = insertServerSchema.extend({
  name: z.string().min(3, "Name must be at least 3 characters"),
  minecraftVersion: z.string().min(1, "Minecraft version is required"),
});

// Define props
interface ServerFormProps {
  server?: Server;
  onSuccess?: () => void;
}

// Available Minecraft versions
const minecraftVersions = [
  "1.20.4", "1.20.3", "1.20.2", "1.20.1", "1.20", 
  "1.19.4", "1.19.3", "1.19.2", "1.19.1", "1.19", 
  "1.18.2", "1.18.1", "1.18", 
  "1.17.1", "1.17", 
  "1.16.5", "1.16.4", "1.16.3", "1.16.2", "1.16.1", "1.16", 
  "1.15.2", "1.15.1", "1.15", 
  "1.14.4", "1.14.3", "1.14.2", "1.14.1", "1.14", 
  "1.13.2", "1.13.1", "1.13", 
  "1.12.2", "1.12.1", "1.12", 
  "1.11.2", "1.11.1", "1.11", 
  "1.10.2", "1.10.1", "1.10", 
  "1.9.4", "1.9.3", "1.9.2", "1.9.1", "1.9", 
  "1.8.9", "1.8.8", "1.8.7", "1.8.6", "1.8.5", "1.8.4", "1.8.3", "1.8.2", "1.8.1", "1.8",
  "1.7.10", "1.7.9", "1.7.8", "1.7.7", "1.7.6", "1.7.5", "1.7.4", "1.7.3", "1.7.2"
];

// Available loader types
const loaderTypes = ["Fabric", "Forge"];

export function ServerForm({ server, onSuccess }: ServerFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [fabricVersions, setFabricVersions] = useState<string[]>([]);
  const [forgeVersions, setForgeVersions] = useState<string[]>([]);
  
  // Create form
  const form = useForm<z.infer<typeof serverFormSchema>>({
    resolver: zodResolver(serverFormSchema),
    defaultValues: server ? {
      ...server
    } : {
      serverId: uuidv4(),
      name: "",
      description: "",
      icon: "",
      version: "1.0.0",
      address: "",
      minecraftVersion: "1.20.1",
      loaderType: "Fabric",
      loaderVersion: "",
      mainServer: false,
      autoconnect: false
    }
  });
  
  const selectedMinecraftVersion = form.watch("minecraftVersion");
  const selectedLoaderType = form.watch("loaderType");
  
  // Load loader versions based on Minecraft version and loader type
  useEffect(() => {
    if (!selectedMinecraftVersion || !selectedLoaderType) return;
    
    const fetchLoaderVersions = async () => {
      setIsLoading(true);
      try {
        if (selectedLoaderType === "Fabric") {
          // Fetch real Fabric versions from Fabric meta API
          try {
            const response = await fetch(`https://meta.fabricmc.net/v2/versions/loader/${selectedMinecraftVersion}`);
            
            if (!response.ok) {
              throw new Error(`Failed to fetch Fabric versions: ${response.status}`);
            }
            
            const fabricData = await response.json();
            
            // Extract loader versions and sort in descending order (newest first)
            if (Array.isArray(fabricData)) {
              const versions = fabricData.map(item => item.loader.version);
              setFabricVersions(versions);
            } else {
              throw new Error("Invalid data format from Fabric API");
            }
          } catch (apiError) {
            console.error("Error fetching from Fabric API:", apiError);
            // Fallback versions if the API call fails
            setFabricVersions([
              "0.15.0", "0.14.24", "0.14.23", "0.14.22", "0.14.21", "0.14.20", 
              "0.14.19", "0.14.18", "0.14.17", "0.14.16", "0.14.15", "0.14.14"
            ]);
          }
        } else if (selectedLoaderType === "Forge") {
          // Fetch real Forge versions (for demonstration, using simulated data)
          // In a real implementation, you would fetch from the Forge API
          // The implementation depends on the available Forge API endpoints
          
          // Simulate different versions based on Minecraft version
          // In reality, you'd fetch this from an API
          const forgeVersionMap: Record<string, string[]> = {
            "1.20.1": ["47.1.0", "47.0.35", "47.0.19", "47.0.1", "47.0.0"],
            "1.19.4": ["45.1.0", "45.0.64", "45.0.50", "45.0.45"],
            "1.18.2": ["40.2.0", "40.1.80", "40.1.73", "40.1.0"],
            "1.16.5": ["36.2.39", "36.2.20", "36.2.0", "36.1.0"],
            "1.12.2": ["14.23.5.2860", "14.23.5.2847", "14.23.5.2838"],
            "1.7.10": ["10.13.4.1614", "10.13.4.1566", "10.13.4.1558"]
          };
          
          // Get appropriate versions or fallback to defaults
          const versions = forgeVersionMap[selectedMinecraftVersion] || 
                        ["47.1.0", "45.1.0", "40.2.0", "36.2.39", "14.23.5.2860"];
          
          setForgeVersions(versions);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching loader versions:", error);
        toast({
          title: "Failed to fetch loader versions",
          description: "Could not retrieve loader versions. Please try again.",
          variant: "destructive"
        });
        setIsLoading(false);
      }
    };
    
    fetchLoaderVersions();
  }, [selectedMinecraftVersion, selectedLoaderType, toast]);
  
  // Create or update server mutation
  const serverMutation = useMutation({
    mutationFn: async (data: z.infer<typeof serverFormSchema>) => {
      if (server) {
        // Update existing server
        return await apiRequest("PATCH", `/api/servers/${server.serverId}`, data);
      } else {
        // Create new server
        return await apiRequest("POST", "/api/servers", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/servers"] });
      toast({
        title: server ? "Server updated" : "Server created",
        description: server 
          ? `${form.getValues().name} has been updated successfully.`
          : `${form.getValues().name} has been created successfully.`
      });
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast({
        title: server ? "Failed to update server" : "Failed to create server",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Form submission
  const onSubmit = (data: z.infer<typeof serverFormSchema>) => {
    serverMutation.mutate(data);
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-full overflow-x-hidden">
        {/* Responsive form sections using CSS Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Server Name</FormLabel>
                <FormControl>
                  <Input placeholder="My Minecraft Server" {...field} />
                </FormControl>
                <FormDescription className="text-xs sm:text-sm">
                  A display name for your server instance.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="serverId"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Server ID</FormLabel>
                <FormControl>
                  <Input {...field} readOnly className="text-gray-500" />
                </FormControl>
                <FormDescription className="text-xs sm:text-sm">
                  Unique identifier for the server instance.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="A modded Minecraft server with awesome features..." 
                  {...field} 
                  className="min-h-[80px]"
                />
              </FormControl>
              <FormDescription className="text-xs sm:text-sm">
                A brief description of your server.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Minecraft Version section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <FormField
            control={form.control}
            name="minecraftVersion"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Minecraft Version</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a Minecraft version" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="max-h-[300px]">
                    {minecraftVersions.map((version) => (
                      <SelectItem key={version} value={version}>{version}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="loaderType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Loader Type</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a loader type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {loaderTypes.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        {/* Loader Version section */}
        <FormField
          control={form.control}
          name="loaderVersion"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Loader Version</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value}
                disabled={isLoading}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    {isLoading ? (
                      <div className="flex items-center">
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        <span>Loading versions...</span>
                      </div>
                    ) : (
                      <SelectValue placeholder={`Select a ${selectedLoaderType} version`} />
                    )}
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="max-h-[200px]">
                  {selectedLoaderType === "Fabric" 
                    ? fabricVersions.map(version => (
                        <SelectItem key={version} value={version}>{version}</SelectItem>
                      ))
                    : forgeVersions.map(version => (
                        <SelectItem key={version} value={version}>{version}</SelectItem>
                      ))
                  }
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Server Address & Version section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Server Address</FormLabel>
                <FormControl>
                  <Input placeholder="play.example.com:25565" {...field} />
                </FormControl>
                <FormDescription className="text-xs sm:text-sm">
                  The server address with optional port.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="version"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Server Version</FormLabel>
                <FormControl>
                  <Input placeholder="1.0.0" {...field} />
                </FormControl>
                <FormDescription className="text-xs sm:text-sm">
                  The version number for this configuration.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        {/* Checkboxes section - responsive stacking on mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <FormField
            control={form.control}
            name="mainServer"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3 sm:p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Main Server</FormLabel>
                  <FormDescription className="text-xs sm:text-sm">
                    Set this server as the main server in the launcher.
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="autoconnect"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3 sm:p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Auto Connect</FormLabel>
                  <FormDescription className="text-xs sm:text-sm">
                    Automatically connect to this server when the launcher starts.
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
        </div>
        
        {/* Server Icon URL */}
        <FormField
          control={form.control}
          name="icon"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Server Icon URL</FormLabel>
              <FormControl>
                <Input placeholder="https://example.com/icon.png" {...field} />
              </FormControl>
              <FormDescription className="text-xs sm:text-sm">
                URL to the server icon image.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Responsive form buttons */}
        <div className="flex flex-col sm:flex-row sm:justify-end mt-6 gap-3 sm:gap-4">
          <Button type="button" variant="outline" onClick={onSuccess} className="w-full sm:w-auto order-2 sm:order-1">
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={serverMutation.isPending || isLoading}
            className="w-full sm:w-auto order-1 sm:order-2"
          >
            {serverMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {server ? "Update Server" : "Create Server"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
