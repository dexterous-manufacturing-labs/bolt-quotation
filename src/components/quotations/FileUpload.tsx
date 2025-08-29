import React, { useCallback } from 'react';
import { Upload, FileText, AlertCircle } from 'lucide-react';

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
  isProcessing: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFilesSelected, isProcessing }) => {
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const files = Array.from(e.dataTransfer.files);
    const validFiles = files.filter(file => {
      const extension = file.name.split('.').pop()?.toLowerCase();
      return ['stl', 'step', 'stp', 'iges', 'igs'].includes(extension || '');
    });
    
    if (validFiles.length > 0) {
      onFilesSelected(validFiles);
    }
  }, [onFilesSelected]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      onFilesSelected(files);
    }
    // Reset input value to allow selecting the same file again
    e.target.value = '';
  }, [onFilesSelected]);

  const handleUploadAreaClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isProcessing) {
      const fileInput = e.currentTarget.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) {
        fileInput.click();
      }
    }
  }, [isProcessing]);

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Upload 3D Files
        </label>
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={handleUploadAreaClick}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-200 relative ${
            isProcessing 
              ? 'border-gray-300 bg-gray-50 cursor-not-allowed' 
              : 'border-gray-300 hover:border-indigo-400 hover:bg-indigo-50 cursor-pointer'
          }`}
        >
          <div className="flex flex-col items-center space-y-4">
            {isProcessing ? (
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            ) : (
              <Upload className="h-12 w-12 text-gray-400" />
            )}
            
            <div>
              <p className="text-lg font-medium text-gray-900">
                {isProcessing ? 'Processing files...' : 'Drop your 3D files here'}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {isProcessing 
                  ? 'Please wait while we analyze your files' 
                  : 'or click to browse files'
                }
              </p>
            </div>
            
            <input
              type="file"
              multiple
              accept=".stl,.step,.stp,.iges,.igs"
              onChange={handleFileInput}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              style={{ pointerEvents: isProcessing ? 'none' : 'auto' }}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-blue-900">Supported File Types</h4>
            <p className="text-sm text-blue-700 mt-1">
              STL, STEP (.step, .stp), IGES (.iges, .igs)
            </p>
          </div>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-amber-900">Note</h4>
            <p className="text-sm text-amber-700 mt-1">
              STEP and IGES files will show estimated dimensions. For accurate pricing, STL files are recommended.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;