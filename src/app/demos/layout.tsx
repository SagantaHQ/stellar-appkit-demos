import { AppKitProvider } from '@/components/appkit-provider';

export default function DemosLayout({ children }: { children: React.ReactNode }) {
  return <AppKitProvider>{children}</AppKitProvider>;
}
