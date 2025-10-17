import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle, XCircle, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getSafeErrorMessage } from "@/lib/errorHandling";
import Footer from "@/components/Footer";
import PageMeta from "@/components/PageMeta";
import logo from "@/assets/enabledc-logo.png";

interface SignupRequest {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  status: string;
  requested_at: string;
  reviewed_at: string | null;
  rejection_reason: string | null;
}

export default function PendingApproval() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [request, setRequest] = useState<SignupRequest | null>(null);

  useEffect(() => {
    checkAuthAndLoadRequest();
  }, []);

  const checkAuthAndLoadRequest = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      // Check user role
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id);

      const role = roles?.[0]?.role;

      // If user is already an OT admin, redirect to dashboard
      if (role === "ot_admin") {
        navigate("/dashboard");
        return;
      }

      // If user is system admin, redirect to admin dashboard
      if (role === "system_admin") {
        navigate("/admin");
        return;
      }

      // Load signup request
      const { data: requestData, error: requestError } = await supabase
        .from("ot_signup_requests")
        .select("*")
        .eq("user_id", session.user.id)
        .single();

      if (requestError) throw requestError;
      setRequest(requestData);

      // If request is approved, navigate to dashboard
      if (requestData?.status === "approved") {
        navigate("/dashboard");
      }
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

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/");
    } catch (error: any) {
      toast({
        title: "Error",
        description: getSafeErrorMessage(error),
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const getStatusIcon = () => {
    switch (request?.status) {
      case "pending":
        return <Clock className="h-12 w-12 text-yellow-500" />;
      case "approved":
        return <CheckCircle className="h-12 w-12 text-green-500" />;
      case "rejected":
        return <XCircle className="h-12 w-12 text-destructive" />;
      default:
        return null;
    }
  };

  const getStatusBadge = () => {
    switch (request?.status) {
      case "pending":
        return <Badge variant="outline" className="flex items-center gap-1"><Clock className="h-3 w-3" />Pending Review</Badge>;
      case "approved":
        return <Badge className="flex items-center gap-1 bg-green-500"><CheckCircle className="h-3 w-3" />Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive" className="flex items-center gap-1"><XCircle className="h-3 w-3" />Rejected</Badge>;
      default:
        return null;
    }
  };

  return (
    <>
      <PageMeta 
        title="Account Pending Approval - OT Assessment Portal"
        description="Your OT account is pending administrator approval"
      />
      
      <div className="min-h-screen flex flex-col bg-background">
        <header className="border-b bg-card">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={logo} alt="EnabledCare Logo" className="h-10" />
              <h1 className="text-2xl font-bold">OT Assessment Portal</h1>
            </div>
            <Button variant="ghost" onClick={handleSignOut} className="flex items-center gap-2">
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </header>

        <main className="flex-1 container mx-auto px-4 py-8 flex items-center justify-center">
          <Card className="max-w-2xl w-full hover:bg-primary/10 transition-colors">
            <CardHeader className="text-center space-y-4">
              <div className="flex justify-center">
                {getStatusIcon()}
              </div>
              <div>
                <CardTitle className="text-2xl mb-2">Account Status</CardTitle>
                <div className="flex justify-center">
                  {getStatusBadge()}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {request?.status === "pending" && (
                <div className="space-y-4">
                  <CardDescription className="text-center text-base">
                    Thank you for signing up! Your account is currently pending approval from a system administrator.
                  </CardDescription>
                  <div className="bg-muted p-4 rounded-lg space-y-2">
                    <p className="text-sm">
                      <strong>Email:</strong> {request.email}
                    </p>
                    <p className="text-sm">
                      <strong>Name:</strong> {request.first_name} {request.last_name}
                    </p>
                    <p className="text-sm">
                      <strong>Requested:</strong> {new Date(request.requested_at).toLocaleString()}
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground text-center">
                    You will receive access to the portal once your account has been approved. This typically takes 1-2 business days.
                  </p>
                  <p className="text-sm text-muted-foreground text-center">
                    Please check back later or contact your system administrator for more information.
                  </p>
                </div>
              )}

              {request?.status === "rejected" && (
                <div className="space-y-4">
                  <CardDescription className="text-center text-base text-destructive">
                    Your account signup request has been rejected.
                  </CardDescription>
                  {request.rejection_reason && (
                    <div className="bg-destructive/10 border border-destructive p-4 rounded-lg">
                      <p className="text-sm font-semibold mb-2">Reason:</p>
                      <p className="text-sm">{request.rejection_reason}</p>
                    </div>
                  )}
                  <p className="text-sm text-muted-foreground text-center">
                    If you believe this was an error, please contact your system administrator.
                  </p>
                  {request.reviewed_at && (
                    <p className="text-xs text-muted-foreground text-center">
                      Reviewed: {new Date(request.reviewed_at).toLocaleString()}
                    </p>
                  )}
                </div>
              )}

              <div className="flex justify-center pt-4">
                <Button variant="outline" onClick={handleSignOut} className="flex items-center gap-2">
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>

        <Footer />
      </div>
    </>
  );
}
