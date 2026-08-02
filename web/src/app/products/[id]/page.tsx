import Header from "@/components/storefront/header";
import Footer from "@/components/storefront/footer";
import ProductDetail from "@/components/storefront/product-detail";

type ProductDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { id } = await params;

  return (
    <>
      <Header />
      <main>
        <ProductDetail productId={id} />
      </main>
      <Footer />
    </>
  );
}
