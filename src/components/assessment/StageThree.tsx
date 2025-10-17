import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StageThreeProps {
  assessmentId: string | null;
  environmentalAreas: any[];
  setEnvironmentalAreas: (areas: any[]) => void;
}

export default function StageThree({ assessmentId, environmentalAreas, setEnvironmentalAreas }: StageThreeProps) {
  const addArea = () => {
    setEnvironmentalAreas([
      ...environmentalAreas,
      {
        area_location: "",
        area_name: "",
        door_clear_width: "",
        threshold_height: "",
        toilet_centerline_left: "",
        toilet_centerline_right: "",
        ramp_gradient_riser: "",
        ramp_gradient_going: "",
        wall_construction: "",
        notes: "",
        barriers: "",
      },
    ]);
  };

  const removeArea = (index: number) => {
    setEnvironmentalAreas(environmentalAreas.filter((_, i) => i !== index));
  };

  const updateArea = (index: number, field: string, value: any) => {
    const updated = [...environmentalAreas];
    updated[index] = { ...updated[index], [field]: value };
    setEnvironmentalAreas(updated);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Environmental Areas</h3>
        <Button onClick={addArea} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add Area
        </Button>
      </div>

      {environmentalAreas.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">
          No areas added yet. Click "Add Area" to begin.
        </p>
      ) : (
        <div className="space-y-4">
          {environmentalAreas.map((area, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Area {index + 1}</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => removeArea(index)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Location Type</Label>
                    <Select
                      value={area.area_location}
                      onValueChange={(value) => updateArea(index, "area_location", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select location" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bathroom_toilet">Bathroom - Toilet</SelectItem>
                        <SelectItem value="bathroom_shower">Bathroom - Shower</SelectItem>
                        <SelectItem value="bedroom">Bedroom</SelectItem>
                        <SelectItem value="kitchen">Kitchen</SelectItem>
                        <SelectItem value="front_entry">Front Entry</SelectItem>
                        <SelectItem value="rear_entry">Rear Entry</SelectItem>
                        <SelectItem value="stairs_internal">Stairs - Internal</SelectItem>
                        <SelectItem value="stairs_external">Stairs - External</SelectItem>
                        <SelectItem value="living_room">Living Room</SelectItem>
                        <SelectItem value="hallway">Hallway</SelectItem>
                        <SelectItem value="ramp">Ramp</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Area Name</Label>
                    <Input
                      value={area.area_name}
                      onChange={(e) => updateArea(index, "area_name", e.target.value)}
                      placeholder="E.g., Main Bathroom"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Door Clear Width (mm)</Label>
                    <Input
                      type="number"
                      value={area.door_clear_width || ""}
                      onChange={(e) => updateArea(index, "door_clear_width", e.target.value ? parseFloat(e.target.value) : null)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Threshold Height (mm)</Label>
                    <Input
                      type="number"
                      value={area.threshold_height || ""}
                      onChange={(e) => updateArea(index, "threshold_height", e.target.value ? parseFloat(e.target.value) : null)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Wall Construction</Label>
                  <Select
                    value={area.wall_construction}
                    onValueChange={(value) => updateArea(index, "wall_construction", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select construction type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="plaster">Plaster</SelectItem>
                      <SelectItem value="brick">Brick</SelectItem>
                      <SelectItem value="tile_over_plaster">Tile over Plaster</SelectItem>
                      <SelectItem value="concrete">Concrete</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={area.notes}
                    onChange={(e) => updateArea(index, "notes", e.target.value)}
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}