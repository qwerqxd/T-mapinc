
'use client';

import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { StarRating } from '@/components/star-rating';
import { useAuth } from '@/contexts/auth-context';
import type { Review } from '@/lib/types';
import { Pencil, Trash2 } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { FileImage, Video } from 'lucide-react';


interface ReviewCardProps {
  review: Review;
  className?: string;
  onEdit?: (review: Review) => void;
  onDelete?: (review: Review) => void;
}

export default function ReviewCard({ review, className, onEdit, onDelete }: ReviewCardProps) {
  const { user: currentUser } = useAuth();
  
  const getReviewDate = (date: any) => {
    if (!date) return '';
    let dateObj: Date;
    if (typeof date === 'string') {
      dateObj = new Date(date);
    } else if (date.toDate) { // Firebase Timestamp
      dateObj = date.toDate();
    } else {
      dateObj = date;
    }

    return formatDistanceToNow(dateObj, {
        addSuffix: true,
        locale: ru,
    });
  }

  const canModify = currentUser?.uid === review.authorId || currentUser?.role === 'admin';

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(review);
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(review);
  }

  return (
    <Card className={`overflow-hidden transition-all hover:shadow-md ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <Avatar className="h-10 w-10 border">
            <AvatarImage src={review.authorAvatarUrl ?? undefined} alt={review.authorName ?? ''} />
            <AvatarFallback>{review.authorName?.charAt(0) ?? 'U'}</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">{review.authorName}</p>
                <p className="text-xs text-muted-foreground">
                  {getReviewDate(review.createdAt)}
                </p>
              </div>
              <StarRating rating={review.rating} />
            </div>
            <p className="text-sm text-foreground/90">{review.text}</p>
            
            {review.media && review.media.length > 0 && (
              <div className="pt-2">
                <Carousel className="w-full max-w-xs mx-auto">
                  <CarouselContent>
                    {review.media.map((media, index) => (
                      <CarouselItem key={index}>
                        <div className="p-1">
                           <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted">
                            {media.type === 'image' ? (
                                <img src={media.url} alt={`Review media ${index + 1}`} className="w-full h-full object-contain" />
                            ) : (
                                <video src={media.url} controls className="w-full h-full object-contain" />
                            )}
                             <div className="absolute bottom-2 left-2 bg-black/50 text-white p-1 rounded-full">
                                {media.type === 'image' ? <FileImage className="h-4 w-4" /> : <Video className="h-4 w-4" />}
                              </div>
                           </div>
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  {review.media.length > 1 && (
                    <>
                      <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2" />
                      <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2" />
                    </>
                  )}
                </Carousel>
              </div>
            )}

            {canModify && onEdit && onDelete && (
              <div className="flex justify-end gap-2 pt-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleEdit}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Редактировать отзыв</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={handleDelete}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Удалить отзыв</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
