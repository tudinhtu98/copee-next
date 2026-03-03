import { Button } from "@/components/ui/button";
import { ChromeIcon } from "lucide-react";

export default function GuidePage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Hướng dẫn sử dụng</h1>
        <p className="text-sm text-muted-foreground">
          Video hướng dẫn chi tiết cách sử dụng Copee.
        </p>
      </div>
      <a
        href="https://chromewebstore.google.com/detail/copee-shopee-product-copi/elindpfagpenoiaikhgjmpekhcnjkflj?hl=vi"
        target="_blank"
        rel="noopener noreferrer"
      >
        <Button variant="outline" className="cursor-pointer">
          <ChromeIcon className="h-4 w-4" />
          Tải Extension Copee
        </Button>
      </a>
      <div className="mt-2 max-w-2xl rounded-md border overflow-hidden">
        <iframe
          src="https://iframe.mediadelivery.net/embed/337647/eff3ff47-11b2-42ce-aef8-6f0fea02b898?autoplay=false&preload=false"
          className="aspect-video w-full block"
          style={{ border: "none" }}
          allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
        />
      </div>
    </div>
  );
}
