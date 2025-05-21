export interface WalletState {
  address: string | null;
  connected: boolean;
  connecting: boolean;
  error: string | null;
  balance: string;
  network: {
    id: number;
    name: string;
  } | null;
}

export interface WalletContextType extends WalletState {
  connect: () => Promise<void>;
  disconnect: () => void;
  signMessage: (message: string) => Promise<string | null>;
}