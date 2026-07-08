
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, UserPlus, Shield, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const UserManagement = () => {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Users className="h-8 w-8 text-blue-600 mr-3" />
          <div>
            <h1 className="text-3xl font-bold">User Management</h1>
            <p className="text-gray-600">Manage school staff and their access permissions</p>
          </div>
        </div>
        <Button onClick={() => navigate('/users/create-login')} className="flex items-center">
          <UserPlus className="h-4 w-4 mr-2" />
          Create Login Details
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/users/create-login')}>
          <CardHeader>
            <CardTitle className="flex items-center">
              <UserPlus className="h-5 w-5 mr-2 text-green-600" />
              Create Login Details
            </CardTitle>
            <CardDescription>
              Generate login credentials for teachers and staff
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Create login accounts for Subject Teachers, Form Masters, and Exam Officers with appropriate permissions.
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/users/manage')}>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2 text-blue-600" />
              Manage Users
            </CardTitle>
            <CardDescription>
              View and manage existing user accounts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              View, edit, and manage existing user accounts and their permissions.
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/users/permissions')}>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="h-5 w-5 mr-2 text-emerald-600" />
              Role Permissions
            </CardTitle>
            <CardDescription>
              Configure role-based access control
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Set up and modify permissions for different user roles in the system.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserManagement;
