import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StageTenProps {
  builderData: any;
  setBuilderData: (data: any) => void;
}

export default function StageTen({ builderData, setBuilderData }: StageTenProps) {
  const updateField = (field: string, value: any) => {
    setBuilderData({ ...builderData, [field]: value });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Builder/BCP Collaboration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox checked={builderData.bcp_engaged_early || false} onCheckedChange={(checked) => updateField("bcp_engaged_early", checked)} />
            <Label>BCP Engaged Early (Category B Minor & Complex)</Label>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>BCP Name</Label>
              <Input value={builderData.bcp_name || ""} onChange={(e) => updateField("bcp_name", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>BCP License Number</Label>
              <Input value={builderData.bcp_license_number || ""} onChange={(e) => updateField("bcp_license_number", e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quote 1 (Required for Complex Works)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Provider</Label>
            <Input value={builderData.quote_1_provider || ""} onChange={(e) => updateField("quote_1_provider", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Amount ($)</Label>
            <Input type="number" value={builderData.quote_1_amount || ""} onChange={(e) => updateField("quote_1_amount", e.target.value ? parseFloat(e.target.value) : null)} />
          </div>
          <div className="space-y-2">
            <Label>Breakdown (dimensional details, staged costs)</Label>
            <Textarea value={builderData.quote_1_breakdown || ""} onChange={(e) => updateField("quote_1_breakdown", e.target.value)} rows={3} />
          </div>
          <div className="space-y-2">
            <Label>Fixtures & Fittings (make/model)</Label>
            <Textarea value={builderData.quote_1_fixtures || ""} onChange={(e) => updateField("quote_1_fixtures", e.target.value)} rows={2} />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox checked={builderData.quote_1_gst_inclusive !== false} onCheckedChange={(checked) => updateField("quote_1_gst_inclusive", checked)} />
            <Label>GST Inclusive</Label>
          </div>
          <div className="space-y-2">
            <Label>Quote Document URL</Label>
            <Input value={builderData.quote_1_document_url || ""} onChange={(e) => updateField("quote_1_document_url", e.target.value)} placeholder="Link to quote document" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quote 2 (Required for Complex Works)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Provider</Label>
            <Input value={builderData.quote_2_provider || ""} onChange={(e) => updateField("quote_2_provider", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Amount ($)</Label>
            <Input type="number" value={builderData.quote_2_amount || ""} onChange={(e) => updateField("quote_2_amount", e.target.value ? parseFloat(e.target.value) : null)} />
          </div>
          <div className="space-y-2">
            <Label>Breakdown (dimensional details, staged costs)</Label>
            <Textarea value={builderData.quote_2_breakdown || ""} onChange={(e) => updateField("quote_2_breakdown", e.target.value)} rows={3} />
          </div>
          <div className="space-y-2">
            <Label>Fixtures & Fittings (make/model)</Label>
            <Textarea value={builderData.quote_2_fixtures || ""} onChange={(e) => updateField("quote_2_fixtures", e.target.value)} rows={2} />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox checked={builderData.quote_2_gst_inclusive !== false} onCheckedChange={(checked) => updateField("quote_2_gst_inclusive", checked)} />
            <Label>GST Inclusive</Label>
          </div>
          <div className="space-y-2">
            <Label>Quote Document URL</Label>
            <Input value={builderData.quote_2_document_url || ""} onChange={(e) => updateField("quote_2_document_url", e.target.value)} placeholder="Link to quote document" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Scope of Works (NDIA Template)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Disability-Specific Scope</Label>
            <Textarea value={builderData.disability_specific_scope || ""} onChange={(e) => updateField("disability_specific_scope", e.target.value)} rows={4} placeholder="Describe modifications directly related to disability needs" />
          </div>
          <div className="space-y-2">
            <Label>General Finishes Scope</Label>
            <Textarea value={builderData.general_finishes_scope || ""} onChange={(e) => updateField("general_finishes_scope", e.target.value)} rows={3} placeholder="Describe general building work and finishes" />
          </div>
          <div className="space-y-2">
            <Label>Construction Sequence</Label>
            <Textarea value={builderData.construction_sequence || ""} onChange={(e) => updateField("construction_sequence", e.target.value)} rows={3} />
          </div>
          <div className="space-y-2">
            <Label>Decant Plan</Label>
            <Textarea value={builderData.decant_plan || ""} onChange={(e) => updateField("decant_plan", e.target.value)} rows={3} placeholder="How will the client manage during construction?" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}