import { useState, useRef } from 'react';
import {
    FileDown, Clock, Users, FileText, AlertCircle,
    CheckCircle2, RotateCcw, Briefcase, CheckSquare,
    Camera, X, Upload, LogIn, LogOut
} from 'lucide-react';
import { generateReportPDF, type ReportData } from '../utils/pdfGenerator';

interface FormErrors {
    checkIn?: string;
    checkOut?: string;
    projectManager?: string;
    leadTechnician?: string;
}

// Punch state: 'idle' | 'checked-in' | 'checked-out'
type PunchState = 'idle' | 'checked-in' | 'checked-out';

const initialData: Omit<ReportData, 'checkInDateTime' | 'checkOutDateTime'> & {
    checkInDateTime: string;
    checkOutDateTime: string;
} = {
    checkInDateTime: '',
    checkOutDateTime: '',
    closeOutReport: '',
    projectManager: '',
    locationContact: '',
    leadTechnician: '',
    helper: '',
    jobCode: '',
    customerName: '',
    jobLocation: '',
    jobType: '',
    jobDescription: '',
    completionStatus: 'Fully Complete',
    beforeImage: undefined,
    afterImage: undefined,
};

function formatTimestamp(isoStr: string): string {
    if (!isoStr) return '';
    try {
        const d = new Date(isoStr);
        return d.toLocaleString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric',
            hour: 'numeric', minute: '2-digit', hour12: true
        });
    } catch {
        return isoStr;
    }
}

function FieldError({ message }: { message?: string }) {
    if (!message) return null;
    return (
        <p className="mt-0.5 text-xs text-destructive flex items-center gap-1">
            <AlertCircle size={10} />
            {message}
        </p>
    );
}

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
    return (
        <div className="flex items-center gap-2 mb-3 pb-2.5 border-b border-border">
            <div className="flex items-center justify-center w-7 h-7 rounded bg-primary/10 border border-primary/20 shrink-0">
                {icon}
            </div>
            <h2 className="section-title">{title}</h2>
        </div>
    );
}

interface PhotoUploadSlotProps {
    id: string;
    label: string;
    value: string | undefined;
    onChange: (dataUrl: string | undefined) => void;
}

function PhotoUploadSlot({ id, label, value, onChange }: PhotoUploadSlotProps) {
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const result = ev.target?.result;
            if (typeof result === 'string') onChange(result);
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    };

    const handleRemove = () => {
        onChange(undefined);
        if (inputRef.current) inputRef.current.value = '';
    };

    return (
        <div className="flex flex-col gap-1.5">
            <span className="field-label">{label}</span>
            {value ? (
                <div className="relative group rounded-lg overflow-hidden border border-border bg-secondary/40">
                    <img src={value} alt={label} className="w-full object-cover max-h-44 rounded-lg" />
                    <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 transition-colors rounded-lg pointer-events-none" />
                    <button
                        type="button"
                        onClick={handleRemove}
                        className="absolute top-1.5 right-1.5 flex items-center justify-center w-6 h-6 rounded-full bg-background border border-border text-foreground shadow-sm hover:bg-secondary transition-colors"
                        aria-label={`Remove ${label}`}
                    >
                        <X size={11} />
                    </button>
                    <button
                        type="button"
                        onClick={() => inputRef.current?.click()}
                        className="absolute bottom-1.5 right-1.5 flex items-center gap-1 px-2.5 py-1 rounded-md bg-background border border-border text-xs font-medium text-foreground shadow-sm hover:bg-secondary transition-colors"
                    >
                        <Upload size={10} />
                        Replace
                    </button>
                </div>
            ) : (
                <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    className="flex flex-col items-center justify-center gap-2 w-full h-32 rounded-lg border-2 border-dashed border-border bg-secondary/30 hover:bg-secondary/60 hover:border-primary/40 transition-all cursor-pointer text-muted-foreground"
                >
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-background border border-border">
                        <Camera size={15} className="text-primary" />
                    </div>
                    <div className="text-center">
                        <p className="text-xs font-medium text-foreground">Click to upload</p>
                        <p className="text-xs text-muted-foreground">JPG, PNG, WEBP, HEIC</p>
                    </div>
                </button>
            )}
            <input
                ref={inputRef}
                id={id}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={handleFileChange}
            />
        </div>
    );
}

export default function ReportForm() {
    const [formData, setFormData] = useState<ReportData>({
        ...initialData,
        checkInDateTime: '',
        checkOutDateTime: '',
    });
    const [errors, setErrors] = useState<FormErrors>({});
    const [isGenerating, setIsGenerating] = useState(false);
    const [generated, setGenerated] = useState(false);
    const [punchState, setPunchState] = useState<PunchState>('idle');

    const handleChange = (field: keyof ReportData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setGenerated(false);
    };

    const handleImageChange = (field: 'beforeImage' | 'afterImage', value: string | undefined) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setGenerated(false);
    };

    const handlePunch = () => {
        const now = new Date().toISOString();
        if (punchState === 'idle') {
            setFormData(prev => ({ ...prev, checkInDateTime: now }));
            setErrors(prev => ({ ...prev, checkIn: undefined }));
            setPunchState('checked-in');
            setGenerated(false);
        } else if (punchState === 'checked-in') {
            setFormData(prev => ({ ...prev, checkOutDateTime: now }));
            setErrors(prev => ({ ...prev, checkOut: undefined }));
            setPunchState('checked-out');
            setGenerated(false);
        }
    };

    const handleResetPunch = () => {
        setFormData(prev => ({ ...prev, checkInDateTime: '', checkOutDateTime: '' }));
        setPunchState('idle');
        setErrors(prev => ({ ...prev, checkIn: undefined, checkOut: undefined }));
        setGenerated(false);
    };

    const validate = (): boolean => {
        const newErrors: FormErrors = {};
        if (!formData.checkInDateTime) newErrors.checkIn = 'Check-in is required — press Check In';
        if (!formData.checkOutDateTime) newErrors.checkOut = 'Check-out is required — press Check Out';
        if (!formData.projectManager.trim()) newErrors.projectManager = 'Project Manager name is required';
        if (!formData.leadTechnician.trim()) newErrors.leadTechnician = 'Lead Technician name is required';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleGeneratePDF = async () => {
        if (!validate()) return;
        setIsGenerating(true);
        try {
            await generateReportPDF(formData);
            setGenerated(true);
        } catch (err) {
            console.error('PDF generation failed:', err);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleReset = () => {
        setFormData({ ...initialData, checkInDateTime: '', checkOutDateTime: '' });
        setErrors({});
        setGenerated(false);
        setPunchState('idle');
    };

    // Duration preview
    let durationPreview: string | null = null;
    if (formData.checkInDateTime && formData.checkOutDateTime) {
        try {
            const inDt = new Date(formData.checkInDateTime);
            const outDt = new Date(formData.checkOutDateTime);
            const diffMs = outDt.getTime() - inDt.getTime();
            if (diffMs > 0) {
                const hours = Math.floor(diffMs / 3600000);
                const minutes = Math.floor((diffMs % 3600000) / 60000);
                durationPreview = `${hours}h ${minutes}m on site`;
            }
        } catch { /* ignore */ }
    }

    const hasErrors = Object.keys(errors).some(k => !!errors[k as keyof FormErrors]);

    // Punch button config
    const punchConfig = {
        idle: {
            label: 'Check In',
            icon: <LogIn size={15} />,
            className: 'bg-foreground text-background hover:bg-foreground/85 border-foreground',
        },
        'checked-in': {
            label: 'Check Out',
            icon: <LogOut size={15} />,
            className: 'bg-background text-foreground hover:bg-secondary border-foreground',
        },
        'checked-out': {
            label: 'Completed',
            icon: <CheckCircle2 size={15} />,
            className: 'bg-secondary text-muted-foreground border-border cursor-not-allowed opacity-60',
        },
    };

    const punch = punchConfig[punchState];

    return (
        <div className="w-full space-y-3">

            {/* ── Time & Attendance ─────────────────────────────────────── */}
            <section className="form-section-card">
                <SectionHeader icon={<Clock size={15} className="text-primary" />} title="Time & Attendance" />

                {/* Punch button row */}
                <div className="flex items-center gap-3 mb-3">
                    <button
                        type="button"
                        onClick={handlePunch}
                        disabled={punchState === 'checked-out'}
                        className={`flex items-center gap-2 px-4 py-2 rounded border font-semibold text-sm transition-all ${punch.className}`}
                    >
                        {punch.icon}
                        {punch.label}
                    </button>

                    {(punchState !== 'idle') && (
                        <button
                            type="button"
                            onClick={handleResetPunch}
                            className="flex items-center gap-1.5 px-3 py-2 rounded border border-border bg-secondary/50 text-xs text-muted-foreground hover:bg-secondary transition-colors"
                            title="Reset check-in/out"
                        >
                            <RotateCcw size={12} />
                            Reset
                        </button>
                    )}
                </div>

                {/* Timestamps display */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="flex flex-col gap-0.5">
                        <span className="field-label">Check-In Time</span>
                        <div className={`flex items-center gap-2 px-3 py-2 rounded border text-sm ${
                            formData.checkInDateTime
                                ? 'border-border bg-secondary/40 text-foreground'
                                : 'border-dashed border-border bg-secondary/20 text-muted-foreground'
                        }`}>
                            <LogIn size={13} className={formData.checkInDateTime ? 'text-primary' : 'text-muted-foreground'} />
                            <span className={formData.checkInDateTime ? 'font-medium' : 'text-xs italic'}>
                                {formData.checkInDateTime
                                    ? formatTimestamp(formData.checkInDateTime)
                                    : 'Not yet recorded'}
                            </span>
                        </div>
                        <FieldError message={errors.checkIn} />
                    </div>

                    <div className="flex flex-col gap-0.5">
                        <span className="field-label">Check-Out Time</span>
                        <div className={`flex items-center gap-2 px-3 py-2 rounded border text-sm ${
                            formData.checkOutDateTime
                                ? 'border-border bg-secondary/40 text-foreground'
                                : 'border-dashed border-border bg-secondary/20 text-muted-foreground'
                        }`}>
                            <LogOut size={13} className={formData.checkOutDateTime ? 'text-primary' : 'text-muted-foreground'} />
                            <span className={formData.checkOutDateTime ? 'font-medium' : 'text-xs italic'}>
                                {formData.checkOutDateTime
                                    ? formatTimestamp(formData.checkOutDateTime)
                                    : 'Not yet recorded'}
                            </span>
                        </div>
                        <FieldError message={errors.checkOut} />
                    </div>
                </div>

                {durationPreview && (
                    <div className="mt-2 flex items-center gap-2 px-3 py-2 rounded border border-border bg-secondary/60">
                        <Clock size={12} className="text-primary shrink-0" />
                        <span className="text-xs font-semibold text-foreground">
                            Total Duration: <span className="text-primary">{durationPreview}</span>
                        </span>
                    </div>
                )}
            </section>

            {/* ── Personnel ─────────────────────────────────────────────── */}
            <section className="form-section-card">
                <SectionHeader icon={<Users size={15} className="text-primary" />} title="Personnel" />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                        <label className="field-label" htmlFor="projectManager">
                            Project Manager <span className="text-primary">*</span>
                        </label>
                        <input
                            id="projectManager"
                            type="text"
                            placeholder="Full name of project manager"
                            className={`styled-input ${errors.projectManager ? 'border-destructive ring-1 ring-destructive/50' : ''}`}
                            value={formData.projectManager}
                            onChange={e => handleChange('projectManager', e.target.value)}
                        />
                        <FieldError message={errors.projectManager} />
                    </div>

                    <div>
                        <label className="field-label" htmlFor="locationContact">
                            Location Contact
                        </label>
                        <input
                            id="locationContact"
                            type="text"
                            placeholder="On-site contact person"
                            className="styled-input"
                            value={formData.locationContact}
                            onChange={e => handleChange('locationContact', e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="field-label" htmlFor="leadTechnician">
                            Lead Technician <span className="text-primary">*</span>
                        </label>
                        <input
                            id="leadTechnician"
                            type="text"
                            placeholder="Full name of lead technician"
                            className={`styled-input ${errors.leadTechnician ? 'border-destructive ring-1 ring-destructive/50' : ''}`}
                            value={formData.leadTechnician}
                            onChange={e => handleChange('leadTechnician', e.target.value)}
                        />
                        <FieldError message={errors.leadTechnician} />
                    </div>

                    <div>
                        <label className="field-label" htmlFor="helper">
                            Helper / Assistant
                        </label>
                        <input
                            id="helper"
                            type="text"
                            placeholder="Helper name (if applicable)"
                            className="styled-input"
                            value={formData.helper}
                            onChange={e => handleChange('helper', e.target.value)}
                        />
                    </div>
                </div>
            </section>

            {/* ── Job Details ───────────────────────────────────────────── */}
            <section className="form-section-card">
                <SectionHeader icon={<Briefcase size={15} className="text-primary" />} title="Job Details" />

                <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                            <label className="field-label" htmlFor="jobCode">Job Code</label>
                            <input
                                id="jobCode"
                                type="text"
                                placeholder="e.g. JC-2024-001"
                                className="styled-input"
                                value={formData.jobCode}
                                onChange={e => handleChange('jobCode', e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="field-label" htmlFor="customerName">Customer Name</label>
                            <input
                                id="customerName"
                                type="text"
                                placeholder="Customer or client name"
                                className="styled-input"
                                value={formData.customerName}
                                onChange={e => handleChange('customerName', e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="field-label" htmlFor="jobLocation">Job Location</label>
                            <input
                                id="jobLocation"
                                type="text"
                                placeholder="Address or site name"
                                className="styled-input"
                                value={formData.jobLocation}
                                onChange={e => handleChange('jobLocation', e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="field-label" htmlFor="jobType">Job Type / Category</label>
                        <input
                            id="jobType"
                            type="text"
                            placeholder="e.g. Installation, Maintenance, Inspection, Repair..."
                            className="styled-input"
                            value={formData.jobType}
                            onChange={e => handleChange('jobType', e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="field-label" htmlFor="completionStatus">Completion Status</label>
                        <select
                            id="completionStatus"
                            className="styled-input"
                            value={formData.completionStatus}
                            onChange={e => handleChange('completionStatus', e.target.value)}
                        >
                            <option value="Fully Complete">Fully Complete</option>
                            <option value="Partially Complete">Partially Complete</option>
                            <option value="Requires Follow-Up">Requires Follow-Up</option>
                            <option value="On Hold">On Hold</option>
                            <option value="Cancelled">Cancelled</option>
                        </select>
                    </div>

                    <div>
                        <label className="field-label" htmlFor="jobDescription">Job Description</label>
                        <textarea
                            id="jobDescription"
                            rows={3}
                            placeholder="Describe the work performed, scope, and any relevant details..."
                            className="styled-input resize-none"
                            value={formData.jobDescription}
                            onChange={e => handleChange('jobDescription', e.target.value)}
                        />
                    </div>
                </div>
            </section>

            {/* ── Close Out Report ──────────────────────────────────────── */}
            <section className="form-section-card">
                <SectionHeader icon={<FileText size={15} className="text-primary" />} title="Close Out Report" />
                <div>
                    <label className="field-label" htmlFor="closeOutReport">Summary / Notes</label>
                    <textarea
                        id="closeOutReport"
                        rows={4}
                        placeholder="Enter close-out summary, observations, issues encountered, materials used, next steps..."
                        className="styled-input resize-none"
                        value={formData.closeOutReport}
                        onChange={e => handleChange('closeOutReport', e.target.value)}
                    />
                </div>
            </section>

            {/* ── Site Photos ───────────────────────────────────────────── */}
            <section className="form-section-card">
                <SectionHeader icon={<Camera size={15} className="text-primary" />} title="Site Photos" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <PhotoUploadSlot
                        id="beforeImage"
                        label="Before Picture"
                        value={formData.beforeImage}
                        onChange={v => handleImageChange('beforeImage', v)}
                    />
                    <PhotoUploadSlot
                        id="afterImage"
                        label="After Picture"
                        value={formData.afterImage}
                        onChange={v => handleImageChange('afterImage', v)}
                    />
                </div>
            </section>

            {/* ── Actions ───────────────────────────────────────────────── */}
            <section className="form-section-card">
                <SectionHeader icon={<CheckSquare size={15} className="text-primary" />} title="Generate Report" />

                {hasErrors && (
                    <div className="mb-3 flex items-start gap-2 px-3 py-2.5 rounded border border-destructive/40 bg-destructive/5 text-destructive text-xs">
                        <AlertCircle size={13} className="shrink-0 mt-0.5" />
                        <span>Please fix the errors above before generating the report.</span>
                    </div>
                )}

                <div className="flex flex-col sm:flex-row gap-2">
                    <button
                        type="button"
                        onClick={handleGeneratePDF}
                        disabled={isGenerating}
                        className="btn-primary flex items-center justify-center gap-2 flex-1"
                    >
                        {isGenerating ? (
                            <>
                                <div className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                                Generating PDF…
                            </>
                        ) : generated ? (
                            <>
                                <CheckCircle2 size={15} />
                                Download Again
                            </>
                        ) : (
                            <>
                                <FileDown size={15} />
                                Generate PDF Report
                            </>
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={handleReset}
                        className="btn-secondary flex items-center justify-center gap-2 sm:w-auto"
                    >
                        <RotateCcw size={14} />
                        Reset Form
                    </button>
                </div>

                {generated && (
                    <p className="mt-2 text-xs text-center text-muted-foreground flex items-center justify-center gap-1.5">
                        <CheckCircle2 size={12} className="text-primary" />
                        PDF downloaded successfully.
                    </p>
                )}
            </section>
        </div>
    );
}
