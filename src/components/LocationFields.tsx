import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const AUSTRALIAN_STATES = [
  { value: "NSW", label: "New South Wales" },
  { value: "VIC", label: "Victoria" },
  { value: "QLD", label: "Queensland" },
  { value: "WA", label: "Western Australia" },
  { value: "SA", label: "South Australia" },
  { value: "TAS", label: "Tasmania" },
  { value: "ACT", label: "Australian Capital Territory" },
  { value: "NT", label: "Northern Territory" },
];

interface LocationData {
  postal_code: string;
  suburb: string;
  state: string;
  country: string;
}

interface LocationFieldsProps {
  data: LocationData;
  onChange: (data: LocationData) => void;
  disabled?: boolean;
  showCountry?: boolean;
}

export default function LocationFields({ 
  data, 
  onChange, 
  disabled = false,
  showCountry = false 
}: LocationFieldsProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="postal_code">Postal Code</Label>
          <Input
            id="postal_code"
            placeholder="e.g., 2000"
            maxLength={4}
            value={data.postal_code}
            onChange={(e) => onChange({ ...data, postal_code: e.target.value.replace(/\D/g, '').slice(0, 4) })}
            disabled={disabled}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="suburb">Suburb/Town</Label>
          <Input
            id="suburb"
            placeholder="e.g., Sydney"
            value={data.suburb}
            onChange={(e) => onChange({ ...data, suburb: e.target.value })}
            disabled={disabled}
          />
        </div>
      </div>

      <div className={showCountry ? "grid grid-cols-2 gap-4" : ""}>
        <div className="space-y-2">
          <Label htmlFor="state">State</Label>
          <Select
            value={data.state}
            onValueChange={(value) => onChange({ ...data, state: value })}
            disabled={disabled}
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

        {showCountry && (
          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Input
              id="country"
              value={data.country}
              onChange={(e) => onChange({ ...data, country: e.target.value })}
              disabled={disabled}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export { AUSTRALIAN_STATES };
export type { LocationData };