
import { Outlet } from 'react-router-dom'

export const OperatorLayout = () => {
  return (
    <div className="app-shell bg-slate-50">
      <div className="flex-1 overflow-y-auto">
        <Outlet />
      </div>
    </div>
  )
}