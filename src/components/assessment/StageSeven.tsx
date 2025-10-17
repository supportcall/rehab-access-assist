import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";

interface StageSevenProps {
  siteSurveyData: any;
  setSiteSurveyData: (data: any) => void;
  structuralData: any;
  setStructuralData: (data: any) => void;
  measurements: any[];
  setMeasurements: (data: any[]) => void;
}

export default function StageSeven({ siteSurveyData, setSiteSurveyData, structuralData, setStructuralData, measurements, setMeasurements }: StageSevenProps) {
  const updateSiteSurvey = (field: string, value: any) => {
    setSiteSurveyData({ ...siteSurveyData, [field]: value });
  };

  const updateStructural = (field: string, value: any) => {
    setStructuralData({ ...structuralData, [field]: value });
  };

  const addMeasurement = () => {
    setMeasurements([...measurements, { location: "", measurement_type: "", value_mm: null, required_value_mm: null, compliant: false, standard_reference: "", notes: "" }]);
  };

  const removeMeasurement = (index: number) => {
    setMeasurements(measurements.filter((_, i) => i !== index));
  };

  const updateMeasurement = (index: number, field: string, value: any) => {
    const updated = [...measurements];
    updated[index] = { ...updated[index], [field]: value };
    setMeasurements(updated);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Site Access & Entry</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Parking Bay Dimensions</Label>
            <Input value={siteSurveyData.parking_bay_dimensions || ""} onChange={(e) => updateSiteSurvey("parking_bay_dimensions", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Path Width (mm) - Required: ≥1000mm</Label>
            <Input type="number" value={siteSurveyData.path_width || ""} onChange={(e) => updateSiteSurvey("path_width", e.target.value ? parseFloat(e.target.value) : null)} />
          </div>
          <div className="space-y-2">
            <Label>Path Gradient (e.g., 1:14)</Label>
            <Input value={siteSurveyData.path_gradient || ""} onChange={(e) => updateSiteSurvey("path_gradient", e.target.value)} placeholder="1:14" />
          </div>
          <div className="space-y-2">
            <Label>Entrance Door Clear Opening (mm) - Required: ≥820mm</Label>
            <Input type="number" value={siteSurveyData.entrance_door_clear_opening || ""} onChange={(e) => updateSiteSurvey("entrance_door_clear_opening", e.target.value ? parseFloat(e.target.value) : null)} />
          </div>
          <div className="space-y-2">
            <Label>Entrance Threshold Height (mm) - Required: ≤5mm</Label>
            <Input type="number" value={siteSurveyData.entrance_threshold_height || ""} onChange={(e) => updateSiteSurvey("entrance_threshold_height", e.target.value ? parseFloat(e.target.value) : null)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox checked={siteSurveyData.set_down_area || false} onCheckedChange={(checked) => updateSiteSurvey("set_down_area", checked)} />
              <Label>Set Down Area</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox checked={siteSurveyData.weather_protection || false} onCheckedChange={(checked) => updateSiteSurvey("weather_protection", checked)} />
              <Label>Weather Protection</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Internal Circulation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Corridor Width (mm) - Required: ≥1000mm</Label>
            <Input type="number" value={siteSurveyData.corridors_width || ""} onChange={(e) => updateSiteSurvey("corridors_width", e.target.value ? parseFloat(e.target.value) : null)} />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox checked={siteSurveyData.doors_compliant || false} onCheckedChange={(checked) => updateSiteSurvey("doors_compliant", checked)} />
            <Label>Doors Compliant (≥820mm clear)</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox checked={siteSurveyData.turning_spaces_adequate || false} onCheckedChange={(checked) => updateSiteSurvey("turning_spaces_adequate", checked)} />
            <Label>Turning Spaces Adequate (1500x1500mm)</Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Services & Systems (AS 3786:2023, AS/NZS 3500.4)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox checked={siteSurveyData.rcds_present || false} onCheckedChange={(checked) => updateSiteSurvey("rcds_present", checked)} />
              <Label>RCDs Present</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox checked={siteSurveyData.smoke_alarms_compliant || false} onCheckedChange={(checked) => updateSiteSurvey("smoke_alarms_compliant", checked)} />
              <Label>Smoke Alarms Compliant</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox checked={siteSurveyData.hot_water_temp_compliant || false} onCheckedChange={(checked) => updateSiteSurvey("hot_water_temp_compliant", checked)} />
              <Label>Hot Water Temp ≤50°C</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox checked={siteSurveyData.tmv_present || false} onCheckedChange={(checked) => updateSiteSurvey("tmv_present", checked)} />
              <Label>TMV Present</Label>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Hazardous Materials (Asbestos/Lead Paint)</Label>
            <Textarea value={siteSurveyData.asbestos_likelihood || ""} onChange={(e) => updateSiteSurvey("asbestos_likelihood", e.target.value)} rows={2} placeholder="Describe likelihood and locations" />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox checked={siteSurveyData.asbestos_testing_required || false} onCheckedChange={(checked) => updateSiteSurvey("asbestos_testing_required", checked)} />
            <Label>Asbestos Testing Required</Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Structural Reconnaissance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {["wall_construction", "stud_layout", "ceiling_roof_framing", "slab_joist_details", "hoist_load_paths"].map((field) => (
            <div key={field} className="space-y-2">
              <Label className="capitalize">{field.replace(/_/g, " ")}</Label>
              <Textarea value={structuralData[field] || ""} onChange={(e) => updateStructural(field, e.target.value)} rows={2} />
            </div>
          ))}
          <div className="flex items-center space-x-2">
            <Checkbox checked={structuralData.engineer_required || false} onCheckedChange={(checked) => updateStructural("engineer_required", checked)} />
            <Label>Engineer Required</Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Detailed Measurements (NCC/LHDS/AS 1428.1)</CardTitle>
            <Button onClick={addMeasurement} size="sm"><Plus className="mr-2 h-4 w-4" />Add Measurement</Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {measurements.map((m, index) => (
            <Card key={index}>
              <CardContent className="pt-4 space-y-4">
                <div className="flex justify-end">
                  <Button variant="ghost" size="sm" onClick={() => removeMeasurement(index)}><Trash2 className="h-4 w-4" /></Button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Location</Label>
                    <Input value={m.location || ""} onChange={(e) => updateMeasurement(index, "location", e.target.value)} placeholder="e.g., Bathroom" />
                  </div>
                  <div className="space-y-2">
                    <Label>Measurement Type</Label>
                    <Input value={m.measurement_type || ""} onChange={(e) => updateMeasurement(index, "measurement_type", e.target.value)} placeholder="e.g., Door width" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Actual (mm)</Label>
                    <Input type="number" value={m.value_mm || ""} onChange={(e) => updateMeasurement(index, "value_mm", e.target.value ? parseFloat(e.target.value) : null)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Required (mm)</Label>
                    <Input type="number" value={m.required_value_mm || ""} onChange={(e) => updateMeasurement(index, "required_value_mm", e.target.value ? parseFloat(e.target.value) : null)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Standard</Label>
                    <Input value={m.standard_reference || ""} onChange={(e) => updateMeasurement(index, "standard_reference", e.target.value)} placeholder="LHDS/NCC/AS" />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox checked={m.compliant || false} onCheckedChange={(checked) => updateMeasurement(index, "compliant", checked)} />
                  <Label>Compliant</Label>
                </div>
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}