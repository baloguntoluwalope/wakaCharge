import { Outlet } from 'react-router-dom'
import { BottomNav } from '../components/shared/BottomNav'

export const StudentLayout = () => {
  return (
    <div className="app-shell bg-slate-50">
      <div className="flex-1 overflow-y-auto pb-24">
        <Outlet />
      </div>
      <BottomNav />
    </div>
  )
}