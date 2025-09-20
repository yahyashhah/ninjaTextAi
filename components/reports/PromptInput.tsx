import { useForm } from "react-hook-form";
import { ArrowUp, ClipboardList, Upload, X, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Progress } from "@/components/ui/progress";
import { useRef } from "react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";

interface InputSectionProps {
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
}: InputSectionProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      <div className="relative">
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
            className="w-full relative z-10 max-w-4xl mx-auto flex items-center gap-2 border rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all bg-white"
          >
            {/* Textarea */}
            <FormField
              name="prompt"
              render={() => (
                <FormItem className="flex-1">
                  <FormControl className="m-0 p-0">
                    <textarea
                      ref={textareaRef}
                      className="w-full border-0 focus:ring-0 resize-y min-h-[80px] max-h-[200px] py-2 px-3 text-base transition-all duration-200 ease-in-out bg-transparent"
                      disabled={isLoading || isUploading}
                      placeholder="Type your report, speak using the mic, or upload an audio recording"
                      value={prompt}
                      onChange={(e) => {
                        setPrompt(e.target.value);
                        e.target.style.height = "auto";
                        e.target.style.height = `${e.target.scrollHeight}px`;
                      }}
                      rows={3}
                      style={{ minHeight: "80px", maxHeight: "300px" }}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Right side buttons */}
            <div className="flex items-center gap-2">
              <TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>
      <Button
        type="button"
        onClick={handleUploadClick}
        variant="ghost"
        size="icon"
        className={cn(
          "rounded-full hover:bg-blue-50",
          isLoading || isUploading ? "opacity-50 cursor-not-allowed" : ""
        )}
        disabled={isLoading || isUploading}
      >
        <Upload className="h-4 w-4 text-gray-600" />
      </Button>
    </TooltipTrigger>
    <TooltipContent side="top" className="bg-gray-900 text-white text-xs rounded-md px-2 py-1">
      Upload Audio
    </TooltipContent>
  </Tooltip>
</TooltipProvider>

              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-full flex-shrink-0"
                type="submit"
                disabled={isLoading || isUploading || !prompt.trim()}
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

        {/* Drag & drop area for mobile */}
        {!showRecordingControls && !isUploading && !selectedFile && (
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className="md:hidden border-2 border-dashed border-gray-300 rounded-lg p-4 text-center mt-3 cursor-pointer hover:border-blue-400 transition-colors bg-gray-50"
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
      </div>

      {/* Info tip */}
      <div className="max-w-6xl mx-auto mt-3">
        <div className="flex items-center justify-center space-x-2">
          <ClipboardList className="h-4 w-4 text-gray-400" />
          <p className="text-xs xl:text-sm text-gray-500 text-center">
            {showRecordingControls ? recordingTip : defaultTip}
          </p>
        </div>
      </div>

      {/* Desktop drag & drop hint */}
      {!showRecordingControls && !isUploading && !selectedFile && (
        <div className="hidden md:block max-w-4xl mx-auto mt-2">
          <p className="text-xs text-gray-400 text-center">
            You can also drag and drop an audio file anywhere on this area
          </p>
        </div>
      )}
    </>
  );
};

export default PromptInput;