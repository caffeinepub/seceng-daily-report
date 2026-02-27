import { useState, useRef } from 'react';
import { generateReportPDF, ReportData } from '../utils/pdfGenerator';
import { Clock, FileText, User, MapPin, Briefcase, CheckCircle, Camera, Download, X, ImagePlus } from 'lucide-react';

interface PhotoEntry {
  file: File;
  previewUrl: string;
  label: string;
}

interface FormState {
  jobCode: string;
  customerName: string;
  jobLocation: string;
  jobType: string;
  jobDescription: string;
  completionStatus: string;
  projectManager: string;
  locationContact: string;
  leadTechnician: string;
  assistTech: string;
  closeOutReport: string;
}

const initialFormState: FormState = {
  jobCode: '',
  customerName: '',
  jobLocation: '',
  jobType: '',
  jobDescription: '',
  completionStatus: 'Fully Complete',
  projectManager: '',
  locationContact: '',
  leadTechnician: '',
  assistTech: '',
  closeOutReport: '',
};

// Convert a local datetime string (YYYY-MM-DDTHH:MM) to display format
function toDisplayTime(dt: string): string {
  if (!dt) return '';
  try {
    const d = new Date(dt);
    return d.toLocaleString('en-US', {
      month: '2-digit', day: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true,
    });
  } catch {
    return dt;
  }
}

// Get current datetime in datetime-local format
function nowDatetimeLocal(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function ReportForm() {
  const [form, setForm] = useState<FormState>(initialFormState);

  // Punch state: 'idle' | 'in' | 'out'
  const [punchState, setPunchState] = useState<'idle' | 'in' | 'out'>('idle');
  const [checkInDT, setCheckInDT] = useState<string>('');
  const [checkOutDT, setCheckOutDT] = useState<string>('');

  // Multi-photo state with labels
  const [photos, setPhotos] = useState<PhotoEntry[]>([]);

  const [isGenerating, setIsGenerating] = useState(false);

  const photoInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handlePunch = () => {
    const now = nowDatetimeLocal();
    if (punchState === 'idle') {
      setCheckInDT(now);
      setCheckOutDT('');
      setPunchState('in');
    } else if (punchState === 'in') {
      setCheckOutDT(now);
      setPunchState('out');
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newEntries: PhotoEntry[] = files.map(f => ({
      file: f,
      previewUrl: URL.createObjectURL(f),
      label: '',
    }));

    setPhotos(prev => [...prev, ...newEntries]);

    // Reset input so same files can be re-added if needed
    if (photoInputRef.current) photoInputRef.current.value = '';
  };

  const removePhoto = (index: number) => {
    URL.revokeObjectURL(photos[index].previewUrl);
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const updatePhotoLabel = (index: number, label: string) => {
    setPhotos(prev => prev.map((p, i) => i === index ? { ...p, label } : p));
  };

  const handleGeneratePDF = async () => {
    setIsGenerating(true);
    try {
      // Convert all photos to base64
      const photoData = await Promise.all(
        photos.map(
          entry =>
            new Promise<{ data: string; label: string }>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = ev => resolve({
                data: ev.target?.result as string,
                label: entry.label,
              });
              reader.onerror = reject;
              reader.readAsDataURL(entry.file);
            })
        )
      );

      const reportData: ReportData = {
        checkIn: toDisplayTime(checkInDT),
        checkOut: toDisplayTime(checkOutDT),
        ...form,
        sitePhotos: photoData.length > 0 ? photoData : undefined,
      };
      generateReportPDF(reportData);
    } catch (err) {
      console.error('PDF generation failed:', err);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setTimeout(() => setIsGenerating(false), 1000);
    }
  };

  const sectionClass = "bg-surface border border-border rounded-lg p-5 mb-4";
  const labelClass = "block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1";
  const inputClass = "w-full bg-input border border-border rounded px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring transition-colors";
  const textareaClass = `${inputClass} resize-none`;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">

      {/* Time & Attendance */}
      <div className={sectionClass}>
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-4 h-4 text-accent-yellow" />
          <h2 className="text-sm font-bold text-foreground uppercase tracking-widest">Time & Attendance</h2>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end mb-4">
          {punchState !== 'out' && (
            <button
              onClick={handlePunch}
              className={`px-5 py-2 rounded font-bold text-sm uppercase tracking-wider transition-all ${
                punchState === 'in'
                  ? 'bg-destructive text-destructive-foreground hover:opacity-90'
                  : 'btn-yellow'
              }`}
            >
              {punchState === 'idle' ? '⏱ Punch In' : '⏹ Punch Out'}
            </button>
          )}
          {punchState === 'out' && (
            <button
              onClick={() => { setPunchState('idle'); setCheckInDT(''); setCheckOutDT(''); }}
              className="btn-secondary px-5 py-2 text-sm"
            >
              Reset
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Check In</label>
            {punchState === 'idle' ? (
              <div className="text-xs text-muted-foreground italic py-2">Press Punch In to record</div>
            ) : (
              <input
                type="datetime-local"
                value={checkInDT}
                onChange={(e) => setCheckInDT(e.target.value)}
                className={inputClass}
              />
            )}
          </div>

          <div>
            <label className={labelClass}>Check Out</label>
            {punchState !== 'out' ? (
              <div className="text-xs text-muted-foreground italic py-2">
                {punchState === 'in' ? 'Press Punch Out to record' : 'Press Punch In first'}
              </div>
            ) : (
              <input
                type="datetime-local"
                value={checkOutDT}
                onChange={(e) => setCheckOutDT(e.target.value)}
                className={inputClass}
              />
            )}
          </div>
        </div>
      </div>

      {/* Personnel */}
      <div className={sectionClass}>
        <div className="flex items-center gap-2 mb-4">
          <User className="w-4 h-4 text-accent-yellow" />
          <h2 className="text-sm font-bold text-foreground uppercase tracking-widest">Personnel</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Project Manager</label>
            <input
              type="text"
              name="projectManager"
              value={form.projectManager}
              onChange={handleChange}
              placeholder="Name"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Location Contact</label>
            <input
              type="text"
              name="locationContact"
              value={form.locationContact}
              onChange={handleChange}
              placeholder="Name"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Lead Technician</label>
            <input
              type="text"
              name="leadTechnician"
              value={form.leadTechnician}
              onChange={handleChange}
              placeholder="Name"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Assis Technician</label>
            <input
              type="text"
              name="assistTech"
              value={form.assistTech}
              onChange={handleChange}
              placeholder="Name"
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* Job Details */}
      <div className={sectionClass}>
        <div className="flex items-center gap-2 mb-4">
          <Briefcase className="w-4 h-4 text-accent-yellow" />
          <h2 className="text-sm font-bold text-foreground uppercase tracking-widest">Job Details</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Job Code</label>
            <input
              type="text"
              name="jobCode"
              value={form.jobCode}
              onChange={handleChange}
              placeholder="e.g. JC-2024-001"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Customer Name</label>
            <input
              type="text"
              name="customerName"
              value={form.customerName}
              onChange={handleChange}
              placeholder="Customer"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Job Location</label>
            <input
              type="text"
              name="jobLocation"
              value={form.jobLocation}
              onChange={handleChange}
              placeholder="Address or site name"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Job Type</label>
            <input
              type="text"
              name="jobType"
              value={form.jobType}
              onChange={handleChange}
              placeholder="e.g. Installation, Repair"
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* Job Description */}
      <div className={sectionClass}>
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-4 h-4 text-accent-yellow" />
          <h2 className="text-sm font-bold text-foreground uppercase tracking-widest">Job Description</h2>
        </div>
        <textarea
          name="jobDescription"
          value={form.jobDescription}
          onChange={handleChange}
          rows={4}
          placeholder="Describe the work performed..."
          className={textareaClass}
        />
      </div>

      {/* Completion Status */}
      <div className={sectionClass}>
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle className="w-4 h-4 text-accent-yellow" />
          <h2 className="text-sm font-bold text-foreground uppercase tracking-widest">Completion Status</h2>
        </div>
        <div className="flex flex-wrap gap-3">
          {['Fully Complete', 'Uncompleted', 'Partial', 'Pending Parts', 'Follow-Up Required'].map((status) => (
            <label key={status} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="completionStatus"
                value={status}
                checked={form.completionStatus === status}
                onChange={handleChange}
                className="accent-accent-yellow w-4 h-4"
              />
              <span className={`text-sm font-medium ${form.completionStatus === status ? 'text-accent-yellow' : 'text-muted-foreground'}`}>
                {status}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Close Out Report */}
      <div className={sectionClass}>
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="w-4 h-4 text-accent-yellow" />
          <h2 className="text-sm font-bold text-foreground uppercase tracking-widest">Close Out Report</h2>
        </div>
        <textarea
          name="closeOutReport"
          value={form.closeOutReport}
          onChange={handleChange}
          rows={4}
          placeholder="Summary of work completed, issues encountered, recommendations..."
          className={textareaClass}
        />
      </div>

      {/* Site Photos */}
      <div className={sectionClass}>
        <div className="flex items-center gap-2 mb-4">
          <Camera className="w-4 h-4 text-accent-yellow" />
          <h2 className="text-sm font-bold text-foreground uppercase tracking-widest">Site Photos</h2>
        </div>

        {/* Upload button */}
        <div
          className="border-2 border-dashed border-border rounded-lg p-5 flex flex-col items-center justify-center cursor-pointer hover:border-accent-yellow transition-colors mb-4"
          onClick={() => photoInputRef.current?.click()}
        >
          <ImagePlus className="w-8 h-8 text-muted-foreground mb-2" />
          <span className="text-sm text-muted-foreground">Click to add photos</span>
          <span className="text-xs text-muted-foreground mt-1">Multiple images supported</span>
        </div>
        <input
          ref={photoInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handlePhotoUpload}
        />

        {/* Photo list with label inputs */}
        {photos.length > 0 && (
          <div className="flex flex-col gap-4">
            {photos.map((entry, index) => (
              <div key={index} className="flex gap-3 bg-input border border-border rounded-lg p-3">
                {/* Thumbnail */}
                <div className="relative flex-shrink-0 w-24 h-24 rounded overflow-hidden border border-border">
                  <img
                    src={entry.previewUrl}
                    alt={`Site photo ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => removePhoto(index)}
                    className="absolute top-1 right-1 bg-black/70 hover:bg-destructive text-white rounded-full p-0.5 transition-colors"
                    aria-label="Remove photo"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>

                {/* Label input */}
                <div className="flex flex-col flex-1 justify-center gap-1">
                  <label className={labelClass}>
                    Photo {index + 1} — Description / Label
                  </label>
                  <input
                    type="text"
                    value={entry.label}
                    onChange={(e) => updatePhotoLabel(index, e.target.value)}
                    placeholder="e.g. Panel installation, Cable routing..."
                    className={inputClass}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {photos.length > 0 && (
          <p className="text-xs text-muted-foreground mt-3">
            {photos.length} photo{photos.length !== 1 ? 's' : ''} selected
          </p>
        )}
      </div>

      {/* Generate PDF Button */}
      <div className="mt-6">
        <button
          onClick={handleGeneratePDF}
          disabled={isGenerating}
          className="btn-yellow w-full py-3 text-base font-bold uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isGenerating ? (
            <>
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Generating PDF...
            </>
          ) : (
            <>
              <Download className="w-5 h-5" />
              Generate Report PDF
            </>
          )}
        </button>
      </div>
    </div>
  );
}
