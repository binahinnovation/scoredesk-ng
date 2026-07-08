import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Button asChild variant="ghost" className="flex items-center space-x-2">
              <Link to="/">
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Home</span>
              </Link>
            </Button>
            <div className="flex items-center space-x-3">
              <div className="bg-emerald-700 text-white p-2 rounded-lg">
                <span className="text-lg font-bold">🔒</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Privacy Policy</h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <Card className="shadow-sm">
            <CardHeader>
              <div className="flex items-center space-x-2 mb-4">
                <Badge variant="outline">Last Updated: January 16, 2025</Badge>
                <Badge className="bg-green-100 text-green-800">Effective</Badge>
              </div>
              <CardTitle className="text-3xl font-bold text-gray-900">
                Privacy Policy for ScoreDesk
              </CardTitle>
              <p className="text-gray-600 mt-2">
                This Privacy Policy describes how ScoreDesk collects, uses, and protects your information when you use our school management system.
              </p>
            </CardHeader>
            <CardContent className="prose prose-lg max-w-none">
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Information We Collect</h2>
                
                <h3 className="text-xl font-semibold text-gray-800 mb-3">Personal Information</h3>
                <p className="text-gray-700 mb-4">
                  We collect information you provide directly to us, such as:
                </p>
                <ul className="text-gray-700 space-y-2 mb-6">
                  <li>• School name, address, and contact information</li>
                  <li>• Administrator and staff names and email addresses</li>
                  <li>• Student names, admission numbers, and academic records</li>
                  <li>• Teacher assignments and subject information</li>
                  <li>• Academic results and attendance records</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-800 mb-3">Usage Information</h3>
                <p className="text-gray-700 mb-4">
                  We automatically collect certain information about your use of ScoreDesk:
                </p>
                <ul className="text-gray-700 space-y-2 mb-6">
                  <li>• Log data (IP address, browser type, access times)</li>
                  <li>• Device information (operating system, device identifiers)</li>
                  <li>• Usage patterns and feature interactions</li>
                  <li>• Error reports and performance data</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">2. How We Use Your Information</h2>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                  <h3 className="text-lg font-semibold text-blue-900 mb-3">Primary Uses</h3>
                  <ul className="text-blue-800 space-y-2">
                    <li>• Provide and maintain the ScoreDesk service</li>
                    <li>• Process academic records and generate reports</li>
                    <li>• Manage user accounts and permissions</li>
                    <li>• Provide customer support and technical assistance</li>
                    <li>• Improve our services and develop new features</li>
                  </ul>
                </div>

                <h3 className="text-xl font-semibold text-gray-800 mb-3">Legal Basis for Processing</h3>
                <p className="text-gray-700 mb-4">
                  We process your personal information based on:
                </p>
                <ul className="text-gray-700 space-y-2">
                  <li>• <strong>Contract:</strong> To provide the services you've requested</li>
                  <li>• <strong>Legitimate Interest:</strong> To improve our services and ensure security</li>
                  <li>• <strong>Consent:</strong> Where you have given explicit consent</li>
                  <li>• <strong>Legal Obligation:</strong> To comply with applicable laws and regulations</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Data Security</h2>
                
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
                  <h3 className="text-lg font-semibold text-green-900 mb-3">Security Measures</h3>
                  <p className="text-green-800 mb-4">
                    We implement industry-standard security measures to protect your data:
                  </p>
                  <ul className="text-green-800 space-y-2">
                    <li>• <strong>Encryption:</strong> All data is encrypted in transit and at rest</li>
                    <li>• <strong>Access Controls:</strong> Role-based access with multi-factor authentication</li>
                    <li>• <strong>School Isolation:</strong> Complete data separation between schools</li>
                    <li>• <strong>Regular Audits:</strong> Security assessments and vulnerability testing</li>
                    <li>• <strong>Backup Systems:</strong> Regular data backups with disaster recovery</li>
                  </ul>
                </div>

                <h3 className="text-xl font-semibold text-gray-800 mb-3">Data Retention</h3>
                <p className="text-gray-700 mb-4">
                  We retain your information for as long as necessary to provide our services and comply with legal obligations:
                </p>
                <ul className="text-gray-700 space-y-2">
                  <li>• <strong>Active Accounts:</strong> Data retained while account is active</li>
                  <li>• <strong>Academic Records:</strong> Retained for minimum periods required by law</li>
                  <li>• <strong>Deleted Accounts:</strong> Data purged within 30 days of account deletion</li>
                  <li>• <strong>Backup Data:</strong> Securely deleted within 90 days</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Information Sharing</h2>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
                  <h3 className="text-lg font-semibold text-yellow-900 mb-3">We Do NOT Share Your Data</h3>
                  <p className="text-yellow-800 mb-4">
                    ScoreDesk is committed to protecting your privacy. We do not sell, rent, or share your personal information with third parties, except in the following limited circumstances:
                  </p>
                </div>

                <h3 className="text-xl font-semibold text-gray-800 mb-3">Limited Exceptions</h3>
                <ul className="text-gray-700 space-y-2">
                  <li>• <strong>Service Providers:</strong> Trusted third parties who help us operate our service (under strict confidentiality agreements)</li>
                  <li>• <strong>Legal Requirements:</strong> When required by law or to protect our rights and safety</li>
                  <li>• <strong>Consent:</strong> When you have given explicit consent to share specific information</li>
                  <li>• <strong>Business Transfers:</strong> In connection with a merger or acquisition (with notice)</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Your Rights</h2>
                
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-emerald-900 mb-3">Access & Control</h3>
                    <ul className="text-emerald-800 space-y-2 text-sm">
                      <li>• View and update your personal information</li>
                      <li>• Export your school's data</li>
                      <li>• Delete your account and data</li>
                      <li>• Restrict certain data processing</li>
                    </ul>
                  </div>
                  
                  <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-indigo-900 mb-3">Communication</h3>
                    <ul className="text-indigo-800 space-y-2 text-sm">
                      <li>• Opt out of marketing communications</li>
                      <li>• Update notification preferences</li>
                      <li>• Request data processing information</li>
                      <li>• File privacy complaints</li>
                    </ul>
                  </div>
                </div>

                <h3 className="text-xl font-semibold text-gray-800 mb-3">How to Exercise Your Rights</h3>
                <p className="text-gray-700 mb-4">
                  To exercise any of these rights, please contact us:
                </p>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="text-gray-700">
                    <strong>Email:</strong> <a href="mailto:privacy@scoredesk.ng" className="text-emerald-600 hover:underline">privacy@scoredesk.ng</a><br/>
                    <strong>Phone:</strong> <a href="tel:09063412927" className="text-emerald-600 hover:underline">09063412927</a><br/>
                    <strong>Response Time:</strong> We will respond within 30 days of receiving your request.
                  </p>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Children's Privacy</h2>
                
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
                  <h3 className="text-lg font-semibold text-red-900 mb-3">Special Protection for Students</h3>
                  <p className="text-red-800 mb-4">
                    ScoreDesk is designed for educational institutions and handles student data with special care:
                  </p>
                  <ul className="text-red-800 space-y-2">
                    <li>• Student data is only collected through authorized school administrators</li>
                    <li>• We never collect data directly from students under 18</li>
                    <li>• Schools must obtain proper consent before adding student information</li>
                    <li>• We provide additional security measures for student data</li>
                  </ul>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">7. International Data Transfers</h2>
                
                <p className="text-gray-700 mb-4">
                  Your data is primarily stored and processed in Nigeria. If we need to transfer data internationally, we ensure appropriate safeguards are in place, including:
                </p>
                <ul className="text-gray-700 space-y-2">
                  <li>• Adequacy decisions by relevant data protection authorities</li>
                  <li>• Standard contractual clauses approved by regulatory bodies</li>
                  <li>• Certification schemes and codes of conduct</li>
                  <li>• Binding corporate rules for intra-group transfers</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Changes to This Policy</h2>
                
                <p className="text-gray-700 mb-4">
                  We may update this Privacy Policy from time to time. We will notify you of any material changes by:
                </p>
                <ul className="text-gray-700 space-y-2">
                  <li>• Posting the updated policy on our website</li>
                  <li>• Sending email notifications to registered users</li>
                  <li>• Displaying prominent notices in the ScoreDesk application</li>
                  <li>• Providing 30 days advance notice for material changes</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Contact Information</h2>
                
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-emerald-900 mb-3">Data Protection Officer</h3>
                  <p className="text-emerald-800 mb-4">
                    If you have any questions about this Privacy Policy or our data practices, please contact us:
                  </p>
                  <div className="text-emerald-800 space-y-2">
                    <p><strong>ScoreDesk Privacy Team</strong></p>
                    <p>📧 Email: <a href="mailto:privacy@scoredesk.ng" className="hover:underline">privacy@scoredesk.ng</a></p>
                    <p>📞 Phone: <a href="tel:09063412927" className="hover:underline">09063412927</a></p>
                    <p>📍 Address: Plot 315 Orji Uzoh Kalu Close, Ahmadu Bello Way, Mabushi Abuja</p>
                    <p>🕒 Business Hours: Monday - Friday, 8:00 AM - 6:00 PM (WAT)</p>
                  </div>
                </div>
              </section>

              <div className="border-t pt-6 mt-8">
                <p className="text-gray-600 text-sm text-center">
                  This Privacy Policy is effective as of January 16, 2025, and was last updated on January 16, 2025.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
