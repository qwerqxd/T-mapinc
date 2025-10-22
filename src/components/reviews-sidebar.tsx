
'use client';

import { useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import ReviewCard from './review-card';
import type { Review, MarkerData } from '@/lib/types';
import { Search } from 'lucide-react';
import { Timestamp } from 'firebase/firestore';

interface ReviewsSidebarProps {
  reviews: Review[];
  markers: MarkerData[];
  onReviewSelect: (markerId: string) => void;
  onEditReview: (review: Review) => void;
  onDeleteReview: (review: Review) => void;
}

const sortOptions = {
  'most recent': 'Сначала новые',
  'highest rated': 'Сначала с высокой оценкой',
  'lowest rated': 'Сначала с низкой оценкой',
};

export default function ReviewsSidebar({
  reviews,
  markers,
  onReviewSelect,
  onEditReview,
  onDeleteReview,
}: ReviewsSidebarProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('most recent');
  
  const getReviewTimestamp = (createdAt: Review['createdAt']): number => {
    if (!createdAt) return 0;
    if (createdAt instanceof Timestamp) {
      return createdAt.toMillis();
    }
    if (typeof createdAt === 'string') {
      return new Date(createdAt).getTime();
    }
    if (createdAt instanceof Date) {
      return createdAt.getTime();
    }
    return 0;
  };


  const filteredReviews = useMemo(() => {
    let filtered = reviews.filter((review) => {
      if (!review) return false;
        const searchText = searchTerm.toLowerCase();
        
        const inReview = 
          (review.text && review.text.toLowerCase().includes(searchText)) || 
          (review.authorName && review.authorName.toLowerCase().includes(searchText));
  
        return inReview;
    });

    return filtered.sort((a, b) => {
      switch (sortOption) {
        case 'highest rated':
          return b.rating - a.rating;
        case 'lowest rated':
          return a.rating - b.rating;
        case 'most recent':
        default:
          return getReviewTimestamp(b.createdAt) - getReviewTimestamp(a.createdAt);
      }
    });
  }, [reviews, searchTerm, sortOption]);

  return (
    <aside className="flex h-full flex-col border-r bg-card">
      <div className="p-4 space-y-4 border-b">
        <h2 className="text-2xl font-bold">Все отзывы</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Поиск отзывов..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Select value={sortOption} onValueChange={setSortOption}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Сортировать по..." />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(sortOptions).map(([value, label]) => (
                <SelectItem
                  key={value}
                  value={value}
                  className="capitalize"
                >
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {filteredReviews.length > 0 ? (
            filteredReviews.map((review) => (
              <div
                key={review.id}
                onClick={() => onReviewSelect(review.markerId)}
                className="cursor-pointer"
              >
                <ReviewCard 
                  review={review}
                  onEdit={onEditReview}
                  onDelete={onDeleteReview}
                />
              </div>
            ))
          ) : (
            <p className="text-center text-sm text-muted-foreground pt-10">
              Отзывов не найдено.
            </p>
          )}
        </div>
      </ScrollArea>
    </aside>
  );
}
