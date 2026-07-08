import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export default function ReportCardDesigner() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold text-gray-900">Report Card Designer</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center p-10 gap-4">
          <AlertCircle className="h-16 w-16 text-orange-500" />
          <h2 className="text-xl font-semibold">Feature Under Development</h2>
          <p className="text-center text-muted-foreground">
            Report card designer functionality is being developed. 
            This feature will allow you to create and customize report card templates.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
