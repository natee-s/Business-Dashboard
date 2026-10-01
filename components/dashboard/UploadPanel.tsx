'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, FileSpreadsheet, CheckCircle, XCircle, Clock, Trash2, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';

interface UploadLog {
  id: number;
  filename: string;
  uploaded_at: string;
  rows_inserted: number;
  rows_skipped: number;
  rows_total: number;
  status: string;
}

interface UploadResult {
  success?: boolean;
  error?: string;
  filename?: string;
  totalParsed?: number;
  inserted?: number;
  skipped?: number;
  parseErrors?: string[];
}

interface UploadPanelProps {
  onUploadSuccess: () => void;
}

export function UploadPanel({ onUploadSuccess }: UploadPanelProps) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [logs, setLogs] = useState<UploadLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchLogs = useCallback(async () => {
    setLogsLoading(true);
    try {
      const res = await fetch('/api/upload');
      const data = await res.json();
      setLogs(data.logs || []);
    } finally {
      setLogsLoading(false);
    }
  }, []);

  const handleFile = async (file: File) => {
    if (!file) return;
    setUploading(true);
    setResult(null);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data: UploadResult = await res.json();
      setResult(data);
      if (data.success) { onUploadSuccess(); fetchLogs(); }
    } catch (err) {
      setResult({ error: `เกิดข้อผิดพลาด: ${err}` });
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDeleteAll = async () => {
    const res = await fetch('/api/transactions?all=true', { method: 'DELETE' });
    if (res.ok) {
      setDeleteConfirm(false);
      setResult(null);
      onUploadSuccess();
      fetchLogs();
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5 text-indigo-500" />
          อัปโหลดข้อมูล POS
        </CardTitle>
        <div className="flex gap-1">
          <button
            onClick={() => { setShowLogs(!showLogs); if (!showLogs) fetchLogs(); }}
            className="inline-flex items-center gap-1 h-8 px-3 rounded-xl text-xs font-medium transition-all"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg-surface-hover)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = ''}
          >
            <Clock className="w-3.5 h-3.5" />ประวัติ
          </button>
          <button
            onClick={() => setDeleteConfirm(true)}
            className="inline-flex items-center gap-1 h-8 px-3 rounded-xl text-xs font-medium transition-all text-red-500"
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.1)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = ''}
          >
            <Trash2 className="w-3.5 h-3.5" />ล้างข้อมูล
          </button>
        </div>
      </CardHeader>
      <CardContent className="p-5 pt-0">
        {/* Drop zone */}
        <div
          className="relative rounded-2xl border-2 border-dashed transition-all cursor-pointer"
          style={{
            borderColor: dragging ? '#6366f1' : 'var(--border)',
            background: dragging ? 'rgba(99,102,241,0.08)' : 'transparent',
          }}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          onMouseEnter={e => { if (!dragging) (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-strong)'; }}
          onMouseLeave={e => { if (!dragging) (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; }}
        >
          <input ref={fileInputRef} type="file" accept=".xls,.xlsx" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
          <div className="flex flex-col items-center justify-center py-8 px-4 gap-3">
            {uploading ? (
              <>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center animate-pulse" style={{ background: 'rgba(99,102,241,0.15)' }}>
                  <Upload className="w-6 h-6 text-indigo-500 animate-bounce" />
                </div>
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>กำลังประมวลผล...</span>
              </>
            ) : (
              <>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'var(--bg-surface-hover)' }}>
                  <FileSpreadsheet className="w-6 h-6 text-indigo-500" />
                </div>
                <div className="text-center">
                  <div className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>ลาก Excel มาวางที่นี่</div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>หรือคลิกเพื่อเลือกไฟล์ .xls / .xlsx</div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Result */}
        {result && (
          <div className={`mt-3 rounded-xl p-4 ${result.error ? 'bg-red-500/10 border border-red-500/25' : 'bg-emerald-500/10 border border-emerald-500/25'}`}>
            {result.error ? (
              <div className="flex items-start gap-2">
                <XCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                <span className="text-sm text-red-600">{result.error}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                <div className="text-sm text-emerald-600">
                  <span className="font-medium">{result.filename}</span>
                  {' '}— เพิ่มใหม่ <span className="font-bold">{formatCurrency(result.inserted || 0)}</span> แถว,
                  ข้ามซ้ำ <span className="font-bold">{formatCurrency(result.skipped || 0)}</span> แถว
                </div>
              </div>
            )}
            {result.parseErrors && result.parseErrors.length > 0 && (
              <div className="mt-2 space-y-1">
                {result.parseErrors.map((e, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-xs text-amber-600">
                    <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" />
                    {e}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* History */}
        {showLogs && (
          <div className="mt-4">
            <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>ประวัติการอัปโหลด</div>
            {logsLoading ? (
              <div className="text-sm py-4 text-center" style={{ color: 'var(--text-faint)' }}>กำลังโหลด...</div>
            ) : logs.length === 0 ? (
              <div className="text-sm py-4 text-center" style={{ color: 'var(--text-faint)' }}>ยังไม่มีประวัติ</div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {logs.map(log => (
                  <div key={log.id} className="flex items-center justify-between p-3 rounded-xl text-xs" style={{ background: 'var(--bg-surface-hover)' }}>
                    <div>
                      <div className="font-medium truncate max-w-[180px]" style={{ color: 'var(--text-secondary)' }}>{log.filename}</div>
                      <div className="mt-0.5" style={{ color: 'var(--text-muted)' }}>{log.uploaded_at.slice(0, 16).replace('T', ' ')}</div>
                    </div>
                    <div className="text-right">
                      <Badge variant="success">+{log.rows_inserted}</Badge>
                      {log.rows_skipped > 0 && <span className="ml-1" style={{ color: 'var(--text-muted)' }}>/{log.rows_skipped} ซ้ำ</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Delete confirm modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="rounded-2xl border shadow-2xl p-6 max-w-sm w-full mx-4" style={{ background: 'var(--tooltip-bg)', borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.15)' }}>
                  <Trash2 className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>ล้างข้อมูลทั้งหมด?</div>
                  <div className="text-sm" style={{ color: 'var(--text-muted)' }}>ข้อมูลการขายทั้งหมดจะถูกลบถาวร</div>
                </div>
              </div>
              <div className="flex gap-3">
                <button className="flex-1 h-10 rounded-xl border text-sm font-medium transition-all" style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }} onClick={() => setDeleteConfirm(false)}>ยกเลิก</button>
                <button className="flex-1 h-10 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-medium transition-all" onClick={handleDeleteAll}>ล้างข้อมูล</button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
