
import type {Metadata} from 'next';
import { Toaster } from "@/components/ui/toaster"
import { Inter } from 'next/font/google'
import './globals.css';
import { AuthProvider } from '@/context/auth-context';
import Script from 'next/script';

const inter = Inter({ subsets: ['latin'], display: 'swap' })

const APP_NAME = 'NovaVoice';
const APP_URL = 'https://novavoice.com'; // Replace with your actual domain
const APP_DESCRIPTION = 'Generate realistic AI voices online with NovaVoice. Free text-to-speech (TTS) with natural-sounding Hindi and English Indian accents. Convert text to audio instantly.';
const APP_IMAGE_PREVIEW = `${APP_URL}/og-preview.png`; // Replace with your actual preview image

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: `${APP_NAME} | Free AI Text-to-Speech (TTS) for Indian Voices`,
    template: `%s | ${APP_NAME}`,
    
    <meta name="google-site-verification" content="XhRtp6rO2MNQX-BucHlUxVhNLbBPfdis_RzXY5ZodlU" />
  },
  description: APP_DESCRIPTION,
  keywords: ['text to speech', 'TTS', 'AI voice', 'Indian accent', 'Hindi TTS', 'English TTS', 'free tts', 'online tts', 'NovaVoice', 'text to audio', 'voice generator'],
  applicationName: APP_NAME,
  authors: [{ name: 'NovaVoice Team', url: APP_URL }],
  creator: 'NovaVoice Team',
  publisher: 'NovaVoice',
  openGraph: {
    type: 'website',
    url: APP_URL,
    title: `${APP_NAME} | AI TTS for Indian Voices`,
    description: APP_DESCRIPTION,
    siteName: APP_NAME,
    images: [{
      url: APP_IMAGE_PREVIEW,
      width: 1200,
      height: 630,
      alt: 'NovaVoice App Preview',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${APP_NAME} | Free AI TTS for Indian Accents`,
    description: APP_DESCRIPTION,
    images: [APP_IMAGE_PREVIEW],
    creator: '@NovaVoice', // Replace with your Twitter handle if you have one
  },
  robots: 'index, follow',
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.className}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        <Script
          async
          src="https://securepubads.g.doubleclick.net/tag/js/gpt.js"
          strategy="afterInteractive"
        />
        <Script
          id="gpt-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.googletag = window.googletag || {cmd: []};
              googletag.cmd.push(function() {
                googletag.pubads().enableSingleRequest();
                googletag.enableServices();
              });
            `,
          }}
        />
      </head>
      <body className="antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
