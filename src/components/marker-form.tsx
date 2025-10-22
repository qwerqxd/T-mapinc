
'use client';

import { useEffect, useState, useRef, useTransition } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { StarRating } from '@/components/star-rating';
import { useAuth } from '@/contexts/auth-context';
import type { Review } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Loader2 } from 'lucide-react';
import { Input } from './ui/input';


interface MarkerFormProps {
  coords?: { lat: number; lng: number } | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onMarkerCreate?: (review: Omit<Review, 'id'|'createdAt'|'authorId'|'markerId' | 'authorName' | 'authorAvatarUrl'> & {name?:string}) => void;
  onFormSubmit?: (reviewData: Omit<Review, 'id' | 'createdAt' | 'authorId' | 'markerId' | 'authorName' | 'authorAvatarUrl'>) => void;
  isEditing?: boolean;
  initialData?: Review;
  onCancelEdit?: () => void;
}

export default function MarkerForm({
  coords,
  isOpen,
  onOpenChange,
  onMarkerCreate,
  onFormSubmit,
  isEditing = false,
  initialData,
  onCancelEdit
}: MarkerFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  
  const [text, setText] = useState('');
  const [rating, setRating] = useState(0);
  const [name, setName] = useState('');

  useEffect(() => {
    if (isEditing && initialData) {
      setText(initialData.text);
      setRating(initialData.rating);
    } else if (!isEditing) { // Reset when dialog opens for creation
      setText('');
      setRating(0);
      setName('');
    }
  }, [isEditing, initialData, isOpen]);


  const handleSubmit = () => {
     startTransition(() => {
        if (!user) {
          toast({ title: 'Ошибка', description: 'Вы должны войти в систему.', variant: 'destructive'});
          return;
        }
        if ((onMarkerCreate && name.trim() === '') || text.trim() === '' || rating === 0) {
          toast({ title: 'Ошибка', description: 'Пожалуйста, укажите название, поставьте оценку и напишите текст отзыва.', variant: 'destructive' });
          return;
        }

        const reviewData = { name, text, rating };

        if(onMarkerCreate && coords) {
            onMarkerCreate(reviewData);
            onOpenChange(false);
        }
        if(onFormSubmit){
            onFormSubmit(reviewData)
        }
        
        // Reset form only if it's not an inline edit form
        if (!isEditing) {
          setText('');
          setRating(0);
          setName('');
        }
    });
  };

  const formContent = (
    <div className='py-4'>
      <div className="space-y-3">
        {!isEditing && onMarkerCreate && (
             <div className="space-y-2">
                <label htmlFor="marker-name" className='text-md font-semibold'>Название места</label>
                <Input
                    id="marker-name"
                    placeholder="Например, «Лучшая кофейня»"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={isPending}
                />
             </div>
        )}
        <h3 className="text-md font-semibold">{isEditing ? 'Редактировать ваш отзыв' : 'Ваш отзыв'}</h3>
        <StarRating rating={rating} onRatingChange={setRating} interactive />
        <Textarea
          placeholder="Поделитесь своим опытом..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={isPending}
        />
      </div>
      <DialogFooter className="pt-4">
        {isEditing && onCancelEdit && (
          <Button variant="ghost" onClick={onCancelEdit} disabled={isPending}>Отмена</Button>
        )}
        <Button onClick={handleSubmit} className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90" disabled={isPending}>
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
            {isPending ? 'Отправка...' : isEditing ? 'Сохранить изменения' : onMarkerCreate ? 'Создать метку и отзыв' : 'Отправить отзыв'}
        </Button>
      </DialogFooter>
    </div>
  );

  // If it's not for editing, it's a dialog for creating a new marker
  if (onMarkerCreate) {
     return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Новое место</DialogTitle>
                    <DialogDescription>Добавьте новое место на карту и оставьте первый отзыв.</DialogDescription>
                </DialogHeader>
                {formContent}
            </DialogContent>
        </Dialog>
     )
  }

  // Otherwise it's an inline form for adding/editing a review in another dialog
  return formContent;
}
