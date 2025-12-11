import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StageFiveProps {
  preVisitData: any;
  setPreVisitData: (data: any) => void;
  stakeholdersData: any;
  setStakeholdersData: (data: any) => void;
  fundingData: any;
  setFundingData: (data: any) => void;
}

export default function StageFive({ preVisitData, setPreVisitData, stakeholdersData, setStakeholdersData, fundingData, setFundingData }: StageFiveProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Pre-Visit Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Referral Reason</Label>
            <Textarea value={preVisitData.referral_reason || ""} onChange={(e) => setPreVisitData({ ...preVisitData, referral_reason: e.target.value })} rows={2} />
          </div>
          <div className="space-y-2">
            <Label>NDIA Template Used</Label>
            <Input value={preVisitData.ndia_template_used || ""} onChange={(e) => setPreVisitData({ ...preVisitData, ndia_template_used: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Diagnoses & Prognosis</Label>
            <Textarea value={preVisitData.diagnoses_prognosis || ""} onChange={(e) => setPreVisitData({ ...preVisitData, diagnoses_prognosis: e.target.value })} rows={2} />
          </div>
          <div className="space-y-2">
            <Label>Participant Goals</Label>
            <Textarea value={preVisitData.participant_goals || ""} onChange={(e) => setPreVisitData({ ...preVisitData, participant_goals: e.target.value })} rows={2} />
          </div>
          <div className="space-y-2">
            <Label>Prior Falls/Incidents</Label>
            <Textarea value={preVisitData.prior_falls_incidents || ""} onChange={(e) => setPreVisitData({ ...preVisitData, prior_falls_incidents: e.target.value })} rows={2} />
          </div>
          <div className="space-y-2">
            <Label>Current AT List</Label>
            <Textarea value={preVisitData.current_at_list || ""} onChange={(e) => setPreVisitData({ ...preVisitData, current_at_list: e.target.value })} rows={2} />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox checked={preVisitData.floor_plans_available || false} onCheckedChange={(checked) => setPreVisitData({ ...preVisitData, floor_plans_available: checked })} />
            <Label>Floor Plans Available</Label>
          </div>
          <div className="space-y-2">
            <Label>Tenancy/Ownership Details</Label>
            <Textarea value={preVisitData.tenancy_ownership_details || ""} onChange={(e) => setPreVisitData({ ...preVisitData, tenancy_ownership_details: e.target.value })} rows={2} />
          </div>
          <div className="space-y-2">
            <Label>Landlord/Strata Contacts</Label>
            <Textarea value={preVisitData.landlord_strata_contacts || ""} onChange={(e) => setPreVisitData({ ...preVisitData, landlord_strata_contacts: e.target.value })} rows={2} />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox checked={preVisitData.consent_obtained || false} onCheckedChange={(checked) => setPreVisitData({ ...preVisitData, consent_obtained: checked })} />
            <Label>Consent Obtained</Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Stakeholders</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { field: "participant_name", label: "Participant Name" },
            { field: "decision_makers", label: "Decision Makers" },
            { field: "informal_carers", label: "Informal Carers" },
            { field: "support_coordinator", label: "Support Coordinator" },
            { field: "plan_manager", label: "Plan Manager" },
            { field: "builder_bcp", label: "Builder/BCP" },
            { field: "project_manager", label: "Project Manager" },
            { field: "ot_assessor", label: "OT/Physio Assessor" }
          ].map(({ field, label }) => (
            <div key={field} className="space-y-2">
              <Label>{label}</Label>
              <Input value={stakeholdersData[field] || ""} onChange={(e) => setStakeholdersData({ ...stakeholdersData, [field]: e.target.value })} />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>NDIS Funding Pathway</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Classification</Label>
              <Input value={fundingData.classification || ""} onChange={(e) => setFundingData({ ...fundingData, classification: e.target.value })} placeholder="Minor or Complex" />
            </div>
            <div className="space-y-2">
              <Label>Category (if Minor)</Label>
              <Input value={fundingData.category || ""} onChange={(e) => setFundingData({ ...fundingData, category: e.target.value })} placeholder="A or B" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Estimated Cost ($)</Label>
              <Input type="number" value={fundingData.estimated_cost || ""} onChange={(e) => setFundingData({ ...fundingData, estimated_cost: e.target.value ? parseFloat(e.target.value) : null })} />
            </div>
            <div className="space-y-2">
              <Label>Quotes Required</Label>
              <Input type="number" value={fundingData.quotes_required || ""} onChange={(e) => setFundingData({ ...fundingData, quotes_required: e.target.value ? parseInt(e.target.value) : null })} />
            </div>
          </div>
          {[
            { field: "ndia_criteria_effectiveness", label: "NDIA Criteria: Effectiveness" },
            { field: "ndia_criteria_safety", label: "NDIA Criteria: Safety" },
            { field: "ndia_criteria_goals", label: "NDIA Criteria: Goals" },
            { field: "ndia_criteria_alternatives", label: "NDIA Criteria: Alternatives" },
            { field: "ndia_criteria_value", label: "NDIA Criteria: Value for Money" }
          ].map(({ field, label }) => (
            <div key={field} className="space-y-2">
              <Label>{label}</Label>
              <Textarea value={fundingData[field] || ""} onChange={(e) => setFundingData({ ...fundingData, [field]: e.target.value })} rows={2} />
            </div>
          ))}
          <div className="grid grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox checked={fundingData.structural_works || false} onCheckedChange={(checked) => setFundingData({ ...fundingData, structural_works: checked })} />
              <Label>Structural Works</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox checked={fundingData.multi_area_works || false} onCheckedChange={(checked) => setFundingData({ ...fundingData, multi_area_works: checked })} />
              <Label>Multi-Area Works</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox checked={fundingData.permits_required || false} onCheckedChange={(checked) => setFundingData({ ...fundingData, permits_required: checked })} />
              <Label>Permits Required</Label>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}