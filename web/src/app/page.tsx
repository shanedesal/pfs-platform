import Header from "@/components/header";
import Hero from "@/components/hero";
import CategoryNav from "@/components/category-nav";
import FeaturedProducts from "@/components/featured-products";
import Footer from "@/components/footer";

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
