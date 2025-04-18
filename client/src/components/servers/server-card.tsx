import { Server } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Package, FileText, Play, Trash } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ServerCardProps {
  server: Server;
  playerCount?: number;
  modCount?: number;
  isOnline?: boolean;
}

export function ServerCard({ 
  server, 
  playerCount = 0, 
  modCount = 0, 
  isOnline = false 
}: ServerCardProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const { toast } = useToast();

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/servers/${server.serverId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/servers"] });
      toast({
        title: "Server deleted",
        description: `${server.name} has been deleted successfully.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete server",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDelete = () => {
    deleteMutation.mutate();
    setDeleteDialogOpen(false);
  };

  return (
    <>
      <Card className="overflow-hidden h-full">
        <div className="relative h-40 bg-gray-100">
          {/* Server Banner Image with rounded corners at top */}
          <div 
            className="w-full h-full bg-primary/20 flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, var(--primary) 0%, var(--primary)/40% 100%)`,
            }}
          >
            <span className="text-2xl font-bold text-white">{server.name}</span>
          </div>
          
          {/* Status Badge */}
          <Badge 
            variant={isOnline ? "success" : "destructive"} 
            className="absolute top-3 right-3"
          >
            {isOnline ? "Online" : "Offline"}
          </Badge>
        </div>
        
        <div className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-800">{server.name}</h3>
            <div className="text-sm text-gray-500">{server.minecraftVersion}</div>
          </div>
          
          <p className="text-sm text-gray-600 mb-4">
            {server.description || "No description provided"}
          </p>
          
          <div className="flex items-center justify-between text-sm mb-4">
            <span className="flex items-center text-gray-600">
              <Users className="h-4 w-4 mr-1" />
              {playerCount} players
            </span>
            <span className="flex items-center text-gray-600">
              <Package className="h-4 w-4 mr-1" />
              {modCount} mods
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <div className="flex space-x-2">
              <Button variant="ghost" size="icon" asChild>
                <Link href={`/servers/edit/${server.serverId}`}>
                  <Edit className="h-5 w-5" />
                </Link>
              </Button>
              <Button variant="ghost" size="icon" asChild>
                <Link href={`/mods?server=${server.serverId}`}>
                  <Package className="h-5 w-5" />
                </Link>
              </Button>
              <Button variant="ghost" size="icon" asChild>
                <Link href={`/files?server=${server.serverId}`}>
                  <FileText className="h-5 w-5" />
                </Link>
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-destructive hover:text-destructive hover:bg-destructive/10" 
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash className="h-5 w-5" />
              </Button>
            </div>
            <div className="flex space-x-2">
              {!isOnline && (
                <Button size="sm" className="bg-success hover:bg-success/90">
                  <Play className="h-4 w-4 mr-1" />
                  Start
                </Button>
              )}
              <Button size="sm" asChild>
                <Link href={`/servers/${server.serverId}`}>
                  Manage
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the server "{server.name}" and all its associated mods and files.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// Extra component to avoid import error
function Users(props: any) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      {...props}
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
