
import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { StudentData, TardinessRecord, GeneratedOutput, TardinessCategory } from './types';
import { generateTardinessReport, generateMonthlyReport } from './services/geminiService';
import { LogoIcon, SummaryIcon, WhatsAppIcon, RecapIcon, CopyIcon, CheckIcon, ExportIcon, PdfIcon, ExcelIcon, MoonIcon, SunIcon, InsightIcon, TagIcon, ClassIcon, PieChartIcon, NotificationIcon, SettingsIcon, TrashIcon, DatabaseIcon, UserPlusIcon, SearchIcon } from './components/icons';
import { students as defaultStudents, StudentInfo } from './data/students';
import { supabase } from './lib/supabase';

// Helper component for the form
const InputForm: React.FC<{
  onSubmit: (data: StudentData) => void;
  schoolStartTime: string;
  allStudents: StudentInfo[];
  isSubmitting: boolean;
}> = ({ onSubmit, schoolStartTime, allStudents, isSubmitting }) => {
  const getCurrentTime = () => {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const [name, setName] = useState('');
  const [className, setClassName] = useState('');
  const [arrivalTime, setArrivalTime] = useState(getCurrentTime);
  const [selectedReason, setSelectedReason] = useState('Macet');
  const [customReason, setCustomReason] = useState('');

  const [nameSuggestions, setNameSuggestions] = useState<StudentInfo[]>([]);
  const [showNameSuggestions, setShowNameSuggestions] = useState(false);
  
  const [classSuggestions, setClassSuggestions] = useState<string[]>([]);
  const [showClassSuggestions, setShowClassSuggestions] = useState(false);

  const availableClassNames = useMemo(() => {
    return Array.from(new Set(allStudents.map(s => s.className))).sort();
  }, [allStudents]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setName(value);
    if (value.length > 1) {
      const filtered = allStudents
        .filter(s => s.name.toLowerCase().includes(value.toLowerCase()))
        .slice(0, 5);
      setNameSuggestions(filtered);
      setShowNameSuggestions(true);
    } else {
      setShowNameSuggestions(false);
    }
  };

  const handleNameSuggestionClick = (student: StudentInfo) => {
    setName(student.name);
    setClassName(student.className);
    setShowNameSuggestions(false);
  };

  const handleClassNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setClassName(value);
    if (value.length > 0) {
        const filtered = availableClassNames
            .filter(c => c.toLowerCase().includes(value.toLowerCase()))
            .slice(0, 5);
        setClassSuggestions(filtered);
        setShowClassSuggestions(true);
    } else {
        setShowClassSuggestions(false);
    }
  };

  const handleClassSuggestionClick = (name: string) => {
      setClassName(name);
      setShowClassSuggestions(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !className || !arrivalTime) {
      alert('Nama, Kelas, dan Jam Kedatangan wajib diisi.');
      return;
    }
    const reason = selectedReason === 'Lainnya...' ? customReason : selectedReason;
    onSubmit({ name, className, arrivalTime, reason });
    setName('');
    setClassName('');
    setArrivalTime(getCurrentTime());
    setSelectedReason('Macet');
    setCustomReason('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="relative">
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nama Siswa</label>
        <input 
          type="text" 
          id="name" 
          value={name} 
          onChange={handleNameChange} 
          onBlur={() => setTimeout(() => setShowNameSuggestions(false), 200)}
          onFocus={handleNameChange}
          required 
          autoComplete="off"
          className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" />
        {showNameSuggestions && nameSuggestions.length > 0 && (
          <ul className="absolute z-20 w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md mt-1 shadow-lg max-h-60 overflow-auto">
            {nameSuggestions.map((s, index) => (
              <li key={index} onMouseDown={() => handleNameSuggestionClick(s)} className="px-3 py-2 hover:bg-sky-50 dark:hover:bg-gray-600 cursor-pointer text-sm">
                {s.name} <span className="text-xs text-gray-500 dark:text-gray-400">({s.className})</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="relative">
        <label htmlFor="className" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Kelas</label>
        <input 
            type="text" 
            id="className" 
            value={className} 
            onChange={handleClassNameChange} 
            onBlur={() => setTimeout(() => setShowClassSuggestions(false), 200)}
            onFocus={handleClassNameChange}
            required 
            autoComplete="off"
            className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" />
        {showClassSuggestions && classSuggestions.length > 0 && (
          <ul className="absolute z-10 w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md mt-1 shadow-lg max-h-60 overflow-auto">
            {classSuggestions.map((c, index) => (
              <li key={index} onMouseDown={() => handleClassSuggestionClick(c)} className="px-3 py-2 hover:bg-sky-50 dark:hover:bg-gray-600 cursor-pointer text-sm">
                {c}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Jam Masuk</label>
          <input type="time" value={schoolStartTime} disabled className="mt-1 block w-full px-3 py-2 bg-gray-100 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm sm:text-sm" />
        </div>
        <div>
          <label htmlFor="arrivalTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Jam Datang</label>
          <input type="time" id="arrivalTime" value={arrivalTime} min={schoolStartTime} max="23:59" onChange={e => setArrivalTime(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" />
        </div>
      </div>
      <div>
        <label htmlFor="reason" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Alasan Keterlambatan</label>
        <select
          id="reason"
          value={selectedReason}
          onChange={e => setSelectedReason(e.target.value)}
          className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
        >
          <option>Macet</option>
          <option>Telat Bangun</option>
          <option>Hujan</option>
          <option>Tidur Larut Malam</option>
          <option value="Lainnya...">Lainnya...</option>
        </select>
      </div>
      {selectedReason === 'Lainnya...' && (
        <div>
          <label htmlFor="customReason" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Alasan Lainnya
          </label>
          <textarea
            id="customReason"
            value={customReason}
            onChange={e => setCustomReason(e.target.value)}
            rows={2}
            className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
            placeholder="Tuliskan alasan spesifik..."
          />
        </div>
      )}
      <button type="submit" disabled={isSubmitting} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-colors disabled:bg-sky-400">
        {isSubmitting ? 'Menyimpan & Menganalisis...' : 'Proses & Buat Laporan'}
      </button>
    </form>
  );
};

// Helper Component for Output
const OutputDisplay: React.FC<{ 
    output: GeneratedOutput | null; 
    isLoading: boolean;
    error: string | null;
    dailyRecords: TardinessRecord[];
}> = ({ output, isLoading, error, dailyRecords }) => {
    const [copiedStates, setCopiedStates] = useState({
      whatsapp: false,
    });

    const handleCopy = (text: string, type: 'whatsapp') => {
        navigator.clipboard.writeText(text).then(() => {
            setCopiedStates(prev => ({ ...prev, [type]: true }));
            setTimeout(() => setCopiedStates(prev => ({ ...prev, [type]: false })), 2000);
        });
    };

    const exportToPDF = () => {
        if (!output) return;
        const doc = new jsPDF();
        const dateStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
        
        doc.setFontSize(20);
        doc.text("Laporan Harian LazGo", 14, 20);
        doc.setFontSize(10);
        doc.text(`Tanggal: ${dateStr}`, 14, 28);
        
        doc.setFontSize(12);
        doc.text("Ringkasan AI:", 14, 40);
        doc.setFontSize(10);
        const summaryLines = doc.splitTextToSize(output.summary, 180);
        doc.text(summaryLines, 14, 46);
        
        autoTable(doc, {
            startY: 46 + (summaryLines.length * 5),
            head: [['Nama', 'Kelas', 'Jam', 'Durasi', 'Kategori']],
            body: dailyRecords.map(r => [r.name, r.className, r.arrivalTime, `${r.durationMinutes} mnt`, r.category]),
        });
        
        doc.save(`LazGo_Harian_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    const exportToExcel = () => {
        if (dailyRecords.length === 0) return;
        const wsData = dailyRecords.map(r => ({
            "Nama Siswa": r.name,
            "Kelas": r.className,
            "Jam Kedatangan": r.arrivalTime,
            "Durasi (Menit)": r.durationMinutes,
            "Kategori": r.category,
            "Alasan": r.reason || "-"
        }));
        const ws = XLSX.utils.json_to_sheet(wsData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Rekap Harian");
        XLSX.writeFile(wb, `LazGo_Harian_${new Date().toISOString().split('T')[0]}.xlsx`);
    };
    
    if (isLoading && !output) {
        return (
            <div className="space-y-4 animate-pulse">
                <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                <div className="h-28 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            </div>
        );
    }

    if (error) {
        return <div className="p-4 rounded-lg bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300">{error}</div>;
    }

    if (!output) {
        return (
            <div className="text-center py-10 px-4">
                <LogoIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Menunggu Data Keterlambatan</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Silakan isi formulir untuk membuat laporan cerdas.</p>
            </div>
        );
    }
    
    return (
        <div className="space-y-6 text-gray-800 dark:text-gray-200">
            <div className="flex justify-end gap-2 -mb-2">
                <button onClick={exportToPDF} className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700 transition-colors shadow-sm">
                    <PdfIcon className="w-3.5 h-3.5" /> PDF
                </button>
                <button onClick={exportToExcel} className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-green-700 transition-colors shadow-sm">
                    <ExcelIcon className="w-3.5 h-3.5" /> EXCEL
                </button>
            </div>

            <div className="p-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg shadow-md border border-white/20">
                <h3 className="font-semibold text-lg flex items-center gap-2 text-sky-600 dark:text-sky-400"><SummaryIcon className="w-5 h-5" /> Ringkasan Keterlambatan</h3>
                <p className="mt-2 text-sm whitespace-pre-wrap">{output.summary}</p>
            </div>
             <div className="p-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg shadow-md relative border border-white/20">
                <h3 className="font-semibold text-lg flex items-center gap-2 text-green-600 dark:text-green-400"><WhatsAppIcon className="w-5 h-5" /> Pesan WhatsApp untuk Orang Tua</h3>
                <p className="mt-2 text-sm whitespace-pre-wrap">{output.whatsapp}</p>
                 <button onClick={() => handleCopy(output.whatsapp, 'whatsapp')} className="absolute top-3 right-3 p-2 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors">
                     {copiedStates.whatsapp ? <CheckIcon className="w-4 h-4 text-green-500" /> : <CopyIcon className="w-4 h-4 text-gray-500 dark:text-gray-300" />}
                 </button>
            </div>
             <div className="p-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg shadow-md border border-white/20">
                <h3 className="font-semibold text-lg flex items-center gap-2 text-indigo-600 dark:text-indigo-400"><RecapIcon className="w-5 h-5" /> Rekap Harian</h3>
                <p className="mt-2 text-sm whitespace-pre-wrap">{output.dailyRecap}</p>
            </div>
        </div>
    );
};

// Database Manager Component
const StudentDatabase: React.FC<{
    allStudents: StudentInfo[];
    onAddStudent: (student: StudentInfo) => void;
    onAddStudentsBulk: (students: StudentInfo[]) => void;
    onDeleteStudent: (name: string) => void;
    onDeleteAllCustomStudents: () => void;
    isSyncing: boolean;
}> = ({ allStudents, onAddStudent, onAddStudentsBulk, onDeleteStudent, onDeleteAllCustomStudents, isSyncing }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [newName, setNewName] = useState('');
    const [newClass, setNewClass] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const filteredStudents = useMemo(() => {
        return allStudents.filter(s => 
            s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
            s.className.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [allStudents, searchTerm]);

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName || !newClass) return;
        onAddStudent({ name: newName, className: newClass });
        setNewName('');
        setNewClass('');
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            const bstr = evt.target?.result;
            const wb = XLSX.read(bstr, { type: 'binary' });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            const data = XLSX.utils.sheet_to_json(ws) as any[];

            const mappedStudents: StudentInfo[] = data.map(item => {
                const name = item['Nama'] || item['Nama Siswa'] || item['name'] || Object.values(item)[0];
                const className = item['Kelas'] || item['className'] || Object.values(item)[1];
                return { name: String(name || '').trim(), className: String(className || '').trim() };
            }).filter(s => s.name && s.className);

            if (mappedStudents.length > 0) {
                onAddStudentsBulk(mappedStudents);
            } else {
                alert('Format file tidak dikenali. Gunakan kolom "Nama" dan "Kelas".');
            }
        };
        reader.readAsBinaryString(file);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <UserPlusIcon className="w-5 h-5" /> Tambah Siswa Baru
                    </h2>
                    <form onSubmit={handleAdd} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nama Lengkap</label>
                            <input type="text" value={newName} onChange={e => setNewName(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm sm:text-sm" placeholder="Contoh: Budi Santoso" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Kelas</label>
                            <input type="text" value={newClass} onChange={e => setNewClass(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm sm:text-sm" placeholder="Contoh: 1 Asiatic Cheetah" />
                        </div>
                        <button type="submit" disabled={isSyncing} className="w-full py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors font-medium disabled:bg-indigo-400">
                            {isSyncing ? 'Menyinkronkan...' : 'Tambah ke Database'}
                        </button>
                    </form>

                    <div className="mt-6 pt-6 border-t dark:border-gray-700">
                        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                            <ExportIcon className="w-4 h-4 rotate-180" /> Impor Masal (CSV/Excel)
                        </h3>
                        <p className="text-xs text-gray-500 mb-4">Unggah file dengan kolom "Nama" dan "Kelas".</p>
                        <input 
                            type="file" 
                            accept=".csv, .xlsx, .xls" 
                            onChange={handleFileUpload}
                            ref={fileInputRef}
                            className="hidden"
                            id="bulk-import"
                        />
                        <label 
                            htmlFor="bulk-import" 
                            className="w-full inline-flex items-center justify-center gap-2 py-2 px-4 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-md cursor-pointer transition-colors text-sm font-medium"
                        >
                            <ExcelIcon className="w-4 h-4" /> Pilih File (.csv/.xlsx)
                        </label>
                    </div>

                    <div className="mt-6 pt-6 border-t dark:border-gray-700">
                         <button 
                            onClick={onDeleteAllCustomStudents}
                            disabled={isSyncing}
                            className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/50 transition-colors text-sm font-medium disabled:opacity-50"
                        >
                            <TrashIcon className="w-4 h-4" /> Hapus Semua Siswa Kustom
                        </button>
                    </div>
                </div>
            </div>

            <div className="lg:col-span-2 space-y-4">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md min-h-[500px]">
                    <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                        <h2 className="text-xl font-semibold flex items-center gap-2">
                            <DatabaseIcon className="w-5 h-5" /> Database Siswa ({allStudents.length})
                        </h2>
                        <div className="relative w-full sm:w-64">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                <SearchIcon className="w-4 h-4" />
                            </span>
                            <input 
                                type="text" 
                                placeholder="Cari nama atau kelas..." 
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-900/50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nama</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Kelas</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {filteredStudents.length > 0 ? (
                                    filteredStudents.map((s, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{s.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{s.className}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button onClick={() => onDeleteStudent(s.name)} className="text-red-600 hover:text-red-900 dark:hover:text-red-400 disabled:opacity-50" disabled={isSyncing}>Hapus</button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={3} className="px-6 py-10 text-center text-sm text-gray-500">Siswa tidak ditemukan.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Helper Component for AI Insight
const StatCard: React.FC<{ icon: React.ReactNode; title: string; value: string | React.ReactNode; color: string; }> = ({ icon, title, value, color }) => (
    <div className="flex items-start p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
        <div className={`mr-4 flex-shrink-0 p-2 rounded-full ${color}`}>
            {icon}
        </div>
        <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">{title}</p>
            {typeof value === 'string' ? (
              <p className="font-semibold text-sm break-words">{value}</p>
            ) : (
              value
            )}
        </div>
    </div>
);

const AIInsight: React.FC<{ records: TardinessRecord[] }> = ({ records }) => {
    const stats = useMemo(() => {
        if (records.length === 0) return null;

        const reasonCounts = records.reduce((acc, rec) => {
            const reason = rec.reason || 'Tidak ada';
            acc[reason] = (acc[reason] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const mostCommonReason = Object.keys(reasonCounts).reduce((a, b) => reasonCounts[a] > reasonCounts[b] ? a : b, 'N/A');

        const classCounts = records.reduce((acc, rec) => {
            const className = rec.className;
            acc[className] = (acc[className] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        
        const topClass = Object.keys(classCounts).reduce((a, b) => classCounts[a] > classCounts[b] ? a : b, 'N/A');

        const totalDuration = records.reduce((sum, rec) => sum + rec.durationMinutes, 0);
        const avgDuration = records.length > 0 ? Math.round(totalDuration / records.length) : 0;

        const categoryCounts = records.reduce((acc, rec) => {
            acc[rec.category]++;
            return acc;
        }, { [TardinessCategory.Ringan]: 0, [TardinessCategory.Sedang]: 0, [TardinessCategory.Berat]: 0 });

        return { mostCommonReason, topClass, avgDuration, categoryCounts };
    }, [records]);
    
    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
            <h2 className="text-xl font-semibold mb-4 border-b pb-3 dark:border-gray-700 flex items-center gap-2">
                <InsightIcon className="w-6 h-6"/> Analisis Pola Harian
            </h2>
            {!stats ? (
                 <p className="text-sm text-gray-500 dark:text-gray-400 mt-4 text-center">Belum ada data untuk dianalisis hari ini.</p>
            ) : (
                <div className="space-y-3">
                    <StatCard
                        icon={<TagIcon className="w-5 h-5 text-purple-800 dark:text-purple-200" />}
                        title="Alasan Paling Umum"
                        value={stats.mostCommonReason}
                        color="bg-purple-100 dark:bg-purple-900/50"
                    />
                    <StatCard
                        icon={<ClassIcon className="w-5 h-5 text-blue-800 dark:text-blue-200" />}
                        title="Kelas Teratas"
                        value={stats.topClass}
                        color="bg-blue-100 dark:bg-blue-900/50"
                    />
                    <StatCard
                        icon={<LogoIcon className="w-5 h-5 text-teal-800 dark:text-teal-200" />}
                        title="Rata-rata Terlambat"
                        value={`${stats.avgDuration} menit`}
                        color="bg-teal-100 dark:bg-teal-900/50"
                    />
                    <StatCard
                        icon={<PieChartIcon className="w-5 h-5 text-orange-800 dark:text-orange-200" />}
                        title="Distribusi Kategori"
                        value={
                        <div className="flex flex-wrap gap-2 text-xs font-medium">
                            <span className="bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 px-2 py-0.5 rounded-full">Ringan: {stats.categoryCounts.Ringan}</span>
                            <span className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300 px-2 py-0.5 rounded-full">Sedang: {stats.categoryCounts.Sedang}</span>
                            <span className="bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300 px-2 py-0.5 rounded-full">Berat: {stats.categoryCounts.Berat}</span>
                        </div>
                        }
                        color="bg-orange-100 dark:bg-orange-900/50"
                    />
                </div>
            )}
        </div>
    );
};

const MonthlyReport: React.FC<{ allRecords: TardinessRecord[] }> = ({ allRecords }) => {
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [reportData, setReportData] = useState<{
        report: string;
        parentMessage: string | null;
        topOffender: { name: string; className: string; count: number } | null;
    } | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

    const filteredRecords = useMemo(() => {
        return allRecords.filter(rec => {
            const recDate = new Date(rec.id);
            return recDate.getMonth() === selectedMonth && recDate.getFullYear() === selectedYear;
        });
    }, [allRecords, selectedMonth, selectedYear]);

    const handleGenerateReport = async () => {
        if (filteredRecords.length === 0) {
            alert("Tidak ada data keterlambatan untuk periode ini.");
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const result = await generateMonthlyReport(filteredRecords);
            setReportData(result);
        } catch (e: any) {
            setError(e.message || 'Gagal membuat laporan.');
        } finally {
            setIsLoading(false);
        }
    };

    const exportMonthlyPDF = () => {
        if (!reportData) return;
        const doc = new jsPDF();
        doc.setFontSize(20);
        doc.text(`Laporan Bulanan LazGo: ${monthNames[selectedMonth]} ${selectedYear}`, 14, 20);
        
        doc.setFontSize(10);
        const reportLines = doc.splitTextToSize(reportData.report.replace(/\*\*/g, ''), 180);
        doc.text(reportLines, 14, 30);
        
        autoTable(doc, {
            startY: 35 + (reportLines.length * 5),
            head: [['Tanggal', 'Nama', 'Kelas', 'Durasi', 'Kategori']],
            body: filteredRecords.map(r => [
                new Date(r.id).toLocaleDateString('id-ID'),
                r.name,
                r.className,
                `${r.durationMinutes} mnt`,
                r.category
            ]),
        });
        
        doc.save(`LazGo_Bulanan_${monthNames[selectedMonth]}_${selectedYear}.pdf`);
    };

    const exportMonthlyExcel = () => {
        if (filteredRecords.length === 0) return;
        const wsData = filteredRecords.map(r => ({
            "Tanggal": new Date(r.id).toLocaleDateString('id-ID'),
            "Nama Siswa": r.name,
            "Kelas": r.className,
            "Jam": r.arrivalTime,
            "Durasi (Menit)": r.durationMinutes,
            "Kategori": r.category
        }));
        const ws = XLSX.utils.json_to_sheet(wsData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Laporan Bulanan");
        XLSX.writeFile(wb, `LazGo_Bulanan_${monthNames[selectedMonth]}_${selectedYear}.xlsx`);
    };

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                <h2 className="text-xl font-semibold mb-4 border-b pb-3 dark:border-gray-700">Filter Laporan Bulanan</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Bulan</label>
                        <select value={selectedMonth} onChange={e => setSelectedMonth(parseInt(e.target.value))} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm sm:text-sm">
                            {monthNames.map((m, idx) => <option key={idx} value={idx}>{m}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tahun</label>
                        <select value={selectedYear} onChange={e => setSelectedYear(parseInt(e.target.value))} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm sm:text-sm">
                             {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                    <div className="flex items-end">
                        <button onClick={handleGenerateReport} disabled={isLoading} className="w-full flex justify-center py-2 px-4 bg-sky-600 text-white rounded-md hover:bg-sky-700 disabled:bg-sky-400 transition-colors sm:text-sm font-medium">
                            {isLoading ? 'Menganalisis...' : 'Buat Rekap Bulanan'}
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-blue-800/30 dark:bg-white/5 backdrop-blur-md p-6 rounded-xl shadow-lg min-h-[300px] relative">
                <div className="flex justify-between items-center mb-4 border-b border-white/20 pb-3">
                    <h2 className="text-xl font-semibold text-white flex items-center gap-2"><InsightIcon className="w-5 h-5"/> Hasil Analisis AI Bulanan</h2>
                    {reportData && !isLoading && (
                         <div className="flex gap-2">
                            <button onClick={exportMonthlyPDF} className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 transition-colors">
                                <PdfIcon className="w-4 h-4" /> PDF
                            </button>
                            <button onClick={exportMonthlyExcel} className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-700 transition-colors">
                                <ExcelIcon className="w-4 h-4" /> EXCEL
                            </button>
                        </div>
                    )}
                </div>
                {isLoading && <div className="text-white text-center py-10 flex flex-col items-center gap-3"><NotificationIcon className="w-8 h-8 animate-ping" /> Menganalisis ribuan data keterlambatan...</div>}
                {reportData?.report && <div className="prose prose-sm prose-invert max-w-none text-white" dangerouslySetInnerHTML={{ __html: reportData.report.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br />') }} />}
                {!isLoading && !reportData && <p className="text-sky-200 text-center py-10">Silakan pilih bulan/tahun lalu klik 'Buat Rekap Bulanan' untuk memulai analisis cerdas.</p>}
            </div>
        </div>
    );
};

// --- TABULAR RECAP COMPONENT ---
const MonthlyStudentStats: React.FC<{ allRecords: TardinessRecord[] }> = ({ allRecords }) => {
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

    const statsPerStudent = useMemo(() => {
        const filtered = allRecords.filter(rec => {
            const date = new Date(rec.id);
            return date.getMonth() === selectedMonth && date.getFullYear() === selectedYear;
        });

        const statsMap = new Map<string, { name: string; className: string; count: number; totalDuration: number; categories: Record<string, number>; dates: string[] }>();
        
        filtered.forEach(rec => {
            const key = `${rec.name}-${rec.className}`;
            const dateStr = new Date(rec.id).toLocaleDateString('id-ID', { day: 'numeric', month: 'numeric' });
            if (!statsMap.has(key)) {
                statsMap.set(key, { name: rec.name, className: rec.className, count: 0, totalDuration: 0, categories: { [TardinessCategory.Ringan]: 0, [TardinessCategory.Sedang]: 0, [TardinessCategory.Berat]: 0 }, dates: [] });
            }
            const s = statsMap.get(key)!;
            s.count++;
            s.totalDuration += rec.durationMinutes;
            s.categories[rec.category]++;
            if (!s.dates.includes(dateStr)) s.dates.push(dateStr);
        });

        return Array.from(statsMap.values()).sort((a, b) => b.count - a.count);
    }, [allRecords, selectedMonth, selectedYear]);

    const exportStatsPDF = () => {
        if (statsPerStudent.length === 0) return;
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text(`Rekap Keterlambatan Per Siswa`, 14, 20);
        doc.setFontSize(12);
        doc.text(`Periode: ${monthNames[selectedMonth]} ${selectedYear}`, 14, 28);
        
        autoTable(doc, {
            startY: 35,
            head: [['Nama Siswa', 'Kelas', 'Frekuensi', 'Tanggal Terlambat', 'Total Menit', 'Kategori']],
            body: statsPerStudent.map(s => {
                const dominant = Object.entries(s.categories).reduce((a, b) => b[1] > a[1] ? b : a)[0];
                return [s.name, s.className, `${s.count}x`, s.dates.join(', '), `${s.totalDuration} mnt`, dominant];
            }),
        });
        doc.save(`LazGo_Rekap_Siswa_${monthNames[selectedMonth]}_${selectedYear}.pdf`);
    };

    const exportStatsExcel = () => {
        if (statsPerStudent.length === 0) return;
        const data = statsPerStudent.map(s => {
            const dominant = Object.entries(s.categories).reduce((a, b) => b[1] > a[1] ? b : a)[0];
            return {
                "Nama Siswa": s.name,
                "Kelas": s.className,
                "Frekuensi": s.count,
                "Tanggal Terlambat": s.dates.join(', '),
                "Total Durasi (Menit)": s.totalDuration,
                "Kategori Dominan": dominant
            };
        });
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Rekap Per Siswa");
        XLSX.writeFile(wb, `LazGo_Rekap_Siswa_${monthNames[selectedMonth]}_${selectedYear}.xlsx`);
    };

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                <h2 className="text-xl font-semibold mb-4 border-b pb-3 dark:border-gray-700 flex items-center gap-2">
                    <RecapIcon className="w-5 h-5 text-indigo-500" /> Pilih Periode Rekap
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Bulan</label>
                        <select value={selectedMonth} onChange={e => setSelectedMonth(parseInt(e.target.value))} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm sm:text-sm">
                            {monthNames.map((m, idx) => <option key={idx} value={idx}>{m}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tahun</label>
                        <select value={selectedYear} onChange={e => setSelectedYear(parseInt(e.target.value))} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm sm:text-sm">
                             {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                    <div className="flex items-end gap-2">
                        <button onClick={exportStatsPDF} className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm font-medium">
                            <PdfIcon className="w-4 h-4" /> PDF
                        </button>
                        <button onClick={exportStatsExcel} className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm font-medium">
                            <ExcelIcon className="w-4 h-4" /> Excel
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md overflow-hidden">
                <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                        <DatabaseIcon className="w-5 h-5 text-sky-500" /> Rekapitulasi Siswa ({monthNames[selectedMonth]} {selectedYear})
                    </h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-900/50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nama Siswa</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Kelas</th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Freq</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tgl Terlambat</th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Durasi</th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status Dominan</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {statsPerStudent.length > 0 ? (
                                statsPerStudent.map((s, idx) => {
                                    const dominant = Object.entries(s.categories).reduce((a, b) => b[1] > a[1] ? b : a)[0];
                                    return (
                                        <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{s.name}</td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{s.className}</td>
                                            <td className="px-4 py-4 whitespace-nowrap text-center text-sm font-bold text-sky-600 dark:text-sky-400">{s.count}x</td>
                                            <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300 max-w-[220px] truncate" title={s.dates.join(', ')}>
                                                {s.dates.join(', ')}
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap text-center text-sm text-gray-600 dark:text-gray-300">{s.totalDuration}m</td>
                                            <td className="px-4 py-4 whitespace-nowrap text-center">
                                                <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${dominant === 'Ringan' ? 'bg-green-100 text-green-700' : dominant === 'Sedang' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                                                    {dominant}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-4 py-10 text-center text-sm text-gray-500">Tidak ada data keterlambatan untuk periode ini.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default function App() {
  const [records, setRecords] = useState<TardinessRecord[]>([]);
  const [customStudents, setCustomStudents] = useState<StudentInfo[]>([]);
  const [schoolStartTime, setSchoolStartTime] = useState('07:30');
  
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isReportLoading, setIsReportLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState<'daily' | 'monthly' | 'monthly_stats' | 'database'>('daily');
  const [output, setOutput] = useState<GeneratedOutput | null>(null);

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (localStorage.getItem('theme')) return localStorage.getItem('theme') as 'light' | 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  // Derived unique students list
  const allStudents = useMemo(() => {
    const merged = [...defaultStudents, ...customStudents];
    const unique = Array.from(new Map(merged.map(s => [s.name, s])).values());
    return unique.sort((a, b) => a.name.localeCompare(b.name));
  }, [customStudents]);

  const dailyRecords = useMemo(() => {
    const today = new Date().toDateString();
    return records.filter(rec => new Date(rec.id).toDateString() === today);
  }, [records]);

  // Initial Data Fetch from Supabase
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsInitialLoading(true);

        // Fetch Records
        const { data: recordsData, error: recordsError } = await supabase
          .from('tardiness_records')
          .select('*')
          .order('id', { ascending: false });
        
        if (recordsError) throw recordsError;
        if (recordsData) setRecords(recordsData);

        // Fetch Custom Students
        const { data: studentsData, error: studentsError } = await supabase
          .from('custom_students')
          .select('name, className');
        
        if (studentsError) throw studentsError;
        if (studentsData) setCustomStudents(studentsData);

        // Fetch Settings (School Start Time)
        const { data: settingsData, error: settingsError } = await supabase
          .from('app_settings')
          .select('key, value');
        
        if (settingsError) throw settingsError;
        if (settingsData) {
            const startTime = settingsData.find(s => s.key === 'school_start_time');
            if (startTime) setSchoolStartTime(startTime.value);
        }

        // Fetch Daily Report Output Cache (from LocalStorage)
        const savedOutput = localStorage.getItem('dailyReportOutput');
        if (savedOutput) {
            try {
                const { date, data } = JSON.parse(savedOutput);
                if (date === new Date().toDateString()) setOutput(data);
            } catch (e) {}
        }

      } catch (err: any) {
        console.error("Supabase initial fetch failed:", err);
        setError("Koneksi cloud bermasalah. Pastikan tabel Supabase sudah dibuat.");
      } finally {
        setIsInitialLoading(false);
      }
    };

    fetchData();
  }, []);

  // Sync theme
  useEffect(() => {
    const root = window.document.documentElement;
    theme === 'dark' ? root.classList.add('dark') : root.classList.remove('dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Sync schoolStartTime to Supabase when it changes
  const updateSchoolStartTime = async (newTime: string) => {
    setSchoolStartTime(newTime);
    try {
        await supabase.from('app_settings').upsert({ key: 'school_start_time', value: newTime });
    } catch (err) {
        console.error("Failed to update school start time in Supabase:", err);
    }
  };

  const handleAddStudent = async (student: StudentInfo) => {
    if (allStudents.some(s => s.name.toLowerCase() === student.name.toLowerCase())) {
        alert('Siswa dengan nama ini sudah ada di database.');
        return;
    }
    setIsSyncing(true);
    try {
        const { error: insertError } = await supabase.from('custom_students').insert(student);
        if (insertError) throw insertError;
        setCustomStudents(prev => [...prev, student]);
    } catch (err) {
        alert("Gagal menyimpan siswa ke cloud.");
    } finally {
        setIsSyncing(false);
    }
  };

  const handleAddStudentsBulk = async (students: StudentInfo[]) => {
    setIsSyncing(true);
    try {
        const existingNames = new Set(allStudents.map(s => s.name.toLowerCase()));
        const newOnes = students.filter(s => !existingNames.has(s.name.toLowerCase()));
        
        if (newOnes.length > 0) {
            const { error: insertError } = await supabase.from('custom_students').insert(newOnes);
            if (insertError) throw insertError;
            setCustomStudents(prev => [...prev, ...newOnes]);
            alert(`${newOnes.length} siswa berhasil disinkronkan ke cloud.`);
        } else {
            alert('Semua siswa dalam file sudah ada di database.');
        }
    } catch (err) {
        alert("Gagal mengimpor data masal ke cloud.");
    } finally {
        setIsSyncing(false);
    }
  };

  const handleDeleteStudent = async (name: string) => {
    if (defaultStudents.some(s => s.name === name)) {
        alert('Maaf, siswa bawaan sistem tidak dapat dihapus.');
        return;
    }
    if (confirm(`Hapus ${name} dari database cloud?`)) {
        setIsSyncing(true);
        try {
            const { error: deleteError } = await supabase.from('custom_students').delete().eq('name', name);
            if (deleteError) throw deleteError;
            setCustomStudents(prev => prev.filter(s => s.name !== name));
        } catch (err) {
            alert("Gagal menghapus data dari cloud.");
        } finally {
            setIsSyncing(false);
        }
    }
  };

  const handleDeleteAllCustomStudents = async () => {
    if (confirm('Apakah Anda yakin ingin mengosongkan database cloud untuk siswa kustom?')) {
        setIsSyncing(true);
        try {
            const { error: deleteError } = await supabase.from('custom_students').delete().neq('name', '');
            if (deleteError) throw deleteError;
            setCustomStudents([]);
            alert('Seluruh data kustom dihapus dari cloud.');
        } catch (err) {
            alert("Gagal membersihkan data cloud.");
        } finally {
            setIsSyncing(false);
        }
    }
  };

  const handleClearData = async () => {
      if (confirm('Hapus SEMUA rekaman keterlambatan selamanya?')) {
          setIsSyncing(true);
          try {
              const { error: deleteError } = await supabase.from('tardiness_records').delete().neq('id', '');
              if (deleteError) throw deleteError;
              setRecords([]);
              setOutput(null);
              localStorage.removeItem('dailyReportOutput');
              alert('Semua rekaman dihapus dari cloud.');
          } catch (err) {
              alert("Gagal menghapus rekaman.");
          } finally {
              setIsSyncing(false);
          }
      }
  };

  const handleFormSubmit = useCallback(async (data: StudentData) => {
    const arrival = new Date(`1970-01-01T${data.arrivalTime}:00`);
    const start = new Date(`1970-01-01T${schoolStartTime}:00`);
    let durationMinutes = Math.round((arrival.getTime() - start.getTime()) / 60000);
    if (durationMinutes < 0) durationMinutes = 0;

    let category = durationMinutes >= 1 && durationMinutes <= 5 ? TardinessCategory.Ringan : durationMinutes <= 15 ? TardinessCategory.Sedang : TardinessCategory.Berat;

    const newRecord: TardinessRecord = { ...data, id: new Date().toISOString(), schoolStartTime, durationMinutes, category };
    
    setIsReportLoading(true);
    setError(null);

    try {
      // 1. Save to Supabase
      const { error: insertError } = await supabase.from('tardiness_records').insert(newRecord);
      if (insertError) throw insertError;
      
      setRecords(prev => [newRecord, ...prev]);

      // 2. Generate AI Report
      const generatedOutput = await generateTardinessReport(newRecord, dailyRecords);
      setOutput(generatedOutput);
      
      // 3. Cache report output locally
      localStorage.setItem('dailyReportOutput', JSON.stringify({ date: new Date().toDateString(), data: generatedOutput }));
      
    } catch (e: any) {
      console.error(e);
      setError("Cloud Sync bermasalah. Rekaman mungkin tidak tersimpan.");
    } finally {
      setIsReportLoading(false);
    }
  }, [dailyRecords, schoolStartTime]);

  if (isInitialLoading) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#1c59c6] text-white">
            <LogoIcon className="w-16 h-16 animate-bounce mb-4" />
            <h1 className="text-3xl font-bold tracking-tight">LazGo</h1>
            <p className="mt-2 text-sky-200 animate-pulse">Menghubungkan ke Cloud Database...</p>
        </div>
    );
  }

  const TabButton: React.FC<{ label: string; isActive: boolean; onClick: () => void; icon: React.ReactNode }> = ({ label, isActive, onClick, icon }) => (
    <button onClick={onClick} className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${isActive ? 'bg-white text-sky-700 shadow dark:bg-gray-100 dark:text-sky-700' : 'text-white hover:bg-white/20'}`}>
      {icon} <span className="hidden sm:inline">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto relative">
         <div className="absolute top-0 right-0 flex items-center gap-2">
            <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-2 rounded-full text-white/80 hover:bg-white/20 transition-colors">
                {theme === 'light' ? <MoonIcon className="w-6 h-6" /> : <SunIcon className="w-6 h-6" />}
            </button>
            <button onClick={() => setShowSettings(true)} className="p-2 rounded-full text-white/80 hover:bg-white/20 transition-colors"><SettingsIcon className="w-6 h-6" /></button>
         </div>

        {showSettings && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-2xl shadow-2xl p-6 relative">
                    <button onClick={() => setShowSettings(false)} className="absolute top-4 right-4 text-gray-500 text-2xl">×</button>
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-sky-700 dark:text-sky-400"><SettingsIcon className="w-6 h-6" /> Pengaturan LazGo</h2>
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium mb-1">Jam Masuk Sekolah (Cloud Synced)</label>
                            <input type="time" value={schoolStartTime} onChange={e => updateSchoolStartTime(e.target.value)} className="w-full px-4 py-2 rounded-lg border dark:bg-gray-700" />
                        </div>
                        <div className="pt-4 border-t">
                            <button onClick={handleClearData} disabled={isSyncing} className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors">
                                <TrashIcon className="w-4 h-4" /> Reset Semua Data Cloud
                            </button>
                        </div>
                    </div>
                    <button onClick={() => setShowSettings(false)} className="mt-8 w-full py-2 bg-sky-600 text-white rounded-lg shadow-lg hover:bg-sky-700 transition-colors">Simpan & Tutup</button>
                </div>
            </div>
        )}

        <header className="text-center mb-10">
          <div className="flex items-center justify-center gap-3">
            <LogoIcon className="w-12 h-12 text-white" />
            <h1 className="text-5xl font-extrabold text-white tracking-tighter">LazGo</h1>
          </div>
          <p className="mt-2 text-lg text-sky-200 font-medium">Where Time Meets Responsibility</p>
        </header>

        <div className="flex justify-center mb-8">
          <div className="flex space-x-1 p-1 bg-blue-800/30 dark:bg-white/5 rounded-lg border border-white/10">
            <TabButton label="Harian" isActive={activeTab === 'daily'} onClick={() => setActiveTab('daily')} icon={<RecapIcon className="w-4 h-4" />} />
            <TabButton label="Rekap Data" isActive={activeTab === 'monthly_stats'} onClick={() => setActiveTab('monthly_stats')} icon={<DatabaseIcon className="w-4 h-4" />} />
            <TabButton label="Analisis AI" isActive={activeTab === 'monthly'} onClick={() => setActiveTab('monthly')} icon={<SummaryIcon className="w-4 h-4" />} />
            <TabButton label="Database" isActive={activeTab === 'database'} onClick={() => setActiveTab('database')} icon={<UserPlusIcon className="w-4 h-4" />} />
          </div>
        </div>

        <main>
          {activeTab === 'daily' && (
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700">
                    <h2 className="text-xl font-bold mb-4 border-b pb-3 flex items-center gap-2"><UserPlusIcon className="w-5 h-5 text-sky-600" /> Input Keterlambatan</h2>
                    <InputForm onSubmit={handleFormSubmit} schoolStartTime={schoolStartTime} allStudents={allStudents} isSubmitting={isReportLoading} />
                  </div>
                  <AIInsight records={dailyRecords} />
                  {dailyRecords.length > 0 && (
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                      <h2 className="text-lg font-semibold mb-4 border-b pb-2">Riwayat Cloud Hari Ini</h2>
                      <ul className="space-y-3 max-h-60 overflow-y-auto pr-1">
                        {dailyRecords.map(rec => (
                          <li key={rec.id} className="text-sm p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md flex justify-between items-center group hover:bg-sky-50 dark:hover:bg-gray-600 transition-colors">
                            <div><span className="font-bold">{rec.name}</span> <span className="text-gray-500 text-xs">({rec.className})</span></div>
                            <div className="flex items-center gap-3">
                                <span className="text-xs text-gray-400">{rec.arrivalTime}</span>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${rec.category === 'Ringan' ? 'bg-green-100 text-green-700' : rec.category === 'Sedang' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{rec.durationMinutes}m</span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                <div className="bg-blue-800/40 dark:bg-white/5 backdrop-blur-lg p-6 rounded-xl shadow-2xl border border-white/10">
                  <h2 className="text-xl font-bold text-white border-b border-white/20 pb-3 mb-4 flex items-center gap-2"><InsightIcon className="w-5 h-5" /> Analisis Cerdas LazGo</h2>
                  <OutputDisplay output={output} isLoading={isReportLoading} error={error} dailyRecords={dailyRecords} />
                </div>
              </div>
          )}
          {activeTab === 'monthly' && <MonthlyReport allRecords={records} />}
          {activeTab === 'monthly_stats' && <MonthlyStudentStats allRecords={records} />}
          {activeTab === 'database' && (
              <StudentDatabase 
                allStudents={allStudents} 
                onAddStudent={handleAddStudent} 
                onAddStudentsBulk={handleAddStudentsBulk}
                onDeleteStudent={handleDeleteStudent} 
                onDeleteAllCustomStudents={handleDeleteAllCustomStudents}
                isSyncing={isSyncing}
              />
          )}
        </main>
      </div>
    </div>
  );
}
