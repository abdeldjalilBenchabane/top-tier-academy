import React, { useState, useEffect } from 'react';
import { usersAPI } from '@/services/api';
import { User } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Trash2, UserPlus, Edit, Upload, User as UserIcon, Loader2, Search, Filter, Eye, EyeOff } from 'lucide-react';
import { toast } from '@/lib/toast';

interface LevelOption {
  id: number;
  name: string;
}

const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [showEditPwd, setShowEditPwd] = useState(false);
  const [showEditConfirmPwd, setShowEditConfirmPwd] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [levels, setLevels] = useState<LevelOption[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student' as User['role'],
    level_id: '' as string,
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingEditAvatar, setIsUploadingEditAvatar] = useState(false);

  const fetchUsers = async () => {
    try {
      const data = await usersAPI.getAll();
      setUsers(data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast.error('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLevels = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/levels', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setLevels(data || []);
      }
    } catch (e) {
      console.error('Failed to fetch levels:', e);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchLevels();
  }, []);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    // Validate password length
    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }
    
    // Validate level when creating a professor
    if (formData.role === 'professor' && !formData.level_id) {
      toast.error('يرجى اختيار المرحلة الدراسية للأستاذ');
      return;
    }

    try {
      const userData: any = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        role: formData.role,
      };
      if (formData.role === 'professor' && formData.level_id) {
        userData.level_id = parseInt(formData.level_id);
      }

      const newUser = await usersAPI.create(userData);

      // Upload avatar if provided
      if (avatarFile && newUser.id) {
        setIsUploadingAvatar(true);
        try {
          await usersAPI.uploadAvatar(newUser.id, avatarFile);
        } finally {
          setIsUploadingAvatar(false);
        }
      }

      toast.success('User created successfully');
      setShowCreateDialog(false);
      setFormData({ name: '', email: '', password: '', confirmPassword: '', role: 'student', level_id: '' });
      setAvatarFile(null);
      setAvatarPreview(null);
      fetchUsers();
    } catch (error: any) {
      console.error('Failed to create user:', error);
      toast.error(error.message || 'Failed to create user');
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    
    // Validate passwords match if password is provided
    if (formData.password && formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    // Validate password length if password is provided
    if (formData.password && formData.password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }
    
    // Require level when professor
    if (formData.role === 'professor' && !formData.level_id) {
      toast.error('يرجى اختيار المرحلة الدراسية للأستاذ');
      return;
    }

    try {
      const updateData: any = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
      };

      if (formData.role === 'professor') {
        updateData.level_id = formData.level_id ? parseInt(formData.level_id) : null;
      }

      // Only include password fields if password is provided
      if (formData.password) {
        updateData.password = formData.password;
        updateData.confirmPassword = formData.confirmPassword;
      }

      await usersAPI.update(editingUser.id, updateData);

      // Upload avatar if provided
      if (avatarFile) {
        setIsUploadingEditAvatar(true);
        try {
          await usersAPI.uploadAvatar(editingUser.id, avatarFile);
        } finally {
          setIsUploadingEditAvatar(false);
        }
      }

      toast.success('User updated successfully');
      setEditingUser(null);
      setFormData({ name: '', email: '', password: '', confirmPassword: '', role: 'student', level_id: '' });
      setAvatarFile(null);
      setAvatarPreview(null);
      fetchUsers();
    } catch (error: any) {
      console.error('Failed to update user:', error);
      toast.error(error.message || 'Failed to update user');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    
    try {
      await usersAPI.delete(userId);
      toast.success('User deleted successfully');
      fetchUsers();
    } catch (error: any) {
      console.error('Failed to delete user:', error);
      toast.error(error.message || 'Failed to delete user');
    }
  };

  const getRoleBadgeColor = (role: User['role']) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'professor': return 'bg-blue-100 text-blue-800';
      case 'student': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Filter users based on search term and role filter
  const filteredUsers = users.filter(user => {
    const matchesSearch = searchTerm === '' || 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  const resetForm = () => {
    setFormData({ name: '', email: '', password: '', confirmPassword: '', role: 'student', level_id: '' });
    setAvatarFile(null);
    setAvatarPreview(null);
    setIsUploadingAvatar(false);
    setIsUploadingEditAvatar(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">User Management</h2>
          <p className="text-gray-600">Manage users and their roles</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateUser} className="space-y-4">
              {/* Avatar Upload */}
              <div className="flex flex-col items-center space-y-2">
                <div className="relative">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Avatar preview"
                      className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center border-2 border-gray-200">
                      <UserIcon className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                  <label
                    htmlFor="avatar-upload"
                    className="absolute bottom-0 right-0 bg-blue-500 text-white rounded-full p-1 cursor-pointer hover:bg-blue-600"
                  >
                    <Upload className="h-3 w-3" />
                  </label>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </div>
                <p className="text-xs text-gray-500">Click to upload avatar (optional)</p>
              </div>

              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPwd ? "text" : "password"}
                    className="pr-10"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  minLength={6}
                    />
                  <button
                    type="button"
                    onClick={() => setShowPwd(!showPwd)}
                    aria-label={showPwd ? "Hide password" : "Show password"}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPwd ? "text" : "password"}
                    className="pr-10"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                  minLength={6}
                    />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPwd(!showConfirmPwd)}
                    aria-label={showConfirmPwd ? "Hide password" : "Show password"}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div>
                <Label htmlFor="role">Role</Label>
                <Select value={formData.role} onValueChange={(value: User['role']) => setFormData({ ...formData, role: value, level_id: value === 'professor' ? formData.level_id : '' })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="professor">Professor</SelectItem>
                    <SelectItem value="student">Student</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {formData.role === 'professor' && (
                <div>
                  <Label htmlFor="level">المرحلة الدراسية</Label>
                  <Select
                    value={formData.level_id}
                    onValueChange={(value) => setFormData({ ...formData, level_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر المرحلة" />
                    </SelectTrigger>
                    <SelectContent>
                      {levels.map((lvl) => (
                        <SelectItem key={lvl.id} value={String(lvl.id)}>
                          {lvl.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="flex gap-2">
                <Button type="submit" disabled={isUploadingAvatar}>
                  {isUploadingAvatar ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating User...
                    </>
                  ) : (
                    'Create User'
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={() => {
                  setShowCreateDialog(false);
                  resetForm();
                }}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Role Filter */}
            <div className="md:w-48">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="professor">Professor</SelectItem>
                  <SelectItem value="student">Student</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Results count */}
          <div className="mt-4 text-sm text-gray-600">
            Showing {filteredUsers.length} of {users.length} users
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredUsers.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            <UserIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>No users found matching your criteria</p>
          </div>
        ) : (
          filteredUsers.map((user) => (
          <Card key={user.id}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-3">
                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                      <UserIcon className="h-6 w-6 text-gray-400" />
                    </div>
                  )}
                <div>
                  <CardTitle className="text-lg">{user.name}</CardTitle>
                  <CardDescription>{user.email}</CardDescription>
                  </div>
                </div>
                <Badge className={getRoleBadgeColor(user.role)}>
                  {user.role}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {user.role === 'professor' && (
                <div className="mb-2 text-sm">
                  <span className="text-gray-500">المرحلة: </span>
                  {(user as any).level_name ? (
                    <span className="font-medium text-blue-700">{(user as any).level_name}</span>
                  ) : (
                    <span className="text-orange-600 font-medium">غير محددة</span>
                  )}
                </div>
              )}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditingUser(user);
                    setFormData({
                      name: user.name,
                      email: user.email,
                      password: '',
                      confirmPassword: '',
                      role: user.role,
                      level_id: (user as any).level_id ? String((user as any).level_id) : '',
                    });
                    setAvatarFile(null);
                    setAvatarPreview(null);
                  }}
                >
                  <Edit className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDeleteUser(user.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
          ))
        )}
      </div>

      {editingUser && (
        <Dialog open={!!editingUser} onOpenChange={() => {
          setEditingUser(null);
          resetForm();
        }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpdateUser} className="space-y-4">
              {/* Avatar Upload */}
              <div className="flex flex-col items-center space-y-2">
                <div className="relative">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Avatar preview"
                      className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                    />
                  ) : editingUser.avatar_url ? (
                    <img
                      src={editingUser.avatar_url}
                      alt={editingUser.name}
                      className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center border-2 border-gray-200">
                      <UserIcon className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                  <label
                    htmlFor="edit-avatar-upload"
                    className="absolute bottom-0 right-0 bg-blue-500 text-white rounded-full p-1 cursor-pointer hover:bg-blue-600"
                  >
                    <Upload className="h-3 w-3" />
                  </label>
                  <input
                    id="edit-avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </div>
                <p className="text-xs text-gray-500">Click to change avatar</p>
              </div>

              <div>
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-password">New Password (leave blank to keep current)</Label>
                <div className="relative">
                  <Input
                    id="edit-password"
                    type={showEditPwd ? "text" : "password"}
                    className="pr-10"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  minLength={6}
                    />
                  <button
                    type="button"
                    onClick={() => setShowEditPwd(!showEditPwd)}
                    aria-label={showEditPwd ? "Hide password" : "Show password"}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showEditPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div>
                <Label htmlFor="edit-confirmPassword">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="edit-confirmPassword"
                    type={showEditConfirmPwd ? "text" : "password"}
                    className="pr-10"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  minLength={6}
                    />
                  <button
                    type="button"
                    onClick={() => setShowEditConfirmPwd(!showEditConfirmPwd)}
                    aria-label={showEditConfirmPwd ? "Hide password" : "Show password"}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showEditConfirmPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div>
                <Label htmlFor="edit-role">Role</Label>
                <Select value={formData.role} onValueChange={(value: User['role']) => setFormData({ ...formData, role: value, level_id: value === 'professor' ? formData.level_id : '' })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="professor">Professor</SelectItem>
                    <SelectItem value="student">Student</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {formData.role === 'professor' && (
                <div>
                  <Label htmlFor="edit-level">المرحلة الدراسية</Label>
                  <Select
                    value={formData.level_id}
                    onValueChange={(value) => setFormData({ ...formData, level_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر المرحلة" />
                    </SelectTrigger>
                    <SelectContent>
                      {levels.map((lvl) => (
                        <SelectItem key={lvl.id} value={String(lvl.id)}>
                          {lvl.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="flex gap-2">
                <Button type="submit" disabled={isUploadingEditAvatar}>
                  {isUploadingEditAvatar ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Updating User...
                    </>
                  ) : (
                    'Update User'
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={() => {
                  setEditingUser(null);
                  resetForm();
                }}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default UserManagement;
