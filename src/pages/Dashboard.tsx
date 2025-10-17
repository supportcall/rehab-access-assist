import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Plus, FileText, User as UserIcon, LogOut, Settings } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import Footer from "@/components/Footer";
import PageMeta from "@/components/PageMeta";
import logo from "@/assets/enabledc-logo.png";
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

export default function Dashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [systemId, setSystemId] = useState<string>("");
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [profileData, setProfileData] = useState({
    aphra_registration_number: "",
    mobile_number: "",
    phone: "",
  });
  const [stats, setStats] = useState({
    totalClients: 0,
    totalAssessments: 0,
    draftAssessments: 0,
    pendingReferrals: 0,
  });

  useEffect(() => {
    const checkAuth = async () => {
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

      // Redirect based on role
      if (role === "pending_ot") {
        navigate("/pending");
        return;
      }

      if (role === "system_admin") {
        navigate("/admin");
        return;
      }

      setUser(session.user);
      await loadStats();
      setLoading(false);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        navigate("/auth");
      }
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const loadStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const [profileRes, clientsRes, assessmentsRes, draftRes, referralsRes] = await Promise.all([
        supabase.from("profiles").select("system_id, aphra_registration_number, mobile_number, phone").eq("id", user?.id).maybeSingle(),
        supabase.from("clients").select("id", { count: "exact", head: true }),
        supabase.from("assessments").select("id", { count: "exact", head: true }),
        supabase.from("assessments").select("id", { count: "exact", head: true }).eq("status", "draft"),
        supabase.from("referrals").select("id", { count: "exact", head: true }).eq("target_ot_id", user?.id).eq("status", "pending"),
      ]);

      if (profileRes.data?.system_id) {
        setSystemId(profileRes.data.system_id);
        setProfileData({
          aphra_registration_number: profileRes.data.aphra_registration_number || "",
          mobile_number: profileRes.data.mobile_number || "",
          phone: profileRes.data.phone || "",
        });
      }

      setStats({
        totalClients: clientsRes.count || 0,
        totalAssessments: assessmentsRes.count || 0,
        draftAssessments: draftRes.count || 0,
        pendingReferrals: referralsRes.count || 0,
      });
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("profiles")
        .update({
          aphra_registration_number: profileData.aphra_registration_number?.trim() || null,
          mobile_number: profileData.mobile_number?.trim() || null,
          phone: profileData.phone?.trim() || null,
        })
        .eq("id", user?.id);

      if (error) throw error;

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
      });
      
      setIsProfileDialogOpen(false);
      await loadStats();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logged out",
      description: "You have been logged out successfully",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PageMeta 
        title="Dashboard"
        description="Manage your occupational therapy assessments, clients, and referrals."
        canonical={window.location.origin + "/dashboard"}
      />
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="EnabledCare - OT Assessment Portal" className="h-12" />
            <div>
              <h1 className="text-2xl font-bold">OT Assessment Portal</h1>
              <p className="text-sm text-muted-foreground">
                Welcome, {user?.user_metadata?.first_name || user?.email}
              </p>
            {systemId && (
              <p className="text-sm font-mono text-primary mt-1">
                System ID: {systemId}
              </p>
            )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" aria-label="Edit profile settings">
                  <Settings className="mr-2 h-4 w-4" aria-hidden="true" />
                  Profile
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Profile Settings</DialogTitle>
                  <DialogDescription>
                    Update your professional information
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleProfileUpdate} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="system_id_display">System ID</Label>
                    <Input
                      id="system_id_display"
                      value={systemId}
                      disabled
                      className="font-mono"
                    />
                    <p className="text-xs text-muted-foreground">Your unique identifier (cannot be changed)</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="aphra_registration_number">APHRA Registration Number</Label>
                    <Input
                      id="aphra_registration_number"
                      placeholder="e.g., OCC0001234567"
                      value={profileData.aphra_registration_number}
                      onChange={(e) => setProfileData({ ...profileData, aphra_registration_number: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">Visible to clients and patients</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="mobile_number">Mobile Number</Label>
                    <Input
                      id="mobile_number"
                      type="tel"
                      placeholder="e.g., 0412 345 678"
                      value={profileData.mobile_number}
                      onChange={(e) => setProfileData({ ...profileData, mobile_number: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Office Phone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="e.g., (02) 1234 5678"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                    />
                  </div>

                  <Button type="submit" className="w-full">Save Changes</Button>
                </form>
              </DialogContent>
            </Dialog>
            
            <Button variant="ghost" onClick={handleLogout} aria-label="Logout from portal">
              <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main id="main-content" className="container mx-auto px-4 py-8">
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card 
            className="cursor-pointer hover:shadow-lg hover:bg-primary/10 transition-all"
            onClick={() => navigate("/clients")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && navigate("/clients")}
            aria-label="View total clients"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
              <UserIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalClients}</div>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-lg hover:bg-primary/10 transition-all"
            onClick={() => navigate("/assessments")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && navigate("/assessments")}
            aria-label="View all assessments"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Assessments</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalAssessments}</div>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-lg hover:bg-primary/10 transition-all"
            onClick={() => navigate("/assessments")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && navigate("/assessments")}
            aria-label="View draft assessments"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Draft Assessments</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.draftAssessments}</div>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-lg hover:bg-primary/10 transition-all"
            onClick={() => navigate("/referrals")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && navigate("/referrals")}
            aria-label="View pending referrals"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Referrals</CardTitle>
              <UserIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingReferrals}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="md:col-span-2 lg:col-span-4 hover:bg-primary/10 transition-colors">
            <CardHeader>
              <CardTitle>Your System ID</CardTitle>
              <CardDescription>Share this ID with patients to receive referrals</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <code className="flex-1 px-4 py-2 bg-muted rounded-md text-lg font-mono">
                  {systemId || "Loading..."}
                </code>
                <Button
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(systemId);
                    toast({
                      title: "Copied!",
                      description: "System ID copied to clipboard",
                    });
                  }}
                  disabled={!systemId}
                >
                  Copy ID
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="hover:bg-primary/10 transition-colors">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Start a new assessment or manage clients</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                className="w-full justify-start" 
                onClick={() => navigate("/assessment/new")}
              >
                <Plus className="mr-2 h-4 w-4" />
                New Assessment
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => navigate("/clients")}
              >
                <UserIcon className="mr-2 h-4 w-4" />
                Manage Clients
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => navigate("/assessments")}
              >
                <FileText className="mr-2 h-4 w-4" />
                View Assessments
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => navigate("/referrals")}
              >
                <UserIcon className="mr-2 h-4 w-4" />
                Manage Referrals {stats.pendingReferrals > 0 && `(${stats.pendingReferrals})`}
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:bg-primary/10 transition-colors">
            <CardHeader>
              <CardTitle>System Information</CardTitle>
              <CardDescription>About this assessment tool</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm space-y-2">
                <p className="font-medium">Features:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Multi-stage environmental assessments</li>
                  <li>Photo documentation with measurements</li>
                  <li>Client/Carer input collection</li>
                  <li>PDF report generation</li>
                  <li>Mobile-responsive design</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}