import { Hero } from '@/components/home/Hero';
import { CredenciaisStrip } from '@/components/home/CredenciaisStrip';
import { TresPilares } from '@/components/home/TresPilares';
import { HubPreview } from '@/components/home/HubPreview';
import { CTACadastro } from '@/components/home/CTACadastro';
import { UltimosArtigos } from '@/components/home/UltimosArtigos';
import { PesquisaBanner } from '@/components/home/PesquisaBanner';
import { SectionDivider } from '@/components/shared/SectionDivider';

export default function HomePage() {
  return (
    <>
      <Hero />
      <CredenciaisStrip />
      <TresPilares />
      <SectionDivider />
      <HubPreview />
      <CTACadastro />
      <SectionDivider symbol="◆" />
      <UltimosArtigos />
      <PesquisaBanner />
    </>
  );
}
