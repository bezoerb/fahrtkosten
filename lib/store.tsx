import { createContext, useContext } from 'react';
// import { create } from 'zustand';
// import { UseBoundStore } from 'zustand/index';
// import createContext from 'zustand/context';
import { createStore, useStore } from 'zustand';
import { shallow } from 'zustand/shallow';
import { devtools } from 'zustand/middleware';
import { Journeys as HafasJourneys } from 'hafas-client';

// Provider wrapper
import { useRef } from 'react';
import {} from 'react';

import { take } from './helper';
import { merge } from 'merge-anything';
import { FuelType, HafasResult, Location } from './types';

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

export interface InputData {
  start: string;
  dest: string;
  fuelType: FuelType;
  twoWay: boolean;
  fuelConsumption: number;
  adults: number;
  children: number;
}

const keep = ['start', 'fuelType', 'fuelConsumption', 'adults', 'children'];

export interface ResultData {
  carFastest?: CarData;
  carShortest?: CarData;
  db?: HafasResult;
  hvv?: HvvData;
  start?: Location;
  end?: Location;
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
  input: {
    start: '',
    dest: '',
    fuelType: FuelType.E5,
    twoWay: true,
    fuelConsumption: 11,
    adults: 1,
    children: 0,
  },
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
  return createStore<AppState>()(
    devtools((set) => ({
      ...merge(initialState, initProps || {}, getLocalStorage('settings') || {}),
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
    }))
  );
};

export const Context = createContext<AppStore | null>(null);

type AppProviderProps = React.PropsWithChildren<AppProps>;

export const Provider = ({ children, ...props }: AppProviderProps) => {
  const storeRef = useRef<AppStore>();
  if (!storeRef.current) {
    storeRef.current = createAppStore(props);
  }

  return <Context.Provider value={storeRef.current}>{children}</Context.Provider>;
};

export function useAppContext<T>(selector: (state: AppState) => T, equalityFn?: (left: T, right: T) => boolean): T {
  const store = useContext(Context);
  if (!store) throw new Error('Missing Context.Provider in the tree');
  return useStore(store, selector, equalityFn || shallow);
}
