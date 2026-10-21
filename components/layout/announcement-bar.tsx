export function AnnouncementBar() {
  return (
    <aside
      aria-label="Pengumuman toko"
      className="bg-espresso text-ivory text-xs font-medium py-2 px-4 text-center tracking-wide"
    >
      <div className="container mx-auto flex items-center justify-center gap-2">
        <span>Gratis ongkir untuk wilayah Jabodetabek</span>
        <span className="opacity-40" aria-hidden="true">•</span>
        <span>Koleksi hijab premium editorial</span>
      </div>
    </aside>
  )
}
