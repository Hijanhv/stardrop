"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import {
  connectWallet,
  disconnectWallet,
  onAddressChange,
  restoreAddress,
  signXdr,
} from "@/lib/wallet";
import { parseStellarError } from "@/lib/stellar";

type WalletContextValue = {
  /** Connected address, or null. */
  address: string | null;
  /** False until we've checked for a persisted connection (avoids hydration flicker). */
  ready: boolean;
  connecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  sign: (xdr: string) => Promise<string>;
};

const WalletContext = createContext<WalletContextValue | null>(null);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const unsubRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const restored = await restoreAddress();
      if (active && restored) setAddress(restored);
      // Keep in sync with wallet/account changes coming from the kit.
      const unsub = await onAddressChange((next) => {
        setAddress(next ?? null);
      });
      if (active) {
        unsubRef.current = unsub;
      } else {
        unsub();
      }
      if (active) setReady(true);
    })().catch(() => {
      if (active) setReady(true);
    });

    return () => {
      active = false;
      unsubRef.current?.();
      unsubRef.current = null;
    };
  }, []);

  const connect = useCallback(async () => {
    setConnecting(true);
    try {
      const addr = await connectWallet();
      setAddress(addr);
      toast.success("Wallet connected");
    } catch (err) {
      toast.error(parseStellarError(err));
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    try {
      await disconnectWallet();
    } catch {
      // The kit may throw for wallets without an async session — clear anyway.
    }
    setAddress(null);
    toast("Wallet disconnected");
  }, []);

  const sign = useCallback(
    async (xdr: string) => {
      if (!address) throw new Error("Connect a wallet first.");
      return signXdr(xdr, address);
    },
    [address],
  );

  return (
    <WalletContext.Provider value={{ address, ready, connecting, connect, disconnect, sign }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet(): WalletContextValue {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within a WalletProvider");
  return ctx;
}
