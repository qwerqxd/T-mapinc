
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

// This will now hold the File object and a local preview URL
type LocalReviewMedia = {
  file: File;
  previewUrl: string;
  type: 'image' | 'video';
};


interface MarkerFormProps {
  coords?: { lat: number; lng: number } | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onMarkerCreate?: (review: Omit<Review, 'id'|'createdAt'|'authorId'|'markerId' | 'authorName' | 'authorAvatarUrl'> & {name?:string; media?: File[]}) => void;
  onFormSubmit?: (reviewData: Omit<Review, 'id' | 'createdAt' | 'authorId' | 'markerId' | 'authorName' | 'authorAvatarUrl'> & { media?: File[] }) => void;
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
  const [media, setMedia] = useState<LocalReviewMedia[]>([]);
  const [existingMedia, setExistingMedia] = useState<ReviewMedia[]>([]);
  const [name, setName] = useState('');

  useEffect(() => {
    if (isEditing && initialData) {
      setText(initialData.text);
      setRating(initialData.rating);
      // We don't allow editing existing media for simplicity, just adding new ones.
      // Or we could show them and allow removal.
      setExistingMedia(initialData.media || []);
      setMedia([]); // Clear new media when data changes
    } else if (!isEditing) { // Reset when dialog opens for creation
      setText('');
      setRating(0);
      setMedia([]);
      setExistingMedia([]);
      setName('');
    }
  }, [isEditing, initialData, isOpen]);


  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    if (media.length + existingMedia.length + files.length > 10) {
      toast({
        title: 'Ошибка',
        description: 'Вы можете загрузить не более 10 медиафайлов.',
        variant: 'destructive',
      });
      return;
    }

    Array.from(files).forEach(file => {
      const fileType = file.type.startsWith('image') ? 'image' : 'video';
      const previewUrl = URL.createObjectURL(file);
      
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
            URL.revokeObjectURL(previewUrl);
          } else {
            setMedia(prev => [...prev, { file, previewUrl, type: 'video' }]);
          }
        };
        video.src = previewUrl;
      } else {
        setMedia(prev => [...prev, { file, previewUrl, type: 'image' }]);
      }
    });
    // Reset file input to allow selecting the same file again
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  const removeNewMedia = (url: string) => {
    setMedia(prev => prev.filter(item => {
        if(item.previewUrl === url) {
            URL.revokeObjectURL(url);
            return false;
        }
        return true;
    }));
  };
  
  const removeExistingMedia = (url: string) => {
      // This is tricky without a proper backend process.
      // For now, we will assume we can't remove existing media during an edit.
      // To implement this, onFormSubmit would need to know which files to remove.
      toast({ title: 'Info', description: 'Existing media cannot be removed during edit.'})
  }


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

        const reviewData = { 
            name, 
            text, 
            rating, 
            // Pass the actual files, not the preview URLs
            media: media.map(m => m.file), 
        };

        if(onMarkerCreate && coords) {
            onMarkerCreate(reviewData);
            onOpenChange(false);
        }
        if(onFormSubmit){
            // In edit mode, we pass the new files. The hook will handle merging.
            onFormSubmit(reviewData)
        }
        
        // Reset form only if it's not an inline edit form or it's a create form
        if (!isEditing || onMarkerCreate) {
          setText('');
          setRating(0);
          setMedia([]);
          setName('');
          setExistingMedia([]);
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
          {(media.length > 0 || existingMedia.length > 0) && (
            <ScrollArea className="w-full h-32">
              <div className="flex space-x-2 p-1">
                {existingMedia.map((mediaItem, index) => (
                    <div key={`existing-${index}`} className="relative flex-shrink-0 w-24 h-24 rounded-md overflow-hidden">
                        {mediaItem.type === 'image' ? (
                        <img src={mediaItem.url} alt="existing preview" className="w-full h-full object-cover" />
                        ) : (
                        <video src={mediaItem.url} className="w-full h-full object-cover" />
                        )}
                         <div className="absolute bottom-1 left-1 bg-black/50 text-white p-1 rounded">
                            {mediaItem.type === 'image' ? <FileImage className="h-4 w-4" /> : <Video className="h-4 w-4" />}
                        </div>
                    </div>
                ))}
                {media.map((mediaItem, index) => (
                  <div key={`new-${index}`} className="relative flex-shrink-0 w-24 h-24 rounded-md overflow-hidden">
                    {mediaItem.type === 'image' ? (
                      <img src={mediaItem.previewUrl} alt="preview" className="w-full h-full object-cover" />
                    ) : (
                      <video src={mediaItem.previewUrl} className="w-full h-full object-cover" />
                    )}
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 h-5 w-5"
                      onClick={() => removeNewMedia(mediaItem.previewUrl)}
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
