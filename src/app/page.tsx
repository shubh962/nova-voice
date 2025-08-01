
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Pause, Download, Share2, Volume2, AlertTriangle, Disc3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { speak } from '@/ai/flows/tts-flow';
import type { SpeakOutput } from '@/ai/flows/tts-schema';

const HINDI_VOICES = ['Algenib', 'Achernar'];
const ENGLISH_VOICES = ['Shaula', 'Gemma'];

export default function BhashaVoicePage() {
  const [text, setText] = useState('नमस्ते! यहाँ अपना टेक्स्ट टाइप करें।\nHello! Type your text here.');
  const [language, setLanguage] = useState('hi-IN');
  const [pitch, setPitch] = useState(1);
  const [rate, setRate] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [selectedVoiceName, setSelectedVoiceName] = useState<string>(HINDI_VOICES[0]);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== 'undefined' && !('speechSynthesis' in window)) {
        setIsSupported(false);
    }
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
  }, [text, selectedVoiceName, pitch, rate]);

  const handlePlayPause = useCallback(async () => {
    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
      return;
    }

    if (audioUrl) {
      audioRef.current?.play();
      setIsPlaying(true);
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
          // A bit of a hack to play after state has updated
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
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'BhashaVoice Speech',
          text: text,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      navigator.clipboard.writeText(text);
      toast({
        title: "Copied to Clipboard",
        description: "Text copied to clipboard as sharing is not available.",
      });
    }
  }, [text, toast]);
  
  const voicesForLanguage = language === 'hi-IN' ? HINDI_VOICES : ENGLISH_VOICES;

  if (!isMounted) return null;

  return (
    <main className="min-h-screen w-full flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center items-center gap-2 mb-2">
            <Volume2 className="h-8 w-8 text-primary" />
            <CardTitle className="text-4xl font-headline">BhashaVoice</CardTitle>
          </div>
          <CardDescription>Your Indian accent text-to-speech companion.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!isSupported && (
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
            className="min-h-[150px] text-base resize-none focus:ring-accent"
            disabled={isConverting}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <Select value={language} onValueChange={setLanguage} disabled={isConverting}>
                <SelectTrigger id="language" className="focus:ring-accent">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en-IN">English (India)</SelectItem>
                  <SelectItem value="hi-IN">Hindi (India)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="voice">Voice</Label>
              <Select 
                value={selectedVoiceName} 
                onValueChange={setSelectedVoiceName}
                disabled={isConverting}
              >
                <SelectTrigger id="voice" className="focus:ring-accent">
                  <SelectValue placeholder="Select voice" />
                </SelectTrigger>
                <SelectContent>
                  {voicesForLanguage.map((voice) => (
                    <SelectItem key={voice} value={voice}>
                      {voice}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rate">Speed: {rate.toFixed(1)}x</Label>
              <Slider
                id="rate"
                min={0.5}
                max={2}
                step={0.1}
                value={[rate]}
                onValueChange={(value) => setRate(value[0])}
                disabled={isConverting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pitch">Pitch: {pitch.toFixed(1)}</Label>
              <Slider
                id="pitch"
                min={0.5}
                max={2}
                step={0.1}
                value={[pitch]}
                onValueChange={(value) => setPitch(value[0])}
                disabled={isConverting}
              />
            </div>
          </div>
           {audioUrl && (
            <div className="space-y-2">
              <Label>Preview</Label>
              <audio 
                controls 
                ref={audioRef}
                src={audioUrl} 
                className="w-full"
                onEnded={() => setIsPlaying(false)}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              >
                Your browser does not support the audio element.
              </audio>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-wrap justify-center gap-4">
          <Button 
            onClick={handlePlayPause} 
            size="lg" 
            disabled={!text || isConverting} 
            className="w-32 bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {isPlaying ? <Pause className="mr-2 h-5 w-5" /> : <Play className="mr-2 h-5 w-5" />}
            {isPlaying ? 'Pause' : 'Play'}
          </Button>
           <Button onClick={() => handleConvert()} size="lg" disabled={!text || isConverting}>
            {isConverting ? <Disc3 className="mr-2 h-5 w-5 animate-spin" /> : <Download className="mr-2 h-5 w-5" />}
            {isConverting ? 'Converting...' : 'Convert'}
          </Button>
          <Button onClick={handleDownload} variant="outline" size="lg" disabled={!audioUrl || isConverting}>
            <Download className="mr-2 h-5 w-5" />
            Download
          </Button>
          <Button onClick={handleShare} variant="outline" size="lg" disabled={!text || isConverting}>
            <Share2 className="mr-2 h-5 w-5" />
            Share
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
}
