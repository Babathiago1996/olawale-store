'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Users as UsersIcon, Shield, UserCheck, Eye, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { usersAPI } from '@/lib/api'
import { formatDate, getInitials } from '@/lib/utils'
import { toast } from 'sonner'

const UserCard = ({ user }) => {
  const getRoleBadge = (role) => {
    const badges = {
      admin: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
      staff: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      auditor: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
    }
    return badges[role] || badges.staff
  }

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin':
        return <Shield className="w-4 h-4" />
      case 'staff':
        return <UserCheck className="w-4 h-4" />
      default:
        return <Eye className="w-4 h-4" />
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-primary text-primary-foreground text-lg font-semibold flex-shrink-0">
              {getInitials(user.firstName, user.lastName)}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-lg">
                  {user.firstName} {user.lastName}
                </h3>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getRoleBadge(user.role)}`}>
                  {getRoleIcon(user.role)}
                  {user.role}
                </span>
              </div>
              
              <p className="text-sm text-muted-foreground mb-3">{user.email}</p>
              
              {user.phone && (
                <p className="text-sm text-muted-foreground mb-3">{user.phone}</p>
              )}
              
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div>
                  <span>Last login: </span>
                  <span className="font-medium">
                    {user.lastLogin ? formatDate(user.lastLogin, 'PPp') : 'Never'}
                  </span>
                </div>
                <div>
                  <span>Status: </span>
                  <span className={`font-medium ${user.isActive ? 'text-green-600' : 'text-red-600'}`}>
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

const SkeletonCard = () => (
  <Card>
    <CardContent className="p-6">
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 skeleton rounded-full" />
        <div className="flex-1 space-y-3">
          <div className="h-6 skeleton rounded w-1/3" />
          <div className="h-4 skeleton rounded w-1/2" />
          <div className="h-4 skeleton rounded w-2/3" />
        </div>
      </div>
    </CardContent>
  </Card>
)

export default function UsersPage() {
  const [users, setUsers] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetchUsers()
  }, [filter])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const params = filter !== 'all' ? { role: filter } : {}
      const [usersResponse, statsResponse] = await Promise.all([
        usersAPI.getAll(params),
        usersAPI.getStatistics()
      ])
      
      setUsers(usersResponse.data.data.users)
      setStats(statsResponse.data.data)
    } catch (error) {
      toast.error('Failed to load users')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold">Users</h1>
        <p className="text-muted-foreground mt-1">
          Manage system users and permissions
        </p>
      </motion.div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Total Users</p>
            <p className="text-2xl font-bold mt-2">
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : stats?.totalUsers || 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Active Users</p>
            <p className="text-2xl font-bold mt-2">
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : stats?.activeUsers || 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Admins</p>
            <p className="text-2xl font-bold mt-2">
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : stats?.byRole?.admin || 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Staff</p>
            <p className="text-2xl font-bold mt-2">
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : stats?.byRole?.staff || 0}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-2">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              onClick={() => setFilter('all')}
            >
              All Users
            </Button>
            <Button
              variant={filter === 'admin' ? 'default' : 'outline'}
              onClick={() => setFilter('admin')}
            >
              Admins
            </Button>
            <Button
              variant={filter === 'staff' ? 'default' : 'outline'}
              onClick={() => setFilter('staff')}
            >
              Staff
            </Button>
            <Button
              variant={filter === 'auditor' ? 'default' : 'outline'}
              onClick={() => setFilter('auditor')}
            >
              Auditors
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : users.length > 0 ? (
        <div className="space-y-4">
          {users.map((user) => (
            <UserCard key={user._id} user={user} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-16">
            <div className="text-center">
              <UsersIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No users found</h3>
              <p className="text-muted-foreground">
                {filter === 'all' ? 'No users in the system' : `No ${filter} users found`}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}