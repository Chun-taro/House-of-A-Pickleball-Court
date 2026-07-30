import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
  Database,
  HardDrive,
  RefreshCw,
  Server,
  Layers,
  PieChart,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

export default function DatabaseStorageWidget({ compact = false }) {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCollections, setShowCollections] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Strict check: Only render if user is Admin
  if (!user || user.role !== 'admin') {
    return null;
  }

  const fetchStorageStats = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    setError(null);

    try {
      const res = await axios.get('/api/reports/db-storage');
      if (res.data.success) {
        setData(res.data);
      } else {
        setError(res.data.message || 'Failed to load database storage metrics');
      }
    } catch (err) {
      console.error('Database Storage Fetch Error:', err);
      setError(
        err.response?.data?.message ||
          'Failed to retrieve database storage data. Ensure server is connected.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStorageStats();
  }, []);

  if (loading) {
    return (
      <div className="glass-card p-6 rounded-3xl border border-slate-200 shadow-xl space-y-4 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="h-6 w-48 bg-slate-200 rounded-lg"></div>
          <div className="h-8 w-8 bg-slate-200 rounded-xl"></div>
        </div>
        <div className="h-4 w-full bg-slate-200 rounded-full"></div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
          <div className="h-16 bg-slate-200 rounded-2xl"></div>
          <div className="h-16 bg-slate-200 rounded-2xl"></div>
          <div className="h-16 bg-slate-200 rounded-2xl"></div>
          <div className="h-16 bg-slate-200 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card p-6 rounded-3xl border border-rose-200 bg-rose-50/50 shadow-lg space-y-3">
        <div className="flex items-center justify-between text-rose-800">
          <div className="flex items-center gap-2 font-bold text-sm">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>Database Storage Monitor</span>
          </div>
          <button
            onClick={() => fetchStorageStats(true)}
            className="p-2 rounded-xl bg-white border border-rose-200 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center gap-1 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Retry
          </button>
        </div>
        <p className="text-xs text-rose-700 font-medium">{error}</p>
      </div>
    );
  }

  const { dbName, stats = {}, collections = [] } = data || {};
  const {
    maxStorageMB = 512,
    totalUsedMB = '0.00',
    availableStorageMB = '512.00',
    dataSizeMB = '0.00',
    indexSizeMB = '0.00',
    usedPercentage = 0,
    objectsCount = 0,
    collectionsCount = 0,
  } = stats;

  const usedMBNum = parseFloat(totalUsedMB || '0');

  // Determine meter color threshold (Warning triggers at 50 MB+ or 70%+ capacity)
  let statusColor = 'emerald';
  let StatusIcon = CheckCircle2;

  if (usedPercentage >= 90 || usedMBNum >= 450) {
    statusColor = 'rose';
    StatusIcon = ShieldAlert;
  } else if (usedMBNum >= 50 || usedPercentage >= 70) {
    statusColor = 'amber';
    StatusIcon = AlertTriangle;
  }

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="glass-card p-6 sm:p-7 rounded-3xl space-y-6 shadow-xl border border-slate-200/90 bg-gradient-to-br from-white via-slate-50/50 to-emerald-50/20">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200/70 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-2xl bg-emerald-600 text-white shadow-md">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-slate-900 tracking-tight">
                  Database Storage Available
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
                  Admin View Only
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-500">
                MongoDB Cluster: <span className="font-mono font-bold text-slate-700">{dbName}</span>
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => fetchStorageStats(true)}
          disabled={refreshing}
          className="self-end sm:self-auto px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs shadow-md flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          title="Refresh Live Storage Metrics"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${refreshing ? 'animate-spin' : ''}`} />
          <span>{refreshing ? 'Refreshing...' : 'Refresh Storage'}</span>
        </button>
      </div>

      {/* 50MB+ Storage Warning Banner */}
      {(usedMBNum >= 50 || usedPercentage >= 70) && (
        <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-950 flex items-start gap-3 shadow-sm">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <h4 className="font-black text-xs uppercase tracking-wider text-amber-900 flex items-center gap-2">
              Storage Warning: Usage Reached {totalUsedMB} MB
              <span className="px-2 py-0.5 rounded-md bg-amber-200 text-amber-950 font-mono text-[10px]">50 MB+ Alert Threshold</span>
            </h4>
            <p className="text-xs text-amber-800 font-medium leading-relaxed">
              Your database storage usage has passed <strong>50 MB</strong> ({totalUsedMB} MB used). The system is getting closer to capacity limit ({maxStorageMB} MB). Monitor your storage to prevent hitting full capacity.
            </p>
          </div>
        </div>
      )}

      {/* Primary Available Storage Callout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Available Capacity Highlight */}
        <div className="md:col-span-2 p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white shadow-lg relative overflow-hidden flex flex-col justify-between">
          <div className="absolute right-[-20px] bottom-[-20px] opacity-10 pointer-events-none">
            <HardDrive className="w-48 h-48 text-emerald-400" />
          </div>

          <div className="flex items-center justify-between z-10">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-lg border border-emerald-800/60">
              Storage Available
            </span>
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
              <StatusIcon className={`w-4 h-4 text-${statusColor}-400`} />
              <span>{usedPercentage}% Used</span>
            </div>
          </div>

          <div className="my-3 z-10">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-emerald-300">
                {availableStorageMB} MB
              </span>
              <span className="text-xs text-slate-400 font-semibold">
                free of {maxStorageMB} MB limit
              </span>
            </div>
          </div>

          {/* Visual Progress Bar */}
          <div className="space-y-1.5 z-10">
            <div className="h-3.5 w-full bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
              <div
                style={{ width: `${Math.max(usedPercentage, 1)}%` }}
                className={`h-full rounded-full transition-all duration-700 bg-gradient-to-r ${
                  usedPercentage >= 90
                    ? 'from-rose-500 to-rose-400'
                    : usedPercentage >= 70
                    ? 'from-amber-500 to-amber-400'
                    : 'from-emerald-500 to-emerald-400'
                }`}
              ></div>
            </div>
            <div className="flex justify-between text-[10px] font-extrabold text-slate-400">
              <span>{totalUsedMB} MB Allocated</span>
              <span>Quota: {maxStorageMB} MB</span>
            </div>
          </div>
        </div>

        {/* Quota & Objects Summary */}
        <div className="space-y-3 flex flex-col justify-between">
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Document Data Size
            </span>
            <p className="text-xl font-extrabold text-slate-900 font-mono">{dataSizeMB} MB</p>
            <p className="text-[10px] text-slate-500 font-semibold">Uncompressed document payload</p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Index Storage Footprint
            </span>
            <p className="text-xl font-extrabold text-slate-900 font-mono">{indexSizeMB} MB</p>
            <p className="text-[10px] text-slate-500 font-semibold">Database search & lookup indexes</p>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
        <div className="p-3.5 rounded-2xl bg-white/80 border border-slate-200">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Total Collections
          </span>
          <p className="text-lg font-black text-slate-900 mt-0.5">{collectionsCount}</p>
        </div>
        <div className="p-3.5 rounded-2xl bg-white/80 border border-slate-200">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Total Documents
          </span>
          <p className="text-lg font-black text-slate-900 mt-0.5">{objectsCount}</p>
        </div>
        <div className="p-3.5 rounded-2xl bg-white/80 border border-slate-200">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Capacity Limit
          </span>
          <p className="text-lg font-black text-slate-900 mt-0.5 font-mono">{maxStorageMB} MB</p>
        </div>
        <div className="p-3.5 rounded-2xl bg-white/80 border border-slate-200">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Storage Health
          </span>
          <p className={`text-sm font-extrabold mt-1 text-${statusColor}-600`}>
            {usedPercentage >= 90 || usedMBNum >= 450 ? 'Critical' : (usedMBNum >= 50 || usedPercentage >= 70) ? 'Warning (50MB+)' : 'Optimal'}
          </p>
        </div>
      </div>

      {/* Collapsible Collections Breakdown */}
      {!compact && collections.length > 0 && (
        <div className="pt-2 border-t border-slate-200/80">
          <button
            onClick={() => setShowCollections(!showCollections)}
            className="w-full flex items-center justify-between py-2 text-xs font-bold text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-600" />
              Collection Storage Breakdown ({collections.length} Collections)
            </span>
            {showCollections ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {showCollections && (
            <div className="mt-3 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
              <table className="w-full text-left text-xs text-slate-700 min-w-[500px]">
                <thead className="bg-slate-100/80 text-slate-500 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="p-3">Collection Name</th>
                    <th className="p-3 text-right">Document Count</th>
                    <th className="p-3 text-right">Data Size</th>
                    <th className="p-3 text-right">Storage + Index Size</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {collections.map((col) => (
                    <tr key={col.name} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-mono font-bold text-slate-900">{col.name}</td>
                      <td className="p-3 text-right font-mono">{col.count}</td>
                      <td className="p-3 text-right font-mono">{formatBytes(col.sizeBytes)}</td>
                      <td className="p-3 text-right font-mono font-bold text-emerald-800">
                        {formatBytes(col.totalSizeBytes)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
