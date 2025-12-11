import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Footer from "@/components/Footer";
import PageMeta from "@/components/PageMeta";

export default function PrivacyPolicy() {
  return (
    <>
      <PageMeta
        title="Privacy Policy | RehabSource"
        description="RehabSource Privacy Policy - Learn how we collect, use, and protect your personal information"
      />
      <div className="min-h-screen flex flex-col">
        <main id="main-content" className="flex-grow">
          <div className="container mx-auto px-4 py-8 max-w-4xl">
            <Link to="/">
              <Button variant="ghost" className="mb-6">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </Link>

            <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
            
            <div className="prose prose-slate dark:prose-invert max-w-none space-y-6">
              <section>
                <p className="text-muted-foreground mb-4">
                  <strong>Last Updated:</strong> {new Date().toLocaleDateString('en-AU', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
                <p>
                  RehabSource ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our occupational therapy and physiotherapy assessment platform.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mt-8 mb-4">1. Information We Collect</h2>
                
                <h3 className="text-xl font-semibold mt-6 mb-3">1.1 Personal Information</h3>
                <p>We collect information that you provide directly to us, including:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Name, email address, and contact details</li>
                  <li>Professional credentials and qualifications</li>
                  <li>Client assessment data (with appropriate consent)</li>
                  <li>Photographs and visual documentation of assessment sites</li>
                  <li>Health and medical information related to assessments</li>
                </ul>

                <h3 className="text-xl font-semibold mt-6 mb-3">1.2 Automatically Collected Information</h3>
                <p>When you access our platform, we automatically collect:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Device information and browser type</li>
                  <li>IP address and location data</li>
                  <li>Usage data and activity logs</li>
                  <li>Cookies and similar tracking technologies</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mt-8 mb-4">2. How We Use Your Information</h2>
                <p>We use the collected information for:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Providing and maintaining our assessment services</li>
                  <li>Processing and storing client assessments</li>
                  <li>Generating reports and documentation</li>
                  <li>Communicating with you about services and updates</li>
                  <li>Improving our platform and user experience</li>
                  <li>Complying with legal obligations and professional standards</li>
                  <li>Protecting against fraud and unauthorized access</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mt-8 mb-4">3. Information Sharing and Disclosure</h2>
                <p>We do not sell your personal information. We may share information:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>With your explicit consent</li>
                  <li>With healthcare providers as necessary for client care</li>
                  <li>With service providers who assist our operations</li>
                  <li>To comply with legal requirements or court orders</li>
                  <li>To protect rights, property, or safety</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mt-8 mb-4">4. Data Security</h2>
                <p>
                  We implement appropriate technical and organizational security measures to protect your information, including:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Encryption of data in transit and at rest</li>
                  <li>Secure authentication and access controls</li>
                  <li>Regular security assessments and updates</li>
                  <li>Staff training on data protection</li>
                  <li>Compliance with healthcare data standards</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mt-8 mb-4">5. Data Retention</h2>
                <p>
                  We retain your information for as long as necessary to fulfill the purposes outlined in this Privacy Policy, comply with legal obligations, resolve disputes, and enforce our agreements. Assessment data is retained in accordance with professional standards and regulatory requirements.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mt-8 mb-4">6. Your Rights</h2>
                <p>You have the right to:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Access your personal information</li>
                  <li>Correct inaccurate or incomplete data</li>
                  <li>Request deletion of your information (subject to legal requirements)</li>
                  <li>Object to or restrict certain processing activities</li>
                  <li>Data portability</li>
                  <li>Withdraw consent where processing is based on consent</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mt-8 mb-4">7. Children's Privacy</h2>
                <p>
                  Our services are not directed to individuals under 18. We do not knowingly collect personal information from children. If we become aware of such collection, we will take steps to delete the information.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mt-8 mb-4">8. International Data Transfers</h2>
                <p>
                  Your information may be transferred to and processed in countries other than your country of residence. We ensure appropriate safeguards are in place to protect your information in accordance with this Privacy Policy.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mt-8 mb-4">9. Changes to This Privacy Policy</h2>
                <p>
                  We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mt-8 mb-4">10. Contact Us</h2>
                <p>
                  If you have questions about this Privacy Policy or our privacy practices, please contact us at:
                </p>
                <div className="bg-muted p-4 rounded-lg mt-4">
                  <p><strong>SupportCALL</strong></p>
                  <p>Email: <a href="mailto:privacy@supportcall.co.za" className="text-primary hover:underline">privacy@supportcall.co.za</a></p>
                  <p>Website: <a href="https://www.supportcall.co.za" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">www.supportcall.co.za</a></p>
                </div>
              </section>

              <section className="mt-8 p-6 bg-muted/50 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">Australian Privacy Principles</h3>
                <p className="text-sm">
                  This Privacy Policy is designed to comply with the Australian Privacy Principles (APPs) contained in the Privacy Act 1988 (Cth) and relevant healthcare privacy regulations. We are committed to protecting the privacy of health information in accordance with applicable laws.
                </p>
              </section>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}
