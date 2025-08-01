'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Pause, Download, Share2, Volume2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function BhashaVoicePage() {
  const [text, setText] = useState('नमस्ते! यहाँ अपना टेक्स्ट टाइप करें।\nHello! Type your text here.');
  const [language, setLanguage] = useState('hi-IN');
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [pitch, setPitch] = useState(1);
  const [rate, setRate] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const handleVoicesChanged = () => {
        const availableVoices = window.speechSynthesis.getVoices();
        const indianVoices = availableVoices.filter(voice => voice.lang.endsWith('-IN'));
        setVoices(indianVoices);
      };

      handleVoicesChanged(); // Initial fetch
      window.speechSynthesis.onvoiceschanged = handleVoicesChanged;

      return () => {
        window.speechSynthesis.onvoiceschanged = null;
        window.speechSynthesis.cancel();
      };
    } else {
      setIsSupported(false);
    }
  }, []);

  useEffect(() => {
    const filteredVoices = voices.filter(voice => voice.lang === language);
    setSelectedVoice(filteredVoices[0] || null);
  }, [language, voices]);


  const handlePlayPause = useCallback(() => {
    if (!text || !selectedVoice) return;

    if (isPlaying) {
      if (isPaused) {
        window.speechSynthesis.resume();
      } else {
        window.speechSynthesis.pause();
      }
    } else {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.voice = selectedVoice;
      utterance.pitch = pitch;
      utterance.rate = rate;
      
      utterance.onstart = () => {
        setIsPlaying(true);
        setIsPaused(false);
      };
      utterance.onpause = () => setIsPaused(true);
      utterance.onresume = () => setIsPaused(false);
      utterance.onend = () => {
        setIsPlaying(false);
        setIsPaused(false);
      };
      utterance.onerror = (event) => {
        console.error('SpeechSynthesisUtterance.onerror', event);
        setIsPlaying(false);
        setIsPaused(false);
        toast({
          variant: "destructive",
          title: "Playback Error",
          description: "An error occurred during speech synthesis.",
        })
      };

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    }
  }, [text, selectedVoice, pitch, rate, isPlaying, isPaused, toast]);

  const handleSave = useCallback(() => {
    if (!text) return;
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'BhashaVoice-speech.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast({
      title: "Text Saved",
      description: "Your text has been saved as a .txt file.",
    });
  }, [text, toast]);

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
  
  const filteredVoices = voices.filter(v => v.lang === language);
  
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
              <AlertTitle>Browser Not Supported</AlertTitle>
              <AlertDescription>
                Your browser does not support the Web Speech API. Please try a different browser like Chrome or Firefox.
              </AlertDescription>
            </Alert>
          )}

          <Textarea
            placeholder="Type or paste your text here..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="min-h-[150px] text-base resize-none focus:ring-accent"
            disabled={!isSupported || isPlaying}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <Select value={language} onValueChange={setLanguage} disabled={!isSupported || isPlaying}>
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
                value={selectedVoice?.name || ''} 
                onValueChange={(name) => setSelectedVoice(voices.find(v => v.name === name) || null)}
                disabled={!isSupported || isPlaying || filteredVoices.length === 0}
              >
                <SelectTrigger id="voice" className="focus:ring-accent">
                  <SelectValue placeholder="Select voice" />
                </SelectTrigger>
                <SelectContent>
                  {filteredVoices.length > 0 ? (
                    filteredVoices.map((voice) => (
                      <SelectItem key={voice.name} value={voice.name}>
                        {voice.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-voice" disabled>No voices available</SelectItem>
                  )}
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
                disabled={!isSupported || isPlaying}
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
                disabled={!isSupported || isPlaying}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center gap-4">
          <Button 
            onClick={handlePlayPause} 
            size="lg" 
            disabled={!text || !selectedVoice || !isSupported} 
            className="w-36 bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {isPlaying && !isPaused ? <Pause className="mr-2 h-5 w-5" /> : <Play className="mr-2 h-5 w-5" />}
            {isPlaying ? (isPaused ? 'Resume' : 'Pause') : 'Play'}
          </Button>
          <Button onClick={handleSave} variant="outline" size="lg" disabled={!text || !isSupported || isPlaying}>
            <Download className="mr-2 h-5 w-5" />
            Save
          </Button>
          <Button onClick={handleShare} variant="outline" size="lg" disabled={!text || !isSupported || isPlaying}>
            <Share2 className="mr-2 h-5 w-5" />
            Share
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
}
