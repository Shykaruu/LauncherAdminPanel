import { useState, useRef, ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, X, Check, Image as ImageIcon } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface LogoUploadProps {
  currentLogo?: string;
  onUploadSuccess?: (url: string) => void;
}

export function LogoUpload({ currentLogo, onUploadSuccess }: LogoUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentLogo || null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await apiRequest('POST', '/api/settings/logo', formData, { isFormData: true });
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
      toast({
        title: 'Logo uploaded',
        description: 'Your custom logo has been uploaded successfully.',
      });
      if (onUploadSuccess) {
        onUploadSuccess(data.logoUrl);
      }
      setIsUploading(false);
    },
    onError: (error) => {
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Failed to upload logo',
        variant: 'destructive',
      });
      setError('Failed to upload logo');
      setIsUploading(false);
    }
  });

  // Handle file selection
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }
    
    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('Image size must be less than 2MB');
      return;
    }
    
    // Clear previous error
    setError(null);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    
    // Upload file
    const formData = new FormData();
    formData.append('logo', file);
    setIsUploading(true);
    uploadMutation.mutate(formData);
  };

  // Trigger file input click
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // Remove current logo
  const handleRemove = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    // Here you would also call API to remove the logo if needed
  };

  return (
    <div className="space-y-4">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/png,image/jpeg,image/gif,image/svg+xml"
        className="hidden"
      />
      
      {preview ? (
        <div className="relative">
          <Card className="overflow-hidden">
            <CardContent className="p-2">
              <div className="relative aspect-video flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-md overflow-hidden">
                <img 
                  src={preview} 
                  alt="Logo preview" 
                  className="max-h-48 max-w-full object-contain"
                />
              </div>
            </CardContent>
          </Card>
          <Button 
            size="icon"
            variant="destructive"
            className="absolute -top-2 -right-2 rounded-full h-8 w-8"
            onClick={handleRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors duration-200" onClick={handleUploadClick}>
          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="p-3 bg-primary/10 rounded-full">
              <ImageIcon className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-lg font-medium">Upload your logo</h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              Drag and drop or click to browse. PNG, JPG, GIF or SVG. Max 2MB.
            </p>
          </div>
        </div>
      )}
      
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
      
      <div className="flex space-x-2">
        <Button 
          onClick={handleUploadClick} 
          disabled={isUploading}
          className="flex-1"
        >
          {isUploading ? (
            <>
              <div className="animate-spin mr-2 h-4 w-4 border-2 border-background border-t-transparent rounded-full" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              {preview ? 'Replace Logo' : 'Upload Logo'}
            </>
          )}
        </Button>
        
        {preview && (
          <Button 
            variant="outline" 
            onClick={handleRemove}
            className="flex-1"
          >
            <X className="mr-2 h-4 w-4" />
            Remove
          </Button>
        )}
      </div>
    </div>
  );
}