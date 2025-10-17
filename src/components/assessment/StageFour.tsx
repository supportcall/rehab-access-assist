import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StageFourProps {
  clinicalData: any;
  setClinicalData: (data: any) => void;
}

export default function StageFour({ clinicalData, setClinicalData }: StageFourProps) {
  const updateField = (field: string, value: any) => {
    setClinicalData({ ...clinicalData, [field]: value });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Mobility Assessment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Mobility Status</Label>
              <Select value={clinicalData.mobility_status || ""} onValueChange={(value) => updateField("mobility_status", value)}>
                <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ambulant">Ambulant</SelectItem>
                  <SelectItem value="wheelchair">Wheelchair User</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Wheelchair Type</Label>
              <Select value={clinicalData.wheelchair_type || ""} onValueChange={(value) => updateField("wheelchair_type", value)}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="power">Power</SelectItem>
                  <SelectItem value="n/a">N/A</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Gait & Endurance</Label>
            <Textarea value={clinicalData.gait_endurance || ""} onChange={(e) => updateField("gait_endurance", e.target.value)} rows={2} />
          </div>
          <div className="space-y-2">
            <Label>Transfer Methods</Label>
            <Input value={clinicalData.transfer_methods || ""} onChange={(e) => updateField("transfer_methods", e.target.value)} />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox checked={clinicalData.hoist_needed || false} onCheckedChange={(checked) => updateField("hoist_needed", checked)} />
            <Label>Hoist Needed</Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Activities of Daily Living (ADLs)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {["bathing", "toileting", "dressing", "kitchen", "laundry", "entry_egress", "community_access", "vehicle_transfers"].map((adl) => (
            <div key={adl} className="space-y-2">
              <Label className="capitalize">{adl.replace(/_/g, " ")}</Label>
              <Textarea value={clinicalData[`adl_${adl}`] || ""} onChange={(e) => updateField(`adl_${adl}`, e.target.value)} rows={2} placeholder="Describe ability and support needed" />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Anthropometrics (mm)</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          {["standing_height", "sitting_height", "shoulder_height", "reach_measurement", "knee_clearance", "toe_clearance", "wheelchair_length", "wheelchair_width", "wheelchair_height", "wheelchair_turning_radius"].map((measure) => (
            <div key={measure} className="space-y-2">
              <Label className="capitalize">{measure.replace(/_/g, " ")}</Label>
              <Input type="number" value={clinicalData[measure] || ""} onChange={(e) => updateField(measure, e.target.value ? parseFloat(e.target.value) : null)} />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Clinical Factors</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { field: "cognition_status", label: "Cognition Status" },
            { field: "vision_status", label: "Vision Status" },
            { field: "perception_status", label: "Perception Status" },
            { field: "communication_needs", label: "Communication Needs" },
            { field: "sensory_sensitivities", label: "Sensory Sensitivities" },
            { field: "fatigue_pain", label: "Fatigue & Pain" },
            { field: "thermoregulation", label: "Thermoregulation" },
            { field: "continence", label: "Continence" },
            { field: "skin_integrity", label: "Skin Integrity" }
          ].map(({ field, label }) => (
            <div key={field} className="space-y-2">
              <Label>{label}</Label>
              <Textarea value={clinicalData[field] || ""} onChange={(e) => updateField(field, e.target.value)} rows={2} />
            </div>
          ))}
          <div className="flex items-center space-x-2">
            <Checkbox checked={clinicalData.pressure_care_needed || false} onCheckedChange={(checked) => updateField("pressure_care_needed", checked)} />
            <Label>Pressure Care Needed</Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Carer Capacity & Outcome Measures</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Carer Capacity</Label>
            <Textarea value={clinicalData.carer_capacity || ""} onChange={(e) => updateField("carer_capacity", e.target.value)} rows={2} />
          </div>
          <div className="space-y-2">
            <Label>Manual Handling Risk</Label>
            <Textarea value={clinicalData.manual_handling_risk || ""} onChange={(e) => updateField("manual_handling_risk", e.target.value)} rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox checked={clinicalData.single_carer || false} onCheckedChange={(checked) => updateField("single_carer", checked)} />
              <Label>Single Carer</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox checked={clinicalData.two_carer_needed || false} onCheckedChange={(checked) => updateField("two_carer_needed", checked)} />
              <Label>Two Carer Needed</Label>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {["copm_score", "home_fast_score", "safer_home_score", "westmead_score"].map((score) => (
              <div key={score} className="space-y-2">
                <Label className="uppercase">{score.replace(/_score/g, "").replace(/_/g, " ")} Score</Label>
                <Input value={clinicalData[score] || ""} onChange={(e) => updateField(score, e.target.value)} />
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <Label>Special Population</Label>
            <Select value={clinicalData.special_population || ""} onValueChange={(value) => updateField("special_population", value)}>
              <SelectTrigger><SelectValue placeholder="Select if applicable" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="paediatric">Paediatric</SelectItem>
                <SelectItem value="bariatric">Bariatric</SelectItem>
                <SelectItem value="dementia">Dementia</SelectItem>
                <SelectItem value="mental_health">Mental Health</SelectItem>
                <SelectItem value="sensory">Sensory</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Special Considerations</Label>
            <Textarea value={clinicalData.special_considerations || ""} onChange={(e) => updateField("special_considerations", e.target.value)} rows={3} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}