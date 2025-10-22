'use client';

import { useAuth } from '@/contexts/auth-context';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useFirestore } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { User } from '@/lib/types';
import { AlertTriangle, Shield, User as UserIcon, Loader2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { updateUserRole } from '@/ai/flows/update-user-role-flow';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminUsersPage() {
  const { user: currentUser, isLoading: authLoading } = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  // Only fetch users if the current user is confirmed to be an admin.
  const { data: users, loading: usersLoading } = useCollection<User>(
    isReady && firestore ? collection(firestore, 'users') : null
  );

  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading) {
      if (currentUser?.role !== 'admin') {
        router.push('/');
      } else {
        setIsReady(true);
      }
    }
  }, [currentUser, authLoading, router]);

  const handleRoleChange = async (targetUser: User, newRole: 'admin' | 'user') => {
    if (!currentUser || currentUser.uid === targetUser.uid) {
      toast({
        title: 'Действие запрещено',
        description: 'Вы не можете изменить свою собственную роль.',
        variant: 'destructive',
      });
      return;
    }
    
    setUpdatingUserId(targetUser.uid);
    try {
      await updateUserRole({
        editorId: currentUser.uid,
        targetUserId: targetUser.uid,
        newRole,
      });
      toast({
        title: 'Успех',
        description: `Роль пользователя ${targetUser.name} изменена на ${newRole}.`,
      });
    } catch (error: any) {
      console.error('Failed to update user role:', error);
      toast({
        title: 'Ошибка',
        description: error.message || 'Не удалось обновить роль пользователя.',
        variant: 'destructive',
      });
    } finally {
      setUpdatingUserId(null);
    }
  };

  if (!isReady || usersLoading || authLoading) {
    return (
      <div className="container mx-auto py-10">
        <h1 className="text-3xl font-bold mb-6">Управление пользователями</h1>
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );
  }

  if (currentUser?.role !== 'admin') {
    return (
      <div className="container mx-auto py-10 flex justify-center">
        <Alert variant="destructive" className="max-w-lg">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Доступ запрещен</AlertTitle>
          <AlertDescription>
            У вас нет прав для просмотра этой страницы.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const getCreationDate = (date: any) => {
    if (!date) return 'N/A';
    let dateObj: Date;
    if (typeof date === 'string') {
      dateObj = new Date(date);
    } else if (date.toDate) { // Firebase Timestamp
      dateObj = date.toDate();
    } else {
      dateObj = date;
    }
    return format(dateObj, 'dd MMMM yyyy, HH:mm', { locale: ru });
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Управление пользователями</h1>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Пользователь</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Дата регистрации</TableHead>
              <TableHead>Роль</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users && users.map((user) => (
              <TableRow key={user.uid}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={user.avatarUrl ?? undefined} alt={user.name ?? ''} />
                      <AvatarFallback>{user.name?.charAt(0) ?? 'U'}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{user.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{user.email}</TableCell>
                <TableCell className="text-muted-foreground">{getCreationDate(user.createdAt)}</TableCell>
                <TableCell>
                  {updatingUserId === user.uid ? (
                    <div className="flex items-center justify-center w-[120px]">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : currentUser?.uid === user.uid ? (
                     <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className="capitalize">
                        {user.role === 'admin' ? <Shield className="mr-2 h-3.5 w-3.5" /> : <UserIcon className="mr-2 h-3.5 w-3.5" />}
                        {user.role}
                    </Badge>
                  ) : (
                    <Select
                      value={user.role}
                      onValueChange={(newRole: 'admin' | 'user') => handleRoleChange(user, newRole)}
                      disabled={!!updatingUserId}
                    >
                      <SelectTrigger className="w-[120px]">
                        <SelectValue placeholder="Роль" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
