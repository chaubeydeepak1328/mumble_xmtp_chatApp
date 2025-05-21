import { createContext, useReducer, useContext, ReactNode } from 'react';
import { ethers } from 'ethers';
import { WalletState, WalletContextType } from '../types/wallet';

const initialState: WalletState = {
  address: null,
  connected: false,
  connecting: false,
  error: null,
  balance: '0',
  network: null,
};

type WalletAction =
  | { type: 'CONNECT_START' }
  | { type: 'CONNECT_SUCCESS'; payload: { address: string; balance: string; network: { id: number; name: string } } }
  | { type: 'CONNECT_ERROR'; payload: string }
  | { type: 'DISCONNECT' }
  | { type: 'UPDATE_BALANCE'; payload: string };

const walletReducer = (state: WalletState, action: WalletAction): WalletState => {
  switch (action.type) {
    case 'CONNECT_START':
      return { ...state, connecting: true, error: null };
    case 'CONNECT_SUCCESS':
      return {
        ...state,
        address: action.payload.address,
        balance: action.payload.balance,
        network: action.payload.network,
        connected: true,
        connecting: false,
        error: null,
      };
    case 'CONNECT_ERROR':
      return { ...state, connecting: false, error: action.payload };
    case 'DISCONNECT':
      return initialState;
    case 'UPDATE_BALANCE':
      return { ...state, balance: action.payload };
    default:
      return state;
  }
};

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(walletReducer, initialState);

  // Check if window.ethereum is available (MetaMask or similar wallet)
  const hasEthereum = typeof window !== 'undefined' && window.ethereum;

  const connect = async () => {
    if (!hasEthereum) {
      dispatch({ type: 'CONNECT_ERROR', payload: 'No Ethereum wallet found. Please install MetaMask.' });
      return;
    }

    dispatch({ type: 'CONNECT_START' });

    try {
      // Mock connection for demo purposes
      // In production, this would connect to the actual wallet
      const mockAddress = '0x742d35Cc6634C0532925a3b844Bc454e4438f44e';
      const mockBalance = '1.5';
      const mockNetwork = { id: 11647, name: 'Ramestta Mainnet' };

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 800));

      dispatch({
        type: 'CONNECT_SUCCESS',
        payload: {
          address: mockAddress,
          balance: mockBalance,
          network: mockNetwork,
        },
      });

      // Set up listeners for account changes
      if (window.ethereum) {
        window.ethereum.on('accountsChanged', () => {
          // Force reconnect on account change
          disconnect();
          connect();
        });

        window.ethereum.on('chainChanged', () => {
          // Force reconnect on network change
          disconnect();
          connect();
        });
      }
    } catch (error) {
      console.error('Failed to connect to wallet:', error);
      dispatch({
        type: 'CONNECT_ERROR',
        payload: 'Failed to connect to wallet. Please try again.',
      });
    }
  };

  const disconnect = () => {
    dispatch({ type: 'DISCONNECT' });
  };

  const signMessage = async (message: string): Promise<string | null> => {
    if (!state.connected || !state.address) {
      dispatch({
        type: 'CONNECT_ERROR',
        payload: 'Wallet not connected. Please connect your wallet first.',
      });
      return null;
    }

    try {
      // Mock signing for demo purposes
      // In production, this would use the actual wallet to sign
      // const signature = await window.ethereum.request({
      //   method: 'personal_sign',
      //   params: [message, state.address],
      // });
      
      // Mock signature
      const mockSignature = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1b';
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      return mockSignature;
    } catch (error) {
      console.error('Error signing message:', error);
      dispatch({
        type: 'CONNECT_ERROR',
        payload: 'Failed to sign message. Please try again.',
      });
      return null;
    }
  };

  return (
    <WalletContext.Provider
      value={{
        ...state,
        connect,
        disconnect,
        signMessage,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWalletContext = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWalletContext must be used within a WalletProvider');
  }
  return context;
};