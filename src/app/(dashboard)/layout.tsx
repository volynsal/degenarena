import { DashboardNav } from '@/components/dashboard/DashboardNav'
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar'
import { MobileBottomNav } from '@/components/dashboard/MobileBottomNav'
import { FlowField } from '@/components/landing/FlowField'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-arena-darker">
      {/* Subtle Tron grid animation behind all dashboard content */}
      <FlowField subtle />
      <DashboardNav />
      <div className="flex">
        <DashboardSidebar />
        <main className="relative z-10 flex-1 min-w-0 px-4 sm:px-6 lg:px-8 lg:pr-12 pb-24 lg:pb-8 pt-20 lg:pt-20 lg:ml-60 max-w-[1400px]">
          {children}
        </main>
      </div>
      <MobileBottomNav />
    </div>
  )
}
