// components/reports/sub-components/RecordingControls.tsx
import { Mic, Pause, Play, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { useRef } from "react";

interface RecordingControlsProps {
  showRecordingControls: boolean;
  isPaused: boolean;
  recordingTime: number;
  formatTime: (seconds: number) => string;
  resumeRecording: () => void;
  pauseRecording: () => void;
  submitRecording: () => void;
  startRecording: () => void;
  // New props for upload functionality
  isUploading: boolean;
  uploadProgress: number;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  handleDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  selectedFile: File | null;
  setSelectedFile: (file: File | null) => void;
}

const RecordingControls = ({
  showRecordingControls,
  isPaused,
  recordingTime,
  formatTime,
  resumeRecording,
  pauseRecording,
  submitRecording,
  startRecording,
  isUploading,
  uploadProgress,
  handleFileSelect,
  handleDragOver,
  handleDrop,
  selectedFile,
  setSelectedFile
}: RecordingControlsProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  if (showRecordingControls) {
    return (
      <div className="absolute bottom-full lg:bottom-40 xl:bottom-44 2xl:bottom-60 left-0 right-0 pt-4 rounded-t-lg">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col items-center">
            <div className="flex items-center space-x-3 mb-3">
              <div className="relative">
                {!isPaused && (
                  <div className="absolute inset-0 bg-red-100 rounded-full animate-ping opacity-75"></div>
                )}
                <Mic className="h-6 w-6 text-red-500 relative" />
              </div>
              <span className="text-lg font-medium text-gray-700">
                {isPaused ? "Recording Paused" : "Recording"}
              </span>
            </div>
            <div className="text-2xl font-mono font-medium text-gray-800 mb-4 text-center">
              {formatTime(recordingTime)}
            </div>
            <div className="flex justify-center space-x-4 mb-4">
              {isPaused ? (
                <Button
                  onClick={resumeRecording}
                  variant="outline"
                  className="border-green-500 text-green-500 hover:bg-green-50"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Resume
                </Button>
              ) : (
                <Button
                  onClick={pauseRecording}
                  variant="outline"
                  className="border-amber-500 text-amber-500 hover:bg-amber-50"
                >
                  <Pause className="h-4 w-4 mr-2" />
                  Pause
                </Button>
              )}
              <Button
                onClick={submitRecording}
                className="bg-blue-600 hover:bg-blue-700 mb-2"
              >
                Submit Recording
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "absolute",
      "bottom-40", // Default position
      "md:bottom-44", // Slightly higher on medium screens
      "lg:bottom-48", // Higher on large screens
      "xl:bottom-[13rem]", // Even higher on extra large screens
      "2xl:bottom-60", // Highest on 2xl screens
      "left-0 right-0 pt-4 rounded-t-lg"
    )}>
      <div className={cn(
        "mx-auto",
        "w-full max-w-md", // Default size
        "lg:max-w-lg",     // Larger on lg screens
        "xl:max-w-xl",     // Even larger on xl screens
        "2xl:max-w-2xl",    // Largest size
        "px-2"
      )}>
        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept="audio/*"
          className="hidden"
          disabled={isUploading}
        />
        
        {/* Upload progress indicator */}
        {isUploading && (
          <div className="mb-4 bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Transcribing audio...</span>
              <span className="text-sm text-gray-600">{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} className="h-2" />
          </div>
        )}
        
        {/* Selected file info */}
        {selectedFile && !isUploading && (
          <div className="mb-4 bg-blue-50 p-3 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-blue-700 truncate max-w-xs">
                {selectedFile.name}
              </span>
              <span className="text-xs text-blue-500">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedFile(null)}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
        
        {/* Drag and drop area */}
        {!isUploading && (
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className="mb-4 border-2 hidden 2xl:block border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-blue-400 transition-colors bg-gray-50"
            onClick={handleUploadClick}
          >
            <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-700">
              Upload Audio Recording
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Drag and drop or click to browse (MP3, WAV, MP4, WebM, OGG)
            </p>
          </div>
        )}
        
        <div className="flex w-full flex-col items-center">
          <p className="text-sm mb-1 text-slate-500 font-medium">
            <span className="text-blue-500">Ready to speak?</span> Tap 'Start Recording'
          </p>
          <Button
            onClick={startRecording}
            variant="outline"
            className="border-blue-500 text-lg text-blue-500 w-full py-3 hover:bg-blue-50 mb-4"
            disabled={isUploading}
          >
            <Mic className="h-5 w-5 mr-4" />
            Start Recording
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RecordingControls;