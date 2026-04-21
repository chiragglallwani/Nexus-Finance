'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BarChart3,
  ChartNoAxesCombined,
  CircleDollarSign,
  FileSearch,
  Landmark,
  ShieldCheck,
  WalletCards,
  type LucideIcon,
} from 'lucide-react'
import { TenantType, type UserInfo } from '@/models/types'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'

interface Item {
  label: string
  href: string
  icon: LucideIcon
}

const individualItems: Item[] = [
  { label: 'Safe Spend', href: '/safe-spend', icon: WalletCards },
  {
    label: 'Subscription Auditor',
    href: '/subscription-auditor',
    icon: FileSearch,
  },
  {
    label: 'Opportunity Cost',
    href: '/opportunity-cost',
    icon: ChartNoAxesCombined,
  },
  { label: 'Purpose Vaults', href: '/purpose-vaults', icon: Landmark },
  { label: 'Peer Benchmarking', href: '/peer-benchmarking', icon: BarChart3 },
]

const businessItems: Item[] = [
  {
    label: '13 Week Runway',
    href: '/runway-13-week',
    icon: ChartNoAxesCombined,
  },
  { label: 'Leakage Logic', href: '/leakage-logic', icon: FileSearch },
  { label: 'Tax Slicing', href: '/tax-slicing', icon: ShieldCheck },
  { label: 'AR velocity', href: '/ar-velocity', icon: CircleDollarSign },
]

export default function AppSidebar({ user }: { user: UserInfo | null }) {
  const { setOpen } = useSidebar()
  const pathname = usePathname()
  const items =
    user?.tenantType === TenantType.BUSINESS ? businessItems : individualItems

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="bg-surface-container-high rounded-lg p-3">
          <p className="text-sm font-semibold">{user?.name || 'User'}</p>
          <p className="text-muted-foreground text-xs">{user?.email || ''}</p>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const Icon = item.icon
                const active = pathname === item.href
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton isActive={active}>
                      <Link
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-3"
                      >
                        <Icon size={16} />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
