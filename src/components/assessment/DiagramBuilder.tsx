import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { 
  Square, 
  Circle, 
  ArrowRight, 
  Type, 
  Trash2, 
  Save, 
  RotateCcw,
  Ruler,
  DoorOpen,
  Toilet,
  Bath,
  ChefHat,
  Bed,
  Armchair,
  Move
} from "lucide-react";

interface Element {
  id: string;
  type: 'rect' | 'circle' | 'line' | 'text' | 'door' | 'toilet' | 'shower' | 'sink' | 'bed' | 'chair' | 'grab_rail' | 'dimension';
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  text?: string;
  rotation?: number;
  endX?: number;
  endY?: number;
  color?: string;
  measurement?: string;
}

interface DiagramBuilderProps {
  roomArea: string;
  onSave: (svgContent: string) => void;
  measurements: any[];
}

const FIXTURE_TEMPLATES: Record<string, Partial<Element>> = {
  door: { type: 'door', width: 80, height: 20 },
  toilet: { type: 'toilet', width: 45, height: 65 },
  shower: { type: 'shower', width: 90, height: 90 },
  sink: { type: 'sink', width: 50, height: 40 },
  bed: { type: 'bed', width: 150, height: 200 },
  chair: { type: 'chair', width: 60, height: 60 },
  grab_rail: { type: 'grab_rail', width: 60, height: 5 },
};

export default function DiagramBuilder({ roomArea, onSave, measurements }: DiagramBuilderProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [elements, setElements] = useState<Element[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<string>('select');
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [gridSize] = useState(20);
  const [showGrid, setShowGrid] = useState(true);
  const [newText, setNewText] = useState('');
  const [newMeasurement, setNewMeasurement] = useState('');

  const snapToGrid = (value: number) => Math.round(value / gridSize) * gridSize;

  const generateId = () => `el_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const addElement = useCallback((type: string, x = 100, y = 100) => {
    const template = FIXTURE_TEMPLATES[type];
    const newElement: Element = {
      id: generateId(),
      type: template?.type || type as any,
      x: snapToGrid(x),
      y: snapToGrid(y),
      width: template?.width || 80,
      height: template?.height || 80,
      rotation: 0,
      color: '#1a1a1a',
    };

    if (type === 'text') {
      newElement.text = newText || 'Label';
    }
    if (type === 'dimension') {
      newElement.measurement = newMeasurement || '1000mm';
      newElement.endX = x + 100;
      newElement.endY = y;
    }
    if (type === 'circle') {
      newElement.radius = 40;
    }

    setElements([...elements, newElement]);
    setSelectedId(newElement.id);
    setActiveTool('select');
  }, [elements, gridSize, newText, newMeasurement]);

  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return;

    const rect = svg.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (activeTool !== 'select') {
      addElement(activeTool, x, y);
      return;
    }

    // Check if clicking on an element
    const target = e.target as SVGElement;
    const elementId = target.getAttribute('data-element-id');
    
    if (elementId) {
      setSelectedId(elementId);
      const element = elements.find(el => el.id === elementId);
      if (element) {
        setDragOffset({ x: x - element.x, y: y - element.y });
        setIsDragging(true);
      }
    } else {
      setSelectedId(null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isDragging || !selectedId) return;

    const svg = svgRef.current;
    if (!svg) return;

    const rect = svg.getBoundingClientRect();
    const x = snapToGrid(e.clientX - rect.left - dragOffset.x);
    const y = snapToGrid(e.clientY - rect.top - dragOffset.y);

    setElements(elements.map(el => 
      el.id === selectedId ? { ...el, x, y } : el
    ));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const updateElement = (id: string, updates: Partial<Element>) => {
    setElements(elements.map(el => 
      el.id === id ? { ...el, ...updates } : el
    ));
  };

  const deleteSelected = () => {
    if (selectedId) {
      setElements(elements.filter(el => el.id !== selectedId));
      setSelectedId(null);
    }
  };

  const clearAll = () => {
    setElements([]);
    setSelectedId(null);
  };

  const generateSVG = (): string => {
    const svgContent = `<svg viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg">
      <!-- Background -->
      <rect width="800" height="600" fill="#ffffff"/>
      
      <!-- Title -->
      <text x="400" y="30" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#1a1a1a">
        ${roomArea} - Technical Drawing
      </text>
      
      <!-- Scale indicator -->
      <g transform="translate(680, 560)">
        <line x1="0" y1="0" x2="100" y2="0" stroke="#1a1a1a" stroke-width="2"/>
        <line x1="0" y1="-5" x2="0" y2="5" stroke="#1a1a1a" stroke-width="2"/>
        <line x1="100" y1="-5" x2="100" y2="5" stroke="#1a1a1a" stroke-width="2"/>
        <text x="50" y="15" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" fill="#1a1a1a">1000mm</text>
      </g>
      
      <!-- North Arrow -->
      <g transform="translate(750, 80)">
        <polygon points="0,-30 -10,10 0,0 10,10" fill="#1a1a1a"/>
        <text x="0" y="25" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#1a1a1a">N</text>
      </g>
      
      <!-- Elements -->
      ${elements.map(el => renderElementToSVG(el)).join('\n      ')}
      
      <!-- Compliance notes footer -->
      <text x="20" y="580" font-family="Arial, sans-serif" font-size="8" fill="#666">
        Drawing prepared in accordance with AS 1428.1 and LHDS requirements
      </text>
    </svg>`;
    
    return svgContent;
  };

  const renderElementToSVG = (el: Element): string => {
    const transform = el.rotation ? `transform="rotate(${el.rotation}, ${el.x + (el.width || 0)/2}, ${el.y + (el.height || 0)/2})"` : '';
    
    switch (el.type) {
      case 'rect':
        return `<rect x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height}" fill="none" stroke="${el.color || '#1a1a1a'}" stroke-width="2" ${transform}/>`;
      
      case 'circle':
        return `<circle cx="${el.x + (el.radius || 40)}" cy="${el.y + (el.radius || 40)}" r="${el.radius || 40}" fill="none" stroke="${el.color || '#1a1a1a'}" stroke-width="2"/>`;
      
      case 'text':
        return `<text x="${el.x}" y="${el.y}" font-family="Arial, sans-serif" font-size="14" fill="${el.color || '#1a1a1a'}" ${transform}>${el.text || ''}</text>`;
      
      case 'door':
        return `<g ${transform}>
          <rect x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height}" fill="#ffffff" stroke="#1a1a1a" stroke-width="2"/>
          <path d="M${el.x},${el.y} Q${el.x + (el.width || 80)},${el.y - 30} ${el.x + (el.width || 80)},${el.y}" fill="none" stroke="#1a1a1a" stroke-width="1" stroke-dasharray="4,2"/>
        </g>`;
      
      case 'toilet':
        return `<g ${transform}>
          <ellipse cx="${el.x + 22}" cy="${el.y + 45}" rx="18" ry="25" fill="none" stroke="#1a1a1a" stroke-width="2"/>
          <rect x="${el.x}" y="${el.y}" width="45" height="25" rx="5" fill="none" stroke="#1a1a1a" stroke-width="2"/>
        </g>`;
      
      case 'shower':
        return `<g ${transform}>
          <rect x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height}" fill="none" stroke="#1a1a1a" stroke-width="2"/>
          <circle cx="${el.x + (el.width || 90)/2}" cy="${el.y + 20}" r="8" fill="none" stroke="#1a1a1a" stroke-width="1"/>
          <line x1="${el.x + 10}" y1="${el.y}" x2="${el.x + (el.width || 90) - 10}" y2="${el.y}" stroke="#3b82f6" stroke-width="3"/>
        </g>`;
      
      case 'sink':
        return `<g ${transform}>
          <ellipse cx="${el.x + 25}" cy="${el.y + 20}" rx="22" ry="18" fill="none" stroke="#1a1a1a" stroke-width="2"/>
          <circle cx="${el.x + 25}" cy="${el.y + 20}" r="5" fill="none" stroke="#1a1a1a" stroke-width="1"/>
        </g>`;
      
      case 'bed':
        return `<g ${transform}>
          <rect x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height}" fill="none" stroke="#1a1a1a" stroke-width="2"/>
          <rect x="${el.x + 10}" y="${el.y + 10}" width="${(el.width || 150) - 20}" height="40" fill="none" stroke="#1a1a1a" stroke-width="1"/>
        </g>`;
      
      case 'chair':
        return `<g ${transform}>
          <rect x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height}" rx="5" fill="none" stroke="#1a1a1a" stroke-width="2"/>
          <rect x="${el.x + 5}" y="${el.y + 5}" width="${(el.width || 60) - 10}" height="15" fill="none" stroke="#1a1a1a" stroke-width="1"/>
        </g>`;
      
      case 'grab_rail':
        return `<g ${transform}>
          <line x1="${el.x}" y1="${el.y}" x2="${el.x + (el.width || 60)}" y2="${el.y}" stroke="#22c55e" stroke-width="6" stroke-linecap="round"/>
          <circle cx="${el.x}" cy="${el.y}" r="4" fill="#22c55e"/>
          <circle cx="${el.x + (el.width || 60)}" cy="${el.y}" r="4" fill="#22c55e"/>
        </g>`;
      
      case 'dimension':
        return `<g>
          <line x1="${el.x}" y1="${el.y}" x2="${el.endX || el.x + 100}" y2="${el.endY || el.y}" stroke="#3b82f6" stroke-width="1"/>
          <line x1="${el.x}" y1="${el.y - 8}" x2="${el.x}" y2="${el.y + 8}" stroke="#3b82f6" stroke-width="1"/>
          <line x1="${el.endX || el.x + 100}" y1="${(el.endY || el.y) - 8}" x2="${el.endX || el.x + 100}" y2="${(el.endY || el.y) + 8}" stroke="#3b82f6" stroke-width="1"/>
          <text x="${(el.x + (el.endX || el.x + 100))/2}" y="${el.y - 12}" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" fill="#3b82f6">${el.measurement || ''}</text>
        </g>`;
      
      default:
        return '';
    }
  };

  const handleSave = () => {
    const svg = generateSVG();
    onSave(svg);
  };

  const selectedElement = elements.find(el => el.id === selectedId);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 p-2 bg-muted rounded-lg">
        <Button
          variant={activeTool === 'select' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveTool('select')}
        >
          <Move className="h-4 w-4" />
        </Button>
        
        <div className="w-px bg-border mx-1" />
        
        <Button
          variant={activeTool === 'rect' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveTool('rect')}
          title="Wall/Room"
        >
          <Square className="h-4 w-4" />
        </Button>
        <Button
          variant={activeTool === 'circle' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveTool('circle')}
          title="Circle"
        >
          <Circle className="h-4 w-4" />
        </Button>
        
        <div className="w-px bg-border mx-1" />
        
        <Button
          variant={activeTool === 'door' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveTool('door')}
          title="Door"
        >
          <DoorOpen className="h-4 w-4" />
        </Button>
        <Button
          variant={activeTool === 'toilet' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveTool('toilet')}
          title="Toilet"
        >
          <Toilet className="h-4 w-4" />
        </Button>
        <Button
          variant={activeTool === 'shower' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveTool('shower')}
          title="Shower"
        >
          <Bath className="h-4 w-4" />
        </Button>
        <Button
          variant={activeTool === 'sink' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveTool('sink')}
          title="Sink"
        >
          <ChefHat className="h-4 w-4" />
        </Button>
        <Button
          variant={activeTool === 'bed' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveTool('bed')}
          title="Bed"
        >
          <Bed className="h-4 w-4" />
        </Button>
        <Button
          variant={activeTool === 'chair' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveTool('chair')}
          title="Chair"
        >
          <Armchair className="h-4 w-4" />
        </Button>
        <Button
          variant={activeTool === 'grab_rail' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveTool('grab_rail')}
          title="Grab Rail"
          className="bg-green-100 hover:bg-green-200"
        >
          <ArrowRight className="h-4 w-4 text-green-600" />
        </Button>
        
        <div className="w-px bg-border mx-1" />
        
        <Button
          variant={activeTool === 'text' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveTool('text')}
          title="Text Label"
        >
          <Type className="h-4 w-4" />
        </Button>
        <Button
          variant={activeTool === 'dimension' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveTool('dimension')}
          title="Dimension Line"
        >
          <Ruler className="h-4 w-4" />
        </Button>
        
        <div className="flex-1" />
        
        <Button variant="outline" size="sm" onClick={clearAll} title="Clear All">
          <RotateCcw className="h-4 w-4" />
        </Button>
        {selectedId && (
          <Button variant="destructive" size="sm" onClick={deleteSelected} title="Delete Selected">
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
        <Button size="sm" onClick={handleSave}>
          <Save className="h-4 w-4 mr-1" />
          Save Drawing
        </Button>
      </div>

      {/* Text/Dimension input */}
      {(activeTool === 'text' || activeTool === 'dimension') && (
        <div className="flex gap-2 items-center">
          <Label className="whitespace-nowrap">
            {activeTool === 'text' ? 'Label:' : 'Measurement:'}
          </Label>
          <Input
            value={activeTool === 'text' ? newText : newMeasurement}
            onChange={(e) => activeTool === 'text' ? setNewText(e.target.value) : setNewMeasurement(e.target.value)}
            placeholder={activeTool === 'text' ? 'Enter label text' : 'e.g., 850mm'}
            className="max-w-xs"
          />
        </div>
      )}

      {/* Canvas */}
      <div className="border rounded-lg overflow-hidden bg-white">
        <svg
          ref={svgRef}
          viewBox="0 0 800 600"
          className="w-full h-[500px] cursor-crosshair"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Grid */}
          {showGrid && (
            <g>
              {Array.from({ length: 41 }, (_, i) => (
                <line
                  key={`v${i}`}
                  x1={i * gridSize}
                  y1={0}
                  x2={i * gridSize}
                  y2={600}
                  stroke="#e5e5e5"
                  strokeWidth={0.5}
                />
              ))}
              {Array.from({ length: 31 }, (_, i) => (
                <line
                  key={`h${i}`}
                  x1={0}
                  y1={i * gridSize}
                  x2={800}
                  y2={i * gridSize}
                  stroke="#e5e5e5"
                  strokeWidth={0.5}
                />
              ))}
            </g>
          )}

          {/* Render elements */}
          {elements.map((el) => (
            <g key={el.id} data-element-id={el.id} className={selectedId === el.id ? 'opacity-100' : 'opacity-90'}>
              {el.type === 'rect' && (
                <rect
                  data-element-id={el.id}
                  x={el.x}
                  y={el.y}
                  width={el.width}
                  height={el.height}
                  fill="none"
                  stroke={selectedId === el.id ? '#3b82f6' : (el.color || '#1a1a1a')}
                  strokeWidth={selectedId === el.id ? 3 : 2}
                  transform={el.rotation ? `rotate(${el.rotation}, ${el.x + (el.width || 0)/2}, ${el.y + (el.height || 0)/2})` : undefined}
                  className="cursor-move"
                />
              )}
              {el.type === 'circle' && (
                <circle
                  data-element-id={el.id}
                  cx={el.x + (el.radius || 40)}
                  cy={el.y + (el.radius || 40)}
                  r={el.radius || 40}
                  fill="none"
                  stroke={selectedId === el.id ? '#3b82f6' : (el.color || '#1a1a1a')}
                  strokeWidth={selectedId === el.id ? 3 : 2}
                  className="cursor-move"
                />
              )}
              {el.type === 'text' && (
                <text
                  data-element-id={el.id}
                  x={el.x}
                  y={el.y}
                  fill={selectedId === el.id ? '#3b82f6' : (el.color || '#1a1a1a')}
                  fontSize="14"
                  className="cursor-move"
                >
                  {el.text}
                </text>
              )}
              {el.type === 'door' && (
                <g data-element-id={el.id} className="cursor-move">
                  <rect
                    data-element-id={el.id}
                    x={el.x}
                    y={el.y}
                    width={el.width}
                    height={el.height}
                    fill="#ffffff"
                    stroke={selectedId === el.id ? '#3b82f6' : '#1a1a1a'}
                    strokeWidth={2}
                  />
                  <path
                    data-element-id={el.id}
                    d={`M${el.x},${el.y} Q${el.x + (el.width || 80)},${el.y - 30} ${el.x + (el.width || 80)},${el.y}`}
                    fill="none"
                    stroke={selectedId === el.id ? '#3b82f6' : '#1a1a1a'}
                    strokeWidth={1}
                    strokeDasharray="4,2"
                  />
                </g>
              )}
              {el.type === 'toilet' && (
                <g data-element-id={el.id} className="cursor-move">
                  <ellipse
                    data-element-id={el.id}
                    cx={el.x + 22}
                    cy={el.y + 45}
                    rx={18}
                    ry={25}
                    fill="none"
                    stroke={selectedId === el.id ? '#3b82f6' : '#1a1a1a'}
                    strokeWidth={2}
                  />
                  <rect
                    data-element-id={el.id}
                    x={el.x}
                    y={el.y}
                    width={45}
                    height={25}
                    rx={5}
                    fill="none"
                    stroke={selectedId === el.id ? '#3b82f6' : '#1a1a1a'}
                    strokeWidth={2}
                  />
                </g>
              )}
              {el.type === 'shower' && (
                <g data-element-id={el.id} className="cursor-move">
                  <rect
                    data-element-id={el.id}
                    x={el.x}
                    y={el.y}
                    width={el.width}
                    height={el.height}
                    fill="none"
                    stroke={selectedId === el.id ? '#3b82f6' : '#1a1a1a'}
                    strokeWidth={2}
                  />
                  <circle
                    cx={el.x + (el.width || 90)/2}
                    cy={el.y + 20}
                    r={8}
                    fill="none"
                    stroke="#1a1a1a"
                    strokeWidth={1}
                  />
                </g>
              )}
              {el.type === 'sink' && (
                <g data-element-id={el.id} className="cursor-move">
                  <ellipse
                    data-element-id={el.id}
                    cx={el.x + 25}
                    cy={el.y + 20}
                    rx={22}
                    ry={18}
                    fill="none"
                    stroke={selectedId === el.id ? '#3b82f6' : '#1a1a1a'}
                    strokeWidth={2}
                  />
                  <circle
                    cx={el.x + 25}
                    cy={el.y + 20}
                    r={5}
                    fill="none"
                    stroke="#1a1a1a"
                    strokeWidth={1}
                  />
                </g>
              )}
              {el.type === 'bed' && (
                <g data-element-id={el.id} className="cursor-move">
                  <rect
                    data-element-id={el.id}
                    x={el.x}
                    y={el.y}
                    width={el.width}
                    height={el.height}
                    fill="none"
                    stroke={selectedId === el.id ? '#3b82f6' : '#1a1a1a'}
                    strokeWidth={2}
                  />
                  <rect
                    x={el.x + 10}
                    y={el.y + 10}
                    width={(el.width || 150) - 20}
                    height={40}
                    fill="none"
                    stroke="#1a1a1a"
                    strokeWidth={1}
                  />
                </g>
              )}
              {el.type === 'chair' && (
                <g data-element-id={el.id} className="cursor-move">
                  <rect
                    data-element-id={el.id}
                    x={el.x}
                    y={el.y}
                    width={el.width}
                    height={el.height}
                    rx={5}
                    fill="none"
                    stroke={selectedId === el.id ? '#3b82f6' : '#1a1a1a'}
                    strokeWidth={2}
                  />
                </g>
              )}
              {el.type === 'grab_rail' && (
                <g data-element-id={el.id} className="cursor-move">
                  <line
                    data-element-id={el.id}
                    x1={el.x}
                    y1={el.y}
                    x2={el.x + (el.width || 60)}
                    y2={el.y}
                    stroke={selectedId === el.id ? '#3b82f6' : '#22c55e'}
                    strokeWidth={6}
                    strokeLinecap="round"
                  />
                  <circle cx={el.x} cy={el.y} r={4} fill={selectedId === el.id ? '#3b82f6' : '#22c55e'} />
                  <circle cx={el.x + (el.width || 60)} cy={el.y} r={4} fill={selectedId === el.id ? '#3b82f6' : '#22c55e'} />
                </g>
              )}
              {el.type === 'dimension' && (
                <g data-element-id={el.id} className="cursor-move">
                  <line
                    data-element-id={el.id}
                    x1={el.x}
                    y1={el.y}
                    x2={el.endX || el.x + 100}
                    y2={el.endY || el.y}
                    stroke={selectedId === el.id ? '#1d4ed8' : '#3b82f6'}
                    strokeWidth={1}
                  />
                  <line x1={el.x} y1={el.y - 8} x2={el.x} y2={el.y + 8} stroke={selectedId === el.id ? '#1d4ed8' : '#3b82f6'} strokeWidth={1} />
                  <line x1={el.endX || el.x + 100} y1={(el.endY || el.y) - 8} x2={el.endX || el.x + 100} y2={(el.endY || el.y) + 8} stroke={selectedId === el.id ? '#1d4ed8' : '#3b82f6'} strokeWidth={1} />
                  <text
                    x={(el.x + (el.endX || el.x + 100))/2}
                    y={el.y - 12}
                    textAnchor="middle"
                    fontSize="11"
                    fill={selectedId === el.id ? '#1d4ed8' : '#3b82f6'}
                  >
                    {el.measurement}
                  </text>
                </g>
              )}
            </g>
          ))}
        </svg>
      </div>

      {/* Properties Panel */}
      {selectedElement && (
        <div className="p-4 bg-muted rounded-lg space-y-4">
          <h4 className="font-medium">Element Properties</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(selectedElement.width !== undefined) && (
              <div className="space-y-2">
                <Label>Width</Label>
                <Input
                  type="number"
                  value={selectedElement.width}
                  onChange={(e) => updateElement(selectedElement.id, { width: parseInt(e.target.value) || 0 })}
                />
              </div>
            )}
            {(selectedElement.height !== undefined) && (
              <div className="space-y-2">
                <Label>Height</Label>
                <Input
                  type="number"
                  value={selectedElement.height}
                  onChange={(e) => updateElement(selectedElement.id, { height: parseInt(e.target.value) || 0 })}
                />
              </div>
            )}
            {(selectedElement.radius !== undefined) && (
              <div className="space-y-2">
                <Label>Radius</Label>
                <Input
                  type="number"
                  value={selectedElement.radius}
                  onChange={(e) => updateElement(selectedElement.id, { radius: parseInt(e.target.value) || 0 })}
                />
              </div>
            )}
            {(selectedElement.rotation !== undefined) && (
              <div className="space-y-2">
                <Label>Rotation: {selectedElement.rotation}°</Label>
                <Slider
                  value={[selectedElement.rotation]}
                  min={0}
                  max={360}
                  step={15}
                  onValueChange={(value) => updateElement(selectedElement.id, { rotation: value[0] })}
                />
              </div>
            )}
            {selectedElement.text !== undefined && (
              <div className="space-y-2 col-span-2">
                <Label>Text</Label>
                <Input
                  value={selectedElement.text}
                  onChange={(e) => updateElement(selectedElement.id, { text: e.target.value })}
                />
              </div>
            )}
            {selectedElement.measurement !== undefined && (
              <div className="space-y-2 col-span-2">
                <Label>Measurement</Label>
                <Input
                  value={selectedElement.measurement}
                  onChange={(e) => updateElement(selectedElement.id, { measurement: e.target.value })}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick Measurements from Assessment */}
      {measurements.length > 0 && (
        <div className="p-4 bg-muted/50 rounded-lg">
          <h4 className="font-medium mb-2">Available Measurements</h4>
          <div className="flex flex-wrap gap-2">
            {measurements.slice(0, 10).map((m: any, i: number) => (
              <Button
                key={i}
                variant="outline"
                size="sm"
                onClick={() => {
                  setNewMeasurement(`${m.value_mm}mm`);
                  setActiveTool('dimension');
                }}
              >
                {m.measurement_type}: {m.value_mm}mm
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
