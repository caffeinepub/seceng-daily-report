import { useState, useRef, useCallback, useEffect } from "react";
import { Camera, FileText, Plus, Trash2, X, Upload, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { generatePDF, ReportData } from "../utils/pdfGenerator";

interface SitePhoto {
  id: string;
  dataUrl: string;
  name: string;
}

interface PersonnelEntry {
  id: string;
  name: string;
  role: string;
  hours: string;
}

interface WorkItem {
  id: string;
  description: string;
  status: string;
  notes: string;
}

interface FormData {
  projectName: string;
  projectNumber: string;
  date: string;
  weather: string;
  temperature: string;
  reportNumber: string;
  preparedBy: string;
  locationContact: string;
  pointOfContact: string;
  projectManager: string;
  siteAddress: string;
  clientName: string;
  personnel: PersonnelEntry[];
  workItems: WorkItem[];
  safetyNotes: string;
  generalNotes: string;
  sitePhotos: SitePhoto[];
}

const STORAGE_KEY = "daily_report_form_data";

const defaultFormData: FormData = {
  projectName: "",
  projectNumber: "",
  date: new Date().toISOString().split("T")[0],
  weather: "",
  temperature: "",
  reportNumber: "",
  preparedBy: "",
  locationContact: "",
  pointOfContact: "",
  projectManager: "",
  siteAddress: "",
  clientName: "",
  personnel: [{ id: crypto.randomUUID(), name: "", role: "", hours: "" }],
  workItems: [{ id: crypto.randomUUID(), description: "", status: "In Progress", notes: "" }],
  safetyNotes: "",
  generalNotes: "",
  sitePhotos: [],
};

function loadFromStorage(): FormData {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...defaultFormData, ...parsed };
    }
  } catch {
    // ignore
  }
  return defaultFormData;
}

export default function ReportForm() {
  const [formData, setFormData] = useState<FormData>(loadFromStorage);
  const [signature, setSignature] = useState<string>("");
  const [isDrawing, setIsDrawing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [photoError, setPhotoError] = useState<string>("");

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  // Persist form data to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
    } catch {
      // Storage quota exceeded - ignore
    }
  }, [formData]);

  const updateField = useCallback(<K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  // Personnel handlers
  const addPersonnel = () => {
    setFormData((prev) => ({
      ...prev,
      personnel: [...prev.personnel, { id: crypto.randomUUID(), name: "", role: "", hours: "" }],
    }));
  };

  const removePersonnel = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      personnel: prev.personnel.filter((p) => p.id !== id),
    }));
  };

  const updatePersonnel = (id: string, field: keyof PersonnelEntry, value: string) => {
    setFormData((prev) => ({
      ...prev,
      personnel: prev.personnel.map((p) => (p.id === id ? { ...p, [field]: value } : p)),
    }));
  };

  // Work item handlers
  const addWorkItem = () => {
    setFormData((prev) => ({
      ...prev,
      workItems: [
        ...prev.workItems,
        { id: crypto.randomUUID(), description: "", status: "In Progress", notes: "" },
      ],
    }));
  };

  const removeWorkItem = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      workItems: prev.workItems.filter((w) => w.id !== id),
    }));
  };

  const updateWorkItem = (id: string, field: keyof WorkItem, value: string) => {
    setFormData((prev) => ({
      ...prev,
      workItems: prev.workItems.map((w) => (w.id === id ? { ...w, [field]: value } : w)),
    }));
  };

  // Site photo handlers
  const handlePhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhotoError("");
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const maxPhotos = 20;
    const currentCount = formData.sitePhotos.length;
    const remaining = maxPhotos - currentCount;

    if (remaining <= 0) {
      setPhotoError(`Maximum ${maxPhotos} photos allowed.`);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const filesToProcess = files.slice(0, remaining);
    if (files.length > remaining) {
      setPhotoError(`Only ${remaining} more photo(s) can be added (max ${maxPhotos}).`);
    }

    filesToProcess.forEach((file) => {
      if (!file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string;
        if (!dataUrl) return;
        const newPhoto: SitePhoto = {
          id: crypto.randomUUID(),
          dataUrl,
          name: file.name,
        };
        setFormData((prev) => ({
          ...prev,
          sitePhotos: [...prev.sitePhotos, newPhoto],
        }));
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removePhoto = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      sitePhotos: prev.sitePhotos.filter((p) => p.id !== id),
    }));
    setPhotoError("");
  };

  const clearAllPhotos = () => {
    setFormData((prev) => ({ ...prev, sitePhotos: [] }));
    setPhotoError("");
  };

  // Signature canvas handlers
  const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    return {
      x: (e as React.MouseEvent).clientX - rect.left,
      y: (e as React.MouseEvent).clientY - rect.top,
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    setIsDrawing(true);
    lastPos.current = getPos(e, canvas);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const pos = getPos(e, canvas);
    if (lastPos.current) {
      ctx.beginPath();
      ctx.moveTo(lastPos.current.x, lastPos.current.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.strokeStyle = "#f5c518";
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.stroke();
    }
    lastPos.current = pos;
  };

  const stopDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDrawing(false);
    lastPos.current = null;
    const canvas = canvasRef.current;
    if (canvas) {
      setSignature(canvas.toDataURL());
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignature("");
  };

  const handleGeneratePDF = async () => {
    setIsGenerating(true);
    try {
      const reportData: ReportData = {
        projectName: formData.projectName,
        projectNumber: formData.projectNumber,
        date: formData.date,
        weather: formData.weather,
        temperature: formData.temperature,
        reportNumber: formData.reportNumber,
        preparedBy: formData.preparedBy,
        locationContact: formData.locationContact,
        pointOfContact: formData.pointOfContact,
        projectManager: formData.projectManager,
        siteAddress: formData.siteAddress,
        clientName: formData.clientName,
        personnel: formData.personnel.map((p) => ({
          name: p.name,
          role: p.role,
          hours: p.hours,
        })),
        workItems: formData.workItems.map((w) => ({
          description: w.description,
          status: w.status,
          notes: w.notes,
        })),
        safetyNotes: formData.safetyNotes,
        generalNotes: formData.generalNotes,
        signature: signature || undefined,
        sitePhotos: formData.sitePhotos.map((p) => p.dataUrl),
      };
      await generatePDF(reportData);
    } catch (err) {
      console.error("PDF generation failed:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClearForm = () => {
    if (window.confirm("Clear all form data? This cannot be undone.")) {
      setFormData({ ...defaultFormData, date: new Date().toISOString().split("T")[0] });
      clearSignature();
      setPhotoError("");
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Project Information */}
      <section className="bg-surface border border-border rounded-lg p-6 space-y-4">
        <h2 className="text-lg font-bold font-display text-foreground uppercase tracking-wider flex items-center gap-2">
          <FileText className="w-5 h-5 text-accent-yellow" />
          Project Information
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="projectName">Project Name</Label>
            <Input
              id="projectName"
              value={formData.projectName}
              onChange={(e) => updateField("projectName", e.target.value)}
              placeholder="Enter project name"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="projectNumber">Project Number</Label>
            <Input
              id="projectNumber"
              value={formData.projectNumber}
              onChange={(e) => updateField("projectNumber", e.target.value)}
              placeholder="e.g. PRJ-2024-001"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="clientName">Client Name</Label>
            <Input
              id="clientName"
              value={formData.clientName}
              onChange={(e) => updateField("clientName", e.target.value)}
              placeholder="Enter client name"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="siteAddress">Site Address</Label>
            <Input
              id="siteAddress"
              value={formData.siteAddress}
              onChange={(e) => updateField("siteAddress", e.target.value)}
              placeholder="Enter site address"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => updateField("date", e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="reportNumber">Report Number</Label>
            <Input
              id="reportNumber"
              value={formData.reportNumber}
              onChange={(e) => updateField("reportNumber", e.target.value)}
              placeholder="e.g. DR-001"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="weather">Weather</Label>
            <Input
              id="weather"
              value={formData.weather}
              onChange={(e) => updateField("weather", e.target.value)}
              placeholder="e.g. Sunny, Cloudy"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="temperature">Temperature</Label>
            <Input
              id="temperature"
              value={formData.temperature}
              onChange={(e) => updateField("temperature", e.target.value)}
              placeholder="e.g. 72°F"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="preparedBy">Prepared By</Label>
            <Input
              id="preparedBy"
              value={formData.preparedBy}
              onChange={(e) => updateField("preparedBy", e.target.value)}
              placeholder="Your name"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="locationContact">Location Contact</Label>
            <Input
              id="locationContact"
              value={formData.locationContact}
              onChange={(e) => updateField("locationContact", e.target.value)}
              placeholder="On-site location contact"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="pointOfContact">Point of Contact</Label>
            <Input
              id="pointOfContact"
              value={formData.pointOfContact}
              onChange={(e) => updateField("pointOfContact", e.target.value)}
              placeholder="Primary point of contact name"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="projectManager">Project Manager</Label>
            <Input
              id="projectManager"
              value={formData.projectManager}
              onChange={(e) => updateField("projectManager", e.target.value)}
              placeholder="Project manager name"
            />
          </div>
        </div>
      </section>

      {/* Technical Team / Personnel */}
      <section className="bg-surface border border-border rounded-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold font-display text-foreground uppercase tracking-wider">
            Technical Team
          </h2>
          <Button variant="outline" size="sm" onClick={addPersonnel} className="gap-1">
            <Plus className="w-4 h-4" /> Add Member
          </Button>
        </div>
        <div className="space-y-3">
          {formData.personnel.map((person) => (
            <div key={person.id} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
              <div className="space-y-1">
                <Label>Name</Label>
                <Input
                  value={person.name}
                  onChange={(e) => updatePersonnel(person.id, "name", e.target.value)}
                  placeholder="Full name"
                />
              </div>
              <div className="space-y-1">
                <Label>Role</Label>
                <Input
                  value={person.role}
                  onChange={(e) => updatePersonnel(person.id, "role", e.target.value)}
                  placeholder="e.g. Engineer"
                />
              </div>
              <div className="flex gap-2 items-end">
                <div className="flex-1 space-y-1">
                  <Label>Hours</Label>
                  <Input
                    value={person.hours}
                    onChange={(e) => updatePersonnel(person.id, "hours", e.target.value)}
                    placeholder="e.g. 8"
                  />
                </div>
                {formData.personnel.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removePersonnel(person.id)}
                    className="text-destructive hover:text-destructive mb-0.5"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Work Items */}
      <section className="bg-surface border border-border rounded-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold font-display text-foreground uppercase tracking-wider">
            Work Performed
          </h2>
          <Button variant="outline" size="sm" onClick={addWorkItem} className="gap-1">
            <Plus className="w-4 h-4" /> Add Item
          </Button>
        </div>
        <div className="space-y-4">
          {formData.workItems.map((item) => (
            <div key={item.id} className="border border-border rounded-md p-4 space-y-3">
              <div className="flex justify-between items-start gap-2">
                <div className="flex-1 space-y-1">
                  <Label>Description</Label>
                  <Textarea
                    value={item.description}
                    onChange={(e) => updateWorkItem(item.id, "description", e.target.value)}
                    placeholder="Describe the work performed..."
                    rows={2}
                  />
                </div>
                {formData.workItems.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeWorkItem(item.id)}
                    className="text-destructive hover:text-destructive mt-6"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Status</Label>
                  <select
                    value={item.status}
                    onChange={(e) => updateWorkItem(item.id, "status", e.target.value)}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option>In Progress</option>
                    <option>Completed</option>
                    <option>Pending</option>
                    <option>On Hold</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label>Notes</Label>
                  <Input
                    value={item.notes}
                    onChange={(e) => updateWorkItem(item.id, "notes", e.target.value)}
                    placeholder="Additional notes..."
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Safety & General Notes */}
      <section className="bg-surface border border-border rounded-lg p-6 space-y-4">
        <h2 className="text-lg font-bold font-display text-foreground uppercase tracking-wider">
          Notes
        </h2>
        <div className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="safetyNotes">Safety Notes</Label>
            <Textarea
              id="safetyNotes"
              value={formData.safetyNotes}
              onChange={(e) => updateField("safetyNotes", e.target.value)}
              placeholder="Document any safety observations, incidents, or precautions..."
              rows={3}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="generalNotes">General Notes</Label>
            <Textarea
              id="generalNotes"
              value={formData.generalNotes}
              onChange={(e) => updateField("generalNotes", e.target.value)}
              placeholder="Any additional notes or observations..."
              rows={3}
            />
          </div>
        </div>
      </section>

      {/* Site Photos */}
      <section className="bg-surface border border-border rounded-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold font-display text-foreground uppercase tracking-wider flex items-center gap-2">
            <Camera className="w-5 h-5 text-accent-yellow" />
            Site Photos
            {formData.sitePhotos.length > 0 && (
              <span className="text-sm font-normal text-muted-foreground normal-case tracking-normal">
                ({formData.sitePhotos.length}/20)
              </span>
            )}
          </h2>
          <div className="flex gap-2">
            {formData.sitePhotos.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllPhotos}
                className="text-destructive hover:text-destructive gap-1"
              >
                <X className="w-4 h-4" /> Clear All
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="gap-1"
              disabled={formData.sitePhotos.length >= 20}
            >
              <Upload className="w-4 h-4" /> Upload Photos
            </Button>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handlePhotoFileChange}
        />

        {photoError && (
          <p className="text-sm text-destructive">{photoError}</p>
        )}

        {formData.sitePhotos.length === 0 ? (
          <div
            className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-accent-yellow transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <ImageIcon className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              Click to upload site photos, or drag and drop
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              PNG, JPG, WEBP up to 20 photos
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {formData.sitePhotos.map((photo) => (
              <div key={photo.id} className="relative group aspect-square rounded-md overflow-hidden border border-border">
                <img
                  src={photo.dataUrl}
                  alt={photo.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removePhoto(photo.id)}
                    className="text-white hover:text-destructive hover:bg-transparent"
                  >
                    <Trash2 className="w-5 h-5" />
                  </Button>
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-1.5 py-0.5">
                  <p className="text-xs text-white truncate">{photo.name}</p>
                </div>
              </div>
            ))}
            {formData.sitePhotos.length < 20 && (
              <div
                className="aspect-square rounded-md border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-accent-yellow transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Plus className="w-6 h-6 text-muted-foreground" />
              </div>
            )}
          </div>
        )}
      </section>

      {/* Signature */}
      <section className="bg-surface border border-border rounded-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold font-display text-foreground uppercase tracking-wider">
            Signature
          </h2>
          <Button variant="ghost" size="sm" onClick={clearSignature} className="text-muted-foreground gap-1">
            <X className="w-4 h-4" /> Clear
          </Button>
        </div>
        <div className="signature-container rounded-md overflow-hidden border border-border">
          <canvas
            ref={canvasRef}
            width={600}
            height={150}
            className="w-full touch-none cursor-crosshair"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
        </div>
        <p className="text-xs text-muted-foreground">Draw your signature above using mouse or touch.</p>
      </section>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 justify-end pb-4">
        <Button
          variant="outline"
          onClick={handleClearForm}
          className="gap-2"
        >
          <Trash2 className="w-4 h-4" />
          Clear Form
        </Button>
        <Button
          onClick={handleGeneratePDF}
          disabled={isGenerating}
          className="gap-2 btn-primary"
        >
          {isGenerating ? (
            <>
              <span className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
              Generating PDF...
            </>
          ) : (
            <>
              <FileText className="w-4 h-4" />
              Generate PDF Report
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
