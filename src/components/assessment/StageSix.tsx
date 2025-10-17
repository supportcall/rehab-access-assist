import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StageSixProps {
  atAuditData: any;
  setAtAuditData: (data: any) => void;
}

export default function StageSix({ atAuditData, setAtAuditData }: StageSixProps) {
  const updateField = (field: string, value: any) => {
    setAtAuditData({ ...atAuditData, [field]: value });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Assistive Technology (AT) Audit</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Current AT Type</Label>
            <Textarea value={atAuditData.current_at_type || ""} onChange={(e) => updateField("current_at_type", e.target.value)} rows={2} placeholder="List all current assistive technology" />
          </div>
          <div className="space-y-2">
            <Label>AT Condition</Label>
            <Textarea value={atAuditData.at_condition || ""} onChange={(e) => updateField("at_condition", e.target.value)} rows={2} />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox checked={atAuditData.at_compliance || false} onCheckedChange={(checked) => updateField("at_compliance", checked)} />
            <Label>AT Compliant</Label>
          </div>
          <div className="space-y-2">
            <Label>AT Maintenance</Label>
            <Textarea value={atAuditData.at_maintenance || ""} onChange={(e) => updateField("at_maintenance", e.target.value)} rows={2} />
          </div>
          <div className="space-y-2">
            <Label>Trials Conducted</Label>
            <Textarea value={atAuditData.trials_conducted || ""} onChange={(e) => updateField("trials_conducted", e.target.value)} rows={3} placeholder="Describe any AT trials performed before recommending structural works" />
          </div>
          <div className="space-y-2">
            <Label>Trial Outcomes</Label>
            <Textarea value={atAuditData.trial_outcomes || ""} onChange={(e) => updateField("trial_outcomes", e.target.value)} rows={2} />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox checked={atAuditData.structural_works_still_required || false} onCheckedChange={(checked) => updateField("structural_works_still_required", checked)} />
            <Label>Structural Works Still Required</Label>
          </div>
          <div className="space-y-2">
            <Label>Structural Works Justification</Label>
            <Textarea value={atAuditData.structural_works_justification || ""} onChange={(e) => updateField("structural_works_justification", e.target.value)} rows={3} placeholder="Explain why structural modifications are necessary after AT trials" />
          </div>
          <div className="space-y-2">
            <Label>Charging Requirements</Label>
            <Textarea value={atAuditData.charging_requirements || ""} onChange={(e) => updateField("charging_requirements", e.target.value)} rows={2} />
          </div>
          <div className="space-y-2">
            <Label>Storage Requirements</Label>
            <Textarea value={atAuditData.storage_requirements || ""} onChange={(e) => updateField("storage_requirements", e.target.value)} rows={2} />
          </div>
          <div className="space-y-2">
            <Label>Power Requirements</Label>
            <Textarea value={atAuditData.power_requirements || ""} onChange={(e) => updateField("power_requirements", e.target.value)} rows={2} />
          </div>
          <div className="space-y-2">
            <Label>Maneuvering Envelopes</Label>
            <Textarea value={atAuditData.maneuvering_envelopes || ""} onChange={(e) => updateField("maneuvering_envelopes", e.target.value)} rows={2} placeholder="Describe clearances needed with AT (wheelchair, shower commode, hoist)" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}