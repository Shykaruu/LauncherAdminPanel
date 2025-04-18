import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Mod } from "@shared/schema";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Edit, Trash } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
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
import { formatBytes } from "@/lib/utils";

interface ModTableProps {
  serverId: string;
  onEdit: (mod: Mod) => void;
}

export function ModTable({ serverId, onEdit }: ModTableProps) {
  const [currentTab, setCurrentTab] = useState("required");
  const [modToDelete, setModToDelete] = useState<Mod | null>(null);
  const { toast } = useToast();
  
  // Fetch mods for server
  const { data: mods, isLoading, error } = useQuery<Mod[]>({
    queryKey: ["/api/servers", serverId, "mods"],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/servers/${serverId}/mods`);
      return response.json();
    }
  });
  
  // Delete mod mutation
  const deleteMutation = useMutation({
    mutationFn: async (modId: number) => {
      await apiRequest("DELETE", `/api/mods/${modId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/servers", serverId, "mods"] });
      toast({
        title: "Mod deleted",
        description: "The mod has been deleted successfully."
      });
      setModToDelete(null);
    },
    onError: (error) => {
      toast({
        title: "Failed to delete mod",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Filter mods based on current tab
  const filteredMods = mods ? mods.filter(mod => {
    if (currentTab === "required") return mod.required;
    if (currentTab === "optional-on") return !mod.required && mod.optionalDefault;
    if (currentTab === "optional-off") return !mod.required && !mod.optionalDefault;
    return true;
  }) : [];
  
  // Loading state
  if (isLoading) {
    return <ModTableSkeleton />;
  }
  
  // Error state
  if (error) {
    return (
      <div className="bg-destructive/10 p-4 rounded-md text-destructive">
        Error loading mods: {error.message}
      </div>
    );
  }
  
  return (
    <>
      <Tabs defaultValue="required" value={currentTab} onValueChange={setCurrentTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="required">Required Mods</TabsTrigger>
          <TabsTrigger value="optional-on">Optional (On by Default)</TabsTrigger>
          <TabsTrigger value="optional-off">Optional (Off by Default)</TabsTrigger>
        </TabsList>
        
        <TabsContent value={currentTab} className="mt-0">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>ID</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMods.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        No {currentTab.replace('-', ' ')} mods available for this server.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredMods.map((mod) => (
                      <TableRow key={mod.id}>
                        <TableCell>
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8 flex items-center justify-center bg-gray-100 rounded">
                              <PackageIcon className="h-5 w-5 text-gray-500" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{mod.name}</div>
                              <div className="text-sm text-gray-500">{mod.type}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">{mod.modId}</TableCell>
                        <TableCell className="text-sm text-gray-500">{mod.version || "N/A"}</TableCell>
                        <TableCell className="text-sm text-gray-500">{mod.size ? formatBytes(mod.size) : "N/A"}</TableCell>
                        <TableCell>
                          <Badge variant={mod.enabled ? "success" : "secondary"}>
                            {mod.enabled ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => onEdit(mod)}
                            >
                              <Edit className="h-5 w-5" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => setModToDelete(mod)}
                            >
                              <Trash className="h-5 w-5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>
      </Tabs>
      
      <AlertDialog open={!!modToDelete} onOpenChange={(open) => !open && setModToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the mod "{modToDelete?.name}".
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => modToDelete && deleteMutation.mutate(modToDelete.id)}
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

function ModTableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex space-x-2 mb-6">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-10 w-48" />
      </div>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(3)].map((_, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <div className="flex items-center">
                      <Skeleton className="h-8 w-8 rounded" />
                      <div className="ml-4">
                        <Skeleton className="h-4 w-32 mb-1" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Skeleton className="h-8 w-8 rounded" />
                      <Skeleton className="h-8 w-8 rounded" />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

function PackageIcon(props: React.SVGAttributes<SVGElement>) {
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
      <path d="m16.5 9.4-9-5.19M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.29 7 12 12 20.71 7" />
      <line x1="12" x2="12" y1="22" y2="12" />
    </svg>
  );
}
