import Link from 'next/link'


export default function NotFound() {
  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-4 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">404</p>
        <h1 className="mt-4 text-4xl font-bold">Stranica nije pronađena</h1>
        <p className="mt-4 text-base text-gray-600">
          Tražena stranica ne postoji ili je uklonjena. Vratite se na mapu ili prijavite novi problem.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/map" className="btn-primary inline-block">
            Otvori mapu
          </Link>
          <Link href="/report" className="btn-secondary inline-block">
            Prijavi problem
          </Link>
        </div>
      </div>
    </main>
  )
}