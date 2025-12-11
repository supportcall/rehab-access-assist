import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getSafeErrorMessage } from "@/lib/errorHandling";
import { Loader2, Wand2, Plus, Download, Trash2, Edit2, Save, X, FileImage, Ruler } from "lucide-react";
import DiagramBuilder from "./DiagramBuilder";

interface Photo {
  url: string;
  description: string;
}

interface TechnicalDrawing {
  id?: string;
  assessment_id: string;
  drawing_type: 'floor_plan' | 'elevation' | 'detail' | 'site_plan';
  room_area: string;
  title: string;
  description?: string;
  svg_content?: string;
  ai_generated: boolean;
  photo_references: Photo[];
  measurements_used: Record<string, number>;
  annotations: Array<{ x: number; y: number; text: string }>;
}

interface TechnicalDrawingsProps {
  assessmentId: string;
  environmentalAreas?: any[];
  measurements?: any[];
  clinicalData?: any;
  siteSurveyData?: any;
}

const DRAWING_TYPES = [
  { value: 'floor_plan', label: 'Floor Plan' },
  { value: 'elevation', label: 'Elevation View' },
  { value: 'detail', label: 'Detail Drawing' },
  { value: 'site_plan', label: 'Site Plan' },
];

const ROOM_AREAS = [
  'Bathroom',
  'Bedroom',
  'Kitchen',
  'Living Room',
  'Entry/Hallway',
  'Laundry',
  'External Access',
  'Ramp',
  'Stairs',
  'Outdoor Area',
  'Whole House',
];

export default function TechnicalDrawings({
  assessmentId,
  environmentalAreas = [],
  measurements = [],
  clinicalData = {},
  siteSurveyData = {},
}: TechnicalDrawingsProps) {
  const { toast } = useToast();
  const [drawings, setDrawings] = useState<TechnicalDrawing[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState("gallery");
  const [editingDrawing, setEditingDrawing] = useState<TechnicalDrawing | null>(null);
  
  // New drawing form state
  const [newDrawing, setNewDrawing] = useState<Partial<TechnicalDrawing>>({
    drawing_type: 'floor_plan',
    room_area: '',
    title: '',
    description: '',
    ai_generated: false,
    photo_references: [],
    measurements_used: {},
    annotations: [],
  });

  useEffect(() => {
    if (assessmentId) {
      loadDrawings();
    }
  }, [assessmentId]);

  const loadDrawings = async () => {
    if (!assessmentId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("technical_drawings")
        .select("*")
        .eq("assessment_id", assessmentId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Type cast the data properly
      const typedDrawings = (data || []).map(d => ({
        ...d,
        photo_references: Array.isArray(d.photo_references) ? d.photo_references as unknown as Photo[] : [],
        measurements_used: typeof d.measurements_used === 'object' && d.measurements_used !== null 
          ? d.measurements_used as unknown as Record<string, number> 
          : {},
        annotations: Array.isArray(d.annotations) 
          ? d.annotations as unknown as Array<{ x: number; y: number; text: string }> 
          : [],
      })) as TechnicalDrawing[];
      
      setDrawings(typedDrawings);
    } catch (error) {
      console.error("Error loading drawings:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateAIDrawing = async () => {
    if (!assessmentId || !newDrawing.room_area || !newDrawing.drawing_type) {
      toast({
        title: "Missing Information",
        description: "Please select a room area and drawing type",
        variant: "destructive",
      });
      return;
    }

    setGenerating(true);
    try {
      // Gather relevant measurements for this room
      const relevantMeasurements: Record<string, number> = {};
      measurements.forEach((m: any) => {
        if (m.location?.toLowerCase().includes(newDrawing.room_area?.toLowerCase())) {
          relevantMeasurements[`${m.measurement_type}_${m.location}`] = m.value_mm;
        }
      });

      // Add site survey measurements for this area
      if (newDrawing.room_area?.toLowerCase().includes('bathroom') && siteSurveyData) {
        if (siteSurveyData.bathroom_toilet_height) {
          relevantMeasurements['toilet_height'] = siteSurveyData.bathroom_toilet_height;
        }
      }
      if (newDrawing.room_area?.toLowerCase().includes('kitchen') && siteSurveyData) {
        if (siteSurveyData.kitchen_bench_heights) {
          relevantMeasurements['bench_height'] = siteSurveyData.kitchen_bench_heights;
        }
        if (siteSurveyData.kitchen_aisle_widths) {
          relevantMeasurements['aisle_width'] = siteSurveyData.kitchen_aisle_widths;
        }
      }

      // Gather photos from environmental areas
      const photos: Photo[] = [];
      environmentalAreas.forEach((area: any) => {
        if (area.photo_urls && Array.isArray(area.photo_urls)) {
          area.photo_urls.forEach((photo: any) => {
            if (photo.url && photo.description) {
              photos.push({ url: photo.url, description: photo.description });
            }
          });
        }
      });

      const response = await supabase.functions.invoke("generate-technical-drawing", {
        body: {
          drawingType: newDrawing.drawing_type,
          roomArea: newDrawing.room_area,
          measurements: relevantMeasurements,
          photos: photos.slice(0, 5), // Limit to 5 photos for context
          clientInfo: {
            mobilityAid: clinicalData?.wheelchair_type || clinicalData?.mobility_status,
            wheelchairWidth: clinicalData?.wheelchair_width,
            wheelchairLength: clinicalData?.wheelchair_length,
            turningRadius: clinicalData?.wheelchair_turning_radius,
          },
          existingFeatures: newDrawing.description,
          proposedModifications: environmentalAreas
            .filter((a: any) => a.notes)
            .map((a: any) => a.notes)
            .join("; "),
        },
      });

      if (response.error) throw response.error;

      const { svg } = response.data;
      
      // Save the generated drawing
      const { data, error } = await supabase
        .from("technical_drawings")
        .insert({
          assessment_id: assessmentId,
          drawing_type: newDrawing.drawing_type as string,
          room_area: newDrawing.room_area,
          title: newDrawing.title || `${newDrawing.room_area} ${DRAWING_TYPES.find(t => t.value === newDrawing.drawing_type)?.label}`,
          description: newDrawing.description,
          svg_content: svg,
          ai_generated: true,
          photo_references: photos.slice(0, 5) as unknown as any,
          measurements_used: relevantMeasurements as unknown as any,
          annotations: [] as unknown as any,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Drawing Generated",
        description: "AI-generated technical drawing has been created",
      });

      // Reset form and reload
      setNewDrawing({
        drawing_type: 'floor_plan',
        room_area: '',
        title: '',
        description: '',
        ai_generated: false,
        photo_references: [],
        measurements_used: {},
        annotations: [],
      });
      setActiveTab("gallery");
      loadDrawings();

    } catch (error) {
      console.error("Error generating drawing:", error);
      toast({
        title: "Generation Failed",
        description: getSafeErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const saveManualDrawing = async (svgContent: string) => {
    if (!assessmentId || !newDrawing.room_area || !newDrawing.drawing_type) {
      toast({
        title: "Missing Information",
        description: "Please select a room area and drawing type",
        variant: "destructive",
      });
      return;
    }

    try {
      const drawingToSave = {
        assessment_id: assessmentId,
        drawing_type: newDrawing.drawing_type,
        room_area: newDrawing.room_area,
        title: newDrawing.title || `${newDrawing.room_area} ${DRAWING_TYPES.find(t => t.value === newDrawing.drawing_type)?.label}`,
        description: newDrawing.description,
        svg_content: svgContent,
        ai_generated: false,
        photo_references: [],
        measurements_used: {},
        annotations: newDrawing.annotations || [],
      };

      const { error } = await supabase
        .from("technical_drawings")
        .insert(drawingToSave);

      if (error) throw error;

      toast({
        title: "Drawing Saved",
        description: "Manual drawing has been saved",
      });

      setNewDrawing({
        drawing_type: 'floor_plan',
        room_area: '',
        title: '',
        description: '',
        ai_generated: false,
        photo_references: [],
        measurements_used: {},
        annotations: [],
      });
      setActiveTab("gallery");
      loadDrawings();

    } catch (error) {
      console.error("Error saving drawing:", error);
      toast({
        title: "Save Failed",
        description: getSafeErrorMessage(error),
        variant: "destructive",
      });
    }
  };

  const deleteDrawing = async (id: string) => {
    try {
      const { error } = await supabase
        .from("technical_drawings")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Drawing Deleted",
        description: "Technical drawing has been removed",
      });
      loadDrawings();
    } catch (error) {
      console.error("Error deleting drawing:", error);
      toast({
        title: "Delete Failed",
        description: getSafeErrorMessage(error),
        variant: "destructive",
      });
    }
  };

  const exportDrawing = (drawing: TechnicalDrawing, format: 'svg' | 'png') => {
    if (!drawing.svg_content) return;

    if (format === 'svg') {
      const blob = new Blob([drawing.svg_content], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${drawing.title.replace(/\s+/g, '_')}.svg`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (format === 'png') {
      // Convert SVG to PNG
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        canvas.width = 800;
        canvas.height = 600;
        ctx?.drawImage(img, 0, 0);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${drawing.title.replace(/\s+/g, '_')}.png`;
            a.click();
            URL.revokeObjectURL(url);
          }
        }, 'image/png');
      };
      
      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(drawing.svg_content)));
    }
  };

  const exportAllAsCAD = () => {
    // Export all drawings as a CAD-ready package
    const cadData = {
      project: "Home Modification Assessment",
      drawings: drawings.map(d => ({
        type: d.drawing_type,
        area: d.room_area,
        title: d.title,
        measurements: d.measurements_used,
        annotations: d.annotations,
        svg: d.svg_content,
      })),
      measurements: measurements,
      exportDate: new Date().toISOString(),
      format: "CAD-Ready JSON",
      notes: "Import into CAD software for detailed editing. SVG files can be opened in AutoCAD, SketchUp, or similar tools.",
    };

    const blob = new Blob([JSON.stringify(cadData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'technical_drawings_cad_export.json';
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "CAD Export Complete",
      description: "All drawings exported in CAD-ready format",
    });
  };

  if (!assessmentId) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">
            Save the assessment first to access technical drawings
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ruler className="h-5 w-5" />
            Technical Drawings
          </CardTitle>
          <CardDescription>
            Generate AI-powered technical drawings or create manual diagrams for your assessment report
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="gallery">
                Gallery ({drawings.length})
              </TabsTrigger>
              <TabsTrigger value="ai-generate">
                <Wand2 className="h-4 w-4 mr-1" />
                AI Generate
              </TabsTrigger>
              <TabsTrigger value="manual">
                <Edit2 className="h-4 w-4 mr-1" />
                Manual Builder
              </TabsTrigger>
            </TabsList>

            <TabsContent value="gallery" className="space-y-4">
              {drawings.length > 0 && (
                <div className="flex justify-end">
                  <Button variant="outline" onClick={exportAllAsCAD}>
                    <Download className="h-4 w-4 mr-2" />
                    Export All (CAD)
                  </Button>
                </div>
              )}

              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : drawings.length === 0 ? (
                <div className="text-center py-8">
                  <FileImage className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">No technical drawings yet</p>
                  <Button onClick={() => setActiveTab("ai-generate")}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Drawing
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {drawings.map((drawing) => (
                    <Card key={drawing.id} className="overflow-hidden">
                      <div className="aspect-video bg-muted relative">
                        {drawing.svg_content ? (
                          <div 
                            className="w-full h-full"
                            dangerouslySetInnerHTML={{ __html: drawing.svg_content }}
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <FileImage className="h-12 w-12 text-muted-foreground" />
                          </div>
                        )}
                        {drawing.ai_generated && (
                          <Badge className="absolute top-2 right-2" variant="secondary">
                            <Wand2 className="h-3 w-3 mr-1" />
                            AI Generated
                          </Badge>
                        )}
                      </div>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium">{drawing.title}</h4>
                            <p className="text-sm text-muted-foreground">
                              {DRAWING_TYPES.find(t => t.value === drawing.drawing_type)?.label} • {drawing.room_area}
                            </p>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => exportDrawing(drawing, 'svg')}
                              title="Export SVG"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteDrawing(drawing.id!)}
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        {drawing.description && (
                          <p className="text-sm text-muted-foreground mt-2">{drawing.description}</p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="ai-generate" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Drawing Type *</Label>
                  <Select
                    value={newDrawing.drawing_type}
                    onValueChange={(value) => setNewDrawing({ ...newDrawing, drawing_type: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {DRAWING_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Room/Area *</Label>
                  <Select
                    value={newDrawing.room_area}
                    onValueChange={(value) => setNewDrawing({ ...newDrawing, room_area: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select area" />
                    </SelectTrigger>
                    <SelectContent>
                      {ROOM_AREAS.map((area) => (
                        <SelectItem key={area} value={area}>
                          {area}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={newDrawing.title || ''}
                  onChange={(e) => setNewDrawing({ ...newDrawing, title: e.target.value })}
                  placeholder="e.g., Bathroom Floor Plan - Current Layout"
                />
              </div>

              <div className="space-y-2">
                <Label>Description / Additional Context</Label>
                <Textarea
                  value={newDrawing.description || ''}
                  onChange={(e) => setNewDrawing({ ...newDrawing, description: e.target.value })}
                  placeholder="Describe existing features, proposed modifications, or any specific requirements..."
                  rows={3}
                />
              </div>

              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Data to be used:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• {measurements.length} measurements from this assessment</li>
                  <li>• {environmentalAreas.length} environmental areas documented</li>
                  <li>• Client mobility requirements from clinical assessment</li>
                  <li>• Photos and descriptions for reference</li>
                </ul>
              </div>

              <Button 
                onClick={generateAIDrawing} 
                disabled={generating || !newDrawing.room_area}
                className="w-full"
              >
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating Drawing...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4 mr-2" />
                    Generate AI Drawing
                  </>
                )}
              </Button>
            </TabsContent>

            <TabsContent value="manual" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <Label>Drawing Type *</Label>
                  <Select
                    value={newDrawing.drawing_type}
                    onValueChange={(value) => setNewDrawing({ ...newDrawing, drawing_type: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {DRAWING_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Room/Area *</Label>
                  <Select
                    value={newDrawing.room_area}
                    onValueChange={(value) => setNewDrawing({ ...newDrawing, room_area: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select area" />
                    </SelectTrigger>
                    <SelectContent>
                      {ROOM_AREAS.map((area) => (
                        <SelectItem key={area} value={area}>
                          {area}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    value={newDrawing.title || ''}
                    onChange={(e) => setNewDrawing({ ...newDrawing, title: e.target.value })}
                    placeholder="Drawing title"
                  />
                </div>
              </div>

              <DiagramBuilder
                roomArea={newDrawing.room_area || 'Room'}
                onSave={saveManualDrawing}
                measurements={measurements}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
