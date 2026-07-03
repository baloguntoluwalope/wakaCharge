import { useNavigate, useParams } from 'react-router-dom'

export default function ActiveRental() {
  const navigate = useNavigate()
  const { id } = useParams()

  return (
    <div className="min-h-svh bg-slate-50 p-6">
      <button onClick={() => navigate(-1)} className="mb-6 text-sm font-semibold text-green-600">← Back</button>
      <h1 className="text-2xl font-black text-navy-900">Active rental</h1>
      <p className="mt-2 text-sm text-slate-500">Rental {id}</p>
    </div>
  )
}
