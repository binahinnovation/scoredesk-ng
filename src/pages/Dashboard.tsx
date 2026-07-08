
import React from 'react';
import { GraduationCap, UserPlus, BookOpen, FileText, Users, Clock, TrendingUp, BarChart3, Award } from 'lucide-react';
import { useDashboardData } from '@/hooks/use-dashboard-data';
import { useUserRole } from '@/hooks/use-user-role';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';

interface StatsCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  change?: string;
  description?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon, color, change, description }) => {
  return (
    <Card className="hover:shadow-lg transition-shadow duration-300 border-l-4" style={{ borderLeftColor: color }}>
      <CardContent className="p-3 sm:p-4 md:p-6">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">{title}</p>
            <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">{value.toLocaleString()}</p>
            {change && (
              <p className="text-xs text-green-600 mt-1 flex items-center">
                <TrendingUp className="h-3 w-3 mr-1 flex-shrink-0" />
                <span className="truncate">{change}</span>
              </p>
            )}
            {description && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">{description}</p>
            )}
          </div>
          <div className="p-2 sm:p-3 rounded-full flex-shrink-0 ml-2" style={{ backgroundColor: `${color}20` }}>
            <div style={{ color: color }} className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 lg:h-7 lg:w-7">
              {icon}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const COLORS = ['#059669', '#3B82F6', '#EF4444', '#F59E0B', '#8B5CF6', '#06B6D4'];

const Dashboard: React.FC = () => {
  const {
    studentsCount,
    teachersCount,
    subjectsCount,
    resultsCount,
    classesCount,
    pendingResultsCount,
    recentResults,
    classDistribution,
    subjectPerformance,
    monthlyTrends,
    termStats,
    loading,
    error,
  } = useDashboardData();

  const { hasPermission } = useUserRole();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-gray-900 dark:text-white">
              Failed to load dashboard data: {error.message}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
        {/* Header */}
        <div className="mb-4 sm:mb-6 md:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Dashboard Overview
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Welcome to your comprehensive school management dashboard
          </p>
        </div>

        {/* Key Statistics */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8">
          <StatsCard
            title="Total Students"
            value={studentsCount}
            icon={<GraduationCap className="h-7 w-7" />}
            color="#059669"
            description="Active enrollments"
          />
          <StatsCard
            title="Teachers & Staff"
            value={teachersCount}
            icon={<UserPlus className="h-7 w-7" />}
            color="#3B82F6"
            description="System users"
          />
          <StatsCard
            title="Subjects"
            value={subjectsCount}
            icon={<BookOpen className="h-7 w-7" />}
            color="#8B5CF6"
            description="Available subjects"
          />
          <StatsCard
            title="Classes"
            value={classesCount}
            icon={<Users className="h-7 w-7" />}
            color="#F59E0B"
            description="Academic classes"
          />
        </div>

        {/* Results Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8">
          <StatsCard
            title="Approved Results"
            value={resultsCount}
            icon={<FileText className="h-7 w-7" />}
            color="#059669"
            description="Published results"
          />
          <StatsCard
            title="Pending Approval"
            value={pendingResultsCount}
            icon={<Clock className="h-7 w-7" />}
            color="#EF4444"
            description="Awaiting approval"
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8">
          {/* Class Distribution */}
          <Card className="shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white text-sm sm:text-base">
                <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600 flex-shrink-0" />
                <span className="truncate">Student Distribution by Class</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {classDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={classDistribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fill: '#6b7280', fontSize: 10 }}
                      axisLine={{ stroke: '#9ca3af' }}
                      interval="preserveStartEnd"
                    />
                    <YAxis 
                      tick={{ fill: '#6b7280', fontSize: 10 }}
                      axisLine={{ stroke: '#9ca3af' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#ffffff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        color: '#374151'
                      }}
                    />
                    <Bar dataKey="students" fill="#059669" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-500 dark:text-gray-400">
                  No class distribution data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Subject Performance */}
          <Card className="shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-gray-900 dark:text-white text-sm sm:text-base">Top Performing Subjects</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {subjectPerformance.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={subjectPerformance.slice(0, 6)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="subject" 
                      tick={{ fill: '#6b7280', fontSize: 10 }}
                      axisLine={{ stroke: '#9ca3af' }}
                      interval="preserveStartEnd"
                    />
                    <YAxis 
                      tick={{ fill: '#6b7280', fontSize: 10 }}
                      axisLine={{ stroke: '#9ca3af' }}
                    />
                    <Tooltip 
                      formatter={(value, name) => [
                        `${Number(value).toFixed(1)}%`, 
                        name === 'average' ? 'Average Score' : name
                      ]}
                      contentStyle={{ 
                        backgroundColor: '#ffffff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        color: '#374151'
                      }}
                    />
                    <Bar dataKey="average" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-500 dark:text-gray-400">
                  No subject performance data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Activity and Trends */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Monthly Trends */}
          <Card className="lg:col-span-2 shadow-lg">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">Results Trends</CardTitle>
            </CardHeader>
            <CardContent>
              {monthlyTrends.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyTrends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="month" 
                      tick={{ fill: '#6b7280', fontSize: 12 }}
                      axisLine={{ stroke: '#9ca3af' }}
                    />
                    <YAxis 
                      tick={{ fill: '#6b7280', fontSize: 12 }}
                      axisLine={{ stroke: '#9ca3af' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#ffffff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        color: '#374151'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="results" 
                      stroke="#3B82F6" 
                      strokeWidth={3}
                      dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                      name="Total Results"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="approved" 
                      stroke="#059669" 
                      strokeWidth={3}
                      dot={{ fill: '#059669', strokeWidth: 2, r: 4 }}
                      name="Approved Results"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-500 dark:text-gray-400">
                  No trend data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Results */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">Recent Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-[300px] overflow-y-auto">
                {recentResults.length > 0 ? (
                  recentResults.slice(0, 8).map((result, index) => (
                    <div key={result.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div>
                        <p className="font-medium text-sm text-gray-900 dark:text-white">
                          {result.students?.first_name} {result.students?.last_name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {result.subjects?.name}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          ID: {result.students?.student_id}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-sm text-gray-900 dark:text-white">
                          {result.score}/{result.assessments?.max_score}
                        </p>
                        <div className="inline-flex px-2 py-1 rounded-full text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          Approved
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    No recent results available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {hasPermission('ManageResults') && (
            <Card className="hover:shadow-lg transition-shadow duration-300 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
                    <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100">Results Management</h3>
                </div>
                <p className="text-blue-700 dark:text-blue-300 text-sm mb-4">
                  Manage student results and performance analytics.
                </p>
                <Link to="/results/entry">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                    Manage Results
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {hasPermission('ManageUsers') && (
            <Card className="hover:shadow-lg transition-shadow duration-300 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-green-100 dark:bg-green-900 rounded-full">
                    <UserPlus className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="font-semibold text-green-900 dark:text-green-100">User Management</h3>
                </div>
                <p className="text-green-700 dark:text-green-300 text-sm mb-4">
                  Manage system users, roles, and permissions.
                </p>
                <Link to="/users">
                  <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                    Manage Users
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          <Card className="hover:shadow-lg transition-shadow duration-300 bg-gradient-to-r from-emerald-50 to-violet-50 dark:from-emerald-900/20 dark:to-violet-900/20 border-emerald-200 dark:border-emerald-800">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900 rounded-full">
                  <BarChart3 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="font-semibold text-emerald-900 dark:text-emerald-100">Advanced Analytics</h3>
              </div>
              <p className="text-emerald-700 dark:text-emerald-300 text-sm mb-4">
                View detailed analytics and performance insights.
              </p>
              <Link to="/analytics">
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                  View Analytics
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
