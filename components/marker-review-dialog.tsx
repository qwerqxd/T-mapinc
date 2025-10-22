'use client';

import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Star, X, Upload, MapPin } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface MarkerReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  markerPosition?: { lat: number; lng: number };
  onReviewSubmit: (review: {
    rating: number;
    comment: string;
    media: { type: 'image' | 'video'; url: string }[];
    address?: string;
  }) => void;
}

type MediaItem = {
  type: 'image' | 'video';
  url: string;
};

export function MarkerReviewDialog({
  open,
  onOpenChange,
  markerPosition,
  onReviewSubmit,
}: MarkerReviewDialogProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [newMedia, setNewMedia] = useState<MediaItem[]>([]);
  const [address, setAddress] = useState('');
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (open && markerPosition) {
      fetchAddress(markerPosition.lat, markerPosition.lng);
    }
  }, [open, markerPosition]);

  const fetchAddress = async (lat: number, lng: number) => {
    setIsLoadingAddress(true);
    try {
      const response = await fetch(
        `https://geocode-maps.yandex.ru/1.x/?apikey=${process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY}&geocode=${lng},${lat}&format=json`
      );
      const data = await response.json();
      const foundAddress =
        data.response.GeoObjectCollection.featureMember[0]?.GeoObject?.name ||
        'Адрес не найден';
      setAddress(foundAddress);
    } catch (error) {
      console.error('Error fetching address:', error);
      setAddress('Не удалось определить адрес');
    } finally {
      setIsLoadingAddress(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      if (file.type.startsWith('image/')) {
        setNewMedia((prev: MediaItem[]) => [
          ...prev,
          { type: 'image', url: URL.createObjectURL(file) },
        ]);
      } else if (file.type.startsWith('video/')) {
        const video = document.createElement('video');
        video.onloadedmetadata = () => {
          if (video.duration > 30) {
            toast({
              title: 'Ошибка',
              description: 'Видео должно быть не длиннее 30 секунд',
              variant: 'destructive',
            });
          } else {
            setNewMedia((prev: MediaItem[]) => [
              ...prev,
              { type: 'video', url: URL.createObjectURL(file) },
            ]);
          }
        };
        video.src = URL.createObjectURL(file);
      }
    });

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeMedia = (index: number) => {
    setNewMedia((prev: MediaItem[]) => {
      const newMedia = [...prev];
      URL.revokeObjectURL(newMedia[index].url);
      newMedia.splice(index, 1);
      return newMedia;
    });
  };

  const handleSubmit = () => {
    if (rating === 0) {
      toast({
        title: 'Ошибка',
        description: 'Пожалуйста, поставьте оценку',
        variant: 'destructive',
      });
      return;
    }

    if (comment.trim() === '') {
      toast({
        title: 'Ошибка',
        description: 'Пожалуйста, добавьте комментарий',
        variant: 'destructive',
      });
      return;
    }

    onReviewSubmit({
      rating,
      comment,
      media: newMedia,
      address: address || undefined,
    });

    // Reset form
    setRating(0);
    setComment('');
    setNewMedia([]);
    setAddress('');
    onOpenChange(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Clean up object URLs when dialog closes
      newMedia.forEach((media) => URL.revokeObjectURL(media.url));
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Добавить отзыв к метке</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Rating */}
          <div>
            <Label htmlFor="rating">Оценка</Label>
            <div className="flex gap-1 mt-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="p-1 focus:outline-none"
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= rating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Address */}
          {markerPosition && (
            <div>
              <Label>Адрес метки</Label>
              <div className="flex items-center gap-2 mt-2 p-3 bg-gray-50 rounded-lg">
                <MapPin className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-700">
                  {isLoadingAddress ? 'Загрузка адреса...' : address}
                </span>
              </div>
            </div>
          )}

          {/* Comment */}
          <div>
            <Label htmlFor="comment">Комментарий</Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Расскажите о вашем опыте..."
              className="mt-2 min-h-[100px]"
            />
          </div>

          {/* Media Upload */}
          <div>
            <Label>Фото и видео</Label>
            <div className="mt-2">
              <Input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full"
              >
                <Upload className="w-4 h-4 mr-2" />
                Загрузить фото или видео
              </Button>
              <p className="text-xs text-gray-500 mt-2">
                Можно загружать изображения и видео до 30 секунд
              </p>
            </div>

            {/* Media Preview */}
            {newMedia.length > 0 && (
              <div className="grid grid-cols-3 gap-4 mt-4">
                {newMedia.map((media, index) => (
                  <div key={index} className="relative group">
                    {media.type === 'image' ? (
                      <img
                        src={media.url}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                    ) : (
                      <video
                        src={media.url}
                        className="w-full h-24 object-cover rounded-lg"
                        controls
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => removeMedia(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              className="flex-1"
            >
              Отмена
            </Button>
            <Button onClick={handleSubmit} className="flex-1">
              Опубликовать отзыв
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}