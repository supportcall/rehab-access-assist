import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardCheck, Users, FileText, ArrowRight } from "lucide-react";
import Footer from "@/components/Footer";
import PageMeta from "@/components/PageMeta";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <PageMeta 
        title="Professional Environmental Assessments"
        description="Complete occupational therapy environmental assessments with professional documentation, measurements, and comprehensive reporting for NDIS and aged care."
        canonical={window.location.origin + "/"}
      />
      <header className="border-b bg-card shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">OT Assessment Portal</h1>
          </div>
          <Button onClick={() => navigate("/auth")}>
            Login / Sign Up
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
              Occupational Therapy
              <span className="block text-primary">Environmental Assessment</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Complete environmental mobility and access assessments with comprehensive documentation,
              measurements, and professional reporting.
            </p>
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-6 max-w-3xl mx-auto mt-6">
              <p className="text-lg font-semibold text-primary mb-2">
                Helping You Secure the Support You Need
              </p>
              <p className="text-muted-foreground">
                Our comprehensive assessment portal helps gather all the critical information needed 
                for clients, patients, and occupational therapists to secure the funding required 
                to provide essential aids and support. From detailed measurements to professional 
                documentation, we ensure your funding applications have everything they need to succeed.
              </p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <Users className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Multi-User Access</CardTitle>
                <CardDescription>
                  Secure OT login and client/carer public access via unique tokens
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <ClipboardCheck className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Dynamic Assessments</CardTitle>
                <CardDescription>
                  Multi-stage forms with photo uploads, measurements, and environmental data
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <FileText className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Professional Reports</CardTitle>
                <CardDescription>
                  Generate and email comprehensive PDF reports with all assessment data
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          <Card className="border-primary/50">
            <CardHeader>
              <CardTitle>Key Features</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="grid gap-3 md:grid-cols-2">
                <li className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  <span>Client demographics and funding information</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  <span>Functional needs assessment (COPM-lite)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  <span>Repeatable environmental area sections</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  <span>Photo documentation with measurements</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  <span>Mobile-responsive for on-site data entry</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  <span>Secure cloud storage and backup</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <div className="text-center">
            <Button size="lg" onClick={() => navigate("/auth")}>
              Get Started
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Index;
