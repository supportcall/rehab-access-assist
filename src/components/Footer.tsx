import { Link } from "react-router-dom";
import { ExternalLink } from "lucide-react";
import rehabLogo from "@/assets/rehabsource-logo.png";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const supportCallLinks = [
    { name: "Australia", url: "https://www.supportcall.com.au/" },
    { name: "South Africa", url: "https://www.supportcall.co.za/" },
    { name: "Workflow4AI", url: "https://workflow4ai.com/" },
    { name: "SysAdmin AI", url: "https://sysadmin-ai.com/" },
    { name: "SC-USCS", url: "https://sc-uscs.com/" },
    { name: "SC-Cloaked", url: "https://sc-cloaked.com/" },
    { name: "WAN IP", url: "https://wanip.io/" },
    { name: "SC-USEO", url: "https://sc-useo.com/" },
    { name: "SeniorMail", url: "https://seniormail.co.za/" },
    { name: "ImmiAssist2AU", url: "https://immiassist2au.com/" },
  ];

  const resourceLinks = [
    { name: "NDIS Guidelines", url: "https://www.ndis.gov.au/" },
    { name: "AS 1428.1 Standard", url: "https://www.standards.org.au/" },
    { name: "OT Australia", url: "https://otaus.com.au/" },
  ];

  return (
    <footer 
      className="border-t border-border/50 bg-foreground/95 dark:bg-background/95 py-12"
      role="contentinfo"
    >
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Brand Section - Spans 2 columns on large screens */}
          <div className="lg:col-span-2">
            <Link 
              to="/" 
              className="inline-flex items-center gap-3 mb-4 text-background dark:text-foreground hover:opacity-80 transition-opacity"
            >
              <img 
                src={rehabLogo} 
                alt="RehabSource" 
                className="h-10 w-10 object-contain"
              />
              <span className="font-semibold text-lg">RehabSource</span>
            </Link>
            <p className="text-sm text-background/70 dark:text-foreground/70 max-w-md leading-relaxed">
              Professional home modifications assessment portal for Occupational Therapists 
              and Physiotherapists. NDIS-compliant environmental assessments with comprehensive 
              documentation and funder-ready reports.
            </p>
          </div>

          {/* SupportCALL Links */}
          <div>
            <h4 className="font-semibold text-background dark:text-foreground mb-4">SupportCALL</h4>
            <ul className="space-y-2">
              {supportCallLinks.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-background/60 dark:text-foreground/60 hover:text-primary transition-colors inline-flex items-center gap-1"
                  >
                    {link.name}
                    <ExternalLink className="h-3 w-3" aria-hidden="true" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-semibold text-background dark:text-foreground mb-4">Resources</h4>
            <ul className="space-y-2">
              {resourceLinks.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-background/60 dark:text-foreground/60 hover:text-primary transition-colors inline-flex items-center gap-1"
                  >
                    {link.name}
                    <ExternalLink className="h-3 w-3" aria-hidden="true" />
                  </a>
                </li>
              ))}
              <li>
                <Link
                  to="/privacy-policy"
                  className="text-sm text-background/60 dark:text-foreground/60 hover:text-primary transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  to="/terms-of-use"
                  className="text-sm text-background/60 dark:text-foreground/60 hover:text-primary transition-colors"
                >
                  Terms of Use
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-12 pt-8 border-t border-background/20 dark:border-foreground/20 flex flex-col items-center gap-4 text-center">
          <p className="text-sm text-background/70 dark:text-foreground/70">
            © {currentYear} RehabSource. All rights reserved. 
            <span className="mx-2">|</span>
            <span className="font-mono text-xs">v3.1.2</span>
          </p>
          
          <p className="text-xs text-background/50 dark:text-foreground/50 max-w-2xl leading-relaxed">
            RehabSource is provided for professional use by registered health practitioners. 
            Always ensure compliance with local regulations and standards. 
            Consult with relevant authorities regarding specific accessibility requirements.
          </p>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-500/10 border border-green-500/30 rounded-full text-xs text-green-500">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" aria-hidden="true"></span>
              System Active
            </span>
          </div>

          {/* Acknowledgement */}
          <div className="mt-4 max-w-3xl">
            <p className="text-xs text-background/50 dark:text-foreground/50 leading-relaxed">
              <span className="font-medium">Acknowledgement of Humanity & Country:</span>{" "}
              We honour all people, from all cultures, lands, and histories - past and present. 
              Across Australia, Oceania, and the world, we stand for unity, respect, and shared humanity.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
