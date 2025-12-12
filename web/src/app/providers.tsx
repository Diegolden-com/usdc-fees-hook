'use client';

import { PrivyProvider } from '@privy-io/react-auth';
import { unichainSepolia } from 'viem/chains';

export default function Providers({ children }: { children: React.ReactNode }) {
    return (
        <PrivyProvider
            appId="cmj26e4nc005tle0da5r8o7eb"
            config={{
                loginMethods: ['email', 'wallet'],
                appearance: {
                    theme: 'light',
                    accentColor: '#676FFF',
                },
                embeddedWallets: {
                    ethereum: {
                        createOnLogin: 'users-without-wallets',
                    },
                },
                defaultChain: unichainSepolia,
                supportedChains: [unichainSepolia],
            }}
        >
            {children}
        </PrivyProvider>
    );
}
