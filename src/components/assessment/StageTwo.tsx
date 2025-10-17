import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";

interface StageTwoProps {
  functionalData: any;
  setFunctionalData: (data: any) => void;
  validationErrors?: Record<string, string>;
}

export default function StageTwo({ functionalData, setFunctionalData, validationErrors = {} }: StageTwoProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="primary_goal">Primary Goal (COPM-lite) *</Label>
        <p className="text-sm text-muted-foreground">What is the ONE thing you want help with?</p>
        <Textarea
          id="primary_goal"
          rows={4}
          value={functionalData.primary_goal}
          onChange={(e) => setFunctionalData({ ...functionalData, primary_goal: e.target.value })}
          placeholder="Describe your main goal..."
          className={validationErrors.primary_goal ? "border-destructive focus-visible:ring-destructive" : ""}
        />
        {validationErrors.primary_goal && (
          <p className="text-sm text-destructive">{validationErrors.primary_goal}</p>
        )}
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold">Difficulty Ratings (1-5)</h3>
        
        <div className="space-y-2">
          <Label>Toileting: {functionalData.difficulty_toileting}</Label>
          <Slider
            value={[functionalData.difficulty_toileting]}
            onValueChange={(value) => setFunctionalData({ ...functionalData, difficulty_toileting: value[0] })}
            min={1}
            max={5}
            step={1}
          />
        </div>

        <div className="space-y-2">
          <Label>Showering: {functionalData.difficulty_showering}</Label>
          <Slider
            value={[functionalData.difficulty_showering]}
            onValueChange={(value) => setFunctionalData({ ...functionalData, difficulty_showering: value[0] })}
            min={1}
            max={5}
            step={1}
          />
        </div>

        <div className="space-y-2">
          <Label>Transfers: {functionalData.difficulty_transfers}</Label>
          <Slider
            value={[functionalData.difficulty_transfers]}
            onValueChange={(value) => setFunctionalData({ ...functionalData, difficulty_transfers: value[0] })}
            min={1}
            max={5}
            step={1}
          />
        </div>

        <div className="space-y-2">
          <Label>Steps: {functionalData.difficulty_steps}</Label>
          <Slider
            value={[functionalData.difficulty_steps]}
            onValueChange={(value) => setFunctionalData({ ...functionalData, difficulty_steps: value[0] })}
            min={1}
            max={5}
            step={1}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="fall_history">Fall History</Label>
        <Textarea
          id="fall_history"
          rows={3}
          value={functionalData.fall_history}
          onChange={(e) => setFunctionalData({ ...functionalData, fall_history: e.target.value })}
          placeholder="Describe any falls..."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="near_miss_locations">Near-Miss Locations</Label>
        <Textarea
          id="near_miss_locations"
          rows={3}
          value={functionalData.near_miss_locations}
          onChange={(e) => setFunctionalData({ ...functionalData, near_miss_locations: e.target.value })}
          placeholder="Describe locations where near-misses occurred..."
        />
      </div>
    </div>
  );
}