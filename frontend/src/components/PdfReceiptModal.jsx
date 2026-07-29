import React from 'react';
import { X, Download, FileText, CheckCircle2, Clock, ShieldAlert } from 'lucide-react';

export default function PdfReceiptModal({ booking, isOpen, onClose }) {
  if (!isOpen || !booking) return null;

  const bookingId = booking._id || booking.id;
  const token = localStorage.getItem('sc_token') || localStorage.getItem('token') || '';
  
  const inlinePdfUrl = `/api/bookings/${bookingId}/receipt?inline=true&token=${token}`;
  const downloadPdfUrl = `/api/bookings/${bookingId}/receipt?token=${token}`;

  const isApproved = ['approved', 'checked_in', 'completed'].includes(booking.status);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="glass-card p-4 sm:p-6 rounded-3xl max-w-4xl w-full max-h-[92vh] overflow-y-auto space-y-4 shadow-2xl relative border border-slate-200/80 bg-white">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors"
          title="Close Preview"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pr-8">
          <div>
            <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-600 shrink-0" />
              Official PDF Receipt Preview
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Booking Ref: <strong className="font-mono text-emerald-800">{booking.booking_code || bookingId}</strong>
            </p>
          </div>

          {/* Admin Approval Status Badge */}
          <div>
            {isApproved ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 font-extrabold rounded-xl text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Verified & Approved (Good to Go)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-900 border border-amber-200 font-extrabold rounded-xl text-xs">
                <Clock className="w-4 h-4 text-amber-600" />
                Pending Admin Approval
              </span>
            )}
          </div>
        </div>

        {/* Pending Approval Notice */}
        {!isApproved && (
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5 font-medium">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              <strong>Admin Review Needed:</strong> This reservation is currently pending admin approval. Once approved by an administrator, the official receipt status automatically updates to <strong>Approved & Good to Go</strong>.
            </span>
          </div>
        )}

        {/* Embedded PDF View Frame */}
        <div className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-900 shadow-inner max-h-[65vh]">
          <iframe
            src={inlinePdfUrl}
            className="w-full h-[55vh] sm:h-[62vh] rounded-xl border-none"
            title={`PDF Receipt ${booking.booking_code}`}
          />
        </div>

        {/* Modal Action Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <p className="text-[11px] text-slate-500 text-center sm:text-left font-medium">
            Review the receipt above before downloading for your records.
          </p>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
            >
              Close
            </button>
            <a
              href={downloadPdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl text-xs inline-flex items-center gap-1.5 shadow-md hover:shadow-lg transition-all"
            >
              <Download className="w-4 h-4" /> Download PDF Receipt
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}
