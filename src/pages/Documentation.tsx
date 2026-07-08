import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, 
  Users, 
  Settings, 
  BarChart3, 
  FileText, 
  HelpCircle, 
  ChevronRight,
  ChevronDown,
  Search,
  Play,
  CheckCircle,
  AlertCircle,
  Info,
  ExternalLink,
  Download,
  Upload,
  Shield,
  Zap,
  Edit,
  Eye
} from "lucide-react";
import { Input } from "@/components/ui/input";

interface DocSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  description: string;
  subsections: DocSubsection[];
}

interface DocSubsection {
  id: string;
  title: string;
  content: React.ReactNode;
  tags?: string[];
}

export default function Documentation() {
  const [activeSection, setActiveSection] = useState<string>("getting-started");
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["getting-started"]));

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
    
    // Scroll to the section
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const docSections: DocSection[] = [
    {
      id: "getting-started",
      title: "Getting Started",
      icon: <Zap className="h-5 w-5" />,
      description: "Quick setup guide to get your school running on ScoreDesk",
      subsections: [
        {
          id: "overview",
          title: "What is ScoreDesk?",
          content: (
            <div className="space-y-4">
              <p className="text-gray-700 leading-relaxed">
                ScoreDesk is a comprehensive school management system designed specifically for Nigerian schools. 
                It provides everything you need to manage your educational institution efficiently.
              </p>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-blue-900">Key Features</h4>
                    <ul className="mt-2 space-y-1 text-blue-800">
                      <li>• Student Management & Records</li>
                      <li>• Result Entry & Approval System</li>
                      <li>• Question Paper Management</li>
                      <li>• Attendance Tracking</li>
                      <li>• Class Ranking & Analytics</li>
                      <li>• Multi-user Role Management</li>
                      <li>• School Isolation & Security</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )
        },
        {
          id: "quick-setup",
          title: "Quick Setup (5 Minutes)",
          content: (
            <div className="space-y-6">
              <div className="grid gap-4">
                <div className="flex items-start space-x-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                  <div>
                    <h4 className="font-semibold text-green-900">Create Your Account</h4>
                    <p className="text-green-800 mt-1">Sign up with your school email and create your principal account.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                  <div>
                    <h4 className="font-semibold text-green-900">Complete School Profile</h4>
                    <p className="text-green-800 mt-1">Upload your school logo and fill in basic school information.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                  <div>
                    <h4 className="font-semibold text-green-900">Set Up Academic Structure</h4>
                    <p className="text-green-800 mt-1">Create terms, assessments, subjects, and classes for your school.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">4</div>
                  <div>
                    <h4 className="font-semibold text-green-900">Add Students & Staff</h4>
                    <p className="text-green-800 mt-1">Import student data and create accounts for teachers and staff.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">5</div>
                  <div>
                    <h4 className="font-semibold text-green-900">Start Managing</h4>
                    <p className="text-green-800 mt-1">Begin entering results, tracking attendance, and managing your school.</p>
                  </div>
                </div>
              </div>
            </div>
          )
        }
      ]
    },
    {
      id: "user-management",
      title: "User Management",
      icon: <Users className="h-5 w-5" />,
      description: "Managing user accounts, roles, and permissions",
      subsections: [
        {
          id: "user-roles",
          title: "User Roles & Permissions",
          content: (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center space-x-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span>Principal</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>Full system access</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>User management</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>Result approval</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>System settings</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center space-x-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span>Exam Officer</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>Result management</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>Question papers</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>Analytics access</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <AlertCircle className="h-4 w-4 text-orange-500" />
                        <span>Limited user management</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span>Form Teacher</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>Class management</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>Attendance tracking</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>Student records</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <AlertCircle className="h-4 w-4 text-orange-500" />
                        <span>Limited result access</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center space-x-2">
                      <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                      <span>Subject Teacher</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>Result entry</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>Question papers</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>Assigned subjects only</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <AlertCircle className="h-4 w-4 text-orange-500" />
                        <span>No user management</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          )
        }
      ]
    },
    {
      id: "features",
      title: "Core Features",
      icon: <Settings className="h-5 w-5" />,
      description: "Detailed guides for all ScoreDesk features",
      subsections: [
        {
          id: "result-management",
          title: "Result Management",
          content: (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-blue-900 mb-4">Result Entry Workflow</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="font-bold">1</span>
                    </div>
                    <h4 className="font-semibold text-blue-900">Select Class & Subject</h4>
                    <p className="text-blue-700 text-sm mt-1">Choose the class and subject you want to enter results for</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="font-bold">2</span>
                    </div>
                    <h4 className="font-semibold text-blue-900">Enter Scores</h4>
                    <p className="text-blue-700 text-sm mt-1">Input CA and Exam scores for each student</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="font-bold">3</span>
                    </div>
                    <h4 className="font-semibold text-blue-900">Submit for Approval</h4>
                    <p className="text-blue-700 text-sm mt-1">Results are submitted for principal/exam officer approval</p>
                  </div>
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Zap className="h-5 w-5 text-yellow-600" />
                      <span>AI Comment Suggestions</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 mb-4">ScoreDesk automatically generates appropriate comments based on student performance:</p>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center space-x-2">
                        <Badge variant="outline" className="bg-green-50 text-green-700">Excellent</Badge>
                        <span>80-100%: Outstanding performance</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <Badge variant="outline" className="bg-blue-50 text-blue-700">Good</Badge>
                        <span>60-79%: Good work, keep it up</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700">Average</Badge>
                        <span>40-59%: Needs improvement</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <Badge variant="outline" className="bg-red-50 text-red-700">Poor</Badge>
                        <span>Below 40%: Requires attention</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Shield className="h-5 w-5 text-green-600" />
                      <span>Approval System</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 mb-4">Multi-level approval ensures accuracy:</p>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>Teacher submits results</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-blue-600" />
                        <span>Exam Officer reviews</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-emerald-600" />
                        <span>Principal approves</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>Results published</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          )
        },
        {
          id: "question-papers",
          title: "Question Paper Management",
          content: (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-emerald-50 to-pink-50 border border-emerald-200 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-emerald-900 mb-4">Question Paper Workflow</h3>
                <div className="grid md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto mb-3">
                      <FileText className="h-6 w-6" />
                    </div>
                    <h4 className="font-semibold text-emerald-900">Create Paper</h4>
                    <p className="text-emerald-700 text-sm mt-1">Write questions manually or upload scanned papers</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto mb-3">
                      <Edit className="h-6 w-6" />
                    </div>
                    <h4 className="font-semibold text-emerald-900">Edit & Review</h4>
                    <p className="text-emerald-700 text-sm mt-1">Make changes and review content</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto mb-3">
                      <Eye className="h-6 w-6" />
                    </div>
                    <h4 className="font-semibold text-emerald-900">Preview</h4>
                    <p className="text-emerald-700 text-sm mt-1">Preview and print question papers</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto mb-3">
                      <CheckCircle className="h-6 w-6" />
                    </div>
                    <h4 className="font-semibold text-emerald-900">Submit</h4>
                    <p className="text-emerald-700 text-sm mt-1">Submit for approval and storage</p>
                  </div>
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Download className="h-5 w-5 text-blue-600" />
                      <span>Auto-Save Feature</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 mb-4">Never lose your work:</p>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>Automatic saving every 30 seconds</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>Draft management system</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>Continue where you left off</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Shield className="h-5 w-5 text-green-600" />
                      <span>Edit Limits</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 mb-4">Controlled editing system:</p>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>Configurable edit limits</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>Admin override capability</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>Audit trail tracking</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          )
        }
      ]
    },
    {
      id: "help-support",
      title: "Help & Support",
      icon: <HelpCircle className="h-5 w-5" />,
      description: "Get help when you need it",
      subsections: [
        {
          id: "faq",
          title: "Frequently Asked Questions",
          content: (
            <div className="space-y-6">
              <div className="grid gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">How do I reset a student's password?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700">Go to User Management → Find the student → Click "Edit" → Generate a new password. The student will need to change it on first login.</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Can I export results to Excel?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700">Yes! In the Results section, use the "Export" button to download results in Excel format. You can also export class rankings and attendance reports.</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">How do I add multiple subjects to a teacher?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700">In User Management, edit the teacher's profile and use the "Assign Subjects" feature to select multiple subjects and classes for that teacher.</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">What if I make a mistake in result entry?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700">If results haven't been approved yet, you can edit them directly. If approved, contact your Exam Officer or Principal to make corrections.</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )
        },
        {
          id: "contact",
          title: "Contact Support",
          content: (
            <div className="space-y-6">
              <div className="grid md:grid-cols-3 gap-6">
                <Card className="text-center">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-center space-x-2">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-bold">📞</span>
                      </div>
                      <span>Phone Support</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 mb-4">Call us for immediate assistance</p>
                    <Button asChild className="w-full">
                      <a href="tel:09063412927">09063412927</a>
                    </Button>
                  </CardContent>
                </Card>
                
                <Card className="text-center">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-center space-x-2">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-green-600 font-bold">✉️</span>
                      </div>
                      <span>Email Support</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 mb-4">Send us a detailed message</p>
                    <Button asChild className="w-full" variant="outline">
                      <a href="mailto:scoredesk.ng@gmail.com">scoredesk.ng@gmail.com</a>
                    </Button>
                  </CardContent>
                </Card>
                
                <Card className="text-center">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-center space-x-2">
                      <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                        <span className="text-emerald-600 font-bold">📍</span>
                      </div>
                      <span>Visit Us</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 mb-4">Come see us in person</p>
                    <p className="text-sm text-gray-600">Abuja, Nigeria</p>
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>Response Times</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <div>
                        <h4 className="font-semibold text-green-900">Phone Support</h4>
                        <p className="text-green-700 text-sm">Immediate response during business hours</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-blue-600" />
                      <div>
                        <h4 className="font-semibold text-blue-900">Email Support</h4>
                        <p className="text-blue-700 text-sm">Response within 24 hours</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )
        }
      ]
    }
  ];

  const filteredSections = docSections.filter(section => 
    section.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    section.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="bg-emerald-700 text-white p-1.5 sm:p-2 rounded-lg flex-shrink-0">
                <BookOpen className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 truncate">ScoreDesk Documentation</h1>
                <p className="text-sm sm:text-base text-gray-600 hidden sm:block">Complete guide to managing your school</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search documentation..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full sm:w-64 h-10 sm:h-10"
                />
              </div>
              <Button asChild className="w-full sm:w-auto h-10">
                <a href="/dashboard">
                  <Play className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Try ScoreDesk</span>
                  <span className="sm:hidden">Try Now</span>
                </a>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-3 sm:px-6 py-4 sm:py-8">
        <div className="grid lg:grid-cols-4 gap-4 sm:gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-4 sm:top-8">
              <nav className="space-y-1 sm:space-y-2">
                <h3 className="font-semibold text-gray-900 mb-3 sm:mb-4 text-sm sm:text-base">Table of Contents</h3>
                {filteredSections.map((section) => (
                  <div key={section.id}>
                    <button
                      onClick={() => {
                        setActiveSection(section.id);
                        toggleSection(section.id);
                      }}
                      className={`w-full flex items-center justify-between p-2 sm:p-3 rounded-lg text-left transition-colors ${
                        activeSection === section.id
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      <div className="flex items-center space-x-2 sm:space-x-3">
                        <div className="flex-shrink-0">{section.icon}</div>
                        <div className="min-w-0">
                          <div className="font-medium text-sm sm:text-base truncate">{section.title}</div>
                          <div className="text-xs sm:text-sm text-gray-500 hidden sm:block">{section.description}</div>
                        </div>
                      </div>
                      {expandedSections.has(section.id) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="space-y-4 sm:space-y-8">
              {filteredSections.map((section) => (
                <div key={section.id} id={section.id} className="space-y-6">
                  {section.subsections.map((subsection) => (
                    <Card key={subsection.id} className="shadow-sm">
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          {section.icon}
                          <span>{subsection.title}</span>
                        </CardTitle>
                        {subsection.tags && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {subsection.tags.map((tag) => (
                              <Badge key={tag} variant="secondary">{tag}</Badge>
                            ))}
                          </div>
                        )}
                      </CardHeader>
                      <CardContent>
                        {subsection.content}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
