// Daily Field Report Form Component
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { generatePDF } from '@/utils/pdfGenerator';
import { FileText, Save, RotateCcw, Clock, User, Wrench, ClipboardList, CheckCircle, AlertTriangle, Loader2, Camera, X, ImagePlus } from 'lucide-react';

const STORAGE_KEY = 'daily_field_report_v1';

interface TechEntry {
  name: string;
  punchInDate: string;
  punchInTime: string;
  punchOutDate: string;
  punchOutTime: string;
}

interface FormState {
  // Project Info
  projectName: string;
  projectNumber: string;
  projectAddress: string;
  // Punch times
  punchInDate: string;
  punchInTime: string;
  punchOutDate: string;
  punchOutTime: string;
  // Personnel
  leadTechName: string;
  assistTechName: string;
  additionalTechs: TechEntry[];
  // Work Details
  workPerformed: string;
  materialsUsed: string;
  equipmentUsed: string;
  // Status
  workStatus: string;
  percentComplete: string;
  // Notes
  safetyNotes: string;
  additionalNotes: string;
  // Signature
  signatureName: string;
  signatureTitle: string;
  signatureData: string;
}

interface PhotoEntry {
  file: File;
  dataUrl: string;
}

function getCurrentDateTime() {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = now.toTimeString().slice(0, 5);
  return { dateStr, timeStr };
}

function getInitialState(): FormState {
  const { dateStr, timeStr } = getCurrentDateTime();
  return {
    projectName: '',
    projectNumber: '',
    projectAddress: '',
    punchInDate: dateStr,
    punchInTime: timeStr,
    punchOutDate: dateStr,
    punchOutTime: timeStr,
    leadTechName: '',
    assistTechName: '',
    additionalTechs: [],
    workPerformed: '',
    materialsUsed: '',
    equipmentUsed: '',
    workStatus: 'in-progress',
    percentComplete: '',
    safetyNotes: '',
    additionalNotes: '',
    signatureName: '',
    signatureTitle: '',
    signatureData: '',
  };
}

export default function ReportForm() {
  const [form, setForm] = useState<FormState>(getInitialState);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [sitePhotos, setSitePhotos] = useState<PhotoEntry[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Load from localStorage on mount, but always override date/time with current values
  useEffect(() => {
    const { dateStr, timeStr } = getCurrentDateTime();
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const initial = getInitialState();
        const merged: FormState = { ...initial };
        (Object.keys(initial) as (keyof FormState)[]).forEach(key => {
          if (key in parsed) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (merged as any)[key] = parsed[key];
          }
        });
        // Always override date/time fields with current values on every load
        merged.punchInDate = dateStr;
        merged.punchInTime = timeStr;
        merged.punchOutDate = dateStr;
        merged.punchOutTime = timeStr;
        setForm(merged);
      } else {
        // No saved data — initial state already has current date/time
        setForm(getInitialState());
      }
    } catch {
      setForm(getInitialState());
    }
  }, []);

  // Restore signature canvas on mount
  useEffect(() => {
    if (form.signatureData && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const img = new Image();
        img.onload = () => ctx.drawImage(img, 0, 0);
        img.src = form.signatureData;
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateField = (field: keyof FormState, value: string | TechEntry[]) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const saveToStorage = () => {
    setIsSaving(true);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
      setSaveMessage('Saved successfully!');
    } catch {
      setSaveMessage('Save failed.');
    }
    setTimeout(() => {
      setIsSaving(false);
      setSaveMessage('');
    }, 2000);
  };

  const resetForm = () => {
    if (confirm('Reset all fields? This cannot be undone.')) {
      const fresh = getInitialState();
      setForm(fresh);
      localStorage.removeItem(STORAGE_KEY);
      setSitePhotos([]);
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
  };

  // Signature drawing
  const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    isDrawing.current = true;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing.current) return;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#f59e0b';
    const pos = getPos(e, canvas);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const endDraw = () => {
    isDrawing.current = false;
    if (canvasRef.current) {
      updateField('signatureData', canvasRef.current.toDataURL());
    }
  };

  const clearSignature = () => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      updateField('signatureData', '');
    }
  };

  const addAdditionalTech = () => {
    const { dateStr, timeStr } = getCurrentDateTime();
    const newTech: TechEntry = {
      name: '',
      punchInDate: dateStr,
      punchInTime: timeStr,
      punchOutDate: dateStr,
      punchOutTime: timeStr,
    };
    updateField('additionalTechs', [...form.additionalTechs, newTech]);
  };

  const updateAdditionalTech = (index: number, field: keyof TechEntry, value: string) => {
    const updated = form.additionalTechs.map((t, i) =>
      i === index ? { ...t, [field]: value } : t
    );
    updateField('additionalTechs', updated);
  };

  const removeAdditionalTech = (index: number) => {
    updateField('additionalTechs', form.additionalTechs.filter((_, i) => i !== index));
  };

  // Site Photos handlers
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newEntries: PhotoEntry[] = [];
    let loaded = 0;

    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        newEntries.push({ file, dataUrl: ev.target?.result as string });
        loaded++;
        if (loaded === files.length) {
          setSitePhotos(prev => [...prev, ...newEntries]);
        }
      };
      reader.readAsDataURL(file);
    });

    // Reset input so same files can be re-selected if needed
    e.target.value = '';
  };

  const removePhoto = (index: number) => {
    setSitePhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleGeneratePDF = async () => {
    setIsGenerating(true);
    try {
      const signatureData = canvasRef.current ? canvasRef.current.toDataURL() : '';
      await generatePDF({
        ...form,
        signatureData,
        sitePhotos: sitePhotos.map(p => p.dataUrl),
      });
    } catch (err) {
      console.error('PDF generation failed:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const sectionClass = "bg-surface border border-border rounded-lg p-6 mb-6 shadow-sm";
  const sectionTitleClass = "text-lg font-oswald font-semibold text-foreground uppercase tracking-wider mb-4 flex items-center gap-2";
  const fieldGroupClass = "grid grid-cols-1 md:grid-cols-2 gap-4";
  const labelClass = "text-sm font-medium text-muted-foreground uppercase tracking-wide";
  const inputClass = "bg-background border-border text-foreground placeholder:text-muted-foreground focus:border-accent-yellow focus:ring-accent-yellow/20";

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">

      {/* ── PUNCH SECTION ── */}
      <div className={sectionClass}>
        <h2 className={sectionTitleClass}>
          <Clock className="w-5 h-5 text-accent-yellow" />
          Punch
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Punch In row */}
          <div className="space-y-1">
            <Label className={labelClass}>Punch In</Label>
            <div className="flex gap-2">
              <Input
                type="date"
                value={form.punchInDate}
                onChange={e => updateField('punchInDate', e.target.value)}
                className={`${inputClass} flex-1 min-w-0`}
              />
              <Input
                type="time"
                value={form.punchInTime}
                onChange={e => updateField('punchInTime', e.target.value)}
                className={`${inputClass} w-32 shrink-0`}
              />
            </div>
          </div>
          {/* Punch Out row */}
          <div className="space-y-1">
            <Label className={labelClass}>Punch Out</Label>
            <div className="flex gap-2">
              <Input
                type="date"
                value={form.punchOutDate}
                onChange={e => updateField('punchOutDate', e.target.value)}
                className={`${inputClass} flex-1 min-w-0`}
              />
              <Input
                type="time"
                value={form.punchOutTime}
                onChange={e => updateField('punchOutTime', e.target.value)}
                className={`${inputClass} w-32 shrink-0`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── PROJECT INFORMATION ── */}
      <div className={sectionClass}>
        <h2 className={sectionTitleClass}>
          <ClipboardList className="w-5 h-5 text-accent-yellow" />
          Project Information
        </h2>
        <div className="space-y-4">
          <div className={fieldGroupClass}>
            <div className="space-y-2">
              <Label className={labelClass}>Project Name</Label>
              <Input
                value={form.projectName}
                onChange={e => updateField('projectName', e.target.value)}
                placeholder="Enter project name"
                className={inputClass}
              />
            </div>
            <div className="space-y-2">
              <Label className={labelClass}>Project Number</Label>
              <Input
                value={form.projectNumber}
                onChange={e => updateField('projectNumber', e.target.value)}
                placeholder="Enter project number"
                className={inputClass}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className={labelClass}>Project Address</Label>
            <Input
              value={form.projectAddress}
              onChange={e => updateField('projectAddress', e.target.value)}
              placeholder="Enter project address"
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* ── PERSONNEL ── */}
      <div className={sectionClass}>
        <h2 className={sectionTitleClass}>
          <User className="w-5 h-5 text-accent-yellow" />
          Personnel
        </h2>

        {/* Lead Technician */}
        <div className="mb-6">
          <h3 className="text-sm font-oswald font-semibold text-accent-yellow uppercase tracking-wider mb-3">Lead Technician</h3>
          <div className="space-y-2">
            <Label className={labelClass}>Name</Label>
            <Input
              value={form.leadTechName}
              onChange={e => updateField('leadTechName', e.target.value)}
              placeholder="Lead technician name"
              className={inputClass}
            />
          </div>
        </div>

        {/* Assistant Technician */}
        <div className="mb-6">
          <h3 className="text-sm font-oswald font-semibold text-accent-yellow uppercase tracking-wider mb-3">Assistant Technician</h3>
          <div className="space-y-2">
            <Label className={labelClass}>Name</Label>
            <Input
              value={form.assistTechName}
              onChange={e => updateField('assistTechName', e.target.value)}
              placeholder="Assistant technician name"
              className={inputClass}
            />
          </div>
        </div>

        {/* Additional Technicians */}
        <div>
          <h3 className="text-sm font-oswald font-semibold text-accent-yellow uppercase tracking-wider mb-3">Additional Technicians</h3>
          {form.additionalTechs.map((tech, index) => (
            <div key={index} className="border border-border rounded-md p-4 mb-4 bg-background/50">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-medium text-muted-foreground">Technician {index + 1}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeAdditionalTech(index)}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10 h-7 px-2"
                >
                  Remove
                </Button>
              </div>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label className={labelClass}>Name</Label>
                  <Input
                    value={tech.name}
                    onChange={e => updateAdditionalTech(index, 'name', e.target.value)}
                    placeholder="Technician name"
                    className={inputClass}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Tech Punch In */}
                  <div className="space-y-1">
                    <Label className={labelClass}>Punch In</Label>
                    <div className="flex gap-2">
                      <Input
                        type="date"
                        value={tech.punchInDate}
                        onChange={e => updateAdditionalTech(index, 'punchInDate', e.target.value)}
                        className={`${inputClass} flex-1 min-w-0`}
                      />
                      <Input
                        type="time"
                        value={tech.punchInTime}
                        onChange={e => updateAdditionalTech(index, 'punchInTime', e.target.value)}
                        className={`${inputClass} w-32 shrink-0`}
                      />
                    </div>
                  </div>
                  {/* Tech Punch Out */}
                  <div className="space-y-1">
                    <Label className={labelClass}>Punch Out</Label>
                    <div className="flex gap-2">
                      <Input
                        type="date"
                        value={tech.punchOutDate}
                        onChange={e => updateAdditionalTech(index, 'punchOutDate', e.target.value)}
                        className={`${inputClass} flex-1 min-w-0`}
                      />
                      <Input
                        type="time"
                        value={tech.punchOutTime}
                        onChange={e => updateAdditionalTech(index, 'punchOutTime', e.target.value)}
                        className={`${inputClass} w-32 shrink-0`}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={addAdditionalTech}
            className="border-accent-yellow/50 text-accent-yellow hover:bg-accent-yellow/10"
          >
            + Add Technician
          </Button>
        </div>
      </div>

      {/* ── WORK DETAILS ── */}
      <div className={sectionClass}>
        <h2 className={sectionTitleClass}>
          <Wrench className="w-5 h-5 text-accent-yellow" />
          Work Details
        </h2>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className={labelClass}>Work Performed</Label>
            <Textarea
              value={form.workPerformed}
              onChange={e => updateField('workPerformed', e.target.value)}
              placeholder="Describe work performed..."
              rows={4}
              className={inputClass}
            />
          </div>
          <div className={fieldGroupClass}>
            <div className="space-y-2">
              <Label className={labelClass}>Materials Used</Label>
              <Textarea
                value={form.materialsUsed}
                onChange={e => updateField('materialsUsed', e.target.value)}
                placeholder="List materials used..."
                rows={3}
                className={inputClass}
              />
            </div>
            <div className="space-y-2">
              <Label className={labelClass}>Equipment Used</Label>
              <Textarea
                value={form.equipmentUsed}
                onChange={e => updateField('equipmentUsed', e.target.value)}
                placeholder="List equipment used..."
                rows={3}
                className={inputClass}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── STATUS ── */}
      <div className={sectionClass}>
        <h2 className={sectionTitleClass}>
          <CheckCircle className="w-5 h-5 text-accent-yellow" />
          Status
        </h2>
        <div className={fieldGroupClass}>
          <div className="space-y-2">
            <Label className={labelClass}>Work Status</Label>
            <select
              value={form.workStatus}
              onChange={e => updateField('workStatus', e.target.value)}
              className={`w-full h-10 px-3 rounded-md border text-sm ${inputClass}`}
            >
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="on-hold">On Hold</option>
              <option value="delayed">Delayed</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label className={labelClass}>Percent Complete</Label>
            <Input
              value={form.percentComplete}
              onChange={e => updateField('percentComplete', e.target.value)}
              placeholder="e.g. 75%"
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* ── NOTES ── */}
      <div className={sectionClass}>
        <h2 className={sectionTitleClass}>
          <AlertTriangle className="w-5 h-5 text-accent-yellow" />
          Notes
        </h2>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className={labelClass}>Safety Notes</Label>
            <Textarea
              value={form.safetyNotes}
              onChange={e => updateField('safetyNotes', e.target.value)}
              placeholder="Safety observations, hazards, incidents..."
              rows={3}
              className={inputClass}
            />
          </div>
          <div className="space-y-2">
            <Label className={labelClass}>Additional Notes</Label>
            <Textarea
              value={form.additionalNotes}
              onChange={e => updateField('additionalNotes', e.target.value)}
              placeholder="Any additional notes or comments..."
              rows={3}
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* ── SITE PHOTOS ── */}
      <div className={sectionClass}>
        <h2 className={sectionTitleClass}>
          <Camera className="w-5 h-5 text-accent-yellow" />
          Site Photos
        </h2>

        {/* Upload button */}
        <div className="mb-4">
          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handlePhotoSelect}
          />
          <Button
            variant="outline"
            onClick={() => photoInputRef.current?.click()}
            className="border-accent-yellow/50 text-accent-yellow hover:bg-accent-yellow/10 gap-2"
          >
            <ImagePlus className="w-4 h-4" />
            Add Photos
          </Button>
          {sitePhotos.length > 0 && (
            <span className="ml-3 text-sm text-muted-foreground">
              {sitePhotos.length} photo{sitePhotos.length !== 1 ? 's' : ''} selected
            </span>
          )}
        </div>

        {/* Photo thumbnails grid */}
        {sitePhotos.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {sitePhotos.map((photo, index) => (
              <div key={index} className="relative group rounded-md overflow-hidden border border-border bg-background/50 aspect-square">
                <img
                  src={photo.dataUrl}
                  alt={`Site photo ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                {/* Remove button overlay */}
                <button
                  onClick={() => removePhoto(index)}
                  className="absolute top-1 right-1 bg-black/70 hover:bg-destructive text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Remove photo"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
                {/* Photo number badge */}
                <div className="absolute bottom-1 left-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded font-mono">
                  {index + 1}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {sitePhotos.length === 0 && (
          <div
            className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-accent-yellow/50 transition-colors"
            onClick={() => photoInputRef.current?.click()}
          >
            <Camera className="w-10 h-10 text-muted-foreground mx-auto mb-2 opacity-50" />
            <p className="text-sm text-muted-foreground">Click to add site photos</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Supports multiple images — JPG, PNG, HEIC, etc.</p>
          </div>
        )}
      </div>

      {/* ── SIGNATURE ── */}
      <div className={sectionClass}>
        <h2 className={sectionTitleClass}>
          <FileText className="w-5 h-5 text-accent-yellow" />
          Signature
        </h2>
        <div className="space-y-4">
          <div className={fieldGroupClass}>
            <div className="space-y-2">
              <Label className={labelClass}>Name</Label>
              <Input
                value={form.signatureName}
                onChange={e => updateField('signatureName', e.target.value)}
                placeholder="Signatory name"
                className={inputClass}
              />
            </div>
            <div className="space-y-2">
              <Label className={labelClass}>Title</Label>
              <Input
                value={form.signatureTitle}
                onChange={e => updateField('signatureTitle', e.target.value)}
                placeholder="Signatory title"
                className={inputClass}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className={labelClass}>Signature</Label>
            <div className="signature-container border border-border rounded-md overflow-hidden">
              <canvas
                ref={canvasRef}
                width={600}
                height={150}
                className="w-full touch-none cursor-crosshair"
                onMouseDown={startDraw}
                onMouseMove={draw}
                onMouseUp={endDraw}
                onMouseLeave={endDraw}
                onTouchStart={startDraw}
                onTouchMove={draw}
                onTouchEnd={endDraw}
              />
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSignature}
              className="text-muted-foreground hover:text-foreground"
            >
              Clear Signature
            </Button>
          </div>
        </div>
      </div>

      {/* ── ACTION BUTTONS ── */}
      <div className="flex flex-wrap gap-3 justify-between items-center pb-8">
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={saveToStorage}
            disabled={isSaving}
            className="border-border text-foreground hover:bg-surface gap-2"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isSaving ? 'Saving…' : 'Save Draft'}
          </Button>
          <Button
            variant="ghost"
            onClick={resetForm}
            className="text-muted-foreground hover:text-destructive gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </Button>
        </div>
        {saveMessage && (
          <span className="text-sm text-accent-yellow">{saveMessage}</span>
        )}
        <Button
          onClick={handleGeneratePDF}
          disabled={isGenerating}
          className="btn-primary gap-2"
        >
          {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
          {isGenerating ? 'Generating…' : 'Generate PDF'}
        </Button>
      </div>
    </div>
  );
}
