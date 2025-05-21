import { useEffect, useState } from "react";
import { Client } from "@xmtp/xmtp-js";
import { Signer } from "ethers";

export function useXmtp(signer: Signer | null) {
  const [xmtp, setXmtp] = useState<Client | null>(null);

  useEffect(() => {
    if (!signer) return;
    const init = async () => {
      const client = await Client.create(signer);
      setXmtp(client);
    };
    init();
  }, [signer]);

  return { xmtp };
}
