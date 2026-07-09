export default function ModerationPlaceholder() {
  return (
    <section className="card md:col-span-2">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h3 className="font-bold text-lg mb-1">Moderacija prijava</h3>
          <p className="text-sm text-gray-600">
            Modul je spreman kao mesto za buduće odluke moderatora, ali trenutno ne izvršava nikakve akcije nad prijavama.
          </p>
        </div>
        <span className="inline-flex items-center rounded-full border border-gray-300 px-3 py-1 text-xs font-medium text-gray-600">
          Placeholder
        </span>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-gray-200 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Čekanje na pregled</p>
          <p className="mt-2 text-sm text-gray-600">Biće prikazane nove prijave koje čekaju ručnu proveru sadržaja i lokacije.</p>
        </div>
        <div className="rounded-lg border border-gray-200 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Napomena moderatora</p>
          <p className="mt-2 text-sm text-gray-600">Ovde će ići interna beleška, bez objavljivanja promena krajnjim korisnicima.</p>
        </div>
        <div className="rounded-lg border border-gray-200 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Buduće akcije</p>
          <p className="mt-2 text-sm text-gray-600">Planirano: odobravanje, odbijanje, označavanje duplikata i dodela prioriteta.</p>
        </div>
      </div>
    </section>
  )
}