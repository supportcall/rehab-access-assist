import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";

interface StageNineProps {
  complianceData: any[];
  setComplianceData: (data: any[]) => void;
}

export default function StageNine({ complianceData, setComplianceData }: StageNineProps) {
  const addCompliance = () => {
    setComplianceData([...complianceData, { standard_reference: "", provision_number: "", requirement_description: "", compliant: false, non_compliance_notes: "", remediation_required: "" }]);
  };

  const removeCompliance = (index: number) => {
    setComplianceData(complianceData.filter((_, i) => i !== index));
  };

  const updateCompliance = (index: number, field: string, value: any) => {
    const updated = [...complianceData];
    updated[index] = { ...updated[index], [field]: value };
    setComplianceData(updated);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Compliance Checklist (NCC, LHDS, AS Standards)</CardTitle>
            <Button onClick={addCompliance} size="sm"><Plus className="mr-2 h-4 w-4" />Add Compliance Item</Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {complianceData.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">No compliance items added yet. Add items to check compliance with Australian standards.</p>
          ) : (
            complianceData.map((item, index) => (
              <Card key={index}>
                <CardContent className="pt-4 space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-semibold">Compliance Item {index + 1}</h4>
                    <Button variant="ghost" size="sm" onClick={() => removeCompliance(index)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Standard Reference</Label>
                      <Select value={item.standard_reference || ""} onValueChange={(value) => updateCompliance(index, "standard_reference", value)}>
                        <SelectTrigger><SelectValue placeholder="Select standard" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="NCC">NCC (National Construction Code)</SelectItem>
                          <SelectItem value="LHDS">LHDS (Livable Housing Design Standards)</SelectItem>
                          <SelectItem value="AS 1428.1">AS 1428.1 (Design for Access)</SelectItem>
                          <SelectItem value="AS 3740">AS 3740 (Waterproofing)</SelectItem>
                          <SelectItem value="AS/NZS 3000">AS/NZS 3000 (Electrical)</SelectItem>
                          <SelectItem value="AS 3786">AS 3786 (Smoke Alarms)</SelectItem>
                          <SelectItem value="AS 1288">AS 1288 (Glass)</SelectItem>
                          <SelectItem value="AS/NZS 3500.4">AS/NZS 3500.4 (Hot Water)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Provision Number</Label>
                      <Input value={item.provision_number || ""} onChange={(e) => updateCompliance(index, "provision_number", e.target.value)} placeholder="e.g., 3.8.3" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Requirement Description</Label>
                    <Textarea value={item.requirement_description || ""} onChange={(e) => updateCompliance(index, "requirement_description", e.target.value)} rows={2} placeholder="Describe the specific requirement" />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox checked={item.compliant || false} onCheckedChange={(checked) => updateCompliance(index, "compliant", checked)} />
                    <Label>Compliant</Label>
                  </div>
                  {!item.compliant && (
                    <>
                      <div className="space-y-2">
                        <Label>Non-Compliance Notes</Label>
                        <Textarea value={item.non_compliance_notes || ""} onChange={(e) => updateCompliance(index, "non_compliance_notes", e.target.value)} rows={2} placeholder="Explain why non-compliant" />
                      </div>
                      <div className="space-y-2">
                        <Label>Remediation Required</Label>
                        <Textarea value={item.remediation_required || ""} onChange={(e) => updateCompliance(index, "remediation_required", e.target.value)} rows={2} placeholder="Describe actions needed to achieve compliance" />
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quick Reference Standards</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p><strong>Step-free path:</strong> Width ≥1000mm, gradient ≤1:14, crossfall ≤1:40</p>
          <p><strong>Doors (LHDS):</strong> ≥820mm clear opening, thresholds ≤5mm</p>
          <p><strong>Corridors (LHDS):</strong> ≥1000mm minimum width</p>
          <p><strong>Wheelchair turning:</strong> 1500×1500mm for 60-90° turns (AS 1428.1)</p>
          <p><strong>Hot water:</strong> ≤50°C at personal-hygiene outlets (AS/NZS 3500.4)</p>
          <p><strong>Smoke alarms:</strong> AS 3786:2023 location & interconnection</p>
        </CardContent>
      </Card>
    </div>
  );
}