import { create } from 'zustand';
import { ComponentType } from 'react';

interface BottomAccessoryStore {
  Component: ComponentType<object> | null;
  props: object;
  setAccessory: <P extends object>(Component: ComponentType<P>, props: P) => void;
  clearAccessory: () => void;
}

const useBottomAccessoryStore = create<BottomAccessoryStore>((set) => ({
  Component: null,
  props: {},
  setAccessory: (Component, props) => set({ Component: Component as ComponentType<object>, props }),
  clearAccessory: () => set({ Component: null, props: {} }),
}));

export default useBottomAccessoryStore;
