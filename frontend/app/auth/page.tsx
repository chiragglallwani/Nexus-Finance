import Image from 'next/image'
import BannerImage from '@/public/banner.png'
import AuthMain from '@/features/auth/AuthMain'
import BannerText from '@/features/auth/BannerText'

function AuthPage() {
  return (
    <main className="bg-background text-on-surface selection:bg-primary/30 flex min-h-screen overflow-hidden">
      {/* Left Side: Hero Visualization */}
      <section className="bg-surface-container-lowest border-outline-variant/10 relative hidden items-center justify-center overflow-hidden border-r p-12 lg:flex lg:w-1/2">
        {/* Dynamic Background */}
        <div className="pointer-events-none absolute inset-0 z-0">
          <div className="pulse-gradient absolute top-1/2 left-1/2 h-[1000px] w-[1000px] -translate-x-1/2 -translate-y-1/2 opacity-30 blur-[140px]" />
          <Image
            src={BannerImage}
            alt="Data visualization"
            referrerPolicy="no-referrer"
            className="absolute inset-0 h-full w-full object-cover opacity-[0.08]"
          />
        </div>

        <BannerText />
      </section>

      <AuthMain />
    </main>
  )
}

export default AuthPage
