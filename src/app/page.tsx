
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Pause, Download, Share2, Volume2, AlertTriangle, Disc3, Code } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { speak } from '@/ai/flows/tts-flow';
import type { SpeakOutput } from '@/ai/flows/tts-schema';

const HINDI_VOICES = ['Algenib', 'Achernar', 'en-IN-Wavenet-A', 'en-IN-Wavenet-D'];
const ENGLISH_VOICES = ['Shaula', 'Gemma', 'en-IN-Wavenet-B', 'en-IN-Wavenet-C'];

export default function BhashaVoicePage() {
  const [text, setText] = useState('नमस्ते! यहाँ अपना टेक्स्ट टाइप करें।\nHello! Type your text here.');
  const [language, setLanguage] = useState('hi-IN');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [selectedVoiceName, setSelectedVoiceName] = useState<string>(HINDI_VOICES[0]);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    setAudioUrl(null);
    if (language === 'hi-IN') {
      setSelectedVoiceName(HINDI_VOICES[0]);
    } else {
      setSelectedVoiceName(ENGLISH_VOICES[0]);
    }
  }, [language]);

  useEffect(() => {
    setAudioUrl(null);
  }, [text, selectedVoiceName]);

  const handlePlayPause = useCallback(async () => {
    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
      return;
    }

    if (audioUrl) {
      if (audioRef.current) {
        audioRef.current.play();
        setIsPlaying(true);
      }
    } else {
      await handleConvert(true);
    }
  }, [isPlaying, audioUrl]);

  const handleConvert = useCallback(async (playAfter = false) => {
    if (!text) return;
    setIsConverting(true);
    setAudioUrl(null);
    try {
      const response: SpeakOutput = await speak({
        text,
        voice: selectedVoiceName,
        lang: language
      });
      if (response.audio) {
        setAudioUrl(response.audio);
        if (!playAfter) {
            toast({
              title: "Conversion Successful",
              description: "Your text has been converted to audio.",
            });
        }
        if (playAfter) {
          setTimeout(() => {
            if (audioRef.current) {
              audioRef.current.src = response.audio;
              audioRef.current?.play();
              setIsPlaying(true);
            }
          }, 100);
        }
      } else {
        throw new Error("Audio data not received.");
      }
    } catch (error) {
      console.error('Error converting text to speech:', error);
      toast({
        variant: "destructive",
        title: "Conversion Failed",
        description: "Could not convert text to speech.",
      });
    } finally {
      setIsConverting(false);
    }
  }, [text, language, selectedVoiceName, toast]);

  const handleDownload = useCallback(() => {
    if (!audioUrl) return;
    const link = document.createElement('a');
    link.href = audioUrl;
    link.download = 'BhashaVoice-speech.wav';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({
      title: "Audio Downloading",
      description: "Your audio file is being downloaded.",
    });
  }, [audioUrl, toast]);

  const handleShare = useCallback(async () => {
    if (!text) return;

    const fallbackShare = () => {
      navigator.clipboard.writeText(text);
      toast({
        title: "Copied to Clipboard",
        description: "Sharing is not available, so we copied the text for you.",
      });
    };

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'BhashaVoice Speech',
          text: text,
        });
      } catch (error) {
        console.error('Error sharing:', error);
        // Fallback to clipboard if sharing fails (e.g., permission denied)
        fallbackShare();
      }
    } else {
      // Fallback to clipboard if navigator.share is not supported
      fallbackShare();
    }
  }, [text, toast]);
  
  const voicesForLanguage = language === 'hi-IN' ? HINDI_VOICES : ENGLISH_VOICES;

  if (!isMounted) return null;

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow w-full flex flex-col items-center justify-center bg-background text-foreground p-4 sm:p-6 md:p-8">
        <Card className="w-full max-w-3xl shadow-2xl bg-card rounded-xl">
          <CardHeader className="text-center">
            <div className="flex justify-center items-center gap-3 mb-2">
              <Volume2 className="h-10 w-10 text-primary" />
              <CardTitle className="text-5xl font-headline font-bold text-card-foreground">BhashaVoice</CardTitle>
            </div>
            <CardDescription className="text-muted-foreground text-lg">Your Indian accent text-to-speech companion.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 px-4 md:px-8">
            {!isMounted && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Feature Not Fully Supported</AlertTitle>
                <AlertDescription>
                  Your browser may not support all features. Audio generation will work, but real-time playback may be unavailable.
                </AlertDescription>
              </Alert>
            )}

            <Textarea
              placeholder="Type or paste your text here..."
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                setAudioUrl(null);
              }}
              className="min-h-[180px] text-base resize-none focus:ring-accent bg-input border-border text-foreground rounded-lg"
              disabled={isConverting}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="language" className="text-muted-foreground font-semibold">Language</Label>
                <Select value={language} onValueChange={setLanguage} disabled={isConverting}>
                  <SelectTrigger id="language" className="focus:ring-accent bg-input border-border text-foreground rounded-lg">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border rounded-lg">
                    <SelectItem value="en-IN" className="text-popover-foreground">English (India)</SelectItem>
                    <SelectItem value="hi-IN" className="text-popover-foreground">Hindi (India)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="voice" className="text-muted-foreground font-semibold">Voice</Label>
                <Select 
                  value={selectedVoiceName} 
                  onValueChange={setSelectedVoiceName}
                  disabled={isConverting}
                >
                  <SelectTrigger id="voice" className="focus:ring-accent bg-input border-border text-foreground rounded-lg">
                    <SelectValue placeholder="Select voice" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border rounded-lg">
                    {voicesForLanguage.map((voice) => (
                      <SelectItem key={voice} value={voice} className="text-popover-foreground">
                        {voice}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {audioUrl && (
              <div className="space-y-2">
                <Label className="text-muted-foreground font-semibold">Preview</Label>
                <audio 
                  controls 
                  ref={audioRef}
                  src={audioUrl} 
                  className="w-full rounded-lg"
                  onEnded={() => setIsPlaying(false)}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                >
                  Your browser does not support the audio element.
                </audio>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row flex-wrap justify-center items-center gap-3 md:gap-4 p-4 md:p-8">
            <Button 
              onClick={handlePlayPause} 
              size="lg" 
              disabled={!text || isConverting} 
              className="w-full sm:w-auto flex-grow sm:flex-grow-0 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-lg"
            >
              {isPlaying ? <Pause className="mr-2 h-5 w-5" /> : <Play className="mr-2 h-5 w-5" />}
              {isPlaying ? 'Pause' : 'Play'}
            </Button>
            <Button onClick={() => handleConvert()} size="lg" disabled={!text || isConverting} className="w-full sm:w-auto flex-grow sm:flex-grow-0 bg-secondary hover:bg-secondary/90 text-secondary-foreground font-bold rounded-lg">
              {isConverting ? <Disc3 className="mr-2 h-5 w-5 animate-spin" /> : <Volume2 className="mr-2 h-5 w-5" />}
              {isConverting ? 'Converting...' : 'Convert'}
            </Button>
            <Button onClick={handleDownload} variant="outline" size="lg" disabled={!audioUrl || isConverting} className="w-full sm:w-auto flex-grow sm:flex-grow-0 border-border hover:bg-accent hover:text-accent-foreground font-bold rounded-lg">
              <Download className="mr-2 h-5 w-5" />
              Download
            </Button>
            <Button onClick={handleShare} variant="outline" size="lg" disabled={!text || isConverting} className="w-full sm:w-auto flex-grow sm:flex-grow-0 border-border hover:bg-accent hover:text-accent-foreground font-bold rounded-lg">
              <Share2 className="mr-2 h-5 w-5" />
              Share
            </Button>
          </CardFooter>
        </Card>
      </main>
      <footer className="w-full p-4 text-center text-muted-foreground">
        <p className="flex items-center justify-center gap-2">
          <Code className="h-4 w-4"/>
          Developed by Your Name
        </p>
      </footer>
    </div>
  );
}
