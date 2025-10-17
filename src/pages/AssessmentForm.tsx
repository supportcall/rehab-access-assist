import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ArrowRight, Plus, Save } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import StageOne from "@/components/assessment/StageOne";
import StageTwo from "@/components/assessment/StageTwo";
import StageThree from "@/components/assessment/StageThree";

export default function AssessmentForm() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const clientId = searchParams.get("client");
  
  const [currentStage, setCurrentStage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [assessmentId, setAssessmentId] = useState<string | null>(id || null);
  
  // Stage 1 data
  const [selectedClientId, setSelectedClientId] = useState<string>(clientId || "");
  const [clientData, setClientData] = useState({
    first_name: "",
    last_name: "",
    date_of_birth: "",
    diagnosis: "",
    funding_body: "",
    primary_mobility_aid: "",
  });

  // Stage 2 data
  const [functionalData, setFunctionalData] = useState({
    primary_goal: "",
    difficulty_toileting: 3,
    difficulty_showering: 3,
    difficulty_transfers: 3,
    difficulty_steps: 3,
    fall_history: "",
    near_miss_locations: "",
  });

  // Stage 3 data
  const [environmentalAreas, setEnvironmentalAreas] = useState<any[]>([]);

  useEffect(() => {
    checkAuthAndLoadData();
  }, []);

  const checkAuthAndLoadData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    if (id) {
      await loadAssessment(id);
    } else if (clientId) {
      await loadClient(clientId);
    }
  };

  const loadAssessment = async (assessmentId: string) => {
    try {
      const { data, error } = await supabase
        .from("assessments")
        .select(`
          *,
          clients (*),
          environmental_areas (*)
        `)
        .eq("id", assessmentId)
        .single();

      if (error) throw error;

      if (data) {
        setSelectedClientId(data.client_id);
        if (data.clients) {
          setClientData({
            first_name: data.clients.first_name,
            last_name: data.clients.last_name,
            date_of_birth: data.clients.date_of_birth || "",
            diagnosis: data.clients.diagnosis || "",
            funding_body: data.clients.funding_body || "",
            primary_mobility_aid: data.clients.primary_mobility_aid || "",
          });
        }
        setFunctionalData({
          primary_goal: data.primary_goal || "",
          difficulty_toileting: data.difficulty_toileting || 3,
          difficulty_showering: data.difficulty_showering || 3,
          difficulty_transfers: data.difficulty_transfers || 3,
          difficulty_steps: data.difficulty_steps || 3,
          fall_history: data.fall_history || "",
          near_miss_locations: data.near_miss_locations || "",
        });
        setEnvironmentalAreas(data.environmental_areas || []);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const loadClient = async (clientId: string) => {
    try {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("id", clientId)
        .single();

      if (error) throw error;

      if (data) {
        setClientData({
          first_name: data.first_name,
          last_name: data.last_name,
          date_of_birth: data.date_of_birth || "",
          diagnosis: data.diagnosis || "",
          funding_body: data.funding_body || "",
          primary_mobility_aid: data.primary_mobility_aid || "",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const saveAssessment = async (status: "draft" | "completed" = "draft") => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      if (!selectedClientId) {
        throw new Error("Please select or create a client first");
      }

      const assessmentData = {
        client_id: selectedClientId,
        ...functionalData,
        status,
        completed_at: status === "completed" ? new Date().toISOString() : null,
      };

      let savedAssessmentId = assessmentId;

      if (assessmentId) {
        // Update existing assessment
        const { error } = await supabase
          .from("assessments")
          .update(assessmentData)
          .eq("id", assessmentId);

        if (error) throw error;
      } else {
        // Create new assessment
        const { data, error } = await supabase
          .from("assessments")
          .insert(assessmentData)
          .select()
          .single();

        if (error) throw error;
        savedAssessmentId = data.id;
        setAssessmentId(data.id);
      }

      // Save environmental areas
      if (savedAssessmentId && environmentalAreas.length > 0) {
        for (const area of environmentalAreas) {
          if (area.id) {
            // Update existing area
            const { error } = await supabase
              .from("environmental_areas")
              .update(area)
              .eq("id", area.id);

            if (error) throw error;
          } else {
            // Create new area
            const { error } = await supabase
              .from("environmental_areas")
              .insert({
                ...area,
                assessment_id: savedAssessmentId,
              });

            if (error) throw error;
          }
        }
      }

      toast({
        title: "Success",
        description: status === "draft" ? "Assessment saved as draft" : "Assessment completed",
      });

      if (status === "completed") {
        navigate("/assessments");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const nextStage = () => {
    if (currentStage < 3) {
      setCurrentStage(currentStage + 1);
    }
  };

  const prevStage = () => {
    if (currentStage > 1) {
      setCurrentStage(currentStage - 1);
    }
  };

  const progress = (currentStage / 3) * 100;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate("/dashboard")}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Dashboard
              </Button>
              <h1 className="text-2xl font-bold">Environmental Assessment</h1>
            </div>
            <Button variant="outline" onClick={() => saveAssessment("draft")} disabled={loading}>
              <Save className="mr-2 h-4 w-4" />
              Save Draft
            </Button>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>
              Stage {currentStage} of 3
            </CardTitle>
            <CardDescription>
              {currentStage === 1 && "Client Information & Demographics"}
              {currentStage === 2 && "Functional Needs Assessment"}
              {currentStage === 3 && "Environmental Assessment"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {currentStage === 1 && (
              <StageOne
                selectedClientId={selectedClientId}
                setSelectedClientId={setSelectedClientId}
                clientData={clientData}
                setClientData={setClientData}
              />
            )}

            {currentStage === 2 && (
              <StageTwo
                functionalData={functionalData}
                setFunctionalData={setFunctionalData}
              />
            )}

            {currentStage === 3 && (
              <StageThree
                assessmentId={assessmentId}
                environmentalAreas={environmentalAreas}
                setEnvironmentalAreas={setEnvironmentalAreas}
              />
            )}

            <div className="flex justify-between pt-6">
              <Button
                variant="outline"
                onClick={prevStage}
                disabled={currentStage === 1}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>

              {currentStage < 3 ? (
                <Button onClick={nextStage}>
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={() => saveAssessment("completed")} disabled={loading}>
                  Complete Assessment
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}