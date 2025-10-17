import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, User, Check, X, Share2 } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";

interface Referral {
  id: string;
  status: string;
  notes: string | null;
  created_at: string;
  clients: {
    first_name: string;
    last_name: string;
    system_id: string;
  } | null;
  requesting_ot: {
    first_name: string;
    last_name: string;
    system_id: string;
  } | null;
}

export default function Referrals() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [actionNotes, setActionNotes] = useState("");
  const [referToOtId, setReferToOtId] = useState("");

  useEffect(() => {
    checkAuthAndLoadReferrals();
  }, []);

  const checkAuthAndLoadReferrals = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }
    await loadReferrals();
  };

  const loadReferrals = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from("referrals")
        .select(`
          id,
          status,
          notes,
          created_at,
          clients (
            first_name,
            last_name,
            system_id
          ),
          requesting_ot:profiles!referrals_requesting_ot_id_fkey (
            first_name,
            last_name,
            system_id
          )
        `)
        .eq("target_ot_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setReferrals(data || []);
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

  const handleAccept = async (referralId: string, clientId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Update referral status
      const { error: referralError } = await supabase
        .from("referrals")
        .update({ status: "accepted" })
        .eq("id", referralId);

      if (referralError) throw referralError;

      // Assign OT to client
      const { error: clientError } = await supabase
        .from("clients")
        .update({ assigned_ot_id: user?.id })
        .eq("id", clientId);

      if (clientError) throw clientError;

      toast({
        title: "Referral Accepted",
        description: "Patient has been assigned to you",
      });

      await loadReferrals();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleReject = async (referralId: string) => {
    try {
      const { error } = await supabase
        .from("referrals")
        .update({ status: "rejected", notes: actionNotes })
        .eq("id", referralId);

      if (error) throw error;

      toast({
        title: "Referral Rejected",
        description: "The referral has been declined",
      });

      setActionNotes("");
      setIsDialogOpen(false);
      await loadReferrals();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleRefer = async (referralId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Look up the OT by system ID
      const { data: targetOt, error: otError } = await supabase
        .from("profiles")
        .select("id")
        .eq("system_id", referToOtId.trim())
        .single();

      if (otError || !targetOt) {
        throw new Error("Invalid OT System ID");
      }

      // Update current referral
      const { error: updateError } = await supabase
        .from("referrals")
        .update({ 
          status: "referred", 
          referred_to_ot_id: targetOt.id,
          notes: actionNotes 
        })
        .eq("id", referralId);

      if (updateError) throw updateError;

      // Get client ID from current referral
      const currentReferral = referrals.find(r => r.id === referralId);
      if (!currentReferral?.clients) throw new Error("Client not found");

      // Create new referral to the target OT
      const { error: newRefError } = await supabase
        .from("referrals")
        .insert({
          client_id: currentReferral.clients.system_id,
          requesting_ot_id: user?.id,
          target_ot_id: targetOt.id,
          status: "pending",
          notes: `Referred by ${user?.user_metadata?.first_name || 'OT'}: ${actionNotes}`,
        });

      if (newRefError) throw newRefError;

      toast({
        title: "Referral Forwarded",
        description: "The referral has been sent to another OT",
      });

      setActionNotes("");
      setReferToOtId("");
      setIsDialogOpen(false);
      await loadReferrals();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
      pending: "secondary",
      accepted: "default",
      rejected: "destructive",
      referred: "outline",
    };
    return (
      <Badge variant={variants[status] || "outline"}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <PageMeta 
        title="Patient Referrals"
        description="Manage patient referrals and occupational therapy case assignments."
        canonical={window.location.origin + "/referrals"}
      />
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
            <h1 className="text-2xl font-bold">Patient Referrals</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {loading ? (
          <p className="text-center text-muted-foreground">Loading referrals...</p>
        ) : referrals.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg text-muted-foreground mb-4">No referrals yet</p>
              <p className="text-sm text-muted-foreground">
                Share your OT System ID with patients to receive referrals
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {referrals.map((referral) => (
              <Card key={referral.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        {referral.clients
                          ? `${referral.clients.first_name} ${referral.clients.last_name}`
                          : "Unknown Patient"}
                      </CardTitle>
                      {referral.clients?.system_id && (
                        <p className="text-xs font-mono text-muted-foreground">
                          Patient ID: {referral.clients.system_id}
                        </p>
                      )}
                      {referral.requesting_ot && (
                        <p className="text-sm text-muted-foreground">
                          From: {referral.requesting_ot.first_name} {referral.requesting_ot.last_name} 
                          <span className="font-mono ml-2">({referral.requesting_ot.system_id})</span>
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {new Date(referral.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    {getStatusBadge(referral.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  {referral.notes && (
                    <p className="text-sm text-muted-foreground mb-4 p-3 bg-muted rounded-md">
                      {referral.notes}
                    </p>
                  )}
                  
                  {referral.status === "pending" && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleAccept(referral.id, referral.clients?.system_id || "")}
                      >
                        <Check className="mr-2 h-4 w-4" />
                        Accept
                      </Button>
                      
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline">
                            <X className="mr-2 h-4 w-4" />
                            Reject
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Reject Referral</DialogTitle>
                            <DialogDescription>
                              Add optional notes about why you're rejecting this referral
                            </DialogDescription>
                          </DialogHeader>
                          <Textarea
                            placeholder="Reason for rejection..."
                            value={actionNotes}
                            onChange={(e) => setActionNotes(e.target.value)}
                          />
                          <Button onClick={() => handleReject(referral.id)}>
                            Confirm Rejection
                          </Button>
                        </DialogContent>
                      </Dialog>

                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline">
                            <Share2 className="mr-2 h-4 w-4" />
                            Refer to Another OT
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Refer to Another OT</DialogTitle>
                            <DialogDescription>
                              Forward this referral to another occupational therapist
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="refer_to_ot">Target OT System ID</Label>
                              <Input
                                id="refer_to_ot"
                                placeholder="OT-123456"
                                value={referToOtId}
                                onChange={(e) => setReferToOtId(e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="refer_notes">Referral Notes</Label>
                              <Textarea
                                id="refer_notes"
                                placeholder="Reason for referral..."
                                value={actionNotes}
                                onChange={(e) => setActionNotes(e.target.value)}
                              />
                            </div>
                            <Button 
                              onClick={() => handleRefer(referral.id)}
                              disabled={!referToOtId.trim()}
                            >
                              Forward Referral
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  )}
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
