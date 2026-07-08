import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

export default function TermsOfService() {
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
                <span className="text-lg font-bold">📋</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Terms of Service</h1>
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
                Terms of Service for ScoreDesk
              </CardTitle>
              <p className="text-gray-600 mt-2">
                These Terms of Service govern your use of ScoreDesk, a school management system provided by Binah Innovation.
              </p>
            </CardHeader>
            <CardContent className="prose prose-lg max-w-none">
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Acceptance of Terms</h2>
                
                <p className="text-gray-700 mb-4">
                  By accessing or using ScoreDesk, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this service.
                </p>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                  <h3 className="text-lg font-semibold text-blue-900 mb-3">Binding Agreement</h3>
                  <p className="text-blue-800">
                    These terms constitute a legally binding agreement between you (the "User" or "School") and Binah Innovation ("Company," "we," "us," or "our"). Your continued use of the service indicates your acceptance of these terms.
                  </p>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Description of Service</h2>
                
                <h3 className="text-xl font-semibold text-gray-800 mb-3">ScoreDesk Platform</h3>
                <p className="text-gray-700 mb-4">
                  ScoreDesk is a comprehensive school management system that provides:
                </p>
                <ul className="text-gray-700 space-y-2 mb-6">
                  <li>• Student information management and academic records</li>
                  <li>• Result entry, approval, and reporting systems</li>
                  <li>• Attendance tracking and management</li>
                  <li>• Question paper creation and management</li>
                  <li>• User role management and permissions</li>
                  <li>• Analytics and reporting tools</li>
                  <li>• Communication and notification systems</li>
                </ul>

                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-green-900 mb-3">Service Availability</h3>
                  <p className="text-green-800">
                    We strive to provide 99.9% uptime, but we do not guarantee uninterrupted service. We reserve the right to modify, suspend, or discontinue the service with reasonable notice.
                  </p>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">3. User Accounts and Responsibilities</h2>
                
                <h3 className="text-xl font-semibold text-gray-800 mb-3">Account Creation</h3>
                <p className="text-gray-700 mb-4">
                  To use ScoreDesk, you must:
                </p>
                <ul className="text-gray-700 space-y-2 mb-6">
                  <li>• Provide accurate and complete registration information</li>
                  <li>• Maintain the security of your account credentials</li>
                  <li>• Notify us immediately of any unauthorized access</li>
                  <li>• Be responsible for all activities under your account</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-800 mb-3">School Responsibilities</h3>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
                  <h4 className="text-lg font-semibold text-yellow-900 mb-3">Data Accuracy</h4>
                  <ul className="text-yellow-800 space-y-2">
                    <li>• Ensure all student and staff information is accurate and up-to-date</li>
                    <li>• Obtain proper consent before adding personal information</li>
                    <li>• Maintain compliance with applicable data protection laws</li>
                    <li>• Report any data discrepancies promptly</li>
                  </ul>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Acceptable Use Policy</h2>
                
                <h3 className="text-xl font-semibold text-gray-800 mb-3">Permitted Uses</h3>
                <p className="text-gray-700 mb-4">
                  You may use ScoreDesk only for legitimate educational purposes and in accordance with these terms.
                </p>

                <h3 className="text-xl font-semibold text-gray-800 mb-3">Prohibited Activities</h3>
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
                  <h4 className="text-lg font-semibold text-red-900 mb-3">You Must NOT:</h4>
                  <ul className="text-red-800 space-y-2">
                    <li>• Attempt to gain unauthorized access to other schools' data</li>
                    <li>• Use the service for any illegal or unauthorized purpose</li>
                    <li>• Transmit viruses, malware, or other harmful code</li>
                    <li>• Interfere with or disrupt the service or servers</li>
                    <li>• Attempt to reverse engineer or copy the software</li>
                    <li>• Share account credentials with unauthorized persons</li>
                    <li>• Use automated systems to access the service without permission</li>
                  </ul>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Data Protection and Privacy</h2>
                
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6 mb-6">
                  <h3 className="text-lg font-semibold text-emerald-900 mb-3">Our Commitment</h3>
                  <p className="text-emerald-800 mb-4">
                    We are committed to protecting your data and privacy:
                  </p>
                  <ul className="text-emerald-800 space-y-2">
                    <li>• Complete data isolation between schools</li>
                    <li>• Industry-standard encryption and security measures</li>
                    <li>• No selling or sharing of your data with third parties</li>
                    <li>• Compliance with applicable data protection regulations</li>
                  </ul>
                </div>

                <p className="text-gray-700 mb-4">
                  For detailed information about our data practices, please review our <Link to="/privacy-policy" className="text-emerald-600 hover:underline">Privacy Policy</Link>.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Intellectual Property Rights</h2>
                
                <h3 className="text-xl font-semibold text-gray-800 mb-3">ScoreDesk Ownership</h3>
                <p className="text-gray-700 mb-4">
                  The ScoreDesk platform, including its software, design, and content, is owned by Binah Innovation and protected by intellectual property laws.
                </p>

                <h3 className="text-xl font-semibold text-gray-800 mb-3">Your Data Rights</h3>
                <p className="text-gray-700 mb-4">
                  You retain ownership of all data you input into ScoreDesk. We do not claim ownership of your school's information, student records, or other data.
                </p>

                <h3 className="text-xl font-semibold text-gray-800 mb-3">License to Use</h3>
                <p className="text-gray-700 mb-4">
                  We grant you a limited, non-exclusive, non-transferable license to use ScoreDesk for your school's legitimate educational purposes.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Payment and Billing</h2>
                
                <h3 className="text-xl font-semibold text-gray-800 mb-3">Service Fees</h3>
                <p className="text-gray-700 mb-4">
                  ScoreDesk may offer both free and paid service tiers. Current pricing and features are available on our website.
                </p>

                <h3 className="text-xl font-semibold text-gray-800 mb-3">Payment Terms</h3>
                <ul className="text-gray-700 space-y-2 mb-6">
                  <li>• All fees are non-refundable unless otherwise stated</li>
                  <li>• Payment is due in advance for subscription services</li>
                  <li>• We may change pricing with 30 days' notice</li>
                  <li>• Failure to pay may result in service suspension</li>
                </ul>

                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-green-900 mb-3">Free Tier</h3>
                  <p className="text-green-800">
                    ScoreDesk offers a free tier with basic features for small schools. Premium features are available through paid subscriptions.
                  </p>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Service Level Agreement</h2>
                
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-blue-900 mb-3">Uptime Guarantee</h3>
                    <ul className="text-blue-800 space-y-2 text-sm">
                      <li>• 99.9% uptime target</li>
                      <li>• Planned maintenance with advance notice</li>
                      <li>• Emergency maintenance when necessary</li>
                      <li>• Service status updates during outages</li>
                    </ul>
                  </div>
                  
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-orange-900 mb-3">Support</h3>
                    <ul className="text-orange-800 space-y-2 text-sm">
                      <li>• Email support within 24 hours</li>
                      <li>• Phone support during business hours</li>
                      <li>• Comprehensive documentation</li>
                      <li>• Training materials and tutorials</li>
                    </ul>
                  </div>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Limitation of Liability</h2>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
                  <h3 className="text-lg font-semibold text-yellow-900 mb-3">Important Notice</h3>
                  <p className="text-yellow-800 mb-4">
                    To the maximum extent permitted by law:
                  </p>
                  <ul className="text-yellow-800 space-y-2">
                    <li>• ScoreDesk is provided "as is" without warranties</li>
                    <li>• We are not liable for indirect or consequential damages</li>
                    <li>• Our total liability is limited to the amount you paid for the service</li>
                    <li>• We are not responsible for data loss due to user error</li>
                  </ul>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Termination</h2>
                
                <h3 className="text-xl font-semibold text-gray-800 mb-3">Termination by You</h3>
                <p className="text-gray-700 mb-4">
                  You may terminate your account at any time by contacting our support team. Upon termination, your data will be deleted according to our data retention policy.
                </p>

                <h3 className="text-xl font-semibold text-gray-800 mb-3">Termination by Us</h3>
                <p className="text-gray-700 mb-4">
                  We may terminate or suspend your account if you violate these terms, with or without notice.
                </p>

                <h3 className="text-xl font-semibold text-gray-800 mb-3">Data Export</h3>
                <p className="text-gray-700 mb-4">
                  Before termination, you may export your data in standard formats. We will provide reasonable assistance with data migration.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Governing Law and Disputes</h2>
                
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Applicable Law</h3>
                  <p className="text-gray-800 mb-4">
                    These terms are governed by the laws of Nigeria. Any disputes will be resolved in the courts of Abuja, Nigeria.
                  </p>
                  
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Dispute Resolution</h3>
                  <p className="text-gray-800">
                    We encourage resolving disputes through direct communication. If necessary, disputes will be resolved through binding arbitration in Nigeria.
                  </p>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Changes to Terms</h2>
                
                <p className="text-gray-700 mb-4">
                  We may update these Terms of Service from time to time. We will notify you of material changes by:
                </p>
                <ul className="text-gray-700 space-y-2 mb-6">
                  <li>• Posting updated terms on our website</li>
                  <li>• Sending email notifications to registered users</li>
                  <li>• Displaying notices within the ScoreDesk application</li>
                  <li>• Providing 30 days' notice for material changes</li>
                </ul>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-blue-900 mb-3">Continued Use</h3>
                  <p className="text-blue-800">
                    Your continued use of ScoreDesk after changes become effective constitutes acceptance of the new terms.
                  </p>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Contact Information</h2>
                
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-emerald-900 mb-3">Legal Department</h3>
                  <p className="text-emerald-800 mb-4">
                    For questions about these Terms of Service or legal matters:
                  </p>
                  <div className="text-emerald-800 space-y-2">
                    <p><strong>Binah Innovation</strong></p>
                    <p>📧 Email: <a href="mailto:legal@scoredesk.ng" className="hover:underline">legal@scoredesk.ng</a></p>
                    <p>📞 Phone: <a href="tel:09063412927" className="hover:underline">09063412927</a></p>
                    <p>📍 Address: Plot 315 Orji Uzoh Kalu Close, Ahmadu Bello Way, Mabushi Abuja</p>
                    <p>🕒 Business Hours: Monday - Friday, 8:00 AM - 6:00 PM (WAT)</p>
                  </div>
                </div>
              </section>

              <div className="border-t pt-6 mt-8">
                <p className="text-gray-600 text-sm text-center">
                  These Terms of Service are effective as of January 16, 2025, and were last updated on January 16, 2025.
                </p>
                <p className="text-gray-500 text-xs text-center mt-2">
                  © 2025 Binah Innovation. All rights reserved.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
