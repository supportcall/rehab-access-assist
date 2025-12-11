import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { getSafeErrorMessage } from "@/lib/errorHandling";
import { ArrowLeft, ArrowRight, Plus, Save } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import Footer from "@/components/Footer";
import PageMeta from "@/components/PageMeta";
import StageOne from "@/components/assessment/StageOne";
import StageTwo from "@/components/assessment/StageTwo";
import StageThree from "@/components/assessment/StageThree";
import StageFour from "@/components/assessment/StageFour";
import StageFive from "@/components/assessment/StageFive";
import StageSix from "@/components/assessment/StageSix";
import StageSeven from "@/components/assessment/StageSeven";
import StageEight from "@/components/assessment/StageEight";
import StageNine from "@/components/assessment/StageNine";
import StageTen from "@/components/assessment/StageTen";
import StageEleven from "@/components/assessment/StageEleven";

export default function AssessmentForm() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const clientId = searchParams.get("client");
  
  const [currentStage, setCurrentStage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [assessmentId, setAssessmentId] = useState<string | null>(id || null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
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

  // Stage 4 data - Clinical Assessment
  const [clinicalData, setClinicalData] = useState<any>({});

  // Stage 5 data - Pre-visit, Stakeholders, Funding
  const [preVisitData, setPreVisitData] = useState<any>({});
  const [stakeholdersData, setStakeholdersData] = useState<any>({});
  const [fundingData, setFundingData] = useState<any>({});

  // Stage 6 data - AT Audit
  const [atAuditData, setAtAuditData] = useState<any>({});

  // Stage 7 data - Site Survey, Structural, Measurements
  const [siteSurveyData, setSiteSurveyData] = useState<any>({});
  const [structuralData, setStructuralData] = useState<any>({});
  const [measurements, setMeasurements] = useState<any[]>([]);

  // Stage 8 data - Risks & Options
  const [risksData, setRisksData] = useState<any[]>([]);
  const [optionsData, setOptionsData] = useState<any[]>([]);

  // Stage 9 data - Compliance
  const [complianceData, setComplianceData] = useState<any[]>([]);

  // Stage 10 data - Builder Collaboration
  const [builderData, setBuilderData] = useState<any>({});

  // Stage 11 data - Deliverables
  const [deliverablesData, setDeliverablesData] = useState<any>({});

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

        // Load Stage 4 - Clinical Assessment
        const { data: clinical } = await supabase
          .from("clinical_assessment")
          .select("*")
          .eq("assessment_id", assessmentId)
          .maybeSingle();
        if (clinical) setClinicalData(clinical);

        // Load Stage 5 - Pre-visit, Stakeholders, Funding
        const { data: preVisit } = await supabase
          .from("pre_visit_details")
          .select("*")
          .eq("assessment_id", assessmentId)
          .maybeSingle();
        if (preVisit) setPreVisitData(preVisit);

        const { data: stakeholders } = await supabase
          .from("stakeholders")
          .select("*")
          .eq("assessment_id", assessmentId)
          .maybeSingle();
        if (stakeholders) setStakeholdersData(stakeholders);

        const { data: funding } = await supabase
          .from("funding_pathway")
          .select("*")
          .eq("assessment_id", assessmentId)
          .maybeSingle();
        if (funding) setFundingData(funding);

        // Load Stage 6 - AT Audit
        const { data: atAudit } = await supabase
          .from("at_audit")
          .select("*")
          .eq("assessment_id", assessmentId)
          .maybeSingle();
        if (atAudit) setAtAuditData(atAudit);

        // Load Stage 7 - Site Survey, Structural, Measurements
        const { data: siteSurvey } = await supabase
          .from("site_survey")
          .select("*")
          .eq("assessment_id", assessmentId)
          .maybeSingle();
        if (siteSurvey) setSiteSurveyData(siteSurvey);

        const { data: structural } = await supabase
          .from("structural_reconnaissance")
          .select("*")
          .eq("assessment_id", assessmentId)
          .maybeSingle();
        if (structural) setStructuralData(structural);

        const { data: measurementsData } = await supabase
          .from("measurements")
          .select("*")
          .eq("assessment_id", assessmentId);
        if (measurementsData) setMeasurements(measurementsData);

        // Load Stage 8 - Risks & Options
        const { data: risksControlsData } = await supabase
          .from("risks_controls")
          .select("*")
          .eq("assessment_id", assessmentId);
        if (risksControlsData) setRisksData(risksControlsData);

        const { data: optionsAnalysisData } = await supabase
          .from("options_analysis")
          .select("*")
          .eq("assessment_id", assessmentId);
        if (optionsAnalysisData) setOptionsData(optionsAnalysisData);

        // Load Stage 9 - Compliance
        const { data: complianceChecklistData } = await supabase
          .from("compliance_checklist")
          .select("*")
          .eq("assessment_id", assessmentId);
        if (complianceChecklistData) setComplianceData(complianceChecklistData);

        // Load Stage 10 - Builder Collaboration
        const { data: builder } = await supabase
          .from("builder_collaboration")
          .select("*")
          .eq("assessment_id", assessmentId)
          .maybeSingle();
        if (builder) setBuilderData(builder);

        // Load Stage 11 - Deliverables
        const { data: deliverables } = await supabase
          .from("deliverables")
          .select("*")
          .eq("assessment_id", assessmentId)
          .maybeSingle();
        if (deliverables) setDeliverablesData(deliverables);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: getSafeErrorMessage(error),
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
        description: getSafeErrorMessage(error),
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

      if (!savedAssessmentId) throw new Error("Failed to save assessment");

      // Save environmental areas (Stage 3)
      if (environmentalAreas.length > 0) {
        for (const area of environmentalAreas) {
          if (area.id) {
            const { error } = await supabase
              .from("environmental_areas")
              .update(area)
              .eq("id", area.id);
            if (error) throw error;
          } else {
            const { error } = await supabase
              .from("environmental_areas")
              .insert({ ...area, assessment_id: savedAssessmentId });
            if (error) throw error;
          }
        }
      }

      // Save Stage 4 - Clinical Assessment
      if (Object.keys(clinicalData).length > 0) {
        const { data: existing } = await supabase
          .from("clinical_assessment")
          .select("id")
          .eq("assessment_id", savedAssessmentId)
          .maybeSingle();

        if (existing) {
          const { error } = await supabase
            .from("clinical_assessment")
            .update(clinicalData)
            .eq("assessment_id", savedAssessmentId);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from("clinical_assessment")
            .insert({ ...clinicalData, assessment_id: savedAssessmentId });
          if (error) throw error;
        }
      }

      // Save Stage 5 - Pre-visit Details
      if (Object.keys(preVisitData).length > 0) {
        const { data: existing } = await supabase
          .from("pre_visit_details")
          .select("id")
          .eq("assessment_id", savedAssessmentId)
          .maybeSingle();

        if (existing) {
          const { error } = await supabase
            .from("pre_visit_details")
            .update(preVisitData)
            .eq("assessment_id", savedAssessmentId);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from("pre_visit_details")
            .insert({ ...preVisitData, assessment_id: savedAssessmentId });
          if (error) throw error;
        }
      }

      // Save Stage 5 - Stakeholders
      if (Object.keys(stakeholdersData).length > 0) {
        const { data: existing } = await supabase
          .from("stakeholders")
          .select("id")
          .eq("assessment_id", savedAssessmentId)
          .maybeSingle();

        if (existing) {
          const { error } = await supabase
            .from("stakeholders")
            .update(stakeholdersData)
            .eq("assessment_id", savedAssessmentId);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from("stakeholders")
            .insert({ ...stakeholdersData, assessment_id: savedAssessmentId });
          if (error) throw error;
        }
      }

      // Save Stage 5 - Funding Pathway
      if (Object.keys(fundingData).length > 0) {
        const { data: existing } = await supabase
          .from("funding_pathway")
          .select("id")
          .eq("assessment_id", savedAssessmentId)
          .maybeSingle();

        if (existing) {
          const { error } = await supabase
            .from("funding_pathway")
            .update(fundingData)
            .eq("assessment_id", savedAssessmentId);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from("funding_pathway")
            .insert({ ...fundingData, assessment_id: savedAssessmentId });
          if (error) throw error;
        }
      }

      // Save Stage 6 - AT Audit
      if (Object.keys(atAuditData).length > 0) {
        const { data: existing } = await supabase
          .from("at_audit")
          .select("id")
          .eq("assessment_id", savedAssessmentId)
          .maybeSingle();

        if (existing) {
          const { error } = await supabase
            .from("at_audit")
            .update(atAuditData)
            .eq("assessment_id", savedAssessmentId);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from("at_audit")
            .insert({ ...atAuditData, assessment_id: savedAssessmentId });
          if (error) throw error;
        }
      }

      // Save Stage 7 - Site Survey
      if (Object.keys(siteSurveyData).length > 0) {
        const { data: existing } = await supabase
          .from("site_survey")
          .select("id")
          .eq("assessment_id", savedAssessmentId)
          .maybeSingle();

        if (existing) {
          const { error } = await supabase
            .from("site_survey")
            .update(siteSurveyData)
            .eq("assessment_id", savedAssessmentId);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from("site_survey")
            .insert({ ...siteSurveyData, assessment_id: savedAssessmentId });
          if (error) throw error;
        }
      }

      // Save Stage 7 - Structural Reconnaissance
      if (Object.keys(structuralData).length > 0) {
        const { data: existing } = await supabase
          .from("structural_reconnaissance")
          .select("id")
          .eq("assessment_id", savedAssessmentId)
          .maybeSingle();

        if (existing) {
          const { error } = await supabase
            .from("structural_reconnaissance")
            .update(structuralData)
            .eq("assessment_id", savedAssessmentId);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from("structural_reconnaissance")
            .insert({ ...structuralData, assessment_id: savedAssessmentId });
          if (error) throw error;
        }
      }

      // Save Stage 7 - Measurements
      if (measurements.length > 0) {
        // Delete existing measurements first
        await supabase
          .from("measurements")
          .delete()
          .eq("assessment_id", savedAssessmentId);

        // Insert all measurements
        const { error } = await supabase
          .from("measurements")
          .insert(measurements.map(m => ({ ...m, assessment_id: savedAssessmentId })));
        if (error) throw error;
      }

      // Save Stage 8 - Risks & Controls
      if (risksData.length > 0) {
        await supabase
          .from("risks_controls")
          .delete()
          .eq("assessment_id", savedAssessmentId);

        const { error } = await supabase
          .from("risks_controls")
          .insert(risksData.map(r => ({ ...r, assessment_id: savedAssessmentId })));
        if (error) throw error;
      }

      // Save Stage 8 - Options Analysis
      if (optionsData.length > 0) {
        await supabase
          .from("options_analysis")
          .delete()
          .eq("assessment_id", savedAssessmentId);

        const { error } = await supabase
          .from("options_analysis")
          .insert(optionsData.map(o => ({ ...o, assessment_id: savedAssessmentId })));
        if (error) throw error;
      }

      // Save Stage 9 - Compliance Checklist
      if (complianceData.length > 0) {
        await supabase
          .from("compliance_checklist")
          .delete()
          .eq("assessment_id", savedAssessmentId);

        const { error } = await supabase
          .from("compliance_checklist")
          .insert(complianceData.map(c => ({ ...c, assessment_id: savedAssessmentId })));
        if (error) throw error;
      }

      // Save Stage 10 - Builder Collaboration
      if (Object.keys(builderData).length > 0) {
        const { data: existing } = await supabase
          .from("builder_collaboration")
          .select("id")
          .eq("assessment_id", savedAssessmentId)
          .maybeSingle();

        if (existing) {
          const { error } = await supabase
            .from("builder_collaboration")
            .update(builderData)
            .eq("assessment_id", savedAssessmentId);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from("builder_collaboration")
            .insert({ ...builderData, assessment_id: savedAssessmentId });
          if (error) throw error;
        }
      }

      // Save Stage 11 - Deliverables
      if (Object.keys(deliverablesData).length > 0) {
        const { data: existing } = await supabase
          .from("deliverables")
          .select("id")
          .eq("assessment_id", savedAssessmentId)
          .maybeSingle();

        if (existing) {
          const { error } = await supabase
            .from("deliverables")
            .update(deliverablesData)
            .eq("assessment_id", savedAssessmentId);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from("deliverables")
            .insert({ ...deliverablesData, assessment_id: savedAssessmentId });
          if (error) throw error;
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
        description: getSafeErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const validateCurrentStage = (): boolean => {
    const errors: Record<string, string> = {};

    if (currentStage === 1) {
      if (!clientData.first_name?.trim()) {
        errors.first_name = "First name is required";
      }
      if (!clientData.last_name?.trim()) {
        errors.last_name = "Last name is required";
      }
    }

    if (currentStage === 2) {
      if (!functionalData.primary_goal?.trim()) {
        errors.primary_goal = "Primary goal is required";
      }
    }

    setValidationErrors(errors);
    
    if (Object.keys(errors).length > 0) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return false;
    }
    
    return true;
  };

  const nextStage = () => {
    if (currentStage < 11) {
      if (validateCurrentStage()) {
        setValidationErrors({});
        setCurrentStage(currentStage + 1);
      }
    }
  };

  const prevStage = () => {
    if (currentStage > 1) {
      setCurrentStage(currentStage - 1);
    }
  };

  const progress = (currentStage / 11) * 100;

  const getStageTitle = () => {
    const titles = [
      "Client Information & Demographics",
      "Functional Needs Assessment",
      "Environmental Areas",
      "Clinical Assessment",
      "Pre-Visit & Funding Pathway",
      "Assistive Technology Audit",
      "Site Survey & Measurements",
      "Risks & Options Analysis",
      "Compliance Checklist",
      "Builder Collaboration & Quotes",
      "Deliverables & Handover"
    ];
    return titles[currentStage - 1] || "";
  };

  return (
    <div className="min-h-screen bg-background">
      <PageMeta
        title={id ? "Edit Assessment | RehabSource" : "New Assessment | RehabSource"}
        description="Complete home modifications environmental assessment with NDIS-compliant documentation, measurements, and comprehensive reporting."
        canonical={window.location.origin + (id ? `/assessment/${id}` : "/assessment/new")}
      />
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
              Stage {currentStage} of 11
            </CardTitle>
            <CardDescription>
              {getStageTitle()}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {currentStage === 1 && (
              <StageOne
                selectedClientId={selectedClientId}
                setSelectedClientId={setSelectedClientId}
                clientData={clientData}
                setClientData={setClientData}
                validationErrors={validationErrors}
              />
            )}

            {currentStage === 2 && (
              <StageTwo
                functionalData={functionalData}
                setFunctionalData={setFunctionalData}
                validationErrors={validationErrors}
              />
            )}

            {currentStage === 3 && (
              <StageThree
                assessmentId={assessmentId}
                environmentalAreas={environmentalAreas}
                setEnvironmentalAreas={setEnvironmentalAreas}
              />
            )}

            {currentStage === 4 && (
              <StageFour
                clinicalData={clinicalData}
                setClinicalData={setClinicalData}
                validationErrors={validationErrors}
              />
            )}

            {currentStage === 5 && (
              <StageFive
                preVisitData={preVisitData}
                setPreVisitData={setPreVisitData}
                stakeholdersData={stakeholdersData}
                setStakeholdersData={setStakeholdersData}
                fundingData={fundingData}
                setFundingData={setFundingData}
              />
            )}

            {currentStage === 6 && (
              <StageSix
                atAuditData={atAuditData}
                setAtAuditData={setAtAuditData}
                assessmentId={assessmentId}
              />
            )}

            {currentStage === 7 && (
              <StageSeven
                siteSurveyData={siteSurveyData}
                setSiteSurveyData={setSiteSurveyData}
                structuralData={structuralData}
                setStructuralData={setStructuralData}
                measurements={measurements}
                setMeasurements={setMeasurements}
                assessmentId={assessmentId}
              />
            )}

            {currentStage === 8 && (
              <StageEight
                risksData={risksData}
                setRisksData={setRisksData}
                optionsData={optionsData}
                setOptionsData={setOptionsData}
                assessmentId={assessmentId}
              />
            )}

            {currentStage === 9 && (
              <StageNine
                complianceData={complianceData}
                setComplianceData={setComplianceData}
              />
            )}

            {currentStage === 10 && (
              <StageTen
                builderData={builderData}
                setBuilderData={setBuilderData}
              />
            )}

            {currentStage === 11 && assessmentId && (
              <StageEleven
                assessmentId={assessmentId}
                deliverablesData={deliverablesData}
                setDeliverablesData={setDeliverablesData}
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

              {currentStage < 11 ? (
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
      
      <Footer />
    </div>
  );
}