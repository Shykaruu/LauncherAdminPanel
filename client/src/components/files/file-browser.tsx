import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { File } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Plus, RefreshCw, Folder, FileText, Image, FileCode, File as FileIcon, Upload } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { useDropzone } from 'react-dropzone';

interface FileBrowserProps {
  serverId: string;
  onFileSelect: (file: File) => void;
}

export function FileBrowser({ serverId, onFileSelect }: FileBrowserProps) {
  const [currentPath, setCurrentPath] = useState("");
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const { toast } = useToast();

  // Fonction utilitaire pour formater les tailles de fichiers
  function formatBytes(bytes: number | undefined): string {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  // Fetch files
  const { data: files, isLoading, error, refetch } = useQuery<File[]>({
    queryKey: ["/api/servers", serverId, "files", { path: currentPath }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (currentPath) params.append("path", currentPath);

      const response = await apiRequest("GET", `/api/servers/${serverId}/files?${params}`);
      const allFiles = await response.json();
      
      // Filtrer pour n'afficher que les fichiers du dossier courant
      return allFiles.filter((file: File) => {
        if (!currentPath && !file.path.includes('/')) {
          return true;
        }
        if (currentPath) {
          const parentPath = currentPath + '/';
          return file.path.startsWith(parentPath) && 
                 !file.path.slice(parentPath.length).includes('/');
        }
        return false;
      });
    }
  });

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!acceptedFiles || acceptedFiles.length === 0) return;
    const formData = new FormData();
    formData.append('file', acceptedFiles[0]);
    if (currentPath) {
      formData.append('path', currentPath);
    }

    try {
      const params = new URLSearchParams();
      if (currentPath) params.append('path', currentPath);
      
      await apiRequest('POST', `/api/files/${serverId}/upload?${params}`, formData, { isFormData: true });
      toast({
        title: 'File uploaded successfully!',
        description: `File ${acceptedFiles[0].name} uploaded to ${currentPath || 'root'}`,
      });
      refetch();
    } catch (err) {
      toast({
        title: 'Error uploading file',
        description: `Error uploading ${acceptedFiles[0].name}: ${err.message}`,
        variant: 'destructive'
      })
    }
  }, [currentPath, serverId, refetch, toast]);

  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  // Handle folder click
  const handleFolderClick = (path: string) => {
    setCurrentPath(path);
  };

  // Handle navigate up
  const handleNavigateUp = () => {
    if (!currentPath) return;

    const parts = currentPath.split("/");
    parts.pop();
    setCurrentPath(parts.join("/"));
  };

  // Handle refresh
  const handleRefresh = () => {
    refetch();
  };

  const handleDelete = async (path: string, isDirectory: boolean) => {
    try {
      await apiRequest("DELETE", `/api/files/${serverId}/delete`, { 
        body: JSON.stringify({ path, isDirectory }) 
      });
      refetch();
      toast({
        title: `${isDirectory ? 'Folder' : 'File'} deleted`,
        description: `Successfully deleted ${path}`
      });
    } catch (err) {
      toast({
        title: `Failed to delete ${isDirectory ? 'folder' : 'file'}`,
        description: err.message,
        variant: "destructive"
      });
    }
  };

  // Render file icon based on file type/extension
  const renderFileIcon = (file: File) => {
    if (file.isDirectory) {
      return <Folder className="h-5 w-5 text-primary" />;
    }

    const path = file.path;
    const extension = path.split(".").pop()?.toLowerCase();

    switch (extension) {
      case "txt":
      case "log":
      case "properties":
        return <FileText className="h-5 w-5 text-gray-500" />;
      case "png":
      case "jpg":
      case "jpeg":
      case "gif":
        return <Image className="h-5 w-5 text-indigo-500" />;
      case "json":
      case "yml":
      case "yaml":
      case "xml":
      case "js":
      case "css":
      case "html":
        return <FileCode className="h-5 w-5 text-amber-500" />;
      default:
        return <FileIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  // Loading state
  if (isLoading) {
    return <FileBrowserSkeleton />;
  }

  // Error state
  if (error) {
    return (
      <div className="bg-destructive/10 p-4 rounded-md text-destructive">
        Error loading files: {error.message}
      </div>
    );
  }

  // Breadcrumb paths
  const pathParts = currentPath ? currentPath.split("/") : [];

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden h-full flex flex-col">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="font-medium text-gray-700">File Browser</h3>
        <div className="flex space-x-2">
          <div {...getRootProps({ className: 'dropzone' })}>
            <input {...getInputProps()} />
            <Button variant="outline" size="icon">
              <Upload className="h-4 w-4" />
            </Button>
          </div>
          <Button variant="outline" size="icon" onClick={async () => {
            const name = window.prompt("Enter folder name");
            if (name) {
              try {
                const fullPath = currentPath ? `${currentPath}/${name}` : name;
                await apiRequest('POST', `/api/files/${serverId}/mkdir`, { path: fullPath });
                refetch();
                toast({
                  title: 'Folder created',
                  description: `Created folder ${name}`,
                });
              } catch (err) {
                toast({
                  title: 'Error creating folder',
                  description: `Failed to create folder: ${err.message}`,
                  variant: 'destructive'
                });
              }
            }
          }}>
            <Plus className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Breadcrumb navigation */}
      <div className="px-4 py-2 border-b border-gray-200 flex items-center overflow-x-auto">
        <Button
          variant="ghost"
          size="sm"
          className="text-sm font-medium text-primary"
          onClick={() => setCurrentPath("")}
        >
          root
        </Button>

        {pathParts.map((part, index) => (
          <div key={index} className="flex items-center">
            <span className="mx-1 text-gray-500">/</span>
            <Button
              variant="ghost"
              size="sm"
              className="text-sm font-medium text-primary"
              onClick={() => setCurrentPath(pathParts.slice(0, index + 1).join("/"))}
            >
              {part}
            </Button>
          </div>
        ))}
      </div>

      <div className="p-2 flex-1 overflow-auto">
        {files?.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-500">
            This folder is empty
          </div>
        ) : (
          <ul className="space-y-1">
            {currentPath && (
              <li>
                <button
                  onClick={handleNavigateUp}
                  className="flex items-center w-full p-2 rounded hover:bg-gray-100 file-tree-item"
                >
                  <Folder className="h-5 w-5 text-gray-500 mr-2" />
                  <span className="text-sm">..</span>
                </button>
              </li>
            )}

            {/* Directories first */}
            {files?.filter(file => file.isDirectory).map((file) => (
              <li key={file.id}>
                <div className="flex items-center justify-between w-full p-2 rounded hover:bg-gray-100 file-tree-item">
                  <button
                    onClick={() => handleFolderClick(file.path)}
                    className="flex items-center flex-1"
                  >
                    {renderFileIcon(file)}
                    <span className="text-sm ml-2">{file.path.split("/").pop()}</span>
                  </button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-500 hover:text-red-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('Êtes-vous sûr de vouloir supprimer ce dossier et tout son contenu ?')) {
                        handleDelete(file.path, true);
                      }
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                  </Button>
                </div>
              </li>
            ))}

            {/* Files second */}
            {files?.filter(file => !file.isDirectory).map((file) => (
              <li key={file.id}>
                <div className="flex items-center justify-between w-full p-2 rounded hover:bg-gray-100 file-tree-item">
                  <button
                    onClick={() => {
                      onFileSelect(file);
                      setPreviewFile(file);
                      setPreviewOpen(true);
                    }}
                    className="flex items-center flex-1"
                  >
                    {renderFileIcon(file)}
                    <span className="text-sm ml-2">{file.path.split("/").pop()}</span>
                  </button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-500 hover:text-red-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('Êtes-vous sûr de vouloir supprimer ce fichier ?')) {
                        handleDelete(file.path, false);
                      }
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>File Details</DialogTitle>
          </DialogHeader>
          {previewFile && (
            <div className="space-y-4">
              <p><strong>Name:</strong> {previewFile.name}</p>
              <p><strong>Path:</strong> {previewFile.path}</p>
              <p><strong>Size:</strong> {previewFile.size ? formatBytes(previewFile.size) : 'N/A'}</p>
              <p><strong>Last Modified:</strong> {new Date(previewFile.lastModified).toLocaleString()}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FileBrowserSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden h-full flex flex-col">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <Skeleton className="h-5 w-36" />
        <div className="flex space-x-2">
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-8 w-8 rounded" />
        </div>
      </div>

      <div className="px-4 py-2 border-b border-gray-200">
        <Skeleton className="h-6 w-48" />
      </div>

      <div className="p-2 flex-1">
        <ul className="space-y-1">
          {[...Array(6)].map((_, index) => (
            <li key={index}>
              <div className="flex items-center p-2">
                <Skeleton className="h-5 w-5 mr-2" />
                <Skeleton className="h-4 w-32" />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}