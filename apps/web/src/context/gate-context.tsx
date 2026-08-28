'use client';

import {
  ComponentType,
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useAuthPromptGate } from '@/hooks/use-auth-prompt-gate';
import { useWelcomeGate } from '@/hooks/use-welcome-gate';

export interface GateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCloseEnd?: () => void;
}

interface GateEntry {
  component: ComponentType<GateModalProps>;
  eligible: boolean;
}

interface GateContextProps {
  registerGate: (id: string, component: ComponentType<GateModalProps>) => void;
  updateGateEligibility: (id: string, eligible: boolean) => void;
  unregisterGate: (id: string) => void;
}

const GateContext = createContext<GateContextProps | undefined>(undefined);

const GATE_TRANSITION_DELAY_MS = 2000;
// Don't show a gate the instant the app mounts -- let the page settle first.
const INITIAL_LOAD_DELAY_MS = 2000;

export const GateProvider = ({ children }: { children: ReactNode }) => {
  const gatesRef = useRef<Map<string, GateEntry>>(new Map());
  const orderRef = useRef<string[]>([]);
  const activeIdRef = useRef<string | null>(null);
  const coolingDownRef = useRef(false);
  const initialDelayRef = useRef(true);

  const [activeId, setActiveIdState] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const setActiveId = useCallback((id: string | null) => {
    activeIdRef.current = id;
    setActiveIdState(id);
  }, []);

  const pickNext = useCallback(() => {
    if (initialDelayRef.current || coolingDownRef.current || activeIdRef.current) return;
    const nextId = orderRef.current.find((id) => gatesRef.current.get(id)?.eligible);
    if (!nextId) return;
    setActiveId(nextId);
    setOpen(true);
  }, [setActiveId]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      initialDelayRef.current = false;
      pickNext();
    }, INITIAL_LOAD_DELAY_MS);
    return () => clearTimeout(timeoutId);
  }, []);

  const registerGate = useCallback((id: string, component: ComponentType<GateModalProps>) => {
    if (!gatesRef.current.has(id)) {
      orderRef.current.push(id);
    }
    gatesRef.current.set(id, { component, eligible: false });
  }, []);

  const updateGateEligibility = useCallback(
    (id: string, eligible: boolean) => {
      const entry = gatesRef.current.get(id);
      if (!entry || entry.eligible === eligible) return;
      gatesRef.current.set(id, { ...entry, eligible });
      pickNext();
    },
    [pickNext],
  );

  const unregisterGate = useCallback((id: string) => {
    gatesRef.current.delete(id);
    orderRef.current = orderRef.current.filter((gateId) => gateId !== id);
  }, []);

  const handleOpenChange = useCallback((nextOpen: boolean) => {
    setOpen(nextOpen);
  }, []);

  const handleCloseEnd = useCallback(() => {
    setActiveId(null);
    coolingDownRef.current = true;
    setTimeout(() => {
      coolingDownRef.current = false;
      pickNext();
    }, GATE_TRANSITION_DELAY_MS);
  }, [setActiveId, pickNext]);

  const ActiveComponent = activeId ? gatesRef.current.get(activeId)?.component : undefined;

  return (
    <GateContext.Provider value={{ registerGate, updateGateEligibility, unregisterGate }}>
      <GateRegistrations />
      {children}
      {ActiveComponent && (
        <ActiveComponent open={open} onOpenChange={handleOpenChange} onCloseEnd={handleCloseEnd} />
      )}
    </GateContext.Provider>
  );
};

const GateRegistrations = () => {
  useAuthPromptGate();
  useWelcomeGate();
  return null;
};

export const useGate = (
  id: string,
  eligible: boolean,
  component: ComponentType<GateModalProps>,
) => {
  const context = useContext(GateContext);
  if (!context) {
    throw new Error('useGate must be used within a GateProvider');
  }
  const { registerGate, updateGateEligibility, unregisterGate } = context;

  useEffect(() => {
    registerGate(id, component);
    return () => unregisterGate(id);
  }, [id]);

  useEffect(() => {
    updateGateEligibility(id, eligible);
  }, [id, eligible, updateGateEligibility]);
};
