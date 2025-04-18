import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { FileBrowser } from "@/components/files/file-browser";
import { CodeEditor } from "@/components/files/code-editor";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useQuery } from "@tanstack/react-query";
import { Server, File } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";
import { useLocation } from "wouter";

export default function FilesPage() {
  const [, params] = useLocation();
  const searchParams = new URLSearchParams(params);
  const initialServerId = searchParams.get("server");
  
  const [selectedServer, setSelectedServer] = useState<string>(initialServerId || "");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // Fetch servers
  const { data: servers, isLoading: isLoadingServers } = useQuery<Server[]>({
    queryKey: ["/api/servers"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/servers");
      return response.json();
    }
  });
  
  // If no server is selected, use the first one from the list
  useEffect(() => {
    if (servers && servers.length > 0 && !selectedServer) {
      setSelectedServer(servers[0].serverId);
    }
  }, [servers, selectedServer]);
  
  // Handle file selection
  const handleFileSelect = (file: File) => {
    if (file.isDirectory) return;
    setSelectedFile(file);
  };
  
  // Handle close editor
  const handleCloseEditor = () => {
    setSelectedFile(null);
  };

  return (
    <DashboardLayout title="File Manager">
      {/* Header with Server Selector */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 space-y-4 md:space-y-0">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">File Manager</h2>
          <p className="text-sm text-gray-500">Browse and edit files in your Minecraft server instances</p>
        </div>
        
        <div className="w-60">
          <Label htmlFor="fileServerSelect" className="block text-sm font-medium text-gray-700 mb-1">
            Select Server
          </Label>
          {isLoadingServers ? (
            <div className="h-10 bg-gray-100 rounded animate-pulse"></div>
          ) : (
            <Select 
              value={selectedServer} 
              onValueChange={(value) => {
                setSelectedServer(value);
                setSelectedFile(null); // Reset selected file when changing servers
              }}
              disabled={!servers || servers.length === 0}
            >
              <SelectTrigger id="fileServerSelect">
                <SelectValue placeholder="Select a server" />
              </SelectTrigger>
              <SelectContent>
                {servers?.map(server => (
                  <SelectItem key={server.serverId} value={server.serverId}>
                    {server.name} ({server.minecraftVersion})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>
      
      {/* File Manager */}
      {isLoadingServers ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : !servers || servers.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <ServerIcon className="h-10 w-10 text-primary" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No Servers Available</h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            You need to create a server instance before you can manage files.
          </p>
          <a href="/servers" className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-primary text-primary-foreground hover:bg-primary/90 h-10 py-2 px-4">
            Add Server
          </a>
        </div>
      ) : !selectedServer ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <h3 className="text-xl font-semibold mb-2">Select a Server</h3>
          <p className="text-gray-500 mb-6">
            Please select a server from the dropdown to manage its files.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* File Browser */}
          <div className="lg:col-span-1 h-[calc(100vh-240px)]">
            <FileBrowser 
              serverId={selectedServer} 
              onFileSelect={handleFileSelect} 
            />
          </div>
          
          {/* Code Editor */}
          <div className="lg:col-span-3 h-[calc(100vh-240px)]">
            <CodeEditor 
              file={selectedFile} 
              onClose={handleCloseEditor} 
            />
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

// Helper ServerIcon component
function ServerIcon(props: React.SVGAttributes<SVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect>
      <rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect>
      <line x1="6" y1="6" x2="6.01" y2="6"></line>
      <line x1="6" y1="18" x2="6.01" y2="18"></line>
    </svg>
  );
}
