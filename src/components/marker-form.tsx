
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { StarRating } from '@/components/star-rating';
import { useAuth } from '@/contexts/auth-context';
import type { Review, ReviewMedia } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Paperclip, X, FileImage, Video, Loader2 } from 'lucide-react';
import { Input } from './ui/input';


interface MarkerFormProps {
  coords?: { lat: number; lng: number } | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onMarkerCreate?: (data: { name: string; text: string; rating: number; media: ReviewMedia[] }) => void;
  onFormSubmit?: (reviewData: { text: string; rating: number; media: ReviewMedia[] }) => void;
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  
  const [text, setText] = useState('');
  const [rating, setRating] = useState(0);
  const [media, setMedia] = useState<ReviewMedia[]>([]);
  const [name, setName] = useState('');

  useEffect(() => {
    if (isEditing && initialData) {
      setText(initialData.text);
      setRating(initialData.rating);
      setMedia(initialData.media || []);
    } else if (!isEditing) { // Reset when dialog opens for creation
      setText('');
      setRating(0);
      setMedia([]);
      setName('');
    }
  }, [isEditing, initialData, isOpen]);


  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    if (media.length + files.length > 10) {
      toast({
        title: 'Ошибка',
        description: 'Вы можете загрузить не более 10 медиафайлов.',
        variant: 'destructive',
      });
      return;
    }

    Array.from(files).forEach(file => {
      const fileType = file.type.startsWith('image') ? 'image' : 'video';
      const objectURL = URL.createObjectURL(file);
      
      const newMediaItem: ReviewMedia = {
        type: fileType,
        url: objectURL,
        file: file
      };

      if (fileType === 'video') {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.onloadedmetadata = () => {
          window.URL.revokeObjectURL(video.src);
          if (video.duration > 30) {
            toast({
              title: 'Ошибка',
              description: `Видео "${file.name}" длиннее 30 секунд.`,
              variant: 'destructive',
            });
            URL.revokeObjectURL(objectURL);
          } else {
            setMedia((prev) => [...prev, newMediaItem]);
          }
        };
        video.src = objectURL;
      } else {
        setMedia((prev) => [...prev, newMediaItem]);
      }
    });
  };

  const removeMedia = (url: string) => {
    setMedia(prev => {
        const itemToRemove = prev.find(item => item.url === url);
        if (itemToRemove && itemToRemove.url.startsWith('blob:')) {
            URL.revokeObjectURL(itemToRemove.url);
        }
        return prev.filter(item => item.url !== url);
    });
  };


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

        const reviewData = { text, rating, media };
        
        if(onMarkerCreate && coords) {
            onMarkerCreate({ name, ...reviewData });
            onOpenChange(false);
        }
        if(onFormSubmit){
            onFormSubmit(reviewData)
        }
        
        // Reset form only if it's not an inline edit form
        if (!isEditing) {
          setText('');
          setRating(0);
          setMedia([]);
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

        <div className="space-y-2">
          <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={isPending}>
            <Paperclip className="mr-2 h-4 w-4" />
            Прикрепить медиа
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            multiple
            accept="image/*,video/*"
            onChange={handleFileChange}
            className="hidden"
            disabled={isPending}
          />
          {media.length > 0 && (
            <ScrollArea className="w-full h-32">
              <div className="flex space-x-2 p-1">
                {media.map((mediaItem, index) => (
                  <div key={index} className="relative flex-shrink-0 w-24 h-24 rounded-md overflow-hidden">
                    {mediaItem.type === 'image' ? (
                      <img src={mediaItem.url} alt="preview" className="w-full h-full object-cover" />
                    ) : (
                      <video src={mediaItem.url} className="w-full h-full object-cover" />
                    )}
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 h-5 w-5"
                      onClick={() => removeMedia(mediaItem.url)}
                      disabled={isPending}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                    <div className="absolute bottom-1 left-1 bg-black/50 text-white p-1 rounded">
                      {mediaItem.type === 'image' ? <FileImage className="h-4 w-4" /> : <Video className="h-4 w-4" />}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
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
