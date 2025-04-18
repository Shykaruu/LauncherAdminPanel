import { useState, useEffect } from "react";
import { File } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, X } from "lucide-react";
import Editor from "@monaco-editor/react";

interface CodeEditorProps {
  file: File | null;
  onClose: () => void;
}

export function CodeEditor({ file, onClose }: CodeEditorProps) {
  const [content, setContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!file) return;

    setIsLoading(true);
    const fetchFileContent = async () => {
      try {
        const response = await apiRequest("GET", `/api/files/${file.serverId}/content?path=${encodeURIComponent(file.path)}`);
        const fileContent = await response.text();
        setContent(fileContent);
      } catch (error) {
        console.error("Error fetching file content:", error);
        toast({
          title: "Error loading file",
          description: "Could not load file content. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchFileContent();
  }, [file, toast]);

  // Determine language based on file extension
  const getLanguage = () => {
    if (!file) return "plaintext";
    
    const ext = file.path.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'json':
        return 'json';
      case 'js':
        return 'javascript';
      case 'ts':
        return 'typescript';
      case 'html':
        return 'html';
      case 'css':
        return 'css';
      case 'scss':
        return 'scss';
      case 'less':
        return 'less';
      case 'yml':
      case 'yaml':
        return 'yaml';
      case 'properties':
        return 'properties';
      case 'xml':
        return 'xml';
      case 'md':
        return 'markdown';
      case 'java':
        return 'java';
      case 'php':
        return 'php';
      case 'py':
        return 'python';
      case 'rb':
        return 'ruby';
      case 'sql':
        return 'sql';
      case 'sh':
        return 'shell';
      default:
        return 'plaintext';
    }
  };

  // Save file mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!file) return;
      
      // In a real application, this would be an API call to save the file content
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
      
      // This is a placeholder for the actual API call
      // await apiRequest("POST", `/api/files/${file.id}/content`, { content });
      
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/servers", file?.serverId, "files"] });
      toast({
        title: "File saved",
        description: `${file?.path} has been saved successfully.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to save file",
        description: error.message || "An unknown error occurred",
        variant: "destructive",
      });
    },
  });

  if (!file) {
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden flex items-center justify-center h-full">
        <div className="text-center p-10">
          <div className="h-16 w-16 text-gray-400 mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-800 mb-2">No File Selected</h3>
          <p className="text-gray-500 mb-6">Select a file from the sidebar to view or edit its content</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden h-full flex flex-col">
      {/* Editor Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="font-medium text-gray-700">{file.path}</span>
        </div>
        
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onClose}
          >
            <X className="h-4 w-4 mr-1" />
            Close
          </Button>
          <Button 
            size="sm" 
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || isLoading}
          >
            {saveMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-1" />
            )}
            Save
          </Button>
        </div>
      </div>
      
      {/* Editor Content */}
      <div className="flex-1">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Editor
            height="100%"
            defaultLanguage={getLanguage()}
            defaultValue={content}
            onChange={(value) => setContent(value || "")}
            theme="vs-light"
            options={{
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              fontSize: 14,
              wordWrap: "on",
              lineNumbers: "on",
              folding: true,
              automaticLayout: true,
            }}
          />
        )}
      </div>
    </div>
  );
}
