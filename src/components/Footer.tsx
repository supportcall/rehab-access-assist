export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center space-y-4 text-center">
          <div className="text-sm text-muted-foreground">
            Powered by{" "}
            <a 
              href="https://www.supportcall.co.za" 
              target="_blank" 
              rel="noopener noreferrer"
              className="font-semibold hover:underline text-primary"
            >
              SupportCALL
            </a>
          </div>
          
          <div className="text-sm text-muted-foreground">
            © {currentYear} SupportCALL. All rights reserved. |{" "}
            <a href="/privacy-policy" className="hover:underline">Privacy Policy</a> |{" "}
            <a href="/terms-of-use" className="hover:underline">Terms of Use</a>
          </div>
          
          <div className="max-w-3xl text-sm text-muted-foreground space-y-2">
            <p className="font-semibold">Acknowledgement of Humanity & Country</p>
            <p>
              We honour all people, from all cultures, lands, and histories - past and present. 
              Across Australia, Oceania, and the world, we stand for unity, respect, and shared humanity. 
              This includes acknowledging the enduring cultural connections of First Nations peoples, 
              while affirming dignity and equality for all.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}