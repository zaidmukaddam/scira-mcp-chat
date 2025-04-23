import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

// API key configuration
interface ApiKeyConfig {
  name: string;
  key: string;
  storageKey: string;
  label: string;
  placeholder: string;
}

// Available API keys configuration
const API_KEYS_CONFIG: ApiKeyConfig[] = [
  {
    name: "OpenAI",
    key: "openai",
    storageKey: "OPENAI_API_KEY",
    label: "OpenAI API Key",
    placeholder: "sk-..."
  },
  {
    name: "Anthropic",
    key: "anthropic",
    storageKey: "ANTHROPIC_API_KEY",
    label: "Anthropic API Key",
    placeholder: "sk-ant-..."
  },
  {
    name: "Groq",
    key: "groq",
    storageKey: "GROQ_API_KEY",
    label: "Groq API Key",
    placeholder: "gsk_..."
  },
  {
    name: "XAI",
    key: "xai",
    storageKey: "XAI_API_KEY",
    label: "XAI API Key",
    placeholder: "xai-..."
  }
];

interface ApiKeyManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ApiKeyManager({ open, onOpenChange }: ApiKeyManagerProps) {
  // State to store API keys
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});

  // Load API keys from localStorage on initial mount
  useEffect(() => {
    const storedKeys: Record<string, string> = {};
    
    API_KEYS_CONFIG.forEach(config => {
      const value = localStorage.getItem(config.storageKey);
      if (value) {
        storedKeys[config.key] = value;
      }
    });
    
    setApiKeys(storedKeys);
  }, []);

  // Update API key in state
  const handleApiKeyChange = (key: string, value: string) => {
    setApiKeys(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Save API keys to localStorage
  const handleSaveApiKeys = () => {
    try {
      API_KEYS_CONFIG.forEach(config => {
        const value = apiKeys[config.key];
        
        if (value && value.trim()) {
          localStorage.setItem(config.storageKey, value.trim());
        } else {
          localStorage.removeItem(config.storageKey);
        }
      });
      
      toast.success("API keys saved successfully");
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving API keys:", error);
      toast.error("Failed to save API keys");
    }
  };

  // Clear all API keys
  const handleClearApiKeys = () => {
    try {
      API_KEYS_CONFIG.forEach(config => {
        localStorage.removeItem(config.storageKey);
      });
      
      setApiKeys({});
      toast.success("All API keys cleared");
    } catch (error) {
      console.error("Error clearing API keys:", error);
      toast.error("Failed to clear API keys");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>API Key Settings</DialogTitle>
          <DialogDescription>
            Enter your own API keys for different AI providers. Keys are stored securely in your browser&apos;s local storage.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          {API_KEYS_CONFIG.map(config => (
            <div key={config.key} className="grid gap-2">
              <Label htmlFor={config.key}>{config.label}</Label>
              <Input
                id={config.key}
                type="password"
                value={apiKeys[config.key] || ""}
                onChange={(e) => handleApiKeyChange(config.key, e.target.value)}
                placeholder={config.placeholder}
              />
            </div>
          ))}
        </div>
        
        <DialogFooter className="flex justify-between sm:justify-between">
          <Button
            variant="destructive"
            onClick={handleClearApiKeys}
          >
            Clear All Keys
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveApiKeys}>
              Save Keys
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 