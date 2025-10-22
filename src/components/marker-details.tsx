
'use client';

import { useState } from 'react';
import type { MarkerData, Review, ReviewMedia } from '@/lib/types';
import { useAuth } from '@/contexts/auth-context';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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

import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import ReviewCard from './review-card';
import MarkerForm from './marker-form';

interface MarkerDetailsProps {
  marker: MarkerData | null | undefined;
  reviews: Review[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onAddReview: (markerId: string, reviewData: { text: string; rating: number; media: ReviewMedia[] }) => void;
  onUpdateReview: (review: Review, updatedData: { text: string; rating: number; media: ReviewMedia[] }) => void;
  onDeleteReview: (review: Review) => void;
  onDeleteMarker: (markerId: string) => void;
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
}: MarkerDetailsProps) {
  const { user } = useAuth();
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [deletingReview, setDeletingReview] = useState<Review | null>(null);


  const handleAddSubmit = (reviewData: { text: string; rating: number; media: ReviewMedia[] }) => {
    if (marker) {
      onAddReview(marker.id, reviewData);
    }
  };

  const handleEditSubmit = (reviewData: { text: string; rating: number; media: ReviewMedia[] }) => {
    if (editingReview) {
      onUpdateReview(editingReview, { ...reviewData, media: reviewData.media || [] });
      setEditingReview(null);
    }
  };

  const handleConfirmDelete = () => {
    if (deletingReview) {
      onDeleteReview(deletingReview);
      setDeletingReview(null);
    }
  };


  const getMarkerTitle = () => {
    if (!marker) return '';
    return marker.name || "Отзывы о месте";
  }

  const getMarkerDescription = () => {
     if (reviews.length > 0) {
         return "Посмотрите, что говорят другие, и добавьте свой отзыв.";
     }
     return "Об этом месте еще нет отзывов. Будьте первым!";
  }

  return (
    <>
    <Dialog open={isOpen} onOpenChange={(open) => {
        if (!open) {
            setEditingReview(null);
        }
        onOpenChange(open);
    }}>
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
                  onEdit={() => setEditingReview(review)} 
                  onDelete={() => setDeletingReview(review)} 
                />
              ))
            ) : (
              !editingReview && (
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
              isEditing={!!editingReview}
              initialData={editingReview || undefined}
              onFormSubmit={editingReview ? handleEditSubmit : handleAddSubmit}
              onCancelEdit={() => setEditingReview(null)}
              isOpen={true} 
              onOpenChange={()=>{}} 
            />
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
