import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { getSafeErrorMessage } from "@/lib/errorHandling";
import { ArrowLeft, FileText, Calendar } from "lucide-react";
import Footer from "@/components/Footer";
import PageMeta from "@/components/PageMeta";

interface Assessment {
  id: string;
  assessment_date: string;
  status: string;
  created_at: string;
  clients: {
    first_name: string;
    last_name: string;
  } | null;
}

export default function Assessments() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthAndLoadAssessments();
  }, []);

  const checkAuthAndLoadAssessments = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }
    await loadAssessments();
  };

  const loadAssessments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("assessments")
        .select(`
          id,
          assessment_date,
          status,
          created_at,
          clients (
            first_name,
            last_name
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAssessments(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: getSafeErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "outline"> = {
      draft: "outline",
      completed: "default",
      in_progress: "secondary",
    };
    return (
      <Badge variant={variants[status] || "outline"}>
        {status.replace("_", " ").toUpperCase()}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <PageMeta 
        title="Assessments"
        description="View and manage occupational therapy environmental assessments."
        canonical={window.location.origin + "/assessments"}
      />
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
            <h1 className="text-2xl font-bold">Assessments</h1>
          </div>
          <Button onClick={() => navigate("/assessment/new")}>
            New Assessment
          </Button>
        </div>
      </header>

      <main id="main-content" className="container mx-auto px-4 py-8">
        {loading ? (
          <p className="text-center text-muted-foreground">Loading assessments...</p>
        ) : assessments.length === 0 ? (
          <Card className="hover:bg-primary/10 transition-colors">
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg text-muted-foreground mb-4">No assessments yet</p>
              <Button onClick={() => navigate("/assessment/new")}>
                Start Your First Assessment
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {assessments.map((assessment) => (
              <Card key={assessment.id} className="hover:shadow-lg hover:bg-primary/10 transition-all cursor-pointer"
                onClick={() => navigate(`/assessment/${assessment.id}`)}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        {assessment.clients
                          ? `${assessment.clients.first_name} ${assessment.clients.last_name}`
                          : "Unknown Client"}
                      </CardTitle>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(assessment.assessment_date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    {getStatusBadge(assessment.status)}
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
}