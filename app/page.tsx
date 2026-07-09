import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-secondary text-white">
      <section className="max-w-6xl mx-auto px-4 py-20 text-center">
        <h2 className="text-5xl font-bold mb-4">
          Unapredi infrastrukturu Srbije
        </h2>
        <p className="text-xl text-gray-200 mb-8">
          EvoRupa pomaže da prijaviš rupe i druge probleme na putevima i infrastrukturi direktno lokalnoj upravi.
        </p>
        <div className="space-x-4">
          <Link href="/map" className="btn-primary inline-block">
            Pogledaj mapu
          </Link>
          <Link href="/report" className="btn-secondary inline-block">
            Prijavi problem
          </Link>
        </div>
      </section>

      <section className="bg-white text-gray-900 py-20">
        <div className="max-w-6xl mx-auto px-4">
          <h3 className="text-3xl font-bold mb-12 text-center">
            Kako funkcioniše?
          </h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="card">
              <div className="text-4xl mb-4">📸</div>
              <h4 className="font-bold text-lg mb-2">1. Fotografuj</h4>
              <p>Fotografuj problem na putu ili infrastrukturi</p>
            </div>
            <div className="card">
              <div className="text-4xl mb-4">📍</div>
              <h4 className="font-bold text-lg mb-2">2. Locira</h4>
              <p>Označi lokaciju na mapi gde se nalazi problem</p>
            </div>
            <div className="card">
              <div className="text-4xl mb-4">✓</div>
              <h4 className="font-bold text-lg mb-2">3. Prijavi</h4>
              <p>Pošalji detaljan izveštaj lokalnoj upravi</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
