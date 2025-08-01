
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Pause, Download, Share2, Disc3, Code, Coins, Gem, Rocket, Briefcase, Crown, AlertTriangle, Zap, Star } from 'lucide-react';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Logo } from '@/components/logo';

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
      name: 'Monthly',
      icon: Gem,
      price: '₹149',
      coins: '12,500 Coins',
      conversions: '~50 conversions',
      features: [],
      featured: false,
      badge: null,
      paymentLink: 'https://razorpay.me/@Payme01/149'
    },
    {
      name: 'Quarterly',
      icon: Rocket,
      price: '₹399',
      coins: '45,000 Coins',
      conversions: '~180 conversions',
      features: ['+5 bonus conversions/month'],
      featured: true,
      badge: 'Most Popular',
      paymentLink: 'https://razorpay.me/@Payme01/399'
    },
    {
      name: '6-Month',
      icon: Briefcase,
      price: '₹749',
      coins: '1,00,000 Coins',
      conversions: '~400 conversions',
      features: ['Priority queue processing'],
      featured: false,
      badge: null,
      paymentLink: 'https://razorpay.me/@Payme01/749'
    },
    {
      name: 'Yearly',
      icon: Crown,
      price: '₹1399',
      coins: '2,25,000 Coins',
      conversions: '~900 conversions',
      features: ['Priority queue', 'Early access to new voices', 'Watermark-free downloads'],
      featured: false,
      badge: 'Best Value',
      paymentLink: 'https://razorpay.me/@Payme01/1399'
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
  const [showNoCoinsAlert, setShowNoCoinsAlert] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  const handleConvert = useCallback(async (playAfter = false) => {
    if (!text) return;

    if (coins < CONVERSION_COST) {
      setShowNoCoinsAlert(true);
      return;
    }

    setIsConverting(true);
    if (!playAfter) {
      setAudioUrl(null);
    }
    
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
              description: `Deducted ${CONVERSION_COST} coins. Ready to play.`,
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
      if (error.message && error.message.includes('ALL_KEYS_EXHAUSTED')) {
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
    if (coins < CONVERSION_COST && !audioUrl) {
      setShowNoCoinsAlert(true);
      return;
    }

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
  }, [isPlaying, audioUrl, speechRate, handleConvert, coins]);


  useEffect(() => {
    setIsMounted(true);
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

  const handleChoosePlan = (paymentLink: string) => {
    window.open(paymentLink, '_blank');
  };

  if (!isMounted) return null;

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
       <header className="w-full p-4 flex justify-between items-center sticky top-0 bg-background/80 backdrop-blur-sm z-10 border-b">
         <div className="flex justify-center items-center gap-2">
            <Logo className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">BhashaVoice</h1>
         </div>
         <div className="flex items-center gap-4">
             <div className="flex items-center gap-2 bg-amber-100/50 dark:bg-amber-900/50 border border-amber-300 dark:border-amber-700 rounded-full px-3 py-1">
                 <Coins className="h-5 w-5 text-amber-500" />
                 <span className="font-bold text-lg text-foreground">{coins.toLocaleString()}</span>
             </div>
             <Button size="sm" onClick={() => document.getElementById('plans')?.scrollIntoView({ behavior: 'smooth' })}>
                <Zap className="mr-2 h-4 w-4" />
                Upgrade
             </Button>
         </div>
       </header>

      <main className="w-full flex flex-col items-center justify-center p-4 sm:p-6 md:p-8">
        <Card className="w-full max-w-3xl shadow-lg bg-card rounded-xl border">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-headline font-bold text-card-foreground">Create Your Audio</CardTitle>
            <CardDescription className="text-muted-foreground">Type, select your preferences, and convert to speech in seconds.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 px-4 md:px-8">
            <Textarea
              placeholder="Type or paste your text here..."
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                setAudioUrl(null);
              }}
              className="min-h-[180px] text-base resize-none focus:ring-primary bg-input/50 dark:bg-background rounded-lg"
              disabled={isConverting}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="language" className="font-semibold">Language</Label>
                <Select value={language} onValueChange={setLanguage} disabled={isConverting}>
                  <SelectTrigger id="language" className="focus:ring-primary bg-input/50 dark:bg-background rounded-lg">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border rounded-lg">
                    <SelectItem value="en-IN">English (India)</SelectItem>
                    <SelectItem value="hi-IN">Hindi (India)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="voice" className="font-semibold">Voice</Label>
                <Select 
                  value={selectedVoiceName} 
                  onValueChange={setSelectedVoiceName}
                  disabled={isConverting}
                >
                  <SelectTrigger id="voice" className="focus:ring-primary bg-input/50 dark:bg-background rounded-lg">
                    <SelectValue placeholder="Select voice" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border rounded-lg">
                    {voicesForLanguage.map((voice) => (
                      <SelectItem key={voice.id} value={voice.id}>
                        {voice.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="speed" className="font-semibold">Speed: <span className="text-primary font-bold">{speechRate.toFixed(1)}x</span></Label>
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

            {audioUrl && !isConverting && (
              <div className="space-y-2 animate-in fade-in duration-500">
                <Label className="font-semibold">Preview</Label>
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
            <Button 
              onClick={handlePlayPause} 
              size="lg" 
              disabled={!text || isConverting} 
              className="w-full sm:w-auto flex-grow bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-all disabled:bg-green-600/50"
              style={{ backgroundColor: 'hsl(var(--cta))' }}
            >
              {isConverting && audioUrl ? <Disc3 className="mr-2 h-5 w-5 animate-spin" /> : (isPlaying ? <Pause className="mr-2 h-5 w-5" /> : <Play className="mr-2 h-5 w-5" />)}
              {isConverting && audioUrl ? 'Loading...' : (isPlaying ? 'Pause' : 'Play')}
            </Button>
            <Button onClick={() => handleConvert(false)} size="lg" disabled={!text || isConverting || !hasEnoughCoins} className="w-full sm:w-auto flex-grow text-white font-bold rounded-lg bg-primary hover:bg-primary/90 transition-all">
              {isConverting && !audioUrl ? <Disc3 className="mr-2 h-5 w-5 animate-spin" /> : <Play className="mr-2 h-5 w-5" />}
              {isConverting && !audioUrl ? 'Converting...' : `Convert (-${CONVERSION_COST} Coins)`}
            </Button>
            <div className="flex gap-2">
              <Button onClick={handleDownload} variant="outline" size="icon" disabled={!audioUrl || isConverting} className="border-primary text-primary hover:bg-primary hover:text-primary-foreground font-bold rounded-lg">
                <Download className="h-5 w-5" />
              </Button>
              <Button onClick={handleShare} variant="outline" size="icon" disabled={!text || isConverting} className="border-primary text-primary hover:bg-primary hover:text-primary-foreground font-bold rounded-lg">
                <Share2 className="h-5 w-5" />
              </Button>
            </div>
          </CardFooter>
        </Card>

        <section id="plans" className="w-full max-w-6xl mt-16 md:mt-24 scroll-mt-20">
            <div className="text-center mb-10">
                <h2 className="text-4xl md:text-5xl font-bold text-foreground">Recharge or Upgrade Plan</h2>
                <p className="text-lg text-muted-foreground mt-2">Choose a plan that fits your creative needs.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {PLANS.map((plan) => (
                    <Card key={plan.name} className={cn(
                        "flex flex-col rounded-xl overflow-hidden shadow-lg transition-transform hover:scale-105",
                        plan.featured ? "border-primary border-2 shadow-primary/20" : "border-border"
                    )}>
                        {plan.badge && <Badge className={cn("absolute -top-3 right-4 text-primary-foreground", plan.featured ? "bg-primary" : "bg-accent")}>{plan.badge}</Badge>}
                        <CardHeader className="p-6 bg-card/50">
                            <div className="flex items-center gap-3">
                                <plan.icon className={cn("h-8 w-8", plan.featured ? "text-primary" : "text-muted-foreground")} />
                                <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-grow p-6 space-y-4">
                            <div className="text-4xl font-extrabold text-foreground">{plan.price}</div>
                            <div className="space-y-1">
                              <p className="font-semibold text-primary">{plan.coins}</p>
                              <p className="text-sm text-muted-foreground">{plan.conversions}</p>
                            </div>
                            <ul className="space-y-2 text-foreground/90 text-sm">
                                {plan.features.map(feature => (
                                    <li key={feature} className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-green-500" style={{ backgroundColor: 'hsl(var(--cta))' }}></div>
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                        <CardFooter className="p-6 mt-auto">
                            <Button
                                onClick={() => handleChoosePlan(plan.paymentLink)}
                                size="lg"
                                className={cn(
                                "w-full font-bold",
                                plan.featured ? "bg-primary text-primary-foreground hover:bg-primary/90" : "text-white hover:bg-green-700"
                                )}
                                style={!plan.featured ? { backgroundColor: 'hsl(var(--cta))' } : {}}
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
          Developed with 💙 by BhashaVoice
        </p>
      </footer>
      <AlertDialog open={showNoCoinsAlert} onOpenChange={setShowNoCoinsAlert}>
        <AlertDialogContent style={{borderColor: 'hsl(var(--destructive))'}}>
          <AlertDialogHeader>
            <AlertDialogTitle className='flex items-center gap-2'>
              <AlertTriangle className="h-6 w-6" style={{color: 'hsl(var(--warning))'}}/>
              Not Enough Coins
            </AlertDialogTitle>
            <AlertDialogDescription>
              Aapke coins khatam ho gaye hain. Recharge kijiye ya Plan upgrade kijiye.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => document.getElementById('plans')?.scrollIntoView({ behavior: 'smooth' })}>
              Upgrade Plan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

    