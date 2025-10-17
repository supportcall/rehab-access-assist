import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StageElevenProps {
  deliverablesData: any;
  setDeliverablesData: (data: any) => void;
}

export default function StageEleven({ deliverablesData, setDeliverablesData }: StageElevenProps) {
  const updateField = (field: string, value: any) => {
    setDeliverablesData({ ...deliverablesData, [field]: value });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>NDIA Assessment Package</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox checked={deliverablesData.ndia_template_completed || false} onCheckedChange={(checked) => updateField("ndia_template_completed", checked)} />
            <Label>NDIA Template Completed (Minor or Complex)</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox checked={deliverablesData.consent_signed || false} onCheckedChange={(checked) => updateField("consent_signed", checked)} />
            <Label>Consent Signed (within NDIA template)</Label>
          </div>
          <div className="space-y-2">
            <Label>Executive Summary</Label>
            <Textarea value={deliverablesData.executive_summary || ""} onChange={(e) => updateField("executive_summary", e.target.value)} rows={4} placeholder="Goals, prioritized recommendations, expected functional outcomes" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Evidence Pack</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Clinical Findings</Label>
            <Textarea value={deliverablesData.clinical_findings || ""} onChange={(e) => updateField("clinical_findings", e.target.value)} rows={3} />
          </div>
          <div className="space-y-2">
            <Label>Outcome Measures Results</Label>
            <Textarea value={deliverablesData.outcome_measures_results || ""} onChange={(e) => updateField("outcome_measures_results", e.target.value)} rows={3} placeholder="COPM, Home FAST, SAFER-HOME, WeHSA results" />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox checked={deliverablesData.photos_annotated || false} onCheckedChange={(checked) => updateField("photos_annotated", checked)} />
            <Label>Photos Annotated</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox checked={deliverablesData.measured_drawings_completed || false} onCheckedChange={(checked) => updateField("measured_drawings_completed", checked)} />
            <Label>Measured Drawings Completed (with LHDS/AS callouts)</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox checked={deliverablesData.risk_register_completed || false} onCheckedChange={(checked) => updateField("risk_register_completed", checked)} />
            <Label>Risk Register Completed</Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Compliance & Value Analysis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Compliance Statement (NCC/LHDS/AS clauses)</Label>
            <Textarea value={deliverablesData.compliance_statement || ""} onChange={(e) => updateField("compliance_statement", e.target.value)} rows={4} placeholder="Cite NCC/LHDS clauses and any AS used as performance benchmarks" />
          </div>
          <div className="space-y-2">
            <Label>Quotes Analysis</Label>
            <Textarea value={deliverablesData.quotes_analysis || ""} onChange={(e) => updateField("quotes_analysis", e.target.value)} rows={3} />
          </div>
          <div className="space-y-2">
            <Label>VFM Justification (NDIA Value for Money)</Label>
            <Textarea value={deliverablesData.vfm_justification || ""} onChange={(e) => updateField("vfm_justification", e.target.value)} rows={3} />
          </div>
          <div className="space-y-2">
            <Label>Construction Sequencing</Label>
            <Textarea value={deliverablesData.construction_sequencing || ""} onChange={(e) => updateField("construction_sequencing", e.target.value)} rows={3} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Handover Plan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Post-Build OT Fit-Check</Label>
            <Textarea value={deliverablesData.post_build_fit_check || ""} onChange={(e) => updateField("post_build_fit_check", e.target.value)} rows={2} />
          </div>
          <div className="space-y-2">
            <Label>AT Re-fit Plan</Label>
            <Textarea value={deliverablesData.at_refit_plan || ""} onChange={(e) => updateField("at_refit_plan", e.target.value)} rows={2} />
          </div>
          <div className="space-y-2">
            <Label>Client/Carer Training Plan</Label>
            <Textarea value={deliverablesData.client_carer_training_plan || ""} onChange={(e) => updateField("client_carer_training_plan", e.target.value)} rows={2} />
          </div>
          <div className="space-y-2">
            <Label>Maintenance Notes</Label>
            <Textarea value={deliverablesData.maintenance_notes || ""} onChange={(e) => updateField("maintenance_notes", e.target.value)} rows={2} />
          </div>
          <div className="space-y-2">
            <Label>Post-Occupancy Outcome Re-measurement Plan</Label>
            <Textarea value={deliverablesData.post_occupancy_measurement_plan || ""} onChange={(e) => updateField("post_occupancy_measurement_plan", e.target.value)} rows={2} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Final Checklist Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox checked={deliverablesData.ndia_template_completed || false} disabled />
              <Label>NDIA Template</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox checked={deliverablesData.consent_signed || false} disabled />
              <Label>Consent</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox checked={deliverablesData.photos_annotated || false} disabled />
              <Label>Photos</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox checked={deliverablesData.measured_drawings_completed || false} disabled />
              <Label>Drawings</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox checked={deliverablesData.risk_register_completed || false} disabled />
              <Label>Risk Register</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox checked={!!deliverablesData.compliance_statement} disabled />
              <Label>Compliance</Label>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}