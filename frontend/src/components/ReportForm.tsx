import { useState, useRef, useEffect, useCallback } from "react";
import { generatePDF } from "../utils/pdfGenerator";

interface FormState {
  // Project Information
  projectName: string;
  projectNumber: string;
  projectAddress: string;
  projectManager: string;
  locationContact: string;
  reportDate: string;
  reportNumber: string;
  weatherConditions: string;
  temperature: string;

  // Technical Team
  personnel: Array<{
    id: string;
    name: string;
    role: string;
    hoursWorked: string;
    company: string;
  }>;

  // Work Performed
  workPerformed: string;

  // Materials Used
  materialsUsed: Array<{
    id: string;
    description: string;
    quantity: string;
    unit: string;
  }>;

  // Equipment Used
  equipmentUsed: Array<{
    id: string;
    description: string;
    quantity: string;
    hours: string;
  }>;

  // Safety Observations
  safetyObservations: string;
  incidents: string;
  nearMisses: string;

  // Issues and Delays
  issuesDelays: string;

  // Visitors
  visitors: Array<{
    id: string;
    name: string;
    company: string;
    purpose: string;
    timeIn: string;
    timeOut: string;
  }>;

  // Site Photos
  sitePhotos: Array<{
    id: string;
    file: File;
    caption: string;
    preview: string;
  }>;

  // Signature
  signatureData: string;
  signatoryName: string;
  signatoryTitle: string;
}

const defaultFormState: FormState = {
  projectName: "",
  projectNumber: "",
  projectAddress: "",
  projectManager: "",
  locationContact: "",
  reportDate: new Date().toISOString().split("T")[0],
  reportNumber: "",
  weatherConditions: "",
  temperature: "",
  personnel: [],
  workPerformed: "",
  materialsUsed: [],
  equipmentUsed: [],
  safetyObservations: "",
  incidents: "",
  nearMisses: "",
  issuesDelays: "",
  visitors: [],
  sitePhotos: [],
  signatureData: "",
  signatoryName: "",
  signatoryTitle: "",
};

function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

export default function ReportForm() {
  const [formState, setFormState] = useState<FormState>(() => {
    try {
      const saved = localStorage.getItem("dailyFieldReport");
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...defaultFormState, ...parsed, sitePhotos: [] };
      }
    } catch {
      // ignore
    }
    return defaultFormState;
  });

  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const signatureCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPos, setLastPos] = useState<{ x: number; y: number } | null>(null);

  // Save to localStorage on change (excluding photos)
  useEffect(() => {
    const toSave = { ...formState, sitePhotos: [] };
    localStorage.setItem("dailyFieldReport", JSON.stringify(toSave));
  }, [formState]);

  // Restore signature from saved data
  useEffect(() => {
    if (formState.signatureData && signatureCanvasRef.current) {
      const canvas = signatureCanvasRef.current;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        const img = new Image();
        img.onload = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
        };
        img.src = formState.signatureData;
      }
    }
  }, []);

  const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setFormState((prev) => ({ ...prev, [key]: value }));
  };

  // Personnel
  const addPersonnel = () => {
    updateField("personnel", [
      ...formState.personnel,
      { id: generateId(), name: "", role: "", hoursWorked: "", company: "" },
    ]);
  };

  const updatePersonnel = (id: string, field: string, value: string) => {
    updateField(
      "personnel",
      formState.personnel.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  const removePersonnel = (id: string) => {
    updateField(
      "personnel",
      formState.personnel.filter((p) => p.id !== id)
    );
  };

  // Materials
  const addMaterial = () => {
    updateField("materialsUsed", [
      ...formState.materialsUsed,
      { id: generateId(), description: "", quantity: "", unit: "" },
    ]);
  };

  const updateMaterial = (id: string, field: string, value: string) => {
    updateField(
      "materialsUsed",
      formState.materialsUsed.map((m) => (m.id === id ? { ...m, [field]: value } : m))
    );
  };

  const removeMaterial = (id: string) => {
    updateField(
      "materialsUsed",
      formState.materialsUsed.filter((m) => m.id !== id)
    );
  };

  // Equipment
  const addEquipment = () => {
    updateField("equipmentUsed", [
      ...formState.equipmentUsed,
      { id: generateId(), description: "", quantity: "", hours: "" },
    ]);
  };

  const updateEquipment = (id: string, field: string, value: string) => {
    updateField(
      "equipmentUsed",
      formState.equipmentUsed.map((e) => (e.id === id ? { ...e, [field]: value } : e))
    );
  };

  const removeEquipment = (id: string) => {
    updateField(
      "equipmentUsed",
      formState.equipmentUsed.filter((e) => e.id !== id)
    );
  };

  // Visitors
  const addVisitor = () => {
    updateField("visitors", [
      ...formState.visitors,
      { id: generateId(), name: "", company: "", purpose: "", timeIn: "", timeOut: "" },
    ]);
  };

  const updateVisitor = (id: string, field: string, value: string) => {
    updateField(
      "visitors",
      formState.visitors.map((v) => (v.id === id ? { ...v, [field]: value } : v))
    );
  };

  const removeVisitor = (id: string) => {
    updateField(
      "visitors",
      formState.visitors.filter((v) => v.id !== id)
    );
  };

  // Site Photos
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newPhotos = files.map((file) => ({
      id: generateId(),
      file,
      caption: "",
      preview: URL.createObjectURL(file),
    }));
    updateField("sitePhotos", [...formState.sitePhotos, ...newPhotos]);
  };

  const updatePhotoCaption = (id: string, caption: string) => {
    updateField(
      "sitePhotos",
      formState.sitePhotos.map((p) => (p.id === id ? { ...p, caption } : p))
    );
  };

  const removePhoto = (id: string) => {
    updateField(
      "sitePhotos",
      formState.sitePhotos.filter((p) => p.id !== id)
    );
  };

  // Signature canvas
  const getCanvasPos = (
    canvas: HTMLCanvasElement,
    e: React.MouseEvent | React.TouchEvent
  ) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ("touches" in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: ((e as React.MouseEvent).clientX - rect.left) * scaleX,
      y: ((e as React.MouseEvent).clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      const canvas = signatureCanvasRef.current;
      if (!canvas) return;
      setIsDrawing(true);
      setLastPos(getCanvasPos(canvas, e));
    },
    []
  );

  const draw = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      if (!isDrawing || !lastPos) return;
      const canvas = signatureCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const pos = getCanvasPos(canvas, e);
      ctx.beginPath();
      ctx.moveTo(lastPos.x, lastPos.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.strokeStyle = "#f59e0b";
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.stroke();
      setLastPos(pos);
    },
    [isDrawing, lastPos]
  );

  const stopDrawing = useCallback(() => {
    if (!isDrawing) return;
    setIsDrawing(false);
    setLastPos(null);
    const canvas = signatureCanvasRef.current;
    if (canvas) {
      updateField("signatureData", canvas.toDataURL());
    }
  }, [isDrawing]);

  const clearSignature = () => {
    const canvas = signatureCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    updateField("signatureData", "");
  };

  const handleGeneratePDF = async () => {
    setIsGeneratingPDF(true);
    try {
      await generatePDF({
        ...formState,
        signatureData: formState.signatureData,
      });
    } catch (err) {
      console.error("PDF generation failed:", err);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleClearForm = () => {
    if (window.confirm("Are you sure you want to clear all form data? This cannot be undone.")) {
      clearSignature();
      setFormState(defaultFormState);
      localStorage.removeItem("dailyFieldReport");
    }
  };

  const toggleSection = (section: string) => {
    setActiveSection((prev) => (prev === section ? null : section));
  };

  const sectionClass = (section: string) =>
    `form-section ${activeSection === section ? "active" : ""}`;

  const inputClass =
    "w-full bg-surface border border-border rounded px-3 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:border-accent-yellow focus:ring-1 focus:ring-accent-yellow text-sm font-mono";

  const labelClass = "block text-xs font-bold tracking-widest text-accent-yellow uppercase mb-1";

  const sectionHeaderClass =
    "flex items-center justify-between w-full text-left px-4 py-3 bg-surface-2 border border-border rounded cursor-pointer hover:border-accent-yellow transition-colors group";

  const addBtnClass =
    "flex items-center gap-2 px-3 py-1.5 text-xs font-bold tracking-wider uppercase border border-accent-yellow text-accent-yellow rounded hover:bg-accent-yellow hover:text-black transition-colors";

  const removeBtnClass =
    "text-xs text-muted-foreground hover:text-destructive transition-colors px-2 py-1 rounded border border-transparent hover:border-destructive";

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-3">
      {/* Action Buttons */}
      <div className="flex gap-3 justify-end mb-4">
        <button
          onClick={handleClearForm}
          className="px-4 py-2 text-xs font-bold tracking-widest uppercase border border-border text-muted-foreground rounded hover:border-destructive hover:text-destructive transition-colors"
        >
          Clear Form
        </button>
        <button
          onClick={handleGeneratePDF}
          disabled={isGeneratingPDF}
          className="btn-primary flex items-center gap-2 px-6 py-2 text-xs font-bold tracking-widest uppercase rounded"
        >
          {isGeneratingPDF ? (
            <>
              <span className="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Generate PDF
            </>
          )}
        </button>
      </div>

      {/* ── PROJECT INFORMATION ── */}
      <div className={sectionClass("project")}>
        <button className={sectionHeaderClass} onClick={() => toggleSection("project")}>
          <span className="text-xs font-bold tracking-widest uppercase text-foreground group-hover:text-accent-yellow transition-colors">
            Project Information
          </span>
          <svg
            className={`w-4 h-4 text-muted-foreground transition-transform ${activeSection === "project" ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {activeSection === "project" && (
          <div className="border border-t-0 border-border rounded-b p-4 space-y-4 bg-surface">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Project Name</label>
                <input
                  type="text"
                  className={inputClass}
                  value={formState.projectName}
                  onChange={(e) => updateField("projectName", e.target.value)}
                  placeholder="Enter project name"
                />
              </div>
              <div>
                <label className={labelClass}>Project Number</label>
                <input
                  type="text"
                  className={inputClass}
                  value={formState.projectNumber}
                  onChange={(e) => updateField("projectNumber", e.target.value)}
                  placeholder="e.g. PRJ-2024-001"
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>Project Address</label>
              <input
                type="text"
                className={inputClass}
                value={formState.projectAddress}
                onChange={(e) => updateField("projectAddress", e.target.value)}
                placeholder="Full site address"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Project Manager</label>
                <input
                  type="text"
                  className={inputClass}
                  value={formState.projectManager}
                  onChange={(e) => updateField("projectManager", e.target.value)}
                  placeholder="Project manager name"
                />
              </div>
              <div>
                <label className={labelClass}>Point of Contact</label>
                <input
                  type="text"
                  className={inputClass}
                  value={formState.locationContact}
                  onChange={(e) => updateField("locationContact", e.target.value)}
                  placeholder="Point of contact name"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>Report Date</label>
                <input
                  type="date"
                  className={inputClass}
                  value={formState.reportDate}
                  onChange={(e) => updateField("reportDate", e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass}>Report Number</label>
                <input
                  type="text"
                  className={inputClass}
                  value={formState.reportNumber}
                  onChange={(e) => updateField("reportNumber", e.target.value)}
                  placeholder="e.g. DR-001"
                />
              </div>
              <div>
                <label className={labelClass}>Weather Conditions</label>
                <input
                  type="text"
                  className={inputClass}
                  value={formState.weatherConditions}
                  onChange={(e) => updateField("weatherConditions", e.target.value)}
                  placeholder="e.g. Sunny, Cloudy"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Temperature (°F)</label>
                <input
                  type="text"
                  className={inputClass}
                  value={formState.temperature}
                  onChange={(e) => updateField("temperature", e.target.value)}
                  placeholder="e.g. 72°F"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── TECHNICAL TEAM ── */}
      <div className={sectionClass("personnel")}>
        <button className={sectionHeaderClass} onClick={() => toggleSection("personnel")}>
          <span className="text-xs font-bold tracking-widest uppercase text-foreground group-hover:text-accent-yellow transition-colors">
            Technical Team
          </span>
          <svg
            className={`w-4 h-4 text-muted-foreground transition-transform ${activeSection === "personnel" ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {activeSection === "personnel" && (
          <div className="border border-t-0 border-border rounded-b p-4 space-y-3 bg-surface">
            {formState.personnel.map((person, idx) => (
              <div key={person.id} className="p-3 border border-border rounded bg-surface-2 space-y-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground font-mono">
                    Team Member #{idx + 1}
                  </span>
                  <button onClick={() => removePersonnel(person.id)} className={removeBtnClass}>
                    Remove
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div>
                    <label className={labelClass}>Name</label>
                    <input
                      type="text"
                      className={inputClass}
                      value={person.name}
                      onChange={(e) => updatePersonnel(person.id, "name", e.target.value)}
                      placeholder="Full name"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Company</label>
                    <input
                      type="text"
                      className={inputClass}
                      value={person.company}
                      onChange={(e) => updatePersonnel(person.id, "company", e.target.value)}
                      placeholder="Company name"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div>
                    <label className={labelClass}>Role / Trade</label>
                    <input
                      type="text"
                      className={inputClass}
                      value={person.role}
                      onChange={(e) => updatePersonnel(person.id, "role", e.target.value)}
                      placeholder="e.g. Electrician"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Hours Worked</label>
                    <input
                      type="text"
                      className={inputClass}
                      value={person.hoursWorked}
                      onChange={(e) => updatePersonnel(person.id, "hoursWorked", e.target.value)}
                      placeholder="e.g. 8"
                    />
                  </div>
                </div>
              </div>
            ))}
            <button onClick={addPersonnel} className={addBtnClass}>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Team Member
            </button>
          </div>
        )}
      </div>

      {/* ── WORK PERFORMED ── */}
      <div className={sectionClass("work")}>
        <button className={sectionHeaderClass} onClick={() => toggleSection("work")}>
          <span className="text-xs font-bold tracking-widest uppercase text-foreground group-hover:text-accent-yellow transition-colors">
            Work Performed
          </span>
          <svg
            className={`w-4 h-4 text-muted-foreground transition-transform ${activeSection === "work" ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {activeSection === "work" && (
          <div className="border border-t-0 border-border rounded-b p-4 bg-surface">
            <label className={labelClass}>Description of Work</label>
            <textarea
              className={`${inputClass} min-h-[120px] resize-y`}
              value={formState.workPerformed}
              onChange={(e) => updateField("workPerformed", e.target.value)}
              placeholder="Describe all work performed today..."
            />
          </div>
        )}
      </div>

      {/* ── MATERIALS USED ── */}
      <div className={sectionClass("materials")}>
        <button className={sectionHeaderClass} onClick={() => toggleSection("materials")}>
          <span className="text-xs font-bold tracking-widest uppercase text-foreground group-hover:text-accent-yellow transition-colors">
            Materials Used
          </span>
          <svg
            className={`w-4 h-4 text-muted-foreground transition-transform ${activeSection === "materials" ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {activeSection === "materials" && (
          <div className="border border-t-0 border-border rounded-b p-4 space-y-3 bg-surface">
            {formState.materialsUsed.map((material, idx) => (
              <div key={material.id} className="p-3 border border-border rounded bg-surface-2 space-y-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground font-mono">
                    Material #{idx + 1}
                  </span>
                  <button onClick={() => removeMaterial(material.id)} className={removeBtnClass}>
                    Remove
                  </button>
                </div>
                <div>
                  <label className={labelClass}>Description</label>
                  <input
                    type="text"
                    className={inputClass}
                    value={material.description}
                    onChange={(e) => updateMaterial(material.id, "description", e.target.value)}
                    placeholder="Material description"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={labelClass}>Quantity</label>
                    <input
                      type="text"
                      className={inputClass}
                      value={material.quantity}
                      onChange={(e) => updateMaterial(material.id, "quantity", e.target.value)}
                      placeholder="e.g. 10"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Unit</label>
                    <input
                      type="text"
                      className={inputClass}
                      value={material.unit}
                      onChange={(e) => updateMaterial(material.id, "unit", e.target.value)}
                      placeholder="e.g. lbs, ft, ea"
                    />
                  </div>
                </div>
              </div>
            ))}
            <button onClick={addMaterial} className={addBtnClass}>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Material
            </button>
          </div>
        )}
      </div>

      {/* ── EQUIPMENT USED ── */}
      <div className={sectionClass("equipment")}>
        <button className={sectionHeaderClass} onClick={() => toggleSection("equipment")}>
          <span className="text-xs font-bold tracking-widest uppercase text-foreground group-hover:text-accent-yellow transition-colors">
            Equipment Used
          </span>
          <svg
            className={`w-4 h-4 text-muted-foreground transition-transform ${activeSection === "equipment" ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {activeSection === "equipment" && (
          <div className="border border-t-0 border-border rounded-b p-4 space-y-3 bg-surface">
            {formState.equipmentUsed.map((equipment, idx) => (
              <div key={equipment.id} className="p-3 border border-border rounded bg-surface-2 space-y-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground font-mono">
                    Equipment #{idx + 1}
                  </span>
                  <button onClick={() => removeEquipment(equipment.id)} className={removeBtnClass}>
                    Remove
                  </button>
                </div>
                <div>
                  <label className={labelClass}>Description</label>
                  <input
                    type="text"
                    className={inputClass}
                    value={equipment.description}
                    onChange={(e) => updateEquipment(equipment.id, "description", e.target.value)}
                    placeholder="Equipment description"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={labelClass}>Quantity</label>
                    <input
                      type="text"
                      className={inputClass}
                      value={equipment.quantity}
                      onChange={(e) => updateEquipment(equipment.id, "quantity", e.target.value)}
                      placeholder="e.g. 2"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Hours</label>
                    <input
                      type="text"
                      className={inputClass}
                      value={equipment.hours}
                      onChange={(e) => updateEquipment(equipment.id, "hours", e.target.value)}
                      placeholder="e.g. 4"
                    />
                  </div>
                </div>
              </div>
            ))}
            <button onClick={addEquipment} className={addBtnClass}>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Equipment
            </button>
          </div>
        )}
      </div>

      {/* ── SAFETY OBSERVATIONS ── */}
      <div className={sectionClass("safety")}>
        <button className={sectionHeaderClass} onClick={() => toggleSection("safety")}>
          <span className="text-xs font-bold tracking-widest uppercase text-foreground group-hover:text-accent-yellow transition-colors">
            Safety Observations
          </span>
          <svg
            className={`w-4 h-4 text-muted-foreground transition-transform ${activeSection === "safety" ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {activeSection === "safety" && (
          <div className="border border-t-0 border-border rounded-b p-4 space-y-4 bg-surface">
            <div>
              <label className={labelClass}>Observations</label>
              <textarea
                className={`${inputClass} min-h-[80px] resize-y`}
                value={formState.safetyObservations}
                onChange={(e) => updateField("safetyObservations", e.target.value)}
                placeholder="Describe safety observations..."
              />
            </div>
            <div>
              <label className={labelClass}>Incidents</label>
              <textarea
                className={`${inputClass} min-h-[80px] resize-y`}
                value={formState.incidents}
                onChange={(e) => updateField("incidents", e.target.value)}
                placeholder="Describe any incidents..."
              />
            </div>
            <div>
              <label className={labelClass}>Near Misses</label>
              <textarea
                className={`${inputClass} min-h-[80px] resize-y`}
                value={formState.nearMisses}
                onChange={(e) => updateField("nearMisses", e.target.value)}
                placeholder="Describe any near misses..."
              />
            </div>
          </div>
        )}
      </div>

      {/* ── ISSUES & DELAYS ── */}
      <div className={sectionClass("issues")}>
        <button className={sectionHeaderClass} onClick={() => toggleSection("issues")}>
          <span className="text-xs font-bold tracking-widest uppercase text-foreground group-hover:text-accent-yellow transition-colors">
            Issues &amp; Delays
          </span>
          <svg
            className={`w-4 h-4 text-muted-foreground transition-transform ${activeSection === "issues" ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {activeSection === "issues" && (
          <div className="border border-t-0 border-border rounded-b p-4 bg-surface">
            <label className={labelClass}>Description</label>
            <textarea
              className={`${inputClass} min-h-[100px] resize-y`}
              value={formState.issuesDelays}
              onChange={(e) => updateField("issuesDelays", e.target.value)}
              placeholder="Describe any issues or delays encountered..."
            />
          </div>
        )}
      </div>

      {/* ── VISITORS ── */}
      <div className={sectionClass("visitors")}>
        <button className={sectionHeaderClass} onClick={() => toggleSection("visitors")}>
          <span className="text-xs font-bold tracking-widest uppercase text-foreground group-hover:text-accent-yellow transition-colors">
            Visitors
          </span>
          <svg
            className={`w-4 h-4 text-muted-foreground transition-transform ${activeSection === "visitors" ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {activeSection === "visitors" && (
          <div className="border border-t-0 border-border rounded-b p-4 space-y-3 bg-surface">
            {formState.visitors.map((visitor, idx) => (
              <div key={visitor.id} className="p-3 border border-border rounded bg-surface-2 space-y-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground font-mono">
                    Visitor #{idx + 1}
                  </span>
                  <button onClick={() => removeVisitor(visitor.id)} className={removeBtnClass}>
                    Remove
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div>
                    <label className={labelClass}>Name</label>
                    <input
                      type="text"
                      className={inputClass}
                      value={visitor.name}
                      onChange={(e) => updateVisitor(visitor.id, "name", e.target.value)}
                      placeholder="Visitor name"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Company</label>
                    <input
                      type="text"
                      className={inputClass}
                      value={visitor.company}
                      onChange={(e) => updateVisitor(visitor.id, "company", e.target.value)}
                      placeholder="Company name"
                    />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Purpose of Visit</label>
                  <input
                    type="text"
                    className={inputClass}
                    value={visitor.purpose}
                    onChange={(e) => updateVisitor(visitor.id, "purpose", e.target.value)}
                    placeholder="Purpose of visit"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={labelClass}>Time In</label>
                    <input
                      type="time"
                      className={inputClass}
                      value={visitor.timeIn}
                      onChange={(e) => updateVisitor(visitor.id, "timeIn", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Time Out</label>
                    <input
                      type="time"
                      className={inputClass}
                      value={visitor.timeOut}
                      onChange={(e) => updateVisitor(visitor.id, "timeOut", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}
            <button onClick={addVisitor} className={addBtnClass}>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Visitor
            </button>
          </div>
        )}
      </div>

      {/* ── SITE PHOTOS ── */}
      <div className={sectionClass("photos")}>
        <button className={sectionHeaderClass} onClick={() => toggleSection("photos")}>
          <span className="text-xs font-bold tracking-widest uppercase text-foreground group-hover:text-accent-yellow transition-colors">
            Site Photos
          </span>
          <svg
            className={`w-4 h-4 text-muted-foreground transition-transform ${activeSection === "photos" ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {activeSection === "photos" && (
          <div className="border border-t-0 border-border rounded-b p-4 space-y-3 bg-surface">
            <div>
              <label className={`${labelClass} cursor-pointer`}>
                <span className={addBtnClass} style={{ display: "inline-flex" }}>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Photos
                </span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handlePhotoUpload}
                />
              </label>
            </div>
            {formState.sitePhotos.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {formState.sitePhotos.map((photo) => (
                  <div key={photo.id} className="relative group">
                    <img
                      src={photo.preview}
                      alt={photo.caption || "Site photo"}
                      className="w-full h-32 object-cover rounded border border-border"
                    />
                    <button
                      onClick={() => removePhoto(photo.id)}
                      className="absolute top-1 right-1 bg-black/70 text-white rounded px-1.5 py-0.5 text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive"
                    >
                      ✕
                    </button>
                    <input
                      type="text"
                      className={`${inputClass} mt-1 text-xs`}
                      value={photo.caption}
                      onChange={(e) => updatePhotoCaption(photo.id, e.target.value)}
                      placeholder="Caption (optional)"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── SIGNATURE (LAST) ── */}
      <div className={sectionClass("signature")}>
        <button className={sectionHeaderClass} onClick={() => toggleSection("signature")}>
          <span className="text-xs font-bold tracking-widest uppercase text-foreground group-hover:text-accent-yellow transition-colors">
            Signature
          </span>
          <svg
            className={`w-4 h-4 text-muted-foreground transition-transform ${activeSection === "signature" ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {activeSection === "signature" && (
          <div className="border border-t-0 border-border rounded-b p-4 space-y-4 bg-surface">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Signatory Name</label>
                <input
                  type="text"
                  className={inputClass}
                  value={formState.signatoryName}
                  onChange={(e) => updateField("signatoryName", e.target.value)}
                  placeholder="Full name"
                />
              </div>
              <div>
                <label className={labelClass}>Title</label>
                <input
                  type="text"
                  className={inputClass}
                  value={formState.signatoryTitle}
                  onChange={(e) => updateField("signatoryTitle", e.target.value)}
                  placeholder="Job title"
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>Signature</label>
              <div className="signature-container border border-border rounded overflow-hidden">
                <canvas
                  ref={signatureCanvasRef}
                  width={800}
                  height={200}
                  className="w-full h-32 cursor-crosshair touch-none"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                />
              </div>
              <button
                onClick={clearSignature}
                className="mt-2 text-xs text-muted-foreground hover:text-accent-yellow transition-colors underline"
              >
                Clear Signature
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
