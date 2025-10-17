import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Plus, ArrowLeft, User } from "lucide-react";
import Footer from "@/components/Footer";
import PageMeta from "@/components/PageMeta";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface Client {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string | null;
  diagnosis: string | null;
  funding_body: string | null;
  primary_mobility_aid: string | null;
  system_id: string | null;
  assigned_ot_id: string | null;
  created_at: string;
}

export default function Clients() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    date_of_birth: "",
    diagnosis: "",
    funding_body: "",
    primary_mobility_aid: "",
    notes: "",
    ot_system_id: "",
  });

  useEffect(() => {
    checkAuthAndLoadClients();
  }, []);

  const checkAuthAndLoadClients = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }
    await loadClients();
  };

  const loadClients = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setClients(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Validate required fields
      if (!formData.first_name.trim() || !formData.last_name.trim()) {
        throw new Error("First name and last name are required");
      }

      // Validate field lengths
      if (formData.first_name.length > 100 || formData.last_name.length > 100) {
        throw new Error("Names must be less than 100 characters");
      }

      if (formData.diagnosis && formData.diagnosis.length > 500) {
        throw new Error("Diagnosis must be less than 500 characters");
      }

      if (formData.notes && formData.notes.length > 2000) {
        throw new Error("Notes must be less than 2000 characters");
      }

      // Validate date of birth is not in the future
      if (formData.date_of_birth) {
        const dob = new Date(formData.date_of_birth);
        if (dob > new Date()) {
          throw new Error("Date of birth cannot be in the future");
        }
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      let assignedOtId = null;
      
      // If OT system ID is provided, look up the OT's profile ID
      if (formData.ot_system_id.trim()) {
        // Validate system ID format (alphanumeric with hyphens)
        if (!/^[A-Z]{2}-\d{6}$/.test(formData.ot_system_id.trim())) {
          throw new Error("Invalid OT System ID format. Expected format: OT-123456");
        }

        const { data: otProfile, error: otError } = await supabase
          .from("profiles")
          .select("id")
          .eq("system_id", formData.ot_system_id.trim())
          .single();

        if (otError || !otProfile) {
          throw new Error("Invalid OT System ID. Please check and try again.");
        }
        
        assignedOtId = otProfile.id;
      }

      const { error } = await supabase.from("clients").insert({
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        date_of_birth: formData.date_of_birth || null,
        diagnosis: formData.diagnosis?.trim() || null,
        funding_body: formData.funding_body as any || null,
        primary_mobility_aid: formData.primary_mobility_aid as any || null,
        notes: formData.notes?.trim() || null,
        assigned_ot_id: assignedOtId,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Client added successfully",
      });

      setIsDialogOpen(false);
      setFormData({
        first_name: "",
        last_name: "",
        date_of_birth: "",
        diagnosis: "",
        funding_body: "",
        primary_mobility_aid: "",
        notes: "",
        ot_system_id: "",
      });
      
      await loadClients();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <PageMeta 
        title="Client Management"
        description="Manage patient clients and their occupational therapy assessment records."
        canonical={window.location.origin + "/clients"}
      />
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
            <h1 className="text-2xl font-bold">Client Management</h1>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Client
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Client</DialogTitle>
                <DialogDescription>
                  Enter the client's information below
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">First Name *</Label>
                    <Input
                      id="first_name"
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name">Last Name *</Label>
                    <Input
                      id="last_name"
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date_of_birth">Date of Birth</Label>
                  <Input
                    id="date_of_birth"
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="diagnosis">Diagnosis</Label>
                  <Input
                    id="diagnosis"
                    value={formData.diagnosis}
                    onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="funding_body">Funding Body</Label>
                  <Select
                    value={formData.funding_body}
                    onValueChange={(value) => setFormData({ ...formData, funding_body: value })}
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
                    value={formData.primary_mobility_aid}
                    onValueChange={(value) => setFormData({ ...formData, primary_mobility_aid: value })}
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

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ot_system_id">Assign OT (Optional)</Label>
                  <Input
                    id="ot_system_id"
                    placeholder="Enter OT System ID (e.g., OT-123456)"
                    value={formData.ot_system_id}
                    onChange={(e) => setFormData({ ...formData, ot_system_id: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave blank to assign later
                  </p>
                </div>

                <Button type="submit" className="w-full">Add Client</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {loading ? (
          <p className="text-center text-muted-foreground">Loading clients...</p>
        ) : clients.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg text-muted-foreground mb-4">No clients yet</p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Client
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {clients.map((client) => (
              <Card key={client.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    {client.first_name} {client.last_name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {client.system_id && (
                    <p className="text-xs font-mono text-primary bg-primary/10 px-2 py-1 rounded">
                      Patient ID: {client.system_id}
                    </p>
                  )}
                  {client.date_of_birth && (
                    <p className="text-muted-foreground">
                      DOB: {new Date(client.date_of_birth).toLocaleDateString()}
                    </p>
                  )}
                  {client.diagnosis && (
                    <p className="text-muted-foreground">Diagnosis: {client.diagnosis}</p>
                  )}
                  {client.funding_body && (
                    <p className="text-muted-foreground">
                      Funding: {client.funding_body.replace(/_/g, " ").toUpperCase()}
                    </p>
                  )}
                  {client.primary_mobility_aid && (
                    <p className="text-muted-foreground">
                      Mobility Aid: {client.primary_mobility_aid.charAt(0).toUpperCase() + client.primary_mobility_aid.slice(1)}
                    </p>
                  )}
                  {client.assigned_ot_id && (
                    <p className="text-xs text-muted-foreground border-t pt-2 mt-2">
                      ✓ OT Assigned
                    </p>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-4"
                    onClick={() => navigate(`/assessment/new?client=${client.id}`)}
                  >
                    Start Assessment
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
}