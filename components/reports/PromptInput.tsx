// components/reports/sub-components/InputSection.tsx
import { useForm } from "react-hook-form";
import { ArrowUp, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";

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
  textareaRef
}: InputSectionProps) => {
  return (
    <>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="w-full relative z-10 max-w-4xl mx-auto flex items-center gap-2 border rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all"
        >
          <FormField
            name="prompt"
            render={() => (
              <FormItem className="flex-1">
                <FormControl className="m-0 p-0">
                  <textarea
                    ref={textareaRef}
                    className="w-full border-0 focus:ring-0 resize-y min-h-[80px] max-h-[200px] py-2 px-3 text-base transition-all duration-200 ease-in-out"
                    disabled={isLoading}
                    placeholder="You can type here or use the mic to dictate"
                    value={prompt}
                    onChange={(e) => {
                      setPrompt(e.target.value);
                      // Auto-expand the textarea
                      e.target.style.height = 'auto';
                      e.target.style.height = `${e.target.scrollHeight}px`;
                    }}
                    rows={3}
                    style={{minHeight: '80px', maxHeight: '300px'}}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-full"
            type="submit"
            disabled={isLoading || !prompt.trim()}
            size="icon"
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
        </form>
      </Form>
      <div className="max-w-6xl mx-auto mt-2">
        <div className="flex items-center justify-center space-x-2">
          <ClipboardList className="h-4 w-4 text-gray-400" />
          <p className="text-xs xl:text-base text-gray-500 text-center">
            {showRecordingControls ? recordingTip : defaultTip}
          </p>
        </div>
      </div>
    </>
  );
};

export default PromptInput;