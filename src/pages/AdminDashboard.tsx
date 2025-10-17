import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, CheckCircle, XCircle, Clock, Users, Settings as SettingsIcon } from "lucide-react";
import { getSafeErrorMessage } from "@/lib/errorHandling";
import Footer from "@/components/Footer";
import PageMeta from "@/components/PageMeta";
import logo from "@/assets/enabledc-logo.png";

interface SignupRequest {
  id: string;
  user_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  status: string;
  requested_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  rejection_reason: string | null;
}

interface SystemSetting {
  id: string;
  setting_key: string;
  setting_value: any;
  description: string | null;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<SignupRequest[]>([]);
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [rejectionDialog, setRejectionDialog] = useState<{ open: boolean; requestId: string | null }>({ open: false, requestId: null });
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    checkAuthAndLoadData();
  }, []);

  const checkAuthAndLoadData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      // Check if user is system admin
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id);

      const isSystemAdmin = roles?.some(r => r.role === "system_admin");
      
      if (!isSystemAdmin) {
        toast({
          title: "Access Denied",
          description: "You do not have permission to access this page.",
          variant: "destructive",
        });
        navigate("/dashboard");
        return;
      }

      await loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: getSafeErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadData = async () => {
    try {
      // Load signup requests
      const { data: requestsData, error: requestsError } = await supabase
        .from("ot_signup_requests")
        .select("*")
        .order("requested_at", { ascending: false });

      if (requestsError) throw requestsError;
      setRequests(requestsData || []);

      // Load system settings
      const { data: settingsData, error: settingsError } = await supabase
        .from("system_settings")
        .select("*");

      if (settingsError) throw settingsError;
      setSettings(settingsData || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: getSafeErrorMessage(error),
        variant: "destructive",
      });
    }
  };

  const handleApprove = async (requestId: string) => {
    try {
      const { error } = await supabase.rpc("approve_ot_signup", {
        request_id: requestId,
      });

      if (error) throw error;

      toast({
        title: "Request Approved",
        description: "The OT signup request has been approved successfully.",
      });

      await loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: getSafeErrorMessage(error),
        variant: "destructive",
      });
    }
  };

  const handleReject = async () => {
    if (!rejectionDialog.requestId || !rejectionReason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for rejection.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase.rpc("reject_ot_signup", {
        request_id: rejectionDialog.requestId,
        reason: rejectionReason,
      });

      if (error) throw error;

      toast({
        title: "Request Rejected",
        description: "The OT signup request has been rejected.",
      });

      setRejectionDialog({ open: false, requestId: null });
      setRejectionReason("");
      await loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: getSafeErrorMessage(error),
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="flex items-center gap-1"><Clock className="h-3 w-3" />Pending</Badge>;
      case "approved":
        return <Badge className="flex items-center gap-1 bg-green-500"><CheckCircle className="h-3 w-3" />Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive" className="flex items-center gap-1"><XCircle className="h-3 w-3" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const pendingCount = requests.filter(r => r.status === "pending").length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <>
      <PageMeta 
        title="Admin Dashboard - OT Assessment Portal"
        description="System administration dashboard for managing OT signup requests and system settings"
      />
      
      <div className="min-h-screen flex flex-col bg-background">
        <header className="border-b bg-card">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/dashboard")}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <img src={logo} alt="EnabledCare Logo" className="h-10" />
              <div>
                <h1 className="text-2xl font-bold">Admin Dashboard</h1>
                <p className="text-sm text-muted-foreground">System Administration</p>
              </div>
            </div>
          </div>
        </header>

        <main id="main-content" className="flex-1 container mx-auto px-4 py-8">
          <Tabs defaultValue="requests" className="space-y-6">
            <TabsList>
              <TabsTrigger value="requests" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                OT Signup Requests
                {pendingCount > 0 && (
                  <Badge variant="destructive" className="ml-2">{pendingCount}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <SettingsIcon className="h-4 w-4" />
                System Settings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="requests" className="space-y-4">
              <Card className="hover:bg-primary/10 transition-colors">
                <CardHeader>
                  <CardTitle>Pending Requests</CardTitle>
                  <CardDescription>Review and approve or reject OT signup requests</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {requests.filter(r => r.status === "pending").length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No pending requests</p>
                  ) : (
                    requests
                      .filter(r => r.status === "pending")
                      .map((request) => (
                        <Card key={request.id} className="hover:bg-primary/10 transition-colors">
                          <CardContent className="pt-6">
                            <div className="flex items-start justify-between">
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <h3 className="font-semibold">
                                    {request.first_name} {request.last_name}
                                  </h3>
                                  {getStatusBadge(request.status)}
                                </div>
                                <p className="text-sm text-muted-foreground">{request.email}</p>
                                <p className="text-xs text-muted-foreground">
                                  Requested: {new Date(request.requested_at).toLocaleString()}
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  onClick={() => handleApprove(request.id)}
                                  className="flex items-center gap-2"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                  Approve
                                </Button>
                                <Button
                                  variant="destructive"
                                  onClick={() => setRejectionDialog({ open: true, requestId: request.id })}
                                  className="flex items-center gap-2"
                                >
                                  <XCircle className="h-4 w-4" />
                                  Reject
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                  )}
                </CardContent>
              </Card>

              <Card className="hover:bg-primary/10 transition-colors">
                <CardHeader>
                  <CardTitle>Request History</CardTitle>
                  <CardDescription>All processed signup requests</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {requests.filter(r => r.status !== "pending").length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No processed requests</p>
                  ) : (
                    requests
                      .filter(r => r.status !== "pending")
                      .map((request) => (
                        <Card key={request.id} className="hover:bg-primary/10 transition-colors">
                          <CardContent className="pt-6">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <h3 className="font-semibold">
                                    {request.first_name} {request.last_name}
                                  </h3>
                                  {getStatusBadge(request.status)}
                                </div>
                              </div>
                              <p className="text-sm text-muted-foreground">{request.email}</p>
                              <div className="text-xs text-muted-foreground space-y-1">
                                <p>Requested: {new Date(request.requested_at).toLocaleString()}</p>
                                {request.reviewed_at && (
                                  <p>Reviewed: {new Date(request.reviewed_at).toLocaleString()}</p>
                                )}
                                {request.rejection_reason && (
                                  <p className="text-destructive">Reason: {request.rejection_reason}</p>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <Card className="hover:bg-primary/10 transition-colors">
                <CardHeader>
                  <CardTitle>System Settings</CardTitle>
                  <CardDescription>Configure system-wide settings (view only for now)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {settings.map((setting) => (
                    <Card key={setting.id} className="hover:bg-primary/10 transition-colors">
                      <CardContent className="pt-6">
                        <div className="space-y-2">
                          <h3 className="font-semibold">{setting.setting_key}</h3>
                          {setting.description && (
                            <p className="text-sm text-muted-foreground">{setting.description}</p>
                          )}
                          <pre className="text-xs bg-muted p-2 rounded overflow-auto">
                            {JSON.stringify(setting.setting_value, null, 2)}
                          </pre>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>

        <Footer />
      </div>

      <Dialog open={rejectionDialog.open} onOpenChange={(open) => {
        if (!open) {
          setRejectionDialog({ open: false, requestId: null });
          setRejectionReason("");
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Signup Request</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this OT signup request. This will be visible to the applicant.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Rejection Reason *</Label>
              <Textarea
                id="reason"
                placeholder="Enter reason for rejection..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectionDialog({ open: false, requestId: null });
                setRejectionReason("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!rejectionReason.trim()}
            >
              Reject Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
