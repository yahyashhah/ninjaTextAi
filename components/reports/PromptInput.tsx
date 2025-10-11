// components/reports/sub-components/PromptInput.tsx - SIMPLIFIED
import { useForm } from "react-hook-form";
import { ArrowUp, Upload, X, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Progress } from "@/components/ui/progress";
import { useRef } from "react";
import { cn } from "@/lib/utils";

interface PromptInputProps {
  form: any;
  onSubmit: (values: any) => void;
  prompt: string;
  setPrompt: (prompt: string) => void;
  isLoading: boolean;
  defaultTip: string;
  recordingTip: string;
  showRecordingControls: boolean;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  isUploading: boolean;
  uploadProgress: number;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  handleDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  selectedFile: File | null;
  setSelectedFile: (file: File | null) => void;
  inputMode: 'typing' | 'recording' | 'ready-to-record';
  onSwitchMode: (mode: 'typing' | 'recording') => void;
  onWritingStart: () => void;
  isSpeechSupported?: boolean;
  microphonePermission?: 'granted' | 'denied' | 'prompt';
  selectedOffenses: any[];
}

const PromptInput = ({
  form,
  onSubmit,
  prompt,
  setPrompt,
  isLoading,
  defaultTip,
  recordingTip,
  showRecordingControls,
  textareaRef,
  isUploading,
  uploadProgress,
  handleFileSelect,
  handleDragOver,
  handleDrop,
  selectedFile,
  setSelectedFile,
  inputMode,
  onSwitchMode,
  onWritingStart,
  isSpeechSupported = true,
  microphonePermission = 'prompt',
  selectedOffenses = [],
}: PromptInputProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setPrompt(newText);
    
    // Auto-resize
    e.target.style.height = "auto";
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  // const handleTextFocus = () => {
  //   if (inputMode !== 'typing') {
  //     onSwitchMode('typing');
  //   }
  //   onWritingStart();
  // };

  const getCurrentTip = (): string => {
    if (inputMode === 'recording' || inputMode === 'ready-to-record') {
      return recordingTip;
    }
    return defaultTip;
  };

  // Get required fields hint based on selected offenses
  const getRequiredFieldsHint = (): string => {
    if (selectedOffenses.length === 0) return "Select offense type to see required fields";
    
    const allRequiredFields = new Set<string>();
    selectedOffenses.forEach(offense => {
      offense.requiredFields?.forEach((field: string) => allRequiredFields.add(field));
    });
    
    const fields = Array.from(allRequiredFields);
    if (fields.length === 0) return "No specific fields required";
    
    return `Required: ${fields.slice(0, 3).join(', ')}${fields.length > 3 ? '...' : ''}`;
  };

  return (
    <>
      <div className="relative">
        {/* Required fields hint */}
        {selectedOffenses.length > 0 && (
          <div className="max-w-4xl mx-auto mb-3">
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
              <p className="text-xs text-blue-800 text-center">
                {getRequiredFieldsHint()}
              </p>
            </div>
          </div>
        )}

        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept="audio/*"
          className="hidden"
          disabled={isLoading || isUploading}
        />

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="w-full relative z-10 max-w-4xl mx-auto flex items-start gap-3 border rounded-lg px-4 py-3 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all bg-white shadow-sm"
          >
            {/* Textarea */}
            <FormField
              name="prompt"
              render={() => (
                <FormItem className="flex-1">
                  <FormControl className="m-0 p-0">
                    <textarea
                      ref={textareaRef}
                      className="w-full border-0 focus:ring-0 resize-y min-h-[100px] max-h-[180px] py-2 px-1 text-base transition-all duration-200 ease-in-out bg-transparent placeholder-gray-500"
                      disabled={isLoading || isUploading}
                      placeholder="Describe the incident in detail... Include location, time, involved persons, and what happened."
                      value={prompt}
                      onChange={handleTextChange}
                      // onFocus={handleTextFocus}
                      rows={4}
                      style={{ minHeight: "100px", maxHeight: "180px" }}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Right side buttons - vertical layout */}
            <div className="flex flex-col items-center gap-2 pt-2">

              {/* Upload button */}
              <Button
                type="button"
                onClick={handleUploadClick}
                variant="ghost"
                size="icon"
                className={cn(
                  "rounded-full hover:bg-blue-50 border border-gray-300",
                  isLoading || isUploading ? "opacity-50 cursor-not-allowed" : ""
                )}
                disabled={isLoading || isUploading}
              >
                <Upload className="h-4 w-4 text-gray-600" />
              </Button>

              {/* Submit button */}
              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-full flex-shrink-0"
                type="submit"
                disabled={isLoading || isUploading || !prompt.trim() || inputMode === 'recording' || selectedOffenses.length === 0}
                size="icon"
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </Form>

        {/* Upload progress */}
        {isUploading && (
          <div className="max-w-4xl mx-auto mt-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-gray-600 font-medium">
                Transcribing audio...
              </span>
              <span className="text-sm text-gray-600">{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} className="h-2" />
          </div>
        )}

        {/* Selected file info */}
        {selectedFile && !isUploading && (
          <div className="max-w-4xl mx-auto mt-3 bg-blue-50 p-3 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Upload className="h-4 w-4 text-blue-500" />
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
      </div>

      {/* Info tip */}
      <div className="max-w-4xl mx-auto mt-3">
        <div className="flex items-center justify-center space-x-2">
          <p className="text-xs text-gray-500 text-center">
            {getCurrentTip()}
          </p>
        </div>
      </div>

      {/* Drag & drop area for mobile */}
      {!showRecordingControls && !isUploading && !selectedFile && (
        <div
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className="md:hidden border-2 border-dashed border-gray-300 rounded-lg p-4 text-center mt-3 cursor-pointer hover:border-blue-400 transition-colors bg-gray-50 mx-4"
          onClick={handleUploadClick}
        >
          <Upload className="h-6 w-6 text-gray-400 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-700">
            Upload Audio Recording
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Tap to select an audio file
          </p>
        </div>
      )}
    </>
  );
};

export default PromptInput;