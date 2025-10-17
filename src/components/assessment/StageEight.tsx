import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import PhotoUpload from "./PhotoUpload";

interface StageEightProps {
  risksData: any[];
  setRisksData: (data: any[]) => void;
  optionsData: any[];
  setOptionsData: (data: any[]) => void;
  assessmentId?: string | null;
}

export default function StageEight({ risksData, setRisksData, optionsData, setOptionsData, assessmentId }: StageEightProps) {
  const addRisk = () => {
    setRisksData([...risksData, { risk_type: "", risk_description: "", severity: "medium", control_measure: "", home_fast_item: "", safer_home_item: "", wehsa_item: "" }]);
  };

  const removeRisk = (index: number) => {
    setRisksData(risksData.filter((_, i) => i !== index));
  };

  const updateRisk = (index: number, field: string, value: any) => {
    const updated = [...risksData];
    updated[index] = { ...updated[index], [field]: value };
    setRisksData(updated);
  };

  const addOption = () => {
    setOptionsData([...optionsData, { goal_area: "", option_type: "", option_description: "", clinical_impact: "", compliance_notes: "", estimated_cost: null, value_for_money_justification: "", recommended: false }]);
  };

  const removeOption = (index: number) => {
    setOptionsData(optionsData.filter((_, i) => i !== index));
  };

  const updateOption = (index: number, field: string, value: any) => {
    const updated = [...optionsData];
    updated[index] = { ...updated[index], [field]: value };
    setOptionsData(updated);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Risks & Controls (Home FAST, SAFER-HOME, WeHSA)</CardTitle>
            <Button onClick={addRisk} size="sm"><Plus className="mr-2 h-4 w-4" />Add Risk</Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {risksData.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">No risks added yet.</p>
          ) : (
            risksData.map((risk, index) => (
              <Card key={index}>
                <CardContent className="pt-4 space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-semibold">Risk {index + 1}</h4>
                    <Button variant="ghost" size="sm" onClick={() => removeRisk(index)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Risk Type</Label>
                      <Select value={risk.risk_type || ""} onValueChange={(value) => updateRisk(index, "risk_type", value)}>
                        <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="falls">Falls</SelectItem>
                          <SelectItem value="trip">Trip</SelectItem>
                          <SelectItem value="slip">Slip</SelectItem>
                          <SelectItem value="scald">Scald</SelectItem>
                          <SelectItem value="electrical">Electrical</SelectItem>
                          <SelectItem value="fire">Fire</SelectItem>
                          <SelectItem value="wandering">Wandering</SelectItem>
                          <SelectItem value="construction">Construction</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Severity</Label>
                      <Select value={risk.severity || "medium"} onValueChange={(value) => updateRisk(index, "severity", value)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="critical">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Risk Description</Label>
                    <Textarea value={risk.risk_description || ""} onChange={(e) => updateRisk(index, "risk_description", e.target.value)} rows={2} />
                  </div>
                  <div className="space-y-2">
                    <Label>Control Measure</Label>
                    <Textarea value={risk.control_measure || ""} onChange={(e) => updateRisk(index, "control_measure", e.target.value)} rows={2} />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Home FAST Item</Label>
                      <Input value={risk.home_fast_item || ""} onChange={(e) => updateRisk(index, "home_fast_item", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>SAFER-HOME Item</Label>
                      <Input value={risk.safer_home_item || ""} onChange={(e) => updateRisk(index, "safer_home_item", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>WeHSA Item</Label>
                      <Input value={risk.wehsa_item || ""} onChange={(e) => updateRisk(index, "wehsa_item", e.target.value)} />
                    </div>
                  </div>

                  <PhotoUpload
                    photos={risk.photo_urls || []}
                    onPhotosChange={(photos) => updateRisk(index, "photo_urls", photos)}
                    bucketPath={`risks/${assessmentId || "temp"}/${index}`}
                    label="Risk Documentation Photos"
                    maxPhotos={5}
                  />
                </CardContent>
              </Card>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Options Analysis (NCC/LHDS/AS Compliance & NDIA VFM)</CardTitle>
            <Button onClick={addOption} size="sm"><Plus className="mr-2 h-4 w-4" />Add Option</Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {optionsData.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">No options added yet.</p>
          ) : (
            optionsData.map((option, index) => (
              <Card key={index}>
                <CardContent className="pt-4 space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-semibold">Option {index + 1}</h4>
                    <Button variant="ghost" size="sm" onClick={() => removeOption(index)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Goal Area</Label>
                      <Input value={option.goal_area || ""} onChange={(e) => updateOption(index, "goal_area", e.target.value)} placeholder="e.g., Safe bathroom access" />
                    </div>
                    <div className="space-y-2">
                      <Label>Option Type</Label>
                      <Select value={option.option_type || ""} onValueChange={(value) => updateOption(index, "option_type", value)}>
                        <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="non_structural_at">Non-Structural AT</SelectItem>
                          <SelectItem value="minor_works">Minor Works</SelectItem>
                          <SelectItem value="complex_works">Complex Works</SelectItem>
                          <SelectItem value="relocate">Relocate</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Option Description</Label>
                    <Textarea value={option.option_description || ""} onChange={(e) => updateOption(index, "option_description", e.target.value)} rows={2} />
                  </div>
                  <div className="space-y-2">
                    <Label>Clinical Impact</Label>
                    <Textarea value={option.clinical_impact || ""} onChange={(e) => updateOption(index, "clinical_impact", e.target.value)} rows={2} />
                  </div>
                  <div className="space-y-2">
                    <Label>Compliance Notes (NCC/LHDS/AS)</Label>
                    <Textarea value={option.compliance_notes || ""} onChange={(e) => updateOption(index, "compliance_notes", e.target.value)} rows={2} />
                  </div>
                  <div className="space-y-2">
                    <Label>Estimated Cost ($)</Label>
                    <Input type="number" value={option.estimated_cost || ""} onChange={(e) => updateOption(index, "estimated_cost", e.target.value ? parseFloat(e.target.value) : null)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Value for Money Justification (NDIA)</Label>
                    <Textarea value={option.value_for_money_justification || ""} onChange={(e) => updateOption(index, "value_for_money_justification", e.target.value)} rows={2} />
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}