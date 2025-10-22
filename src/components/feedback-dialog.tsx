'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Mail, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export function FeedbackDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost">
          <Mail className="mr-2 h-4 w-4" />
          Обратная связь
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Обратная связь</DialogTitle>
          <DialogDescription>
            Мы ценим ваше мнение! Вы можете связаться с нами по электронной
            почте или заполнив форму.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground">
            <strong>Email:</strong>{' '}
            <a
              href="mailto:support@tmapinc.com"
              className="text-primary hover:underline"
            >
              support@tmapinc.com
            </a>
          </p>
          <p className="text-sm text-muted-foreground">
            Вы также можете оставить свой отзыв, заполнив Google Форму:
          </p>
          <Button asChild className="w-full">
            <Link href="/#google-form-link-placeholder" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                Перейти к форме
            </Link>
          </Button>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              Закрыть
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
