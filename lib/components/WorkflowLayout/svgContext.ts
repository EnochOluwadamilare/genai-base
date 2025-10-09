import { createContext, useContext } from 'react';

export const LinesUpdateContext = createContext<(() => void) | undefined>(undefined);

export function useLinesUpdate() {
    const ctx = useContext(LinesUpdateContext);
    if (!ctx) throw new Error('useLinesUpdate must be used within WorkflowLayout');
    return ctx;
}
