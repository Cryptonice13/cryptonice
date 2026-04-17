import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useFriends } from '@/hooks/useFriends';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { UserPlus, MessageCircle, Check, X, Clock, User as UserIcon } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface UserProfileSheetProps {
  userId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMessage: (friendId: string, name: string) => void;
}

interface ProfileSnapshot {
  user_name: string;
  user_avatar: string | null;
  postCount: number;
  recentPosts: Array<{
    id: string;
    content: string;
    created_at: string;
    signal: string | null;
    asset_symbol: string | null;
  }>;
}

export function UserProfileSheet({ userId, open, onOpenChange, onMessage }: UserProfileSheetProps) {
  const { user } = useAuth();
  const { friends, pending, sendRequest, acceptRequest, rejectRequest } = useFriends();
  const [snapshot, setSnapshot] = useState<ProfileSnapshot | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId || !open) return;
    let cancelled = false;
    setLoading(true);
    setSnapshot(null);

    (async () => {
      // Pull most recent post for name/avatar (denormalized & publicly readable)
      const { data: latest } = await supabase
        .from('community_posts')
        .select('user_name, user_avatar')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const { count } = await supabase
        .from('community_posts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      const { data: recent } = await supabase
        .from('community_posts')
        .select('id, content, created_at, signal, asset_symbol')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(3);

      if (cancelled) return;

      setSnapshot({
        user_name: latest?.user_name || 'User',
        user_avatar: latest?.user_avatar || null,
        postCount: count || 0,
        recentPosts: recent || [],
      });
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [userId, open]);

  // Derive relationship state
  const isSelf = userId && user?.id === userId;
  const friendship = userId
    ? [...friends, ...pending].find(
        f =>
          (f.requester_id === user?.id && f.addressee_id === userId) ||
          (f.addressee_id === user?.id && f.requester_id === userId)
      )
    : undefined;

  const isFriend = friendship?.status === 'accepted';
  const isPendingSentByMe =
    friendship?.status === 'pending' && friendship.requester_id === user?.id;
  const isPendingReceivedByMe =
    friendship?.status === 'pending' && friendship.addressee_id === user?.id;
  const noRelation = !friendship;

  const displayName = snapshot?.user_name || 'User';
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="text-left">
          <SheetTitle className="sr-only">User Profile</SheetTitle>
          <SheetDescription className="sr-only">
            View user information and connect with them.
          </SheetDescription>
        </SheetHeader>

        {loading || !snapshot ? (
          <div className="space-y-4 mt-4">
            <div className="flex items-center gap-3">
              <Skeleton className="w-16 h-16 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <div className="space-y-5 mt-4">
            {/* Header */}
            <div className="flex items-center gap-4">
              <Avatar className="w-16 h-16 ring-2 ring-primary/20">
                {snapshot.user_avatar && <AvatarImage src={snapshot.user_avatar} alt={displayName} />}
                <AvatarFallback className="text-lg bg-primary/20 text-primary font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <h3 className="text-lg font-semibold truncate">{displayName}</h3>
                {isFriend && (
                  <Badge variant="outline" className="text-[10px] text-emerald-400 border-emerald-500/30 mt-1">
                    Friends
                  </Badge>
                )}
                {isPendingSentByMe && (
                  <Badge variant="outline" className="text-[10px] text-yellow-400 border-yellow-500/30 mt-1">
                    Request sent
                  </Badge>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              <Card className="border-border/50">
                <CardContent className="p-3 text-center">
                  <p className="text-2xl font-bold">{snapshot.postCount}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Posts</p>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardContent className="p-3 text-center">
                  <p className="text-2xl font-bold">
                    {isFriend ? <span className="text-emerald-400">●</span> : '—'}
                  </p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                    {isFriend ? 'Connected' : 'Not connected'}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              {isSelf && (
                <div className="flex items-center justify-center gap-2 p-3 bg-muted/50 rounded-lg">
                  <UserIcon className="w-4 h-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">This is you</p>
                </div>
              )}

              {!isSelf && noRelation && (
                <Button
                  className="w-full"
                  onClick={() => userId && sendRequest(userId)}
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Friend
                </Button>
              )}

              {!isSelf && isPendingSentByMe && (
                <Button className="w-full" variant="outline" disabled>
                  <Clock className="w-4 h-4 mr-2" />
                  Request Sent
                </Button>
              )}

              {!isSelf && isPendingReceivedByMe && friendship && (
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="default"
                    onClick={() => acceptRequest(friendship.id)}
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Accept
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => rejectRequest(friendship.id)}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Reject
                  </Button>
                </div>
              )}

              {!isSelf && isFriend && userId && (
                <Button
                  className="w-full"
                  onClick={() => onMessage(userId, displayName)}
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Message
                </Button>
              )}
            </div>

            {/* Recent Posts */}
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Recent Posts
              </h4>
              {snapshot.recentPosts.length === 0 ? (
                <p className="text-sm text-muted-foreground py-3 text-center">No posts yet</p>
              ) : (
                <div className="space-y-2">
                  {snapshot.recentPosts.map(p => (
                    <Card key={p.id} className="border-border/50">
                      <CardContent className="p-3 space-y-1">
                        <p className="text-sm line-clamp-2 whitespace-pre-wrap">{p.content}</p>
                        <div className="flex items-center gap-2">
                          <p className="text-[10px] text-muted-foreground">
                            {formatDistanceToNow(new Date(p.created_at), { addSuffix: true })}
                          </p>
                          {p.signal && (
                            <Badge variant="outline" className="text-[9px] h-4 px-1">
                              {p.signal}
                              {p.asset_symbol && ` · ${p.asset_symbol}`}
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
