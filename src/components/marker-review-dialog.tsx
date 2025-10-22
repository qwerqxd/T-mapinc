
'use client';

import { useEffect, useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { StarRating } from '@/components/star-rating';
import { useAuth } from '@/contexts/auth-context';
import type { MarkerData, Review, ReviewMedia } from '@/lib/types';
import ReviewCard from './review-card';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Paperclip, X, FileImage, Video } from 'lucide-react';


interface MarkerReviewDialogProps {
  marker?: MarkerData | null;
  reviews: Review[];
  coords?: { lat: number; lng: number } | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onReviewSubmit: (review: Omit<Review, 'id' | 'createdAt' | 'authorId' | 'authorName' | 'authorAvatarUrl'>) => void;
  onMarkerCreate: (review: Omit<Review, 'id'|'createdAt'|'authorId'|'markerId' | 'authorName' | 'authorAvatarUrl'>) => void;
  onReviewUpdate: (reviewToUpdate: Review, updatedData: { text: string; rating: number; media: ReviewMedia[] }) => void;
  onReviewDelete: (review: Review) => void;
  newReviewText: string;
  setNewReviewText: (text: string) => void;
  newRating: number;
  setNewRating: (rating: number) => void;
  newMedia: ReviewMedia[];
  setNewMedia: (media: ReviewMedia[]) => void;
}

export default function MarkerReviewDialog({
  marker,
  reviews,
  coords,
  isOpen,
  onOpenChange,
  onReviewSubmit,
  onMarkerCreate,
  onReviewUpdate,
  onReviewDelete,
  newReviewText,
  setNewReviewText,
  newRating,
  setNewRating,
  newMedia,
  setNewMedia,
}: MarkerReviewDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [deletingReview, setDeletingReview] = useState<Review | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setNewReviewText('');
      setNewRating(0);
      setNewMedia([]);
      setEditingReview(null);
      setDeletingReview(null);
    }
  }, [isOpen, marker, coords, setNewReviewText, setNewRating, setNewMedia]);

  useEffect(() => {
    if(editingReview) {
      setNewReviewText(editingReview.text);
      setNewRating(editingReview.rating);
      setNewMedia(editingReview.media || []);
    } else {
      setNewReviewText('');
      setNewRating(0);
      setNewMedia([]);
    }
  }, [editingReview, setNewReviewText, setNewRating, setNewMedia]);


  const isCreatingNewMarker = !marker && !!coords;

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    if (newMedia.length + files.length > 10) {
      toast({
        title: 'Ошибка',
        description: 'Вы можете загрузить не более 10 медиафайлов.',
        variant: 'destructive',
      });
      return;
    }

    Array.from(files).forEach(file => {
      const fileType = file.type.startsWith('image') ? 'image' : 'video';
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
          } else {
            setNewMedia(prev => [...prev, { type: 'video', url: URL.createObjectURL(file) }]);
          }
        };
        video.src = URL.createObjectURL(file);
      } else {
        setNewMedia(prev => [...prev, { type: 'image', url: URL.createObjectURL(file) }]);
      }
    });
  };

  const removeMedia = (url: string) => {
    setNewMedia(prev => prev.filter(item => item.url !== url));
  };


  const handleSubmit = () => {
    if (!user) {
      toast({ title: 'Ошибка', description: 'Вы должны войти в систему, чтобы оставить отзыв.', variant: 'destructive'});
      return;
    }
    if (newReviewText.trim() === '' || newRating === 0) {
      toast({ title: 'Ошибка', description: 'Пожалуйста, поставьте оценку и напишите текст отзыва.', variant: 'destructive' });
      return;
    }

    const reviewData = {
      text: newReviewText,
      rating: newRating,
      media: newMedia
    };

    if (editingReview) {
      onReviewUpdate(editingReview, reviewData);
      setEditingReview(null);
    } else if (isCreatingNewMarker && coords) {
        onMarkerCreate(reviewData);
    } else if (marker) {
        onReviewSubmit({
            markerId: marker.id,
            ...reviewData
        });
    }
  };

  const handleConfirmDelete = () => {
    if (deletingReview) {
      onReviewDelete(deletingReview);
      setDeletingReview(null);
    }
  };

  const getMarkerTitle = () => {
    if (isCreatingNewMarker) return "Новая метка";
    if (marker) {
        const title = [marker.city, marker.country].filter(Boolean).join(', ');
        return title || 'Отзывы о месте';
    }
    return 'Отзывы о месте';
}

  const getMarkerDescription = () => {
     if (isCreatingNewMarker) return "Оставьте первый отзыв об этом месте.";
     if (reviews.length > 0) {
         return "Посмотрите, что говорят другие, и добавьте свой отзыв.";
     }
     return "Об этом месте еще нет отзывов. Будьте первым!";
  }


  return (
    <>
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] md:max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{getMarkerTitle()}</DialogTitle>
          <DialogDescription>
            {getMarkerDescription()}
          </DialogDescription>
        </DialogHeader>
        <Separator />
        <ScrollArea className="flex-1 pr-4 -mr-4">
          <div className="space-y-4 py-4">
            {reviews.length > 0 ? (
              reviews.map((review) => <ReviewCard key={review.id} review={review} marker={marker} onEdit={() => setEditingReview(review)} onDelete={() => setDeletingReview(review)} />)
            ) : (
              <div className="text-sm text-muted-foreground text-center py-8">
                <p>Нет отзывов. Будьте первым, кто оставит один!</p>
              </div>
            )}
          </div>
        </ScrollArea>
        {user && (
          <>
            <Separator />
            <div className="space-y-3 pt-4">
              <h3 className="text-md font-semibold">{editingReview ? 'Редактировать ваш отзыв' : 'Добавьте свой отзыв'}</h3>
              <StarRating rating={newRating} onRatingChange={setNewRating} interactive />
              <Textarea
                placeholder="Поделитесь своим опытом..."
                value={newReviewText}
                onChange={(e) => setNewReviewText(e.target.value)}
              />

              <div className="space-y-2">
                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
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
                />
                {newMedia.length > 0 && (
                  <ScrollArea className="w-full h-32">
                    <div className="flex space-x-2 p-1">
                      {newMedia.map((media, index) => (
                        <div key={index} className="relative flex-shrink-0 w-24 h-24 rounded-md overflow-hidden">
                          {media.type === 'image' ? (
                            <img src={media.url} alt="preview" className="w-full h-full object-cover" />
                          ) : (
                            <video src={media.url} className="w-full h-full object-cover" />
                          )}
                          <Button
                            variant="destructive"
                            size="icon"
                            className="absolute top-1 right-1 h-5 w-5"
                            onClick={() => removeMedia(media.url)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                          <div className="absolute bottom-1 left-1 bg-black/50 text-white p-1 rounded">
                            {media.type === 'image' ? <FileImage className="h-4 w-4" /> : <Video className="h-4 w-4" />}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>

               <DialogFooter>
                {editingReview && (
                  <Button variant="ghost" onClick={() => setEditingReview(null)}>Отмена</Button>
                )}
                <Button onClick={handleSubmit} className="w-full sm:w-auto bg-accent text-accent-foreground hover:bg-accent/90">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    {editingReview ? 'Сохранить изменения' : isCreatingNewMarker ? 'Создать метку и отзыв' : 'Отправить отзыв'}
                </Button>
               </DialogFooter>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>

    <AlertDialog open={!!deletingReview} onOpenChange={(open) => !open && setDeletingReview(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
            <AlertDialogDescription>
                Это действие необратимо. Ваш отзыв будет удален навсегда.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive hover:bg-destructive/90">Удалить</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
  </>
  );
}
