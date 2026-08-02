import { Mail, MapPin, Phone } from "lucide-react";
import Logo from "@/components/logo";
import {
  FacebookIcon,
  InstagramIcon,
  LinkedinIcon,
  XIcon,
} from "./social-icons";

/** Dummy placeholder contact details — swap for real values when available. */
const contactInfo = [
  { icon: Mail, label: "hello@pfsmarket.com", href: "mailto:hello@pfsmarket.com" },
  { icon: Phone, label: "+1 (555) 019-2837", href: "tel:+15550192837" },
  { icon: MapPin, label: "120 Market Street, Springfield, USA" },
];

/** Dummy placeholder social profiles — swap for real handles/URLs when available. */
const socialLinks = [
  { name: "Facebook", href: "#", Icon: FacebookIcon },
  { name: "Instagram", href: "#", Icon: InstagramIcon },
  { name: "X (Twitter)", href: "#", Icon: XIcon },
  { name: "LinkedIn", href: "#", Icon: LinkedinIcon },
];

export default function Footer() {
  return (
    <footer className="border-t border-slate/10 px-6 py-12 text-sm text-slate">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <Logo />
            <p className="mt-3 max-w-xs text-slate">
              A marketplace for everything you need, priced to sell.
            </p>
          </div>

          <div>
            <h3 className="font-display text-sm font-semibold text-ink dark:text-paper">
              Contact
            </h3>
            <ul className="mt-3 space-y-2">
              {contactInfo.map(({ icon: Icon, label, href }) => (
                <li key={label} className="flex items-center gap-2">
                  <Icon size={16} className="shrink-0 text-brand" />
                  {href ? (
                    <a href={href} className="hover:text-brand">
                      {label}
                    </a>
                  ) : (
                    <span>{label}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-display text-sm font-semibold text-ink dark:text-paper">
              Follow us
            </h3>
            <div className="mt-3 flex gap-3">
              {socialLinks.map(({ name, href, Icon }) => (
                <a
                  key={name}
                  href={href}
                  aria-label={name}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-slate/20 text-ink transition hover:border-brand hover:text-brand dark:text-paper"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-slate/10 pt-6 md:flex-row">
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
      </div>
    </footer>
  );
}
