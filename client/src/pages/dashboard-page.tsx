import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { StatCard } from "@/components/stats/stat-card";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useWebSocketStats } from "@/lib/socket";
import { useQuery } from "@tanstack/react-query";
import { Server } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import { 
  Users, 
  ArrowRight, 
  Activity, 
  Clock, 
  BarChart3, 
  Network 
} from "lucide-react";
import { useState, useEffect } from "react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

export default function DashboardPage() {
  // Fetch servers
  const { data: servers, isLoading: isLoadingServers } = useQuery<Server[]>({
    queryKey: ["/api/servers"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/servers");
      return response.json();
    }
  });
  
  // Get stats from WebSocket
  const { stats, connected } = useWebSocketStats();
  
  // For chart data
  const [chartData, setChartData] = useState<any[]>([]);

  // Generate mock chart data on first load
  useEffect(() => {
    const generateMockData = () => {
      const now = new Date();
      const data = [];
      
      for (let i = 0; i < 24; i++) {
        const time = new Date(now);
        time.setHours(now.getHours() - 23 + i);
        
        data.push({
          time: time.toLocaleTimeString('en-US', { hour: '2-digit', hour12: false }),
          activePlayers: Math.floor(Math.random() * 100) + 20,
          bandwidth: Math.floor(Math.random() * 30) + 5,
        });
      }
      
      setChartData(data);
    };
    
    generateMockData();
  }, []);
  
  // Calculate total stats
  const totalActivePlayers = stats.reduce((sum, serverStat) => 
    sum + (serverStat.stats.activePlayers || 0), 0);
  
  const totalBandwidth = stats.reduce((sum, serverStat) => 
    sum + (serverStat.stats.currentBandwidth || 0), 0);
  
  const totalDataTransferred = stats.reduce((sum, serverStat) => 
    sum + (serverStat.stats.totalBandwidth || 0), 0);
  
  const totalSessionTime = stats.reduce((sum, serverStat) => 
    sum + (serverStat.stats.totalSessionTime || 0), 0);
  
  // Format total session time
  const formatSessionTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    return `${hours.toLocaleString()} hrs`;
  };
  
  // Format bandwidth
  const formatBandwidth = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B/s`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB/s`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB/s`;
  };
  
  // Format total data transferred
  const formatDataTransferred = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  return (
    <DashboardLayout title="Dashboard">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatCard 
          title="Active Users"
          value={totalActivePlayers || 0}
          icon={Users}
          trend={12}
          trendText="from last month"
        />
        
        <StatCard 
          title="Current Bandwidth"
          value={formatBandwidth(totalBandwidth || 0)}
          icon={Network}
          iconColor="text-secondary"
          trend={-5}
          trendText="from yesterday"
        />
        
        <StatCard 
          title="Total Bandwidth"
          value={formatDataTransferred(totalDataTransferred || 0)}
          icon={BarChart3}
          iconColor="text-accent"
          trend={18}
          trendText="from last month"
        />
        
        <StatCard 
          title="Total Session Time"
          value={formatSessionTime(totalSessionTime || 0)}
          icon={Clock}
          trend={7}
          trendText="from last week"
        />
      </div>
      
      {/* Server Instances Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Chart */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold">Server Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={chartData}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis 
                      dataKey="time" 
                      tick={{ fontSize: 12 }} 
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }} 
                      tickLine={false}
                      axisLine={false}
                      width={40}
                    />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="activePlayers" 
                      name="Active Players" 
                      stroke="hsl(var(--primary))" 
                      fill="hsl(var(--primary)/30%)" 
                      strokeWidth={2}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="bandwidth" 
                      name="Bandwidth (MB/s)" 
                      stroke="hsl(var(--secondary))" 
                      fill="hsl(var(--secondary)/30%)" 
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Active Servers List */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">Active Servers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isLoadingServers ? (
                // Loading skeleton
                Array(3).fill(0).map((_, i) => (
                  <div key={i} className="flex items-center justify-between animate-pulse">
                    <div className="flex items-center">
                      <div className="h-2 w-2 rounded-full bg-gray-200 mr-3"></div>
                      <div>
                        <div className="h-4 w-24 bg-gray-200 rounded mb-1"></div>
                        <div className="h-3 w-16 bg-gray-200 rounded"></div>
                      </div>
                    </div>
                    <div className="h-5 w-16 bg-gray-200 rounded-full"></div>
                  </div>
                ))
              ) : servers && servers.length > 0 ? (
                // Actual servers
                servers.slice(0, 4).map((server) => {
                  const serverStats = stats.find(s => s.serverId === server.serverId);
                  const isOnline = serverStats?.stats.activePlayers > 0;
                  
                  return (
                    <div key={server.serverId} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className={`h-2 w-2 rounded-full ${isOnline ? 'bg-success' : 'bg-destructive'} mr-3`}></div>
                        <div>
                          <p className="font-medium text-gray-800">{server.name}</p>
                          <p className="text-sm text-gray-500">
                            {server.minecraftVersion} • {serverStats?.stats.activePlayers || 0} players
                          </p>
                        </div>
                      </div>
                      <Badge variant={isOnline ? "success" : "destructive"}>
                        {isOnline ? "Online" : "Offline"}
                      </Badge>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <p>No servers available</p>
                  <Button className="mt-4" asChild>
                    <Link href="/servers">Add Server</Link>
                  </Button>
                </div>
              )}
            </div>
            
            {servers && servers.length > 0 && (
              <div className="mt-6">
                <Button variant="link" className="p-0 h-auto" asChild>
                  <Link href="/servers" className="text-sm text-primary hover:text-primary/90 font-medium flex items-center">
                    View all servers
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
