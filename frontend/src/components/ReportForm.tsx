import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { generatePDF, TechnicianData, AssisTech } from '@/utils/pdfGenerator';
import {
  FileText,
  Plus,
  Trash2,
  UserPlus,
  PenLine,
  RotateCcw,
} from 'lucide-react';

interface FormData {
  date: string;
  jobName: string;
  jobNumber: string;
  location: string;
  weatherConditions: string;
  temperature: string;
  workPerformed: string;
  materialsUsed: string;
  equipmentUsed: string;
  workStatus: string;
  percentComplete: string;
  additionalNotes: string;
}

const defaultFormData: FormData = {
  date: new Date().toISOString().split('T')[0],
  jobName: '',
  jobNumber: '',
  location: '',
  weatherConditions: '',
  temperature: '',
  workPerformed: '',
  materialsUsed: '',
  equipmentUsed: '',
  workStatus: 'In Progress',
  percentComplete: '',
  additionalNotes: '',
};

const defaultTechnician = (): TechnicianData => ({
  name: '',
  workPunchIn: '',
  workPunchOut: '',
  lunchPunchIn: '',
  lunchPunchOut: '',
});

const defaultAssisTech = (): AssisTech => ({
  name: '',
  workPunchIn: '',
  workPunchOut: '',
  lunchPunchIn: '',
  lunchPunchOut: '',
});

export default function ReportForm() {
  const [formData, setFormData] = useState<FormData>(defaultFormData);
  const [technicians, setTechnicians] = useState<TechnicianData[]>([defaultTechnician()]);
  const [assisTechs, setAssisTechs] = useState<AssisTech[]>([]);
  const [signature, setSignature] = useState<string>('');
  const [isDrawing, setIsDrawing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  // ── Form field handlers ────────────────────────────────────────────────────
  function handleChange(field: keyof FormData, value: string) {
    setFormData(prev => ({ ...prev, [field]: value }));
  }

  // ── Technician handlers ────────────────────────────────────────────────────
  function updateTechnician(index: number, field: keyof TechnicianData, value: string) {
    setTechnicians(prev => prev.map((t, i) => i === index ? { ...t, [field]: value } : t));
  }

  function addTechnician() {
    setTechnicians(prev => [...prev, defaultTechnician()]);
  }

  function removeTechnician(index: number) {
    setTechnicians(prev => prev.filter((_, i) => i !== index));
  }

  // ── ASSIS Tech handlers ────────────────────────────────────────────────────
  function updateAssisTech(index: number, field: keyof AssisTech, value: string) {
    setAssisTechs(prev => prev.map((t, i) => i === index ? { ...t, [field]: value } : t));
  }

  function addAssisTech() {
    setAssisTechs(prev => [...prev, defaultAssisTech()]);
  }

  function removeAssisTech(index: number) {
    setAssisTechs(prev => prev.filter((_, i) => i !== index));
  }

  // ── Signature canvas ───────────────────────────────────────────────────────
  function getPos(e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) {
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function startDrawing(e: React.MouseEvent | React.TouchEvent) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    e.preventDefault();
    setIsDrawing(true);
    lastPos.current = getPos(e, canvas);
  }

  function draw(e: React.MouseEvent | React.TouchEvent) {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    e.preventDefault();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(lastPos.current!.x, lastPos.current!.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = '#f5c518';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.stroke();
    lastPos.current = pos;
  }

  function stopDrawing() {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      setSignature(canvas.toDataURL('image/png'));
    }
  }

  function clearSignature() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignature('');
  }

  // ── PDF generation ─────────────────────────────────────────────────────────
  async function handleGeneratePDF() {
    setIsGenerating(true);
    try {
      generatePDF({
        ...formData,
        technicians,
        assisTechs,
        signature: signature || undefined,
      });
    } catch (err) {
      console.error('PDF generation failed:', err);
    } finally {
      setIsGenerating(false);
    }
  }

  // ── Shared input class ─────────────────────────────────────────────────────
  const inputClass =
    'bg-surface border-border text-foreground placeholder:text-muted-foreground focus:border-accent-yellow focus:ring-1 focus:ring-accent-yellow';

  return (
    <div className="space-y-8">

      {/* ── PROJECT INFORMATION ─────────────────────────────────────────── */}
      <section className="rounded-lg border border-border bg-surface p-6 space-y-4">
        <h2 className="font-display text-lg font-bold text-accent-yellow uppercase tracking-widest flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Project Information
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label className="text-muted-foreground text-xs uppercase tracking-wider">Date</Label>
            <Input
              type="date"
              value={formData.date}
              onChange={e => handleChange('date', e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-muted-foreground text-xs uppercase tracking-wider">Job Name</Label>
            <Input
              placeholder="Enter job name"
              value={formData.jobName}
              onChange={e => handleChange('jobName', e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-muted-foreground text-xs uppercase tracking-wider">Job Number</Label>
            <Input
              placeholder="e.g. JOB-2024-001"
              value={formData.jobNumber}
              onChange={e => handleChange('jobNumber', e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-muted-foreground text-xs uppercase tracking-wider">Location</Label>
            <Input
              placeholder="Site address or name"
              value={formData.location}
              onChange={e => handleChange('location', e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-muted-foreground text-xs uppercase tracking-wider">Weather Conditions</Label>
            <Input
              placeholder="e.g. Sunny, Cloudy, Rain"
              value={formData.weatherConditions}
              onChange={e => handleChange('weatherConditions', e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-muted-foreground text-xs uppercase tracking-wider">Temperature (°F)</Label>
            <Input
              type="number"
              placeholder="e.g. 72"
              value={formData.temperature}
              onChange={e => handleChange('temperature', e.target.value)}
              className={inputClass}
            />
          </div>
        </div>
      </section>

      {/* ── LEAD TECHNICIANS ────────────────────────────────────────────── */}
      <section className="rounded-lg border border-border bg-surface p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-accent-yellow uppercase tracking-widest flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Lead Technicians
          </h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addTechnician}
            className="border-accent-yellow text-accent-yellow hover:bg-accent-yellow hover:text-background gap-1"
          >
            <Plus className="w-4 h-4" />
            Add Tech
          </Button>
        </div>

        {technicians.map((tech, idx) => (
          <div key={idx} className="rounded-md border border-border bg-background p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-accent-yellow uppercase tracking-wider">
                Technician {idx + 1}
              </span>
              {technicians.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeTechnician(idx)}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10 h-7 w-7"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>

            <div className="space-y-1">
              <Label className="text-muted-foreground text-xs uppercase tracking-wider">Name</Label>
              <Input
                placeholder="Technician name"
                value={tech.name}
                onChange={e => updateTechnician(idx, 'name', e.target.value)}
                className={inputClass}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-muted-foreground text-xs uppercase tracking-wider">Work Punch In</Label>
                <Input
                  type="datetime-local"
                  value={tech.workPunchIn}
                  onChange={e => updateTechnician(idx, 'workPunchIn', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground text-xs uppercase tracking-wider">Work Punch Out</Label>
                <Input
                  type="datetime-local"
                  value={tech.workPunchOut}
                  onChange={e => updateTechnician(idx, 'workPunchOut', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground text-xs uppercase tracking-wider">Lunch Punch In</Label>
                <Input
                  type="datetime-local"
                  value={tech.lunchPunchIn}
                  onChange={e => updateTechnician(idx, 'lunchPunchIn', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground text-xs uppercase tracking-wider">Lunch Punch Out</Label>
                <Input
                  type="datetime-local"
                  value={tech.lunchPunchOut}
                  onChange={e => updateTechnician(idx, 'lunchPunchOut', e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* ── ASSISTANT TECHNICIANS ───────────────────────────────────────── */}
      <section className="rounded-lg border border-border bg-surface p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-accent-yellow uppercase tracking-widest flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            ASSIS Techs
          </h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addAssisTech}
            className="border-accent-yellow text-accent-yellow hover:bg-accent-yellow hover:text-background gap-1"
          >
            <Plus className="w-4 h-4" />
            Add ASSIS Tech
          </Button>
        </div>

        {assisTechs.length === 0 && (
          <p className="text-muted-foreground text-sm italic">
            No assistant technicians added. Click "Add ASSIS Tech" to add one.
          </p>
        )}

        {assisTechs.map((tech, idx) => (
          <div key={idx} className="rounded-md border border-border bg-background p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-accent-yellow uppercase tracking-wider">
                ASSIS Tech {idx + 1}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeAssisTech(idx)}
                className="text-destructive hover:text-destructive hover:bg-destructive/10 h-7 w-7"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-1">
              <Label className="text-muted-foreground text-xs uppercase tracking-wider">Name</Label>
              <Input
                placeholder="Assistant technician name"
                value={tech.name}
                onChange={e => updateAssisTech(idx, 'name', e.target.value)}
                className={inputClass}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-muted-foreground text-xs uppercase tracking-wider">Work Punch In</Label>
                <Input
                  type="datetime-local"
                  value={tech.workPunchIn}
                  onChange={e => updateAssisTech(idx, 'workPunchIn', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground text-xs uppercase tracking-wider">Work Punch Out</Label>
                <Input
                  type="datetime-local"
                  value={tech.workPunchOut}
                  onChange={e => updateAssisTech(idx, 'workPunchOut', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground text-xs uppercase tracking-wider">Lunch Punch In</Label>
                <Input
                  type="datetime-local"
                  value={tech.lunchPunchIn}
                  onChange={e => updateAssisTech(idx, 'lunchPunchIn', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground text-xs uppercase tracking-wider">Lunch Punch Out</Label>
                <Input
                  type="datetime-local"
                  value={tech.lunchPunchOut}
                  onChange={e => updateAssisTech(idx, 'lunchPunchOut', e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* ── WORK DETAILS ────────────────────────────────────────────────── */}
      <section className="rounded-lg border border-border bg-surface p-6 space-y-4">
        <h2 className="font-display text-lg font-bold text-accent-yellow uppercase tracking-widest flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Work Details
        </h2>

        <div className="space-y-1">
          <Label className="text-muted-foreground text-xs uppercase tracking-wider">Work Performed</Label>
          <Textarea
            placeholder="Describe the work performed today..."
            value={formData.workPerformed}
            onChange={e => handleChange('workPerformed', e.target.value)}
            className={`${inputClass} min-h-[100px]`}
          />
        </div>

        <div className="space-y-1">
          <Label className="text-muted-foreground text-xs uppercase tracking-wider">Materials Used</Label>
          <Textarea
            placeholder="List materials used..."
            value={formData.materialsUsed}
            onChange={e => handleChange('materialsUsed', e.target.value)}
            className={`${inputClass} min-h-[80px]`}
          />
        </div>

        <div className="space-y-1">
          <Label className="text-muted-foreground text-xs uppercase tracking-wider">Equipment Used</Label>
          <Textarea
            placeholder="List equipment used..."
            value={formData.equipmentUsed}
            onChange={e => handleChange('equipmentUsed', e.target.value)}
            className={`${inputClass} min-h-[80px]`}
          />
        </div>
      </section>

      {/* ── PROJECT STATUS ──────────────────────────────────────────────── */}
      <section className="rounded-lg border border-border bg-surface p-6 space-y-4">
        <h2 className="font-display text-lg font-bold text-accent-yellow uppercase tracking-widest">
          Project Status
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label className="text-muted-foreground text-xs uppercase tracking-wider">Work Status</Label>
            <Select value={formData.workStatus} onValueChange={v => handleChange('workStatus', v)}>
              <SelectTrigger className={inputClass}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-surface border-border text-foreground">
                <SelectItem value="Not Started">Not Started</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="On Hold">On Hold</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-muted-foreground text-xs uppercase tracking-wider">Percent Complete (%)</Label>
            <Input
              type="number"
              min="0"
              max="100"
              placeholder="e.g. 75"
              value={formData.percentComplete}
              onChange={e => handleChange('percentComplete', e.target.value)}
              className={inputClass}
            />
          </div>
        </div>
      </section>

      {/* ── ADDITIONAL NOTES ────────────────────────────────────────────── */}
      <section className="rounded-lg border border-border bg-surface p-6 space-y-4">
        <h2 className="font-display text-lg font-bold text-accent-yellow uppercase tracking-widest">
          Additional Notes
        </h2>
        <div className="space-y-1">
          <Label className="text-muted-foreground text-xs uppercase tracking-wider">Notes</Label>
          <Textarea
            placeholder="Any additional notes, observations, or issues..."
            value={formData.additionalNotes}
            onChange={e => handleChange('additionalNotes', e.target.value)}
            className={`${inputClass} min-h-[100px]`}
          />
        </div>
      </section>

      {/* ── SIGNATURE ───────────────────────────────────────────────────── */}
      <section className="rounded-lg border border-border bg-surface p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-accent-yellow uppercase tracking-widest flex items-center gap-2">
            <PenLine className="w-5 h-5" />
            Signature
          </h2>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearSignature}
            className="text-muted-foreground hover:text-foreground gap-1"
          >
            <RotateCcw className="w-4 h-4" />
            Clear
          </Button>
        </div>

        <div className="signature-container rounded-md overflow-hidden border border-border">
          <canvas
            ref={canvasRef}
            width={532}
            height={150}
            className="w-full touch-none cursor-crosshair bg-background"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
        </div>
        <p className="text-muted-foreground text-xs">Sign above using mouse or touch</p>
      </section>

      {/* ── GENERATE PDF ────────────────────────────────────────────────── */}
      <div className="flex justify-end pb-4">
        <Button
          type="button"
          onClick={handleGeneratePDF}
          disabled={isGenerating}
          className="btn-primary gap-2 px-8 py-3 text-base font-bold uppercase tracking-wider"
        >
          {isGenerating ? (
            <>
              <span className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
              Generating...
            </>
          ) : (
            <>
              <FileText className="w-5 h-5" />
              Generate PDF Report
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
