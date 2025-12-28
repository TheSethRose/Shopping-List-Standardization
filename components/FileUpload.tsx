
import React, { useState } from 'react';
import { UploadCloud, Loader2, CheckCircle2 } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  isProcessing: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, isProcessing }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    const firstFile = files[0];
    if (files.length > 0 && firstFile) {
      processFile(firstFile);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    const firstFile = files?.[0];
    if (firstFile) {
      processFile(firstFile);
    }
  };

  const processFile = (file: File) => {
    const validExtensions = ['.csv', '.xlsx', '.xls'];
    const fileNameLower = file.name.toLowerCase();
    const isValid = validExtensions.some(ext => fileNameLower.endsWith(ext));

    if (!isValid) {
      alert('Please upload a CSV or Excel (.xlsx, .xls) file.');
      return;
    }
    setFileName(file.name);
    onFileSelect(file);
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative border border-dashed rounded-xl transition-all duration-200 flex flex-col items-center justify-center p-8 text-center
        ${isDragging ? 'border-white bg-zinc-800/50' : 'border-zinc-700 hover:border-zinc-500 bg-zinc-900'}
        ${isProcessing ? 'opacity-50 pointer-events-none' : ''}
      `}
    >
      <input
        type="file"
        accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        onChange={handleFileInput}
        disabled={isProcessing}
      />
      
      {isProcessing ? (
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-zinc-400 animate-spin" />
          <p className="text-xs font-medium text-zinc-400">Reading records...</p>
        </div>
      ) : fileName ? (
        <div className="flex flex-col items-center gap-3">
          <CheckCircle2 className="w-8 h-8 text-white" />
          <div>
            <p className="text-xs font-semibold text-zinc-200">{fileName}</p>
          </div>
          <button className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest hover:text-white transition-colors">
            Replace File
          </button>
        </div>
      ) : (
        <>
          <div className="bg-zinc-800 p-2.5 rounded-full mb-4 ring-1 ring-zinc-700">
            <UploadCloud className="w-6 h-6 text-zinc-400" />
          </div>
          <p className="text-xs font-semibold text-zinc-300">Drop History File</p>
          <p className="text-[10px] text-zinc-500 mt-2 uppercase tracking-widest">
            CSV or XLSX only
          </p>
        </>
      )}
    </div>
  );
};

export default FileUpload;
