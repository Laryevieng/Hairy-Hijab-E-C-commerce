import { render, screen, fireEvent, within } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import HomePage from "@/app/(store)/page"
import NotFound from "@/app/not-found"
import RootError from "@/app/error"
import { getCategories, getLatestProducts } from "@/services/catalog.service"

vi.mock("@/services/catalog.service", () => ({
  getCategories: vi.fn(),
  getLatestProducts: vi.fn(),
}))

const categories = Array.from({ length: 8 }, (_, index) => ({ id: `cat-${index}`, name: `Kategori ${index}`, slug: `kategori-${index}`, description: null, image_path: null, sort_order: index }))
const products = [{ id: "p1", slug: "produk-uji", name: "Produk Uji", category_id: "cat-0", category_slug: "kategori-0", min_price: 50000, max_price: 50000, image_path: null, in_stock: true, colors: [], sizes: [], is_featured: false, on_sale: false, created_at: null }]

describe("Halaman Beranda & Error Handling (P1-05)", () => {
  describe("HomePage", () => {
    it("merender Hero Banner dengan judul editorial, CTA dan gambar placeholder", async () => {
      vi.mocked(getCategories).mockResolvedValue(categories)
      vi.mocked(getLatestProducts).mockResolvedValue(products)
      render(await HomePage())

      // Hero banner
      const heroSection = screen.getByLabelText("Sorotan Utama Koleksi Hairy Hijab")
      expect(heroSection).toBeInTheDocument()

      expect(
        within(heroSection).getByRole("heading", {
          name: /Keanggunan Sederhana untuk Kenyamanan Sehari-hari/i,
          level: 1,
        })
      ).toBeInTheDocument()

      const ctaAllProducts = within(heroSection).getByRole("link", {
        name: /Lihat Semua Produk/i,
      })
      expect(ctaAllProducts).toHaveAttribute("href", "/products")

      const ctaCategories = within(heroSection).getByRole("link", {
        name: /Jelajahi Kategori/i,
      })
      expect(ctaCategories).toHaveAttribute("href", "#kategori-pilihan")

      const heroImg = within(heroSection).getByAltText(
        "Editorial Koleksi Hijab Hairy Hijab"
      )
      expect(heroImg).toBeInTheDocument()
    })

    it("merender kategori dari service database dengan tautan yang sesuai", async () => {
      vi.mocked(getCategories).mockResolvedValue(categories)
      vi.mocked(getLatestProducts).mockResolvedValue(products)
      render(await HomePage())

      const categorySection = screen.getByLabelText("Kategori Pilihan Hijab")
      expect(categorySection).toBeInTheDocument()

      expect(categories).toHaveLength(8)
      for (const cat of categories) {
        const catLink = within(categorySection).getByRole("link", {
          name: `Jelajahi kategori ${cat.name}`,
        })
        expect(catLink).toHaveAttribute("href", `/categories/${cat.slug}`)
        expect(within(categorySection).getByText(cat.name)).toBeInTheDocument()
      }
    })

    it("merender produk terbaru dari service katalog", async () => {
      vi.mocked(getCategories).mockResolvedValue(categories)
      vi.mocked(getLatestProducts).mockResolvedValue(products)
      render(await HomePage())

      const latestSection = screen.getByLabelText("Koleksi Produk Terbaru")
      expect(latestSection).toBeInTheDocument()

      expect(within(latestSection).getByText("Produk Uji")).toBeInTheDocument()
      expect(
        within(latestSection).getByRole("link", { name: /Lihat Semua Katalog/i })
      ).toHaveAttribute("href", "/products")
    })

    it("merender komitmen kualitas brand tanpa klaim testimoni palsu", async () => {
      vi.mocked(getCategories).mockResolvedValue(categories)
      vi.mocked(getLatestProducts).mockResolvedValue(products)
      render(await HomePage())

      const commitmentSection = screen.getByLabelText("Komitmen Kualitas Hairy Hijab")
      expect(commitmentSection).toBeInTheDocument()

      expect(within(commitmentSection).getByText("Bahan Pilihan Sejuk")).toBeInTheDocument()
      expect(within(commitmentSection).getByText("Potongan Pas & Rapi")).toBeInTheDocument()
      expect(within(commitmentSection).getByText("Kerapian Jahitan")).toBeInTheDocument()
      expect(within(commitmentSection).getByText("Pengemasan Terjaga")).toBeInTheDocument()
    })

    it("merender bagian ajakan belanja penutup", async () => {
      vi.mocked(getCategories).mockResolvedValue(categories)
      vi.mocked(getLatestProducts).mockResolvedValue(products)
      render(await HomePage())

      const ctaSection = screen.getByLabelText("Ajakan Berbelanja")
      expect(ctaSection).toBeInTheDocument()

      const shopLink = within(ctaSection).getByRole("link", { name: "Mulai Belanja" })
      expect(shopLink).toHaveAttribute("href", "/products")

      const saleLink = within(ctaSection).getByRole("link", { name: "Lihat Koleksi Sale" })
      expect(saleLink).toHaveAttribute("href", "/sale")
    })
  })

  describe("NotFound (404 Page)", () => {
    it("merender pesan halaman tidak ditemukan dan navigasi pemulihan", () => {
      render(<NotFound />)

      const main = screen.getByRole("main")
      expect(main).toBeInTheDocument()

      expect(
        within(main).getByRole("heading", { name: "Halaman Tidak Ditemukan", level: 1 })
      ).toBeInTheDocument()

      const homeLink = within(main).getByRole("link", { name: /Kembali ke Beranda/i })
      expect(homeLink).toHaveAttribute("href", "/")

      const catalogLink = within(main).getByRole("link", { name: /Katalog Produk/i })
      expect(catalogLink).toHaveAttribute("href", "/products")

      expect(within(main).getByRole("link", { name: /Pencarian Produk/i })).toHaveAttribute(
        "href",
        "/search"
      )
      expect(within(main).getByRole("link", { name: /Kontak Bantuan/i })).toHaveAttribute(
        "href",
        "/contact"
      )
    })
  })

  describe("RootError (Error Boundary)", () => {
    it("merender pesan kendala teknis dan memicu fungsi reset saat tombol Coba Muat Ulang diklik", () => {
      const resetMock = vi.fn()
      const mockError = new Error("Simulasi error server")
      Object.assign(mockError, { digest: "ERR_12345" })

      // Silence console.error during test
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

      render(<RootError error={mockError} reset={resetMock} />)

      expect(
        screen.getByRole("heading", { name: "Terjadi Kesalahan Teknis", level: 1 })
      ).toBeInTheDocument()
      expect(screen.getByText(/Kode kesalahan: ERR_12345/i)).toBeInTheDocument()

      const retryButton = screen.getByRole("button", { name: /Coba Muat Ulang/i })
      expect(retryButton).toBeInTheDocument()

      fireEvent.click(retryButton)
      expect(resetMock).toHaveBeenCalledTimes(1)

      const homeLink = screen.getByRole("link", { name: /Kembali ke Beranda/i })
      expect(homeLink).toHaveAttribute("href", "/")

      consoleSpy.mockRestore()
    })
  })
})
