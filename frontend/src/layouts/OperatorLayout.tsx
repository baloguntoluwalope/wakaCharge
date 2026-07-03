
import { Outlet } from 'react-router-dom'

export const OperatorLayout = () => {
  return (
    <div
      className="operator-layout"
      style={{
        height: '100%',
        minHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: '#f8fafc',
        overflow: 'hidden'
      }}
    >
      <Outlet />
    </div>
  )
}