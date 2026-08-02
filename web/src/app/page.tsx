import Header from "@/components/storefront/header";
import Hero from "@/components/storefront/hero";
import CategoryNav from "@/components/storefront/category-nav";
import FeaturedProducts from "@/components/storefront/featured-products";
import Footer from "@/components/storefront/footer";

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <CategoryNav />
        <FeaturedProducts />
      </main>
      <Footer />
    </>
  );
}
