
'use client';

import { useState, useEffect } from 'react';
import type { MarkerData, Review, ReviewMedia } from '@/lib/types';
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

interface MarkerDetailsProps {
  marker: MarkerData | null | undefined;
  reviews: Review[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onAddReview: (markerId: string, reviewData: Omit<Review, 'id' | 'createdAt' | 'authorId' | 'markerId' | 'authorName' | 'authorAvatarUrl'> & { media?: File[] }) => void;
  onUpdateReview: (review: Review, updatedData: { text: string; rating: number; media?: File[] }) => void;
  onDeleteReview: (review: Review) => void;
  onDeleteMarker: (markerId: string) => void;
  editingReview: Review | null;
  onCancelEdit: () => void;
}

export default function MarkerDetails({
  marker,
  reviews,
  isOpen,
  onOpenChange,
  onAddReview,
  onUpdateReview,
  onDeleteReview,
  onDeleteMarker,
  editingReview,
  onCancelEdit,
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

  const getMarkerTitle = () => {
    if (!marker && !editingReview) return '';
    const currentMarker = marker || (reviews.find(r => r.id === editingReview?.id)?.markerId ? { name: reviews.find(r => r.id === editingReview?.id)?.text } : null);
    if (!currentMarker) return "Редактирование отзыва";
    return currentMarker.name || "Отзывы о месте";
  }

  const getMarkerDescription = () => {
     if (editingReview) return "Редактируйте свой отзыв ниже.";
     if (reviews.length > 0) {
         return "Посмотрите, что говорят другие, и добавьте свой отзыв.";
     }
     return "Об этом месте еще нет отзывов. Будьте первым!";
  }
  
  const isFormForEditing = !!editingReview;

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
            {reviews.length > 0 ? (
              reviews.map((review) => (
                <ReviewCard 
                  key={review.id} 
                  review={review} 
                  onEdit={() => onOpenChange(false)} // Should be handled by parent now
                  onDelete={onDeleteReview} 
                />
              ))
            ) : (
              !isFormForEditing && (
                <div className="text-sm text-muted-foreground text-center py-8">
                  <p>Нет отзывов. Будьте первым, кто оставит один!</p>
                </div>
              )
            )}
          </div>
        </ScrollArea>
        {user && (
          <>
            <Separator />
            <MarkerForm
              isEditing={isFormForEditing}
              initialData={isFormForEditing ? editingReview : undefined}
              onFormSubmit={isFormForEditing ? handleEditSubmit : handleAddSubmit}
              onCancelEdit={onCancelEdit}
              isOpen={true} // It's part of a dialog, so it's always "open" in its context
              onOpenChange={()=>{}} // Managed by parent
            />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
