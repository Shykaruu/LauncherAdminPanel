import { useState } from "react";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ApiConfig, insertApiConfigSchema } from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Save, FileJson, RefreshCw } from "lucide-react";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';

// Extend schema with additional validation
const apiConfigFormSchema = insertApiConfigSchema.extend({
  version: z.string().min(1, "Version is required"),
});

type ApiConfigFormValues = z.infer<typeof apiConfigFormSchema>;

export default function ApiPage() {
  const { toast } = useToast();
  const [previewData, setPreviewData] = useState<string | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  
  // Fetch current API config
  const { data: apiConfig, isLoading } = useQuery<ApiConfig>({
    queryKey: ["/api/config"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/config");
      return response.json();
    }
  });
  
  // Update API config mutation
  const updateMutation = useMutation({
    mutationFn: async (data: ApiConfigFormValues) => {
      await apiRequest("POST", "/api/config", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/config"] });
      toast({
        title: "API configuration updated",
        description: "Your changes have been saved successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update configuration",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    },
  });
  
  // Setup form
  const form = useForm<ApiConfigFormValues>({
    resolver: zodResolver(apiConfigFormSchema),
    defaultValues: {
      version: "1.0.0",
      rssUrl: "",
      discordClientId: "",
      discordSmallImageText: "logo",
      discordSmallImageKey: "logo",
    },
    values: apiConfig || undefined,
  });
  
  // Handle form submission
  const onSubmit = (data: ApiConfigFormValues) => {
    updateMutation.mutate(data);
  };
  
  // Load distribution.json preview
  const loadPreview = async () => {
    setIsLoadingPreview(true);
    try {
      const response = await fetch("/api/distribution");
      const data = await response.json();
      setPreviewData(JSON.stringify(data, null, 2));
    } catch (error) {
      console.error("Error fetching distribution.json:", error);
      toast({
        title: "Failed to load preview",
        description: "Could not fetch distribution.json",
        variant: "destructive",
      });
    } finally {
      setIsLoadingPreview(false);
    }
  };

  return (
    <DashboardLayout title="API Configuration">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* API Configuration Form */}
        <Card>
          <CardHeader>
            <CardTitle>API Configuration</CardTitle>
            <CardDescription>
              Configure the settings for your launcher's distribution.json API endpoint
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="version"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>API Version</FormLabel>
                        <FormControl>
                          <Input placeholder="1.0.0" {...field} />
                        </FormControl>
                        <FormDescription>
                          The version of your API used by the launcher
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="rssUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>RSS Feed URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://example.com/feed" {...field} />
                        </FormControl>
                        <FormDescription>
                          URL to an RSS feed for announcements in the launcher
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="discordClientId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Discord Client ID</FormLabel>
                        <FormControl>
                          <Input placeholder="123456789012345678" {...field} />
                        </FormControl>
                        <FormDescription>
                          Discord application client ID for Rich Presence integration
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="discordSmallImageText"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Discord Small Image Text</FormLabel>
                          <FormControl>
                            <Input placeholder="logo" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="discordSmallImageKey"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Discord Small Image Key</FormLabel>
                          <FormControl>
                            <Input placeholder="logo" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={updateMutation.isPending}
                  >
                    {updateMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    <Save className="mr-2 h-4 w-4" />
                    Save Configuration
                  </Button>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>
        
        {/* API Preview */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>distribution.json Preview</CardTitle>
                <CardDescription>
                  Preview of the dynamically generated distribution.json endpoint
                </CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={loadPreview}
                disabled={isLoadingPreview}
              >
                {isLoadingPreview ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent className="h-[500px] overflow-auto">
            {isLoadingPreview ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : previewData ? (
              <SyntaxHighlighter language="json" style={tomorrow} className="rounded-md text-sm">
                {previewData}
              </SyntaxHighlighter>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <FileJson className="h-16 w-16 mb-4 opacity-50" />
                <p className="mb-4">No preview loaded</p>
                <Button onClick={loadPreview}>
                  Load Preview
                </Button>
              </div>
            )}
          </CardContent>
          <CardFooter className="bg-muted/50 p-3 text-xs text-muted-foreground">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span>Public Endpoint: <code className="bg-background px-1 py-0.5 rounded">/api/distribution</code></span>
            </div>
          </CardFooter>
        </Card>
      </div>
    </DashboardLayout>
  );
}
