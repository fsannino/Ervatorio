import {
  Playfair_Display,
  Spectral,
  Source_Serif_4,
  DM_Sans,
  JetBrains_Mono,
} from 'next/font/google';

export const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['700', '800', '900'],
  style: ['normal', 'italic'],
  variable: '--font-playfair',
  display: 'swap',
});

export const spectral = Spectral({
  subsets: ['latin'],
  weight: ['400', '600'],
  variable: '--font-spectral',
  display: 'swap',
});

export const sourceSerif = Source_Serif_4({
  subsets: ['latin'],
  weight: ['400', '600'],
  variable: '--font-source-serif',
  display: 'swap',
});

export const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-dm-sans',
  display: 'swap',
});

export const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-jetbrains',
  display: 'swap',
});
