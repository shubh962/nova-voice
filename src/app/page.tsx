
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Pause, Download, Share2, Volume2, Disc3, Code, Coins, Gem, Rocket, Briefcase, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from "@/components/ui/slider"
import { Textarea } from '@/components/ui/textarea';
import { useToast } from "@/hooks/use-toast"
import { speak } from '@/ai/flows/tts-flow';
import type { SpeakOutput } from '@/ai/flows/tts-schema';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const HINDI_VOICES = [
  { id: 'Algenib', name: 'Shubham' },
  { id: 'Achernar', name: 'Swati' },
  { id: 'Schedar', name: 'Satish' },
  { id: 'Umbriel', name: 'Malti' },
];
const ENGLISH_VOICES = ['Rasalgethi', 'Sadachbia', 'Vindemiatrix', 'Zubenelgenubi'];
const CONVERSION_COST = 250;
const INITIAL_COINS = 500;

const PLANS = [
    {
      name: 'Starter',
      icon: Gem,
      price: '₹99',
      duration: '1 Month',
      coins: '5,000 Coins',
      conversions: '~20',
      bestFor: 'Beginners / Casual use',
      featured: false,
    },
    {
      name: 'Pro',
      icon: Rocket,
      price: '₹249',
      duration: '3 Months',
      coins: '18,000 Coins',
      conversions: '~72',
      bestFor: 'Regular Creators',
      featured: true,
    },
    {
      name: 'Business',
      icon: Briefcase,
      price: '₹499',
      duration: '6 Months',
      coins: '40,000 Coins',
      conversions: '~160',
      bestFor: 'Small Teams / Marketers',
      featured: false,
    },
    {
      name: 'Ultimate',
      icon: Crown,
      price: '₹899',
      duration: '12 Months',
      coins: '90,000 Coins',
      conversions: '~360',
      bestFor: 'Power Users & Agencies',
      featured: false,
    },
  ];

export default function BhashaVoicePage() {
  const [text, setText] = useState('नमस्ते! यहाँ अपना टेक्स्ट टाइप करें।\nHello! Type your text here.');
  const [language, setLanguage] = useState('hi-IN');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [selectedVoiceName, setSelectedVoiceName] = useState<string>(HINDI_VOICES[0].id);
  const [speechRate, setSpeechRate] = useState(1);
  const [coins, setCoins] = useState(INITIAL_COINS);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  const handleConvert = useCallback(async (playAfter = false) => {
    if (!text) return;

    if (coins < CONVERSION_COST) {
      toast({
        variant: "destructive",
        title: "Not enough coins",
        description: `You need ${CONVERSION_COST} coins to convert text.`,
      });
      return;
    }

    setIsConverting(true);
    setAudioUrl(null);
    try {
      const response: SpeakOutput = await speak({
        text,
        voice: selectedVoiceName,
        lang: language
      });

      const newCoinBalance = coins - CONVERSION_COST;
      setCoins(newCoinBalance);
      localStorage.setItem('bhasha-voice-coins', newCoinBalance.toString());

      if (response.audio) {
        setAudioUrl(response.audio);
        if (!playAfter) {
            toast({
              title: "Conversion Successful",
              description: `Deducted ${CONVERSION_COST} coins.`,
            });
        }
        if (playAfter) {
          setTimeout(() => {
            if (audioRef.current) {
              audioRef.current.src = response.audio;
              applyPlaybackRate();
              audioRef.current?.play();
              setIsPlaying(true);
            }
          }, 100);
        }
      } else {
        throw new Error("Audio data not received.");
      }
    } catch (error: any) {
      console.error('Error converting text to speech:', error);
      if (error.message && (error.message.includes('429 Too Many Requests') || error.message.includes('ALL_KEYS_EXHAUSTED'))) {
        toast({
          variant: "destructive",
          title: "Quota Exceeded",
          description: "You've hit the daily free limit for speech generation. Please try again tomorrow.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Conversion Failed",
          description: "Could not convert text to speech.",
        });
      }
    } finally {
      setIsConverting(false);
    }
  }, [text, language, selectedVoiceName, toast, speechRate, coins]);

  const handlePlayPause = useCallback(async () => {
    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
      return;
    }

    if (audioUrl && audioRef.current) {
        applyPlaybackRate();
        audioRef.current.play();
        setIsPlaying(true);
    } else {
      await handleConvert(true);
    }
  }, [isPlaying, audioUrl, speechRate, handleConvert]);


  useEffect(() => {
    setIsMounted(true);
    document.documentElement.classList.add('dark');
    const savedCoins = localStorage.getItem('bhasha-voice-coins');
    if (savedCoins !== null) {
      setCoins(parseInt(savedCoins, 10));
    } else {
      localStorage.setItem('bhasha-voice-coins', INITIAL_COINS.toString());
    }
  }, []);

  useEffect(() => {
    setAudioUrl(null);
    if (language === 'hi-IN') {
      setSelectedVoiceName(HINDI_VOICES[0].id);
    } else {
      setSelectedVoiceName(ENGLISH_VOICES[0]);
    }
  }, [language]);

  useEffect(() => {
    setAudioUrl(null);
  }, [text, selectedVoiceName]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = speechRate;
    }
  }, [speechRate]);

  const applyPlaybackRate = () => {
    if (audioRef.current) {
      audioRef.current.playbackRate = speechRate;
    }
  };

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
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.error('Error sharing:', error);
          fallbackShare();
        }
      }
    } else {
      fallbackShare();
    }
  }, [text, toast]);
  
  const voicesForLanguage = language === 'hi-IN' 
    ? HINDI_VOICES 
    : ENGLISH_VOICES.map(name => ({ id: name, name: name }));

  const hasEnoughCoins = coins >= CONVERSION_COST;

  const handleChoosePlan = () => {
    toast({
      title: 'Coming Soon!',
      description: 'Payment integration is not yet implemented.',
    });
  };

  if (!isMounted) return null;

  return (
    <div className="flex flex-col min-h-screen bg-background dark">
      <main className="flex-grow w-full flex flex-col items-center justify-center p-4 sm:p-6 md:p-8">
        <Card className="w-full max-w-3xl shadow-2xl bg-card rounded-xl border-border">
          <CardHeader className="text-center">
            <div className="flex justify-center items-center gap-3 mb-2">
              <Volume2 className="h-10 w-10 text-primary" />
              <CardTitle className="text-5xl font-headline font-bold text-card-foreground">BhashaVoice</CardTitle>
            </div>
            <CardDescription className="text-muted-foreground text-lg">Your Indian accent text-to-speech companion.</CardDescription>
            <div className="flex justify-center items-center gap-4 pt-2">
                <Badge variant="secondary">Free Tier</Badge>
                <div className="flex items-center gap-2">
                    <Coins className="h-5 w-5 text-yellow-400" />
                    <span className="font-bold text-lg text-foreground">{coins}</span>
                </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 px-4 md:px-8">
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
                      <SelectItem key={voice.id} value={voice.id} className="text-popover-foreground">
                        {voice.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="speed" className="text-muted-foreground font-semibold">Speed: <span className="text-primary font-bold">{speechRate.toFixed(1)}x</span></Label>
              <Slider
                id="speed"
                min={0.5}
                max={2}
                step={0.1}
                value={[speechRate]}
                onValueChange={(value) => setSpeechRate(value[0])}
                disabled={isConverting}
                className="[&>span:first-child]:bg-primary"
              />
            </div>

            {audioUrl && (
              <div className="space-y-2">
                <Label className="text-muted-foreground font-semibold">Preview</Label>
                <audio 
                  controls 
                  ref={audioRef}
                  src={audioUrl} 
                  className="w-full rounded-lg"
                  onCanPlay={applyPlaybackRate}
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
            <Button onClick={() => handleConvert()} size="lg" disabled={!text || isConverting || !hasEnoughCoins} className="w-full sm:w-auto flex-grow sm:flex-grow-0 text-white font-bold rounded-lg bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 transition-all disabled:from-pink-500/50 disabled:to-purple-600/50">
              {isConverting ? <Disc3 className="mr-2 h-5 w-5 animate-spin" /> : <Volume2 className="mr-2 h-5 w-5" />}
              {isConverting ? 'Converting...' : `Convert (-${CONVERSION_COST} Coins)`}
            </Button>
            <Button 
              onClick={handlePlayPause} 
              size="lg" 
              disabled={!text || isConverting} 
              className="w-full sm:w-auto flex-grow sm:flex-grow-0 text-white font-bold rounded-lg bg-gradient-to-r from-teal-400 to-blue-500 hover:from-teal-500 hover:to-blue-600 transition-all"
            >
              {isPlaying ? <Pause className="mr-2 h-5 w-5" /> : <Play className="mr-2 h-5 w-5" />}
              {isPlaying ? 'Pause' : 'Play'}
            </Button>
            <Button onClick={handleDownload} variant="outline" size="lg" disabled={!audioUrl || isConverting} className="w-full sm:w-auto flex-grow sm:flex-grow-0 border-accent text-accent hover:bg-accent hover:text-accent-foreground font-bold rounded-lg">
              <Download className="mr-2 h-5 w-5" />
              Download
            </Button>
            <Button onClick={handleShare} variant="outline" size="lg" disabled={!text || isConverting} className="w-full sm:w-auto flex-grow sm:flex-grow-0 border-accent text-accent hover:bg-accent hover:text-accent-foreground font-bold rounded-lg">
              <Share2 className="mr-2 h-5 w-5" />
              Share
            </Button>
          </CardFooter>
        </Card>

        <section className="w-full max-w-6xl mt-12 md:mt-20">
            <div className="text-center mb-10">
                <h2 className="text-4xl md:text-5xl font-bold text-foreground">Unlock More Power</h2>
                <p className="text-lg text-muted-foreground mt-2">Choose a plan that fits your creative needs.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {PLANS.map((plan) => (
                    <Card key={plan.name} className={cn(
                        "flex flex-col rounded-xl overflow-hidden shadow-lg transition-transform hover:scale-105",
                        plan.featured ? "border-primary border-2 shadow-primary/30" : "border-border"
                    )}>
                        <CardHeader className="p-6 bg-card/80">
                            <div className="flex items-center gap-3">
                                <plan.icon className={cn("h-8 w-8", plan.featured ? "text-primary" : "text-accent")} />
                                <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                            </div>
                            {plan.featured && <Badge className="w-fit bg-primary text-primary-foreground">Most Popular</Badge>}
                        </CardHeader>
                        <CardContent className="flex-grow p-6 space-y-4">
                            <div className="text-4xl font-extrabold text-foreground">{plan.price} <span className="text-base font-medium text-muted-foreground">/ {plan.duration}</span></div>
                            <ul className="space-y-2 text-foreground/90">
                                <li className="flex items-center gap-2"><Coins className="h-5 w-5 text-yellow-400" /> <span>{plan.coins}</span></li>
                                <li className="flex items-center gap-2"><Disc3 className="h-5 w-5 text-teal-400" /> <span>Est. {plan.conversions} conversions</span></li>
                            </ul>
                            <p className="text-sm text-muted-foreground">{plan.bestFor}</p>
                        </CardContent>
                        <CardFooter className="p-6 mt-auto">
                            <Button
                                onClick={handleChoosePlan}
                                size="lg"
                                className={cn(
                                "w-full font-bold",
                                plan.featured ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-accent text-accent-foreground hover:bg-accent/90"
                                )}
                            >
                                Choose Plan
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </section>

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

    