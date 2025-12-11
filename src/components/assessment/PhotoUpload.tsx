import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

interface Photo {
  url: string;
  description: string;
  uploaded_at: string;
}

interface PhotoUploadProps {
  photos: Photo[];
  onPhotosChange: (photos: Photo[]) => void;
  bucketPath: string;
  label?: string;
  maxPhotos?: number;
}

export default function PhotoUpload({
  photos,
  onPhotosChange,
  bucketPath,
  label = "Photos",
  maxPhotos = 10,
}: PhotoUploadProps) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editDescription, setEditDescription] = useState("");

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    if (photos.length + files.length > maxPhotos) {
      toast({
        title: "Too many photos",
        description: `Maximum ${maxPhotos} photos allowed`,
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      const newPhotos: Photo[] = [];

      for (const file of Array.from(files)) {
        // Validate file type
        if (!file.type.startsWith("image/")) {
          toast({
            title: "Invalid file",
            description: `${file.name} is not an image`,
            variant: "destructive",
          });
          continue;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          toast({
            title: "File too large",
            description: `${file.name} exceeds 5MB`,
            variant: "destructive",
          });
          continue;
        }

        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${bucketPath}/${fileName}`;

        const { error: uploadError, data } = await supabase.storage
          .from("assessment-photos")
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from("assessment-photos")
          .getPublicUrl(filePath);

        newPhotos.push({
          url: publicUrl,
          description: "",
          uploaded_at: new Date().toISOString(),
        });
      }

      if (newPhotos.length > 0) {
        onPhotosChange([...photos, ...newPhotos]);
        toast({
          title: "Success",
          description: `${newPhotos.length} photo(s) uploaded`,
        });
      }
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const handleDelete = async (index: number) => {
    const photo = photos[index];
    try {
      // Extract file path from URL
      const url = new URL(photo.url);
      const pathParts = url.pathname.split("/");
      const filePath = pathParts.slice(pathParts.indexOf(bucketPath)).join("/");

      await supabase.storage
        .from("assessment-photos")
        .remove([filePath]);

      const updatedPhotos = photos.filter((_, i) => i !== index);
      onPhotosChange(updatedPhotos);

      toast({
        title: "Photo deleted",
      });
    } catch (error: any) {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleUpdateDescription = (index: number) => {
    const updatedPhotos = [...photos];
    updatedPhotos[index] = {
      ...updatedPhotos[index],
      description: editDescription,
    };
    onPhotosChange(updatedPhotos);
    setEditingIndex(null);
    setEditDescription("");
  };

  const startEditingDescription = (index: number) => {
    setEditingIndex(index);
    setEditDescription(photos[index].description);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <span className="text-sm text-muted-foreground">
          {photos.length} / {maxPhotos}
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {photos.map((photo, index) => (
          <Card key={index} className="p-2 space-y-2">
            <div className="relative aspect-square overflow-hidden rounded-md bg-muted">
              <img
                src={photo.url}
                alt={photo.description || `Photo ${index + 1}`}
                className="object-cover w-full h-full"
              />
              <Button
                size="icon"
                variant="destructive"
                className="absolute top-2 right-2 h-6 w-6"
                onClick={() => handleDelete(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            {editingIndex === index ? (
              <div className="space-y-2">
                <Textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Add description..."
                  rows={2}
                  className="text-sm"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleUpdateDescription(index)}
                    className="flex-1"
                  >
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingIndex(null);
                      setEditDescription("");
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div
                className="text-sm text-muted-foreground cursor-pointer hover:text-foreground min-h-[2.5rem]"
                onClick={() => startEditingDescription(index)}
              >
                {photo.description || "Click to add description..."}
              </div>
            )}
          </Card>
        ))}

        {photos.length < maxPhotos && (
          <label className="border-2 border-dashed rounded-md aspect-square flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              disabled={uploading}
              className="hidden"
            />
            {uploading ? (
              <div className="text-center">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-2" />
                <span className="text-sm text-muted-foreground">Uploading...</span>
              </div>
            ) : (
              <>
                <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                <span className="text-sm text-muted-foreground">Upload Photo</span>
              </>
            )}
          </label>
        )}
      </div>

      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">
          Maximum file size: 5MB. Supported formats: JPG, PNG, WEBP
        </p>
        <p className="text-xs text-muted-foreground">
          <strong>Tip:</strong> For accurate scale and technical drawing creation, we recommend placing a calibrated measuring stick in each photo.
        </p>
      </div>
    </div>
  );
}
