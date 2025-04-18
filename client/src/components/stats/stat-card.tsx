import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { TrendingDown, TrendingUp } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconColor?: string;
  trend?: number;
  trendText?: string;
  className?: string;
}

export function StatCard({ 
  title, 
  value, 
  icon: Icon,
  iconColor = "text-primary",
  trend,
  trendText,
  className
}: StatCardProps) {
  return (
    <Card className={cn("bg-white", className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-2xl font-semibold text-gray-800">{value}</p>
          </div>
          <div className={cn("bg-primary/10 rounded-full p-3", iconColor.replace('text-', 'bg-') + '/10')}>
            <Icon className={cn("h-6 w-6", iconColor)} />
          </div>
        </div>
        
        {(trend !== undefined || trendText) && (
          <div className="mt-4 flex items-center text-sm">
            {trend !== undefined && (
              <span className={cn(
                "flex items-center",
                trend >= 0 ? "text-success" : "text-destructive"
              )}>
                {trend >= 0 ? (
                  <TrendingUp className="h-4 w-4 mr-1" />
                ) : (
                  <TrendingDown className="h-4 w-4 mr-1" />
                )}
                {Math.abs(trend)}%
              </span>
            )}
            {trendText && (
              <span className="text-gray-500 ml-2">{trendText}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
