
import React, { useEffect, useMemo, useState } from 'react';
import { useCandidates, useRefreshDb, useForceRefresh } from '../../../hooks/useDbQueries';
import { DataFetchState } from '../../../src/components/DataFetchState';
import { ArrowPathIcon, CloudArrowUpIcon, DocumentChartBarIcon, PrinterIcon } from '@heroicons/react/24/outline';

export const ReportsManager: React.FC = () => {
    const {
      data: candidates = [],
      isLoading,
      isFetching,
      isError,
      error,
      refetch,
    } = useCandidates();
    const refreshDb = useRefreshDb();
    const forceRefresh = useForceRefresh();

    useEffect(() => {
        console.log('[ReportsManager] mount — force refresh candidates');
        void forceRefresh.candidates();
    }, []);

    const [syncStatus, setSyncStatus] = useState<'Synced'|'Syncing'|'Error'>('Synced');
    const [lastSync, setLastSync] = useState(new Date().toLocaleTimeString());

    const stats = useMemo(() => ({
        total: candidates.length,
        hired: candidates.filter((e) => e.status === 'HIRED').length,
        rejected: candidates.filter((e) => e.status === 'REJECTED').length,
        active: candidates.filter((e) => ['APPLIED', 'SCREENING', 'INTERVIEW'].includes(e.status)).length,
    }), [candidates]);

    const handleSync = async () => {
        setSyncStatus('Syncing');
        try {
            console.log('[ReportsManager] handleSync — force refresh');
            await refreshDb({ force: true });
            setSyncStatus('Synced');
            setLastSync(new Date().toLocaleTimeString());
        } catch {
            setSyncStatus('Error');
        }
    }

    const handlePrint = () => {
        window.print();
    }

    return (
        <DataFetchState
          isLoading={isLoading}
          isFetching={isFetching && !isLoading}
          error={isError ? error : null}
          onRetry={() => { void refetch(); }}
        >
        <div className="space-y-6">
            <style>{`
                @media print {
                    body * { visibility: hidden; }
                    #print-area, #print-area * { visibility: visible; }
                    #print-area { position: absolute; left: 0; top: 0; width: 100%; }
                    button { display: none !important; }
                }
            `}</style>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Progress Report */}
                <div id="print-area" className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><DocumentChartBarIcon className="h-6 w-6 text-blue-600"/> Laporan Rekrutmen</h3>
                    <p className="text-xs text-gray-500 mb-4">Generated on: {new Date().toLocaleDateString()}</p>
                    <div className="space-y-4">
                        <ProgressBar label="Diterima (Hired)" count={stats.hired} total={stats.total} color="bg-green-500" />
                        <ProgressBar label="Ditolak (Rejected)" count={stats.rejected} total={stats.total} color="bg-red-500" />
                        <ProgressBar label="Dalam Proses (Active)" count={stats.active} total={stats.total} color="bg-blue-500" />
                    </div>
                    <div className="mt-6 pt-4 border-t flex justify-between text-sm text-gray-500">
                        <span>Total Pelamar: <b>{stats.total}</b></span>
                        <span>Conversion Rate: <b>{stats.total ? ((stats.hired / stats.total) * 100).toFixed(1) : 0}%</b></span>
                    </div>
                </div>

                {/* Sync & Export */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><CloudArrowUpIcon className="h-6 w-6 text-purple-600"/> Data & Export</h3>
                    <div className="flex items-center justify-between bg-gray-50 p-4 rounded mb-4">
                        <div>
                            <p className="font-bold text-gray-700">Database Status</p>
                            <p className="text-xs text-gray-500">Last synced: {lastSync}</p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-bold ${syncStatus==='Synced'?'bg-green-100 text-green-700':'bg-yellow-100 text-yellow-700'}`}>{syncStatus}</span>
                    </div>
                    <button onClick={handleSync} className="w-full mb-3 flex justify-center items-center py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                        {syncStatus === 'Syncing' ? <ArrowPathIcon className="h-5 w-5 animate-spin"/> : 'Sync Now'}
                    </button>
                    <button onClick={handlePrint} className="w-full py-2 border border-gray-300 rounded hover:bg-gray-50 text-gray-700 flex items-center justify-center gap-2">
                         <PrinterIcon className="h-5 w-5"/> Print / Save PDF
                    </button>
                </div>
            </div>
        </div>
        </DataFetchState>
    );
};

const ProgressBar = ({ label, count, total, color }: any) => {
    const pct = total ? (count / total) * 100 : 0;
    return (
        <div>
            <div className="flex justify-between text-sm mb-1">
                <span>{label}</span>
                <span className="font-bold">{count}</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className={`h-full ${color}`} style={{ width: `${pct}%` }}></div>
            </div>
        </div>
    )
}
