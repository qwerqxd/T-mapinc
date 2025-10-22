
'use client';

import type { MarkerData, Review } from '@/lib/types';
import { useAuth } from '@/contexts/auth-context';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import ReviewCard from './review-card';
import MarkerForm from './marker-form';
import { useMemo } from 'react';

interface MarkerDetailsProps {
  marker: MarkerData | null | undefined;
  reviews: Review[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onAddReview: (markerId: string, reviewData: Omit<Review, 'id' | 'createdAt' | 'authorId' | 'markerId' | 'authorName' | 'authorAvatarUrl'> & { media?: File[] }) => void;
  onUpdateReview: (review: Review, updatedData: { text: string; rating: number; media?: File[] }) => void;
  onDeleteReview: (review: Review) => void;
  editingReview: Review | null;
  onCancelEdit: () => void;
  onEditReview: (review: Review) => void;
}

export default function MarkerDetails({
  marker,
  reviews,
  isOpen,
  onOpenChange,
  onAddReview,
  onUpdateReview,
  onDeleteReview,
  editingReview,
  onCancelEdit,
  onEditReview,
}: MarkerDetailsProps) {
  const { user } = useAuth();
  
  const handleAddSubmit = (reviewData: Omit<Review, 'id' | 'createdAt' | 'authorId' | 'markerId' | 'authorName' | 'authorAvatarUrl'> & { media?: File[] }) => {
    if (marker) {
      onAddReview(marker.id, reviewData);
    }
  };

  const handleEditSubmit = (reviewData: Omit<Review, 'id'|'createdAt'|'authorId'|'markerId' | 'authorName' | 'authorAvatarUrl'> & { media?: File[] }) => {
    if (editingReview) {
      onUpdateReview(editingReview, reviewData);
    }
  };

  const isFormForEditing = !!editingReview;

  const currentMarker = useMemo(() => {
    return isFormForEditing ? marker : marker;
  }, [isFormForEditing, marker]);


  const getMarkerTitle = () => {
    if (!currentMarker) return '';
    if (isFormForEditing) return `Редактирование отзыва для "${currentMarker.name}"`;
    return currentMarker.name || "Отзывы о месте";
  }

  const getMarkerDescription = () => {
     if (isFormForEditing) return "Отредактируйте детали вашего отзыва ниже.";
     if (reviews.length > 0) {
         return "Посмотрите, что говорят другие, и добавьте свой отзыв.";
     }
     return "Об этом месте еще нет отзывов. Будьте первым!";
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] md:max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{getMarkerTitle()}</DialogTitle>
          <DialogDescription>
            {getMarkerDescription()}
          </DialogDescription>
        </DialogHeader>
        <Separator />
        <ScrollArea className="flex-1 pr-4 -mr-4">
          <div className="space-y-4 py-4">
            {!isFormForEditing && reviews.length > 0 ? (
              reviews.map((review) => (
                <ReviewCard 
                  key={review.id} 
                  review={review} 
                  onEdit={onEditReview}
                  onDelete={onDeleteReview} 
                />
              ))
            ) : null}
            
            {!isFormForEditing && reviews.length === 0 && (
                <div className="text-sm text-muted-foreground text-center py-8">
                  <p>Нет отзывов. Будьте первым, кто оставит один!</p>
                </div>
            )}

             {isFormForEditing && editingReview && (
                <ReviewCard review={editingReview} />
             )}
          </div>
        </ScrollArea>
        {user && (
          <>
            <Separator />
            <MarkerForm
              isEditing={isFormForEditing}
              initialData={editingReview ?? undefined}
              onFormSubmit={isFormForEditing ? handleEditSubmit : handleAddSubmit}
              onCancelEdit={onCancelEdit}
              isOpen={true}
              onOpenChange={()=>{}}
            />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
