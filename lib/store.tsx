import { createContext, useContext, useLayoutEffect } from 'react';
// import { create } from 'zustand';
// import { UseBoundStore } from 'zustand/index';
// import createContext from 'zustand/context';
import { createStore, useStore } from 'zustand';
import {shallow} from 'zustand/shallow';

// Provider wrapper
import { useRef } from 'react';
import {} from 'react';

import { take } from './helper';
import { merge } from 'merge-anything';
import { FuelType } from './types';

interface CarData {
  duration: number;
  distance: number;
  price: number;
}

interface HvvData {
  duration: number;
  adultPrice: number;
  childPrice: number;
}

interface InputData {
  start: string;
  dest: string;
  fuelType: FuelType;
  oneWay: boolean;
  fuelConsumption: number;
  adults: number;
  children: number;
}

const keep = ['start', 'fuelType', 'fuelConsumption', 'adults', 'children'];

interface ResultData {
  carFastest?: CarData;
  carShortest?: CarData;
  hvv?: HvvData;
}

interface AppProps {
  input: InputData;
  result: ResultData;
}

interface AppState extends AppProps {
  setInput: (input: Partial<InputData>) => void;
  setResult: (result: Partial<ResultData>) => void;
}

const initialState: AppProps = {
  input: { start: '', dest: '', fuelType: FuelType.E5, oneWay: false, fuelConsumption: 11, adults: 1, children: 0 },
  result: {},
};

const getLocalStorage = (key) => typeof window !== 'undefined' && JSON.parse(window.localStorage.getItem(key));

const setLocalStorage = (key, value) => {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(key, JSON.stringify(value));
  }
};

type AppStore = ReturnType<typeof createAppStore>;

const createAppStore = (initProps?: Partial<AppProps>) => {
  return createStore<AppState>()((set) => ({
    ...initialState,
    ...merge(initProps || {},  getLocalStorage('settings') || {}),
    setInput: (input) => {
      set((state) => {
        const nextInput = { ...state.input, ...input };

        setLocalStorage('settings', { input: take(nextInput, keep) });
        return { ...state, input: nextInput };
      });
    },

    setResult: (result) => {
      set((state) => ({
        ...state,
        result: { ...state.result, ...result },
      }));
    },
  }));
};

export const Context = createContext<AppStore | null>(null);

type AppProviderProps = React.PropsWithChildren<AppProps>;

export const Provider = ({ children, ...props }: AppProviderProps) => {
  const storeRef = useRef<AppStore>();
  if (!storeRef.current) {
    storeRef.current = createAppStore(props);
  }

  return <Context.Provider value={storeRef.current}>{children}</Context.Provider>;
}

export function useAppContext<T>(
  selector: (state: AppState) => T,
  equalityFn?: (left: T, right: T) => boolean
): T {
  const store = useContext(Context)
  if (!store) throw new Error('Missing Context.Provider in the tree')
  return useStore(store, selector, equalityFn || shallow)
}


// export const Provider = zustandContext.Provider;
// An example of how to get types
/** @type {import('zustand/index').UseStore<typeof initialState>} */
// export const useStore: UseBoundStore<AppState> = zustandContext.useStore as UseBoundStore<AppState>;

// export const initializeStore = (preloadedState: Partial<AppState> = {}) => {
//   return create<AppState>((set) => ({
//     ...merge(initialState, preloadedState, getLocalStorage('settings') || {}),
//     setInput: (input) => {
//       set((state) => {
//         const nextInput = { ...state.input, ...input };

//         setLocalStorage('settings', { input: take(nextInput, keep) });
//         return { ...state, input: nextInput };
//       });
//     },

//     setResult: (result) => {
//       set((state) => ({
//         ...state,
//         result: { ...state.result, ...result },
//       }));
//     },
//   }));
// };

// export function useCreateStore(initialState) {
//   // For SSR & SSG, always use a new store.
//   if (typeof window === 'undefined') {
//     return () => initializeStore(initialState);
//   }

//   // For CSR, always re-use same store.
//   store = store ?? initializeStore(initialState);
//   // And if initialState changes, then merge states in the next render cycle.
//   //
//   // eslint complaining "React Hooks must be called in the exact same order in every component render"
//   // is ignorable as this code runs in same order in a given environment
//   // eslint-disable-next-line react-hooks/rules-of-hooks
//   useLayoutEffect(() => {
//     if (initialState && store) {
//       store.setState({
//         ...store.getState(),
//         ...initialState,
//       });
//     }
//   }, [initialState]);

//   return () => store;
// }
