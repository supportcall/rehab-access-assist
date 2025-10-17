import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";
import Footer from "@/components/Footer";
import PageMeta from "@/components/PageMeta";

const NotFound = () => {
  const navigate = useNavigate();
  
  return (
    <div className="flex min-h-screen flex-col">
      <PageMeta 
        title="404 - Page Not Found"
        description="The page you are looking for does not exist."
        canonical={window.location.origin + "/404"}
      />
      <div className="flex flex-1 items-center justify-center bg-background">
        <main id="main-content" className="text-center px-4">
          <h1 className="mb-4 text-6xl font-bold text-foreground">404</h1>
          <p className="mb-6 text-xl text-muted-foreground">Oops! Page not found</p>
          <p className="mb-8 text-muted-foreground max-w-md mx-auto">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <Button onClick={() => navigate("/")} size="lg" aria-label="Return to homepage">
            <Home className="mr-2 h-4 w-4" aria-hidden="true" />
            Return to Home
          </Button>
        </main>
      </div>
      
      <Footer />
    </div>
  );
};

export default NotFound;
