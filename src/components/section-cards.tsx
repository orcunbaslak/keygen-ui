'use client'

import { useState, useEffect, useCallback } from "react"
import { Key, Users, Monitor, Package } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { getKeygenApi } from "@/lib/api"

export function SectionCards() {
  const [stats, setStats] = useState({
    licenses: 0,
    users: 0, 
    machines: 0,
    products: 0,
    loading: true
  })

  const api = getKeygenApi()

  const loadDashboardStats = useCallback(async () => {
    try {
      const [licensesResponse, usersResponse, machinesResponse, productsResponse] = await Promise.all([
        api.licenses.list({ limit: 1 }).catch(() => ({ data: [], meta: { count: 0 } })),
        api.users.list({ limit: 1 }).catch(() => ({ data: [], meta: { count: 0 } })),
        api.machines.list({ limit: 1 }).catch(() => ({ data: [], meta: { count: 0 } })),
        api.products.list({ limit: 1 }).catch(() => ({ data: [], meta: { count: 0 } })),
      ])

      setStats({
        licenses: (typeof licensesResponse.meta?.count === 'number' ? licensesResponse.meta.count : 0) || (Array.isArray(licensesResponse.data) ? licensesResponse.data.length : 0),
        users: (typeof usersResponse.meta?.count === 'number' ? usersResponse.meta.count : 0) || (Array.isArray(usersResponse.data) ? usersResponse.data.length : 0),
        machines: (typeof machinesResponse.meta?.count === 'number' ? machinesResponse.meta.count : 0) || (Array.isArray(machinesResponse.data) ? machinesResponse.data.length : 0),
        products: (typeof productsResponse.meta?.count === 'number' ? productsResponse.meta.count : 0) || (Array.isArray(productsResponse.data) ? productsResponse.data.length : 0),
        loading: false
      })
    } catch (error) {
      console.error('Failed to load dashboard stats:', error)
      setStats(prev => ({ ...prev, loading: false }))
    }
  }, [api.licenses, api.users, api.machines, api.products])

  useEffect(() => {
    loadDashboardStats()
  }, [loadDashboardStats])
  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Active Licenses</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats.loading ? '...' : stats.licenses.toLocaleString()}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <Key className="size-4" />
              Licenses
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Total license count <Key className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Manage licenses from the licenses page
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Registered Users</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats.loading ? '...' : stats.users.toLocaleString()}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <Users className="size-4" />
              Users
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Total user accounts <Users className="size-4" />
          </div>
          <div className="text-muted-foreground">
            User management and permissions
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Active Machines</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats.loading ? '...' : stats.machines.toLocaleString()}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <Monitor className="size-4" />
              Machines
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Licensed machines <Monitor className="size-4" />
          </div>
          <div className="text-muted-foreground">Monitor device activations</div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Products</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats.loading ? '...' : stats.products.toLocaleString()}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <Package className="size-4" />
              Products
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Managed products <Package className="size-4" />
          </div>
          <div className="text-muted-foreground">Software product catalog</div>
        </CardFooter>
      </Card>
    </div>
  )
}
