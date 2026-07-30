export default function Footer() {
  return (
    <footer className="border-t border-slate/10 px-6 py-8 text-sm text-slate">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 md:flex-row">
        <p>© {new Date().getFullYear()} PFS — Products For Sale</p>
        <div className="flex gap-4">
          <a href="#" className="hover:text-brand">
            Help
          </a>
          <a href="#" className="hover:text-brand">
            Terms
          </a>
          <a href="#" className="hover:text-brand">
            Privacy
          </a>
        </div>
      </div>
    </footer>
  );
}
