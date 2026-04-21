'use client'

import { useUser } from '@/context/UserContext'
import TenantDetails from './TenantDetails'
import Uploads from './Uploads'

function ProfileMain() {
  const { user } = useUser()

  return (
    <section className="w-[80%] space-y-4">
      <h1 className="headline-md">Profile</h1>
      <div className="surface-container-low space-y-3 rounded-lg p-6">
        <div>
          <p className="label-md text-muted-foreground">Email</p>
          <p className="body-md">{user?.email || '-'}</p>
        </div>
        <div>
          <p className="label-md text-muted-foreground">Tenant Type</p>
          <p className="body-md">{user?.tenantType || '-'}</p>
        </div>
      </div>
      <TenantDetails />
      <Uploads />
    </section>
  )
}

export default ProfileMain
