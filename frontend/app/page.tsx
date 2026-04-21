export default function Home() {
  return (
    <div className="space-y-4">
      <h1 className="headline-md">Nexus Finance Dashboard</h1>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div className="surface-container-low rounded-lg p-6">
          <p className="label-md text-muted-foreground">Overview</p>
          <p className="body-md mt-2">
            Welcome to your financial command center.
          </p>
        </div>
        <div className="surface-container-low rounded-lg p-6">
          <p className="label-md text-muted-foreground">Actions</p>
          <p className="body-md mt-2">
            Use sidebar modules based on your tenant type.
          </p>
        </div>
      </div>
    </div>
  )
}
