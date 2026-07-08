import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function ResponsiveTest() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📱 Responsive Design Test
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Breakpoint Indicators */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2">
            <Badge variant="outline" className="text-xs">250px</Badge>
            <Badge variant="outline" className="text-xs">320px</Badge>
            <Badge variant="outline" className="text-xs">360px</Badge>
            <Badge variant="outline" className="text-xs">375px</Badge>
            <Badge variant="outline" className="text-xs">390px</Badge>
            <Badge variant="outline" className="text-xs">414px</Badge>
            <Badge variant="outline" className="text-xs">428px</Badge>
            <Badge variant="outline" className="text-xs">480px</Badge>
            <Badge variant="outline" className="text-xs">540px</Badge>
            <Badge variant="outline" className="text-xs">600px</Badge>
            <Badge variant="outline" className="text-xs">768px</Badge>
            <Badge variant="outline" className="text-xs">820px</Badge>
            <Badge variant="outline" className="text-xs">912px</Badge>
            <Badge variant="outline" className="text-xs">1024px</Badge>
          </div>

          {/* Current Viewport Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">Current Viewport</h3>
            <p className="text-blue-800 text-sm">
              Resize your browser window to see how the layout adapts across different breakpoints.
              The layout should work seamlessly from 250px (extra small phones) to 1024px+ (tablets/desktop).
            </p>
          </div>

          {/* Layout Components Test */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Layout Components</h3>
            
            {/* Stats Cards Test */}
            <div>
              <h4 className="font-medium mb-2">Stats Cards</h4>
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                <Card className="border-l-4 border-l-green-500">
                  <CardContent className="p-3 sm:p-4 md:p-6">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Total Students</p>
                        <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">1,234</p>
                        <p className="text-xs text-gray-500 truncate">Active enrollments</p>
                      </div>
                      <div className="p-2 sm:p-3 rounded-full bg-green-100 flex-shrink-0 ml-2">
                        <div className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 lg:h-7 lg:w-7 text-green-600">👥</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-blue-500">
                  <CardContent className="p-3 sm:p-4 md:p-6">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Teachers</p>
                        <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">45</p>
                        <p className="text-xs text-gray-500 truncate">System users</p>
                      </div>
                      <div className="p-2 sm:p-3 rounded-full bg-blue-100 flex-shrink-0 ml-2">
                        <div className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 lg:h-7 lg:w-7 text-blue-600">👨‍🏫</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-emerald-500">
                  <CardContent className="p-3 sm:p-4 md:p-6">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Subjects</p>
                        <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">12</p>
                        <p className="text-xs text-gray-500 truncate">Available subjects</p>
                      </div>
                      <div className="p-2 sm:p-3 rounded-full bg-emerald-100 flex-shrink-0 ml-2">
                        <div className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 lg:h-7 lg:w-7 text-emerald-600">📚</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-orange-500">
                  <CardContent className="p-3 sm:p-4 md:p-6">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Classes</p>
                        <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">8</p>
                        <p className="text-xs text-gray-500 truncate">Academic classes</p>
                      </div>
                      <div className="p-2 sm:p-3 rounded-full bg-orange-100 flex-shrink-0 ml-2">
                        <div className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 lg:h-7 lg:w-7 text-orange-600">🏫</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Form Elements Test */}
            <div>
              <h4 className="font-medium mb-2">Form Elements</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Term</label>
                  <select className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md text-sm">
                    <option>First Term</option>
                    <option>Second Term</option>
                    <option>Third Term</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Class</label>
                  <select className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md text-sm">
                    <option>SS1A</option>
                    <option>SS1B</option>
                    <option>SS2A</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Subject</label>
                  <select className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md text-sm">
                    <option>Mathematics</option>
                    <option>English</option>
                    <option>Physics</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Assessment</label>
                  <select className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md text-sm">
                    <option>First CA</option>
                    <option>Second CA</option>
                    <option>Exam</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Table Test */}
            <div>
              <h4 className="font-medium mb-2">Table (Horizontal Scroll on Mobile)</h4>
              <div className="border rounded-lg overflow-x-auto">
                <table className="w-full min-w-[600px]">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[80px]">ID</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">Name</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Class</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">Score</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px]">Comment</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr>
                      <td className="px-3 py-2 whitespace-nowrap text-sm font-mono">001</td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm font-medium">John Doe</td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 hidden sm:table-cell">SS1A</td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <input type="number" className="w-16 sm:w-20 md:w-24 px-2 py-1 border rounded text-sm" placeholder="0" />
                      </td>
                      <td className="px-3 py-2">
                        <textarea className="w-full px-2 py-1 border rounded text-sm resize-none" rows={2} placeholder="Comment..."></textarea>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 whitespace-nowrap text-sm font-mono">002</td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm font-medium">Jane Smith</td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 hidden sm:table-cell">SS1A</td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <input type="number" className="w-16 sm:w-20 md:w-24 px-2 py-1 border rounded text-sm" placeholder="0" />
                      </td>
                      <td className="px-3 py-2">
                        <textarea className="w-full px-2 py-1 border rounded text-sm resize-none" rows={2} placeholder="Comment..."></textarea>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Action Buttons Test */}
            <div>
              <h4 className="font-medium mb-2">Action Buttons</h4>
              <div className="flex flex-col sm:flex-row gap-2">
                <button className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md text-sm w-full sm:w-auto">
                  <span>💾</span>
                  Save Results
                </button>
                <button className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-md text-sm w-full sm:w-auto">
                  <span>✨</span>
                  <span className="hidden sm:inline">Generate All Comments</span>
                  <span className="sm:hidden">Generate All</span>
                </button>
                <button className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md text-sm w-full sm:w-auto">
                  <span>📊</span>
                  View Analytics
                </button>
              </div>
            </div>
          </div>

          {/* Responsive Guidelines */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-green-900 mb-2">✅ Responsive Guidelines</h3>
            <ul className="text-green-800 text-sm space-y-1">
              <li>• <strong>Mobile First:</strong> Design starts from smallest screens (250px+)</li>
              <li>• <strong>Flexible Grids:</strong> Use responsive grid classes (grid-cols-1 sm:grid-cols-2 lg:grid-cols-4)</li>
              <li>• <strong>Scalable Typography:</strong> Text sizes adapt to screen size (text-sm sm:text-base)</li>
              <li>• <strong>Touch-Friendly:</strong> Buttons and inputs are appropriately sized for touch</li>
              <li>• <strong>Horizontal Scroll:</strong> Tables scroll horizontally on mobile when needed</li>
              <li>• <strong>Collapsible Content:</strong> Non-essential content hides on smaller screens</li>
              <li>• <strong>Consistent Spacing:</strong> Padding and margins scale with screen size</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
