import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, Upload } from "lucide-react";
import { insertModSchema, InsertMod } from "@shared/schema";

interface UploadModDialogProps {
  serverId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UploadModDialog({ serverId, open, onOpenChange }: UploadModDialogProps) {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [modName, setModName] = useState("");
  const [modId, setModId] = useState("");
  const [required, setRequired] = useState(true);
  const [enabled, setEnabled] = useState(true);
  const [optionalType, setOptionalType] = useState<"on" | "off">("on");
  const [isUploading, setIsUploading] = useState(false);
  
  // Upload mod mutation
  const uploadMutation = useMutation({
    mutationFn: async (modData: InsertMod) => {
      return await apiRequest("POST", "/api/mods", modData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/servers", serverId, "mods"] });
      toast({
        title: "Mod uploaded",
        description: `${modName} has been uploaded successfully.`
      });
      resetForm();
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Failed to upload mod",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Handle file change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      
      // Try to parse mod name from filename
      const fileName = selectedFile.name;
      const nameWithoutExtension = fileName.replace(/\.[^/.]+$/, "");
      setModName(nameWithoutExtension);
      
      // Generate a mod ID from the name
      const generatedId = nameWithoutExtension
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");
      setModId(`mod.${generatedId}`);
    }
  };
  
  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select a mod file to upload.",
        variant: "destructive"
      });
      return;
    }
    
    // Simulate file upload
    setIsUploading(true);
    
    try {
      // In a real implementation, we would upload the file to a server here
      // For demo purposes, we'll simulate a file upload delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate a fake URL for the uploaded file
      const fakeUrl = `https://cdn.example.com/mods/${serverId}/${file.name}`;
      
      // Create mod data
      const modData: InsertMod = {
        serverId,
        modId,
        name: modName,
        type: "FabricMod", // Assuming Fabric mod for simplicity
        version: "1.0.0",
        required,
        enabled,
        optionalDefault: !required ? optionalType === "on" : false,
        size: file.size,
        url: fakeUrl,
        md5: "mock-md5-hash-would-be-calculated-server-side"
      };
      
      // Upload mod
      uploadMutation.mutate(modData);
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "There was a problem uploading the mod file.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  // Reset form
  const resetForm = () => {
    setFile(null);
    setModName("");
    setModId("");
    setRequired(true);
    setEnabled(true);
    setOptionalType("on");
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Upload Mod</DialogTitle>
          <DialogDescription>
            Upload a mod file for the server. All mods will be automatically configured in the launcher.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="mod-file" className="col-span-4">
                Mod File
              </Label>
              <div className="col-span-4">
                <div className="flex items-center justify-center w-full">
                  <label
                    htmlFor="mod-file"
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-3 text-gray-500" />
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">
                        JAR files only (MAX. 50MB)
                      </p>
                    </div>
                    <Input
                      id="mod-file"
                      type="file"
                      className="hidden"
                      accept=".jar"
                      onChange={handleFileChange}
                      disabled={isUploading || uploadMutation.isPending}
                    />
                  </label>
                </div>
                {file && (
                  <div className="mt-2 flex items-center justify-between bg-primary/5 px-3 py-2 rounded-md">
                    <span className="text-sm truncate max-w-[350px]">{file.name}</span>
                    <span className="text-xs text-gray-500">{(file.size / (1024 * 1024)).toFixed(2)} MB</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="mod-name" className="text-right">
                Name
              </Label>
              <Input
                id="mod-name"
                value={modName}
                onChange={(e) => setModName(e.target.value)}
                className="col-span-3"
                disabled={isUploading || uploadMutation.isPending}
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="mod-id" className="text-right">
                Mod ID
              </Label>
              <Input
                id="mod-id"
                value={modId}
                onChange={(e) => setModId(e.target.value)}
                className="col-span-3"
                disabled={isUploading || uploadMutation.isPending}
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Type</Label>
              <div className="flex items-center space-x-2 col-span-3">
                <Checkbox
                  id="required"
                  checked={required}
                  onCheckedChange={(checked) => setRequired(!!checked)}
                  disabled={isUploading || uploadMutation.isPending}
                />
                <label
                  htmlFor="required"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Required (Always included)
                </label>
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Status</Label>
              <div className="flex items-center space-x-2 col-span-3">
                <Checkbox
                  id="enabled"
                  checked={enabled}
                  onCheckedChange={(checked) => setEnabled(!!checked)}
                  disabled={isUploading || uploadMutation.isPending}
                />
                <label
                  htmlFor="enabled"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Enabled
                </label>
              </div>
            </div>
            
            {!required && (
              <div className="grid grid-cols-4 items-start gap-4">
                <Label className="text-right pt-2">Optional Default</Label>
                <RadioGroup
                  value={optionalType}
                  onValueChange={(value) => setOptionalType(value as "on" | "off")}
                  className="col-span-3"
                  disabled={isUploading || uploadMutation.isPending}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="on" id="on" />
                    <Label htmlFor="on" className="font-normal">On by default</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="off" id="off" />
                    <Label htmlFor="off" className="font-normal">Off by default</Label>
                  </div>
                </RadioGroup>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isUploading || uploadMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={!file || !modName || !modId || isUploading || uploadMutation.isPending}
            >
              {(isUploading || uploadMutation.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isUploading ? "Uploading..." : uploadMutation.isPending ? "Creating..." : "Upload Mod"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
