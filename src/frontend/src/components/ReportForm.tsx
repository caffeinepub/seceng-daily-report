import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  CheckCircle,
  ChevronDown,
  Clock,
  FileText,
  FolderOpen,
  ImageIcon,
  Plus,
  Save,
  Trash2,
  Upload,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { type ReportData, generatePDF } from "../utils/pdfGenerator";

interface SitePhoto {
  id: string;
  dataUrl: string;
  name: string;
}

interface PersonnelEntry {
  id: string;
  leadTechnician: string;
  assistantTechnicians: string;
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

interface SavedEntry {
  id: string;
  label: string;
  timestamp: string;
  formData: FormData;
  signature: string;
}

const STORAGE_KEY = "daily_report_form_data";
const ENTRIES_KEY = "fieldReportEntries";

const defaultFormData: FormData = {
  projectName: "",
  projectNumber: "",
  pointOfContact: "",
  projectManager: "",
  siteAddress: "",
  clientName: "",
  personnel: [
    { id: crypto.randomUUID(), leadTechnician: "", assistantTechnicians: "" },
  ],
  workItems: [
    {
      id: crypto.randomUUID(),
      description: "",
      status: "In Progress",
      notes: "",
    },
  ],
  safetyNotes: "",
  generalNotes: "",
  sitePhotos: [],
};

function loadFromStorage(): FormData {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (
        parsed.personnel &&
        parsed.personnel.length > 0 &&
        "name" in parsed.personnel[0]
      ) {
        parsed.personnel = parsed.personnel.map(
          (p: { id: string; name?: string; role?: string }) => ({
            id: p.id,
            leadTechnician: p.name || "",
            assistantTechnicians: "",
          }),
        );
      }
      return { ...defaultFormData, ...parsed };
    }
  } catch {
    // ignore
  }
  return defaultFormData;
}

function loadSavedEntries(): SavedEntry[] {
  try {
    const saved = localStorage.getItem(ENTRIES_KEY);
    if (saved) {
      return JSON.parse(saved) as SavedEntry[];
    }
  } catch {
    // ignore
  }
  return [];
}

function saveSavedEntries(entries: SavedEntry[]) {
  try {
    localStorage.setItem(ENTRIES_KEY, JSON.stringify(entries));
  } catch {
    // Storage quota exceeded - ignore
  }
}

function formatEntryLabel(formData: FormData, timestamp: string): string {
  const date = new Date(timestamp);
  const dateStr = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const timeStr = date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const project = formData.projectName.trim() || "Untitled Project";
  return `${dateStr} ${timeStr} — ${project}`;
}

function isFormEmpty(formData: FormData): boolean {
  return (
    !formData.projectName.trim() &&
    !formData.projectNumber.trim() &&
    !formData.clientName.trim() &&
    !formData.siteAddress.trim() &&
    !formData.pointOfContact.trim() &&
    !formData.projectManager.trim() &&
    !formData.safetyNotes.trim() &&
    !formData.generalNotes.trim() &&
    formData.sitePhotos.length === 0 &&
    formData.personnel.every(
      (p) => !p.leadTechnician.trim() && !p.assistantTechnicians.trim(),
    ) &&
    formData.workItems.every((w) => !w.description.trim() && !w.notes.trim())
  );
}

export default function ReportForm() {
  const [formData, setFormData] = useState<FormData>(loadFromStorage);
  const [signature, setSignature] = useState<string>("");
  const [isDrawing, setIsDrawing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [photoError, setPhotoError] = useState<string>("");
  const [savedEntries, setSavedEntries] =
    useState<SavedEntry[]>(loadSavedEntries);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [hasAutoLoaded, setHasAutoLoaded] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  // Auto-load most recent entry on first mount
  useEffect(() => {
    if (hasAutoLoaded) return;
    setHasAutoLoaded(true);
    const entries = loadSavedEntries();
    if (entries.length > 0) {
      const mostRecent = entries[entries.length - 1];
      setFormData(mostRecent.formData);
      // Restore signature to canvas after mount
      if (mostRecent.signature) {
        setSignature(mostRecent.signature);
        // Draw signature on canvas after a short delay to ensure canvas is mounted
        setTimeout(() => {
          const canvas = canvasRef.current;
          if (!canvas) return;
          const ctx = canvas.getContext("2d");
          if (!ctx) return;
          const img = new Image();
          img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
          };
          img.src = mostRecent.signature;
        }, 100);
      }
    }
  }, [hasAutoLoaded]);

  // Persist current form data to localStorage (draft)
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
    } catch {
      // Storage quota exceeded - ignore
    }
  }, [formData]);

  const updateField = useCallback(
    <K extends keyof FormData>(field: K, value: FormData[K]) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  // Save current entry to history
  const handleSaveEntry = () => {
    const timestamp = new Date().toISOString();
    const label = formatEntryLabel(formData, timestamp);
    const newEntry: SavedEntry = {
      id: crypto.randomUUID(),
      label,
      timestamp,
      formData: { ...formData },
      signature,
    };
    const updated = [...savedEntries, newEntry];
    setSavedEntries(updated);
    saveSavedEntries(updated);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  // Load a saved entry into the form
  const handleLoadEntry = (entry: SavedEntry) => {
    const hasContent = !isFormEmpty(formData);
    if (hasContent) {
      if (
        !window.confirm(
          `Load "${entry.label}"?\n\nThis will replace your current unsaved form data.`,
        )
      ) {
        return;
      }
    }
    setFormData(entry.formData);
    setSignature(entry.signature || "");
    // Restore signature on canvas
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (entry.signature) {
          const img = new Image();
          img.onload = () => {
            ctx.drawImage(img, 0, 0);
          };
          img.src = entry.signature;
        }
      }
    }
  };

  // Delete a saved entry
  const handleDeleteEntry = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedEntries.filter((en) => en.id !== id);
    setSavedEntries(updated);
    saveSavedEntries(updated);
  };

  // Personnel handlers
  const addPersonnel = () => {
    setFormData((prev) => ({
      ...prev,
      personnel: [
        ...prev.personnel,
        {
          id: crypto.randomUUID(),
          leadTechnician: "",
          assistantTechnicians: "",
        },
      ],
    }));
  };

  const removePersonnel = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      personnel: prev.personnel.filter((p) => p.id !== id),
    }));
  };

  const updatePersonnel = (
    id: string,
    field: keyof PersonnelEntry,
    value: string,
  ) => {
    setFormData((prev) => ({
      ...prev,
      personnel: prev.personnel.map((p) =>
        p.id === id ? { ...p, [field]: value } : p,
      ),
    }));
  };

  // Work item handlers
  const addWorkItem = () => {
    setFormData((prev) => ({
      ...prev,
      workItems: [
        ...prev.workItems,
        {
          id: crypto.randomUUID(),
          description: "",
          status: "In Progress",
          notes: "",
        },
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
      workItems: prev.workItems.map((w) =>
        w.id === id ? { ...w, [field]: value } : w,
      ),
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
      setPhotoError(
        `Only ${remaining} more photo(s) can be added (max ${maxPhotos}).`,
      );
    }

    for (const file of filesToProcess) {
      if (!file.type.startsWith("image/")) continue;
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
    }

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
  const getPos = (
    e: React.MouseEvent | React.TouchEvent,
    canvas: HTMLCanvasElement,
  ) => {
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
        pointOfContact: formData.pointOfContact,
        projectManager: formData.projectManager,
        siteAddress: formData.siteAddress,
        clientName: formData.clientName,
        personnel: formData.personnel.map((p) => ({
          leadTechnician: p.leadTechnician,
          assistantTechnicians: p.assistantTechnicians,
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
      setFormData({
        ...defaultFormData,
        personnel: [
          {
            id: crypto.randomUUID(),
            leadTechnician: "",
            assistantTechnicians: "",
          },
        ],
        workItems: [
          {
            id: crypto.randomUUID(),
            description: "",
            status: "In Progress",
            notes: "",
          },
        ],
      });
      clearSignature();
      setPhotoError("");
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Previous Entries + Save Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-surface border border-border rounded-lg px-4 py-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <FolderOpen className="w-4 h-4 text-accent-yellow shrink-0" />
          <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Saved Reports
          </span>
          {savedEntries.length > 0 && (
            <span className="text-xs bg-accent-yellow/20 text-accent-yellow border border-accent-yellow/30 rounded-full px-2 py-0.5 font-mono">
              {savedEntries.length}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Previous Entries Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 border-border text-foreground"
                disabled={savedEntries.length === 0}
              >
                <Clock className="w-3.5 h-3.5" />
                Load Entry
                <ChevronDown className="w-3.5 h-3.5 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-80 max-h-72 overflow-y-auto bg-surface border-border"
            >
              <DropdownMenuLabel className="text-xs text-muted-foreground uppercase tracking-wider">
                Previous Entries ({savedEntries.length})
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {savedEntries.length === 0 ? (
                <div className="px-3 py-4 text-sm text-muted-foreground text-center">
                  No saved entries yet
                </div>
              ) : (
                [...savedEntries].reverse().map((entry) => (
                  <DropdownMenuItem
                    key={entry.id}
                    className="flex items-start justify-between gap-2 cursor-pointer py-2.5 group"
                    onSelect={() => handleLoadEntry(entry)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground truncate">
                        {entry.formData.projectName || "Untitled Project"}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {new Date(entry.timestamp).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}{" "}
                        at{" "}
                        {new Date(entry.timestamp).toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                      {entry.formData.projectNumber && (
                        <div className="text-xs text-accent-yellow/80 mt-0.5">
                          #{entry.formData.projectNumber}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteEntry(entry.id, e)}
                      className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive p-0.5 rounded"
                      title="Delete entry"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Save Button */}
          <Button
            size="sm"
            onClick={handleSaveEntry}
            className={`gap-1.5 transition-all ${
              saveSuccess
                ? "bg-green-700 hover:bg-green-700 text-white border-green-600"
                : "bg-accent-yellow hover:bg-accent-orange text-background border-transparent"
            }`}
          >
            {saveSuccess ? (
              <>
                <CheckCircle className="w-3.5 h-3.5" />
                Saved!
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                Save Entry
              </>
            )}
          </Button>
        </div>
      </div>

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
          <Button
            variant="outline"
            size="sm"
            onClick={addPersonnel}
            className="gap-1"
          >
            <Plus className="w-4 h-4" /> Add Member
          </Button>
        </div>
        <div className="space-y-3">
          {formData.personnel.map((person) => (
            <div
              key={person.id}
              className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end"
            >
              <div className="space-y-1">
                <Label>Lead Technician</Label>
                <Input
                  value={person.leadTechnician}
                  onChange={(e) =>
                    updatePersonnel(person.id, "leadTechnician", e.target.value)
                  }
                  placeholder="Lead technician name"
                />
              </div>
              <div className="flex gap-2 items-end">
                <div className="flex-1 space-y-1">
                  <Label>Assistant Technicians</Label>
                  <Input
                    value={person.assistantTechnicians}
                    onChange={(e) =>
                      updatePersonnel(
                        person.id,
                        "assistantTechnicians",
                        e.target.value,
                      )
                    }
                    placeholder="Assistant technician name(s)"
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
          <Button
            variant="outline"
            size="sm"
            onClick={addWorkItem}
            className="gap-1"
          >
            <Plus className="w-4 h-4" /> Add Item
          </Button>
        </div>
        <div className="space-y-4">
          {formData.workItems.map((item) => (
            <div
              key={item.id}
              className="border border-border rounded-md p-4 space-y-3"
            >
              <div className="flex justify-between items-start gap-2">
                <div className="flex-1 space-y-1">
                  <Label>Description</Label>
                  <Textarea
                    value={item.description}
                    onChange={(e) =>
                      updateWorkItem(item.id, "description", e.target.value)
                    }
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
                    onChange={(e) =>
                      updateWorkItem(item.id, "status", e.target.value)
                    }
                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Pending">Pending</option>
                    <option value="On Hold">On Hold</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label>Notes</Label>
                  <Input
                    value={item.notes}
                    onChange={(e) =>
                      updateWorkItem(item.id, "notes", e.target.value)
                    }
                    placeholder="Additional notes..."
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Safety Notes */}
      <section className="bg-surface border border-border rounded-lg p-6 space-y-4">
        <h2 className="text-lg font-bold font-display text-foreground uppercase tracking-wider">
          Safety Notes
        </h2>
        <Textarea
          value={formData.safetyNotes}
          onChange={(e) => updateField("safetyNotes", e.target.value)}
          placeholder="Document any safety observations, incidents, or precautions taken..."
          rows={4}
        />
      </section>

      {/* General Notes */}
      <section className="bg-surface border border-border rounded-lg p-6 space-y-4">
        <h2 className="text-lg font-bold font-display text-foreground uppercase tracking-wider">
          General Notes
        </h2>
        <Textarea
          value={formData.generalNotes}
          onChange={(e) => updateField("generalNotes", e.target.value)}
          placeholder="Any additional notes or observations..."
          rows={4}
        />
      </section>

      {/* Site Photos */}
      <section className="bg-surface border border-border rounded-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold font-display text-foreground uppercase tracking-wider flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-accent-yellow" />
            Site Photos
          </h2>
          {formData.sitePhotos.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllPhotos}
              className="text-destructive hover:text-destructive"
            >
              Clear All
            </Button>
          )}
        </div>

        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handlePhotoFileChange}
          />
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="gap-2 w-full sm:w-auto"
            disabled={formData.sitePhotos.length >= 20}
          >
            <Upload className="w-4 h-4" />
            Upload Photos
            {formData.sitePhotos.length > 0 && (
              <span className="text-muted-foreground text-xs">
                ({formData.sitePhotos.length}/20)
              </span>
            )}
          </Button>
          {photoError && (
            <p className="text-destructive text-sm mt-2">{photoError}</p>
          )}
        </div>

        {formData.sitePhotos.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {formData.sitePhotos.map((photo) => (
              <div
                key={photo.id}
                className="relative group rounded-md overflow-hidden border border-border aspect-square"
              >
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
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-white text-xs truncate">{photo.name}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Signature */}
      <section className="bg-surface border border-border rounded-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold font-display text-foreground uppercase tracking-wider">
            Signature
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearSignature}
            className="text-muted-foreground hover:text-foreground"
          >
            Clear
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
        <p className="text-xs text-muted-foreground">
          Sign above using mouse or touch
        </p>
      </section>

      {/* Actions */}
      <section className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center pb-4">
        <Button
          variant="ghost"
          onClick={handleClearForm}
          className="text-muted-foreground hover:text-destructive order-2 sm:order-1"
        >
          Clear Form
        </Button>

        <div className="flex flex-col sm:flex-row gap-3 order-1 sm:order-2">
          {/* Save Entry button (also in actions area for visibility) */}
          <Button
            variant="outline"
            onClick={handleSaveEntry}
            className={`gap-2 transition-all ${
              saveSuccess
                ? "border-green-600 text-green-400"
                : "border-accent-yellow/50 text-accent-yellow hover:border-accent-yellow hover:bg-accent-yellow/10"
            }`}
          >
            {saveSuccess ? (
              <>
                <CheckCircle className="w-4 h-4" />
                Saved!
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Entry
              </>
            )}
          </Button>

          <Button
            onClick={handleGeneratePDF}
            disabled={isGenerating}
            className="btn-primary gap-2"
          >
            {isGenerating ? (
              <>
                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4" />
                Generate PDF
              </>
            )}
          </Button>
        </div>
      </section>
    </div>
  );
}
