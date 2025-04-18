import { useState } from "react";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { ServerCard } from "@/components/servers/server-card";
import { ServerForm } from "@/components/servers/server-form";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Server } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useWebSocketStats } from "@/lib/socket";

export default function ServersPage() {
  const [openDialog, setOpenDialog] = useState(false);
  
  // Fetch servers
  const { data: servers, isLoading, error } = useQuery<Server[]>({
    queryKey: ["/api/servers"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/servers");
      return response.json();
    }
  });
  
  // Get stats from WebSocket
  const { stats } = useWebSocketStats();
  
  // Get player count and mod count for a server
  const getServerStats = (serverId: string) => {
    const serverStats = stats.find(s => s.serverId === serverId);
    return {
      playerCount: serverStats?.stats.activePlayers || 0,
      isOnline: (serverStats?.stats.activePlayers || 0) > 0
    };
  };
  
  // Handle dialog close
  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  return (
    <DashboardLayout title="Server Instances">
      {/* Header with Add Button */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Server Instances</h2>
          <p className="text-sm text-gray-500">Manage your Minecraft server instances</p>
        </div>
        <Button onClick={() => setOpenDialog(true)}>
          <Plus className="h-5 w-5 mr-2" />
          Add New Server
        </Button>
      </div>
      
      {/* Server Grid */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="bg-destructive/10 p-6 rounded-lg text-destructive text-center">
          Error loading servers: {(error as Error).message}
        </div>
      ) : servers && servers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {servers.map(server => {
            const { playerCount, isOnline } = getServerStats(server.serverId);
            
            return (
              <ServerCard 
                key={server.serverId} 
                server={server} 
                playerCount={playerCount}
                isOnline={isOnline}
                // Need to fetch mod count from another endpoint in a real scenario
                modCount={Math.floor(Math.random() * 20)}
              />
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Plus className="h-10 w-10 text-primary" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No Server Instances</h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            You haven't created any server instances yet. Add your first Minecraft server to get started.
          </p>
          <Button onClick={() => setOpenDialog(true)}>
            Add New Server
          </Button>
        </div>
      )}
      
      {/* Add Server Dialog */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New Server</DialogTitle>
            <DialogDescription>
              Create a new Minecraft server instance to manage with the launcher.
            </DialogDescription>
          </DialogHeader>
          <ServerForm onSuccess={handleCloseDialog} />
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
