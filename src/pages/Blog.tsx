import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, 
  Calendar,
  User,
  ArrowLeft,
  Clock,
  Tag,
  ExternalLink,
  ChevronRight
} from "lucide-react";
import { Link } from "react-router-dom";

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  date: string;
  readTime: string;
  tags: string[];
  featured: boolean;
}

export default function Blog() {
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);

  const blogPosts: BlogPost[] = [
    {
      id: "intro-to-scoredesk",
      title: "Welcome to ScoreDesk: Revolutionizing Nigerian School Management",
      excerpt: "Discover how ScoreDesk is transforming education management in Nigeria with its comprehensive school management system.",
      content: `
        <div class="prose max-w-none">
          <p class="text-lg text-gray-700 mb-6">
            Education is the foundation of any society, and in Nigeria, we're witnessing a digital transformation 
            that's reshaping how schools operate. ScoreDesk emerges as a comprehensive solution designed specifically 
            for Nigerian educational institutions, addressing the unique challenges they face.
          </p>

          <h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">Why ScoreDesk?</h2>
          
          <p class="text-gray-700 mb-4">
            Traditional school management methods are becoming increasingly inadequate in our digital age. 
            Manual record-keeping, paper-based processes, and fragmented systems create inefficiencies that 
            hinder both educators and students from reaching their full potential.
          </p>

          <div class="bg-blue-50 border border-blue-200 rounded-lg p-6 my-6">
            <h3 class="text-xl font-semibold text-blue-900 mb-3">The Challenge</h3>
            <ul class="text-blue-800 space-y-2">
              <li>• Manual result entry and calculation errors</li>
              <li>• Difficulty tracking student attendance</li>
              <li>• Inefficient communication between staff</li>
              <li>• Lack of real-time analytics and insights</li>
              <li>• Paper-based processes that are prone to loss</li>
            </ul>
          </div>

          <h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">ScoreDesk Solutions</h2>

          <p class="text-gray-700 mb-4">
            ScoreDesk addresses these challenges with a comprehensive suite of tools designed specifically 
            for Nigerian schools:
          </p>

          <div class="grid md:grid-cols-2 gap-6 my-8">
            <div class="bg-green-50 border border-green-200 rounded-lg p-6">
              <h3 class="text-lg font-semibold text-green-900 mb-3">🎯 Result Management</h3>
              <p class="text-green-800">
                Streamlined result entry with automatic calculations, approval workflows, 
                and AI-powered comment suggestions.
              </p>
            </div>
            
            <div class="bg-emerald-50 border border-emerald-200 rounded-lg p-6">
              <h3 class="text-lg font-semibold text-emerald-900 mb-3">📊 Analytics & Reports</h3>
              <p class="text-emerald-800">
                Real-time insights into student performance, class rankings, 
                and comprehensive reporting.
              </p>
            </div>
            
            <div class="bg-orange-50 border border-orange-200 rounded-lg p-6">
              <h3 class="text-lg font-semibold text-orange-900 mb-3">👥 User Management</h3>
              <p class="text-orange-800">
                Role-based access control with proper permissions for principals, 
                teachers, and administrative staff.
              </p>
            </div>
            
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 class="text-lg font-semibold text-blue-900 mb-3">📚 Question Papers</h3>
              <p class="text-blue-800">
                Digital question paper management with auto-save, 
                version control, and easy distribution.
              </p>
            </div>
          </div>

          <h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">Built for Nigerian Schools</h2>

          <p class="text-gray-700 mb-4">
            ScoreDesk understands the unique requirements of Nigerian educational institutions:
          </p>

          <ul class="text-gray-700 space-y-3 mb-6">
            <li class="flex items-start space-x-3">
              <span class="text-green-600 font-bold">✓</span>
              <span><strong>School Isolation:</strong> Complete data separation between different schools</span>
            </li>
            <li class="flex items-start space-x-3">
              <span class="text-green-600 font-bold">✓</span>
              <span><strong>Multi-Subject Teachers:</strong> Support for teachers handling multiple subjects and classes</span>
            </li>
            <li class="flex items-start space-x-3">
              <span class="text-green-600 font-bold">✓</span>
              <span><strong>Approval Workflows:</strong> Hierarchical approval system matching school structures</span>
            </li>
            <li class="flex items-start space-x-3">
              <span class="text-green-600 font-bold">✓</span>
              <span><strong>Local Support:</strong> Nigerian-based support team with local phone numbers</span>
            </li>
          </ul>

          <h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">Getting Started</h2>

          <p class="text-gray-700 mb-4">
            Ready to transform your school management? Getting started with ScoreDesk is simple:
          </p>

          <div class="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-lg p-6 my-6">
            <h3 class="text-xl font-semibold text-emerald-900 mb-4">5-Minute Setup</h3>
            <ol class="text-emerald-800 space-y-2">
              <li>1. Create your principal account</li>
              <li>2. Complete your school profile and upload logo</li>
              <li>3. Set up academic structure (terms, assessments, subjects)</li>
              <li>4. Add students and create teacher accounts</li>
              <li>5. Start managing your school efficiently!</li>
            </ol>
          </div>

          <h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">Join the Revolution</h2>

          <p class="text-gray-700 mb-6">
            ScoreDesk is more than just software – it's a commitment to improving education in Nigeria. 
            Join hundreds of schools already using ScoreDesk to streamline their operations, 
            improve student outcomes, and reduce administrative burden.
          </p>

          <div class="bg-gray-50 border border-gray-200 rounded-lg p-6 my-6">
            <p class="text-gray-700 text-center mb-4">
              <strong>Ready to get started?</strong> Contact us today for a personalized demo 
              and see how ScoreDesk can transform your school.
            </p>
            <div class="text-center space-x-4">
              <Button asChild>
                <a href="tel:09063412927">📞 Call Now: 09063412927</a>
              </Button>
              <Button asChild variant="outline">
                <a href="mailto:scoredesk.ng@gmail.com">✉️ Email Us</a>
              </Button>
            </div>
          </div>

          <p class="text-gray-600 text-sm mt-8 text-center">
            <em>ScoreDesk - Empowering Nigerian Schools Through Technology</em>
          </p>
        </div>
      `,
      author: "ScoreDesk Team",
      date: "2025-01-16",
      readTime: "5 min read",
      tags: ["Introduction", "School Management", "Nigeria", "Education"],
      featured: true
    }
  ];

  if (selectedPost) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <Button 
                variant="ghost" 
                onClick={() => setSelectedPost(null)}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Blog</span>
              </Button>
              <div className="flex items-center space-x-3">
                <div className="bg-emerald-700 text-white p-2 rounded-lg">
                  <BookOpen className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">ScoreDesk Blog</h1>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Blog Post Content */}
        <div className="container mx-auto px-6 py-8">
          <div className="max-w-4xl mx-auto">
            <Card className="shadow-sm">
              <CardHeader>
                <div className="flex items-center space-x-2 mb-2">
                  {selectedPost.featured && (
                    <Badge className="bg-yellow-100 text-yellow-800">Featured</Badge>
                  )}
                  {selectedPost.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">{tag}</Badge>
                  ))}
                </div>
                <CardTitle className="text-3xl font-bold text-gray-900 mb-4">
                  {selectedPost.title}
                </CardTitle>
                <div className="flex items-center space-x-4 text-gray-600">
                  <div className="flex items-center space-x-1">
                    <User className="h-4 w-4" />
                    <span>{selectedPost.author}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(selectedPost.date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span>{selectedPost.readTime}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div 
                  dangerouslySetInnerHTML={{ __html: selectedPost.content }}
                  className="prose prose-lg max-w-none"
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-emerald-700 text-white p-2 rounded-lg">
                <BookOpen className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">ScoreDesk Blog</h1>
                <p className="text-gray-600">Insights, updates, and success stories</p>
              </div>
            </div>
            <Button asChild>
              <Link to="/dashboard">
                <ExternalLink className="h-4 w-4 mr-2" />
                Try ScoreDesk
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Blog Posts */}
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {blogPosts.map((post) => (
              <Card 
                key={post.id} 
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setSelectedPost(post)}
              >
                <CardHeader>
                  <div className="flex items-center space-x-2 mb-2">
                    {post.featured && (
                      <Badge className="bg-yellow-100 text-yellow-800">Featured</Badge>
                    )}
                    {post.tags.slice(0, 2).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                    ))}
                  </div>
                  <CardTitle className="text-xl font-bold text-gray-900 line-clamp-2">
                    {post.title}
                  </CardTitle>
                  <CardDescription className="line-clamp-3">
                    {post.excerpt}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                    <div className="flex items-center space-x-1">
                      <User className="h-4 w-4" />
                      <span>{post.author}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>{post.readTime}</span>
                    </div>
                  </div>
                  <Button 
                    className="w-full" 
                    onClick={() => setSelectedPost(post)}
                  >
                    Read More
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Coming Soon */}
          <Card className="mt-8 border-dashed border-2 border-gray-300">
            <CardContent className="text-center py-12">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">More Articles Coming Soon</h3>
              <p className="text-gray-600 mb-4">
                We're working on more helpful articles about school management, best practices, and success stories.
              </p>
              <div className="flex justify-center space-x-2">
                <Badge variant="outline">Best Practices</Badge>
                <Badge variant="outline">Case Studies</Badge>
                <Badge variant="outline">Updates</Badge>
                <Badge variant="outline">Tutorials</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
