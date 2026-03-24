import { useState, useRef, useEffect } from 'react';
import AppHeader from '@/components/AppHeader';
import MobileBottomNav from '@/components/MobileBottomNav';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Heart, MessageCircle, Send, Image as ImageIcon, Search,
  UserPlus, Check, X, ChevronDown, ChevronUp, TrendingUp,
  TrendingDown, Minus, ArrowLeft, MoreVertical, Pencil, Trash2
} from 'lucide-react';
import { useCommunity, CommunityComment } from '@/hooks/useCommunity';
import { useFriends } from '@/hooks/useFriends';
import { useDirectMessages } from '@/hooks/useDirectMessages';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { formatDistanceToNow } from 'date-fns';

// ─── Feed Tab ───
function FeedTab() {
  const { posts, loading, createPost, toggleLike, fetchComments, addComment } = useCommunity();
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [postType, setPostType] = useState<'general' | 'strategy'>('general');
  const [assetSymbol, setAssetSymbol] = useState('');
  const [signal, setSignal] = useState('');
  const [posting, setPosting] = useState(false);
  const [expandedComments, setExpandedComments] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, CommunityComment[]>>({});
  const [commentText, setCommentText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePost = async () => {
    if (!content.trim()) return;
    setPosting(true);
    await createPost(content, imageFile, postType, assetSymbol || undefined, signal || undefined);
    setContent('');
    setImageFile(null);
    setAssetSymbol('');
    setSignal('');
    setPostType('general');
    setPosting(false);
  };

  const handleExpandComments = async (postId: string) => {
    if (expandedComments === postId) {
      setExpandedComments(null);
      return;
    }
    setExpandedComments(postId);
    const data = await fetchComments(postId);
    setComments(prev => ({ ...prev, [postId]: data }));
  };

  const handleAddComment = async (postId: string) => {
    if (!commentText.trim()) return;
    await addComment(postId, commentText);
    setCommentText('');
    const data = await fetchComments(postId);
    setComments(prev => ({ ...prev, [postId]: data }));
  };

  const signalIcon = (s: string | null) => {
    if (s === 'BUY') return <TrendingUp className="w-3 h-3" />;
    if (s === 'SELL') return <TrendingDown className="w-3 h-3" />;
    return <Minus className="w-3 h-3" />;
  };

  const signalColor = (s: string | null) => {
    if (s === 'BUY') return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    if (s === 'SELL') return 'bg-red-500/20 text-red-400 border-red-500/30';
    return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
  };

  return (
    <div className="space-y-4">
      {/* Create Post */}
      <Card className="border-border/50">
        <CardContent className="p-4 space-y-3">
          <Textarea
            placeholder="Share your strategy or thoughts..."
            value={content}
            onChange={e => setContent(e.target.value)}
            className="min-h-[80px] resize-none"
          />
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPostType(postType === 'general' ? 'strategy' : 'general')}
              className="text-xs"
            >
              {postType === 'strategy' ? '📊 Strategy' : '💬 General'}
            </Button>
            {postType === 'strategy' && (
              <>
                <Input
                  placeholder="Asset (e.g. BTC)"
                  value={assetSymbol}
                  onChange={e => setAssetSymbol(e.target.value.toUpperCase())}
                  className="w-28 h-8 text-xs"
                />
                <select
                  value={signal}
                  onChange={e => setSignal(e.target.value)}
                  className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                >
                  <option value="">Signal</option>
                  <option value="BUY">BUY</option>
                  <option value="SELL">SELL</option>
                  <option value="HOLD">HOLD</option>
                </select>
              </>
            )}
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              className="hidden"
              onChange={e => setImageFile(e.target.files?.[0] || null)}
            />
            <Button variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()}>
              <ImageIcon className="w-4 h-4" />
            </Button>
            {imageFile && (
              <span className="text-xs text-muted-foreground truncate max-w-[120px]">{imageFile.name}</span>
            )}
            <div className="ml-auto">
              <Button size="sm" onClick={handlePost} disabled={posting || !content.trim()}>
                <Send className="w-3.5 h-3.5 mr-1" />
                Post
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Posts Feed */}
      {loading ? (
        <div className="text-center text-muted-foreground py-8">Loading posts...</div>
      ) : posts.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">No posts yet. Be the first!</div>
      ) : (
        posts.map(post => (
          <Card key={post.id} className="border-border/50">
            <CardContent className="p-4 space-y-3">
              {/* Header */}
              <div className="flex items-center gap-2">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="text-xs bg-primary/20 text-primary">
                    {post.user_name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{post.user_name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                  </p>
                </div>
                {post.post_type === 'strategy' && post.signal && (
                  <Badge variant="outline" className={cn('text-[10px] gap-1', signalColor(post.signal))}>
                    {signalIcon(post.signal)}
                    {post.signal}
                    {post.asset_symbol && ` · ${post.asset_symbol}`}
                  </Badge>
                )}
              </div>

              {/* Content */}
              <p className="text-sm whitespace-pre-wrap">{post.content}</p>

              {/* Image */}
              {post.image_url && (
                <img
                  src={post.image_url}
                  alt="Post"
                  className="w-full max-h-80 object-cover rounded-lg"
                  loading="lazy"
                />
              )}

              {/* Actions */}
              <div className="flex items-center gap-4 pt-1">
                <button
                  onClick={() => toggleLike(post.id)}
                  className={cn(
                    'flex items-center gap-1 text-xs transition-colors',
                    post.liked_by_me ? 'text-red-400' : 'text-muted-foreground hover:text-red-400'
                  )}
                >
                  <Heart className={cn('w-4 h-4', post.liked_by_me && 'fill-current')} />
                  {post.likes_count}
                </button>
                <button
                  onClick={() => handleExpandComments(post.id)}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  {post.comments_count}
                  {expandedComments === post.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              </div>

              {/* Comments Section */}
              {expandedComments === post.id && (
                <div className="border-t border-border/50 pt-3 space-y-2">
                  {(comments[post.id] || []).map(c => (
                    <div key={c.id} className="flex gap-2">
                      <Avatar className="w-6 h-6">
                        <AvatarFallback className="text-[8px] bg-muted">
                          {c.user_name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-xs">
                          <span className="font-medium">{c.user_name}</span>{' '}
                          <span className="text-muted-foreground">
                            · {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                          </span>
                        </p>
                        <p className="text-xs mt-0.5">{c.content}</p>
                      </div>
                    </div>
                  ))}
                  <div className="flex gap-2 pt-1">
                    <Input
                      placeholder="Write a comment..."
                      value={commentText}
                      onChange={e => setCommentText(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAddComment(post.id)}
                      className="h-8 text-xs"
                    />
                    <Button size="sm" variant="ghost" onClick={() => handleAddComment(post.id)}>
                      <Send className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}

// ─── Friends Tab ───
function FriendsTab() {
  const { friends, pending, loading, searchUsers, sendRequest, acceptRequest, rejectRequest } = useFriends();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ user_id: string; name: string | null; email: string | null }[]>([]);
  const [searching, setSearching] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    const results = await searchUsers(searchQuery);
    setSearchResults(results);
    setSearching(false);
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <Card className="border-border/50">
        <CardContent className="p-4">
          <div className="flex gap-2">
            <Input
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              className="h-9"
            />
            <Button size="sm" onClick={handleSearch} disabled={searching}>
              <Search className="w-4 h-4" />
            </Button>
          </div>
          {searchResults.length > 0 && (
            <div className="mt-3 space-y-2">
              {searchResults.map(u => (
                <div key={u.user_id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                  <div>
                    <p className="text-sm font-medium">{u.name || 'User'}</p>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => sendRequest(u.user_id)}>
                    <UserPlus className="w-3.5 h-3.5 mr-1" />
                    Add
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending Requests */}
      {pending.filter(f => f.addressee_id === user?.id).length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-2 text-muted-foreground">Pending Requests</h3>
          {pending
            .filter(f => f.addressee_id === user?.id)
            .map(f => (
              <Card key={f.id} className="border-border/50 mb-2">
                <CardContent className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="text-xs bg-primary/20 text-primary">
                        {(f.friend_name || 'U').slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{f.friend_name}</p>
                      <p className="text-xs text-muted-foreground">{f.friend_email}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" className="h-7 w-7 p-0" onClick={() => acceptRequest(f.id)}>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 w-7 p-0" onClick={() => rejectRequest(f.id)}>
                      <X className="w-3.5 h-3.5 text-red-400" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      )}

      {/* Friends List */}
      <div>
        <h3 className="text-sm font-semibold mb-2 text-muted-foreground">Friends ({friends.length})</h3>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : friends.length === 0 ? (
          <p className="text-sm text-muted-foreground">No friends yet. Search and add some!</p>
        ) : (
          friends.map(f => (
            <Card key={f.id} className="border-border/50 mb-2">
              <CardContent className="p-3 flex items-center gap-2">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="text-xs bg-primary/20 text-primary">
                    {(f.friend_name || 'U').slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{f.friend_name}</p>
                  <p className="text-xs text-muted-foreground">{f.friend_email}</p>
                </div>
                <Badge variant="outline" className="ml-auto text-[10px] text-emerald-400 border-emerald-500/30">
                  Friends
                </Badge>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Messages Tab ───
function MessagesTab() {
  const { friends } = useFriends();
  const { user } = useAuth();
  const [activeFriend, setActiveFriend] = useState<{ id: string; name: string } | null>(null);
  const { conversations, messages, loading, fetchConversations, sendMessage } = useDirectMessages(activeFriend?.id);
  const [msgText, setMsgText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (friends.length > 0 && user) {
      const friendsList = friends.map(f => ({
        friendId: f.requester_id === user.id ? f.addressee_id : f.requester_id,
        friendName: f.friend_name || 'User',
      }));
      fetchConversations(friendsList);
    }
  }, [friends, user, fetchConversations]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!activeFriend || !msgText.trim()) return;
    await sendMessage(activeFriend.id, msgText);
    setMsgText('');
  };

  if (activeFriend) {
    return (
      <div className="flex flex-col h-[calc(100vh-220px)]">
        {/* Chat Header */}
        <div className="flex items-center gap-2 pb-3 border-b border-border/50">
          <Button variant="ghost" size="sm" onClick={() => setActiveFriend(null)}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <Avatar className="w-8 h-8">
            <AvatarFallback className="text-xs bg-primary/20 text-primary">
              {activeFriend.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <p className="text-sm font-medium">{activeFriend.name}</p>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 py-3" ref={scrollRef}>
          <div className="space-y-2">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={cn(
                  'max-w-[75%] p-2.5 rounded-xl text-xs',
                  msg.sender_id === user?.id
                    ? 'ml-auto bg-primary text-primary-foreground rounded-br-sm'
                    : 'bg-muted rounded-bl-sm'
                )}
              >
                {msg.content}
                <p className={cn(
                  'text-[9px] mt-1',
                  msg.sender_id === user?.id ? 'text-primary-foreground/60' : 'text-muted-foreground'
                )}>
                  {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                </p>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="flex gap-2 pt-3 border-t border-border/50">
          <Input
            placeholder="Type a message..."
            value={msgText}
            onChange={e => setMsgText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            className="h-9"
          />
          <Button size="sm" onClick={handleSend}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {conversations.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          Add friends to start messaging!
        </p>
      ) : (
        conversations.map(c => (
          <Card
            key={c.friendId}
            className="border-border/50 cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => setActiveFriend({ id: c.friendId, name: c.friendName })}
          >
            <CardContent className="p-3 flex items-center gap-3">
              <Avatar className="w-10 h-10">
                <AvatarFallback className="text-xs bg-primary/20 text-primary">
                  {c.friendName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{c.friendName}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {c.lastMessage || 'No messages yet'}
                </p>
              </div>
              {c.unreadCount > 0 && (
                <Badge className="bg-primary text-primary-foreground text-[10px] px-1.5 min-w-[20px] flex justify-center">
                  {c.unreadCount}
                </Badge>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}

// ─── Main Community Page ───
export default function Community() {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader activePage="community" />
      <main className="pt-16 pb-24 lg:pb-8 px-4 max-w-2xl mx-auto">
        <div className="py-4">
          <h1 className="text-xl font-bold">Community</h1>
          <p className="text-sm text-muted-foreground">Share strategies, connect with traders</p>
        </div>

        <Tabs defaultValue="feed" className="w-full">
          <TabsList className="w-full grid grid-cols-3 mb-4">
            <TabsTrigger value="feed">Feed</TabsTrigger>
            <TabsTrigger value="friends">Friends</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
          </TabsList>

          <TabsContent value="feed">
            <FeedTab />
          </TabsContent>
          <TabsContent value="friends">
            <FriendsTab />
          </TabsContent>
          <TabsContent value="messages">
            <MessagesTab />
          </TabsContent>
        </Tabs>
      </main>
      <MobileBottomNav />
    </div>
  );
}
