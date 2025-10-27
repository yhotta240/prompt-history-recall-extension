import { ISiteAdapter } from '../types';

export class HistoryManager {
  constructor(private adapter: ISiteAdapter) { }

  getHistory(): string[] {
    return this.adapter.getUserPromptHistory();
  }

  getHistoryByIndex(index: number): string | null {
    const prompts = this.getHistory();
    if (index < 0 || index >= prompts.length) {
      return null;
    }
    return prompts[index];
  }
}
