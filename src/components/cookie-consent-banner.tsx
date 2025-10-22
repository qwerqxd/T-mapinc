'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Cookie } from 'lucide-react';
import Link from 'next/link';

export default function CookieConsentBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie_consent');
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie_consent', 'true');
    setIsVisible(false);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-t p-4 shadow-lg animate-in slide-in-from-bottom-5">
      <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <Cookie className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
          <p className="text-sm text-foreground/80">
            Мы используем файлы cookie, чтобы обеспечить вам лучший опыт. Нажимая «Принять», вы соглашаетесь с нашей{' '}
            <Link href="/privacy-policy" className="underline text-primary hover:text-primary/80">
              Политикой в отношении файлов cookie
            </Link>
            .
          </p>
        </div>
        <Button onClick={handleAccept} size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 flex-shrink-0">
          Принять
        </Button>
      </div>
    </div>
  );
}
