import Header from "@/components/storefront/header";
import Footer from "@/components/storefront/footer";
import ProductCatalog from "@/components/storefront/product-catalog";

export default function ProductsPage() {
  return (
    <>
      <Header />
      <main>
        <ProductCatalog />
      </main>
      <Footer />
    </>
  );
}
