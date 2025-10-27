export interface ISiteAdapter {
  getInputElement(): HTMLElement | null;
  getSubmitButton(): HTMLElement | null;
  setInputValue(value: string): void;
  getInputValue(): string;
  getUserPromptHistory(): string[];
  cleanup(): void;
}