import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface StageOneProps {
  selectedClientId: string;
  setSelectedClientId: (id: string) => void;
  clientData: any;
  setClientData: (data: any) => void;
}

export default function StageOne({
  selectedClientId,
  setSelectedClientId,
  clientData,
  setClientData,
}: StageOneProps) {
  const [clients, setClients] = useState<any[]>([]);
  const [mode, setMode] = useState<"select" | "new">(selectedClientId ? "select" : "new");

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    const { data } = await supabase
      .from("clients")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (data) {
      setClients(data);
    }
  };

  const handleClientSelect = async (clientId: string) => {
    setSelectedClientId(clientId);
    const client = clients.find((c) => c.id === clientId);
    if (client) {
      setClientData({
        first_name: client.first_name,
        last_name: client.last_name,
        date_of_birth: client.date_of_birth || "",
        diagnosis: client.diagnosis || "",
        funding_body: client.funding_body || "",
        primary_mobility_aid: client.primary_mobility_aid || "",
        mobile_number: client.mobile_number || "",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Label>Client Selection</Label>
        <RadioGroup value={mode} onValueChange={(value) => setMode(value as "select" | "new")}>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="select" id="select" />
            <Label htmlFor="select">Select Existing Client</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="new" id="new" />
            <Label htmlFor="new">New Client</Label>
          </div>
        </RadioGroup>
      </div>

      {mode === "select" && (
        <div className="space-y-2">
          <Label htmlFor="client-select">Select Client</Label>
          <Select value={selectedClientId} onValueChange={handleClientSelect}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a client" />
            </SelectTrigger>
            <SelectContent>
              {clients.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.first_name} {client.last_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="first_name">First Name *</Label>
          <Input
            id="first_name"
            value={clientData.first_name}
            onChange={(e) => setClientData({ ...clientData, first_name: e.target.value })}
            required
            disabled={mode === "select"}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="last_name">Last Name *</Label>
          <Input
            id="last_name"
            value={clientData.last_name}
            onChange={(e) => setClientData({ ...clientData, last_name: e.target.value })}
            required
            disabled={mode === "select"}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="date_of_birth">Date of Birth</Label>
        <Input
          id="date_of_birth"
          type="date"
          value={clientData.date_of_birth}
          onChange={(e) => setClientData({ ...clientData, date_of_birth: e.target.value })}
          disabled={mode === "select"}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="mobile_number">Mobile Number</Label>
        <Input
          id="mobile_number"
          type="tel"
          placeholder="e.g., 0412 345 678"
          value={clientData.mobile_number}
          onChange={(e) => setClientData({ ...clientData, mobile_number: e.target.value })}
          disabled={mode === "select"}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="diagnosis">Diagnosis</Label>
        <Input
          id="diagnosis"
          value={clientData.diagnosis}
          onChange={(e) => setClientData({ ...clientData, diagnosis: e.target.value })}
          disabled={mode === "select"}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="funding_body">Funding Body</Label>
        <Select
          value={clientData.funding_body}
          onValueChange={(value) => setClientData({ ...clientData, funding_body: value })}
          disabled={mode === "select"}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select funding body" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ndis">NDIS</SelectItem>
            <SelectItem value="my_aged_care">My Aged Care</SelectItem>
            <SelectItem value="private">Private</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="primary_mobility_aid">Primary Mobility Aid</Label>
        <Select
          value={clientData.primary_mobility_aid}
          onValueChange={(value) => setClientData({ ...clientData, primary_mobility_aid: value })}
          disabled={mode === "select"}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select mobility aid" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="wheelchair">Wheelchair</SelectItem>
            <SelectItem value="walker">Walker</SelectItem>
            <SelectItem value="cane">Cane</SelectItem>
            <SelectItem value="none">None</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}