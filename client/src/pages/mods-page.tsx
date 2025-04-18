import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { ModTable } from "@/components/mods/mod-table";
import { UploadModDialog } from "@/components/mods/upload-mod-dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useQuery } from "@tanstack/react-query";
import { Server, Mod } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, Upload } from "lucide-react";
import { useLocation } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function ModsPage() {
  const [, params] = useLocation();
  const searchParams = new URLSearchParams(params);
  const initialServerId = searchParams.get("server");
  
  const [selectedServer, setSelectedServer] = useState<string>(initialServerId || "");
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [editModDialogOpen, setEditModDialogOpen] = useState(false);
  const [selectedMod, setSelectedMod] = useState<Mod | null>(null);
  
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
  
  // Handle edit mod
  const handleEditMod = (mod: Mod) => {
    setSelectedMod(mod);
    setEditModDialogOpen(true);
  };

  return (
    <DashboardLayout title="Mods Manager">
      {/* Header with Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 space-y-4 md:space-y-0">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Mods Manager</h2>
          <p className="text-sm text-gray-500">Manage mods for your Minecraft server instances</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="w-60">
            <Label htmlFor="serverSelect" className="block text-sm font-medium text-gray-700 mb-1">
              Select Server
            </Label>
            {isLoadingServers ? (
              <div className="h-10 bg-gray-100 rounded animate-pulse"></div>
            ) : (
              <Select 
                value={selectedServer} 
                onValueChange={setSelectedServer}
                disabled={!servers || servers.length === 0}
              >
                <SelectTrigger>
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
          
          <Button 
            onClick={() => setUploadDialogOpen(true)} 
            disabled={!selectedServer}
            className="mt-6"
          >
            <Upload className="h-5 w-5 mr-2" />
            Upload Mod
          </Button>
        </div>
      </div>
      
      {/* Mod Table */}
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
            You need to create a server instance before you can manage mods.
          </p>
          <Button asChild>
            <a href="/servers">Add Server</a>
          </Button>
        </div>
      ) : !selectedServer ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <h3 className="text-xl font-semibold mb-2">Select a Server</h3>
          <p className="text-gray-500 mb-6">
            Please select a server from the dropdown to manage its mods.
          </p>
        </div>
      ) : (
        <ModTable serverId={selectedServer} onEdit={handleEditMod} />
      )}
      
      {/* Upload Mod Dialog */}
      {selectedServer && (
        <UploadModDialog 
          serverId={selectedServer} 
          open={uploadDialogOpen} 
          onOpenChange={setUploadDialogOpen} 
        />
      )}
      
      {/* Edit Mod Dialog - In a real app, would implement a ModForm component */}
      {selectedMod && (
        <Dialog open={editModDialogOpen} onOpenChange={setEditModDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Mod: {selectedMod.name}</DialogTitle>
              <DialogDescription>
                This dialog would contain a form to edit the mod properties.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <p className="text-sm text-gray-500">
                In a complete implementation, this would include fields to edit the mod name, 
                version, required status, and other properties.
              </p>
            </div>
            <div className="flex justify-end">
              <Button onClick={() => setEditModDialogOpen(false)}>
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
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
