const footerLinks = [
  { label: 'About', href: '#' },
  { label: 'Contact', href: '#' },
  { label: 'Terms', href: '#' },
  { label: 'Privacy', href: '#' }
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-borderGray bg-white py-6">
      <div className="section-shell flex flex-col gap-3 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <p>© {year} MindCare</p>
        <nav aria-label="Footer links" className="flex flex-wrap items-center gap-4">
          {footerLinks.map((link) => (
            <a key={link.label} href={link.href} className="focus-outline rounded-md transition hover:text-primary">
              {link.label}
            </a>
          ))}
        </nav>
      </div>
    </footer>
  );
}
