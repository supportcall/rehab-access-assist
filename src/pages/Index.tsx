import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ClipboardCheck, 
  Users, 
  FileText, 
  ArrowRight, 
  Camera, 
  Ruler, 
  Home, 
  Shield, 
  CheckCircle2,
  Building2,
  Heart,
  Target,
  FileCheck,
  DollarSign,
  Layers,
  Eye
} from "lucide-react";
import Footer from "@/components/Footer";
import PageMeta from "@/components/PageMeta";
import logo from "@/assets/enabledc-logo.png";

const Index = () => {
  const navigate = useNavigate();

  const processSteps = [
    {
      step: "1",
      title: "Pre-Visit Preparation",
      description: "Clients provide essential information about their home, goals, and current challenges before the OT visit.",
      icon: ClipboardCheck,
    },
    {
      step: "2",
      title: "On-Site Assessment",
      description: "Guided measurement capture, photo documentation with perspective guides, and comprehensive environmental survey.",
      icon: Ruler,
    },
    {
      step: "3",
      title: "Clinical Analysis",
      description: "Complete clinical assessment including mobility, ADLs, anthropometrics, and validated outcome measures.",
      icon: Heart,
    },
    {
      step: "4",
      title: "Compliance Check",
      description: "Automatic verification against NCC, LHDS, and Australian Standards for NDIS-ready documentation.",
      icon: Shield,
    },
    {
      step: "5",
      title: "Report Generation",
      description: "Professional reports with technical drawings, recommendations, and budget options with version control.",
      icon: FileText,
    },
  ];

  const features = [
    {
      title: "For Clients & Carers",
      description: "Simple, guided questionnaires to share your needs, goals, and home details before the assessment visit.",
      icon: Users,
      items: [
        "Easy-to-understand questions",
        "Photo upload guidance",
        "Goal setting assistance",
        "Progress tracking"
      ]
    },
    {
      title: "For OTs & Physios",
      description: "Comprehensive assessment tools ensuring nothing is missed during home modification evaluations.",
      icon: ClipboardCheck,
      items: [
        "NDIS-compliant checklists",
        "Measurement prompts",
        "Photo perspective guides",
        "Compliance verification"
      ]
    },
    {
      title: "Professional Reports",
      description: "Generate detailed, funder-ready reports with technical specifications and budget management.",
      icon: FileCheck,
      items: [
        "Version-controlled reports",
        "Technical drawings",
        "Budget adjustment tools",
        "Builder-ready specifications"
      ]
    }
  ];

  const complianceStandards = [
    "National Construction Code (NCC)",
    "Livable Housing Design Standards (LHDS)",
    "AS 1428.1 Wheelchair Access",
    "AS 3740 Waterproofing",
    "AS/NZS 3500.4 Hot Water Safety",
    "AS 3786 Smoke Alarms"
  ];

  return (
    <div className="min-h-screen bg-background">
      <script type="application/ld+json" dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebApplication",
          "name": "OT Home Modifications Assessment Portal",
          "description": "Professional occupational therapy and physiotherapy environmental assessments for home modifications. NDIS-compliant documentation with comprehensive reporting for Australian building standards.",
          "url": window.location.origin,
          "applicationCategory": "HealthApplication",
          "operatingSystem": "Web",
          "offers": {
            "@type": "Offer",
            "category": "Healthcare Services"
          },
          "featureList": [
            "NDIS-compliant assessments",
            "Multi-stage environmental surveys",
            "Photo documentation with measurement guides",
            "Client and carer pre-visit questionnaires",
            "Automated compliance checking",
            "Version-controlled PDF reports",
            "Budget adjustment tools",
            "Builder-ready technical specifications"
          ]
        })
      }} />
      <PageMeta
        title="Home Modifications Assessment Portal | OT & Physio Environmental Assessments"
        description="Professional home modifications assessment portal for OTs and Physios. NDIS-compliant environmental assessments with comprehensive documentation, compliance checking, and funder-ready reports."
        canonical={window.location.origin + "/"}
      />
      
      {/* Header */}
      <header className="border-b bg-card shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="EnabledCare - Home Modifications Assessment Portal" className="h-10" />
          </div>
          <Button onClick={() => navigate("/auth")} aria-label="Login or sign up to access portal">
            Login / Sign Up
            <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </header>

      <main id="main-content">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary/10 via-background to-accent/10 py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center space-y-6">
              <div className="inline-flex items-center gap-2 bg-primary/20 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
                <Shield className="h-4 w-4" />
                NDIS-Compliant Assessment Platform
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
                Home Modifications
                <span className="block text-primary">Assessment Portal</span>
              </h1>
              
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                The complete assessment platform for <strong>Occupational Therapists</strong> and <strong>Physiotherapists</strong> to 
                conduct thorough home environment evaluations, ensuring clients receive the support and funding they need.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Button size="lg" onClick={() => navigate("/auth")} className="text-lg px-8">
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button size="lg" variant="outline" onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })} className="text-lg px-8">
                  Learn More
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Value Proposition */}
        <section className="py-16 bg-card">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div className="space-y-6">
                  <h2 className="text-3xl font-bold">Helping You Secure the Support Your Clients Need</h2>
                  <p className="text-lg text-muted-foreground">
                    Our comprehensive assessment portal guides both clients and healthcare professionals through 
                    every step of the home modifications process—from initial information gathering to 
                    funder-ready reports that meet all Australian compliance standards.
                  </p>
                  <ul className="space-y-3">
                    {[
                      "Clients understand exactly what information is needed",
                      "OTs never miss critical assessment items",
                      "Reports meet NDIS and funder requirements",
                      "Technical specifications ready for builders"
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Card className="bg-primary/5 border-primary/20">
                    <CardContent className="pt-6 text-center">
                      <Home className="h-10 w-10 text-primary mx-auto mb-3" />
                      <p className="font-semibold">Complete Environmental Survey</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-primary/5 border-primary/20">
                    <CardContent className="pt-6 text-center">
                      <Camera className="h-10 w-10 text-primary mx-auto mb-3" />
                      <p className="font-semibold">Photo Documentation Guides</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-primary/5 border-primary/20">
                    <CardContent className="pt-6 text-center">
                      <FileCheck className="h-10 w-10 text-primary mx-auto mb-3" />
                      <p className="font-semibold">Compliance Verification</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-primary/5 border-primary/20">
                    <CardContent className="pt-6 text-center">
                      <DollarSign className="h-10 w-10 text-primary mx-auto mb-3" />
                      <p className="font-semibold">Budget Management</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold mb-4">How It Works</h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  A structured, step-by-step process ensuring comprehensive assessments and professional documentation.
                </p>
              </div>

              <div className="space-y-6">
                {processSteps.map((step, index) => (
                  <div key={step.step} className="flex gap-6 items-start">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">
                      {step.step}
                    </div>
                    <Card className="flex-1 hover:shadow-md transition-shadow">
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-3">
                          <step.icon className="h-6 w-6 text-primary" />
                          <CardTitle className="text-xl">{step.title}</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground">{step.description}</p>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Features for Different Users */}
        <section className="py-16 bg-muted/50">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold mb-4">Designed for Everyone Involved</h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Clear, logical workflows tailored for clients, carers, and healthcare professionals.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                {features.map((feature) => (
                  <Card key={feature.title} className="h-full">
                    <CardHeader>
                      <feature.icon className="h-10 w-10 text-primary mb-2" />
                      <CardTitle>{feature.title}</CardTitle>
                      <CardDescription>{feature.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {feature.items.map((item, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm">
                            <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Assessment Coverage */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold mb-4">Comprehensive Assessment Coverage</h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Every aspect of home modification assessment covered in one platform.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { icon: Home, title: "Site Access & Entry", desc: "Parking, pathways, ramps, thresholds" },
                  { icon: Building2, title: "Internal Circulation", desc: "Doors, corridors, turning spaces" },
                  { icon: Eye, title: "Room-by-Room Survey", desc: "Kitchen, bathroom, bedroom, laundry" },
                  { icon: Ruler, title: "Measurements", desc: "Widths, heights, gradients, clearances" },
                  { icon: Heart, title: "Clinical Assessment", desc: "Mobility, ADLs, anthropometrics" },
                  { icon: Target, title: "AT Integration", desc: "Wheelchair, hoist, equipment needs" },
                  { icon: Shield, title: "Safety & Risks", desc: "Falls, hazards, emergency egress" },
                  { icon: Layers, title: "Structural Analysis", desc: "Load paths, fixings, engineering" },
                ].map((item, i) => (
                  <Card key={i} className="text-center hover:bg-primary/5 transition-colors">
                    <CardContent className="pt-6">
                      <item.icon className="h-8 w-8 text-primary mx-auto mb-3" />
                      <h3 className="font-semibold mb-1">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Compliance Standards */}
        <section className="py-16 bg-card">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold mb-4">Built-In Compliance Checking</h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Reports automatically reference current Australian building standards and NDIS requirements.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                {complianceStandards.map((standard, i) => (
                  <div key={i} className="flex items-center gap-3 bg-muted/50 rounded-lg p-4">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                    <span className="text-sm font-medium">{standard}</span>
                  </div>
                ))}
              </div>

              <div className="mt-8 p-6 bg-primary/10 rounded-lg border border-primary/20">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <FileCheck className="h-5 w-5 text-primary" />
                  Report Versioning & Budget Management
                </h3>
                <p className="text-muted-foreground">
                  Generate comprehensive reports based on current standards at the date of assessment. 
                  Create initial recommendations, then adjust for budget constraints while retaining 
                  all previous versions for complete documentation trail.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Photo Documentation */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold mb-4">Guided Photo Documentation</h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Clear visual guides help capture the right photos with correct perspectives for accurate measurements and technical drawings.
                </p>
              </div>

              <Card className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="font-semibold flex items-center gap-2">
                        <Camera className="h-5 w-5 text-primary" />
                        Photo Capture Prompts
                      </h3>
                      <ul className="space-y-2 text-sm">
                        {[
                          "Line drawing examples showing required angles",
                          "Perspective guides for accurate measurements",
                          "Reference markers for scale verification",
                          "Specific views needed for each area",
                          "Tips for capturing challenging spaces"
                        ].map((item, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="space-y-4">
                      <h3 className="font-semibold flex items-center gap-2">
                        <Ruler className="h-5 w-5 text-primary" />
                        Technical Output
                      </h3>
                      <ul className="space-y-2 text-sm">
                        {[
                          "To-scale technical drawings",
                          "Annotated photo documentation",
                          "Measurement verification",
                          "Builder-ready specifications",
                          "Compliance dimension overlays"
                        ].map((item, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center space-y-6">
              <h2 className="text-3xl font-bold">Ready to Transform Your Assessments?</h2>
              <p className="text-lg opacity-90">
                Join healthcare professionals across Australia using our platform for comprehensive, 
                compliant home modification assessments.
              </p>
              <Button 
                size="lg" 
                variant="secondary" 
                onClick={() => navigate("/auth")}
                className="text-lg px-8"
              >
                Get Started Today
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Index;
