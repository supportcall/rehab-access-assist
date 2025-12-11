import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AUSTRALIAN_STATES } from "./LocationFields";

const SERVICE_AREA_TYPES = [
  { value: "postal_code", label: "Postal Code" },
  { value: "suburb", label: "Suburb/Town" },
  { value: "state", label: "State" },
  { value: "country", label: "Entire Country" },
];

interface ServiceAreaData {
  service_area_type: string;
  service_area_value: string;
  service_radius_km: number;
}

interface ServiceAreaFieldsProps {
  data: ServiceAreaData;
  onChange: (data: ServiceAreaData) => void;
}

export default function ServiceAreaFields({ data, onChange }: ServiceAreaFieldsProps) {
  const renderValueInput = () => {
    switch (data.service_area_type) {
      case "postal_code":
        return (
          <div className="space-y-2">
            <Label htmlFor="service_area_value">Postal Code(s)</Label>
            <Input
              id="service_area_value"
              placeholder="e.g., 2000, 2001, 2010"
              value={data.service_area_value}
              onChange={(e) => onChange({ ...data, service_area_value: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">Enter multiple codes separated by commas</p>
          </div>
        );
      case "suburb":
        return (
          <div className="space-y-2">
            <Label htmlFor="service_area_value">Suburb(s)</Label>
            <Input
              id="service_area_value"
              placeholder="e.g., Sydney, Parramatta, Chatswood"
              value={data.service_area_value}
              onChange={(e) => onChange({ ...data, service_area_value: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">Enter multiple suburbs separated by commas</p>
          </div>
        );
      case "state":
        return (
          <div className="space-y-2">
            <Label htmlFor="service_area_value">State(s)</Label>
            <Select
              value={data.service_area_value}
              onValueChange={(value) => onChange({ ...data, service_area_value: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select state" />
              </SelectTrigger>
              <SelectContent>
                {AUSTRALIAN_STATES.map((state) => (
                  <SelectItem key={state.value} value={state.value}>
                    {state.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );
      case "country":
        return (
          <div className="space-y-2">
            <Label htmlFor="service_area_value">Country</Label>
            <Input
              id="service_area_value"
              value="Australia"
              disabled
            />
            <p className="text-xs text-muted-foreground">Service entire country</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4 border-t pt-4 mt-4">
      <h4 className="font-medium text-sm">Service Area (for referrals)</h4>
      
      <div className="space-y-2">
        <Label htmlFor="service_area_type">Service Area Type</Label>
        <Select
          value={data.service_area_type}
          onValueChange={(value) => onChange({ 
            ...data, 
            service_area_type: value,
            service_area_value: value === "country" ? "Australia" : ""
          })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select service area type" />
          </SelectTrigger>
          <SelectContent>
            {SERVICE_AREA_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {renderValueInput()}

      <div className="space-y-2">
        <Label htmlFor="service_radius_km">Service Radius (km)</Label>
        <Input
          id="service_radius_km"
          type="number"
          min="1"
          max="500"
          value={data.service_radius_km}
          onChange={(e) => onChange({ ...data, service_radius_km: parseInt(e.target.value) || 50 })}
        />
        <p className="text-xs text-muted-foreground">Maximum distance you're willing to travel from your location</p>
      </div>
    </div>
  );
}

export { SERVICE_AREA_TYPES };
export type { ServiceAreaData };