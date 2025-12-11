import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Footer from "@/components/Footer";
import PageMeta from "@/components/PageMeta";

export default function TermsOfUse() {
  return (
    <>
      <PageMeta
        title="Terms of Use | RehabSource"
        description="RehabSource Terms of Use - Review the terms and conditions for using our occupational therapy and physiotherapy assessment platform"
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

            <h1 className="text-4xl font-bold mb-8">Terms of Use</h1>
            
            <div className="prose prose-slate dark:prose-invert max-w-none space-y-6">
              <section>
                <p className="text-muted-foreground mb-4">
                  <strong>Last Updated:</strong> {new Date().toLocaleDateString('en-AU', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
                <p>
                  Welcome to RehabSource. These Terms of Use ("Terms") govern your access to and use of our occupational therapy and physiotherapy assessment platform. By accessing or using RehabSource, you agree to be bound by these Terms.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mt-8 mb-4">1. Acceptance of Terms</h2>
                <p>
                  By creating an account or using our services, you acknowledge that you have read, understood, and agree to be bound by these Terms and our Privacy Policy. If you do not agree to these Terms, you may not use our services.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mt-8 mb-4">2. Eligibility and Account Registration</h2>
                
                <h3 className="text-xl font-semibold mt-6 mb-3">2.1 Professional Requirements</h3>
                <p>Our platform is intended for use by:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Qualified occupational therapists and physiotherapists with current registration</li>
                  <li>Healthcare professionals with appropriate credentials</li>
                  <li>Authorized staff members of approved organizations</li>
                </ul>

                <h3 className="text-xl font-semibold mt-6 mb-3">2.2 Account Security</h3>
                <p>You are responsible for:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Maintaining the confidentiality of your account credentials</li>
                  <li>All activities that occur under your account</li>
                  <li>Notifying us immediately of any unauthorized access</li>
                  <li>Ensuring your account information is accurate and up-to-date</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mt-8 mb-4">3. Use of Services</h2>
                
                <h3 className="text-xl font-semibold mt-6 mb-3">3.1 Permitted Use</h3>
                <p>You may use RehabSource to:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Conduct and document occupational therapy and physiotherapy assessments</li>
                  <li>Generate professional reports and recommendations</li>
                  <li>Store and manage client assessment data securely</li>
                  <li>Collaborate with other authorized healthcare professionals</li>
                </ul>

                <h3 className="text-xl font-semibold mt-6 mb-3">3.2 Prohibited Activities</h3>
                <p>You agree not to:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Use the platform for any unlawful purpose</li>
                  <li>Share your account credentials with unauthorized persons</li>
                  <li>Attempt to gain unauthorized access to any part of the system</li>
                  <li>Upload malicious code or interfere with platform functionality</li>
                  <li>Misrepresent your professional qualifications</li>
                  <li>Use client data for purposes other than providing care</li>
                  <li>Reproduce, modify, or distribute platform content without authorization</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mt-8 mb-4">4. Professional Responsibilities</h2>
                <p>As a healthcare professional using RehabSource, you agree to:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Comply with all applicable professional standards and regulations</li>
                  <li>Obtain appropriate consent from clients before conducting assessments</li>
                  <li>Use clinical judgment and professional expertise in all assessments</li>
                  <li>Maintain client confidentiality and privacy</li>
                  <li>Ensure accuracy and completeness of all documentation</li>
                  <li>Use the platform as a tool to support, not replace, professional judgment</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mt-8 mb-4">5. Data and Content</h2>
                
                <h3 className="text-xl font-semibold mt-6 mb-3">5.1 Your Content</h3>
                <p>
                  You retain ownership of all data and content you submit to RehabSource. By submitting content, you grant us a license to use, store, and process it solely for the purpose of providing our services to you.
                </p>

                <h3 className="text-xl font-semibold mt-6 mb-3">5.2 Platform Content</h3>
                <p>
                  All content, features, and functionality of RehabSource, including but not limited to text, graphics, logos, and software, are owned by SupportCALL or its licensors and are protected by intellectual property laws.
                </p>

                <h3 className="text-xl font-semibold mt-6 mb-3">5.3 Data Backup</h3>
                <p>
                  While we implement robust backup procedures, you are responsible for maintaining your own backup copies of critical data and assessment information.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mt-8 mb-4">6. Fees and Payment</h2>
                <p>
                  Access to RehabSource may require payment of subscription fees or usage charges. All fees are non-refundable unless otherwise specified. We reserve the right to modify our pricing structure with reasonable notice.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mt-8 mb-4">7. Disclaimer of Warranties</h2>
                <p>
                  RehabSource is provided "as is" and "as available" without warranties of any kind, either express or implied. We do not warrant that:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>The platform will be uninterrupted or error-free</li>
                  <li>All defects will be corrected</li>
                  <li>The platform is free from viruses or harmful components</li>
                  <li>Results from using the platform will be accurate or reliable</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mt-8 mb-4">8. Limitation of Liability</h2>
                <p>
                  To the maximum extent permitted by law, SupportCALL shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from or related to your use of RehabSource, including but not limited to:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Loss of profits or data</li>
                  <li>Professional liability or malpractice claims</li>
                  <li>Service interruptions or data loss</li>
                  <li>Reliance on platform-generated content</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mt-8 mb-4">9. Indemnification</h2>
                <p>
                  You agree to indemnify and hold harmless SupportCALL, its affiliates, and their respective officers, directors, employees, and agents from any claims, damages, losses, or expenses arising from:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Your use of RehabSource</li>
                  <li>Your violation of these Terms</li>
                  <li>Your violation of any rights of another person or entity</li>
                  <li>Your professional conduct or clinical decisions</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mt-8 mb-4">10. Term and Termination</h2>
                <p>
                  These Terms remain in effect while you use RehabSource. We may suspend or terminate your access at any time for violation of these Terms or for any other reason. Upon termination:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Your right to use the platform immediately ceases</li>
                  <li>You must cease all use of our services</li>
                  <li>We may delete your account and data (subject to legal retention requirements)</li>
                  <li>Provisions that by their nature should survive will remain in effect</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mt-8 mb-4">11. Changes to Terms</h2>
                <p>
                  We reserve the right to modify these Terms at any time. We will notify you of material changes by posting the updated Terms on this page and updating the "Last Updated" date. Your continued use of RehabSource after changes constitutes acceptance of the modified Terms.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mt-8 mb-4">12. Governing Law</h2>
                <p>
                  These Terms are governed by the laws of Australia. Any disputes arising from these Terms or your use of RehabSource shall be subject to the exclusive jurisdiction of the courts of Australia.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mt-8 mb-4">13. Contact Information</h2>
                <p>
                  If you have questions about these Terms, please contact us at:
                </p>
                <div className="bg-muted p-4 rounded-lg mt-4">
                  <p><strong>SupportCALL</strong></p>
                  <p>Email: <a href="mailto:support@supportcall.co.za" className="text-primary hover:underline">support@supportcall.co.za</a></p>
                  <p>Website: <a href="https://www.supportcall.co.za" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">www.supportcall.co.za</a></p>
                </div>
              </section>

              <section className="mt-8 p-6 bg-muted/50 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">Professional Standards Compliance</h3>
                <p className="text-sm">
                  RehabSource is designed to support compliance with occupational therapy and physiotherapy professional standards, including those set by Occupational Therapy Australia, the Australian Physiotherapy Association, and relevant regulatory bodies. However, users remain solely responsible for ensuring their practice meets all applicable professional and legal requirements.
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
