import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useSyncExternalStore,
} from "react";

export default function createStore<State>(initialState: State) {
  interface StoreData {
    get: () => State;
    set: (state: Partial<State>) => void;
    subscribe: (listener: () => void) => () => void;
  }

  function useStoreData(): StoreData {
    const store = useRef<State>(initialState);

    const subscribers = useRef(new Set<() => void>());

    const get = useCallback(() => store.current, []);

    const set = useCallback((data: Partial<State>) => {
      const newData: State = { ...store.current, ...data };
      store.current = newData;

      subscribers.current.forEach((subscriber) => subscriber());
    }, []);

    const subscribe = useCallback((listener: () => void) => {
      subscribers.current.add(listener);

      return () => subscribers.current.delete(listener);
    }, []);

    return { get, set, subscribe };
  }

  type ReturnOfStoreData = ReturnType<typeof useStoreData>;

  const StoreContext = createContext<ReturnOfStoreData | null>(null);

  const StoreProvider = ({ children }: { children: React.ReactNode }) => (
    <StoreContext.Provider value={useStoreData()}>
      {children}
    </StoreContext.Provider>
  );

  function useStore<SelectorOutput>(
    selector: (state: State) => SelectorOutput
  ): [SelectorOutput, (value: Partial<State>) => void] {
    const store = useContext(StoreContext)!;
    if (!store) throw new Error("No store found");

    const state = useSyncExternalStore<any>(store.subscribe, () =>
      selector(store.get())
    );

    return [state, store.set];
  }

  return {
    StoreProvider,
    useStore,
  };
}
