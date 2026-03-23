

## Plan: Crypto Trader Community Page

### Overview
Add a social community page where users can post strategies with images, like/comment on posts, add friends, and chat with friends.

### Database Changes

**1. Storage bucket**: `community-images` (public) for post image uploads

**2. New tables**:

| Table | Purpose | Key Columns |
|---|---|---|
| `community_posts` | User posts | `id`, `user_id`, `content`, `image_url`, `post_type` (strategy/general), `asset_symbol`, `signal` (BUY/SELL/HOLD), `likes_count`, `comments_count`, `created_at` |
| `community_likes` | Post likes | `id`, `user_id`, `post_id` (FK → community_posts), unique(user_id, post_id) |
| `community_comments` | Post comments | `id`, `user_id`, `post_id` (FK → community_posts), `content`, `created_at` |
| `friendships` | Friend connections | `id`, `requester_id`, `addressee_id`, `status` (pending/accepted/rejected), unique(requester_id, addressee_id) |
| `direct_messages` | Friend-to-friend chat | `id`, `sender_id`, `receiver_id`, `content`, `is_read`, `created_at` |

All tables have RLS policies scoped to authenticated users. Posts/comments/likes readable by all authenticated users; insert/delete own only. Friendships: both parties can view; requester can insert; addressee can update status. DMs: sender/receiver can view; sender can insert.

**3. Storage RLS**: Authenticated users can upload to `community-images`; public read access.

### New Files

**`src/pages/Community.tsx`**
- Main community page with tabs: **Feed**, **Friends**, **Messages**
- **Feed tab**: Create post form (text + optional image upload + optional strategy tag), scrollable post feed with like/comment buttons, inline comment thread
- **Friends tab**: Search users by email/name, send friend request, list pending/accepted friends
- **Messages tab**: List of friend conversations, click to open chat thread with real-time messages

**`src/hooks/useCommunity.ts`**
- Hook managing posts CRUD, likes toggle, comments, image upload to storage bucket
- Functions: `createPost`, `fetchPosts`, `toggleLike`, `addComment`, `fetchComments`

**`src/hooks/useFriends.ts`**
- Hook for friend requests: `sendRequest`, `acceptRequest`, `rejectRequest`, `fetchFriends`, `searchUsers`

**`src/hooks/useDirectMessages.ts`**
- Hook for DMs: `sendMessage`, `fetchConversations`, `fetchMessages`, real-time subscription via Supabase channel

### Modified Files

**`src/App.tsx`**
- Add route `/community` → `<Community />` (protected)

**`src/components/AppHeader.tsx`**
- Add "Community" to `navItems` array with `Users` icon and path `/community`
- Update `activePage` type to include `'community'`

**`src/components/MobileBottomNav.tsx`**
- Add Community nav item with `Users` icon

### UI Design
- Post card: avatar, name, timestamp, content, optional image, strategy badge (BUY/SELL/HOLD), like button with count, comment button with count, expandable comment section
- Create post: textarea + image upload button + optional asset/signal selector
- Friend list: avatar + name + status badge + accept/reject buttons for pending
- Chat: simple message bubbles (left/right), input at bottom, auto-scroll

### Migration Summary
1. Create `community-images` storage bucket
2. Create 5 tables with RLS policies
3. Create storage RLS policies for upload/read

